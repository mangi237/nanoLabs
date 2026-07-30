// screens/PatientDetailsScreen.tsx - COMPLETE UPDATED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  Linking, 
  Image, 
  TextInput,
  ActivityIndicator,
  FlatList,
  Dimensions,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  doc, 
  updateDoc, 
  collection, 
  addDoc, 
  onSnapshot, 
  serverTimestamp, 
  Timestamp,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/authContext';
import { Patient, ClinicalNote, Vitals, Bill, LabTest, PatientStatus, MedicationPrescription, WardAssignment } from '../types/Patient';
import ConsultationNotesModal from '../components/doctor/ConsultationNotesModal';
import RecordVitalsModal from '../components/nurse/RecordVitalsModal';
import AddBillModal from '../components/common/AddBillModal';
import LabTestModal from '../components/lab/LabTestModal';
import AppointmentModal from '../components/medical/AppointmentList'; // Fixed import
import MedicationPrescriptionModal from '../components/doctor/PrescribeMedicationModal';
import WardManagementModal from '../components/ward/WardManagementModal';
import DoctorReferralModal from '../components/doctor/DoctorReferralModal';
import { sendUpdateNotification } from '../services/emailService';
import { safeToDate } from '../utils/safeToDate';
import { checkAccess, logAccess, getRolePermissions } from '../utils/accessControl';

const { width } = Dimensions.get('window');

interface PatientDetailsScreenProps {
  route: any;
  navigation: any;
}

const PatientDetailsScreen: React.FC<PatientDetailsScreenProps> = ({ route, navigation }) => {
  const { patient: initialPatient } = route.params;
  const [patient, setPatient] = useState<Patient | null>(initialPatient);
  const [medicalRecords, setMedicalRecords] = useState<ClinicalNote[]>([]);
  const [vitalsHistory, setVitalsHistory] = useState<Vitals[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [medications, setMedications] = useState<MedicationPrescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'medical' | 'billing' | 'lab' | 'appointments' | 'medications' | 'ward'>('overview');
  
  // Modal states
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showLabTestModal, setShowLabTestModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showWardModal, setShowWardModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  
  const [selectedPayment, setSelectedPayment] = useState<Bill | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<PatientStatus>(initialPatient?.status || 'registered');
  const [accessCode, setAccessCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);
  
  const { user: currentUser } = useAuth();

  const permissions = getRolePermissions(currentUser?.role || '');

  useEffect(() => {
    if (patient?.id && currentUser?.hospitalId) {
      verifyAccess();
      setupRealTimeListeners();
    }
  }, [patient?.id, currentUser?.hospitalId]);

  const verifyAccess = async () => {
    if (!patient?.id || !currentUser) return;

    try {
      const accessCheck = await checkAccess(
        patient.id,
        currentUser.hospitalId,
        {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role || '',
          hospitalId: currentUser.hospitalId
        }
      );

      if (!accessCheck.allowed) {
        if (accessCheck.requiresEmergencyOverride) {
          Alert.alert(
            'Access Restricted',
            'This patient has restricted your access. Use Emergency Override if this is a medical emergency.',
            [
              { text: 'Go Back', onPress: () => navigation.goBack() },
              { 
                text: 'Emergency Override', 
                onPress: () => handleEmergencyOverride(),
                style: 'destructive'
              }
            ]
          );
        } else {
          Alert.alert('Access Denied', accessCheck.reason || 'You do not have permission to access this patient', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        }
        setHasAccess(false);
        return;
      }

      await logAccess(
        patient.id,
        currentUser.hospitalId,
        {
          id: currentUser.id,
          name: currentUser.name,
          role: currentUser.role || '',
          hospitalId: currentUser.hospitalId
        },
        'Viewed Patient Details',
        'normal',
        ['demographics', 'overview']
      );

      setHasAccess(true);
    } catch (error) {
      console.error('Error verifying access:', error);
    }
  };

  const handleEmergencyOverride = () => {
    Alert.prompt(
      'Emergency Override',
      'Please state the emergency reason for accessing this patient:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Override',
          onPress: async (reason) => {
            if (!reason || reason.trim().length < 10) {
              Alert.alert('Error', 'Please provide a detailed reason (minimum 10 characters)');
              return;
            }

            await logAccess(
              patient!.id!,
              currentUser!.hospitalId,
              {
                id: currentUser!.id,
                name: currentUser!.name,
                role: currentUser!.role || '',
                hospitalId: currentUser!.hospitalId
              },
              'Emergency Override Access',
              'emergency_override',
              ['all'],
              reason
            );

            setHasAccess(true);
            Alert.alert('Access Granted', 'This access has been logged and will be reviewed by compliance.');
          }
        }
      ],
      'plain-text'
    );
  };

  const setupRealTimeListeners = () => {
    if (!patient?.id || !currentUser?.hospitalId) return;

    const patientRef = doc(db, 'hospitals', currentUser.hospitalId, 'patients', patient.id);
    
    const patientUnsubscribe = onSnapshot(patientRef, (doc) => {
      if (doc.exists()) {
        const patientData = { id: doc.id, ...doc.data() } as Patient;
        setPatient(patientData);
      }
    });

    // Notes listener
    const notesUnsubscribe = onSnapshot(
      collection(db, 'hospitals', currentUser.hospitalId, 'patients', patient.id, 'clinicalNotes'),
      (snapshot) => {
        const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ClinicalNote[];
        setMedicalRecords(records.sort((a, b) => safeToDate(b.timestamp).getTime() - safeToDate(a.timestamp).getTime()));
      }
    );

    // Vitals listener
    const vitalsUnsubscribe = onSnapshot(
      collection(db, 'hospitals', currentUser.hospitalId, 'patients', patient.id, 'vitals'),
      (snapshot) => {
        const vitals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Vitals[];
        setVitalsHistory(vitals.sort((a, b) => safeToDate(b.timestamp).getTime() - safeToDate(a.timestamp).getTime()));
      }
    );

    // Bills listener
    const billsUnsubscribe = onSnapshot(
      collection(db, 'hospitals', currentUser.hospitalId, 'patients', patient.id, 'bills'),
      (snapshot) => {
        const patientBills = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Bill[];
        setBills(patientBills.sort((a, b) => safeToDate(b.createdAt).getTime() - safeToDate(a.createdAt).getTime()));
      }
    );

    // Lab tests listener
    const labTestsUnsubscribe = onSnapshot(
      collection(db, 'hospitals', currentUser.hospitalId, 'patients', patient.id, 'labTests'),
      (snapshot) => {
        const tests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LabTest[];
        setLabTests(tests.sort((a, b) => safeToDate(b.requestedDate || b.createdAt).getTime() - safeToDate(a.requestedDate || a.createdAt).getTime()));
      }
    );

    // Appointments listener
    const appointmentsUnsubscribe = onSnapshot(
      collection(db, 'hospitals', currentUser.hospitalId, 'patients', patient.id, 'appointments'),
      (snapshot) => {
        const apps = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          date: doc.data().date ? doc.data().date : null 
        })) as any[];
        setAppointments(apps.sort((a, b) => safeToDate(a.date).getTime() - safeToDate(b.date).getTime()));
      }
    );

    // Medications listener
    const medicationsUnsubscribe = onSnapshot(
      collection(db, 'hospitals', currentUser.hospitalId, 'patients', patient.id, 'medications'),
      (snapshot) => {
        const meds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MedicationPrescription[];
        setMedications(meds.sort((a, b) => safeToDate(b.prescribedDate).getTime() - safeToDate(a.prescribedDate).getTime()));
      }
    );

    return () => {
      patientUnsubscribe();
      notesUnsubscribe();
      vitalsUnsubscribe();
      billsUnsubscribe();
      labTestsUnsubscribe();
      appointmentsUnsubscribe();
      medicationsUnsubscribe();
    };
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setupRealTimeListeners();
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  const calculateTotalBill = () => bills.filter(bill => bill.status === 'pending' || bill.status === 'paid').reduce((total, bill) => total + bill.amount, 0);
  const calculatePaidAmount = () => bills.filter(bill => bill.status === 'paid').reduce((total, bill) => total + bill.amount, 0);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'registered': '#6366F1',
      'admitted': '#8B5CF6',
      'discharged': '#6B7280',
      'emergency': '#EF4444',
      'waiting': '#F59E0B',
      'completed': '#10B981'
    };
    return colors[status] || '#6B7280';
  };

  const updatePatientStatus = async (newStatus: PatientStatus) => {
    if (!patient?.id || !currentUser?.hospitalId) return;

    if (newStatus === 'admitted') {
      setShowWardModal(true);
      setShowStatusModal(false);
      return;
    }
    
    try {
      await updateDoc(
        doc(db, 'hospitals', currentUser.hospitalId, 'patients', patient.id),
        {
          status: newStatus,
          ...(newStatus === 'discharged' && { dischargeDate: Timestamp.now() }),
          updatedAt: serverTimestamp(),
        }
      );

      Alert.alert('Success', `Patient status updated to ${newStatus}`);
      setShowStatusModal(false);
    } catch (error) {
      console.error('Error updating patient status:', error);
      Alert.alert('Error', 'Failed to update patient status');
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    if (!patient?.id || !currentUser?.hospitalId) return;

    try {
      const appointmentRef = doc(db, 'hospitals', currentUser.hospitalId, 'patients', patient.id, 'appointments', appointmentId);
      await updateDoc(appointmentRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });

      Alert.alert('Success', `Appointment marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('Error', 'Failed to update appointment');
    }
  };

  const handleApproveBill = async (bill: Bill) => {
    if (!patient?.id || !currentUser?.hospitalId) return;

    try {
      const billRef = doc(db, 'hospitals', currentUser.hospitalId, 'patients', patient.id, 'bills', bill.id!);
      
      await updateDoc(billRef, {
        status: 'paid',
        paidAt: Timestamp.now(),
        paidBy: currentUser.id
      });

      Alert.alert('Success', 'Bill approved and marked as paid');
    } catch (error) {
      console.error('Error approving bill:', error);
      Alert.alert('Error', 'Failed to approve bill');
    }
  };

  // Render functions for each tab
  const renderVitalItem = ({ item }: { item: Vitals }) => {
    const timestamp = safeToDate(item.timestamp);
    
    return (
      <View style={styles.vitalCard}>
        <View style={styles.vitalHeader}>
          <Text style={styles.vitalDate}>
            {timestamp.toLocaleDateString()}
          </Text>
          <Text style={styles.vitalTime}>
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.vitalGrid}>
          <View style={styles.vitalMetric}>
            <View style={[styles.vitalIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="thermometer" size={16} color="#D97706" />
            </View>
            <View>
              <Text style={styles.vitalLabel}>Temperature</Text>
              <Text style={styles.vitalValue}>{item.temperature}°C</Text>
            </View>
          </View>
          <View style={styles.vitalMetric}>
            <View style={[styles.vitalIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="speedometer" size={16} color="#1D4ED8" />
            </View>
            <View>
              <Text style={styles.vitalLabel}>Blood Pressure</Text>
              <Text style={styles.vitalValue}>{item.bloodPressure}</Text>
            </View>
          </View>
          <View style={styles.vitalMetric}>
            <View style={[styles.vitalIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="heart" size={16} color="#DC2626" />
            </View>
            <View>
              <Text style={styles.vitalLabel}>Heart Rate</Text>
              <Text style={styles.vitalValue}>{item.heartRate} bpm</Text>
            </View>
          </View>
          <View style={styles.vitalMetric}>
            <View style={[styles.vitalIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="water" size={16} color="#059669" />
            </View>
            <View>
              <Text style={styles.vitalLabel}>SpO2</Text>
              <Text style={styles.vitalValue}>{item.oxygenSaturation}%</Text>
            </View>
          </View>
        </View>
        <Text style={styles.vitalRecorded}>Recorded by: {item.recordedBy}</Text>
      </View>
    );
  };

  const renderBillItem = ({ item }: { item: Bill }) => {
    const timestamp = safeToDate(item.createdAt);
    
    return (
      <TouchableOpacity 
        style={styles.billCard}
        onPress={() => {
          if (permissions.canValidatePayment && item.status === 'pending') {
            setSelectedPayment(item);
            setShowPaymentModal(true);
          }
        }}
      >
        <View style={styles.billHeader}>
          <View style={styles.billInfo}>
            <Text style={styles.billDescription}>{item.description}</Text>
            <Text style={styles.billCategory}>{item.category}</Text>
          </View>
          <Text style={styles.billAmount}>${item.amount.toFixed(2)}</Text>
        </View>
        <View style={styles.billFooter}>
          <View style={[
            styles.billStatus, 
            { backgroundColor: item.status === 'paid' ? '#DCFCE7' : '#FEF3C7' }
          ]}>
            <View style={[
              styles.statusDot, 
              { backgroundColor: item.status === 'paid' ? '#10B981' : '#F59E0B' }
            ]} />
            <Text style={[
              styles.billStatusText,
              { color: item.status === 'paid' ? '#065F46' : '#92400E' }
            ]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.billDate}>
            {timestamp.toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLabTestItem = ({ item }: { item: LabTest }) => {
    const timestamp = safeToDate(item.requestedDate || item.createdAt);
    const statusColors: { [key: string]: { bg: string, text: string } } = {
      'requested': { bg: '#FEF3C7', text: '#92400E' },
      'sample-collected': { bg: '#DBEAFE', text: '#1E40AF' },
      'in-progress': { bg: '#F3E8FF', text: '#5B21B6' },
      'completed': { bg: '#DCFCE7', text: '#065F46' },
      'cancelled': { bg: '#FEE2E2', text: '#991B1B' }
    };

    const statusStyle = statusColors[item.status] || { bg: '#F3F4F6', text: '#374151' };

    return (
      <View style={styles.labTestCard}>
        <View style={styles.testHeader}>
          <View style={styles.testInfo}>
            <Text style={styles.testName}>{item.name}</Text>
            <Text style={styles.testDescription}>{item.description}</Text>
          </View>
          <View style={[styles.testStatus, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.testStatusText, { color: statusStyle.text }]}>
              {item.status.replace('-', ' ')}
            </Text>
          </View>
        </View>
        <View style={styles.testDetails}>
          <View style={styles.testMeta}>
            <Text style={styles.testPrice}>${item.price?.toFixed(2)}</Text>
            <Text style={styles.testCategory}>{item.category}</Text>
          </View>
          <Text style={styles.testDate}>Requested: {timestamp.toLocaleDateString()}</Text>
        </View>
        {item.resultFile && (
          <TouchableOpacity 
            style={styles.resultButton}
            onPress={() => Linking.openURL(item.resultFile!.url)}
          >
            <Ionicons name="document-text" size={16} color="#3B82F6" />
            <Text style={styles.resultButtonText}>View Results</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderAppointmentItem = ({ item }: { item: any }) => {
    const appointmentDate = safeToDate(item.date);
    const isToday = appointmentDate.toDateString() === new Date().toDateString();
    
    return (
      <TouchableOpacity 
        style={[styles.billCard, isToday && styles.todayAppointment]}
        onPress={() => handleUpdateAppointmentStatus(item.id, 'completed')}
      >
        <View style={styles.billHeader}>
          <View style={styles.billInfo}>
            <Text style={styles.billDescription}>{item.title}</Text>
            <Text style={styles.billCategory}>{item.type}</Text>
          </View>
          <View>
            <Text style={styles.billAmount}>{item.time}</Text>
            <Text style={styles.billDate}>{appointmentDate.toLocaleDateString()}</Text>
          </View>
        </View>
        <View style={styles.billFooter}>
          <View style={[
            styles.billStatus, 
            { backgroundColor: item.status === 'completed' ? '#DCFCE7' : '#FEF3C7' }
          ]}>
            <Text style={[
              styles.billStatusText,
              { color: item.status === 'completed' ? '#065F46' : '#92400E' }
            ]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.billDate}>
            {item.location}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMedicationItem = ({ item }: { item: MedicationPrescription }) => {
    const startDate = safeToDate(item.startDate);
    const endDate = safeToDate(item.endDate);
    
    return (
      <View style={styles.medicationCard}>
        <View style={styles.medicationHeader}>
          <Text style={styles.medicationName}>{item.medicationName}</Text>
          <View style={[
            styles.medicationStatus,
            { backgroundColor: item.status === 'active' ? '#DCFCE7' : '#FEE2E2' }
          ]}>
            <Text style={[
              styles.medicationStatusText,
              { color: item.status === 'active' ? '#065F46' : '#991B1B' }
            ]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <View style={styles.medicationDetails}>
          <Text style={styles.medicationDosage}>{item.dosage} - {item.frequency}</Text>
          <Text style={styles.medicationDuration}>
            {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()} ({item.duration} days)
          </Text>
          {item.instructions && (
            <Text style={styles.medicationInstructions}>Instructions: {item.instructions}</Text>
          )}
        </View>
        <Text style={styles.medicationPrescriber}>Prescribed by: {item.prescribedByName}</Text>
      </View>
    );
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.patientCard}>
        <View style={styles.patientHeader}>
          {patient?.profileImage ? (
            <Image source={{ uri: patient.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Ionicons name="person" size={40} color="#6366F1" />
            </View>
          )}
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{patient?.name}</Text>
            <View style={styles.patientMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar" size={14} color="#6B7280" />
                <Text style={styles.metaText}>{patient?.age} years</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="person" size={14} color="#6B7280" />
                <Text style={styles.metaText}>{patient?.gender}</Text>
              </View>
              {patient?.bloodType && (
                <View style={styles.metaItem}>
                  <Ionicons name="water" size={14} color="#DC2626" />
                  <Text style={styles.metaText}>{patient.bloodType}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={styles.patientContact}>
          <View style={styles.contactItem}>
            <Ionicons name="call" size={16} color="#6366F1" />
            <Text style={styles.contactText}>{patient?.phone}</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="mail" size={16} color="#6366F1" />
            <Text style={styles.contactText}>{patient?.email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statsCard, { backgroundColor: '#F0F9FF' }]}>
          <Ionicons name="pulse" size={24} color="#0EA5E9" />
          <Text style={styles.statsValue}>{vitalsHistory.length}</Text>
          <Text style={styles.statsLabel}>Vitals Recorded</Text>
        </View>
        
        <View style={[styles.statsCard, { backgroundColor: '#F0FDF4' }]}>
          <Ionicons name="clipboard" size={24} color="#10B981" />
          <Text style={styles.statsValue}>{medicalRecords.length}</Text>
          <Text style={styles.statsLabel}>Medical Notes</Text>
        </View>
        
        <View style={[styles.statsCard, { backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="flask" size={24} color="#F59E0B" />
          <Text style={styles.statsValue}>{labTests.length}</Text>
          <Text style={styles.statsLabel}>Lab Tests</Text>
        </View>
        
        <View style={[styles.statsCard, { backgroundColor: '#FEF2F2' }]}>
          <Ionicons name="card" size={24} color="#EF4444" />
          <Text style={styles.statsValue}>${calculateTotalBill().toFixed(0)}</Text>
          <Text style={styles.statsLabel}>Total Bills</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Vitals</Text>
          {permissions.canRecordVitals && (
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setShowVitalsModal(true)}
            >
              <Ionicons name="add-circle" size={24} color="#6366F1" />
            </TouchableOpacity>
          )}
        </View>
        {vitalsHistory.length > 0 ? (
          <FlatList
            data={vitalsHistory.slice(0, 3)}
            renderItem={renderVitalItem}
            keyExtractor={item => item.id || Math.random().toString()}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>No vitals recorded yet</Text>
            {permissions.canRecordVitals && (
              <TouchableOpacity 
                style={styles.emptySectionButton}
                onPress={() => setShowVitalsModal(true)}
              >
                <Ionicons name="add" size={16} color="#6366F1" />
                <Text style={styles.emptySectionButtonText}>Record Vitals</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );

  const renderMedicalTab = () => (
    <View style={styles.tabContent}>
      {permissions.canAddConsultationNotes && (
        <TouchableOpacity 
          style={styles.addNoteButton}
          onPress={() => setShowConsultationModal(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addNoteButtonText}>Add Clinical Note</Text>
        </TouchableOpacity>
      )}

      {medicalRecords.length > 0 ? (
        <FlatList
          data={medicalRecords}
          renderItem={({ item }) => {
            const timestamp = safeToDate(item.timestamp);
            return (
              <View style={styles.recordItem}>
                <View style={styles.recordHeader}>
                  <Text style={styles.recordTitle}>{item.noteType} Note</Text>
                  <Text style={styles.recordDate}>
                    {timestamp.toLocaleDateString()} • {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                {item.content && <Text style={styles.recordContent}>{item.content}</Text>}
                <Text style={styles.recordAuthor}>Dr. {item.authorName}</Text>
              </View>
            );
          }}
          keyExtractor={item => item.id || Math.random().toString()}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyStateTitle}>No Medical Records</Text>
          <Text style={styles.emptyStateText}>
            Start by adding clinical notes to track patient history
          </Text>
          {permissions.canAddConsultationNotes && (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => setShowConsultationModal(true)}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Add First Note</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderBillingTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Billing Summary</Text>
          {permissions.canAddBills && (
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setShowBillModal(true)}
            >
              <Ionicons name="add-circle" size={24} color="#6366F1" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.billingSummary}>
          <View style={styles.billingItem}>
            <View style={[styles.billingIcon, { backgroundColor: '#F0F9FF' }]}>
              <Ionicons name="wallet" size={20} color="#0EA5E9" />
            </View>
            <View>
              <Text style={styles.billingLabel}>Total Bills</Text>
              <Text style={styles.billingAmount}>${calculateTotalBill().toFixed(2)}</Text>
            </View>
          </View>
          
          <View style={styles.billingItem}>
            <View style={[styles.billingIcon, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>
            <View>
              <Text style={styles.billingLabel}>Paid Amount</Text>
              <Text style={[styles.billingAmount, { color: '#10B981' }]}>
                ${calculatePaidAmount().toFixed(2)}
              </Text>
            </View>
          </View>
          
          <View style={styles.billingItem}>
            <View style={[styles.billingIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="alert-circle" size={20} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.billingLabel}>Balance Due</Text>
              <Text style={[styles.billingAmount, { color: '#EF4444' }]}>
                ${(calculateTotalBill() - calculatePaidAmount()).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {bills.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bills</Text>
          </View>
          <FlatList
            data={bills.slice(0, 5)}
            renderItem={renderBillItem}
            keyExtractor={item => item.id || Math.random().toString()}
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  );

  const renderLabTab = () => (
    <View style={styles.tabContent}>
      {permissions.canAddLabTests && (
        <TouchableOpacity 
          style={styles.addNoteButton}
          onPress={() => setShowLabTestModal(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addNoteButtonText}>Request Lab Test</Text>
        </TouchableOpacity>
      )}

      {labTests.length > 0 ? (
        <FlatList
          data={labTests}
          renderItem={renderLabTestItem}
          keyExtractor={item => item.id || Math.random().toString()}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="flask-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyStateTitle}>No Lab Tests</Text>
          <Text style={styles.emptyStateText}>
            Request lab tests to monitor patient health metrics
          </Text>
          {permissions.canAddLabTests && (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => setShowLabTestModal(true)}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Request Test</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderAppointmentsTab = () => (
    <View style={styles.tabContent}>
      {permissions.canAddAppointments && (
        <TouchableOpacity 
          style={styles.addNoteButton}
          onPress={() => setShowAppointmentModal(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addNoteButtonText}>Schedule Appointment</Text>
        </TouchableOpacity>
      )}

      {appointments.length > 0 ? (
        <FlatList
          data={appointments}
          renderItem={renderAppointmentItem}
          keyExtractor={item => item.id || Math.random().toString()}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyStateTitle}>No Appointments</Text>
          <Text style={styles.emptyStateText}>
            Schedule appointments for this patient
          </Text>
          {permissions.canAddAppointments && (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => setShowAppointmentModal(true)}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Schedule First Appointment</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderMedicationsTab = () => (
    <View style={styles.tabContent}>
      {permissions.canPrescribeMedication && (
        <TouchableOpacity 
          style={styles.addNoteButton}
          onPress={() => setShowMedicationModal(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addNoteButtonText}>Prescribe Medication</Text>
        </TouchableOpacity>
      )}

      {medications.length > 0 ? (
        <FlatList
          data={medications}
          renderItem={renderMedicationItem}
          keyExtractor={item => item.id || Math.random().toString()}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="medkit-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyStateTitle}>No Medications</Text>
          <Text style={styles.emptyStateText}>
            Prescribe medications for this patient
          </Text>
          {permissions.canPrescribeMedication && (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => setShowMedicationModal(true)}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Prescribe Medication</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderWardTab = () => (
    <View style={styles.tabContent}>
      {patient?.status === 'admitted' ? (
        <View style={styles.wardCard}>
          <View style={styles.wardHeader}>
            <Ionicons name="bed" size={40} color="#8B5CF6" />
            <View style={styles.wardInfo}>
              <Text style={styles.wardTitle}>Currently Admitted</Text>
              <Text style={styles.wardSubtitle}>
                {patient.currentWardAssignment?.wardName|| 'General Ward'} • Bed {patient.currentWardAssignment?.bedNumber || 'N/A'}
              </Text>
              <Text style={styles.wardRate}>
                ${patient.currentWardAssignment?.dailyRate || 0}/day
              </Text>
            </View>
          </View>
          {permissions.canUpdateStatus && (
            <TouchableOpacity 
              style={styles.dischargeButton}
              onPress={() => updatePatientStatus('discharged')}
            >
              <Ionicons name="log-out" size={16} color="white" />
              <Text style={styles.dischargeButtonText}>Discharge Patient</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="bed-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyStateTitle}>Not Admitted</Text>
          <Text style={styles.emptyStateText}>
            Patient is not currently admitted to any ward
          </Text>
          {permissions.canUpdateStatus && (
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => {
                setSelectedStatus('admitted');
                setShowStatusModal(true);
              }}
            >
              <Ionicons name="bed" size={20} color="white" />
              <Text style={styles.primaryButtonText}>Admit to Ward</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  if (!hasAccess) {
    return (
      <View style={styles.accessDeniedContainer}>
        <Ionicons name="lock-closed" size={80} color="#EF4444" />
        <Text style={styles.accessDeniedTitle}>Access Restricted</Text>
        <Text style={styles.accessDeniedText}>You do not have permission to view this patient's records.</Text>
      </View>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'medical': return renderMedicalTab();
      case 'billing': return renderBillingTab();
      case 'lab': return renderLabTab();
      case 'appointments': return renderAppointmentsTab();
      case 'medications': return renderMedicationsTab();
      case 'ward': return renderWardTab();
      default: return renderOverviewTab();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Patient Details</Text>
          <Text style={styles.headerSubtitle}>ID: {patient?.patientId}</Text>
        </View>
        {permissions.canUpdateStatus && (
          <TouchableOpacity 
            style={styles.statusUpdateButton}
            onPress={() => {
              setSelectedStatus(patient?.status || 'registered');
              setShowStatusModal(true);
            }}
          >
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(patient?.status || '') }]} />
            <Text style={styles.statusButtonText}>{patient?.status}</Text>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'overview', label: 'Overview', icon: 'information-circle' },
            { key: 'medical', label: 'Medical', icon: 'clipboard' },
            { key: 'billing', label: 'Billing', icon: 'card' },
            { key: 'lab', label: 'Lab', icon: 'flask' },
            { key: 'appointments', label: 'Appointments', icon: 'calendar' },
            { key: 'medications', label: 'Medications', icon: 'medkit' },
            { key: 'ward', label: 'Ward', icon: 'bed' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={activeTab === tab.key ? '#6366F1' : '#6B7280'} 
                style={styles.tabIcon}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderTabContent()}
      </ScrollView>

      <View style={styles.actionBar}>
        {permissions.canPrescribeMedication && (
          <TouchableOpacity style={styles.actionButton} onPress={() => setShowMedicationModal(true)}>
            <Ionicons name="medkit" size={20} color="white" />
            <Text style={styles.actionButtonText}>Prescribe</Text>
          </TouchableOpacity>
        )}
        {permissions.canReferPatient && (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]} onPress={() => setShowReferralModal(true)}>
            <Ionicons name="arrow-forward" size={20} color="white" />
            <Text style={styles.actionButtonText}>Refer</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modals */}
  <ConsultationNotesModal
  patientName={patient?.name}
  visible={showConsultationModal}
  onClose={() => setShowConsultationModal(false)}
  patientId={patient?.id!}
  hospitalId={currentUser?.hospitalId!}
  doctorId={currentUser?.id!}
  doctorName={currentUser?.name!}
  // Change this to an async function that accepts noteData
  onNoteAdded={async (noteData) => {
    setShowConsultationModal(false);
    Alert.alert('Success', 'Clinical note added successfully');
  }}
/>

      <RecordVitalsModal
        visible={showVitalsModal}
        onClose={() => setShowVitalsModal(false)}
        patientId={patient?.id!}
        hospitalId={currentUser?.hospitalId!}
        onVitalsRecorded={async () => {
          setShowVitalsModal(false);
          Alert.alert('Success', 'Vitals recorded successfully');
        }}
        nurseId={currentUser?.id!}
        nurseName={currentUser?.name!}
        patientName={patient?.name}
      />

      <AddBillModal
      patientName={patient?.name}
        visible={showBillModal}
        onClose={() => setShowBillModal(false)}
        patientId={patient?.id!}
        hospitalId={currentUser?.hospitalId!}
        onBillAdded={() => {
          setShowBillModal(false);
          Alert.alert('Success', 'Bill added successfully');
        }}
        createdBy={currentUser?.id!}
        createdByName={currentUser?.name!}
      />

      <LabTestModal
      patientName={patient.name}
      currentUser={currentUser}
      // currentUser={}
onTestAdded={async()=>{
  setShowLabTestModal(false);
}}

  visible={showLabTestModal}
        onClose={() => setShowLabTestModal(false)}
        patientId={patient?.id!}
        hospitalId={currentUser?.hospitalId!}
        doctorId={currentUser?.id!}
        doctorName={currentUser?.name!}
        onTestRequested={() => {
          setShowLabTestModal(false);
          Alert.alert('Success', 'Lab test requested successfully');
        }}
      />

      <AppointmentModal
        visible={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        patientId={patient?.id!}
        hospitalId={currentUser?.hospitalId!}
        patientName={patient?.name!}
        doctorId={currentUser?.id!}
        doctorName={currentUser?.name!}
        onAppointmentAdded={() => {
          setShowAppointmentModal(false);
          Alert.alert('Success', 'Appointment scheduled successfully');
        }}
      />

      <MedicationPrescriptionModal
    
        visible={showMedicationModal}
        onClose={() => setShowMedicationModal(false)}
        patientId={patient?.id!}
        hospitalId={currentUser?.hospitalId!}
        patientName={patient?.name!}
        doctorId={currentUser?.id!}
        doctorName={currentUser?.name!}
        onPrescriptionAdded={() => {
          setShowMedicationModal(false);
          Alert.alert('Success', 'Medication prescribed successfully');
        }}
      />

      <DoctorReferralModal
        visible={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        patientId={patient?.id!}
        hospitalId={currentUser?.hospitalId!}
        patientName={patient?.name!}
        referringDoctorId={currentUser?.id!}
        referringDoctorName={currentUser?.name!}
        onReferralAdded={() => {
          setShowReferralModal(false);
          Alert.alert('Success', 'Patient referred successfully');
        }}
      />

      <WardManagementModal
        visible={showWardModal}
        onClose={() => setShowWardModal(false)}
        patientId={patient?.id!}
        patientName={patient?.name!}
        onAdmission={async (wardAssignment) => {
          setShowWardModal(false);
          updatePatientStatus('admitted');
        }}
      />

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Approve Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {selectedPayment && (
              <>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentDescription}>{selectedPayment.description}</Text>
                  <Text style={styles.paymentAmount}>${selectedPayment.amount.toFixed(2)}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.approvePaymentButton}
                  onPress={() => handleApproveBill(selectedPayment)}
                >
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.approvePaymentText}>Approve Payment</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Status Update Modal */}
      <Modal visible={showStatusModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {(['registered', 'admitted', 'discharged', 'emergency', 'waiting', 'completed'] as PatientStatus[]).map(status => (
              <TouchableOpacity
                key={status}
                style={[styles.statusOption, selectedStatus === status && styles.selectedStatusOption]}
                onPress={() => updatePatientStatus(status)}
              >
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) }]} />
                <Text style={styles.statusOptionText}>{status.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB' 
  },
  accessDeniedContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  accessDeniedTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#EF4444', 
    marginTop: 20 
  },
  accessDeniedText: { 
    fontSize: 16, 
    color: '#6B7280', 
    marginTop: 10, 
    textAlign: 'center' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6' 
  },
  backButton: { 
    padding: 8 
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#111827' 
  },
  headerSubtitle: { 
    fontSize: 12, 
    color: '#6B7280', 
    marginTop: 2 
  },
  statusUpdateButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F3F4F6', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    gap: 6 
  },
  statusDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4 
  },
  statusButtonText: { 
    fontSize: 12, 
    fontWeight: '500', 
    color: '#374151', 
    textTransform: 'capitalize' 
  },
  tabContainer: { 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6', 
    paddingHorizontal: 16 
  },
  tab: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderBottomWidth: 2, 
    borderBottomColor: 'transparent' 
  },
  tabIcon: {
    marginRight: 6,
  },
  activeTab: { 
    borderBottomColor: '#6366F1' 
  },
  tabText: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: '#6B7280' 
  },
  activeTabText: { 
    color: '#6366F1' 
  },
  content: { 
    flex: 1 
  },
  tabContent: { 
    padding: 16 
  },
  patientCard: { 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 2 
  },
  patientHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  profileImage: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    marginRight: 16 
  },
  profilePlaceholder: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: '#EEF2FF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  patientInfo: { 
    flex: 1 
  },
  patientName: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#111827', 
    marginBottom: 8 
  },
  patientMeta: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12 
  },
  metaItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4 
  },
  metaText: { 
    fontSize: 14, 
    color: '#6B7280' 
  },
  patientContact: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingTop: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#F3F4F6' 
  },
  contactItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  contactText: { 
    fontSize: 14, 
    color: '#374151' 
  },
  statsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 16, 
    gap: 12 
  },
  statsCard: { 
    flex: 1, 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  statsValue: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: '#111827', 
    marginVertical: 4 
  },
  statsLabel: { 
    fontSize: 12, 
    color: '#6B7280', 
    textAlign: 'center' 
  },
  actionBar: { 
    flexDirection: 'row', 
    padding: 16, 
    backgroundColor: 'white', 
    borderTopWidth: 1, 
    borderTopColor: '#F3F4F6', 
    gap: 12 
  },
  actionButton: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    backgroundColor: '#6366F1', 
    paddingVertical: 12, 
    borderRadius: 8 
  },
  actionButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  modalContainer: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  modalContent: { 
    backgroundColor: 'white', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 24 
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#111827' 
  },
  statusOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    marginVertical: 4, 
    backgroundColor: '#F9FAFB', 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#F3F4F6' 
  },
  selectedStatusOption: { 
    backgroundColor: '#EEF2FF', 
    borderColor: '#6366F1' 
  },
  statusIndicator: { 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    marginRight: 12 
  },
  statusOptionText: { 
    fontSize: 16, 
    color: '#374151', 
    fontWeight: '500', 
    textTransform: 'capitalize' 
  },
  recordItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  recordDate: {
    fontSize: 12,
    color: '#6B7280'
  },
  recordContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12
  },
  recordAuthor: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic'
  },
  todayAppointment: {
    backgroundColor: '#EFF6FF',
  },
  billCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  billInfo: {
    flex: 1,
    marginRight: 12
  },
  billDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4
  },
  billCategory: {
    fontSize: 12,
    color: '#6366F1',
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  billAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827'
  },
  billFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  billStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  
  billStatusText: {
    fontSize: 12,
    fontWeight: '500'
  },
  billDate: {
    fontSize: 12,
    color: '#9CA3AF'
  },
  labTestCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  testInfo: {
    flex: 1,
    marginRight: 12
  },
  testName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4
  },
  testDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20
  },
  testStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  testStatusText: {
    fontSize: 12,
    fontWeight: '500'
  },
  testDetails: {
    marginTop: 12
  },
  testMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  testPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  testCategory: {
    fontSize: 12,
    color: '#8B5CF6',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  testDate: {
    fontSize: 12,
    color: '#9CA3AF'
  },
  resultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8
  },
  resultButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6'
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8
  },
  addNoteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  iconButton: {
    padding: 4
  },
  billingSummary: {
    gap: 12
  },
  billingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  billingIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  billingLabel: {
    fontSize: 14,
    color: '#6B7280'
  },
  billingAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  vitalCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  vitalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  vitalDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827'
  },
  vitalTime: {
    fontSize: 12,
    color: '#6B7280'
  },
  vitalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12
  },
  vitalMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: '48%'
  },
  vitalIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
  vitalLabel: {
    fontSize: 12,
    color: '#6B7280'
  },
  vitalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  vitalRecorded: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right'
  },
  emptySection: {
    alignItems: 'center',
    padding: 20
  },
  emptySectionText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12
  },
  emptySectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EEF2FF',
    borderRadius: 8
  },
  emptySectionButtonText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500'
  },
  medicationCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  medicationStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  medicationStatusText: {
    fontSize: 12,
    fontWeight: '500'
  },
  medicationDetails: {
    marginBottom: 12
  },
  medicationDosage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4
  },
  medicationDuration: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4
  },
  medicationInstructions: {
    fontSize: 12,
    color: '#4B5563',
    fontStyle: 'italic'
  },
  medicationPrescriber: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic'
  },
  wardCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6'
  },
  wardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  wardInfo: {
    flex: 1,
    marginLeft: 16
  },
  wardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4
  },
  wardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8
  },
  wardRate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6'
  },
  dischargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    padding: 12,
    borderRadius: 8,
    gap: 8
  },
  dischargeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600'
  },
  paymentInfo: {
    alignItems: 'center',
    padding: 20
  },
  paymentDescription: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827'
  },
  approvePaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 20
  },
  approvePaymentText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default PatientDetailsScreen;