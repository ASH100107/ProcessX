"""
ProcessX Backend API Entrypoint
FastAPI Application with ML Models Lifespan and Route Registrations
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from backend.app.utils.config import settings
from backend.app.utils.logger import logger
from backend.app.services.ml_service import ml_service
from backend.app.services.process_service import process_service

# Routers
from backend.app.api.health import router as health_router
from backend.app.api.process import router as process_router
from backend.app.api.bottlenecks import router as bottlenecks_router
from backend.app.api.anomalies import router as anomalies_router
from backend.app.api.delay_causes import router as delay_causes_router
from backend.app.api.investigation import router as investigation_router
from backend.app.api.simulation import router as simulation_router
from backend.app.api.baseline import router as baseline_router
from backend.app.api.scenarios import router as scenarios_router
from backend.app.api.ml_metrics import router as ml_metrics_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle startup and shutdown handler."""
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION} [{settings.ENVIRONMENT}]")
    logger.info("Initializing ML Models and Preprocessors...")
    ml_service.load_models()
    logger.info("Initializing Process State and Event Log Repository...")
    process_service.initialize()
    logger.info("Application startup complete. Ready to receive requests.")
    yield
    logger.info("Shutting down ProcessX backend...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Autonomous Business Bottleneck Investigator API",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api
app.include_router(health_router, prefix=settings.API_PREFIX)
app.include_router(process_router, prefix=settings.API_PREFIX)
app.include_router(bottlenecks_router, prefix=settings.API_PREFIX)
app.include_router(anomalies_router, prefix=settings.API_PREFIX)
app.include_router(delay_causes_router, prefix=settings.API_PREFIX)
app.include_router(investigation_router, prefix=settings.API_PREFIX)
app.include_router(simulation_router, prefix=settings.API_PREFIX)
app.include_router(baseline_router, prefix=settings.API_PREFIX)
app.include_router(scenarios_router, prefix=settings.API_PREFIX)
app.include_router(ml_metrics_router, prefix=settings.API_PREFIX)

@app.get("/")
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_check": f"{settings.API_PREFIX}/health"
    }

if __name__ == "__main__":
    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
