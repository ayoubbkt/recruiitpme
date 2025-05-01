"""
Module pour l'extraction d'entités nommées à partir des CV et offres d'emploi.
"""
import re
import spacy
import logging
from config import SPACY_MODEL, COMPETENCES_PATTERNS

logger = logging.getLogger(__name__)

class EntityExtractor:
    """Classe pour extraire des entités nommées des textes."""
    
    def __init__(self, model_name=SPACY_MODEL):
        """
        Initialise l'extracteur d'entités avec un modèle spaCy.
        
        Args:
            model_name (str): Nom du modèle spaCy à utiliser
        """
        logger.info(f"Chargement du modèle spaCy: {model_name}")
        try:
            self.nlp = spacy.load(model_name)
        except OSError:
            logger.warning(f"Modèle {model_name} non trouvé, téléchargement en cours...")
            spacy.cli.download(model_name)
            self.nlp = spacy.load(model_name)
            
        # Ajouter les patterns pour les compétences
        self.competences_patterns = COMPETENCES_PATTERNS
        
    def extract_skills(self, text):
        """
        Extrait les compétences techniques mentionnées dans le texte.
        
        Args:
            text (str): Texte à analyser
            
        Returns:
            list: Liste des compétences détectées
        """
        skills = set()
        
        # Analyse avec spaCy
        doc = self.nlp(text.lower())
        
        # Recherche des patterns de compétences
        for pattern in self.competences_patterns:
            if re.search(r'\b' + re.escape(pattern) + r'\b', text.lower()):
                skills.add(pattern)
        
        # Trouver les entités ORG qui pourraient être des technologies
        for ent in doc.ents:
            if ent.label_ == "ORG" and len(ent.text) > 1:
                skills.add(ent.text.lower())
                
        return list(skills)
    
    def extract_experience_years(self, text):
        """
        Extrait le nombre d'années d'expérience mentionné dans le texte.
        
        Args:
            text (str): Texte à analyser
            
        Returns:
            int: Nombre estimé d'années d'expérience, ou None si non détecté
        """
        # Patterns pour les années d'expérience
        patterns = [
            r'(\d+)\s*ans?\s+d\'expérience',
            r'expérience\s*:?\s*(\d+)\s*ans?',
            r'expérience\s*professionnelle\s*:?\s*(\d+)\s*ans?',
            r'(\d+)\s*ans?\s+d\'expérience\s*professionnelle',
            r'(\d+)\s*years?\s+of\s+experience',
            r'experience\s*:?\s*(\d+)\s*years?'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    return int(match.group(1))
                except (ValueError, IndexError):
                    continue
                
        # Si pas trouvé avec les patterns, analyser les périodes d'emploi
        return self._estimate_from_employment_periods(text)
    
    def _estimate_from_employment_periods(self, text):
        """
        Estime le nombre d'années d'expérience à partir des périodes d'emploi.
        
        Args:
            text (str): Texte du CV
            
        Returns:
            int: Nombre estimé d'années d'expérience, ou None si non détecté
        """
        # Recherche des périodes du type "2015-2020" ou "2015 - 2020" ou "2015 à 2020"
        period_pattern = r'((?:19|20)\d{2})\s*[\-–—à]\s*((?:19|20)\d{2}|présent|present|aujourd\'hui|actuel)'
        
        total_years = 0
        matches = re.finditer(period_pattern, text, re.IGNORECASE)
        
        current_year = 2023  # À remplacer par datetime.now().year dans un contexte réel
        
        for match in matches:
            try:
                start_year = int(match.group(1))
                
                # Traitement de la date de fin
                end_str = match.group(2)
                if re.match(r'présent|present|aujourd\'hui|actuel', end_str, re.IGNORECASE):
                    end_year = current_year
                else:
                    end_year = int(end_str)
                
                # Ajouter la durée de cette période
                if end_year >= start_year:  # Vérification de validité
                    total_years += (end_year - start_year)
            except (ValueError, IndexError):
                continue
                
        return total_years if total_years > 0 else None
    
    def extract_education(self, text):
        """
        Extrait les informations d'éducation du texte.
        
        Args:
            text (str): Texte à analyser
            
        Returns:
            list: Liste des diplômes/formations détectés
        """
        # Liste de diplômes et niveaux d'éducation à rechercher
        diplomas = [
            "bac", "baccalauréat", "bts", "dut", "licence", "master", "doctorat", "phd",
            "diplôme", "diplome", "ingénieur", "ingenieur", "mba", "formation",
            "certificat", "certification", "école", "ecole", "université", "universite"
        ]
        
        education_info = []
        
        # Découpage en paragraphes pour isoler la section éducation
        paragraphs = re.split(r'\n\s*\n', text.lower())
        
        for paragraph in paragraphs:
            # Vérifier si le paragraphe parle d'éducation
            is_education = any(re.search(r'\b' + re.escape(d) + r'\b', paragraph) for d in diplomas)
            
            if is_education:
                # Nettoyer et ajouter à la liste
                clean_paragraph = re.sub(r'\s+', ' ', paragraph).strip()
                education_info.append(clean_paragraph)
                
        return education_info
        
    def analyze_cv(self, text):
        """
        Analyse complète d'un CV pour en extraire les informations clés.
        
        Args:
            text (str): Texte du CV
            
        Returns:
            dict: Dictionnaire des informations extraites
        """
        # Extraire les compétences
        skills = self.extract_skills(text)
        
        # Extraire les années d'expérience
        experience_years = self.extract_experience_years(text)
        
        # Extraire les informations d'éducation
        education = self.extract_education(text)
        
        # Analyser le niveau d'expérience
        experience_level = "débutant"
        if experience_years:
            if experience_years > 5:
                experience_level = "confirmé"
            if experience_years > 10:
                experience_level = "expert"
                
        return {
            "skills": skills,
            "experience_years": experience_years,
            "education": education,
            "experience_level": experience_level
        }