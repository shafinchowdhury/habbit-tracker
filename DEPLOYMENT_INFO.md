# 🚀 HabitQuest Deployment & Environment Reference

This document contains all production connection strings, environment variables, credentials, and step-by-step deployment instructions for HabitQuest.

---

## 🔑 1. Backend Environment Variables (Copy & Paste)

When setting up your backend hosting service (**Render**, **Railway**, **Fly.io**, or **VPS**), copy and paste these environment variables into your hosting dashboard:

```env
# Database (Neon Cloud PostgreSQL with AsyncPG)
DATABASE_URL=postgresql+asyncpg://neondb_owner:npg_CXRwxU54PKZg@ep-flat-glitter-axabl0pz.c-4.us-east-2.aws.neon.tech/neondb?ssl=require

# Security
JWT_SECRET_KEY=habitquest_super_secret_jwt_key_for_development_2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# CORS Allowed Domains (Custom domain on shafinchowdhury.dev)
BACKEND_CORS_ORIGINS=["https://habits.shafinchowdhury.dev","https://app.shafinchowdhury.dev","https://*.pages.dev","https://*.vercel.app","http://localhost:5173"]
```

---

## 🌐 2. Frontend Environment Variables (Copy & Paste)

When deploying your frontend (**Cloudflare Pages**):

```env
# Point this to your live backend domain
VITE_API_URL=https://<YOUR-RENDER-BACKEND-URL>/api/v1
```

*Example:* `VITE_API_URL=https://habitquest-api.onrender.com/api/v1`

---

## 👤 3. Default Admin & Demo Login Credentials

* **Email / Username**: `demo@habitquest.app` or `shafin`
* **Password**: `password123`
* **Role**: `Admin / Superuser` (Access to Admin Portal at `/admin`)

---

## 🛠️ 4. Hosting Platform Settings

### Backend (Render.com)
* **Root Directory**: `backend`
* **Environment**: `Python 3`
* **Build Command**: `pip install -r requirements.txt`
* **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend (Cloudflare Pages)
* **Root Directory**: `frontend`
* **Framework Preset**: `Vite`
* **Build Command**: `npm run build`
* **Build Output Directory**: `dist`

---

## 🔗 5. Custom Subdomain on Cloudflare (e.g. `habits.shafinchowdhury.dev`)

Because **`shafinchowdhury.dev`** is already active in your Cloudflare account:
1. In Cloudflare Pages $\rightarrow$ Go to **Custom domains** tab.
2. Click **Set up a custom domain** $\rightarrow$ Enter: **`habits.shafinchowdhury.dev`**
3. Click **Activate domain**. Cloudflare configures the DNS and SSL automatically!

---

## 🔄 6. Useful Terminal Commands

```bash
# Run backend tests
cd backend && ./venv/bin/pytest

# Re-seed database with 35 days of history
cd backend && ./venv/bin/python -m app.seed.seed_data

# Test frontend production build
cd frontend && npm run build
```
