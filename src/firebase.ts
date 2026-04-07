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
// Prioritize environment variable for database ID in production environments like Vercel
const rawDatabaseId = getEnv('VITE_FIREBASE_FIRESTORE_DATABASE_ID') || (firebaseConfigJson as any).firestoreDatabaseId;
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
      createdAt: serverTimestamp(),
      hasSeeded: false,
    });
    
    return user;
  } catch (error) {
    console.error('Error signing up with email:', error);
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
