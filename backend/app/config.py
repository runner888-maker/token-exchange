import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    xai_api_key: str = os.getenv("XAI_API_KEY", "")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./token_exchange.db")
    mock_mode: bool = os.getenv("MOCK_MODE", "false").lower() == "true"


settings = Settings()
