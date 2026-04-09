import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firestoreDatabaseId = '(default)';

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    firestoreDatabaseId = config.firestoreDatabaseId || '(default)';
    
    if (admin.apps.length === 0) {
      const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
      admin.initializeApp({
        projectId: config.projectId
      });
      console.log(`Firebase Admin initialized for project: ${config.projectId}. Database: ${firestoreDatabaseId}`);
    }
  } catch (error: any) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Firestore with the correct database ID
  const db = admin.apps.length > 0 ? getFirestore(admin.app(), firestoreDatabaseId) : null;

  // Startup Test Write
  if (db) {
    console.log('Running Firestore connectivity test...');
    db.collection('_server_health').doc('connection_test').set({
      lastCheck: new Date(),
      status: 'ok',
      databaseId: firestoreDatabaseId
    }).then(() => {
      console.log('✅ Firestore connectivity test successful');
    }).catch((err) => {
      console.error('❌ Firestore connectivity test FAILED:', err.message);
    });
  }

  // API Routes
  app.post('/api/send-verification', async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    try {
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('SMTP configuration is missing. Please add SMTP_HOST, SMTP_USER, and SMTP_PASS to your environment variables.');
      }

      console.log(`Sending verification code to ${email} in database: ${firestoreDatabaseId}`);

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"SalesPulse" <noreply@salespulse.app>',
        to: email,
        subject: 'Your Verification Code',
        text: `Your verification code is: ${code}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #141414;">Verify Your Email</h2>
            <p>Thank you for signing up! Please use the following code to verify your email address:</p>
            <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #141414; margin: 20px 0;">
              ${code}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p style="color: #888; font-size: 12px;">If you didn't request this, please ignore this email.</p>
          </div>
        `,
      });

      console.log('Message sent: %s', info.messageId);
      res.json({ success: true, messageId: info.messageId });
    } catch (error: any) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: error.message || 'Failed to send verification email' });
    }
  });

  app.post('/api/verify-code', async (req, res) => {
    const { uid, code } = req.body;

    if (!uid || !code) {
      return res.status(400).json({ error: 'UID and code are required' });
    }

    if (!db) {
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    try {
      if (!db) {
        throw new Error('Firestore is not initialized');
      }
      
      console.log(`Attempting to verify code for UID: ${uid} in database: ${firestoreDatabaseId}`);
      
      const codeRef = db.collection('verification_codes').doc(uid);
      const codeDoc = await codeRef.get();

      if (!codeDoc.exists) {
        console.log(`No verification code found for UID: ${uid}`);
        return res.status(404).json({ error: 'Verification code not found. Please request a new one.' });
      }

      const data = codeDoc.data();
      const now = new Date();
      const expiresAt = data?.expiresAt.toDate();

      if (now > expiresAt) {
        console.log(`Verification code expired for UID: ${uid}`);
        return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
      }

      if (data?.code !== code) {
        console.log(`Invalid code attempt for UID: ${uid}`);
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      console.log(`Code valid for UID: ${uid}. Updating user status...`);

      // Mark user as verified
      await db.collection('users').doc(uid).update({ isVerified: true });

      console.log(`User ${uid} marked as verified. Deleting code...`);

      // Delete the code
      await codeRef.delete();

      res.json({ success: true });
    } catch (error: any) {
      console.error('CRITICAL Error verifying code:', error);
      res.status(500).json({ 
        error: 'Failed to verify code due to server permissions', 
        details: error.message,
        code: error.code
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
