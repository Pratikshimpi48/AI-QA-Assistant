# Project Behavioral Rules & Security Constraints

## 🛑 STRICT JIRA READ-ONLY POLICY (CRITICAL)

1. **NO JIRA CREATION OR MUTATION**:
   - The application MUST NEVER issue `POST`, `PUT`, `PATCH`, or `DELETE` requests to Jira REST API endpoints to create, update, or modify tickets, user stories, issues, or comments on any official Jira board.
   - All AI-generated test cases and bug reports MUST remain strictly local to the application interface and local storage/database. They must NEVER be auto-posted or uploaded to Jira.

2. **READ-ONLY JIRA ACCESS ONLY**:
   - Jira API access is strictly limited to `GET` requests (`/rest/api/3/issue/{ticketId}`) for reading issue status, summary, and status change events (e.g. Jira Watchlist monitoring).

3. **USER DATA SAFETY**:
   - Always treat external Jira credentials (URL, Email, API Token) with extreme care. Provide copy-to-clipboard options for users to manually copy bug reports or test cases into Jira if they wish.
