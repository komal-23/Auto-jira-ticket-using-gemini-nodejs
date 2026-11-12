const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function analyzeError(response, request) {
  const prompt = `
  Analyze this API error:

  Response:
  ${response}

  Request:
  ${request}

  Return JSON:
  {
    "title": "",
    "description": "",
    "severity": "low | medium | high"
  }
`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an expert backend engineer." },
      { role: "user", content: prompt }
    ],
    temperature: 0.3
  });

  return res.choices[0].message.content;
}

module.exports = { analyzeError };