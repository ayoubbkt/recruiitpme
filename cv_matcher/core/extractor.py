"""
Module d'extraction de texte à partir de fichiers PDF.
"""
import os
import fitz  # PyMuPDF
from pdfminer.high_level import extract_text as pdfminer_extract
import logging

logger = logging.getLogger(__name__)

class CVExtractor:
    """Classe pour l'extraction de texte à partir de fichiers CV."""
    
    @staticmethod
    def extract_from_pdf(pdf_path):
        """
        Extrait le texte d'un fichier PDF en utilisant PyMuPDF (prioritaire) 
        avec fallback sur pdfminer.six.
        
        Args:
            pdf_path (str): Chemin vers le fichier PDF
            
        Returns:
            str: Texte extrait du PDF
        """
        if not os.path.exists(pdf_path):
            logger.error(f"Le fichier {pdf_path} n'existe pas")
            return ""
        
        # Tentative avec PyMuPDF (plus rapide)
        try:
            text = ""
            with fitz.open(pdf_path) as doc:
                for page in doc:
                    text += page.get_text()
            
            if text.strip():  # Si le texte n'est pas vide
                logger.info(f"Texte extrait avec PyMuPDF: {len(text)} caractères")
                return text
        except Exception as e:
            logger.warning(f"Échec de l'extraction avec PyMuPDF: {str(e)}")
        
        # Fallback sur pdfminer.six
        try:
            text = pdfminer_extract(pdf_path)
            logger.info(f"Texte extrait avec pdfminer: {len(text)} caractères")
            return text
        except Exception as e:
            logger.error(f"Échec de l'extraction avec pdfminer: {str(e)}")
            return ""

    @staticmethod
    def extract_all_from_directory(directory):
        """
        Extrait le texte de tous les fichiers PDF dans un répertoire.
        
        Args:
            directory (str): Chemin vers le répertoire contenant les PDFs
            
        Returns:
            dict: Dictionnaire avec les noms de fichiers comme clés et le texte extrait comme valeurs
        """
        results = {}
        
        if not os.path.isdir(directory):
            logger.error(f"Le répertoire {directory} n'existe pas")
            return results
        
        for filename in os.listdir(directory):
            if filename.lower().endswith('.pdf'):
                file_path = os.path.join(directory, filename)
                text = CVExtractor.extract_from_pdf(file_path)
                if text:
                    results[filename] = text
                    
        logger.info(f"Extraction terminée pour {len(results)} fichiers")
        return results