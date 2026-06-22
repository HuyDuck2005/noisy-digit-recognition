from fastapi import FastAPI

from app.routers import health, images, process


app = FastAPI(title="Noisy Digit Recognition API")

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(images.router, prefix="/api", tags=["images"])
app.include_router(process.router, prefix="/api", tags=["process"])
