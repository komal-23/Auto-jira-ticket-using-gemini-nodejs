require('dotenv').config();

module.exports = {
  baseURL: process.env.JIRA_HOST,
  username: process.env.JIRA_USERNAME,
  apiToken: process.env.JIRA_API_TOKEN,
  projectKey: process.env.JIRA_PROJECT_KEY,
  issueType: process.env.JIRA_ISSUE_TYPE || 'Task'
};