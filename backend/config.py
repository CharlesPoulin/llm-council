"""Configuration for the LLM Council."""

import os
from dotenv import load_dotenv

load_dotenv()

# Ollama API endpoint (default: http://localhost:11434)
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434/v1/chat/completions")

# Council members - list of Ollama model identifiers
# These are the model names you pulled with 'ollama pull'
COUNCIL_MODELS = [
    "llama3.2:3b",
    "mistral:7b",
    "qwen2.5:7b",
    "gemma2:9b",
]

# Chairman model - synthesizes final response
CHAIRMAN_MODEL = "llama3.1:8b"

# Legacy variable names for backward compatibility
OPENROUTER_API_KEY = None  # Not needed for local Ollama
OPENROUTER_API_URL = OLLAMA_API_URL

# Data directory for conversation storage
DATA_DIR = "data/conversations"
