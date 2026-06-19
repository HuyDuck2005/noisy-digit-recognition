from fastapi import FastAPI


app = FastAPI(title="Noisy Digit Recognition API")


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
