const admin = require("firebase-admin");

/**
 * Initialize Firebase Admin SDK.
 * On Cloud Run, uses Application Default Credentials automatically.
 * Locally, uses the service account file specified in GOOGLE_APPLICATION_CREDENTIALS.
 */
function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.firestore();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Local development with service account file
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId,
    });
  } else {
    // Cloud Run — uses default credentials automatically
    admin.initializeApp({ projectId });
  }

  const db = admin.firestore();
  return db;
}

const db = initializeFirebase();

module.exports = { db, admin };
