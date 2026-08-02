// screens/PatientDetailsScreen.tsx - COMPLETE WORKING VERSION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/authContext';
import { useLanguage } from '../context/languageContext';
import { useTheme } from '../context/themeContext';
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  updateDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../services/firebase';

const PatientDetailsScreen = ({ route, navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { user, lab } = useAuth();
  const { patientId, patient: initialPatient } = route.params || {};
  
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [tests, setTests] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      let patientData;
      if (initialPatient) {
        patientData = initialPatient;
      } else {
        const patientRef = doc(db, 'labs', lab?.id, 'patients', patientId);
        const patientDoc = await getDoc(patientRef);
        if (patientDoc.exists()) {
          patientData = { id: patientDoc.id, ...patientDoc.data() };
        }
      }
      
      if (patientData) {
        setPatient(patientData);
        setSelectedStatus(patientData.status || 'pending');
        
        // Fetch tests
        const testsRef = collection(db, 'labs', lab?.id, 'patients', patientData.id, 'tests');
        const testsSnapshot = await getDocs(testsRef);
        const testsData = testsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTests(testsData);
        
        // Fetch bills
        const billsRef = collection(db, 'labs', lab?.id, 'patients', patientData.id, 'bills');
        const billsSnapshot = await getDocs(billsRef);
        const billsData = billsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBills(billsData);
        
        // Fetch appointments
        const appointmentsRef = collection(db, 'labs', lab?.id, 'patients', patientData.id, 'appointments');
        const appointmentsSnapshot = await getDocs(appointmentsRef);
        const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAppointments(appointmentsData);
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
      Alert.alert('Error', 'Failed to load patient data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPatientData();
    setRefreshing(false);
  };

  const updatePatientStatus = async (newStatus: string) => {
    try {
      const patientRef = doc(db, 'labs', lab?.id, 'patients', patient.id);
      await updateDoc(patientRef, {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      setPatient({ ...patient, status: newStatus });
      setSelectedStatus(newStatus);
      setShowStatusModal(false);
      Alert.alert('✅ Success', `Patient status updated to ${newStatus}`);
      fetchPatientData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'inactive': return '#F44336';
      case 'completed': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const getTestStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return '#4CAF50';
      case 'processing': return '#FF9800';
      case 'collected': return '#2196F3';
      case 'requested': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const calculateTotalBills = () => {
    return bills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
  };

  const calculatePaidBills = () => {
    return bills.filter(b => b.status === 'paid').reduce((sum, bill) => sum + (bill.amount || 0), 0);
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
        <View style={styles.patientHeader}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#1A237E" />
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patient?.name}</Text>
            <Text style={styles.patientDetails}>
              {patient?.age} years • {patient?.gender}
            </Text>
            <Text style={styles.patientPhone}>📞 {patient?.phone || 'N/A'}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.statusButton, { backgroundColor: getStatusColor(patient?.status) }]}
            onPress={() => setShowStatusModal(true)}
          >
            <Text style={styles.statusButtonText}>{patient?.status?.toUpperCase() || 'PENDING'}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.contactRow}>
          <View style={styles.contactItem}>
            <Ionicons name="mail" size={16} color="#666" />
            <Text style={styles.contactText}>{patient?.email || 'N/A'}</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.contactText}>{patient?.address || 'N/A'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="flask" size={24} color="#2196F3" />
          <Text style={styles.statNumber}>{tests.length}</Text>
          <Text style={styles.statLabel}>Tests</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="cash" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{calculateTotalBills()} FCFA</Text>
          <Text style={styles.statLabel}>Total Bills</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="calendar" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{appointments.length}</Text>
          <Text style={styles.statLabel}>Appointments</Text>
        </View>
      </View>

      <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
        <Text style={styles.sectionTitle}>Recent Tests</Text>
        {tests.slice(0, 3).map((test, index) => (
          <View key={index} style={styles.testItem}>
            <View style={styles.testInfo}>
              <Text style={styles.testName}>{test.testName}</Text>
              <Text style={styles.testDate}>
                {test.requestedDate ? new Date(test.requestedDate).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
            <View style={[styles.testStatusBadge, { backgroundColor: getTestStatusColor(test.status) }]}>
              <Text style={styles.testStatusText}>{test.status || 'requested'}</Text>
            </View>
          </View>
        ))}
        {tests.length === 0 && (
          <Text style={styles.emptyText}>No tests recorded</Text>
        )}
      </View>
    </View>
  );

  const renderTestsTab = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={tests}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={({ item }) => (
          <View style={[styles.testCard, { backgroundColor: colors.surface }]}>
            <View style={styles.testCardHeader}>
              <Text style={styles.testCardName}>{item.testName}</Text>
              <View style={[styles.testStatusBadge, { backgroundColor: getTestStatusColor(item.status) }]}>
                <Text style={styles.testStatusText}>{item.status || 'requested'}</Text>
              </View>
            </View>
            <Text style={styles.testCardCategory}>{item.category}</Text>
            <Text style={styles.testCardDate}>
              Requested: {item.requestedDate ? new Date(item.requestedDate).toLocaleDateString() : 'N/A'}
            </Text>
            {item.status === 'completed' && (
              <TouchableOpacity 
                style={styles.viewResultButton}
                onPress={() => Alert.alert('Result', item.result || 'No result available')}
              >
                <Text style={styles.viewResultText}>View Result</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="flask-outline" size={50} color="#ccc" />
            <Text style={styles.emptyStateText}>No tests found</Text>
          </View>
        }
        scrollEnabled={false}
      />
    </View>
  );

  const renderBillsTab = () => (
    <View style={styles.tabContent}>
      <View style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
        <Text style={styles.summaryTitle}>Billing Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Bills</Text>
          <Text style={styles.summaryValue}>{calculateTotalBills()} FCFA</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Paid</Text>
          <Text style={[styles.summaryValue, { color: '#4CAF50' }]}>{calculatePaidBills()} FCFA</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Balance</Text>
          <Text style={[styles.summaryValue, { color: '#F44336' }]}>
            {calculateTotalBills() - calculatePaidBills()} FCFA
          </Text>
        </View>
      </View>

      <FlatList
        data={bills}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={({ item }) => (
          <View style={[styles.billCard, { backgroundColor: colors.surface }]}>
            <View style={styles.billHeader}>
              <Text style={styles.billDescription}>{item.description}</Text>
              <Text style={styles.billAmount}>{item.amount || 0} FCFA</Text>
            </View>
            <View style={styles.billFooter}>
              <Text style={styles.billCategory}>{item.category}</Text>
              <View style={[styles.billStatusBadge, { 
                backgroundColor: item.status === 'paid' ? '#4CAF50' : '#FF9800' 
              }]}>
                <Text style={styles.billStatusText}>{item.status || 'pending'}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={50} color="#ccc" />
            <Text style={styles.emptyStateText}>No bills found</Text>
          </View>
        }
        scrollEnabled={false}
      />
    </View>
  );

  const renderAppointmentsTab = () => (
    <View style={styles.tabContent}>
      <FlatList
        data={appointments}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={({ item }) => (
          <View style={[styles.appointmentCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.appointmentTitle}>{item.title}</Text>
            <Text style={styles.appointmentDate}>
              📅 {item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}
            </Text>
            <Text style={styles.appointmentTime}>⏰ {item.time || 'N/A'}</Text>
            <Text style={styles.appointmentLocation}>📍 {item.location || 'N/A'}</Text>
            <View style={[styles.appointmentStatus, { 
              backgroundColor: item.status === 'completed' ? '#4CAF50' : 
                             item.status === 'cancelled' ? '#F44336' : '#FF9800' 
            }]}>
              <Text style={styles.appointmentStatusText}>{item.status || 'scheduled'}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={50} color="#ccc" />
            <Text style={styles.emptyStateText}>No appointments found</Text>
          </View>
        }
        scrollEnabled={false}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading patient data...</Text>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={60} color="#F44336" />
        <Text style={styles.errorText}>Patient not found</Text>
        <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.goBack()}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabContainer}>
        {['overview', 'tests', 'bills', 'appointments'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'tests' && renderTestsTab()}
        {activeTab === 'bills' && renderBillsTab()}
        {activeTab === 'appointments' && renderAppointmentsTab()}
      </ScrollView>

      <Modal visible={showStatusModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={styles.modalTitle}>Update Status</Text>
            {['pending', 'active', 'inactive'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  selectedStatus === status && styles.statusOptionSelected
                ]}
                onPress={() => updatePatientStatus(status)}
              >
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                <Text style={styles.statusOptionText}>{status.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={styles.modalCloseButton} 
              onPress={() => setShowStatusModal(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginTop: 15,
    fontFamily: 'Poppins-Medium',
  },
  goBackButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#1A237E',
    borderRadius: 8,
  },
  goBackText: {
    color: 'white',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Poppins-Bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1A237E',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Medium',
  },
  activeTabText: {
    color: '#1A237E',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8EAF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A237E',
    fontFamily: 'Poppins-Bold',
  },
  patientDetails: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  patientPhone: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  contactRow: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'Poppins-Regular',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A237E',
    marginVertical: 4,
    fontFamily: 'Poppins-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 12,
    fontFamily: 'Poppins-Bold',
  },
  testItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'Poppins-Medium',
  },
  testDate: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  testStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  testStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  testCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
  },
  testCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  testCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  testCardCategory: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  testCardDate: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  viewResultButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#E8EAF6',
    borderRadius: 8,
    alignItems: 'center',
  },
  viewResultText: {
    color: '#1A237E',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 12,
    fontFamily: 'Poppins-Bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  billCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'Poppins-Medium',
    flex: 1,
  },
  billAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A237E',
    fontFamily: 'Poppins-Bold',
  },
  billFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billCategory: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  billStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  billStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  appointmentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  appointmentDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  appointmentTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  appointmentLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  appointmentStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  appointmentStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    fontFamily: 'Poppins-Medium',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A237E',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins-Bold',
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  statusOptionSelected: {
    backgroundColor: '#E8EAF6',
    borderWidth: 1,
    borderColor: '#1A237E',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'Poppins-Medium',
  },
  modalCloseButton: {
    marginTop: 12,
    padding: 14,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default PatientDetailsScreen;