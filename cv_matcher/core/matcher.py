"""
Module pour calculer la similarité entre les CVs et les offres d'emploi.
"""
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import logging
from config import MIN_SCORE, MAX_SCORE, SIMILARITY_THRESHOLD

logger = logging.getLogger(__name__)

class CVMatcher:
    """Classe pour calculer la similarité entre les CV et les offres d'emploi."""
    
    @staticmethod
    def calculate_similarity(cv_embedding, job_embedding):
        """
        Calcule la similarité cosinus entre l'embedding d'un CV et celui d'une offre d'emploi.
        
        Args:
            cv_embedding (numpy.ndarray): Embedding du CV
            job_embedding (numpy.ndarray): Embedding de l'offre d'emploi
            
        Returns:
            float: Score de similarité entre 0 et 1
        """
        if cv_embedding is None or job_embedding is None:
            logger.warning("Un des embeddings est None")
            return 0.0
            
        # Reshape pour le format attendu par cosine_similarity
        cv_embedding = cv_embedding.reshape(1, -1)
        job_embedding = job_embedding.reshape(1, -1)
        
        # Calcul de la similarité cosinus
        similarity = cosine_similarity(cv_embedding, job_embedding)[0][0]
        
        return float(similarity)
    
    @staticmethod
    def similarity_to_score(similarity):
        """
        Convertit une similarité cosinus (0-1) en score (0-100).
        Utilise une fonction sigmoïde pour accentuer les différences autour de SIMILARITY_THRESHOLD.
        
        Args:
            similarity (float): Similarité cosinus (entre 0 et 1)
            
        Returns:
            int: Score entre MIN_SCORE et MAX_SCORE
        """
        if similarity < 0:
            similarity = 0
        elif similarity > 1:
            similarity = 1
            
        # Utiliser une fonction sigmoïde pour accentuer les différences
        # autour du seuil de similarité
        x = 10 * (similarity - SIMILARITY_THRESHOLD)
        sigmoid = 1 / (1 + np.exp(-x))
        
        # Convertir en score entre MIN_SCORE et MAX_SCORE
        score = MIN_SCORE + sigmoid * (MAX_SCORE - MIN_SCORE)
        
        return int(round(score))
    
    @staticmethod
    def rank_candidates(cv_embeddings, job_embedding):
        """
        Classe les CV par ordre de pertinence pour une offre d'emploi.
        
        Args:
            cv_embeddings (dict): Dictionnaire des embeddings de CV {filename: embedding}
            job_embedding (numpy.ndarray): Embedding de l'offre d'emploi
            
        Returns:
            list: Liste de dictionnaires triés par score décroissant avec les clés:
                  'filename', 'similarity', 'score'
        """
        results = []
        
        for filename, embedding in cv_embeddings.items():
            similarity = CVMatcher.calculate_similarity(embedding, job_embedding)
            score = CVMatcher.similarity_to_score(similarity)
            
            results.append({
                'filename': filename,
                'similarity': similarity,
                'score': score
            })
        
        # Tri par score décroissant
        results.sort(key=lambda x: x['score'], reverse=True)
        
        return results