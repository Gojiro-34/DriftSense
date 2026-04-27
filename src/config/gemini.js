const { GoogleGenAI } = require("@google/genai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error("⚠️  GEMINI_API_KEY is not set in environment variables.");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Call Gemini 2.0 Flash with a prompt and return the text response.
 * @param {string} prompt - The prompt to send to Gemini
 * @returns {Promise<string>} - The model's text response
 */
async function callGemini(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  return response.text;
}

module.exports = { callGemini };
