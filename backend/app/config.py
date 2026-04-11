from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    database_url: str = "sqlite:///./token_exchange.db"
    mock_mode: bool = True  # Use simulated responses when no API keys are set

    class Config:
        env_file = ".env"


settings = Settings()
