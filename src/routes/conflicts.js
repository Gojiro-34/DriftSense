const express = require("express");
const { db, admin } = require("../config/firebase");
const { callGemini } = require("../config/gemini");

const router = express.Router();

/**
 * GET /api/conflicts
 *
 * Compares all commitments across founders.
 * Uses Gemini to detect misalignments, contradictions, or scheduling conflicts.
 * Saves detected conflicts to the "conflicts" collection with today's date.
 *
 * Returns: { conflicts: [{ description, severity, founders, relatedCommitments }] }
 */
router.get("/", async (req, res) => {
  try {
    // Fetch all pending commitments
    const snapshot = await db
      .collection("commitments")
      .where("status", "==", "pending")
      .get();

    const commitments = [];
    snapshot.forEach((doc) => {
      commitments.push({ id: doc.id, ...doc.data() });
    });

    if (commitments.length < 2) {
      return res.status(200).json({
        conflicts: [],
        message: "Not enough commitments to compare for conflicts.",
      });
    }

    // Group commitments by owner for Gemini analysis
    const commitmentSummary = commitments
      .map(
        (c) =>
          `- [${c.owner}] "${c.text}" (deadline: ${c.deadline || "unspecified"}, source: ${c.source}, relatedTo: ${c.relatedTo || "other"})`
      )
      .join("\n");

    const prompt = `You are an AI assistant for a startup founding team context-sync tool called CoFounder.

Here are all pending commitments made by the founding team:

${commitmentSummary}

Analyze these commitments and identify any conflicts, misalignments, contradictions, or scheduling issues between the founders. Consider:
1. Contradictory decisions (one founder says X, another says the opposite)
2. Overlapping deadlines that are unrealistic
3. Unclear ownership or duplicate responsibilities
4. Strategic misalignments (founders heading in different directions)

Respond with ONLY a valid JSON object in this exact format:
{
  "conflicts": [
    {
      "description": "Clear description of the conflict or misalignment",
      "severity": "high" | "medium" | "low",
      "founders": ["founder1", "founder2"],
      "relatedCommitments": ["brief text of commitment 1", "brief text of commitment 2"]
    }
  ]
}

If there are no conflicts, return: { "conflicts": [] }
Respond with ONLY the JSON object, no markdown formatting, no code fences, no extra text.`;

    const geminiResponse = await callGemini(prompt);

    let result;
    try {
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

    // --- Save each conflict to the "conflicts" collection ---
    const savedConflicts = [];
    if (result.conflicts && result.conflicts.length > 0) {
      for (const conflict of result.conflicts) {
        const conflictDoc = {
          commitmentA: conflict.relatedCommitments?.[0] || "",
          commitmentB: conflict.relatedCommitments?.[1] || "",
          description: conflict.description,
          severity: conflict.severity || "medium",
          resolved: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection("conflicts").add(conflictDoc);
        savedConflicts.push({ id: docRef.id, ...conflictDoc });
        console.log(`⚠️  Conflict saved: ${docRef.id}`);
      }
    }

    return res.status(200).json({
      conflicts: result.conflicts,
      savedCount: savedConflicts.length,
      date: new Date().toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Error in /api/conflicts:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
