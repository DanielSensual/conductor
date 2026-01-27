"""
Conductor Configuration - Environment and Settings
"""
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # API Keys
    openai_api_key: str = ""
    
    # Database
    database_url: str = "postgresql://conductor:conductor_dev@localhost:5432/conductor"
    
    # App Settings
    debug: bool = True
    cors_origins: str = "http://localhost:3000"
    
    # Execution Limits
    default_recursion_limit: int = 10
    default_timeout_seconds: int = 300
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
