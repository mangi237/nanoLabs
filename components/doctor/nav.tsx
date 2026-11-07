import { createContext, useContext } from 'react';
import {
  DoctorPatientConnectionRecord,
  DoctorPatientLabDossier,
} from '../../services/doctorPatientFirestoreService';

export type TabId = 'today' | 'patients' | 'results' | 'labs' | 'settings';

export type Route =
  | { name: 'tab'; tab: TabId }
  | { name: 'messages' }
  | {
      name: 'conversation';
      patientId: string;
      patientName: string;
      patientAlias?: string;
      patientPid?: string;
      patientPhone?: string;
    }
  | {
      name: 'patient';
      patientId: string;
      patientName?: string;
      patientAlias?: string;
      patientPid?: string;
      patientPhone?: string;
      patientCity?: string;
    }
  | {
      name: 'result';
      dossierId: string;
      dossier?: DoctorPatientLabDossier;
    }
  | {
      name: 'prescribe';
      patientId?: string;
      patientName?: string;
      patientAlias?: string;
      patientPid?: string;
      patientPhone?: string;
      initialKind?: 'lab_tests' | 'medication';
      preselectedLabId?: string;
      preselectedLabName?: string;
    }
  | {
      name: 'appoint';
      patientId?: string;
      patientName?: string;
      patientAlias?: string;
      patientPid?: string;
      patientPhone?: string;
    }
  | { name: 'settings-profile' }
  | { name: 'settings-practice' }
  | { name: 'settings-credentials' }
  | { name: 'settings-availability' }
  | { name: 'settings-security' }
  | { name: 'settings-notifications' }
  | { name: 'settings-privacy' };

export interface NavContextValue {
  route: Route;
  tab: TabId;
  setTab: (tab: TabId) => void;
  push: (route: Route) => void;
  pop: () => void;
  resetToTab: (tab: TabId) => void;
  connections: DoctorPatientConnectionRecord[];
  dossiers: DoctorPatientLabDossier[];
  appointments: any[];
  refreshDossiers: () => Promise<void>;
  unreadMessagesCount: number;
  pendingRequestsCount: number;
}

export const NavContext = createContext<NavContextValue | null>(null);

export function useNav(): NavContextValue {
  const ctx = useContext(NavContext);
  if (!ctx) {
    throw new Error('useNav must be used inside DoctorApp NavContext.Provider');
  }
  return ctx;
}
