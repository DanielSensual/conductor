"""
Conductor Engine - FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from conductor.config import get_settings
from conductor.api import execute_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    settings = get_settings()
    print(f"🚀 Conductor Engine starting...")
    print(f"   Debug mode: {settings.debug}")
    print(f"   CORS origins: {settings.cors_origins_list}")
    yield
    # Shutdown
    print("👋 Conductor Engine shutting down...")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()
    
    app = FastAPI(
        title="Conductor Engine",
        description="Graph Hydration Engine for AI Workflows",
        version="0.1.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
    )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include routers
    app.include_router(execute_router)
    
    # Root endpoint
    @app.get("/")
    async def root():
        return {
            "name": "Conductor Engine",
            "version": "0.1.0",
            "status": "running",
        }
    
    return app


# Create app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("conductor.main:app", host="0.0.0.0", port=8000, reload=True)
