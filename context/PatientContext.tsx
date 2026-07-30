import React, { createContext, useState, useContext, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../services/firebase'; // Adjust this path to your firebase config
import { Patient } from '../types/Patient'; // Adjust this path to your Patient type

// Define the shape of the context's value
interface PatientContextType {
  patients: Patient[];
  loadingPatients: boolean;
  error: string | null;
}

// Create the context
const PatientContext = createContext<PatientContextType | undefined>(undefined);

// Create the provider component
export const PatientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reference to the 'patients' collection
    const patientsCollection = collection(db, 'patients');
    
    // Set up a real-time listener for the collection
    const unsubscribe = onSnapshot(patientsCollection, (snapshot) => {
      const patientList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[];
      setPatients(patientList);
      setLoadingPatients(false);
      setError(null);
    }, (err) => {
      console.error("Failed to fetch patients:", err);
      setError("Failed to load patient data.");
      setLoadingPatients(false);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <PatientContext.Provider value={{ patients, loadingPatients, error }}>
      {children}
    </PatientContext.Provider>
  );
};

// Custom hook to use the patient context
export const usePatients = () => {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
};
