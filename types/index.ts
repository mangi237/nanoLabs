export type RoleType = 'admin' | 'receptionist' | 'cashier' | 'analyzer' | 'lab_tech' | 'patient' | 'matron' | 'doctor' | 'nurse' | 'pharmacy' | 'lab' | 'superadmin' | 'inventory_manager';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role?: RoleType;
  primaryRole?: RoleType;
  roles?: RoleType[];
  accessCode?: string;
  labId?: string;
  labName?: string;
}

export interface Lab {
  id: string;
  name: string;
  location: string;
  patientCount?: number;
  primaryColor?: string;
}

export interface Hospital {
  id: string;
  name: string;
  slogan?: string;
  location?: string;
}

export interface LabTest {
  id: string;
  name?: string;
  testName?: string;
  category?: string;
  price?: number;
  description?: string;
  status?: 'requested' | 'collected' | 'sample-collected' | 'processing' | 'completed' | 'paid';
  patientId?: string;
  patientName?: string;
  requestedDate?: string;
  completedDate?: string;
  result?: string;
  sampleCollected?: boolean;
  sampleCollectedBy?: string;
  sampleCollectedByName?: string;
  sampleCollectedDate?: any;
  samples?: string[];
}

export interface Patient {
  id: string;
  patientId?: string;
  name: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: 'active' | 'pending' | 'inactive' | 'lab-pending' | 'lab-sample-collected';
  labTests?: LabTest[];
  updatedAt?: string;
  createdAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  supplier?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface Bill {
  id: string;
  description: string;
  amount: number;
  category?: string;
  status: 'paid' | 'pending';
  patientName?: string;
  createdAt?: string;
}

export interface Appointment {
  id: string;
  title: string;
  date?: string;
  time?: string;
  duration?: string;
  doctorName?: string;
  location?: string;
  notes?: string;
  type?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending';
  patientId?: string;
  patientName?: string;
  createdAt?: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  patientId?: string;
  patientName?: string;
}
