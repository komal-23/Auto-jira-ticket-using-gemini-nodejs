const CHMLogs = require("../models/CHMLogs");
const jiraServices = require("./jiraServices");
const { analyzeError } = require("./GeminiService");

async function createTicketsFromRecentLogs() {
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const logs = await CHMLogs.find({
    created_at: { $gte: threeHoursAgo },
  }).lean();

  const createdTickets = [];

  for (const log of logs) {
    try {
      const analysis = parseAnalysis(
        await analyzeError(log.Response, log.Request),
      );

      if (analysis.skip) {
        console.log("⛔ Skipping payload/format error ticket");
        continue;
      }

      const ticketData = {
        title: analysis.title,
        description: `
            Severity: ${analysis.severity || "N/A"}

            ${analysis.description}

            ======================
            📥 REQUEST:
            ======================
            ${log.Request}

            ======================
            📤 RESPONSE:
            ======================
            ${log.Response}
            `,
        fingerprint: analysis.fingerprint,
      };

      createdTickets.push(await jiraServices.createTicket(ticketData));
    } catch (error) {
      console.error("AI/Jira Error:", error.message);
    }
  }

  return {
    totalLogs: logs.length,
    createdTickets,
  };
}

function parseAnalysis(aiResponse) {
  let aiText =
    typeof aiResponse === "string"
      ? aiResponse
      : Object.values(aiResponse).join("");
  aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(aiText);
  } catch (error) {
    console.error("JSON Parse Error:", error);
    return {
      title: "AI Parsing Failed",
      description: aiText,
    };
  }
}

module.exports = { createTicketsFromRecentLogs };
