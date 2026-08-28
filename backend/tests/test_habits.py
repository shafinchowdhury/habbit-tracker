import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_habit_lifecycle_and_completion(client: AsyncClient):
    # Register user
    reg = await client.post("/api/v1/auth/register", json={
        "email": "habituser@example.com",
        "username": "habituser",
        "password": "password123"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create habit
    h_resp = await client.post("/api/v1/habits", json={
        "name": "Drink Water",
        "icon": "💧",
        "category": "Health",
        "measurement_type": "quantity",
        "target_value": 2.5,
        "unit": "L"
    }, headers=headers)
    assert h_resp.status_code == 200
    habit = h_resp.json()
    habit_id = habit["id"]

    # 2. Toggle completion
    comp_resp = await client.post("/api/v1/completions/toggle", json={
        "habit_id": habit_id,
        "date": "2026-08-26",
        "status": "completed",
        "actual_value": 2.5
    }, headers=headers)
    assert comp_resp.status_code == 200
    comp_data = comp_resp.json()
    assert comp_data["status"] == "completed"
    assert comp_data["xp_earned"] == 20

    # 3. Get Dashboard
    dash_resp = await client.get("/api/v1/dashboard?week_span=4", headers=headers)
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert dash_data["selected_week_span"] == 4
    assert len(dash_data["weekly_cards"]) == 4
    assert len(dash_data["habit_rows"]) == 1
    assert dash_data["habit_rows"][0]["cells"]["2026-08-26"]["status"] == "completed"

    # 4. Clear all completions / ticks
    clear_resp = await client.delete("/api/v1/completions/clear-all", headers=headers)
    assert clear_resp.status_code == 200
    assert clear_resp.json()["deleted_count"] == 1

    # 5. Verify Dashboard has no completed cells
    dash_after = await client.get("/api/v1/dashboard?week_span=4", headers=headers)
    assert dash_after.status_code == 200
    dash_after_data = dash_after.json()
    assert dash_after_data["habit_rows"][0]["cells"]["2026-08-26"]["status"] != "completed"

@pytest.mark.asyncio
async def test_privacy_isolation_between_users(client: AsyncClient):
    # Register User A
    reg_a = await client.post("/api/v1/auth/register", json={
        "email": "usera@example.com",
        "username": "usera",
        "password": "password123"
    })
    token_a = reg_a.json()["access_token"]

    # Register User B
    reg_b = await client.post("/api/v1/auth/register", json={
        "email": "userb@example.com",
        "username": "userb",
        "password": "password123"
    })
    token_b = reg_b.json()["access_token"]

    # User A creates a habit
    h_a = await client.post("/api/v1/habits", json={
        "name": "User A Secret Habit",
        "visibility": "PRIVATE"
    }, headers={"Authorization": f"Bearer {token_a}"})
    habit_a_id = h_a.json()["id"]

    # User B should NOT be able to delete or update User A's habit
    del_resp = await client.delete(f"/api/v1/habits/{habit_a_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert del_resp.status_code == 404

    # User B lists habits -> should have 0 habits
    list_resp = await client.get("/api/v1/habits", headers={"Authorization": f"Bearer {token_b}"})
    assert len(list_resp.json()) == 0

@pytest.mark.asyncio
async def test_habit_creation_with_target_days(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "perioduser@example.com",
        "username": "perioduser",
        "password": "password123"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create habit with target_days = 30
    h_resp = await client.post("/api/v1/habits", json={
        "name": "30 Days Coding Challenge",
        "icon": "💻",
        "target_days": 30
    }, headers=headers)
    assert h_resp.status_code == 200
    data = h_resp.json()
    assert data["target_days"] == 30
    assert data["end_date"] is not None

    # Get Dashboard
    dash_resp = await client.get("/api/v1/dashboard", headers=headers)
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert len(dash_data["habit_rows"]) == 1
    assert dash_data["habit_rows"][0]["target_days"] == 30
