const generateAiTickets = async (prompt) => {
    const aiResponse = await askOpenAI(prompt);

    if (typeof aiResponse === "string") {
    const clean = aiResponse.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
    }

    return aiResponse;
};
module.exports = { generateAiTickets };