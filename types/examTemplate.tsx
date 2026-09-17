// Database Schema Architecture for nanoLabs Clinical Examinations

export interface TemplateParameter {
    parameterId: string;
    label: string; // e.g., "Aspect", "Couleur", "Culture & identification"
    inputType: 'FREE_TEXT' | 'DROPDOWN' | 'TOGGLE' | 'NUMERIC';
    options?: string[]; // e.g., ["Claire", "Jaunâtre", "Trouble"] for DROPDOWN, ["Stérile", "Positif"] for TOGGLE
    unit?: string; // e.g., "cells/mm3", "éléments/mm³", "g/dL"
    referenceRange?: string; // e.g., "< 10,000", "Négatif", "3.8 - 4.5"
    defaultValue?: string; // Normal / Healthy pre-populated value
    bold?: boolean;
    color?: string; // e.g., "#0D9488", "#DC2626"
  }
  
  export interface TemplateSection {
    sectionId: string;
    sectionTitle: string; // e.g., "EXAMEN CYTO-BACTERIOLOGIQUE", "EXAMEN MACROSCOPIQUE"
    parameters: TemplateParameter[];
  }
  
  export interface ExamTemplate {
    templateId: string;
    examCode: string; // e.g., "PV_EXAM", "ECBU", "COP_EXAM", "NFS"
    title: string;
    category: string;
    sections: TemplateSection[];
    createdAt: string;
    updatedAt: string;
  }
  
  export interface PatientExamResult {
    resultId: string;
    bookingId: string;
    patientId: string;
    patientName?: string;
    examCode: string;
    templateId: string;
    parameterValues: Record<string, string>; // Maps parameterId -> Entered Value
    clinicalInterpretation?: string;
    technicianNotes?: string;
    status: 'DRAFT' | 'VERIFIED' | 'PUBLISHED';
    verifiedByBiologistId?: string;
    biologistSignatureName?: string;
    timestamp: string;
    autoSavedAt?: string;
  }
  