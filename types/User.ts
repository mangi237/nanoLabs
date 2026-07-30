// types/User.ts
export type RoleType = 
  | 'admin' | 'receptionist' | 'analyzer' | 'cashier' 
  | 'lab' | 'pharmacy' | 'doctor' | 'nurse' 
  | 'radiology' | 'surgeon' | 'emergency' | 'ward' | 'matron';

export interface User {
  id: string;
  name: string;
  email: string;
 roles: RoleType[]; // Array of roles
  role?: RoleType; // Single role for backward compatibility
  department?: string;
  code: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive: boolean;
  phoneNumber?: string;
  specialization?: string; // For doctors
  licenseNumber?: string; // For medical staff
  address?: string;
  emergencyContact?: string;

  profileImage?: string;
  permissions?: string[]; // Specific permissions for fine-grained access control
}

// User creation data (without id and timestamps)
export interface UserCreateData {
  name: string;
  email: string;
   roles: RoleType[]; // Array of roles
  role?: RoleType; // Single role for backward compatibility
  department?: string;
  code: string;
  phoneNumber?: string;
  specialization?: string;

  licenseNumber?: string;
  address?: string;
  emergencyContact?: string;
  profileImage?: string;
  permissions?: string[];
}

// User update data (all fields optional)
export interface UserUpdateData {
  name?: string;
  email?: string;
  role?: string;
  roles?: string[]; // Add this
  department?: string;
  code?: string;
  phoneNumber?: string;
  specialization?: string;
  licenseNumber?: string;
  address?: string;
  emergencyContact?: string;
  profileImage?: string;
  isActive?: boolean;
  permissions?: string[];
  
}

// User login credentials
export interface LoginCredentials {
  email: string;
  password: string;
  code?: string; // For role-based access
}

// User session data
export interface UserSession {
  user: User;
  token: string;
  expiresAt: Date;
  lastLogin: Date;
}

// Role permissions mapping
export interface RolePermissions {
  admin: string[];
  doctor: string[];
  nurse: string[];
  lab: string[];
  pharmacy: string[];
}

// Department types
export type Department = 
  | 'cardiology' 
  | 'pediatrics' 
  | 'orthopedics' 
  | 'neurology' 
  | 'emergency' 
  | 'surgery'
  | 'radiology'
  | 'pharmacy'
  | 'laboratory'
  | 'administration';

// Staff statistics
export interface StaffStats {
  total: number;
  byRole: {
    admin: number;
    doctor: number;
    nurse: number;
    lab: number;
    pharmacy: number;
  };
  byDepartment: Record<string, number>;
  active: number;
  inactive: number;
}