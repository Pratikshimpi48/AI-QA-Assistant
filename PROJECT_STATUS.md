# AI QA Assistant – Project Status

> **Last Updated:** 2026-08-03  
> **Current Status:** All Core Features, User Authentication, Temporary Guest Sessions, AI Integrations, Jira Time Tracking & Worklog Engine, Persistent Jira Watchlist, Admin & Template Management Module, Theme Engine, & Cloud Production Deployment Fully Implemented ✅  
> **Live Production URL:** https://ai-qa-assistant-ueec.onrender.com/

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) + Custom Glassmorphism System & Multi-Theme Engine |
| Routing | React Router v7 (`BrowserRouter`, `Routes`, `Route`, `ProtectedRoute`) |
| Backend | Express.js 5 (Express 5 safe wildcard route handler) |
| Environment | dotenv (`.env`) |
| Authentication | JWT (`jsonwebtoken`) + Password Hashing (`bcryptjs`) |
| Authorization & Access | Role-Based Access Control (Admin vs Standard User) + Admin Owner Auto-Provisioning (`pratikshimpi48@gmail.com`) |
| Temporary Guest Storage | Browser `sessionStorage` (`ai_qa_guest_session`) |
| Data Export | SheetJS (`xlsx`) for `.xlsx` and `.csv` exports + Custom Enterprise Matrix Templates |
| Dev Tooling | nodemon, Vite dev proxy (`/api` → `http://localhost:5000`) |
| Database Layer | Mongoose (MongoDB) + Automatic Fast In-Memory Fallback Engine |
| AI Providers | Google Gemini 2.0 Flash (`@google/generative-ai` with 8KB token budget & auto JSON repair) + Groq Llama 3.3 70B (`groq-sdk`) with Auto-Fallback |
| Production Hosting | Render Cloud Single-Service Architecture (Static Client Distribution + Express API) |

---

## ✅ Features & User Stories Completed

### 1. Frontend Setup, Design System & Multi-Theme Engine ✅
- React 19 + Vite 8 initialized with `@tailwindcss/vite` plugin.
- Dynamic theme engine supporting working multi-theme selector (Dark Glassmorphism, Cyberpunk Neon, Light Mode, Midnight Blue, etc.).
- Header UX redesign: Logo far-left alignment, responsive nav link spacing, unified Jira AI Hub dropdown, theme switcher, notification bell popover, and single-line Log Out button.
- Keyframe animations (`fadeInUp`, `pulse-glow`, `gradient-shift`, `spin-slow`).
- Google Fonts (Inter) & SEO meta tags.

### 2. Backend Express API Setup & Production Cloud Deployment ✅
- Express 5 entry point with CORS configuration and 10MB JSON body limits.
- Centralised dotenv configuration loader (`src/config/env.js`).
- Static client distribution serving (`client/dist`) for single-service cloud deployment on Render.
- Express 5 path-to-regexp safe middleware wildcard fallback (`app.get(/^(?!\/api).*/, ...)`).
- Health check route (`GET /api/health`). Global 404 and 500 error handlers.

### 3. AI Engine Integration & Multi-LLM Resilience System ✅
- Google Gemini 2.0 Flash SDK (`@google/generative-ai`) with `maxOutputTokens` increased to 8192.
- Groq Llama 3.3 70B SDK (`groq-sdk`).
- **Truncated JSON Repair & Robust Extractor**: Regex JSON extractor and automated syntax repair parser in `promptBuilder.js` for truncated completions.
- **Automatic Fallback Mechanism**: Seamless failover to secondary provider on rate limits (429) or API errors.
- AI Provider status endpoint (`GET /api/generate/providers`).

### 4. AI Test Case Generator (`POST /api/generate`) ✅
- Accepts raw requirement text or document specs.
- Produces structured positive, negative, edge case, and security test cases.
- Live results table on `HomePage.jsx` with priority & type badges.

### 5. AI Bug Report Generator (`POST /api/bug-report/generate`) ✅
- `BugReportPage.jsx` for issue description or log input.
- Generates structured Jira/GitHub ready bug tickets (Title, Severity, Environment, Summary, Steps to Reproduce, Expected vs Actual Behavior, Workaround).
- 1-click "Copy Bug Report to Clipboard".

### 6. AI-Powered Jira Work Log & Time Tracking System (`/jira-worklog`) ✅
- **Dual Mode Workflow Switcher**: Toggle seamlessly between **Single Ticket AI Worklog Generator** and **Batch CSV Worklog Upload**.
- **Batch CSV Worklog Upload & Parser**:
  - Drag-and-drop or file upload zone for `.csv` worklog files.
  - Auto-normalizing header parser supporting standard and custom CSV headers (`Date`, `Ticket ID`, `Jira Worklog`, `Hours`, `Status`, `Ticket Key`, `Time Spent`).
  - 1-click **Download Sample CSV Template** (`jira_worklogs_template.csv`).
  - **Live CSV Batch Preview Table**: Live status badges (`Ready`, `Posting`, `Posted`, `Error`, `Invalid`), editable fields per row, and row removal controls.
  - **Bulk Post to Jira**: Sequential user-initiated worklog posting directly to Jira REST API (`POST /rest/api/3/issue/{ticketId}/worklog`).
  - **Save Batch to Local History**: Bulk save endpoint (`POST /api/jira/worklog/bulk-save`) storing CSV batch entries into local history database.
- **Progressive 2-Step Single Worklog Workflow**: Auto-opening configuration modal/form with progressive setup steps.
- **Strict User Account Comment Filtering**: Filters Jira ticket comments strictly by the connected user account ID (`jiraEmail`).
- **AI-Powered Work Description Generator**: Analyzes Jira ticket comments to automatically generate structured worklog summaries.
- **Live 50-50 Editor Grid**: Dual side-by-side view comparing original Jira user comments against the editable formatted Jira comment output.
- **Split Time Tracking Input**: Separate Hours and Minutes input fields matching official Jira work log dialog schemas.
- **Direct Jira REST API Integration**:
  - 1-click **Post Worklog to Jira**: Directly posts worklogs (`POST /rest/api/3/issue/{ticketId}/worklog`).
  - 1-click **User-Initiated Worklog Deletion**: Deletes posted worklogs directly from Jira (`DELETE /rest/api/3/issue/{ticketId}/worklog/{worklogId}`) and local database.
  - 1-click **User-Initiated Comment Deletion**: Deletes user comments from Jira (`DELETE /rest/api/3/issue/{ticketId}/comment/{commentId}`).
- **Local Worklog History**: Search bar, date range filters, auto-saving on Post, and deletion from local database history.

### 7. Persistent Jira Ticket Watchlist & Real-Time Alerts (`/jira-watchlist`) ✅
- Persistent Jira ticket watchlist with live polling and lifecycle monitoring.
- Restricted auto-release triggers (strictly enforcing release conditions on 'To Be Released' and 'Released' status changes).
- Navbar Notification Bell popover & dedicated `/notifications` page with real-time status change alerts.

### 8. Admin User Role System & Template Management Module (`/admin/templates`) ✅
- **Admin Access Control**: Role-Based Access Control (RBAC) with auto-provisioned owner account (`pratikshimpi48@gmail.com`).
- **Standard QA Report Templates**: IEEE 829 Standard Test Plan, OWASP Security Audit Matrix, Mozilla Bugzilla Report.
- **Interactive `TemplatePreviewModal`**: Full interactive preview of report templates and table structures before generation.
- **Custom Enterprise QA Excel Templates**:
  - **BuyAutoParts Enterprise QA Matrix**: Custom styled blue headers, section dividers, pre-conditions, and dropdown status selectors.
  - **Pratik Shimpi Template**: Customized matrix layout created by Admin.

### 9. User Authentication System (`POST /api/auth/register`, `POST /api/auth/login`) ✅
- Account registration with **Full Name**, **Email Address**, **Password**, **Confirm Password**, and **Date of Birth**.
- Validations: email syntax, duplicate email prevention (409 Conflict), password match, min password length (6 chars).
- Password security via `bcryptjs` salted hashing.
- JWT session issuance (`jsonwebtoken`) and persistent state management via `AuthContext.jsx`.
- Automatic Axios Authorization `Bearer <token>` request interceptor.
- Profile endpoint (`GET /api/auth/me`).

### 10. Personalized User Dashboard (`/dashboard`) ✅
- User Profile Banner (Name, Email, Date of Birth, Initials Avatar, Sign Out).
- Real-Time User Activity Statistics (Total Test Runs, Generated Test Cases, Generated Bug Reports, Estimated Hours Saved).
- Platform Capabilities Showcase Grid (4 interactive feature cards).
- 1-Click Quick-Start Requirement Templates (User Auth, Payment Gateway, Server Error Log).
- Interactive 3-step Getting Started Guide & recent activity stream.

### 11. User Data Isolation & History (`/history`) ✅
- Database layer (`server/src/config/db.js`) supporting MongoDB via Mongoose with an automatic fast in-memory store fallback.
- Test runs, bug reports, and work logs saved and isolated to the authenticated user's `userId`.
- History API (`GET /api/history`) and delete API (`DELETE /api/history/:id`).
- Filterable view (All, Test Cases, Bug Reports, Work Logs) with expandable details and record deletion.

### 12. Temporary Guest User Session Storage ✅
- Browser `sessionStorage` engine (`ai_qa_guest_session`) for unauthenticated users.
- Guest test runs and bug reports stored in browser tab memory.
- Guest session metrics and activity displayed on `/dashboard` and `/history`.
- Includes **Guest Session Active Banner** reminding guests to register to save data permanently before tab closure.
- Automatic cleanup when the browser tab/window is closed.

### 13. Export Functionality (.xlsx & .csv) & Export Preferences ✅
- Integrated SheetJS `xlsx` library in client app.
- **Configurable Default Export Format**: Settings Page (`/settings`) dropdown allowing users to set their default export preference (`Excel Spreadsheet` vs `CSV Document`).
- Reusable `ExportButton.jsx` dropdown component with active **Default** format badge indicator:
  - 📊 **Excel Spreadsheet (`.xlsx`)**
  - 📄 **CSV Document (`.csv`)**
- Integrated exports on Test Case Generator, Bug Report Generator, Work Log Engine, and History Page.

---

## 🌐 Production Cloud Deployment
- **URL:** https://ai-qa-assistant-ueec.onrender.com/
- Hosted as a single-service Node.js app on Render serving Vite frontend static assets and Express API endpoints.