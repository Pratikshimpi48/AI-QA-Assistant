# AI QA Assistant – Project Status

> **Last Updated:** 2026-07-29
> **Current Sprint:** Stories 1–3 Complete

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Routing | React Router v7 |
| Backend | Express.js 5 |
| Environment | dotenv |
| Dev Tooling | nodemon, Vite proxy (`/api` → `localhost:5000`) |
| Database | Mongoose (installed, **not connected**) |
| AI Provider | Gemini (planned, **not integrated**) |

---

## ✅ Stories Completed

### Story 1 – Frontend Setup ✅
- React 19 + Vite 8 initialized
- Tailwind CSS v4 installed and configured via `@tailwindcss/vite` plugin
- React Router v7 — `BrowserRouter` in `main.jsx`, `Routes` in `App.jsx`
- Vite dev proxy: `/api/*` → `http://localhost:5000`
- Dark-mode design tokens in `index.css`
- Keyframe animations: `fadeInUp`, `pulse-glow`, `gradient-shift`, `float`, `spin-slow`
- Google Fonts (Inter) + SEO meta tags in `index.html`

**Key Files:**
```
client/
├── index.html              ← SEO title, meta description, Google Fonts
├── vite.config.js          ← Tailwind plugin + /api proxy
└── src/
    ├── index.css           ← Tailwind v4 import + design tokens + animations
    ├── main.jsx            ← BrowserRouter wrapper
    └── App.jsx             ← React Router shell (Routes)
```

---

### Story 2 – Backend Setup ✅
- Express.js 5 server entry point
- CORS configured (origin-locked to `CLIENT_URL` from `.env`)
- `express.json()` body parser (10 MB limit)
- `GET /api/health` → `{ status, message, timestamp, environment, version }`
- Global 404 handler
- Global error handler
- Centralised env loader (`src/config/env.js`)
- `npm run dev` (nodemon) + `npm start` scripts
- `.env` + `.env.example` for environment management

**Key Files:**
```
server/
├── .env                    ← Development defaults (PORT=5000, NODE_ENV=development)
├── .env.example            ← Template for new developers
└── src/
    ├── index.js            ← Express entry point (CORS, middleware, routes, listen)
    ├── config/
    │   └── env.js          ← Centralised dotenv loader
    └── routes/
        └── health.js       ← GET /api/health
```

**Verified:** `curl http://localhost:5000/api/health` returns:
```json
{ "status": "ok", "message": "AI QA Assistant API is running", "environment": "development", "version": "1.0.0" }
```

---

### Story 3 – Home Page ✅
- Sticky glassmorphism Navbar with gradient logo mark + brand name
- Animated hero section — gradient-shifting headline, "Powered by Gemini AI" badge
- 3 Feature pills — Instant Generation, High Coverage, Export Ready *(display only)*
- Requirements textarea — paste text, character counter, focus highlight
- Drag-and-drop file upload zone — `.txt`, `.pdf`, `.docx`, `.md`, `.csv` *(UI only)*
- "Generate Test Cases" CTA button — glows when active, spinner on click *(mock 1.5s delay)*
- "How it works" — 3-step responsive grid
- Fully responsive — 320px mobile to 1440px+ desktop

**Key Files:**
```
client/src/
├── components/
│   └── Navbar.jsx          ← Sticky glassmorphism navbar
└── pages/
    └── HomePage.jsx        ← Full home page (hero, textarea, file upload, CTA)
```

---

## ⚠️ UI-Only Placeholders

> These **look** functional but perform no real action yet.

| UI Element | Current Behaviour | Target Behaviour |
|---|---|---|
| "Generate Test Cases" button | 1.5s mock delay, then nothing | Call `POST /api/generate` with requirements |
| File Upload zone | Stores filename in React state only | Parse file → send content to backend |
| "Export Ready" pill | Static text | Trigger CSV / Excel / Jira export |

---

## ❌ Not Built Yet

### 🤖 AI Integration
- [ ] Gemini API SDK (`@google/generative-ai`) not installed
- [ ] `GEMINI_API_KEY` is a placeholder in `.env.example` only
- [ ] No prompt template or system prompt
- [ ] No token/cost management or retry logic

### 🔌 Backend APIs
- [ ] `POST /api/generate` — receive requirements → call Gemini → return test cases
- [ ] `POST /api/upload` — accept file → parse content → extract requirements
- [ ] `GET /api/history` — return past generation runs
- [ ] `DELETE /api/history/:id` — delete a history record

### 📄 File Parsing
- [ ] `multer` — multipart file upload middleware
- [ ] `pdf-parse` — PDF → plain text
- [ ] `mammoth` — DOCX → plain text
- [ ] `.txt` / `.md` / `.csv` stream reader

### 🖥️ Frontend Pages
- [ ] Results Page (`/results`) — display generated test cases in structured table
- [ ] Test Case inline editor — edit, reorder, delete individual cases
- [ ] History Page (`/history`) — list all past runs
- [ ] Export UI — download as `.csv` / `.xlsx` or push to Jira
- [ ] Toast notifications for success / error states

### 💾 Database
- [ ] MongoDB connection (`MONGO_URI` env var, Mongoose `.connect()`)
- [ ] `TestRun` schema — `{ requirements, fileName, testCases, createdAt }`
- [ ] History persistence across sessions

### 🔐 Auth
- [ ] User registration / login
- [ ] JWT / session management
- [ ] Per-user data isolation

---

## 🗺️ Upcoming Stories

| Story | Feature | Depends On |
|---|---|---|
| **Story 4** | `POST /api/generate` — Gemini AI integration | Story 2 |
| **Story 5** | File upload pipeline (multer + parsers) | Story 4 |
| **Story 6** | Results Page — display test cases | Story 4 |
| **Story 7** | Export — CSV / Excel / Jira | Story 6 |
| **Story 8** | MongoDB + History Page | Story 4 |
| **Story 9** | Auth — login, JWT, user isolation | Story 8 |

---

## 🚀 How to Run

```bash
# Terminal 1 – Backend
cd server
npm run dev
# Runs on http://localhost:5000

# Terminal 2 – Frontend
cd client
npm run dev
# Runs on http://localhost:3000
```

> Both servers must be running simultaneously.
> The frontend proxies all `/api/*` calls to the backend automatically.

---

## 📁 Full Project Structure

```
AI-QA-Assistant/
├── PROJECT_STATUS.md           ← ← ← This file
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.css
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── assets/
│       ├── components/
│       │   └── Navbar.jsx
│       └── pages/
│           └── HomePage.jsx
└── server/
    ├── .env
    ├── .env.example
    ├── package.json
    └── src/
        ├── index.js
        ├── config/
        │   └── env.js
        └── routes/
            └── health.js
```
