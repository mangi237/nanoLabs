// screens/patient/PatientDashboardScreen.tsx - MODERN UI with Privacy Controls
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, doc, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Patient, Bill, LabTest, Vitals, MedicationPrescription } from '../../types/Patient';
import { safeToDate } from '../../utils/safeToDate';
import PatientAccessControl from '../../components/patient/PatientAccessControl';

const { width } = Dimensions.get('window');

interface PatientDashboardProps {
  route: any;
  navigation: any;
}

const PatientDashboardScreen: React.FC<PatientDashboardProps> = ({ route, navigation }) => {
  const { patientId, hospitalId } = route.params;
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [vitals, setVitals] = useState<Vitals[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [medications, setMedications] = useState<MedicationPrescription[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    if (patientId && hospitalId) {
      setupRealTimeListeners();
    }
  }, [patientId, hospitalId]);

  const setupRealTimeListeners = () => {
    const patientRef = doc(db, 'hospitals', hospitalId, 'patients', patientId);
    
    // Patient data
    const patientUnsub = onSnapshot(patientRef, (doc) => {
      if (doc.exists()) {
        setPatient({ id: doc.id, ...doc.data() } as Patient);
      }
      setLoading(false);
    });

    // Vitals
    const vitalsUnsub = onSnapshot(
      collection(db, 'hospitals', hospitalId, 'patients', patientId, 'vitals'),
      (snapshot) => {
        const vitalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Vitals[];
        setVitals(vitalsData.sort((a, b) => safeToDate(b.timestamp).getTime() - safeToDate(a.timestamp).getTime()));
      }
    );

    // Bills
    const billsUnsub = onSnapshot(
      collection(db, 'hospitals', hospitalId, 'patients', patientId, 'bills'),
      (snapshot) => {
        const billsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Bill[];
        setBills(billsData.sort((a, b) => safeToDate(b.createdAt).getTime() - safeToDate(a.createdAt).getTime()));
      }
    );

    // Lab Tests
    const labTestsUnsub = onSnapshot(
      collection(db, 'hospitals', hospitalId, 'patients', patientId, 'labTests'),
      (snapshot) => {
        const labData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as LabTest[];
        setLabTests(labData.sort((a, b) => safeToDate(b.requestedDate || b.createdAt).getTime() - safeToDate(a.requestedDate || a.createdAt).getTime()));
      }
    );

    // Medications
    const medicationsUnsub = onSnapshot(
      collection(db, 'hospitals', hospitalId, 'patients', patientId, 'medications'),
      (snapshot) => {
        const medsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MedicationPrescription[];
        setMedications(medsData.filter(m => m.status === 'active').sort((a, b) => safeToDate(b.prescribedDate).getTime() - safeToDate(a.prescribedDate).getTime()));
      }
    );

    // Appointments
    const appointmentsUnsub = onSnapshot(
      collection(db, 'hospitals', hospitalId, 'patients', patientId, 'appointments'),
      (snapshot) => {
        const appsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), status: doc.data().status || 'unknown', date: doc.data().date ? doc.data().date : null })) as any[];
        setAppointments(appsData.filter(a => a.status === 'scheduled').sort((a, b) => safeToDate(a.date).getTime() - safeToDate(b.date).getTime()));
      }
    );

    return () => {
      patientUnsub();
      vitalsUnsub();
      billsUnsub();
      labTestsUnsub();
      medicationsUnsub();
      appointmentsUnsub();
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Data refreshes automatically via real-time listeners
    setTimeout(() => setRefreshing(false), 1000);
  };

  const calculateTotalBill = () => bills.filter(b => b.status === 'pending' || b.status === 'paid').reduce((sum, b) => sum + b.amount, 0);
  const calculatePaidAmount = () => bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.amount, 0);
  const calculateBalance = () => calculateTotalBill() - calculatePaidAmount();

  const getLatestVitals = () => vitals.length > 0 ? vitals[0] : null;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading your health dashboard...</Text>
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={80} color="#EF4444" />
        <Text style={styles.errorTitle}>Patient Not Found</Text>
        <Text style={styles.errorText}>Unable to load patient data</Text>
      </View>
    );
  }

  const latestVitals = getLatestVitals();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientId}>ID: {patient.patientId}</Text>
            </View>
            <TouchableOpacity
              style={styles.privacyButton}
              onPress={() => setShowPrivacyModal(true)}
            >
              <Ionicons name="shield-checkmark" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statBadge}>
              <Ionicons name="water" size={16} color="white" />
              <Text style={styles.statBadgeText}>{patient.bloodType || 'N/A'}</Text>
            </View>
            <View style={styles.statBadge}>
              <Ionicons name="calendar" size={16} color="white" />
              <Text style={styles.statBadgeText}>{patient.age} years</Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.statusText}>{patient.status.toUpperCase()}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Health Overview Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Overview</Text>
          <View style={styles.overviewGrid}>
            {/* Latest Vitals Card */}
            <View style={[styles.overviewCard, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="heart" size={32} color="#F59E0B" />
              <Text style={styles.cardTitle}>Latest Vitals</Text>
              <Text style={styles.cardValue}>
                {latestVitals ? `${latestVitals.heartRate} bpm` : 'No data'}
              </Text>
              <Text style={styles.cardSubtitle}>
                {latestVitals ? safeToDate(latestVitals.timestamp).toLocaleDateString() : ''}
              </Text>
            </View>

            {/* Active Medications Card */}
            <View style={[styles.overviewCard, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="medical" size={32} color="#3B82F6" />
              <Text style={styles.cardTitle}>Active Meds</Text>
              <Text style={styles.cardValue}>{medications.length}</Text>
              <Text style={styles.cardSubtitle}>Prescriptions</Text>
            </View>

            {/* Pending Labs Card */}
            <View style={[styles.overviewCard, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="flask" size={32} color="#8B5CF6" />
              <Text style={styles.cardTitle}>Lab Tests</Text>
              <Text style={styles.cardValue}>
                {labTests.filter(t => t.status !== 'completed').length}
              </Text>
              <Text style={styles.cardSubtitle}>Pending</Text>
            </View>

            {/* Balance Due Card */}
            <View style={[styles.overviewCard, { backgroundColor: calculateBalance() > 0 ? '#FEE2E2' : '#D1FAE5' }]}>
              <Ionicons name="wallet" size={32} color={calculateBalance() > 0 ? '#EF4444' : '#10B981'} />
              <Text style={styles.cardTitle}>Balance</Text>
              <Text style={styles.cardValue}>${calculateBalance().toFixed(0)}</Text>
              <Text style={styles.cardSubtitle}>
                {calculateBalance() > 0 ? 'Due' : 'Paid'}
              </Text>
            </View>
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Financial Summary</Text>
            <TouchableOpacity>
              <Ionicons name="receipt" size={20} color="#6366F1" />
            </TouchableOpacity>
          </View>
          <View style={styles.financialCard}>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Total Amount</Text>
              <Text style={styles.financialValue}>${calculateTotalBill().toFixed(2)}</Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Amount Paid</Text>
              <Text style={[styles.financialValue, { color: '#10B981' }]}>
                ${calculatePaidAmount().toFixed(2)}
              </Text>
            </View>
            <View style={[styles.financialRow, styles.financialRowTotal]}>
              <Text style={styles.financialLabelTotal}>Balance Due</Text>
              <Text style={[styles.financialValueTotal, { color: calculateBalance() > 0 ? '#EF4444' : '#10B981' }]}>
                ${calculateBalance().toFixed(2)}
              </Text>
            </View>
            <View style={styles.financialRow}>
              <Text style={styles.financialLabel}>Total Spent at Hospital</Text>
              <Text style={[styles.financialValue, { color: '#6366F1', fontWeight: 'bold' }]}>
                ${(patient.totalAmountSpent || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Upcoming Appointments */}
        {appointments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            {appointments.slice(0, 3).map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentIcon}>
                  <Ionicons name="calendar" size={24} color="#6366F1" />
                </View>
                <View style={styles.appointmentInfo}>
                  <Text style={styles.appointmentTitle}>{appointment.title}</Text>
                  <Text style={styles.appointmentDoctor}>Dr. {appointment.doctorName}</Text>
                  <Text style={styles.appointmentDate}>
                    {safeToDate(appointment.date).toLocaleDateString()} • {appointment.time}
                  </Text>
                </View>
                <View style={styles.appointmentStatus}>
                  <Text style={styles.appointmentStatusText}>SCHEDULED</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Active Medications */}
        {medications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Medications</Text>
            {medications.slice(0, 3).map((medication) => (
              <View key={medication.id} style={styles.medicationCard}>
                <View style={styles.medicationIcon}>
                  <Ionicons name="medical" size={24} color="#3B82F6" />
                </View>
                <View style={styles.medicationInfo}>
                  <Text style={styles.medicationName}>{medication.medicationName}</Text>
                  <Text style={styles.medicationDosage}>{medication.dosage} • {medication.frequency}</Text>
                  <Text style={styles.medicationDuration}>
                    {medication.duration} days • Until {safeToDate(medication.endDate).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent Lab Tests */}
        {labTests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Lab Tests</Text>
            {labTests.slice(0, 3).map((test) => (
              <View key={test.id} style={styles.labTestCard}>
                <View style={styles.labTestIcon}>
                  <Ionicons name="flask" size={24} color="#8B5CF6" />
                </View>
                <View style={styles.labTestInfo}>
                  <Text style={styles.labTestName}>{test.name}</Text>
                  <Text style={styles.labTestDate}>
                    {safeToDate(test.requestedDate || test.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[
                  styles.labTestStatus,
                  { backgroundColor: test.status === 'completed' ? '#D1FAE5' : '#FEF3C7' }
                ]}>
                  <Text style={[
                    styles.labTestStatusText,
                    { color: test.status === 'completed' ? '#065F46' : '#92400E' }
                  ]}>
                    {test.status.replace('-', ' ')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Ward Information (if admitted) */}
        {patient.status === 'admitted' && patient.currentWardAssignment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ward Information</Text>
            <View style={styles.wardCard}>
              <View style={styles.wardHeader}>
                <Ionicons name="business" size={32} color="#8B5CF6" />
                <View style={styles.wardDetails}>
                  <Text style={styles.wardName}>{patient.currentWardAssignment.wardName}</Text>
                  <Text style={styles.wardType}>{patient.currentWardAssignment.wardType.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.wardInfo}>
                <View style={styles.wardInfoRow}>
                  <Ionicons name="bed" size={16} color="#6B7280" />
                  <Text style={styles.wardInfoText}>Bed {patient.currentWardAssignment.bedNumber}</Text>
                </View>
                <View style={styles.wardInfoRow}>
                  <Ionicons name="calendar" size={16} color="#6B7280" />
                  <Text style={styles.wardInfoText}>
                    Admitted: {safeToDate(patient.currentWardAssignment.assignedDate).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.wardInfoRow}>
                  <Ionicons name="cash" size={16} color="#6B7280" />
                  <Text style={styles.wardInfoText}>
                    Daily Rate: ${patient.currentWardAssignment.dailyRate}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Privacy Settings Modal */}
      <PatientAccessControl
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        patientId={patientId}
        hospitalId={hospitalId}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: '#6B7280' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorTitle: { fontSize: 20, fontWeight: 'bold', color: '#EF4444', marginTop: 16 },
  errorText: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  scrollView: { flex: 1 },
  header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  patientName: { fontSize: 28, fontWeight: 'bold', color: 'white', marginTop: 4 },
  patientId: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  privacyButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  quickStats: { flexDirection: 'row', gap: 12 },
  statBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  statBadgeText: { color: 'white', fontSize: 14, fontWeight: '600' },
  statusText: { color: 'white', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  section: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  overviewCard: { width: (width - 52) / 2, borderRadius: 16, padding: 20, alignItems: 'center' },
  cardTitle: { fontSize: 14, color: '#6B7280', marginTop: 12, textAlign: 'center' },
  cardValue: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 4 },
  cardSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  financialCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  financialRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  financialRowTotal: { borderBottomWidth: 0, borderTopWidth: 2, borderTopColor: '#E5E7EB', marginTop: 8, paddingTop: 16 },
  financialLabel: { fontSize: 14, color: '#6B7280' },
  financialValue: { fontSize: 16, fontWeight: '600', color: '#111827' },
  financialLabelTotal: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  financialValueTotal: { fontSize: 20, fontWeight: 'bold' },
  appointmentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  appointmentIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  appointmentInfo: { flex: 1 },
  appointmentTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  appointmentDoctor: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  appointmentDate: { fontSize: 12, color: '#9CA3AF' },
  appointmentStatus: { backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  appointmentStatusText: { fontSize: 10, fontWeight: 'bold', color: '#065F46' },
  medicationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  medicationIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  medicationInfo: { flex: 1 },
  medicationName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  medicationDosage: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  medicationDuration: { fontSize: 12, color: '#9CA3AF' },
  labTestCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  labTestIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  labTestInfo: { flex: 1 },
  labTestName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  labTestDate: { fontSize: 12, color: '#9CA3AF' },
  labTestStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  labTestStatusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  wardCard: { backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  wardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  wardDetails: { marginLeft: 12 },
  wardName: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  wardType: { fontSize: 12, color: '#8B5CF6', fontWeight: '600' },
  wardInfo: { gap: 12 },
  wardInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wardInfoText: { fontSize: 14, color: '#6B7280' },
});

export default PatientDashboardScreen;