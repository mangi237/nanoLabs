import { Timestamp } from 'firebase/firestore';

export const safeToDate = (timestamp: any): Date => {
  if (!timestamp) return new Date();
  
  // If it's already a Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // If it's a Firestore Timestamp
  if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
    return timestamp.toDate();
  }
  
  // If it's a string or number, try to create a Date from it
  if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  
  // Fallback to current date
  return new Date();
};