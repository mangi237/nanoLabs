import React from 'react';
import Header from '../../components/common/Header';
import PatientList from '../../components/medical/PatientList';
import { ArrowLeft } from 'lucide-react';

interface PatientManagementProps {
  embedded?: boolean;
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onSelectPatient?: (patient: any) => void;
}

export const PatientManagement: React.FC<PatientManagementProps> = ({
  embedded = false,
  onBack,
  onNotificationPress,
  onProfilePress,
  onSelectPatient
}) => {
  const content = (
    <div className="space-y-4">
      {onBack && !embedded && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      )}

      <PatientList isAdminView={true} />
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Patient Record Directory"
        subtitle="Manage patient admissions, history & test profiles"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-4">
        {content}
      </main>
    </div>
  );
};

export default PatientManagement;
