from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, domains, mcp_tools, job_analysis

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Job Agent API", description="Job failure analysis platform", version="1.0.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(auth.router)
app.include_router(domains.router)
app.include_router(mcp_tools.router)
app.include_router(job_analysis.router)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
