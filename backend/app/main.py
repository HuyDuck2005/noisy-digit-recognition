from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import datasets, health, images, process


app = FastAPI(title="Noisy Digit Recognition API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(images.router, prefix="/api", tags=["images"])
app.include_router(process.router, prefix="/api", tags=["process"])
app.include_router(datasets.router, prefix="/api", tags=["datasets"])
