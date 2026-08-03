import React from 'react';
import Header from '../../components/common/Header';
import ManageStaff from '../../components/admin/ManageStaff';
import { ArrowLeft } from 'lucide-react';

interface StaffManagementProps {
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({
  onBack,
  onNotificationPress,
  onProfilePress
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Staff Personnel Directory"
        subtitle="Manage hospital & laboratory personnel access"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-4">
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        )}

        <ManageStaff />
      </main>
    </div>
  );
};

export default StaffManagement;
