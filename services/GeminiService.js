const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeError(response, request) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview'
    });

    const prompt = `
    You are an API error analysis system.

    Analyze the following API REQUEST and RESPONSE and return ONLY valid JSON.

    IMPORTANT RULES:
    - Output ONLY valid JSON (no markdown, no \`\`\`)
    - Do NOT include explanations
    - Do NOT include raw request/response in output

    IGNORE THESE TYPES OF ERRORS (DO NOT CREATE TICKETS FOR THEM):
    - Payload format errors
    - JSON structure errors
    - Missing required fields in request body
    - Validation errors caused by invalid request format
    - Serialization / deserialization errors
    - "INVALID_INPUT" caused by malformed payload
    - "format error", "schema error", "body parse error"

    If the error is one of the above:
    → Return:
    {
      "skip": true
    }

    Otherwise continue analysis.

    Your tasks (ONLY if NOT skipped):
    1. Identify root cause of the error
    2. Create a short, clear title
    3. Write a helpful description
    4. Assign severity: low | medium | high
    5. Generate a "fingerprint" for deduplication

    FINGERPRINT RULES:
    - Same error MUST generate SAME fingerprint
    - Do NOT include dynamic values (IDs, timestamps, request payload values)
    - Use stable identifiers only:
      - error type (e.g. http-method-not-allowed, auth-failed)
      - endpoint (if visible)
      - category of failure
    - lowercase and hyphen-separated

    OUTPUT FORMAT (ONLY if NOT skipped):
    {
      "title": "string",
      "description": "string",
      "severity": "low | medium | high",
      "fingerprint": "string"
    }

    ---

    REQUEST:
    ${request}

    ---

    RESPONSE:
    ${response}
    `;
    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (error) {
    console.error("Gemini Error:", error.message);
    throw error;
  }
}

// ✅ ADD THIS
module.exports = { analyzeError };