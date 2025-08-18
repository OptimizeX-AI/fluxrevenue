import asyncio
import random
import json
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from .api.endpoints import router as api_router
from .websocket_manager import manager

app = FastAPI(
    title="FluxRevenue Web Interface API",
    description="API for interacting with the FluxRevenue system through a web dashboard.",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    # In a real application, this would be triggered by events from RabbitMQ
    # or other services. For now, we simulate real-time updates.
    async def broadcast_mock_updates():
        while True:
            await asyncio.sleep(5)
            update = {
                "type": "METRICS_UPDATE",
                "payload": {
                    "cpu_load": f"{random.randint(50, 95)}%",
                    "memory_usage": f"{random.randint(60, 85)}%",
                    "active_connections": random.randint(100, 500),
                }
            }
            await manager.broadcast(update)

    asyncio.create_task(broadcast_mock_updates())

app.include_router(api_router, prefix="/api")

# Mount the static directory to serve the frontend.
# The 'html=True' argument ensures that paths that are not found
# will serve the 'index.html' file, which is ideal for a single-page application.
app.mount("/", StaticFiles(directory="static", html=True), name="static")
