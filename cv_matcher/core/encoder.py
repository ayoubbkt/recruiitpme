"""
Module pour encoder les textes en embeddings avec Sentence-BERT.
"""
from sentence_transformers import SentenceTransformer
import numpy as np
import logging
from config import SENTENCE_TRANSFORMER_MODEL

logger = logging.getLogger(__name__)

class TextEncoder:
    """Classe pour encoder les textes en vecteurs avec Sentence-BERT."""
    
    def __init__(self, model_name=SENTENCE_TRANSFORMER_MODEL):
        """
        Initialise l'encodeur de texte avec un modèle Sentence-BERT.
        
        Args:
            model_name (str): Nom du modèle Sentence-BERT à utiliser
        """
        logger.info(f"Chargement du modèle Sentence-BERT: {model_name}")
        self.model = SentenceTransformer(model_name)
        
    def encode_text(self, text):
        """
        Encode un texte en un vecteur d'embeddings.
        
        Args:
            text (str): Texte à encoder
            
        Returns:
            numpy.ndarray: Vecteur d'embeddings
        """
        if not text:
            logger.warning("Tentative d'encodage d'un texte vide")
            return np.zeros(self.model.get_sentence_embedding_dimension())
        
        # Encode le texte et normalise le vecteur
        embedding = self.model.encode(text, normalize_embeddings=True)
        return embedding
    
    def encode_chunks(self, text, chunk_size=512, overlap=100):
        """
        Encode un texte long en le divisant en chunks et en faisant la moyenne des embeddings.
        
        Args:
            text (str): Texte à encoder
            chunk_size (int): Taille maximale des chunks
            overlap (int): Chevauchement entre les chunks
            
        Returns:
            numpy.ndarray: Vecteur d'embeddings moyen
        """
        if not text:
            logger.warning("Tentative d'encodage d'un texte vide")
            return np.zeros(self.model.get_sentence_embedding_dimension())
        
        # Découper le texte en chunks avec chevauchement
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = ' '.join(words[i:i + chunk_size])
            chunks.append(chunk)
        
        # Si le texte est court, pas besoin de le découper
        if not chunks:
            chunks = [text]
        
        # Encoder chaque chunk
        embeddings = self.model.encode(chunks, normalize_embeddings=True)
        
        # Calculer la moyenne des embeddings
        avg_embedding = np.mean(embeddings, axis=0)
        
        # Normaliser l'embedding moyen
        norm = np.linalg.norm(avg_embedding)
        if norm > 0:
            avg_embedding = avg_embedding / norm
            
        return avg_embedding