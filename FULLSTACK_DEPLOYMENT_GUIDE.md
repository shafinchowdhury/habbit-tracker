# 📖 The Ultimate Fullstack Web App Deployment Guide
### *React (Vite) + FastAPI (Python) + Neon (PostgreSQL) + Cloudflare Pages + Render*

This guide documents the complete, step-by-step procedure for deploying modern production fullstack applications (100% free hosting) with a custom subdomain on your existing domain.

---

## 🏗️ Architecture Blueprint

```mermaid
graph TD
    User([User Browser])
    DNS[Cloudflare DNS: yourdomain.com]
    
    User -->|yourdomain.com| MainSite[Your Existing Portfolio / Website]
    User -->|subdomain.yourdomain.com| CF_Pages[Frontend: Cloudflare Pages - Global CDN]
    
    CF_Pages -->|REST API Requests: /api/v1| Render[Backend: FastAPI on Render.com]
    Render -->|Async Queries: asyncpg| Neon[(Database: Serverless PostgreSQL on Neon.tech)]
```

---

## 📋 Phase 1: Database Setup (Neon PostgreSQL)

1. Go to **[Neon.tech](https://neon.tech)** and click **Create Project**.
2. Name your project (e.g. `myapp-db`) and choose the region closest to you.
3. In your Neon dashboard, copy the PostgreSQL connection string. It looks like:
   ```text
   postgresql://username:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. **Important for Python (SQLAlchemy + AsyncPG)**:
   Change the prefix from `postgresql://` to `postgresql+asyncpg://`:
   ```text
   postgresql+asyncpg://username:password@ep-xyz.us-east-2.aws.neon.tech/neondb?ssl=require
   ```

---

## 🐙 Phase 2: Git & Repository Setup

### 1. Create a Root `.gitignore`
Never commit credentials, local `.env` files, virtual environments, or compiled assets. Create `.gitignore` in your root folder:

```gitignore
# Python
venv/
.venv/
__pycache__/
*.pyc
*.pytest_cache/

# Node
node_modules/
dist/

# Secrets & Local DBs
.env
.env.local
!.env.example
*.db
*.sqlite3
.DS_Store
```

### 2. Initialize Git & Authenticate
Run inside your project directory:

```bash
# 1. Initialize Git
git init
git branch -M main

# 2. Stage & Commit
git add .
git commit -m "feat: initial production commit"

# 3. Log in to GitHub (if not already logged in)
gh auth login
# -> Select: GitHub.com > HTTPS > Yes > Login with browser

# 4. Add your GitHub remote & Push
git remote add origin https://github.com/<YOUR-USERNAME>/<REPO-NAME>.git
git push -u origin main --force
```

---

## ⚙️ Phase 3: Backend API Deployment (Render.com)

1. Open **[Render.com](https://dashboard.render.com)** and click **New +** $\rightarrow$ **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:

| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Name** | `myproject-api` | Will create `https://myproject-api.onrender.com` |
| **Region** | US East (Ohio) | Match your Neon database region |
| **Branch** | `main` | |
| **Root Directory** | `backend` | Tells Render your Python app is in `backend/` |
| **Runtime** | `Python 3` | |
| **Build Command** | `pip install -r requirements.txt` | |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` | |
| **Instance Type** | `Free` | |

4. Scroll down to **Environment Variables** and add:
   * **`DATABASE_URL`**: `postgresql+asyncpg://user:pass@host/neondb?ssl=require`
   * **`JWT_SECRET_KEY`**: A random 64-character secret string
   * **`ALGORITHM`**: `HS256`
   * **`ACCESS_TOKEN_EXPIRE_MINUTES`**: `10080` (7 days)
   * **`BACKEND_CORS_ORIGINS`**: `["*"]` *(Allows all origins during deployment)*

5. Click **Deploy Web Service**.
6. Wait for Render to build. Once live, test: `https://<YOUR-RENDER-NAME>.onrender.com/api/v1/docs`.

---

## 🎨 Phase 4: Frontend Deployment (Cloudflare Pages)

### 1. Ensure SPA Client-Side Routing Rule Exists
For React Router apps, create `frontend/public/_redirects` with:
```text
/*    /index.html   200
```
*(This ensures refreshing `/dashboard` or `/profile` never throws a 404 error)*.

### 2. Create Cloudflare Pages Project
1. Log in to **[Cloudflare Dashboard](https://dash.cloudflare.com/)**.
2. Go to **Compute (Workers & Pages)** $\rightarrow$ Click blue **Create application** button.
3. **CRITICAL**: Click the **Pages** tab (the blue icon, **NOT** Workers).
4. Click **Connect to Git** $\rightarrow$ Select your repository $\rightarrow$ Click **Begin setup**.

### 3. Build Settings Configuration:

| Setting | Value |
| :--- | :--- |
| **Project Name** | `myproject` |
| **Production Branch** | `main` |
| **Framework preset** | `Vite` *(or `None`)* |
| **Root directory** | `frontend` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |

4. Under **Environment variables (advanced)**, add:
   * **`VITE_API_URL`**: `https://<YOUR-RENDER-BACKEND-URL>/api/v1`

5. Click **Save and Deploy**.

---

## 🌐 Phase 5: Connect Custom Subdomain (e.g. `habits.yourdomain.com`)

Because your domain (e.g. `yourdomain.com`) is already managed by Cloudflare:

1. Inside your Cloudflare Pages project, click the **Custom domains** tab at the top.
2. Click **Set up a custom domain**.
3. Type your subdomain:
   ```text
   subdomain.yourdomain.com
   ```
   *(e.g. `habitquest.shafinchowdhury.dev` or `habits.shafinchowdhury.dev`)*.
4. Click **Continue** $\rightarrow$ Click **Activate domain**.

> **🛡️ Zero Risk Guarantee**: Cloudflare only adds a CNAME record for `subdomain`. Your root website (`yourdomain.com`) and its DNS records are completely untouched!

---

## 🚨 Common Pitfalls & Troubleshooting Checklist

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| **White Screen in Browser** | Cloudflare Pages output directory was set to `/` instead of `dist` | In Pages settings $\rightarrow$ set Build Output Directory to `dist` and redeploy. |
| **Browser 404 on Refresh** | Missing SPA redirect rule for React Router | Create `frontend/public/_redirects` with `/* /index.html 200`. |
| **CORS Error in Console** | Backend blocked the frontend domain | Ensure `BACKEND_CORS_ORIGINS=["*"]` on Render or include your exact frontend URL. |
| **Database `can't subtract offset-naive and offset-aware datetimes`** | Mixing `timezone.utc` with standard SQLAlchemy `DateTime` | Use `datetime.now(timezone.utc).replace(tzinfo=None)` in Python models & seeds. |
| **Database Deadlock / Disconnection** | Cloud Postgres connection drops when idling | Add `pool_pre_ping=True` and `pool_recycle=300` in `create_async_engine`. |
| **Render Spin-down Delay** | Free instances idle after 15 minutes of inactivity | Expected on free tier (~40s initial wakeup). Upgrading to Starter eliminates this. |

---

## 🚀 Cheat Sheet: 5-Minute Deployment Summary

```text
1. Neon: Create DB -> Copy URL -> Change to postgresql+asyncpg://
2. GitHub: Create repo -> git push -u origin main
3. Render: New Web Service -> Root: backend -> Start: uvicorn app.main:app --host 0.0.0.0 --port $PORT -> Add env vars
4. Cloudflare Pages: New Pages App -> Root: frontend -> Output: dist -> Add VITE_API_URL -> Deploy
5. Subdomain: Pages > Custom Domains > Add subdomain.yourdomain.com -> Done!
```
