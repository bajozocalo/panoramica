import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize admin only once
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// HTTP endpoint for quick health check
export const healthCheck = functions.https.onRequest((req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// User creation trigger - give free credits
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const batch = admin.firestore().batch();

  const userRef = admin.firestore().collection('users').doc(user.uid);
  const transactionRef = admin.firestore().collection('transactions').doc();

  const freeCredits = 5;

  // Create user document
  batch.set(userRef, {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,

    // Credits & Usage
    credits: freeCredits,
    lifetimeCredits: freeCredits,
    totalGenerations: 0,
    totalImagesGenerated: 0,

    // Plan & Subscription
    plan: 'free',
    planLimits: {
      maxImagesPerGeneration: 3,
      maxGenerationsPerDay: 10
    },

    // Timestamps
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),

    // Settings
    preferences: {
      emailNotifications: true
    },

    // Metadata
    metadata: {
      onboardingCompleted: false
    }
  });

  // Create signup credit transaction
  batch.set(transactionRef, {
    userId: user.uid,
    type: 'signup',
    amount: freeCredits,
    balanceBefore: 0,
    balanceAfter: freeCredits,
    description: 'Welcome bonus credits',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await batch.commit();
});
