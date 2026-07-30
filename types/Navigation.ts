// types/navigation.ts
import { StackScreenProps } from '@react-navigation/stack';
import { Patient } from './Patient';

export type RootStackParamList = {
  CategorySelection: undefined;
  LoginScreen: { role: string };
  AdminDashboard: undefined;
  DoctorDashboard: undefined;
  NurseDashboard: undefined;
  LabDashboard: undefined;
  PharmacistDashboard: undefined;
  // PatientDetails: { patient: any; userRole?: string };
  LabTest: undefined;
  // Add these new routes:
  PatientList: undefined;
  AddPatientModal: undefined;
  PatientDetails: { patient: Patient };
  AddNoteModal: undefined;
  hospitalDetailsScreen: { hospitalId: string};

};

export type PatientDetailsScreenProps = StackScreenProps<RootStackParamList, 'PatientDetails'>;
export type LabTechDashboardProps = StackScreenProps<RootStackParamList, 'LabDashboard'>;
export type PatientListScreenProps = StackScreenProps<RootStackParamList, 'PatientList'>;