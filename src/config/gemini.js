const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001";

if (!OPENROUTER_API_KEY) {
  console.error("⚠️  OPENROUTER_API_KEY is not set in environment variables.");
  process.exit(1);
}

/**
 * Call OpenRouter chat completions API and return the text response.
 * @param {string} prompt - The prompt to send as a user message
 * @returns {Promise<string>} - The model's text response
 */
async function generateText(prompt) {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

module.exports = { generateText };
