# Security Policy 🛡️

We take the security of **AI QA Assistant** very seriously. We appreciate your efforts to responsibly disclose your findings and will make every effort to acknowledge your contributions.

---

## 🔒 Supported Versions

We provide security patches and updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

---

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability within this project, please **do NOT report it through a public GitHub Issue**. Publicly disclosing a vulnerability could put active users and systems at risk.

Instead, please send an email with the subject line `[SECURITY] AI QA Assistant Vulnerability` to:

📧 **pratikshimpi48@gmail.com**

### Please include the following details in your report:

1. **Type of issue**: (e.g., Cross-Site Scripting, SQL/NoSQL Injection, SSRF, Jira API token exposure, Authentication bypass).
2. **Steps to reproduce**: A detailed proof of concept (PoC), including sample inputs, HTTP request bodies, or code snippets.
3. **Potential impact**: Who or what is affected (e.g. user account compromise, data exfiltration).
4. **Suggested mitigation**: Any recommended code fix or configuration change, if you have one.

---

## ⏱️ Response Time & Disclosure Process

- **Initial Response**: We aim to acknowledge receipt of your report within **48 hours**.
- **Assessment**: We will evaluate the vulnerability and determine its severity and impact within **5 business days**.
- **Fix & Release**: We will work on a patch and coordinate a release timeline before public disclosure.
- **Credit**: You will be credited in the release notes unless you request anonymity.

---

## 🔐 Built-in Security Architecture & Best Practices

1. **User Credentials & Secrets**:
   - User passwords are never stored in plaintext. Passwords are encrypted with salted hashes using `bcryptjs` (cost factor 10).
   - Sessions are secured with JSON Web Tokens (JWT) verified on protected endpoints.
   - External API tokens (e.g. Jira API Token, Gemini API Key, Groq API Key) must **never** be checked into version control.

2. **Atlassian Jira Integration Safety**:
   - The application strictly prohibits automated AI Jira mutations. AI models cannot autonomously create, edit, or delete external tickets.
   - All Jira mutations (worklog submission, comment deletion) require an explicit user button click.
   - The system validates that comment deletions only apply to items authored by the user's connected Jira account ID.

3. **Data Sanitization**:
   - Express backend parses incoming JSON payloads with safe body size limits.
   - MongoDB queries and in-memory operations are parameterized to prevent injection attacks.
