import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage} from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyASkpqZTb1mwpJTXdc0KcUkZS90_EIqfRs",
  authDomain: "nanohealth-f53bf.firebaseapp.com",
  projectId: "nanohealth-f53bf",
  storageBucket: "nanohealth-f53bf.firebasestorage.app",
  messagingSenderId: "762227664948",
  appId: "1:762227664948:web:d6a6ff76b8a736d8e68261",
  measurementId: "G-H9V4LZ5E0W"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export const storage = getStorage(app);
// Initialize Firebase Authentication
const auth = getAuth(app);

export { db, auth }; 