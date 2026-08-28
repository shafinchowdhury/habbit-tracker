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

# CORS Allowed Domains (Add your custom domain here)
BACKEND_CORS_ORIGINS=["https://habits.yourdomain.com","https://*.pages.dev","https://*.vercel.app","http://localhost:5173"]
```

---

## 🌐 2. Frontend Environment Variables (Copy & Paste)

When deploying your frontend (**Cloudflare Pages**, **Vercel**, or **Netlify**):

```env
# Point this to your live backend domain
VITE_API_URL=https://habit-quest-h4mf.onrender.com/api/v1
```

_Example:_ `VITE_API_URL=https://habitquest-api.onrender.com/api/v1`

---

## 👤 3. Default Admin & Demo Login Credentials

- **Email / Username**: `demo@habitquest.app` or `shafin`
- **Password**: `password123`
- **Role**: `Admin / Superuser` (Access to Admin Portal at `/admin`)

---

## 🛠️ 4. Hosting Platform Settings

### Backend (e.g. Render.com / Railway)

- **Root Directory**: `backend`
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend (e.g. Cloudflare Pages / Vercel)

- **Root Directory**: `frontend`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Build Output Directory**: `dist`
- **Node Version**: `18+` or `20+`

---

## 🔗 5. Custom Subdomain DNS Record (e.g. `habits.yourdomain.com`)

In your domain DNS registrar (Cloudflare / Namecheap / GoDaddy / Route 53):

| Type    | Name / Host | Target / Value                                                  | TTL           |
| :------ | :---------- | :-------------------------------------------------------------- | :------------ |
| `CNAME` | `habits`    | `your-frontend-subdomain.pages.dev` (or `cname.vercel-dns.com`) | Auto / 1 hour |

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
