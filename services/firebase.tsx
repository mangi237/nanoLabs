import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
  enableNetwork,
  disableNetwork,
  waitForPendingWrites,
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot, 
  Timestamp,
  Firestore,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Web app Firebase configuration
const env = import.meta.env;
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: env.VITE_FIREBASE_APP_ID,
};
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) throw new Error('Firebase configuration is missing. Configure the frontend environment before signing in.');
const useEmulators = env.VITE_USE_FIREBASE_EMULATORS === 'true';
if (useEmulators && (env.PROD || !firebaseConfig.projectId.startsWith('demo-'))) throw new Error('Local emulators require a development build and a demo Firebase project.');

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with Offline Persistence (multi-tab IndexedDB cache)
// Specifically optimized for unstable/slow connectivity (e.g. Cameroon 2G/3G/power drops)
let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    })
  });
} catch (err: any) {
  // If Firestore was already initialized or persistence fallback is triggered
  console.warn('[nanoLabs LIMS] Persistent local cache initialization fallback:', err?.message || err);
  db = getFirestore(app);
}

const storage = getStorage(app);
const auth = getAuth(app);
if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: false });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

/**
 * Ensures the client holds a cryptographically valid Firebase Auth session
 * so all Firestore queries and writes satisfy request.auth != null security rules.
 */
export const ensureFirebaseAuth = async (): Promise<void> => {
  await auth.authStateReady();
  if (!auth.currentUser || auth.currentUser.isAnonymous) throw new Error('Please sign in to continue.');
};

export { 
  db, 
  auth, 
  storage,
  app,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  enableNetwork,
  disableNetwork,
  waitForPendingWrites
};

