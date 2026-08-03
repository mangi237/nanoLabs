import React, { useState } from 'react';
import Header from '../../components/common/Header';
import Overview from '../../components/admin/Overview';
import ManageStaff from '../../components/admin/ManageStaff';
import Analytics from '../../components/admin/Analatytics';
import { LayoutDashboard, Users, UserCog, BarChart3, Package, TestTube, FileText } from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab?: (tab: string) => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onSelectPatient?: (patient: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
  onNotificationPress,
  onProfilePress,
  onSelectPatient
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'analytics'>('overview');

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'staff', label: 'Manage Staff', icon: UserCog },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Admin Control Center"
        subtitle="Manage hospital operations & staffing"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}

          {/* External Nav buttons if caller wants direct screen jump */}
          {onNavigateTab && (
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => onNavigateTab('catalog')}
                className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-semibold"
              >
                <TestTube className="w-3.5 h-3.5 text-teal-600" />
                Catalog
              </button>
              <button
                onClick={() => onNavigateTab('inventory')}
                className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-semibold"
              >
                <Package className="w-3.5 h-3.5 text-blue-600" />
                Inventory
              </button>
              <button
                onClick={() => onNavigateTab('reports')}
                className="flex items-center gap-1.5 px-3 py-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-semibold"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Reports
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Tab Content */}
        {activeTab === 'overview' && <Overview onPatientSelect={onSelectPatient} />}
        {activeTab === 'staff' && <ManageStaff />}
        {activeTab === 'analytics' && <Analytics />}
      </main>
    </div>
  );
};

export default AdminDashboard;
