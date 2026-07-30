// screens/UnifiedDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/authContext';
import { User, RoleType } from '../types/User';

// Import all dashboard components
import { useRoute, RouteProp } from '@react-navigation/native';
import Hospital from '../types/hospital';
import Overview from '../components/admin/Overview';
import ManageStaff from '../components/admin/ManageStaff';
import PatientList from '../components/medical/PatientList';
import PharmacyDashboard from '../screens/pharmacist/pharmacistDashboard';
import Analytics from '../components/admin/Analatytics';
import WardDashboard from '../screens/Ward/WardDashboard';
import CashierDashboard from '../screens/cashier/CashierDashboard';
import LabDashboard from '../screens/lab/LabDashboard';
import MainDoctorDashboard from './doctor/MainDoctorDashboard';
import NurseDashboard from './nurse/NurseDashboard';
import RadiologyDashboard from './Radiology/RadiologyDashboard';
import EmergencyDashboard from './Emergency/EmergencyDashboard';
import SurgeonDashboard from './Surgeon/SurgeonDashboard';
import MatronDashboard from './Matron/MatronDashboard';
import AdminDashboard from './admin/adminDashboard';
import WardManagementModal from '../components/ward/WardManagementModal';

const { width } = Dimensions.get('window');
const screenHeight = Dimensions.get('window').height;

// Define all possible tabs with their role requirements
type DashboardTab = {
  key: string;
  icon: string;
  label: string;
  roles: RoleType[]; // Which roles can see this tab
  component: React.ComponentType<any>;
};

const ALL_TABS: DashboardTab[] = [
  // Overview - Available to almost all roles
  {
    key: 'Overview',
    icon: 'speedometer',
    label: 'Overview',
    roles: ['admin',],
    component: Overview,
  },
  
  // Staff Management - Admin & Matron only
  {
    key: 'Staff',
    icon: 'people',
    label: 'Staff',
    roles: ['admin', 'matron'],
    component: ManageStaff,
  },
  
  // Patients - Most clinical roles
  {
    key: 'Patients',
    icon: 'medical',
    label: 'Patients',
    roles: ['admin', 'doctor', 'nurse', 'receptionist', 'matron'],
    component: PatientList,
  },
  
  // Pharmacy - Pharmacy role only
  {
    key: 'Pharmacy',
    icon: 'cube',
    label: 'Pharmacy',
    roles: ['pharmacy', 'admin'],
    component: PharmacyDashboard,
  },
  
  // Analytics - Admin only
  {
    key: 'Analytics',
    icon: 'stats-chart',
    label: 'Analytics',
    roles: ['admin'],
    component: Analytics,
  },
  
  // Wards - Nursing & admin roles
  {
    key: 'Wards',
    icon: 'business',
    label: 'Wards',
    roles: ['nurse', 'matron', 'admin', 'ward'],
    component: WardDashboard,
  },
  
  // Billing - Cashier, Receptionist, Admin
  {
    key: 'Billing',
    icon: 'card',
    label: 'Billing',
    roles: ['cashier',  'admin'],
    component: CashierDashboard,
  },
  
  // Lab - Lab role only
  {
    key: 'Lab',
    icon: 'flask',
    label: 'Lab',
    roles: ['lab', 'admin'],
    component: LabDashboard,
  },
  
  // Doctor - Doctor role
  {
    key: 'Doctor',
    icon: 'medical',
    label: 'Doctor',
    roles: ['doctor', 'admin'],
    component:MainDoctorDashboard,
  },
  
  // Nurse - Nurse role
  {
    key: 'Nurse',
    icon: 'medkit',
    label: 'Nurse',
    roles: ['nurse', 'matron', 'admin'],
    component: NurseDashboard,
  },
  
  // Radiology - Radiology role
  {
    key: 'Radiology',
    icon: 'scan',
    label: 'Radiology',
    roles: ['radiology', 'admin'],
    component: RadiologyDashboard,
  },
  
  // Emergency - Emergency role
  {
    key: 'Emergency',
    icon: 'warning',
    label: 'Emergency',
    roles: ['emergency', 'admin'],
    component: EmergencyDashboard,
  },
  
  // Surgeon - Surgeon role
  {
    key: 'Surgeon',
    icon: 'cut',
    label: 'Surgeon',
    roles: ['surgeon', 'admin'],
    component: SurgeonDashboard,
  },
  
  // Matron - Matron role
  {
    key: 'Matron',
    icon: 'person',
    label: 'Matron',
    roles: ['matron', 'admin'],
    component: MatronDashboard,
  },
];
type UnifiedDashboardParams = {
  initialRole?: RoleType;
};

type RouteProps = RouteProp<{ UnifiedDashboard: UnifiedDashboardParams }, 'UnifiedDashboard'>;

// screens/UnifiedDashboard.tsx - Update the component logic
const UnifiedDashboard: React.FC = () => {
  const { user } = useAuth();
  const route = useRoute<RouteProps>();
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalStaff: 0,
    todayAppointments: 0,
    revenue: 0,
    occupiedBeds: 0,
  });
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleSwitcherVisible, setRoleSwitcherVisible] = useState(false);
  
  // Initialize currentRole from route params or user's first role
  const [currentRole, setCurrentRole] = useState<RoleType>(() => {
    // Priority: 1. Route param, 2. User's first role, 3. Default to first available role
    if (route.params?.initialRole) {
      return route.params.initialRole;
    }
    const userRoles = (user?.roles as RoleType[]) || [];
    return userRoles[0] || 'admin';
  });

  // Get user's available roles from context
  const availableRoles = (user?.roles as RoleType[]) || [];
  
  // Debug log to see what's happening
  console.log('UnifiedDashboard debug:', {
    userRoles: availableRoles,
    currentRole,
    hasUser: !!user,
    userData: user
  });

  // Filter tabs based on current role
  const availableTabs = ALL_TABS.filter(tab => 
    tab.roles.includes(currentRole)
  );

  console.log('Available tabs for role', currentRole, ':', availableTabs.map(t => t.key));

  // Set initial tab based on current role
  useEffect(() => {
    if (availableTabs.length > 0) {
      // Always show Overview if available for the role
      const overviewTab = availableTabs.find(t => t.key === 'Overview');
      if (overviewTab) {
        setActiveTab('Overview');
      } else {
        // Otherwise use first available tab
        setActiveTab(availableTabs[0].key);
      }
    } else {
      console.warn('No tabs available for role:', currentRole);
      // If no tabs available, default to first available role
      if (availableRoles.length > 0 && availableRoles[0] !== currentRole) {
        setCurrentRole(availableRoles[0]);
      }
    }
  }, [currentRole, availableTabs.length]);

  // Rest of the component remains the same, but update renderContent:
  const renderContent = () => {
    console.log('Rendering content for tab:', activeTab);
    
    const activeTabConfig = availableTabs.find(tab => tab.key === activeTab);
    
    if (!activeTabConfig) {
      console.warn('No active tab config found for:', activeTab);
      return (
        <View style={styles.noAccessContainer}>
          <Ionicons name="lock-closed" size={60} color="#BDC3C7" />
          <Text style={styles.noAccessTitle}>Access Restricted</Text>
          <Text style={styles.noAccessText}>
            You don't have permission to view this section.
          </Text>
          <Text style={styles.noAccessHint}>
            Current role: {currentRole}
          </Text>
          <Text style={styles.noAccessHint}>
            Available roles: {availableRoles.join(', ')}
          </Text>
        </View>
      );
    }

    const Component = activeTabConfig.component;
    
    // Pass appropriate props based on component
    try {
      switch (activeTabConfig.key) {
        case 'Overview':
          return <Component onPatientSelect={() => {}} />;
        case 'Patients':
          return <Component />;
        case 'Doctor':
          // DoctorDashboard might need special props
          return <Component />;
        default:
          return <Component />;
      }
    } catch (error) {
      console.error('Error rendering component:', error);
      return (
        <View style={styles.noAccessContainer}>
          <Ionicons name="alert-circle" size={60} color="#E74C3C" />
          <Text style={styles.noAccessTitle}>Error Loading Component</Text>
          <Text style={styles.noAccessText}>
            Failed to load {activeTabConfig.label}
          </Text>
        </View>
      );
    }
  };

  // Also update the role switching handler:
  const handleRoleSwitch = (role: RoleType) => {
    console.log('Switching to role:', role);
    setCurrentRole(role);
    setRoleSwitcherVisible(false);
    
    // Reset to first available tab for new role
    const newAvailableTabs = ALL_TABS.filter(tab => tab.roles.includes(role));
    if (newAvailableTabs.length > 0) {
      const overviewTab = newAvailableTabs.find(t => t.key === 'Overview');
      setActiveTab(overviewTab ? 'Overview' : newAvailableTabs[0].key);
    }
  };

  // And update the JSX to use currentRole instead of effectiveRole:
  return (
    <View style={styles.mainContainer}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarLogo}>Hospital Manager</Text>
          {/* <Text style={{ color: '#fff' , fontSize:12}}>{hospital.slogan }</Text> */}
          {/* Role Switcher Button (only show if multiple roles) */}
          {availableRoles.length > 1 && (
            <TouchableOpacity 
              style={styles.roleSwitcherButton}
              onPress={() => setRoleSwitcherVisible(true)}
            >
              <Text style={styles.roleSwitcherText}>
                {currentRole.toUpperCase()}
              </Text>
              <Ionicons name="swap-vertical" size={14} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Available Tabs */}
        {availableTabs.length > 0 ? (
          availableTabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.sidebarTab,
                activeTab === tab.key && styles.sidebarTabActive,
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.key ? '#fff' : '#B2DFDB'}
                style={{ marginRight: 12 }}
              />
              <Text style={[
                styles.sidebarTabText,
                activeTab === tab.key && styles.sidebarTabTextActive,
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noTabsMessage}>
            <Text style={styles.noTabsText}>No tabs available for this role</Text>
          </View>
        )}

        {/* User Info */}
        <View style={styles.sidebarUser}>
          <Ionicons name="person-circle" size={32} color="#fff" />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.sidebarUserName}>{user?.name || 'User'}</Text>
            <Text style={styles.sidebarUserRole}>
              {availableRoles.length === 1 
                ? availableRoles[0] 
                : `${availableRoles.length} roles`}
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.contentArea}>
        {/* Stats Grid (Only show if current role is admin) */}
        {currentRole === 'admin' && (
          <View style={styles.statsGrid}>
            <View style={[styles.statItem, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="people" size={18} color="#3498DB" />
              <Text style={styles.statNumber}>{stats.totalPatients}</Text>
              <Text style={styles.statLabel}>Patients</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: '#E8F5E8' }]}>
              <Ionicons name="medical" size={18} color="#27AE60" />
              <Text style={styles.statNumber}>{stats.totalStaff}</Text>
              <Text style={styles.statLabel}>Staff</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: '#FEF5E7' }]}>
              <Ionicons name="calendar" size={18} color="#E67E22" />
              <Text style={styles.statNumber}>{stats.todayAppointments}</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={[styles.statItem, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="cash" size={18} color="#9B59B6" />
              <Text style={styles.statNumber}>${(stats.revenue / 1000).toFixed(0)}K</Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>
        )}

        {/* Tab Content */}
        <ScrollView style={styles.contentScroll}>
          {renderContent()}
        </ScrollView>
      </View>

      {/* Role Switcher Modal */}
      <Modal
        visible={roleSwitcherVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRoleSwitcherVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Switch Role</Text>
            <Text style={styles.modalSubtitle}>Select a role to switch to:</Text>
            
            {availableRoles.map(role => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleOption,
                  currentRole === role && styles.roleOptionSelected
                ]}
                onPress={() => handleRoleSwitch(role)}
              >
                <Text style={[
                  styles.roleOptionText,
                  currentRole === role && styles.roleOptionTextSelected
                ]}>
                  {role.toUpperCase()}
                </Text>
                {currentRole === role && (
                  <Ionicons name="checkmark" size={20} color="#1B9A84" />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setRoleSwitcherVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const SIDEBAR_WIDTH = 220;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    height: screenHeight,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: '#1B9A84',
    paddingTop: 32,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  sidebarHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 32,
  },
  sidebarLogo: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  roleSwitcherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15967D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  roleSwitcherText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  sidebarTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
    width: '100%',
  },
  sidebarTabActive: {
    backgroundColor: '#15967D',
  },
  sidebarTabText: {
    color: '#B2DFDB',
    fontSize: 14,
    fontWeight: '500',
  },
  sidebarTabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sidebarUser: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
    backgroundColor: '#15967D',
    borderRadius: 10,
    padding: 10,
    width: '100%',
    marginBottom: 10,
  },
  sidebarUserName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  sidebarUserRole: {
    color: '#B2DFDB',
    fontSize: 11,
  },
  contentArea: {
    flex: 1,
    padding: 0,
    backgroundColor: '#F8F9FA',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 18,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 2,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  contentScroll: {
    flex: 1,
    padding: 16,
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  noAccessTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 20,
    marginBottom: 10,
  },
  noAccessText: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 5,
  },
  // Add to your styles object:
noTabsMessage: {
  padding: 20,
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
},
noTabsText: {
  color: '#B2DFDB',
  fontSize: 14,
  textAlign: 'center',
  fontStyle: 'italic',
},
  noAccessHint: {
    fontSize: 14,
    color: '#BDC3C7',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#7F8C8D',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 20,
    textAlign: 'center',
  },
  roleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  roleOptionSelected: {
    backgroundColor: '#E0F2F1',
    borderColor: '#1B9A84',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    textTransform: 'uppercase',
  },
  roleOptionTextSelected: {
    color: '#1B9A84',
  },
  modalCancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#E74C3C',
    borderRadius: 8,
  },
  modalCancelText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default UnifiedDashboard;