import React, { useState } from 'react';
import { useAuth } from '../../context/authContext';
import { 
  Building2, 
  MapPin, 
  User, 
  Shield, 
  DollarSign, 
  Microscope, 
  TestTube, 
  ShieldCheck, 
  Package, 
  LogOut, 
  ChevronRight, 
  Check, 
  Bell, 
  Settings, 
  Activity, 
  Layers, 
  Menu, 
  X,
  FileSpreadsheet,
  BarChart3,
  Truck
} from 'lucide-react';
import StaffProfileModal from './StaffProfileModal';

interface StaffSidebarProps {
  currentTab?: string;
  onNavigateTab?: (tab: string) => void;
  onNotificationPress?: () => void;
}

export const StaffSidebar: React.FC<StaffSidebarProps> = ({
  currentTab,
  onNavigateTab,
  onNotificationPress
}) => {
  const { user, lab, logout, setUser } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentRole = user?.role || 'staff';

  // Role metadata definitions
  const ALL_ROLE_DEFS = [
    { id: 'admin', label: 'Lab Administrator', icon: Shield, color: 'text-purple-600 bg-purple-50' },
    { id: 'receptionist', label: 'Reception Desk', icon: User, color: 'text-teal-600 bg-teal-50' },
    { id: 'cashier', label: 'Cashier & Billing', icon: DollarSign, color: 'text-blue-600 bg-blue-50' },
    { id: 'phlebotomist', label: 'Phlebotomy & Dispatch', icon: Truck, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'analyzer', label: 'Sample Analyzer', icon: Microscope, color: 'text-amber-600 bg-amber-50' },
    { id: 'lab_tech', label: 'Lab Technologist', icon: TestTube, color: 'text-cyan-600 bg-cyan-50' },
    { id: 'biologist', label: 'Biologist Validation', icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'inventory_manager', label: 'Inventory Desk', icon: Package, color: 'text-rose-600 bg-rose-50' }
  ];

  // Determine accessible roles:
  // If admin or superadmin: all staff roles are accessible
  // If user has roles array: filter to assigned roles
  const isAdmin = currentRole === 'admin' || currentRole === 'superadmin' || (Array.isArray(user?.roles) && user.roles.includes('admin'));
  
  const accessibleRoles = isAdmin
    ? ALL_ROLE_DEFS
    : ALL_ROLE_DEFS.filter(r => {
        if (r.id === currentRole) return true;
        if (Array.isArray(user?.roles)) {
          return user.roles.includes(r.id) || (r.id === 'lab_tech' && user.roles.includes('labtech'));
        }
        return false;
      });

  const handleSwitchRole = (newRole: string) => {
    if (newRole === currentRole) return;
    const updatedUser = {
      ...user,
      role: newRole
    };
    setUser(updatedUser);
    try {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch {}
    setMobileOpen(false);
  };

  const getRoleLabel = (role: string) => {
    const found = ALL_ROLE_DEFS.find(r => r.id === role);
    return found ? found.label : role.replace('_', ' ');
  };

  return (
    <>
      {/* Mobile Header Bar with Hamburger */}
      <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-800 text-white flex items-center justify-center font-black text-xs">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-slate-900 tracking-tight">
              nano<span className="text-teal-700">Labs</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onNotificationPress && (
            <button
              onClick={onNotificationPress}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
            </button>
          )}

          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 font-bold text-xs"
          >
            <span className="w-2 h-2 rounded-full bg-teal-600" />
            <span className="capitalize text-[11px] max-w-[90px] truncate">{user?.name?.split(' ')[0] || 'Staff'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs animate-in fade-in"
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-200 shadow-xl md:shadow-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Section: Lab Logo, Name, Location */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {lab?.logoUrl ? (
                <img
                  src={lab.logoUrl}
                  alt={lab.name || 'Lab Logo'}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-xl object-cover border border-slate-200 bg-white shadow-2xs"
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-700 to-teal-950 text-white flex items-center justify-center font-black shadow-xs">
                  <Activity className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base text-slate-900 tracking-tight">
                    nano<span className="text-teal-700">Labs</span>
                  </span>
                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    LIMS
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-800 line-clamp-1 leading-tight">
                  {lab?.name || 'Central Diagnostic Network'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Location Badge */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
            <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="truncate">
              {lab?.city ? `${lab.city} • ` : ''}
              {lab?.address || lab?.location || 'Clinical Facility'}
            </span>
          </div>

          {/* Staff Member Card */}
          <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                Staff Identity
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="font-extrabold text-xs text-white truncate">
              {user?.name || 'Laboratory Staff'}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
              <span className="px-2 py-0.5 rounded-md bg-teal-900/80 text-teal-200 border border-teal-500/30 font-bold capitalize">
                {getRoleLabel(currentRole)}
              </span>
            </div>
          </div>
        </div>

        {/* Middle Section: Accessible Roles List (Switchable via click) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Accessible Roles
              </span>
              <span className="text-[10px] text-teal-700 font-bold">
                {accessibleRoles.length} Active
              </span>
            </div>

            <div className="space-y-1">
              {accessibleRoles.map(r => {
                const isActive = r.id === currentRole;
                const IconComponent = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSwitchRole(r.id)}
                    className={`w-full p-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between group cursor-pointer ${
                      isActive
                        ? 'bg-teal-700 text-white shadow-sm ring-1 ring-teal-800'
                        : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 group-hover:text-teal-700'
                      }`}>
                        <IconComponent className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                      <span className="truncate">{r.label}</span>
                    </div>

                    {isActive ? (
                      <Check className="w-4 h-4 text-white stroke-[3] shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Operations Links */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 block mb-1">
              Operations
            </span>

            {onNotificationPress && (
              <button
                type="button"
                onClick={() => {
                  onNotificationPress();
                  setMobileOpen(false);
                }}
                className="w-full p-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span>Notifications Desk</span>
                </div>
                <span className="w-2 h-2 rounded-full bg-teal-600" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Section: Profile Button (Basic Info Only) & Sign Out */}
        <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/70">
          {/* Profile Button: Basic info modal only, no role switching */}
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-2xs flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-black text-[10px] shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ME'}
              </div>
              <span className="truncate">Staff Profile</span>
            </div>
            <span className="text-[10px] text-teal-700 font-semibold group-hover:underline">
              View Info &rarr;
            </span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Sign out from laboratory session?')) {
                logout();
              }
            }}
            className="w-full py-2 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Staff Profile Modal */}
      <StaffProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
};

export default StaffSidebar;
