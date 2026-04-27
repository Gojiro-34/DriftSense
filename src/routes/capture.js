const express = require("express");
const { db, admin } = require("../config/firebase");
const { generateText } = require("../config/gemini");

const router = express.Router();

/**
 * POST /api/capture
 *
 * Accepts a message from any source (Slack, Gmail, Notion, manual entry).
 * 1. Writes the raw message to the "messages" collection (processed: false).
 * 2. Uses Gemini to extract decisions, commitments, or promises.
 * 3. Stores extracted items in the Firestore "commitments" collection.
 * 4. Marks the message as processed: true after extraction.
 *
 * Body: { source, message, sender, timestamp }
 * Returns: { extracted, commitment }
 */
router.post("/", async (req, res) => {
  try {
    const { source, message, sender, timestamp } = req.body;

    // --- Validation ---
    if (!source || !message || !sender || !timestamp) {
      return res.status(400).json({
        error: "Missing required fields: source, message, sender, timestamp",
      });
    }

    const validSources = ["slack", "gmail", "notion", "manual"];
    if (!validSources.includes(source)) {
      return res.status(400).json({
        error: `Invalid source. Must be one of: ${validSources.join(", ")}`,
      });
    }

    // --- Step 1: Write raw message to "messages" collection ---
    const messageDoc = {
      source,
      sender,
      content: message,
      processed: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const messageRef = await db.collection("messages").add(messageDoc);
    console.log(`📨 Message stored: ${messageRef.id}`);

    // --- Step 2: Gemini Extraction ---
    const prompt = `You are an AI assistant for a startup founding team context-sync tool called CoFounder.

Analyze the following message and determine if it contains any decisions, commitments, or promises made by the sender.

Message source: ${source}
Sender: ${sender}
Timestamp: ${timestamp}
Message: "${message}"

If the message contains a commitment, decision, or promise, extract it and respond with ONLY a valid JSON object in this exact format:
{
  "extracted": true,
  "commitment": {
    "text": "Brief description of the commitment/decision/promise",
    "owner": "${sender}",
    "deadline": "Extracted or inferred deadline, or null if none mentioned",
    "source": "${source}",
    "relatedTo": "investor" | "customer" | "feature" | "other"
  }
}

For "relatedTo", classify the commitment:
- "investor" if it relates to investors, fundraising, board, or financial reporting
- "customer" if it relates to customers, sales, or support
- "feature" if it relates to product features, engineering, or technical work
- "other" for anything else

If the message does NOT contain any commitment, decision, or promise, respond with ONLY:
{
  "extracted": false,
  "commitment": null
}

Respond with ONLY the JSON object, no markdown formatting, no code fences, no extra text.`;

    const geminiResponse = await generateText(prompt);

    // Parse Gemini's JSON response
    let result;
    try {
      // Strip any markdown code fences if Gemini includes them
      const cleanedResponse = geminiResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      result = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", geminiResponse);
      return res.status(500).json({
        error: "Failed to parse AI response",
        raw: geminiResponse,
      });
    }

    // --- Step 3: Store in Firestore if a commitment was extracted ---
    if (result.extracted && result.commitment) {
      const now = admin.firestore.FieldValue.serverTimestamp();

      const commitmentData = {
        text: result.commitment.text,
        owner: result.commitment.owner || sender,
        source,
        sender,
        deadline: result.commitment.deadline || null,
        status: "pending",
        relatedTo: result.commitment.relatedTo || "other",
        rawMessage: message,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await db.collection("commitments").add(commitmentData);
      result.commitment.id = docRef.id;
      console.log(`📋 Commitment stored: ${docRef.id}`);
    }

    // --- Step 4: Mark the message as processed ---
    await messageRef.update({ processed: true });
    console.log(`✅ Message ${messageRef.id} marked as processed`);

    return res.status(200).json({
      ...result,
      messageId: messageRef.id,
    });
  } catch (error) {
    console.error("Error in /api/capture:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
