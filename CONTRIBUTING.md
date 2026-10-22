# Contributing to AI QA Assistant 🚀

Thank you for your interest in contributing to **AI QA Assistant**! We are building a modern, privacy-first, developer-friendly platform that empowers Quality Assurance engineers, SDETs, and development teams with AI-driven test case generation, structured bug reports, Jira time-tracking, and test matrix management.

Whether you're fixing a typo, resolving a bug, introducing support for an additional AI provider, or building new QA export formats, your contributions are warmly welcome!

---

## 📜 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [Project Architecture](#-project-architecture)
- [Jira Security & Safety Policy](#-jira-security--safety-policy)
- [Commit Message Guidelines](#-commit-message-guidelines)
- [Submitting a Pull Request](#-submitting-a-pull-request)
- [Ideas for Contribution](#-ideas-for-contribution)

---

## 🤝 Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior according to our security and conduct guidelines.

---

## 👑 Project Ownership & Production Merging Policy

- **Sole Project Owner**: **AI QA Assistant** is created, architected, and owned by **Pratik Shimpi** ([@Pratikshimpi48](https://github.com/Pratikshimpi48)).
- **Zero Direct Production Access**: Open-source contributors do **NOT** have direct write or push access to the production `main` branch.
- **Required Owner Review**: All code changes must be submitted via a GitHub Pull Request from your personal fork. The Pull Request must pass automated CI checks and receive explicit review and approval from **Pratik Shimpi** before being merged to production.
- **Contributor Recognition**: We celebrate all community contributions! Merged contributors are permanently recognized in [CONTRIBUTORS.md](CONTRIBUTORS.md) and in the git history.

---

## 🛠 Prerequisites

Before getting started, make sure you have the following installed:

- **Node.js**: `v18.0.0` or higher (LTS recommended)
- **npm**: `v9.0.0` or higher (bundled with Node.js)
- **Git**: Installed and configured on your machine
- **AI API Key**: At least one free API key:
  - [Google Gemini API Key](https://aistudio.google.com/) *(Recommended, Free)*
  - [Groq API Key](https://console.groq.com/) *(Free tier)*
- *(Optional)* **MongoDB**: If you wish to use a local or cloud MongoDB instance. (Not required — the app includes an automatic in-memory fallback!)

---

## 🚀 Getting Started

### 1. Fork & Clone

1. Fork the repository on GitHub by clicking the **Fork** button.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/AI-QA-Assistant.git
   cd AI-QA-Assistant
   ```

### 2. Install Dependencies

Install all dependencies across the root, client, and server workspaces in a single command:

```bash
npm run install:all
```

*(Alternatively, you can run `npm install` in the root, `client/`, and `server/` directories individually).*

### 3. Environment Configuration

Copy the sample environment file to the server directory:

```bash
cp .env.example server/.env
```

Open `server/.env` in your editor and add your AI API key:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
JWT_SECRET=your_super_secret_jwt_key
ADMIN_EMAIL=admin@example.com

# Provide at least one API key:
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Run the Development Server

Start both the Vite frontend (`localhost:3000`) and Express backend (`localhost:5000`) concurrently:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser. The frontend proxy will automatically route all `/api/*` calls to the Express backend.

---

## 💻 Development Workflow

- **Frontend dev only**: `npm run dev:client`
- **Backend dev only**: `npm run dev:server` (runs with `nodemon` auto-reload)
- **Linting**: `npm run lint`
- **Client Build Test**: `npm run build:client`
- **View In-Memory DB**: `npm run db:view`

---

## 🏗 Project Architecture

```
AI-QA-Assistant/
├── client/                 # React 19 + Vite 8 Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI elements (Navbar, ExportButton, Modals)
│   │   ├── context/        # React contexts (AuthContext, ThemeContext, NotificationContext)
│   │   ├── pages/          # Application views (HomePage, BugReportPage, JiraWorklogPage, etc.)
│   │   ├── services/       # Axios API client & endpoints
│   │   └── utils/          # Export utilities (XLSX, CSV) and Guest storage
│   └── vite.config.js      # Vite configuration & proxy
├── server/                 # Express.js 5 Backend
│   ├── src/
│   │   ├── config/         # Environment variables & MongoDB / In-memory DB setup
│   │   ├── middleware/     # JWT authentication & admin authorization
│   │   ├── models/         # Mongoose & In-Memory hybrid models (User, History, Template)
│   │   ├── routes/         # REST API routes (/api/auth, /api/generate, /api/jira, etc.)
│   │   └── services/       # AI providers (Gemini, Groq), prompt builders, Jira poller
│   └── package.json
├── scripts/                # Build and distribution utilities
├── .github/                # Workflows (CI) & Issue/PR templates
├── CONTRIBUTING.md         # Contribution guidelines
├── LICENSE                 # MIT License
└── README.md               # Main project documentation
```

---

## 🛑 Jira Security & Safety Policy

When developing or modifying features interacting with the Atlassian Jira REST API, you **must adhere to these strict behavioral rules**:

1. **NO Automated AI Jira Mutations**: AI generators or background tasks must **never** automatically issue `POST`, `PUT`, `PATCH`, or `DELETE` calls to external Jira instances. All test cases and bug reports must remain local until explicitly exported or posted by the user.
2. **User-Initiated Actions Only**: Jira comment posting, worklog creation, and deletion must only occur when the user explicitly triggers them via the UI.
3. **User Account Isolation**: When interacting with Jira comments, mutations must only ever target comments authored by the authenticated user's account ID (`jiraEmail`). Never modify or delete comments authored by other team members.
4. **Credential Privacy**: Never commit or hardcode Jira API tokens, URLs, or personal access tokens in test files or sample configs.

---

## 📝 Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` A new user-facing feature
- `fix:` A bug fix
- `docs:` Documentation updates
- `style:` Formatting, missing semi-colons, etc. (no code change)
- `refactor:` Refactoring production code without changing behavior
- `test:` Adding or refactoring tests
- `chore:` Updating build tasks, package manager configs, etc.

*Example:*
```bash
git commit -m "feat(jira): add batch CSV export support for worklog history"
```

---

## 🔄 Submitting a Pull Request

1. **Create a branch**:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. **Make your changes** and verify code quality:
   ```bash
   npm run lint
   npm run build:client
   ```
3. **Commit your changes** following conventional commit standards.
4. **Push your branch**:
   ```bash
   git push origin feat/your-feature-name
   ```
5. **Open a Pull Request**:
   - Title your PR clearly (e.g. `feat: add custom report template for ISO 29119`).
   - Fill out the provided [Pull Request Template](.github/pull_request_template.md).
   - Link any related issues (e.g. `Closes #12`).

---

## 💡 Ideas for Contribution

Looking for a place to start? Here are some great areas:
- 🧪 **Test Suite**: Add Vitest / React Testing Library unit tests for UI components.
- 🤖 **Additional AI Providers**: Add support for Claude (Anthropic), OpenAI, or local Ollama models.
- 📋 **QA Templates**: Add standard templates (e.g. BDD / Gherkin format, GAMP 5, ISO/IEC/IEEE 29119).
- 🔌 **Integrations**: Add export connectors for GitHub Issues, Azure DevOps, or TestRail.
- 🎨 **Accessibility (a11y)**: Audit and enhance screen reader and keyboard accessibility across complex tables.

Thank you for helping make QA engineering faster, smarter, and more enjoyable for everyone!
