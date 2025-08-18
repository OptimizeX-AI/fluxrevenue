from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.security import OAuth2PasswordRequestForm
from ..auth.auth_manager import AuthManager, get_current_user
from ..dashboard.dashboard_manager import DashboardManager, SystemOverview, ProjectTimeline
from ..websocket_manager import manager

router = APIRouter()
auth_manager = AuthManager()
dashboard_manager = DashboardManager()

@router.post("/token", summary="Get JWT token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticate user and return a JWT token.

    **Note:** This is a mock authentication endpoint for development.
    In a real application, you would validate credentials against a database.
    """
    # Mock user validation
    if form_data.username == "jules" and form_data.password == "supersecret":
        user_data = {"id": "jules_123", "username": form_data.username}
        token = auth_manager.generate_token(user_data)
        return {"access_token": token, "token_type": "bearer"}

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

@router.get("/users/me", summary="Get current user info")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """
    Protected endpoint to get the current authenticated user's information.
    """
    return current_user

@router.get("/dashboard/overview", response_model=SystemOverview, summary="Get system overview")
async def get_dashboard_overview(current_user: dict = Depends(get_current_user)):
    """
    Get a high-level overview of the system status.
    """
    return await dashboard_manager.get_system_overview()

@router.get("/projects/{project_id}/timeline", response_model=ProjectTimeline, summary="Get project timeline")
async def get_project_timeline(project_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get the detailed timeline for a specific project.
    """
    return await dashboard_manager.get_project_timeline(project_id)

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # The backend can listen for messages from the client if needed
            # For this implementation, we are primarily broadcasting from the server
            data = await websocket.receive_text()
            # Example of echoing back a message
            await manager.send_personal_message(f"Echo: {data}", websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
