from fastapi import APIRouter, HTTPException
from backend.app.schemas.chat import ChatRequest, ChatResponse
from backend.app.core.router import hybrid_router

router = APIRouter(prefix="/api/chat", tags=["Assistant Chat"])

@router.post("", response_model=ChatResponse)
def handle_chat_message(request: ChatRequest):
    """Processes user voice transcript or typed text through the Hybrid Routing Engine."""
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        response = hybrid_router.route_and_execute(
            message=request.message,
            session_id=request.session_id or "default",
            bypass_ml=request.bypass_ml,
            force_local=request.force_local
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal routing error: {str(e)}")

@router.post("/confirm", response_model=ChatResponse)
def confirm_action(action: str, original_message: str):
    """Executes a consequential action following explicit user confirmation."""
    try:
        response = hybrid_router.route_and_execute(
            message=original_message,
            confirmation=True
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Confirmation execution error: {str(e)}")
