const express = require("express");
const { db, admin } = require("../config/firebase");
const { callGemini } = require("../config/gemini");

const router = express.Router();

/**
 * GET /api/briefing/:founder
 *
 * Returns a personalized daily briefing for a specific founder (e.g. "paul" or "sam").
 * Caches the result in the "briefings" collection — one per founder per day.
 * If a briefing already exists for the founder today, returns the cached version.
 *
 * Returns: { founder, briefing, generatedAt }
 */
router.get("/:founder", async (req, res) => {
  try {
    const { founder } = req.params;

    if (!founder) {
      return res.status(400).json({ error: "Founder name is required" });
    }

    const founderLower = founder.toLowerCase();
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // --- Check cache: does a briefing already exist for this founder today? ---
    const cachedSnapshot = await db
      .collection("briefings")
      .where("founder", "==", founderLower)
      .where("date", "==", today)
      .limit(1)
      .get();

    if (!cachedSnapshot.empty) {
      const cachedDoc = cachedSnapshot.docs[0];
      const cachedData = cachedDoc.data();
      console.log(`📋 Returning cached briefing for ${founderLower} (${today})`);
      return res.status(200).json({
        founder: founderLower,
        briefing: {
          summary: cachedData.summary,
          actionItems: cachedData.actionItems,
        },
        totalCommitments: cachedData.totalCommitments || 0,
        cached: true,
        generatedAt: cachedData.createdAt,
      });
    }

    // --- No cache — generate a fresh briefing ---

    // Fetch all pending commitments
    const allSnapshot = await db
      .collection("commitments")
      .where("status", "==", "pending")
      .get();

    const allCommitments = [];
    allSnapshot.forEach((doc) => {
      allCommitments.push({ id: doc.id, ...doc.data() });
    });

    if (allCommitments.length === 0) {
      // Still save an empty briefing to cache
      const emptyBriefing = {
        founder: founderLower,
        date: today,
        summary: "No active commitments found. Your slate is clean!",
        actionItems: [],
        totalCommitments: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await db.collection("briefings").add(emptyBriefing);

      return res.status(200).json({
        founder: founderLower,
        briefing: {
          summary: emptyBriefing.summary,
          actionItems: [],
        },
        totalCommitments: 0,
        cached: false,
        generatedAt: new Date().toISOString(),
      });
    }

    // Separate the founder's own commitments from others'
    const ownCommitments = allCommitments.filter(
      (c) => c.owner?.toLowerCase() === founderLower
    );
    const othersCommitments = allCommitments.filter(
      (c) => c.owner?.toLowerCase() !== founderLower
    );

    const ownSummary =
      ownCommitments.length > 0
        ? ownCommitments
            .map(
              (c) =>
                `- "${c.text}" (deadline: ${c.deadline || "unspecified"}, source: ${c.source}, relatedTo: ${c.relatedTo || "other"})`
            )
            .join("\n")
        : "None";

    const othersSummary =
      othersCommitments.length > 0
        ? othersCommitments
            .map(
              (c) =>
                `- [${c.owner}] "${c.text}" (deadline: ${c.deadline || "unspecified"}, source: ${c.source}, relatedTo: ${c.relatedTo || "other"})`
            )
            .join("\n")
        : "None";

    const prompt = `You are an AI assistant for a startup founding team context-sync tool called CoFounder.

Generate a personalized daily briefing for founder "${founderLower}" for ${today}.

${founderLower}'s own commitments and promises:
${ownSummary}

Other founders' commitments that may affect ${founderLower}:
${othersSummary}

Create a concise, actionable daily briefing that:
1. Highlights ${founderLower}'s most urgent items for today
2. Flags anything from other founders that ${founderLower} should be aware of
3. Notes any upcoming deadlines
4. Calls out dependencies — things ${founderLower} is waiting on from others, or others are waiting on from ${founderLower}

Respond with ONLY a valid JSON object in this exact format:
{
  "summary": "A 2-3 sentence executive summary for ${founderLower}'s day",
  "actionItems": ["action item 1", "action item 2", "action item 3"]
}

Keep actionItems to a focused list of concrete next steps.
Respond with ONLY the JSON object, no markdown formatting, no code fences, no extra text.`;

    const geminiResponse = await callGemini(prompt);

    let briefingData;
    try {
      const cleanedResponse = geminiResponse
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      briefingData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", geminiResponse);
      return res.status(500).json({
        error: "Failed to parse AI response",
        raw: geminiResponse,
      });
    }

    // --- Save to "briefings" collection for caching ---
    const briefingDoc = {
      founder: founderLower,
      date: today,
      summary: briefingData.summary,
      actionItems: briefingData.actionItems || [],
      totalCommitments: ownCommitments.length,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("briefings").add(briefingDoc);
    console.log(`📋 Briefing cached for ${founderLower} on ${today}: ${docRef.id}`);

    return res.status(200).json({
      founder: founderLower,
      briefing: briefingData,
      totalCommitments: ownCommitments.length,
      cached: false,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in /api/briefing:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
