const express = require("express");
const { db, admin } = require("../config/firebase");

const router = express.Router();

/**
 * GET /api/commitments
 *
 * Returns all commitments from Firestore.
 * Optional query param: ?founder=paul|sam to filter by owner.
 *
 * Returns: { commitments: [...] }
 */
router.get("/", async (req, res) => {
  try {
    const { founder } = req.query;

    let query = db.collection("commitments").orderBy("createdAt", "desc");

    // Filter by founder if provided
    if (founder) {
      query = db
        .collection("commitments")
        .where("owner", "==", founder)
        .orderBy("createdAt", "desc");
    }

    const snapshot = await query.get();

    const commitments = [];
    snapshot.forEach((doc) => {
      commitments.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return res.status(200).json({ commitments });
  } catch (error) {
    console.error("Error in /api/commitments:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
