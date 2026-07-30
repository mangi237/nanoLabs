// screens/admin/AdminDashboard.tsx
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/authContext';
import Overview from '../../components/admin/Overview';
import ManageStaff from '../../components/admin/ManageStaff';
import PatientList from '../../components/medical/PatientList';
import PharmacyDashboard from '../../screens/pharmacist/pharmacistDashboard';
import Analytics from '../../components/admin/Analatytics';
import WardDashboard from '../Ward/WardDashboard';
import CashierDashboard from '../cashier/CashierDashboard';
import { Patient } from '../../types/Patient';

const { width } = Dimensions.get('window');
const screenHeight = Dimensions.get('window').height;

const sidebarTabs = [
  { key: 'Overview', icon: 'speedometer', label: 'Overview' },
  { key: 'Staff', icon: 'people', label: 'Staff' },
  { key: 'Patients', icon: 'medical', label: 'Patients' },
  { key: 'Stock', icon: 'cube', label: 'Pharmacy' },
  { key: 'Analytics', icon: 'stats-chart', label: 'Analytics' },
  { key: 'Wards', icon: 'business', label: 'Wards' },
  { key: 'Billing', icon: 'card', label: 'Billing' },
  // {key : 'Doctor'}
  { key: 'Reports', icon: 'document-text', label: 'Reports' },
];

const AdminDashboard: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activeTab, setActiveTab] = useState('Overview');
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalStaff: 0,
    todayAppointments: 0,
    revenue: 0,
    occupiedBeds: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    
    try {
      setLoading(true);

      // Fetch patients
      const patientsQuery = query(collection(db, 'hospitals', user.hospitalId, 'patients'));
      const patientsSnapshot = await getDocs(patientsQuery);

      // Fetch staff for this hospital
      const staffQuery = query(collection(db, `hospitals/${user.hospitalId}/staffs`));
      const staffSnapshot = await getDocs(staffQuery);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Today's appointments count
      const todayAppointments = patientsSnapshot.docs.filter(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        return createdAt >= today;
      }).length;

      // Calculate total revenue from bills
      let totalRevenue = 0;
      const billsQuery = query(collection(db, 'bills'), where('status', '==', 'paid'));
      const billsSnapshot = await getDocs(billsQuery);
      billsSnapshot.forEach(doc => {
        const billData = doc.data();
        totalRevenue += billData.amount || 0;
      });

      // Count occupied beds (patients with status 'admitted')
      const occupiedBeds = patientsSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.status === 'admitted';
      }).length;

      setStats({
        totalPatients: patientsSnapshot.docs.length,
        totalStaff: staffSnapshot.size,
        todayAppointments,
        revenue: totalRevenue,
        occupiedBeds,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      Alert.alert('Error', 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview':
        return <Overview onPatientSelect={() => {}} />; // Fix: Added missing prop
      case 'Staff':
        return <ManageStaff />;
      case 'Patients':
        return <PatientList />;
      case 'Stock':
        return <PharmacyDashboard />;
      case 'Analytics':
        return <Analytics />;
      
      case 'Wards':
        return <WardDashboard />;
      case 'Billing':
        return <CashierDashboard />;
      case 'Reports':
        return <Text>You Can ask for a summary Report By Contacting Nano Tech</Text>;
      default:
        return <Overview onPatientSelect={() => {}} />; // Fix: Added missing prop
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#1E96A9" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <Text style={styles.sidebarLogo}>${user?.hospitalName}</Text>
        {sidebarTabs.map(tab => (
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
        ))}
        <View style={styles.sidebarUser}>
          <Ionicons name="person-circle" size={32} color="#fff" />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.sidebarUserName}>{user?.name || 'Admin'}</Text>
            <Text style={styles.sidebarUserRole}>Administrator</Text>
          </View>
        </View>
      </View>
      
      {/* Main Content */}
      <View style={styles.contentArea}>
        {/* Stats Grid */}
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
        
        {/* Tab Content */}
        <ScrollView style={styles.contentScroll}>
          {renderContent()}
        </ScrollView>
      </View>
    </View>
  );
};

const SIDEBAR_WIDTH = 200;

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
  sidebarLogo: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 32,
    alignSelf: 'center',
  },
  sidebarTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
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
    fontSize: 15,
    fontWeight: '500',
  },
  sidebarTabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sidebarUser: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    backgroundColor: '#15967D',
    borderRadius: 10,
    padding: 10,
    width: '100%',
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
});

export default AdminDashboard;