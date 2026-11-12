const axios = require("axios");
const config = require("../config/jiraConfig");

class jiraServices {
  client() {
    return axios.create({
      baseURL: config.baseURL,
      auth: {
        username: config.username,
        password: config.apiToken,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async getAssignableUsers() {
    try {
      const res = await this.client().get(
        "/rest/api/3/user/assignable/search",
        {
          params: { project: config.projectKey },
        },
      );
      return res.data;
    } catch (err) {
      console.error("Fetch users error:", err.response?.data || err.message);
      return [];
    }
  }

  async getRandomAssignee() {
    const users = await this.getAssignableUsers();
    if (users.length > 0) {
      const random = users[Math.floor(Math.random() * users.length)];
      return random.accountId;
    }
    return null;
  }

  getPriority(data) {
    const text = (data.title + " " + data.description).toLowerCase();

    if (text.includes("critical") || text.includes("payment")) return "Highest";
    if (text.includes("error") || text.includes("fail")) return "High";
    if (text.includes("warning")) return "Medium";
    return "Low";
  }

	async createTicket(data) {
		console.log("Creating ticket with data:", data);

		try {
			const duplicate = await this.findDuplicateTicket(data.fingerprint);

			if (duplicate) {
				console.log("⛔ Duplicate ticket found:", duplicate.key);
				return {
					skipped: true,
					issueKey: duplicate.key,
					message: "Duplicate ticket already exists",
				};
			}

			const assigneeId = await this.getRandomAssignee();

			const fields = {
			project: { key: config.projectKey },
			summary: data.title,

			// Jira requires ADF format
			description: {
				type: "doc",
				version: 1,
				content: [
				{
					type: "paragraph",
					content: [
					{
						type: "text",
						text: data.description,
					},
					],
				},
				],
			},

			issuetype: { name: config.issueType },
			priority: { name: this.getPriority(data) },

			// ✅ STORE FINGERPRINT (IMPORTANT)
			labels: [
				`fp-${data.fingerprint}`
			],
			};

			if (assigneeId) {
				fields.assignee = { id: assigneeId };
			}

			const res = await this.client().post("/rest/api/3/issue", { fields });

			const issueKey = res.data.key;

			if (issueKey) {
				await this.updateTicketStatus(issueKey, "In Progress");
			}

			return res.data;
		} catch (err) {
			console.error("Create ticket error:", err.response?.data || err.message);
			return null;
		}
	}
  	async findDuplicateTicket(fingerprint) {
		try {
			if (!fingerprint) return null;

			const jql = `project = ${config.projectKey} AND labels = "fp-${fingerprint}" AND statusCategory != Done ORDER BY created DESC`;

			const res = await this.client().get("/rest/api/3/search/jql", {
			params: {
				jql,
				fields: "key,summary",
			},
			});

			const issues = res.data.issues || [];

			return issues.length ? issues[0] : null;
		} catch (err) {
			console.error("Jira Search Error:", err.response?.data || err.message);
			return null;
		}
	}
  async updateTicketStatus(issueKey, status) {
    try {
      const res = await this.client().get(
        `/rest/api/3/issue/${issueKey}/transitions`,
      );
      const transitions = res.data.transitions;

      const match = transitions.find(
        (t) => t.name.toLowerCase() === status.toLowerCase(),
      );

      if (!match) {
        console.error("Status not found:", status);
        return false;
      }

      await this.client().post(`/rest/api/3/issue/${issueKey}/transitions`, {
        transition: { id: match.id },
      });

      return true;
    } catch (err) {
      console.error("Update status error:", err.response?.data || err.message);
      return false;
    }
  }
}

module.exports = new jiraServices();
