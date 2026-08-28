import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_admin_endpoints(client: AsyncClient):
    reg = await client.post("/api/v1/auth/register", json={
        "email": "adminuser@example.com",
        "username": "adminuser",
        "password": "password123"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test admin stats
    res_stats = await client.get(
        "/api/v1/admin/stats",
        headers=headers,
    )
    assert res_stats.status_code == 200
    data_stats = res_stats.json()
    assert "total_users" in data_stats
    assert "total_active_habits" in data_stats
    assert "total_completions" in data_stats

    # Test admin users list
    res_users = await client.get(
        "/api/v1/admin/users",
        headers=headers,
    )
    assert res_users.status_code == 200
    data_users = res_users.json()
    assert isinstance(data_users, list)
    assert len(data_users) >= 1
