import { initializeApp } from 'firebase/app';
import { 
  getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, 
  User as FirebaseUser, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile, sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp,
  collection, addDoc, deleteDoc, query, orderBy, where, getDocFromServer,
  writeBatch, getDocs
} from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

// Firebase configuration with fallback to local JSON for AI Studio environment
// We use a helper to strip any accidental quotes that might come from the environment
const getEnv = (key: string) => {
  const val = import.meta.env[key];
  if (typeof val === 'string') {
    // Strip leading/trailing quotes and trim whitespace
    return val.replace(/^["']|["']$/g, '').trim();
  }
  return val;
};

const getFirebaseConfig = () => {
  const config = {
    apiKey: getEnv('VITE_FIREBASE_API_KEY') || firebaseConfigJson.apiKey,
    authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || firebaseConfigJson.authDomain,
    projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || firebaseConfigJson.projectId,
    storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || firebaseConfigJson.storageBucket,
    messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || firebaseConfigJson.messagingSenderId,
    appId: getEnv('VITE_FIREBASE_APP_ID') || firebaseConfigJson.appId,
    measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID') || firebaseConfigJson.measurementId,
  };

  // Final validation: Ensure no empty strings or "undefined" strings are passed as API keys
  if (!config.apiKey || config.apiKey === 'undefined' || config.apiKey === 'null') {
    console.warn('Firebase API Key is missing or invalid. Check your .env or firebase-applet-config.json');
  }

  return config;
};

const firebaseConfig = getFirebaseConfig();

// Prioritize environment variable but add a safety check for common misconfigurations
const envDatabaseId = getEnv('VITE_FIREBASE_FIRESTORE_DATABASE_ID');
const jsonDatabaseId = (firebaseConfigJson as any).firestoreDatabaseId;

let rawDatabaseId = envDatabaseId || jsonDatabaseId;

// If the environment variable is accidentally set to the Project ID (common mistake), 
// and we have a better-looking ID in the JSON config, use the JSON one instead.
if (envDatabaseId && envDatabaseId === firebaseConfig.projectId && jsonDatabaseId && jsonDatabaseId !== firebaseConfig.projectId) {
  console.warn('⚠️ Detected VITE_FIREBASE_FIRESTORE_DATABASE_ID matches Project ID. Automatically falling back to the correct AI Studio Database ID.');
  rawDatabaseId = jsonDatabaseId;
}

const firestoreDatabaseId = (rawDatabaseId && rawDatabaseId !== 'undefined' && rawDatabaseId !== 'null') ? rawDatabaseId : '(default)';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  
  if (errInfo.error.includes('quota') || errInfo.error.includes('resource-exhausted')) {
    console.error('CRITICAL: Firestore Quota Exceeded. Writes will be disabled until reset.');
  }
  
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with the specific database ID
console.log('Initializing Firestore...');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Database ID:', firestoreDatabaseId);

if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
  console.error('CRITICAL: Firebase API Key is missing. Check your Vercel Environment Variables.');
}

export const db = getFirestore(app, firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');

// Connection Test
async function testConnection() {
  try {
    // Try to fetch a non-existent doc just to test connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log('Firestore connection test successful.');
  } catch (error: any) {
    if (error.message?.includes('the client is offline') || error.message?.includes('Database not found')) {
      console.error('CRITICAL: Firestore connection failed. Check your database ID configuration.');
      console.error('Error details:', error.message);
    }
  }
}
testConnection();

// Auth Helpers
export const signInWithGoogle = async () => {
  try {
    console.log('Starting Google Sign-in...');
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    
    console.log('Google Sign-in successful:', user.uid);
    
    // Check if user profile exists in Firestore
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('Creating new user profile in Firestore...');
      // Create initial user profile
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || 'New User',
        email: user.email,
        role: 'admin', // Defaulting to admin as per user request
        createdAt: serverTimestamp(),
        hasSeeded: false,
      });
      console.log('User profile created.');
    }
    return { user, accessToken };
  } catch (error: any) {
    console.error('Detailed Sign-in Error:', error);
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/user-cancelled') {
      console.warn('Sign-in popup was closed before completion.');
      return null;
    }
    if (error.code === 'auth/cancelled-popup-request') {
      console.warn('A sign-in popup was already open and this request was cancelled.');
      return null;
    }
    throw error;
  }
};

export const signUpWithEmail = async (email: string, pass: string, name: string, username: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    const user = result.user;
    
    // Update Auth Profile
    await updateProfile(user, { displayName: name });
    
    // Create Firestore Profile
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      displayName: name,
      username: username,
      email: user.email,
      role: 'admin',
      isVerified: false, // New field for code verification
      createdAt: serverTimestamp(),
    });
    
    return user;
  } catch (error) {
    console.error('Error signing up with email:', error);
    throw error;
  }
};

export const sendVerificationCode = async (email: string, uid: string) => {
  try {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in Firestore
    const codeRef = doc(db, 'verification_codes', uid);
    await setDoc(codeRef, {
      code,
      email,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send via API
    const response = await fetch('/api/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send verification email');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
};

export const verifyCode = async (uid: string, enteredCode: string) => {
  try {
    // 1. Get the code from the database (user has read permission for their own code)
    const codeRef = doc(db, 'verification_codes', uid);
    const codeDoc = await getDoc(codeRef);

    if (!codeDoc.exists()) {
      throw new Error('Verification code not found. Please request a new one.');
    }

    const data = codeDoc.data();
    const now = new Date();
    const expiresAt = data.expiresAt.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt);

    if (now > expiresAt) {
      throw new Error('Verification code has expired. Please request a new one.');
    }

    if (data.code !== enteredCode) {
      throw new Error('Invalid verification code. Please check and try again.');
    }

    // 2. Update the user document (Rules will verify the code matches)
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User profile not found.');
    }

    await updateDoc(userRef, {
      ...userDoc.data(),
      isVerified: true,
      verificationCode: enteredCode // Passed to rules for validation
    });

    // 3. Delete the code document
    await deleteDoc(codeRef);

    return true;
  } catch (error: any) {
    console.error('Error verifying code:', error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (error) {
    console.error('Error logging in with email:', error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

export const logout = () => signOut(auth);

export { 
  onAuthStateChanged, doc, getDoc, setDoc, updateDoc, onSnapshot, 
  collection, addDoc, deleteDoc, query, orderBy, where, serverTimestamp,
  writeBatch, getDocs
};
export type { FirebaseUser };
