import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
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
  onSnapshot, 
  Timestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB1tZ67LCGf2bHQxsMw7XRkQEIoSEYFlec",
  authDomain: "nanolabs-9baf3.firebaseapp.com",
  projectId: "nanolabs-9baf3",
  storageBucket: "nanolabs-9baf3.firebasestorage.app",
  messagingSenderId: "718485846076",
  appId: "1:718485846076:web:ac3ca78827330944a9ab39",
  measurementId: "G-SVEXC3TSNQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export const storage = getStorage(app);
// Initialize Firebase Authentication
const auth = getAuth(app);

export { 
  db, 
  auth, 
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
  onSnapshot,
  Timestamp
};

