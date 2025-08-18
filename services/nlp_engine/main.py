from fastapi import FastAPI, HTTPException, Body
from typing import Dict, Any
from .advanced_nlp import AdvancedNLPEngine
from .content_generator import AdvancedContentGenerator
from .models import SemanticUnderstanding, GenerationConfig

app = FastAPI(
    title="Advanced NLP Engine",
    description="Service for deep language understanding and sophisticated content generation.",
    version="1.0.0"
)

nlp_engine = AdvancedNLPEngine()
content_generator = AdvancedContentGenerator()

@app.post("/understand-query", response_model=SemanticUnderstanding)
async def understand_query(query: str = Body(..., embed=True), context: Dict = Body({}, embed=True)):
    """
    Receives a complex query and returns a rich semantic understanding of it.
    """
    try:
        understanding = await nlp_engine.understand_complex_query(query, context)
        return understanding
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.post("/generate-documentation", response_model=str)
async def generate_documentation(config: GenerationConfig):
    """
    Receives a configuration and generates sophisticated technical documentation.
    """
    try:
        documentation = await content_generator.generate_technical_documentation(
            topic=config.topic,
            audience=config.audience,
            depth=config.depth
        )
        return documentation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.get("/health")
async def health_check():
    """
    Health check endpoint for the NLP Engine.
    """
    return {"status": "ok"}
