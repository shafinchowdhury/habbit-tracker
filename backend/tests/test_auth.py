import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    # 1. Register
    reg_resp = await client.post("/api/v1/auth/register", json={
        "email": "tester@example.com",
        "username": "tester",
        "password": "SecurePassword123!",
        "first_name": "Test User"
    })
    assert reg_resp.status_code == 200
    data = reg_resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "tester@example.com"
    token = data["access_token"]

    # 2. Get Profile
    me_resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == "tester"

    # 3. Login
    login_resp = await client.post("/api/v1/auth/login", json={
        "email_or_username": "tester",
        "password": "SecurePassword123!"
    })
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

@pytest.mark.asyncio
async def test_duplicate_registration_rejected(client: AsyncClient):
    await client.post("/api/v1/auth/register", json={
        "email": "dup@example.com",
        "username": "dupuser",
        "password": "password123"
    })
    resp = await client.post("/api/v1/auth/register", json={
        "email": "dup@example.com",
        "username": "dupuser2",
        "password": "password123"
    })
    assert resp.status_code == 400
