// types/Lab.ts
export interface Lab {
    id: string;
    name: string;
    location: string;
    address?: string;
    phone?: string;
    email?: string;
    description?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    logo?: string;
    patientCount?: number;
    staffCount?: number;
    createdAt?: string;
    updatedAt?: string;
    status?: 'active' | 'inactive';
    subscription?: {
      type: 'basic' | 'pro' | 'premium';
      ratePerPatient: number;
      status: 'active' | 'inactive';
    };
  }
  
  export default Lab;