# HabitQuest — Gamified Habit Tracker & Analytics

HabitQuest is a modern, production-ready, gamified habit tracking web application built with a **Python + FastAPI** backend, **PostgreSQL** database, and a **React + Tailwind CSS** frontend. It features an analytics-first dashboard structured around your reference design with **user-selectable tracking week spans (1–8 weeks)**, 4 selectable visual themes (Midnight, Fresh, Clarity, Harvest), streak tracking with freezes, deterministic XP & leveling, achievements, friend streaks, multiplayer challenges, and server-side privacy controls.

---

## 🎨 4 Tailored Appearance Themes

The application includes 4 complete CSS design token themes switchable via the Theme Switcher in the top navigation or Settings:
* **Clarity** (Default): High-legibility white surface & royal blue accent.
* **Midnight**: Premium low-glare dark background (`#0B0B10`) & violet accent (`#8B5CF6`).
* **Fresh**: Clean white background (`#FFFFFF`) & emerald green accent (`#16A34A`).
* **Harvest**: Warm natural paper background (`#FCFBF3`) & olive/gold accent (`#65A30D` / `#EAB308`).

---

## 📊 Dashboard Architecture (Matching Reference Blueprint)

1. **Top Tier: Dynamic Weekly Cards**:
   * Displays $N$ weekly cards (user-selectable from 1 to 8 weeks in the header).
   * 7 daily vertical bars with target and average threshold lines.
   * Standout metrics: Completion %, strongest habit, and adherence tags.
2. **Middle Tier: 5 Summary Analytics Cards**:
   * **Overall Completion**: Circular progress ring (`91% 🌱`).
   * **Consistency Score**: Deterministic 0–100 calculated index (`94/100 🏆`).
   * **Best Streak**: Circular flame badge (`14 Days 🔥`).
   * **Domain Balance**: Multi-domain Radar / Spider chart (`📊`).
   * **Time Invested**: Circular progress ring (`18.5h ⏱️`).
3. **Bottom Tier: Main Habit Tracking Grid**:
   * Month & Year selector navigation (`‹ August 2026 ›` and `Today`).
   * Color-tinted column headers partitioned by week.
   * Sticky habit names and target labels (`💧 Hydration (2.5L)`, `💻 Coding (2hrs)`, `🏃 10k Steps`).
   * Interactive rounded cells (`Completed ✓`, `Partial ◐`, `Rest Day`, `Skipped`, `Missed`).
   * Summary footer row with aggregated daily time invested (`⏱️ Time Invested: 18.5h`).

---

## 🚀 Quick Start (Local Development)

### 1. Start the FastAPI Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run seed script to populate realistic reference data
python -m app.seed.seed_data

# Start backend server
uvicorn app.main:app --reload --port 8000
```
Interactive Swagger API documentation is available at `http://localhost:8000/api/v1/docs`.

### 2. Start the React Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 🔑 Demo Credentials:
* **Email**: `demo@habitquest.app` (or username `shafin`)
* **Password**: `password123`

---

## ☁️ 100% Free Production Deployment Guide (Cloudflare & Custom Domain)

### Architecture:
* **Frontend**: Cloudflare Pages (100% Free edge hosting with unlimited requests)
* **Backend**: Render / Koyeb / Fly.io (Free Python Web Service tier)
* **Database**: Neon.tech or Supabase (Free serverless PostgreSQL)

```
                            ┌────────────────────────────────────────┐
                            │          Cloudflare DNS & Edge         │
                            │           (yourdomain.com)             │
                            └───────────────────┬────────────────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 │                                                             │
         (Cloudflare Pages)                                            (DNS CNAME Proxy)
                 ▼                                                             ▼
    ┌─────────────────────────┐                                   ┌─────────────────────────┐
    │      Frontend App       │                                   │     FastAPI Backend     │
    │   (React + Vite SPA)    │ ──────── API Calls (HTTPS) ─────► │     (Python 3.11)       │
    │  Hosted on Cloudflare   │                                   │   Hosted on Render/Fly  │
    │  Edge Network (Free)    │                                   │       (Free Tier)       │
    └─────────────────────────┘                                   └────────────┬────────────┘
                                                                               │
                                                                               ▼
                                                                  ┌─────────────────────────┐
                                                                  │   PostgreSQL Database   │
                                                                  │    (Neon / Supabase)    │
                                                                  │       (Free Tier)       │
                                                                  └─────────────────────────┘
```

### Step 1: Deploy Database (Neon.tech PostgreSQL)
1. Create a free account at [neon.tech](https://neon.tech).
2. Create a database named `habitquest`.
3. Copy the async connection string:
   ```bash
   DATABASE_URL=postgresql+asyncpg://<user>:<password>@<endpoint>.neon.tech/habitquest
   ```

### Step 2: Deploy Backend to Render (Free)
1. Push this repository to GitHub.
2. In Render, click **New Web Service** → Connect your repository.
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables:
   - `DATABASE_URL`: Your Neon PostgreSQL URL
   - `JWT_SECRET_KEY`: A secure random string
   - `BACKEND_CORS_ORIGINS`: `["https://yourdomain.com", "https://www.yourdomain.com"]`
5. Click **Deploy**. Render provides a URL like `habitquest-api.onrender.com`.

### Step 3: Deploy Frontend to Cloudflare Pages (Free)
1. In Cloudflare Dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Select your repository.
3. Build Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
4. Environment Variables:
   - `VITE_API_URL`: `https://api.yourdomain.com` (or your Render backend URL)
5. Click **Save and Deploy**.

### Step 4: Configure Cloudflare DNS & SSL
In your **Cloudflare Dashboard** → **DNS** → **Records**:

| Type | Name / Host | Target / Content | Proxy Status | Description |
| :--- | :--- | :--- | :--- | :--- |
| **CNAME** | `@` (root) | `<your-pages-subdomain>.pages.dev` | 🟠 Proxied | Points main domain to Cloudflare Pages |
| **CNAME** | `www` | `<your-pages-subdomain>.pages.dev` | 🟠 Proxied | Points `www` to Cloudflare Pages |
| **CNAME** | `api` | `habitquest-api.onrender.com` | 🟠 Proxied | Points `api.yourdomain.com` to FastAPI |

* In **SSL/TLS Settings**, set encryption mode to **Full (strict)**.

---

## 🧪 Running Automated Tests

```bash
cd backend
source venv/bin/activate
pytest -v
```

All 4 test suites (Authentication, duplicate registration prevention, habit lifecycle & completion check-ins, and cross-user privacy isolation) execute with 100% pass rate.
