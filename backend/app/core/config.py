from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List


class Settings(BaseSettings):
    # Firebase
    firebase_project_id: str = ""
    firebase_service_account_json: str = ""  # path to JSON file

    # Gemini
    gemini_api_key: str = ""
    gemini_embedding_model: str = "models/text-embedding-004"

    # GitHub OAuth
    github_client_id: str = ""
    github_client_secret: str = ""

    # Encryption
    encryption_key: str = ""

    # CORS
    allowed_origins: str = "http://localhost:3000"

    # Pinecone
    pinecone_api_key: str = ""
    pinecone_index_name: str = "consultancy-agents"
    pinecone_environment: str = "us-east-1"

    # Legal MCP server
    mcp_server_path: str = "../open-legal-compliance-mcp"

    # Legal API keys (passed to MCP server subprocess)
    govinfo_api_key: str = ""
    courtlistener_api_key: str = ""
    congress_gov_api_key: str = ""
    open_states_api_key: str = ""

    # Agent config
    max_iterations: int = 5
    rag_chunk_size: int = 512
    rag_chunk_overlap: int = 50
    rag_top_k: int = 5
    tax_rate_tolerance: float = 0.05

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
