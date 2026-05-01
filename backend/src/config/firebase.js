const admin = require('firebase-admin');

const initializeFirebase = () => {
  if (admin.apps.length > 0) return admin;

  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });

  console.log('✅ Firebase Admin initialized');
  return admin;
};

const firebaseAdmin = initializeFirebase();
const db = firebaseAdmin.firestore();

module.exports = { admin: firebaseAdmin, db };
