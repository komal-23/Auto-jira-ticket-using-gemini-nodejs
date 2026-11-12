const autoJiraTicketService = require("../services/AutoJiraTicketService");

exports.createTicket = async (req, res) => {
  const result = await autoJiraTicketService.createTicketsFromRecentLogs();

  if (result.totalLogs === 0) {
    const error = new Error("No logs found");
    error.statusCode = 404;
    throw error;
  }

  return res.json({
    success: true,
    totalLogs: result.totalLogs,
    ticketsCreated: result.createdTickets.length,
    data: result.createdTickets,
  });
};
