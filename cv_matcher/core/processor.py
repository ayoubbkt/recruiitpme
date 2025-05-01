"""
Module pour le nettoyage et la normalisation des textes.
"""
import re
import unicodedata
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
import logging

logger = logging.getLogger(__name__)

# Télécharger les ressources NLTK nécessaires
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

class TextProcessor:
    """Classe pour le nettoyage et la normalisation des textes."""
    
    def __init__(self, language='french'):
        """
        Initialise le processeur de texte.
        
        Args:
            language (str): Langue pour les stop words (default: 'french')
        """
        self.language = language
        self.stop_words = set(stopwords.words(language))
        
    def normalize_text(self, text):
        """
        Normalise un texte (suppression des accents, mise en minuscule).
        
        Args:
            text (str): Texte à normaliser
            
        Returns:
            str: Texte normalisé
        """
        # Convertir en minuscules
        text = text.lower()
        
        # Supprimer les accents
        text = unicodedata.normalize('NFKD', text)
        text = ''.join([c for c in text if not unicodedata.combining(c)])
        
        # Remplacer les caractères spéciaux par des espaces
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Remplacer les espaces multiples par un seul espace
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def remove_stopwords(self, text):
        """
        Supprime les mots vides d'un texte.
        
        Args:
            text (str): Texte à filtrer
            
        Returns:
            str: Texte sans les mots vides
        """
        tokens = word_tokenize(text, language=self.language)
        filtered_tokens = [word for word in tokens if word not in self.stop_words]
        return ' '.join(filtered_tokens)
    
    def clean_cv_text(self, text):
        """
        Nettoie et prépare le texte d'un CV pour l'analyse.
        
        Args:
            text (str): Texte du CV
            
        Returns:
            str: Texte nettoyé
        """
        # Nettoyer les en-têtes et pieds de page communs
        text = re.sub(r'curriculum\s*vitae|cv|resume', '', text, flags=re.IGNORECASE)
        
        # Nettoyer les numéros de page
        text = re.sub(r'\b\d+\s*/\s*\d+\b', '', text)
        
        # Normaliser le texte
        text = self.normalize_text(text)
        
        # Ne pas enlever les stop words car ils sont importants pour le contexte
        # dans le cas des CV (ex: "expérience en", "diplômé de", etc.)
        
        return text
    
    def clean_job_text(self, text):
        """
        Nettoie et prépare le texte d'une offre d'emploi pour l'analyse.
        
        Args:
            text (str): Texte de l'offre d'emploi
            
        Returns:
            str: Texte nettoyé
        """
        # Supprimer les mentions d'entreprise génériques
        text = re.sub(r'nous\s*recherchons|notre\s*entreprise|notre\s*client', '', text, flags=re.IGNORECASE)
        
        # Normaliser le texte
        text = self.normalize_text(text)
        
        # Ne pas enlever les stop words pour préserver le contexte
        
        return text