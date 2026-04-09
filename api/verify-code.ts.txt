import { VercelRequest, VercelResponse } from '@vercel/node';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const firestoreDatabaseId = process.env.FIREBASE_FIRESTORE_DATABASE_ID || '(default)';

if (admin.apps.length === 0) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (projectId) {
    admin.initializeApp({
      projectId: projectId
    });
    console.log(`Firebase Admin initialized for project: ${projectId}`);
  } else {
    console.error('FIREBASE_PROJECT_ID is missing in environment variables');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, code } = req.body;

  if (!uid || !code) {
    return res.status(400).json({ error: 'UID and code are required' });
  }

  try {
    const db = getFirestore(admin.app(), firestoreDatabaseId);
    
    console.log(`Attempting to verify code for UID: ${uid} in database: ${firestoreDatabaseId}`);
    
    const codeRef = db.collection('verification_codes').doc(uid);
    const codeDoc = await codeRef.get();

    if (!codeDoc.exists) {
      return res.status(404).json({ error: 'Verification code not found. Please request a new one.' });
    }

    const data = codeDoc.data();
    const now = new Date();
    const expiresAt = data?.expiresAt.toDate();

    if (now > expiresAt) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    if (data?.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Mark user as verified
    await db.collection('users').doc(uid).update({ isVerified: true });

    // Delete the code
    await codeRef.delete();

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error verifying code:', error);
    res.status(500).json({ 
      error: 'Failed to verify code', 
      details: error.message,
      code: error.code
    });
  }
}
