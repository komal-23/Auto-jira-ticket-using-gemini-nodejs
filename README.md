# Auto Jira Ticket

An Express and MongoDB service that reads recent API error logs, uses Google
Gemini to analyze them, and creates Jira issues for actionable errors. Payload
and request-format errors identified by the AI are skipped. Jira issues are
checked for duplicates using an AI-generated fingerprint.

## What this project is

This project is a **generative-AI-powered error triage and Jira ticket
automation**. It calls Gemini, a large language model (LLM), to interpret log
request/response data and produce structured error analysis. The application
then uses regular, predefined backend logic to decide whether to skip the log
or create a Jira issue.

It is **not an autonomous AI agent**: it does not independently plan tasks,
choose tools, or run an agent loop. The LLM performs the analysis step; the
Express services control the workflow and interact with MongoDB and Jira.

## How it works

1. The API loads documents from the MongoDB `chm_logs` collection created in
   the last three hours.
2. Gemini analyzes each log's request and response and returns a title,
   description, severity, and fingerprint, or marks the log to be skipped.
3. The Jira service checks for an open issue with the same fingerprint and
   creates an issue when no duplicate is found.
4. The service attempts to assign the issue to a randomly selected assignable
   project user and transition it to **In Progress**.

The priority is selected from the ticket title and description. The active AI
integration is Gemini; `services/openaiService.js` is present but is not used
by the ticket workflow.

## Requirements

- Node.js and npm
- MongoDB with a `chm_logs` collection containing log documents with
  `created_at`, `Request`, and `Response` fields
- A Google Gemini API key
- A Jira Cloud account and API token with permission to search and create
  issues in the configured project

## Setup

1. Install dependencies:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` and set the values used by the application:

   | Variable | Description |
   | --- | --- |
   | `PORT` | HTTP port; defaults to `5000` |
   | `MONGO_URI` | MongoDB connection string |
   | `GEMINI_API_KEY` | Google Gemini API key |
   | `JIRA_HOST` | Jira site base URL, for example `https://your-company.atlassian.net` |
   | `JIRA_USERNAME` | Jira account email |
   | `JIRA_API_TOKEN` | Jira API token |
   | `JIRA_PROJECT_KEY` | Jira project key |
   | `JIRA_ISSUE_TYPE` | Jira issue type; defaults to `Task` |

   Keep credentials in `.env`; do not commit real secrets.

3. Start the development server:

   ```sh
   npm run dev
   ```

The server connects to MongoDB at startup and listens on the configured port.

## API

### Create tickets from recent logs

```http
POST /api/auto-jira-tickets/create-ticket
```

No request body is required.

On success, the response includes the number of logs loaded, a
`ticketsCreated` count, and a `data` array of Jira service results:

```json
{
  "success": true,
  "totalLogs": 2,
  "ticketsCreated": 1,
  "data": [{ "key": "PROJ-123" }]
}
```

If there are no logs in the time window, the API responds with HTTP `404`:

```json
{
  "success": false,
  "message": "No logs found"
}
```

Other unhandled errors are returned as JSON by the global Express error
handler. Individual log-processing errors are logged and do not stop the
remaining logs from being processed.

## Project layout

- `server.js` — Express application setup and server startup
- `routes/` — API route definitions
- `controllers/` — HTTP request and response handling
- `services/AutoJiraTicketService.js` — recent-log processing and ticket
  workflow
- `services/GeminiService.js` — AI error analysis
- `services/jiraServices.js` — Jira API operations
- `models/CHMLogs.js` — Mongoose model for the `chm_logs` collection
- `middleware/errorHandler.js` — centralized Express error responses