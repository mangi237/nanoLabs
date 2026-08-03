import React from 'react';
import Header from '../../components/common/Header';
import Analytics from '../../components/admin/Analatytics';
import { ArrowLeft } from 'lucide-react';

interface AnalyticsDashboardProps {
  onBack?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  onBack,
  onNotificationPress,
  onProfilePress
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Analytics & Financial Dashboard"
        subtitle="Deep metrics & performance breakdown"
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

        <Analytics />
      </main>
    </div>
  );
};

export default AnalyticsDashboard;
