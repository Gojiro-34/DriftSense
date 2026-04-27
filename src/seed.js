/**
 * Firestore Seed Script
 *
 * Seeds the database with sample data for testing.
 * Run with: node src/seed.js
 */

require("dotenv").config();

const { db, admin } = require("./config/firebase");

const FieldValue = admin.firestore.FieldValue;

async function seed() {
  console.log("🌱 Seeding Firestore...\n");

  // -------------------------------------------------------------------------
  // 1. Seed "commitments" collection
  // -------------------------------------------------------------------------
  const commitments = [
    {
      text: "Feature X ships next week",
      owner: "paul",
      source: "gmail",
      sender: "paul",
      deadline: null,
      status: "pending",
      relatedTo: "investor",
      rawMessage: "Hey Sam, just told the investors that Feature X ships next week. Let's make it happen.",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    {
      text: "Feature X is unstarted, deprioritized",
      owner: "sam",
      source: "slack",
      sender: "sam",
      deadline: null,
      status: "pending",
      relatedTo: "feature",
      rawMessage: "FYI — I deprioritized Feature X. It's unstarted and we have bigger fish to fry right now.",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    {
      text: "Send updated MRR figures by Thursday",
      owner: "paul",
      source: "gmail",
      sender: "paul",
      deadline: "Thursday",
      status: "pending",
      relatedTo: "investor",
      rawMessage: "Reminder to myself: need to send updated MRR figures to the board by Thursday.",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
  ];

  console.log("📋 Seeding commitments...");
  for (const commitment of commitments) {
    const ref = await db.collection("commitments").add(commitment);
    console.log(`   ✅ ${commitment.text} (${ref.id})`);
  }

  // -------------------------------------------------------------------------
  // 2. Seed "messages" collection (raw messages corresponding to commitments)
  // -------------------------------------------------------------------------
  const messages = [
    {
      source: "gmail",
      sender: "paul",
      content: "Hey Sam, just told the investors that Feature X ships next week. Let's make it happen.",
      processed: true,
      createdAt: FieldValue.serverTimestamp(),
    },
    {
      source: "slack",
      sender: "sam",
      content: "FYI — I deprioritized Feature X. It's unstarted and we have bigger fish to fry right now.",
      processed: true,
      createdAt: FieldValue.serverTimestamp(),
    },
    {
      source: "gmail",
      sender: "paul",
      content: "Reminder to myself: need to send updated MRR figures to the board by Thursday.",
      processed: true,
      createdAt: FieldValue.serverTimestamp(),
    },
  ];

  console.log("\n📨 Seeding messages...");
  for (const msg of messages) {
    const ref = await db.collection("messages").add(msg);
    console.log(`   ✅ [${msg.source}] ${msg.sender}: "${msg.content.substring(0, 50)}..." (${ref.id})`);
  }

  console.log("\n🎉 Seeding complete!\n");
  console.log("Collections seeded:");
  console.log("  - commitments (3 docs)");
  console.log("  - messages    (3 docs)");
  console.log("\nCollections created on first use:");
  console.log("  - conflicts   (populated when GET /api/conflicts is called)");
  console.log("  - briefings   (populated when GET /api/briefing/:founder is called)");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
