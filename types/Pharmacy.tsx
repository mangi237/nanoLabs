// types/Pharmacy.ts
export interface Pharmacy {
    id?: string;
    name: string;
    address: string;
    phone: string;
    email?: string;
    medicationsAvailable?: MedicationAvailable[];
    createdAt: Date;
    updatedAt: Date;
}

export interface MedicationAvailable {
    id?: string;
    name: string;
    description: string;
    price: number;
    quantityStock: number; 
    quatintySold?: number;
    quantityRemaining?: number;
    soldBy: string;
    pharmacyId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Sale {
    id?: string;
    pharmacyId: string;
    medicationId: string;
    medicationName: string;
    quantity: number;
    prescription?: string;
    price: number;
    soldTo: string;
    soldBy: string;
    createdAt: Date;
}