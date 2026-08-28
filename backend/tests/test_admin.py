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

    # Register second user (member)
    reg2 = await client.post("/api/v1/auth/register", json={
        "email": "memberuser@example.com",
        "username": "memberuser",
        "password": "password123"
    })
    user2_id = reg2.json()["user"]["id"]

    # Test promoting user2 to admin
    role_res = await client.patch(
        f"/api/v1/admin/users/{user2_id}/role",
        json={"is_superuser": True},
        headers=headers,
    )
    assert role_res.status_code == 200
    assert role_res.json()["is_superuser"] is True

    # Test deleting user2
    del_res = await client.delete(
        f"/api/v1/admin/users/{user2_id}",
        headers=headers,
    )
    assert del_res.status_code == 200
    assert del_res.json()["success"] is True
