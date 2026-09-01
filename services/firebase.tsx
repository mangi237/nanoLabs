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
  Firestore
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Web app Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB1tZ67LCGf2bHQxsMw7XRkQEIoSEYFlec",
  authDomain: "nanolabs-9baf3.firebaseapp.com",
  projectId: "nanolabs-9baf3",
  storageBucket: "nanolabs-9baf3.firebasestorage.app",
  messagingSenderId: "718485846076",
  appId: "1:718485846076:web:ac3ca78827330944a9ab39",
  measurementId: "G-SVEXC3TSNQ"
};

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
  console.log('[nanoLabs LIMS] Offline Firestore persistence initialized (IndexedDB multi-tab cache active).');
} catch (err: any) {
  // If Firestore was already initialized or persistence fallback is triggered
  console.warn('[nanoLabs LIMS] Persistent local cache initialization fallback:', err?.message || err);
  db = getFirestore(app);
}

const storage = getStorage(app);
const auth = getAuth(app);

/**
 * Ensures the client holds a cryptographically valid Firebase Auth session
 * so all Firestore queries and writes satisfy request.auth != null security rules.
 */
export const ensureFirebaseAuth = async (): Promise<void> => {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
      console.log('[nanoLabs Auth] Secured Firebase session initialized.');
    }
  } catch (err: any) {
    console.warn('[nanoLabs Auth] Session note:', err?.message || err);
  }
};

// Immediate background initialization
ensureFirebaseAuth();

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

