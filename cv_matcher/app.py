"""
Point d'entrée de l'application de matching CV.
"""
import os
import logging
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import uvicorn
from pydantic import BaseModel

from core.extractor import CVExtractor
from core.processor import TextProcessor
from core.encoder import TextEncoder
from core.matcher import CVMatcher
from core.summarizer import MatchSummarizer
from utils.ner import EntityExtractor
from config import CV_UPLOAD_DIR, API_HOST, API_PORT, DEBUG_MODE

# Configuration du logging
logging.basicConfig(
    level=logging.INFO if not DEBUG_MODE else logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Création de l'application FastAPI
app = FastAPI(
    title="RecruitPME - API de Matching CV",
    description="API pour l'analyse et le matching de CV avec des offres d'emploi",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À restreindre en production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialisation des composants
text_processor = TextProcessor()
text_encoder = TextEncoder()
entity_extractor = EntityExtractor()
match_summarizer = MatchSummarizer(entity_extractor)

# Modèles de données
class JobOffer(BaseModel):
    title: str
    description: str
    skills: Optional[List[str]] = None
    experience_level: Optional[str] = None
    
class MatchResult(BaseModel):
    filename: str
    score: int
    summary: str
    skills: List[str]
    experience_years: Optional[int] = None
    experience_level: str
    matched_skills: List[str]
    missing_skills: List[str]

class MatchResponse(BaseModel):
    results: List[MatchResult]
    
# Vérifier que le répertoire d'upload existe
os.makedirs(CV_UPLOAD_DIR, exist_ok=True)

@app.post("/api/match/", response_model=MatchResponse)
async def match_cvs_with_job(
    job_offer: JobOffer,
    files: Optional[List[UploadFile]] = File(None),
    cv_directory: Optional[str] = Form(None)
):
    """
    Analyse et classe les CVs selon leur pertinence pour une offre d'emploi.
    
    Args:
        job_offer: L'offre d'emploi à utiliser pour le matching
        files: Liste de fichiers CV à analyser (facultatif)
        cv_directory: Répertoire contenant les CVs à analyser (facultatif)
        
    Returns:
        MatchResponse: Résultat du matching
    """
    if not files and not cv_directory:
        raise HTTPException(
            status_code=400,
            detail="Vous devez fournir soit des fichiers, soit un répertoire de CVs"
        )
        
    logger.info(f"Analyse d'une offre: {job_offer.title}")
    
    # 1. Préparation de l'offre d'emploi
    job_text = f"{job_offer.title}\n{job_offer.description}"
    if job_offer.skills:
        job_text += "\nCompétences requises: " + ", ".join(job_offer.skills)
    if job_offer.experience_level:
        job_text += f"\nNiveau d'expérience: {job_offer.experience_level}"
        
    # 2. Traitement et encodage de l'offre
    processed_job_text = text_processor.clean_job_text(job_text)
    job_embedding = text_encoder.encode_chunks(processed_job_text)
    
    # 3. Traitement des CVs
    cv_texts = {}
    cv_embeddings = {}
    
    # 3.1 Si des fichiers sont fournis
    if files:
        for file in files:
            # Sauvegarder le fichier
            file_path = os.path.join(CV_UPLOAD_DIR, file.filename)
            with open(file_path, "wb") as f:
                f.write(await file.read())
                
            # Extraire le texte
            cv_text = CVExtractor.extract_from_pdf(file_path)
            if cv_text:
                cv_texts[file.filename] = cv_text
                # Traiter et encoder le CV
                processed_cv_text = text_processor.clean_cv_text(cv_text)
                cv_embeddings[file.filename] = text_encoder.encode_chunks(processed_cv_text)
    
    # 3.2 Si un répertoire est fourni
    if cv_directory:
        if not os.path.isdir(cv_directory):
            cv_directory = os.path.join(CV_UPLOAD_DIR, cv_directory)
            
        if not os.path.isdir(cv_directory):
            raise HTTPException(
                status_code=400,
                detail=f"Le répertoire {cv_directory} n'existe pas"
            )
            
        extracted_texts = CVExtractor.extract_all_from_directory(cv_directory)
        for filename, cv_text in extracted_texts.items():
            cv_texts[filename] = cv_text
            # Traiter et encoder le CV
            processed_cv_text = text_processor.clean_cv_text(cv_text)
            cv_embeddings[filename] = text_encoder.encode_chunks(processed_cv_text)
            
    # 4. Calcul des scores de matching
    if not cv_embeddings:
        raise HTTPException(
            status_code=404,
            detail="Aucun CV valide n'a pu être extrait"
        )
        
    # Calculer les similarités et scores
    match_results = CVMatcher.rank_candidates(cv_embeddings, job_embedding)
    
    # 5. Génération des résumés et détails
    final_results = []
    
    for result in match_results:
        filename = result['filename']
        similarity = result['similarity']
        score = result['score']
        
        # Analyser le CV pour le résumé
        cv_text = cv_texts[filename]
        summary = match_summarizer.generate_summary(
            cv_text, 
            job_text, 
            similarity, 
            score
        )
        
        # Créer le résultat final
        final_results.append(
            MatchResult(
                filename=filename,
                score=score,
                summary=summary["text"],
                skills=summary["matched_skills"] + summary["missing_skills"],
                experience_years=summary["experience_years"],
                experience_level=summary["experience_level"],
                matched_skills=summary["matched_skills"],
                missing_skills=summary["missing_skills"]
            )
        )
    
    return MatchResponse(results=final_results)

@app.post("/api/analyze_cv/")
async def analyze_single_cv(
    file: UploadFile = File(...),
):
    """
    Analyse un seul CV sans matching avec une offre.
    
    Args:
        file: Fichier CV à analyser
        
    Returns:
        dict: Résultat de l'analyse
    """
    # Sauvegarder le fichier
    file_path = os.path.join(CV_UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())
        
    # Extraire le texte
    cv_text = CVExtractor.extract_from_pdf(file_path)
    if not cv_text:
        raise HTTPException(
            status_code=400,
            detail="Impossible d'extraire le texte du CV"
        )
        
    # Analyser le CV
    analysis = entity_extractor.analyze_cv(cv_text)
    
    return {
        "filename": file.filename,
        "skills": analysis["skills"],
        "experience_years": analysis["experience_years"],
        "experience_level": analysis["experience_level"],
        "education": analysis["education"]
    }

@app.post("/api/analyze_job/")
async def analyze_job_offer(
    job_offer: JobOffer,
):
    """
    Analyse une offre d'emploi.
    
    Args:
        job_offer: L'offre d'emploi à analyser
        
    Returns:
        dict: Résultat de l'analyse
    """
    # Préparation du texte complet de l'offre
    job_text = f"{job_offer.title}\n{job_offer.description}"
    if job_offer.skills:
        job_text += "\nCompétences requises: " + ", ".join(job_offer.skills)
    if job_offer.experience_level:
        job_text += f"\nNiveau d'expérience: {job_offer.experience_level}"
        
    # Extraction des compétences requises
    skills = entity_extractor.extract_skills(job_text)
    
    # Extraction de l'expérience requise
    experience_years = entity_extractor.extract_experience_years(job_text)
    
    return {
        "title": job_offer.title,
        "skills": skills,
        "experience_years": experience_years,
        "provided_skills": job_offer.skills or []
    }

if __name__ == "__main__":
    logger.info(f"Démarrage de l'API sur http://{API_HOST}:{API_PORT}")
    uvicorn.run("app:app", host=API_HOST, port=API_PORT, reload=DEBUG_MODE)