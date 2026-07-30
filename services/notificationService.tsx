// services/notificationService.ts
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export const createNotification = async (
  hospitalId: string,
  type: 'bill' | 'lab' | 'medication' | 'appointment' | 'stock' | 'patient',
  title: string,
  message: string,
  patientId?: string,
  patientName?: string
) => {
  try {
    await addDoc(collection(db, 'hospitals', hospitalId, 'notifications'), {
      type,
      title,
      message,
      patientId,
      patientName,
      timestamp: Timestamp.now(),
      read: false,
      hospitalId 
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Example usage in different services:

// When bill is created
export const notifyBillCreated = async (hospitalId: string, patientName: string, amount: number, billId: string) => {
  await createNotification(
    hospitalId,
    'bill',
    'New Bill Created',
    `${patientName} has a new bill of $${amount.toFixed(2)}`,
    billId,
    patientName
  );
};

// When lab test is requested
export const notifyLabTestRequested = async (hospitalId: string, patientName: string, testName: string) => {
  await createNotification(
    hospitalId,
    'lab',
    'Lab Test Requested',
    `${patientName} needs ${testName} test`,
    undefined,
    patientName
  );
};

// When medication is low in stock
export const notifyLowStock = async (hospitalId: string, medicationName: string, currentStock: number) => {
  await createNotification(
    hospitalId,
    'stock',
    'Low Stock Alert',
    `${medicationName} is running low (${currentStock} remaining)`,
    undefined,
    medicationName
  );
};

// When patient is admitted
export const notifyPatientAdmitted = async (hospitalId: string, patientName: string, wardName: string) => {
  await createNotification(
    hospitalId,
    'patient',
    'Patient Admitted',
    `${patientName} has been admitted to ${wardName}`,
    undefined,
    patientName
  );
};