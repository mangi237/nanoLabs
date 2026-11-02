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
import PaymentConfigManager from '../../components/admin/PaymentConfigManager';
import LabProfileModal from '../../components/admin/LabProfileModal';
import SubscriptionRechargeModal from '../../components/admin/SubscriptionRechargeModal';
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
  Stethoscope,
  Layers,
  Percent,
  CreditCard,
  BookOpen,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { StaffTrainingBookletPage } from '../staff/StaffTrainingBookletPage';
import {
  canLabUseFeature,
  getLabPackageConfig,
  getRequiredPackageNameForFeature,
  LabFeatureKey,
} from '../../utils/labPackages';

interface AdminDashboardProps {
  onNavigateTab?: (tab: string) => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  onSelectPatient?: (patient: any) => void;
}

type AdminTabId =
  | 'overview'
  | 'training'
  | 'inventory'
  | 'catalog'
  | 'staff'
  | 'doctors'
  | 'templates'
  | 'insurance'
  | 'payments'
  | 'analytics'
  | 'reports'
  | 'patients';

const TAB_FEATURE_REQUIREMENT: Partial<Record<AdminTabId, LabFeatureKey>> = {
  insurance: 'insurance',
  doctors: 'doctors',
  inventory: 'inventory',
  analytics: 'analytics',
  reports: 'reports',
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
  onNotificationPress,
  onProfilePress,
}) => {
  const { lab } = useAuth();
  const activePkg = getLabPackageConfig(lab);
  const [showLabProfileModal, setShowLabProfileModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');

  const navItems: Array<{ id: AdminTabId; label: string; icon: any; badge?: string }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'training', label: 'Staff Training Booklet & SOPs', icon: BookOpen, badge: 'Full Manual' },
    { id: 'templates', label: 'Header & Footer Templates', icon: Layers, badge: 'Dual Styles' },
    { id: 'insurance', label: 'Insurance & COTE Config', icon: Percent, badge: 'Cameroon' },
    { id: 'payments', label: 'Payment Gateway Config', icon: CreditCard, badge: 'MOMO/OM/Cash' },
    { id: 'doctors', label: 'Referring Doctors', icon: Stethoscope },
    { id: 'inventory', label: 'Inventory Manager', icon: Package, badge: 'Reagents' },
    { id: 'catalog', label: 'Test Catalog', icon: FlaskConical },
    { id: 'staff', label: 'Manage Staff', icon: UserCog },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports & Logs', icon: FileText },
    { id: 'patients', label: 'Patients', icon: Users },
  ];

  const isTabLocked = (tabId: AdminTabId): boolean => {
    const reqFeature = TAB_FEATURE_REQUIREMENT[tabId];
    if (!reqFeature) return false;
    return !canLabUseFeature(lab, reqFeature);
  };

  const activeLockedFeature = TAB_FEATURE_REQUIREMENT[activeTab];
  const isCurrentTabBlocked = Boolean(activeLockedFeature && !canLabUseFeature(lab, activeLockedFeature));

  const renderBlockedUpgradeCard = (feature: LabFeatureKey, moduleLabel: string) => (
    <div className="max-w-2xl mx-auto my-8 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
        <Lock className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
          Current Plan: {activePkg.name} ({activePkg.priceLabel})
        </span>
        <h2 className="text-2xl font-black text-slate-900">
          {moduleLabel} Requires Package Upgrade
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
          Your laboratory is strictly enforced to the capabilities of the <strong>{activePkg.name}</strong> package. To unlock <strong>{moduleLabel}</strong>, upgrade your subscription to <strong>{getRequiredPackageNameForFeature(feature)}</strong> or higher.
        </p>
      </div>
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
        >
          Back to Overview
        </button>
        <button
          type="button"
          onClick={() => setShowRechargeModal(true)}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-md shadow-teal-600/20 inline-flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Upgrade Subscription Package</span>
        </button>
      </div>
    </div>
  );

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
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const locked = isTabLocked(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                      : locked
                      ? 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                      : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : locked ? 'text-slate-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {locked ? (
                    <Lock className={`w-3.5 h-3.5 ${isActive ? 'text-amber-200' : 'text-amber-500'}`} />
                  ) : (
                    item.badge &&
                    !isActive && (
                      <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-md font-medium border border-teal-200/60">
                        {item.badge}
                      </span>
                    )
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
              <span className="hidden sm:inline">Facility Logo &amp; Theme</span>
            </button>

            <div className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] text-slate-600 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>{activePkg.name}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Tab Content with Strict Per-Package Feature Enforcement */}
        {isCurrentTabBlocked && activeLockedFeature ? (
          renderBlockedUpgradeCard(
            activeLockedFeature,
            navItems.find((n) => n.id === activeTab)?.label || 'Module'
          )
        ) : (
          <>
            {activeTab === 'overview' && (
              <Overview
                onNavigateTab={(tab) => {
                  const knownTabs: AdminTabId[] = [
                    'overview',
                    'training',
                    'inventory',
                    'catalog',
                    'staff',
                    'doctors',
                    'templates',
                    'insurance',
                    'payments',
                    'analytics',
                    'reports',
                    'patients',
                  ];
                  if (knownTabs.includes(tab as AdminTabId)) {
                    setActiveTab(tab as AdminTabId);
                  } else if (onNavigateTab) {
                    onNavigateTab(tab);
                  }
                }}
              />
            )}

            {activeTab === 'training' && (
              <StaffTrainingBookletPage onBack={() => setActiveTab('overview')} />
            )}

            {activeTab === 'templates' && <HeaderFooterTemplateManager />}

            {activeTab === 'insurance' && <InsuranceRatesManager />}

            {activeTab === 'payments' && <PaymentConfigManager />}

            {activeTab === 'doctors' && <ReferringDoctorsManagement embedded={true} />}

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
          </>
        )}
      </main>

      {/* Lab Profile & Custom Logo Modal */}
      <LabProfileModal
        isOpen={showLabProfileModal}
        onClose={() => setShowLabProfileModal(false)}
      />

      {/* Subscription Package Upgrade Modal */}
      <SubscriptionRechargeModal
        isOpen={showRechargeModal}
        onClose={() => setShowRechargeModal(false)}
      />
    </div>
  );
};

export default AdminDashboard;
