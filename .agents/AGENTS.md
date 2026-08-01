# Project Behavioral Rules & Security Constraints

## 🛑 JIRA INTERACTION POLICY & USER-INITIATED CONTROL

1. **NO AUTOMATED AI JIRA MUTATIONS**:
   - Automated scripts, background tasks, and AI subagents MUST NEVER issue `POST`, `PUT`, `PATCH`, or `DELETE` requests to Jira REST API endpoints automatically or without explicit user button clicks on the frontend UI.
   - All AI-generated test cases and bug reports remain local to the application database until explicitly managed or exported by the user.

2. **USER-INITIATED JIRA COMMENT DELETION & POSTING**:
   - The frontend UI allows the user to explicitly post work logs or delete comments authored ONLY by their connected Jira account ID (`jiraEmail` / user account) when they click the frontend button (`DELETE /rest/api/3/issue/{ticketId}/comment/{commentId}`).
   - The application MUST NEVER modify or delete comments belonging to other Jira users under any circumstance.

3. **USER DATA SAFETY**:
   - Always treat external Jira credentials (URL, Email, API Token) with extreme care.
