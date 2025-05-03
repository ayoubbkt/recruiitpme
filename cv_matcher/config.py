"""
Configuration globale pour l'application de matching CV.
"""
import os
from pathlib import Path

# Chemins
BASE_DIR = Path(__file__).resolve().parent
CV_UPLOAD_DIR = os.environ.get("CV_UPLOAD_DIR", "uploads/cvs/")
MODELS_DIR = os.path.join(BASE_DIR, "models")

# Configuration des modèles
SENTENCE_TRANSFORMER_MODEL = "all-MiniLM-L6-v2"  # Modèle léger de Sentence-BERT
SPACY_MODEL = "fr_core_news_sm"  # Modèle français de SpaCy (large)

# Seuils et paramètres
SIMILARITY_THRESHOLD = 0.5  # Seuil minimum de similarité
MAX_CV_SIZE_MB = 10  # Taille maximale des fichiers CV en MB
MIN_SCORE = 0  # Score minimum
MAX_SCORE = 100  # Score maximum

# Configuration de l'API
API_HOST = "0.0.0.0"
API_PORT = 8000
DEBUG_MODE = os.environ.get("DEBUG", "False").lower() == "true"

# Liste des extensions de fichiers acceptées
ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc']

# Configuration de l'extraction d'entités
COMPETENCES_PATTERNS = [
    "python", "java", "javascript", "typescript", "c++", "react", "angular",
    "node.js", "express", "flask", "django", "spring", "php", "html", "css",
    "sql", "postgresql", "mysql", "mongodb", "aws", "azure", "docker", "kubernetes",
    "git", "ci/cd", "agile", "scrum", "développement", "programmation", "algorithmique",
    "machine learning", "intelligence artificielle", "nlp", "react.js", "node.js",
    "vue.js", "web", "backend", "frontend", "full stack", "devops", "sécurité",
    "mobile", "android", "ios", "swift", "kotlin", "flutter", "react native"
]