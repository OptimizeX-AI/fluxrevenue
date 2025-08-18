from fastapi import FastAPI
from .api.routes import router as chat_router

app = FastAPI(
    title="FluxRevenue Chatbot Agent",
    description="A smart assistant to help users interact with the FluxRevenue system.",
    version="1.0.0",
    docs_url="/api/v1/chat/docs",
    redoc_url="/api/v1/chat/redoc",
    openapi_url="/api/v1/chat/openapi.json"
)

# Include the chat API router
app.include_router(chat_router)

@app.get("/", tags=["Root"])
async def read_root():
    """
    Root endpoint for the chatbot agent.
    Provides a simple status message.
    """
    return {"message": "FluxRevenue Chatbot Agent is running"}
