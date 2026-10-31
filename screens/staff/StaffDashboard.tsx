import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  DollarSign, 
  Microscope, 
  TestTube, 
  Package,
  ShieldCheck,
  ArrowRight,
  Truck,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/authContext';
import { ReceptionistView } from './ReceptionistView';
import { CashierView } from './CashierView';
import { AnalyzerView } from './AnalyzerView';
import { LabTechView } from './LabTechView';
import { BiologistView } from './BiologistView';
import { PhlebotomyDispatchScreen } from '../Lab/PhlebotomyDispatchScreen';
import InventoryManagement from '../admin/InventoryManagement';

interface StaffDashboardProps {
  onNavigate?: (screen: string, params?: any) => void;
  onOpenRoleSwitcher?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  onNavigate,
  onOpenRoleSwitcher,
  onNotificationPress,
  onProfilePress
}) => {
  const { user, lab } = useAuth();
  const activeRole = user?.role || 'receptionist';

  // Sub-tab selection when viewing overall staff dashboard
  const [selectedWorkstation, setSelectedWorkstation] = useState<string>(
    activeRole === 'inventory_manager' ? 'inventory' : activeRole
  );

  const rolesConfig = [
    { 
      id: 'receptionist', 
      label: 'Receptionist Intake', 
      icon: User, 
      color: 'text-teal-600 bg-teal-50 border-teal-200',
      badge: 'Step 1: Confirm Requests',
      desc: 'Confirm online test requests, admit walk-ins, and route to Cashier.'
    },
    { 
      id: 'cashier', 
      label: 'Cashier Gatekeeper', 
      icon: DollarSign, 
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      badge: 'Step 2: Invoice & Verify',
      desc: 'Issue online invoices, verify 3rd-party payments & issue certified receipts.'
    },
    { 
      id: 'mobile_phlebotomist', 
      label: 'Mobile Phlebotomist', 
      icon: Truck, 
      color: 'text-cyan-700 bg-cyan-50 border-cyan-200',
      badge: 'Step 3A: Home Pickup GPS',
      desc: 'Go pickup home samples with live Google Maps GPS & two-way handover.'
    },
    { 
      id: 'analyzer', 
      label: 'In-Lab Phlebotomist', 
      icon: Microscope, 
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      badge: 'Step 3B: Barcode & Rack',
      desc: 'Draw walk-in samples, label specimen barcodes & record lab rack storage.'
    },
    { 
      id: 'lab_tech', 
      label: 'Lab Technologist', 
      icon: TestTube, 
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      badge: 'Step 4: Analytical Assays',
      desc: 'Open patient booklets, enter biomarker values & sign off to Biologist.'
    },
    { 
      id: 'biologist', 
      label: 'Clinical Biologist', 
      icon: Award, 
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      badge: 'Step 5: Certify & Release',
      desc: 'Review findings, sign off with lab header & release to Patient Portal.'
    },
    { 
      id: 'inventory', 
      label: 'Inventory Manager', 
      icon: Package, 
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      badge: 'Stock & Reagents',
      desc: 'Monitor chemical stock, measuring units, expiration alerts & bulk imports.'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Staff Header & Lab Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
              <Building2 className="w-3.5 h-3.5" />
              {lab?.name || user?.labName || 'nanoLabs Health Network'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user?.name || 'Staff Member'}
            </h1>
            <p className="text-teal-100/80 text-sm max-w-xl">
              Access operational workstations below to manage patient admissions, online invoices, mobile GPS pickups, barcoding, analytical assays, and biologist certification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenRoleSwitcher}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold border border-white/20 transition-all cursor-pointer backdrop-blur-xs shadow-xs"
            >
              <ShieldCheck className="w-4 h-4 text-teal-300" />
              Active Role: <span className="uppercase tracking-wider font-bold text-teal-300">{user?.role?.replace('_', ' ') || 'Staff'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workstation Selector Cards Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Workstation Modules & Operations
          </h2>
          <span className="text-xs text-slate-400 font-medium">Click a card to switch workstation view</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {rolesConfig.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedWorkstation === role.id || (role.id === 'inventory' && selectedWorkstation === 'inventory_manager');

            return (
              <button
                key={role.id}
                onClick={() => setSelectedWorkstation(role.id)}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-gradient-to-b from-teal-900 to-slate-900 text-white border-teal-700 shadow-lg ring-2 ring-teal-500/30'
                    : 'bg-white border-slate-200/80 hover:border-teal-300 hover:shadow-md text-slate-800'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`p-2 rounded-xl border ${isSelected ? 'bg-white/10 text-teal-300 border-white/20' : role.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-400 text-slate-900">
                        Active
                      </span>
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition-colors" />
                    )}
                  </div>

                  <div>
                    <h3 className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {role.label}
                    </h3>
                    <p className={`text-[10.5px] mt-1 leading-snug ${isSelected ? 'text-teal-100/80' : 'text-slate-500'}`}>
                      {role.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2.5 mt-2.5 border-t border-slate-100/20 text-[9.5px] font-semibold">
                  <span className={isSelected ? 'text-teal-300' : 'text-teal-700'}>
                    {role.badge}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Active Workstation View */}
      <div className="pt-2">
        {selectedWorkstation === 'receptionist' && (
          <ReceptionistView 
            onNavigatePatientDetails={(patientId) => onNavigate?.('PatientDetailsScreen', { patientId })}
            onNotificationPress={onNotificationPress}
            onProfilePress={onProfilePress}
            onRoleSwitcherPress={onOpenRoleSwitcher}
          />
        )}
        {selectedWorkstation === 'cashier' && (
          <CashierView 
            onNotificationPress={onNotificationPress}
            onProfilePress={onProfilePress}
            onRoleSwitcherPress={onOpenRoleSwitcher}
          />
        )}
        {selectedWorkstation === 'mobile_phlebotomist' && (
          <PhlebotomyDispatchScreen />
        )}
        {selectedWorkstation === 'analyzer' && (
          <AnalyzerView 
            onNotificationPress={onNotificationPress}
            onProfilePress={onProfilePress}
            onRoleSwitcherPress={onOpenRoleSwitcher}
          />
        )}
        {selectedWorkstation === 'lab_tech' && (
          <LabTechView 
            onNotificationPress={onNotificationPress}
            onProfilePress={onProfilePress}
            onRoleSwitcherPress={onOpenRoleSwitcher}
          />
        )}
        {selectedWorkstation === 'biologist' && (
          <BiologistView 
            onNotificationPress={onNotificationPress}
            onProfilePress={onProfilePress}
            onRoleSwitcherPress={onOpenRoleSwitcher}
          />
        )}
        {(selectedWorkstation === 'inventory' || selectedWorkstation === 'inventory_manager') && (
          <InventoryManagement 
            embedded={true}
            onNotificationPress={onNotificationPress}
            onProfilePress={onProfilePress}
          />
        )}
      </div>
    </div>
  );
};
