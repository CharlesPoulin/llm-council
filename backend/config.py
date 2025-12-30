"""Configuration for the LLM Council."""

import os
from dotenv import load_dotenv

load_dotenv()

# Ollama API endpoint (default: http://localhost:11434)
OLLAMA_API_URL = os.getenv("OLLAMA_API_URL", "http://localhost:11434/v1/chat/completions")

# Roles directory - contains role definition markdown files
ROLES_DIR = "backend/roles"

# Legacy variable names for backward compatibility
OPENROUTER_API_KEY = None  # Not needed for local Ollama
OPENROUTER_API_URL = OLLAMA_API_URL

# Data directory for conversation storage
DATA_DIR = "data/conversations"
