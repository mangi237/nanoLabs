import React, { useState } from 'react';
import Header from '../../components/common/Header';
import Overview from '../../components/admin/Overview';
import ManageStaff from '../../components/admin/ManageStaff';
import Analytics from '../../components/admin/Analatytics';
import InventoryManagement from './InventoryManagement';
import TestCatalogManagement from './TestCatalogManagement';
import ReportsScreen from './ReportsScreen';
import PatientManagement from './PatientManagement';
import ReferringDoctorsManagement from './ReferringDoctorsManagement';
import HeaderFooterTemplateManager from '../../components/admin/HeaderFooterTemplateManager';
import InsuranceRatesManager from '../../components/admin/InsuranceRatesManager';
import LabProfileModal from '../../components/admin/LabProfileModal';
import { 
  LayoutDashboard, 
  Users, 
  UserCog, 
  BarChart3, 
  Package, 
  FlaskConical, 
  FileText,
  ShieldCheck,
  Building2,
  Camera,
  Stethoscope,
  Layers,
  Percent
} from 'lucide-react';
import { useAuth } from '../../context/authContext';

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
  const { lab } = useAuth();
  const [showLabProfileModal, setShowLabProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'inventory' | 'catalog' | 'staff' | 'doctors' | 'templates' | 'insurance' | 'analytics' | 'reports' | 'patients'
  >('overview');

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'templates', label: 'Header & Footer Templates', icon: Layers, badge: 'Dual Styles' },
    { id: 'insurance', label: 'Insurance & COTE Config', icon: Percent, badge: 'Cameroon' },
    { id: 'doctors', label: 'Referring Doctors', icon: Stethoscope },
    { id: 'inventory', label: 'Inventory Manager', icon: Package, badge: 'Reagents' },
    { id: 'catalog', label: 'Test Catalog', icon: FlaskConical },
    { id: 'staff', label: 'Manage Staff', icon: UserCog },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports & Logs', icon: FileText },
    { id: 'patients', label: 'Patients', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        title="Admin & Laboratory Control Center"
        subtitle="Full administrative control over inventory, staff, catalog, finances & clinical operations"
        onNotificationPress={onNotificationPress}
        onProfilePress={onProfilePress}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                      : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge && !isActive && (
                    <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-md font-medium border border-teal-200/60">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowLabProfileModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold border border-teal-200/80 transition-all cursor-pointer"
            >
              {lab?.logoUrl ? (
                <img
                  src={lab.logoUrl}
                  alt={lab.name || 'Lab Logo'}
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded-md object-cover"
                />
              ) : (
                <Building2 className="w-4 h-4 text-teal-600" />
              )}
              <span className="hidden sm:inline">Facility Logo & Theme</span>
            </button>

            <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Master Admin Clearance</span>
            </div>
          </div>
        </div>

        {/* Dynamic Tab Content */}
        {activeTab === 'overview' && (
          <Overview 
            onNavigateTab={(tab) => {
              if (tab === 'inventory' || tab === 'catalog' || tab === 'reports' || tab === 'staff' || tab === 'doctors' || tab === 'analytics' || tab === 'patients') {
                setActiveTab(tab as any);
              } else if (onNavigateTab) {
                onNavigateTab(tab);
              }
            }}
          />
        )}

        {activeTab === 'templates' && (
          <HeaderFooterTemplateManager />
        )}

        {activeTab === 'insurance' && (
          <InsuranceRatesManager />
        )}

        {activeTab === 'doctors' && (
          <ReferringDoctorsManagement embedded={true} />
        )}

        {activeTab === 'inventory' && (
          <InventoryManagement 
            embedded={true} 
            onNotificationPress={onNotificationPress}
            onProfilePress={onProfilePress}
          />
        )}

        {activeTab === 'catalog' && (
          <TestCatalogManagement 
            embedded={true}
            onNotificationPress={onNotificationPress}
            onProfilePress={onProfilePress}
          />
        )}

        {activeTab === 'staff' && <ManageStaff />}

        {activeTab === 'analytics' && <Analytics />}

        {activeTab === 'reports' && (
          <ReportsScreen 
            embedded={true}
            onNotificationPress={onNotificationPress}
            onProfilePress={onProfilePress}
          />
        )}

        {activeTab === 'patients' && (
          <PatientManagement 
            embedded={true}
            onNotificationPress={onNotificationPress}
            onProfilePress={onProfilePress}
          />
        )}
      </main>

      {/* Lab Profile & Custom Logo Modal */}
      <LabProfileModal
        isOpen={showLabProfileModal}
        onClose={() => setShowLabProfileModal(false)}
      />
    </div>
  );
};

export default AdminDashboard;
