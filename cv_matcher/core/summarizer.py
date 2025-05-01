"""
Module pour générer des résumés explicatifs sur le matching.
"""
import logging
from utils.ner import EntityExtractor
from config import SPACY_MODEL

logger = logging.getLogger(__name__)

class MatchSummarizer:
    """Classe pour générer des résumés explicatifs du matching entre CV et offre."""
    
    def __init__(self, entity_extractor=None):
        """
        Initialise le générateur de résumés.
        
        Args:
            entity_extractor (EntityExtractor, optional): Extracteur d'entités à utiliser
        """
        self.entity_extractor = entity_extractor or EntityExtractor(SPACY_MODEL)
        
    def generate_summary(self, cv_text, job_text, similarity_score, matching_score):
        """
        Génère un résumé explicatif du matching entre un CV et une offre d'emploi.
        
        Args:
            cv_text (str): Texte du CV
            job_text (str): Texte de l'offre d'emploi
            similarity_score (float): Score de similarité brut (0-1)
            matching_score (int): Score de matching (0-100)
            
        Returns:
            dict: Résumé du matching avec les explications
        """
        # Analyser le CV pour extraire les informations clés
        cv_analysis = self.entity_extractor.analyze_cv(cv_text)
        
        # Extraire les compétences requises de l'offre
        job_skills = self.entity_extractor.extract_skills(job_text)
        
        # Calculer les compétences communes
        matched_skills = [skill for skill in cv_analysis["skills"] if skill in job_skills]
        
        # Calculer le pourcentage de compétences correspondantes
        skill_match_percentage = 0
        if job_skills:
            skill_match_percentage = int((len(matched_skills) / len(job_skills)) * 100)
            
        # Construire un résumé textuel
        summary_text = self._build_summary_text(
            cv_analysis["experience_years"],
            cv_analysis["experience_level"],
            matched_skills,
            len(job_skills),
            skill_match_percentage,
            matching_score
        )
        
        # Construire le résumé complet
        summary = {
            "text": summary_text,
            "matching_score": matching_score,
            "skill_match_percentage": skill_match_percentage,
            "matched_skills": matched_skills,
            "missing_skills": [skill for skill in job_skills if skill not in cv_analysis["skills"]],
            "experience_years": cv_analysis["experience_years"],
            "experience_level": cv_analysis["experience_level"],
            "education": cv_analysis["education"] if cv_analysis["education"] else []
        }
        
        return summary
    
    def _build_summary_text(self, experience_years, experience_level, matched_skills, 
                           total_job_skills, skill_match_percentage, matching_score):
        """
        Construit un texte de résumé explicatif.
        
        Args:
            experience_years (int): Années d'expérience
            experience_level (str): Niveau d'expérience
            matched_skills (list): Compétences correspondantes
            total_job_skills (int): Nombre total de compétences requises
            skill_match_percentage (int): Pourcentage de compétences correspondantes
            matching_score (int): Score de matching global
            
        Returns:
            str: Texte de résumé
        """
        # Commencer par le niveau d'expérience
        if experience_years:
            summary = f"Profil {experience_level} avec {experience_years} ans d'expérience"
        else:
            summary = f"Profil {experience_level}"
            
        # Ajouter les informations sur les compétences
        if matched_skills:
            if len(matched_skills) > 3:
                skills_str = ", ".join(matched_skills[:3]) + f" et {len(matched_skills)-3} autres"
            else:
                skills_str = ", ".join(matched_skills)
                
            summary += f", maîtrisant {skills_str}"
            
        # Ajouter le pourcentage de correspondance
        if total_job_skills > 0:
            summary += f". Correspond à {skill_match_percentage}% des compétences requises"
            
        # Évaluation globale basée sur le score de matching
        if matching_score >= 80:
            summary += ". Excellent candidat pour ce poste."
        elif matching_score >= 60:
            summary += ". Bon candidat pour ce poste."
        elif matching_score >= 40:
            summary += ". Candidat potentiel à considérer."
        else:
            summary += ". Profil peu adapté pour ce poste."
            
        return summary