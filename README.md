# Saarthi – Navigate Your Workflow

Live Link: https://saarthi-production-8fe7.up.railway.app/login
> A full-stack collaborative project and task management platform with AI-powered assistance, real-time Kanban boards, and a role-based team system.

[![Backend](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-green)](https://nodejs.org)
[![Frontend](https://img.shields.io/badge/frontend-React%20%2B%20Vite-blue)](https://vitejs.dev)
[![Database](https://img.shields.io/badge/database-Firebase%20Firestore-orange)](https://firebase.google.com)
[![AI](https://img.shields.io/badge/AI-Groq%20API-purple)](https://console.groq.com)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **JWT Auth** | Register, login, protected routes |
| 📋 **Kanban Board** | Drag-free status columns (Todo / In Progress / Done) |
| 🤖 **AI Task Generator** | Generate smart subtasks using Groq LLM |
| 📊 **Analytics Dashboard** | Charts for task status and priority distribution |
| 👥 **Team Management** | Invite members to projects by email |
| 🎯 **Demo Mode** | Explore the full app without creating an account |
| 🌙 **Dark Mode** | Full dark/light theme toggle |
| ⚡ **Optimistic UI** | Instant feedback — server syncs in background |
| ⌨️ **Command Palette** | `Ctrl+K` / `Cmd+K` to navigate anywhere |

---

## 🏗️ Architecture

```
saarthi/
├── backend/                  # Express API
│   └── src/
│       ├── config/           # Firebase admin init
│       ├── middleware/       # JWT auth middleware
│       └── routes/           # auth, projects, tasks, dashboard, ai
│
└── frontend/                 # React + Vite
    └── src/
        ├── api/              # Axios client + all API calls
        ├── components/       # Reusable UI components
        │   ├── common/       # Buttons, modals, logo, etc.
        │   └── layout/       # Sidebar, AppLayout
        ├── contexts/         # AuthContext, ThemeContext
        ├── data/             # Demo mode mock data
        ├── hooks/            # Custom hooks
        ├── pages/            # Route-level page components
        └── utils/            # Helper functions
```

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Lucide Icons |
| State | React Context API |
| Backend | Node.js, Express.js |
| Database | Firebase Firestore (NoSQL) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| AI | Groq API (llama3 model) |
| Validation | express-validator |
| Logging | Morgan |
| Charts | Recharts |

---

## 🚀 Local Setup

### Prerequisites
- Node.js ≥ 18
- Firebase project with Firestore enabled
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone & install

```bash
git clone https://github.com/immohitsaraswat/saarthi.git
cd saarthi

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Configure backend environment

```bash
cd backend
cp .env.example .env
# Fill in all values in .env
```

Required variables:

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 8000) |
| `NODE_ENV` | `development` or `production` |
| `JWT_SECRET` | Random string ≥ 32 chars |
| `JWT_EXPIRES_IN` | Token lifetime e.g. `7d` |
| `FIREBASE_PROJECT_ID` | From Firebase project settings |
| `FIREBASE_CLIENT_EMAIL` | From Firebase service account |
| `FIREBASE_PRIVATE_KEY` | From Firebase service account (keep quotes + `\n`) |
| `CLIENT_URL` | Frontend URL for CORS |
| `GROQ_API_KEY` | From Groq console |

### 3. Configure frontend environment

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL to your backend URL
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL e.g. `http://localhost:8000/api` |

### 4. Run locally

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

App runs at: `http://localhost:5173`
API runs at: `http://localhost:8000`

---

## 🎮 Demo Mode

No account needed! Click **"Try Demo"** on the login page to explore:
- 2 sample projects with pre-loaded tasks
- Functional Kanban board (move tasks between columns)
- Team member panel
- Dashboard analytics

> Demo data is local-only — resets on page refresh. No data is sent to the server.

---

## 🚢 Deployment (Railway)

### Backend on Railway

1. Push code to GitHub
2. Create new Railway project → **Deploy from GitHub**
3. Select the `backend/` directory (or set root to `backend`)
4. Add all environment variables from `.env.example` in the Railway dashboard
5. Set `NODE_ENV=production`
6. Set `CLIENT_URL=https://YOUR_FRONTEND_URL`
7. Railway auto-detects `npm start` from `package.json`

### Frontend on Railway / Vercel

1. Deploy `frontend/` as a static site
2. Set `VITE_API_URL=https://YOUR_RAILWAY_BACKEND_URL/api`
3. Build command: `npm run build`
4. Output directory: `dist`

### ⚠️ Firebase Private Key on Railway

When adding `FIREBASE_PRIVATE_KEY` as a Railway environment variable:
- Paste the full key **with literal `\n`** (Railway handles it correctly)
- Keep the surrounding double quotes in the value

---

## 🔐 Security Notes

- JWT tokens are stored in `localStorage` (standard for SPAs)
- Tokens expire after 7 days by default
- Passwords are hashed with `bcryptjs` (salt rounds: 10)
- All authenticated routes require `Authorization: Bearer <token>`
- Firebase private key is **never** sent to the frontend
- `.env` is `.gitignore`d — never commit real credentials

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Create account |
| POST | `/api/auth/login` | ❌ | Login → returns JWT |
| GET | `/api/auth/me` | ✅ | Get current user |
| GET | `/api/projects` | ✅ | List user's projects |
| POST | `/api/projects` | ✅ | Create project |
| GET | `/api/projects/:id` | ✅ | Get project + members |
| GET | `/api/projects/:id/tasks` | ✅ | List project tasks |
| POST | `/api/projects/:id/tasks` | ✅ | Create task |
| PUT | `/api/tasks/:id` | ✅ | Update task |
| DELETE | `/api/tasks/:id` | ✅ | Delete task |
| GET | `/api/dashboard` | ✅ | Aggregate stats |
| POST | `/api/ai/generate-tasks` | ✅ | AI task generation |
| GET | `/health` | ❌ | Health check |

---

## 🤝 Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT © 2026 Saarthi
