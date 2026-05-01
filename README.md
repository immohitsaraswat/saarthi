# Saarthi – Navigate Your Workflow

Saarthi is a full-stack project and task management platform built for teams. It combines a real-time Kanban board, AI-powered task generation, and a role-based team system into a single cohesive tool. The name means "navigator" or "guide" in Hindi — fitting for something designed to keep you and your team on track.

**Live demo:** https://saarthi-production-8fe7.up.railway.app/login  
No account needed — click "Try Demo" to explore the full app instantly.

---

## What it does

The core of Saarthi is a Kanban board where tasks move between Todo, In Progress, and Done columns. What makes it more interesting is the AI layer: you describe a task, and it generates relevant subtasks using Groq's LLM API (llama3). It's genuinely useful rather than just a gimmick — especially for breaking down vague project briefs.

Beyond that:

- **Team collaboration** — invite members to projects by email, with role-based access
- **Analytics dashboard** — Recharts-powered views of task status and priority distribution across your projects
- **Command palette** — `Ctrl+K` / `Cmd+K` for fast navigation anywhere in the app
- **Optimistic UI** — state updates immediately; the server syncs in the background
- **Dark/light mode** — persisted across sessions

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Lucide Icons |
| State management | React Context API |
| Backend | Node.js, Express.js |
| Database | Firebase Firestore |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| AI | Groq API (llama3) |
| Charts | Recharts |
| Validation | express-validator |

---

## Project structure

```
saarthi/
├── backend/
│   └── src/
│       ├── config/        # Firebase admin init
│       ├── middleware/    # JWT auth
│       └── routes/        # auth, projects, tasks, dashboard, ai
│
└── frontend/
    └── src/
        ├── api/           # Axios client + API calls
        ├── components/    # Reusable UI (common + layout)
        ├── contexts/      # AuthContext, ThemeContext
        ├── data/          # Demo mode mock data
        ├── hooks/         # Custom hooks
        ├── pages/         # Route-level components
        └── utils/         # Helper functions
```

---

## Running locally

**Prerequisites:** Node.js >= 18, a Firebase project with Firestore enabled, and a Groq API key (free at [console.groq.com](https://console.groq.com)).

```bash
git clone https://github.com/immohitsaraswat/saarthi.git
cd saarthi

cd backend && npm install
cd ../frontend && npm install
```

### Backend environment

```bash
cd backend
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 8000) |
| `NODE_ENV` | `development` or `production` |
| `JWT_SECRET` | Random string, at least 32 chars |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `FIREBASE_PROJECT_ID` | From Firebase project settings |
| `FIREBASE_CLIENT_EMAIL` | From Firebase service account |
| `FIREBASE_PRIVATE_KEY` | From Firebase service account — keep quotes and `\n` intact |
| `CLIENT_URL` | Frontend URL (used for CORS) |
| `GROQ_API_KEY` | From Groq console |

### Frontend environment

```bash
cd frontend
cp .env.example .env
```

Set `VITE_API_URL` to your backend base URL, e.g. `http://localhost:8000/api`.

### Start both servers

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Frontend: `http://localhost:5173`  
API: `http://localhost:8000`

---

## Demo mode

Clicking "Try Demo" on the login page loads two sample projects with pre-populated tasks. You can move tasks across the Kanban board, view the analytics dashboard, and explore the team panel — all without hitting the server. Demo data lives in memory and resets on page refresh.

---

## API reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/projects` | Yes | List user's projects |
| POST | `/api/projects` | Yes | Create project |
| GET | `/api/projects/:id` | Yes | Get project + members |
| GET | `/api/projects/:id/tasks` | Yes | List tasks |
| POST | `/api/projects/:id/tasks` | Yes | Create task |
| PUT | `/api/tasks/:id` | Yes | Update task |
| DELETE | `/api/tasks/:id` | Yes | Delete task |
| GET | `/api/dashboard` | Yes | Aggregate stats |
| POST | `/api/ai/generate-tasks` | Yes | AI subtask generation |
| GET | `/health` | No | Health check |

---

## Deployment (Railway)

### Backend

1. Push to GitHub, then create a new Railway project and deploy from that repo
2. Set the root to `backend/` (or configure the service accordingly)
3. Add all environment variables from `.env.example` in the Railway dashboard
4. Set `NODE_ENV=production` and `CLIENT_URL` to your frontend URL
5. Railway picks up `npm start` from `package.json` automatically

**Firebase private key on Railway:** paste the full key with literal `\n` characters — Railway handles the line breaks correctly. Keep the surrounding double quotes.

### Frontend

Deploy `frontend/` as a static site on Railway or Vercel. Set `VITE_API_URL` to your backend URL, build with `npm run build`, and point the output to `dist/`.

---

## Security

- JWTs are stored in `localStorage` — standard practice for SPAs
- Tokens expire after 7 days by default
- Passwords are hashed with bcryptjs (10 salt rounds)
- All protected routes require `Authorization: Bearer <token>`
- The Firebase private key never leaves the backend
- `.env` is gitignored — don't commit credentials

---

## Contributing

Fork the repo, create a branch off `main`, and open a PR. Conventional commits preferred (`feat:`, `fix:`, `chore:` etc.).

---

MIT © 2026 Saarthi
