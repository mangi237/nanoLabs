// components/admin/Overview.tsx - Updated version
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { BarChart } from 'react-native-chart-kit';
import { Patient, Bill } from '../../types/Patient';
import { RootStackParamList } from '../../types/Navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../context/authContext';
import { safeToDate } from '../../utils/safeToDate';

type PatientListNavigationProp = StackNavigationProp<RootStackParamList, 'PatientDetails'>;
const screenHeight = Dimensions.get('window').height;
const screenWidth = Dimensions.get('window').width;
// const bills = <Bill
export default function Overview({ onPatientSelect }: { onPatientSelect: (patient: Patient) => void }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    labTechnicians: 0,
    analyzer: 0,
    receptionist: 0,
    totalCashiers: 0,
    doctor: 0,
    nurses: 0,
    admittedPatients: 0,
    outpatientPatients: 0,
    emergencyPatients: 0,
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<any>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const navigation = useNavigation<PatientListNavigationProp>();

  useEffect(() => {
    fetchStats();
    fetchPatients();
    setupRealTimeListeners();
  }, [user?.hospitalId]); // Add dependency on hospitalId

  const setupRealTimeListeners = () => {
    if (!user?.hospitalId) return () => {};

    // FIXED: Listen to hospital-specific patients collection
    const patientsUnsubscribe = onSnapshot(
      collection(db, 'hospitals', user.hospitalId, 'patients'),
      (snapshot) => {
        const patientsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Patient[];
        setPatients(patientsData);
        updatePatientStats(patientsData);
        fetchFinancialData(patientsData);
      }
    );

    return patientsUnsubscribe;
  };

  const fetchFinancialData = async (patients: Patient[]) => {
    try {
      if (!user?.hospitalId) return;

      let allBills: Bill[] = [];
      
      for (const patient of patients) {
        // FIXED: Use hospital-specific patient path
        const billsQuery = query(collection(db, 'hospitals', user.hospitalId, 'patients', patient.id!, 'bills'));
        const billsSnapshot = await getDocs(billsQuery);
        const patientBills = billsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Bill[];
        allBills = [...allBills, ...patientBills];
      }

      processFinancialData(allBills);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    }
  };

  const processFinancialData = (bills: Bill[]) => {
    // Calculate revenue by category for last 7 days
    const last7Days = getLast7Days();
    const dailyRevenue = calculateDailyRevenue(bills, last7Days);
    
    const total = bills
      .filter(bill => bill.status === 'paid')
      .reduce((sum, bill) => sum + bill.amount, 0);
    
    setTotalRevenue(total);

    setFinancialData({
      labels: last7Days.map(day => day.label),
      datasets: [{
        data: dailyRevenue,
      }]
    });
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: new Date(date),
        label: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    return days;
  };

  const calculateDailyRevenue = (bills: Bill[], days: any[]) => {
    return days.map(day => {
      const dayStart = new Date(day.date);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(day.date);
      dayEnd.setHours(23, 59, 59, 999);

      return bills
        .filter(bill => {
          // const billDate = bill.createdAt ? bill.createdAt : new Date(bill.createdAt || dayStart);
         const billDate = safeToDate(bill.createdAt || dayStart);
          return billDate >= dayStart && billDate <= dayEnd;
        })
        .reduce((total, bill) => total + (bill.amount || 0), 0);
    });
  };

  const handlePatientPress = (patient: Patient) => {
    if (onPatientSelect) {
      onPatientSelect(patient);
    } else {
      navigation.navigate('PatientDetails', { patient });
      console.log('Navigating to details for patient: ', patient);
    }
  };

  const fetchStats = async () => {
    try {
      if (!user?.hospitalId) return;

      // FIXED: Use hospital-specific patients
      const patientsSnapshot = await getDocs(collection(db, 'hospitals', user.hospitalId, 'patients'));
      const totalPatients = patientsSnapshot.size;

      // FIXED: Use hospital-specific staff
      const staffSnapshot = await getDocs(collection(db, 'hospitals', user.hospitalId, 'staffs'));
      let labTechnicians = 0;
      let totalCashiers = 0;
      let analyzer = 0;
      let receptionist = 0;
      let nurses = 0;
      let doctor = 0;

      staffSnapshot.forEach((doc) => {
        const staffData = doc.data();
        const roles = Array.isArray(staffData.roles) ? staffData.roles : [staffData.role];
        
        if (roles.includes('cashier')) totalCashiers++;
        if (roles.includes('analyzer')) analyzer++;
        if (roles.includes('lab')) labTechnicians++;
        if (roles.includes('receptionist')) receptionist++;
        if (roles.includes('nurse')) nurses++;
        if (roles.includes('doctor')) doctor++;
      });

      // Calculate patient status counts
      let admittedPatients = 0;
      let outpatientPatients = 0;
      let emergencyPatients = 0;

      patientsSnapshot.forEach(doc => {
        const patientData = doc.data();
        if (patientData.status === 'admitted') admittedPatients++;
        if (patientData.admissionStatus === 'outpatient') outpatientPatients++;
        if (patientData.status === 'emergency') emergencyPatients++;
      });

      setStats({
        totalPatients,
        analyzer,
        labTechnicians,
        totalCashiers,
        receptionist,
        doctor, 
        nurses,
        admittedPatients,
        outpatientPatients,
        emergencyPatients,
      });
    } catch (error) {
      console.error('Error fetching stats: ', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      if (!user?.hospitalId) return;

      // FIXED: Use hospital-specific patients
      const patientsSnapshot = await getDocs(collection(db, 'hospitals', user.hospitalId, 'patients'));
      const patientsData: Patient[] = [];
      patientsSnapshot.forEach((doc) => {
        patientsData.push({ id: doc.id, ...doc.data() } as Patient);
      });
      setPatients(patientsData);
    } catch (error) {
      console.error('Error fetching patients: ', error);
    }
  };

  const updatePatientStats = (patientsData: Patient[]) => {
    let admittedPatients = 0;
    let outpatientPatients = 0;
    let emergencyPatients = 0;

    patientsData.forEach(patient => {
      if (patient.status === 'admitted') admittedPatients++;
      if (patient.admissionStatus === 'outpatient') outpatientPatients++;
      if (patient.status === 'emergency') emergencyPatients++;
    });

    setStats(prev => ({
      ...prev,
      admittedPatients,
      outpatientPatients,
      emergencyPatients,
    }));
  };

  // Calculate age from date of birth
  const calculateAge = (dob: any) => {
    if (!dob) return 'N/A';
    const birthDate = dob.toDate ? dob.toDate() : new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age}y`;
  };

  // Format phone number
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'N/A';
    // Basic formatting: +234 123 456 7890
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '+234 $1 $2 $3');
  };

  const filteredPatients = patients.filter(patient => 
    patient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.patientId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 128, 128, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#008080',
    },
    barPercentage: 0.5,
    fillShadowGradient: '#008080',
    fillShadowGradientOpacity: 1,
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: '#e3e3e3',
    },
    propsForLabels: {
      fontSize: 12,
    },
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'admitted': '#E74C3C',
      'registered': '#3498DB',
      'waiting': '#E67E22',
      'completed': '#27AE60',
      'discharged': '#95A5A6',
      'emergency': '#F39C12'
    };
    return colors[status] || '#7F8C8D';
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'admitted': 'Admitted',
      'registered': 'Registered',
      'waiting': 'Waiting',
      'completed': 'Completed',
      'discharged': 'Discharged',
      'emergency': 'Emergency'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#008080" />
        <Text style={styles.loadingText}>Loading Overview...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.container}>
        <View style={styles.mainContent}>
          {/* Dashboard Cards */}
   <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="people" size={24} color="#008080" />
              </View>
              <Text style={styles.statNumber}>{stats.totalPatients}</Text>
              <Text style={styles.statLabel}>Total Patients</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="medical" size={24} color="#008080" />
              </View>
              <Text style={styles.statNumber}>{stats.doctor}</Text>
              <Text style={styles.statLabel}>Doctors</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="flask" size={24} color="#008080" />
              </View>
              <Text style={styles.statNumber}>{stats.labTechnicians}</Text>
              <Text style={styles.statLabel}>Lab Techs</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="bed" size={24} color="#008080" />
              </View>
              <Text style={styles.statNumber}>{stats.admittedPatients}</Text>
              <Text style={styles.statLabel}>Admitted</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="walk" size={24} color="#008080" />
              </View>
              <Text style={styles.statNumber}>{stats.outpatientPatients}</Text>
              <Text style={styles.statLabel}>Outpatients</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="warning" size={24} color="#008080" />
              </View>
              <Text style={styles.statNumber}>{stats.emergencyPatients}</Text>
              <Text style={styles.statLabel}>Emergency</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="cash" size={24} color="#008080" />
              </View>
              <Text style={styles.statNumber}>{stats.totalCashiers}</Text>
              <Text style={styles.statLabel}>Cashiers</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="desktop" size={24} color="#008080" />
              </View>
              <Text style={styles.statNumber}>{stats.receptionist}</Text>
              <Text style={styles.statLabel}>Receptionists</Text>
            </View>
          </View>
          {/* Report Analytics Section */}
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <Text style={styles.sectionTitle}>Weekly Revenue</Text>
              <Text style={styles.totalRevenue}>Total: ${totalRevenue.toLocaleString()}</Text>
            </View>
            
            {financialData ? (
              <BarChart
                data={financialData}
                width={screenWidth * 0.6}
                height={screenHeight * 0.3}
                chartConfig={chartConfig}
                style={styles.chart}
                yAxisLabel="$"
                yAxisSuffix=""
                showValuesOnTopOfBars={true}
                withHorizontalLabels={true}
                withVerticalLabels={true}
                fromZero={true}
              />
            ) : (
              <View style={styles.chartPlaceholder}>
                <ActivityIndicator size="small" color="#008080" />
                <Text style={styles.chartLoadingText}>Loading revenue data...</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Patient List Sidebar - UPDATED with more info */}
        <View style={styles.patientSidebar}>
          <Text style={styles.sidebarTitle}>Recent Patients ({patients.length})</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#7F8C8D" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search patients..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#7F8C8D"
            />
          </View>
          <ScrollView style={styles.patientList} showsVerticalScrollIndicator={false}>
            {filteredPatients.slice(0, 10).map((patient) => (
              <TouchableOpacity
                key={patient.id}
                style={styles.patientItem}
                onPress={() => handlePatientPress(patient)}
              >
                <View style={styles.patientAvatar}>
                  <Ionicons name="person" size={24} color="#008080" />
                </View>
                <View style={styles.patientInfo}>
                  <View style={styles.patientHeader}>
                    <Text style={styles.patientName} numberOfLines={1}>
                      {patient.name || 'Unknown Patient'}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(patient.status) }
                    ]}>
                      <Text style={styles.statusText}>
                        {getStatusText(patient.status)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.patientDetails}>
                    {/* Age and Phone in one row */}
                    <View style={styles.detailRow}>
                      <View style={styles.detailItem}>
                        <Ionicons name="calendar" size={12} color="#7F8C8D" />
                        <Text style={styles.detailText}>
                          {calculateAge(patient.dateOfBirth)}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Ionicons name="call" size={12} color="#7F8C8D" />
                        <Text style={styles.detailText} numberOfLines={1}>
                          {formatPhoneNumber(patient.phone || '')}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Address */}
                    {patient.address && (
                      <View style={styles.detailItem}>
                        <Ionicons name="location" size={12} color="#7F8C8D" />
                        <Text style={styles.detailText} numberOfLines={1}>
                          {patient.address}
                        </Text>
                      </View>
                    )}
                    
                    {/* Patient ID */}
                    <View style={styles.detailItem}>
                      <Ionicons name="finger-print" size={12} color="#7F8C8D" />
                      <Text style={styles.detailText}>
                        ID: {patient.patientId || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#7F8C8D" />
              </TouchableOpacity>
            ))}
            {filteredPatients.length === 0 && (
              <View style={styles.noPatients}>
                <Ionicons name="people-outline" size={40} color="#BDC3C7" />
                <Text style={styles.noPatientsText}>No patients found</Text>
                <Text style={styles.noPatientsSubtext}>
                  {patients.length === 0 ? 'No patients in this hospital yet' : 'No matching patients found'}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    minHeight: screenHeight,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7F8C8D',
  },
  mainContent: {
    width: '70%',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  statCard: {
    width: '23%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  totalRevenue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27AE60',
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  chartPlaceholder: {
    height: screenHeight * 0.3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#7F8C8D',
  },
  patientSidebar: {
    width: '30%',
    backgroundColor: 'white',
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
    padding: 16,
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  patientList: {
    flex: 1,
  },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
    gap: 12,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientInfo: {
    flex: 1,
  },
  patientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
    marginRight: 8,
  },
  patientDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  detailText: {
    fontSize: 11,
    color: '#7F8C8D',
    flexShrink: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  noPatients: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noPatientsText: {
    marginTop: 8,
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  noPatientsSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#BDC3C7',
    textAlign: 'center',
  },
});