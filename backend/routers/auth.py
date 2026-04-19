from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from auth import ACCESS_TOKEN_EXPIRE_MINUTES, authenticate_user, create_access_token, get_current_user

router = APIRouter()


class LoginPayload(BaseModel):
    username: str
    password: str


@router.post("/login")
async def login(payload: LoginPayload):
    if not authenticate_user(payload.username, payload.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants invalides",
        )

    token = create_access_token(subject=payload.username)
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in_minutes": ACCESS_TOKEN_EXPIRE_MINUTES,
    }


@router.get("/me")
async def me(current_user: str = Depends(get_current_user)):
    return {
        "username": current_user,
        "role": "admin",
    }
