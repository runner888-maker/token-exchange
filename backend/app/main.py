from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database.db import init_db
from .routers import completion, stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Token Exchange API",
    description=(
        "A unified AI routing layer that abstracts provider tokens into credits "
        "and dynamically selects the cheapest, fastest, or highest-quality model "
        "across Anthropic and OpenAI."
    ),
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(completion.router, prefix="/v1")
app.include_router(stats.router, prefix="/v1")


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "service": "token-exchange", "version": "0.1.0"}
