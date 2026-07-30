import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
  Dimensions,
  SafeAreaView,
  Alert,
} from 'react-native';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import AddHospitalScreen from '../../components/superAdmin/AddHospitalModal';
import EditHospitalModal from '../../components/superAdmin/EditHospitalModal';
import HospitalDetailsScreen from '../superAdmin/HosptialDetailsScreen';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types/Navigation';
import { getDoc } from 'firebase/firestore';
const { width } = Dimensions.get('window');
  import { StackNavigationProp } from '@react-navigation/stack';
import { useRoute } from '@react-navigation/native';
import Hospital from '../../types/hospital';

type HospitalDetailsScreenRouteProp = StackNavigationProp<RootStackParamList, 'hospitalDetailsScreen'>;
type HospitalTypeNavigationProp = StackNavigationProp<RootStackParamList, 'hospitalDetailsScreen'>;

const SuperAdminDashboard = () => {

     
  // const [hospital, setHospital] = useState<Hospital | null>(null);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showAddScreen, setShowAddScreen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalHospitals: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeHospitals: 0,
    totalPatients: 0,
    avgPatientsPerHospital: 0,
  });

// useEffect(()=> {
//   fetchHospitalData();

// })
   
//   const fetchHospitalData = async () => {
// const hospitalDoc = await getDoc(doc(db, 'hospitals', hospitalId));
//    if(hospitalDoc.exists()){
//  const hospitalData = { id: hospitalDoc.id, ...hospitalDoc.data() } as Hospital;
//     setHospital(hospitalData);
//    }
//   }

const fetchHospitalStats = async () => {
  try {
    const hospitalsRef = collection(db, 'hospitals');
    const hospitalsSnap = await getDocs(hospitalsRef);
    
    if (hospitalsSnap.empty) {
      setStats({
        totalHospitals: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        activeHospitals: 0,
        totalPatients: 0,
        avgPatientsPerHospital: 0,
      });
      return;
    }
    
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let activeHospitals = 0;
    let totalPatients = 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Process each hospital to calculate stats
    const hospitalPromises = hospitalsSnap.docs.map(async (hospitalDoc) => {
      const hospitalData = hospitalDoc.data();
      
      // Add subscription amount to total revenue
      totalRevenue += hospitalData.subscriptionAmount || 0;
      
      // Check if hospital is active (you can define your own criteria)
      if (hospitalData.status === 'active') {
        activeHospitals++;
      }
      
      // Calculate monthly revenue (assuming subscription is monthly)
      if (hospitalData.createdAt) {
        const createdDate = hospitalData.createdAt.toDate();
        if (createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
          monthlyRevenue += hospitalData.subscriptionAmount || 0;
        }
      }
      
      // Fetch patients count for this hospital
      try {
        const patientsRef = collection(db, `hospitals/${hospitalDoc.id}/patients`);
        const patientsSnap = await getDocs(patientsRef);
        totalPatients += patientsSnap.size;
      } catch (error) {
        console.error(`Error fetching patients for hospital ${hospitalDoc.id}:`, error);
      }
    });
    
    // Wait for all hospital data to be processed
    await Promise.all(hospitalPromises);
    
    const totalHospitals = hospitalsSnap.size;
    const avgPatientsPerHospital = totalHospitals > 0 ? totalPatients / totalHospitals : 0;
    
    setStats({
      totalHospitals,
      totalRevenue,
      monthlyRevenue,
      activeHospitals,
      totalPatients,
      avgPatientsPerHospital: parseFloat(avgPatientsPerHospital.toFixed(2)),
    });
    
  } catch (error) {
    console.error('Error fetching hospital stats:', error);
    // Don't show alert here to avoid interrupting the user experience
  }
};

const navigation = useNavigation<HospitalTypeNavigationProp>();
  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [hospitals]);

const fetchHospitals = async () => {
  try {
    setRefreshing(true);
    const hospitalsRef = collection(db, 'hospitals');
    const q = query(hospitalsRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const hospitalsData = snap.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));
    setHospitals(hospitalsData);
    
    // Fetch stats after getting hospitals
    await fetchHospitalStats();
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    Alert.alert('Error', 'Failed to load hospitals');
  } finally {
    setRefreshing(false);
  }
};

// Or if you want to fetch stats separately (less load on initial load):
const fetchHospitalsAndStats = async () => {
  await fetchHospitals();
  fetchHospitalStats(); // Don't await this if you want parallel loading
};

  const calculateStats = () => {
    const totalHospitals = hospitals.length;
    const totalRevenue = hospitals.reduce((sum, hospital) => {
      const subscriptionAmount = hospital.subscriptionAmount || 0;
      return sum + subscriptionAmount;
    }, 0);
    
    const monthlyRevenue = hospitals.reduce((sum, hospital) => {
      if (hospital.subscriptionType === 'monthly') {
        return sum + (hospital.subscriptionAmount || 0);
      }
      if (hospital.subscriptionType === 'yearly') {
        return sum + ((hospital.subscriptionAmount || 0) / 12);
      }
      return sum;
    }, 0);
    
    const activeHospitals = hospitals.filter(h => h.status === 'active').length;
    const totalPatients = hospitals.reduce((sum, hospital) => sum + (hospital.totalPatients || 0), 0);
    const avgPatientsPerHospital = totalHospitals > 0 ? Math.round(totalPatients / totalHospitals) : 0;

    setStats({
      totalHospitals,
     totalRevenue,
      monthlyRevenue,
      activeHospitals,
      totalPatients,
      avgPatientsPerHospital,
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleHospitalPress = (hospital) => {
    navigation.navigate('hospitalDetailsScreen', { hospitalId: hospital.id });
  };

  const handleEditHospital = (hospital) => {
    setSelectedHospital(hospital);
    setShowEditModal(true);
  };

  const handleDeleteHospital = (hospitalId) => {
    Alert.alert(
      'Delete Hospital',
      'Are you sure you want to delete this hospital? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'hospitals', hospitalId));
              Alert.alert('Success', 'Hospital deleted successfully');
              fetchHospitals();
            } catch (error) {
              console.error('Error deleting hospital:', error);
              Alert.alert('Error', 'Failed to delete hospital');
            }
          }
        }
      ]
    );
  };

  const getSubscriptionColor = (type) => {
    switch(type) {
      case 'monthly': return '#3498db';
      case 'yearly': return '#27ae60';
      case 'enterprise': return '#9b59b6';
      default: return '#7f8c8d';
    }
  };

  const renderStatsCard = (icon, title, value, color, subtitle = '') => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle ? <Text style={styles.statSubtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );

  const renderHospitalCard = ({ item }) => (
    <TouchableOpacity 
      style={styles.hospitalCard}
      onPress={() => handleHospitalPress(item)}
      activeOpacity={0.9}
    >
      <View style={styles.hospitalHeader}>
        <View style={styles.hospitalLogo}>
          <MaterialCommunityIcons name="hospital-building" size={28} color="#1E96A9" />
        </View>
        <View style={styles.hospitalInfo}>
          <Text style={styles.hospitalName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.hospitalMeta}>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={12} color="#7f8c8d" />
              <Text style={styles.hospitalLocation} numberOfLines={1}>{item.location || item.address || 'No location'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#27ae60' : '#e74c3c' }]}>
              <Text style={styles.statusText}>{item.status || 'inactive'}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={(e) => {
            e.stopPropagation();
            Alert.alert(
              'Hospital Actions',
              'Choose an action',
              [
                { text: 'View Details', onPress: () => handleHospitalPress(item) },
                { text: 'Edit Hospital', onPress: () => handleEditHospital(item) },
                { 
                  text: 'Delete Hospital', 
                  style: 'destructive',
                  onPress: () => handleDeleteHospital(item.id)
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#95a5a6" />
        </TouchableOpacity>
      </View>

      <View style={styles.hospitalDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={14} color="#95a5a6" />
            <Text style={styles.detailText}>Created: {formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.detailItem}>
            <FontAwesome5 name="users" size={12} color="#95a5a6" />
            <Text style={styles.detailText}>{item.totalPatients || 0} patients</Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={[styles.subscriptionBadge, { backgroundColor: getSubscriptionColor(item.subscriptionType) + '15' }]}>
            <Text style={[styles.subscriptionText, { color: getSubscriptionColor(item.subscriptionType) }]}>
              {item.subscriptionType || 'No subscription'}
            </Text>
          </View>
          <Text style={styles.revenueText}>
            {formatCurrency(item.subscriptionAmount || 0)}
          </Text>
        </View>

        {item.slogan && (
          <View style={styles.sloganContainer}>
            <Ionicons name="book" size={12} color="#1E96A9" />
            <Text style={styles.sloganText} numberOfLines={2}>{item.slogan}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchHospitals} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome, Super Admin</Text>
            <Text style={styles.subtitle}>Manage all hospitals and subscriptions</Text>
          </View>
          <TouchableOpacity 
            style={styles.addHospitalButton}
            onPress={() => setShowAddScreen(true)}
          >
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addButtonText}>Add Hospital</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsScroll}
          >
            {renderStatsCard(
              <Ionicons name="business" size={24} color="#3498db" />,
              'Total Hospitals',
              stats.totalHospitals.toString(),
              '#3498db'
            )}
            {renderStatsCard(
              <FontAwesome5 name="money-bill-wave" size={22} color="#27ae60" />,
              'Total Revenue',
              formatCurrency(stats.totalRevenue),
              '#27ae60',
              'All time'
            )}
            {renderStatsCard(
              <MaterialIcons name="trending-up" size={24} color="#9b59b6" />,
              'Monthly Revenue',
              formatCurrency(stats.monthlyRevenue),
              '#9b59b6',
              'This month'
            )}
            {renderStatsCard(
              <FontAwesome5 name="hospital-user" size={20} color="#e74c3c" />,
              'Active Hospitals',
              stats.activeHospitals.toString(),
              '#e74c3c'
            )}
            {renderStatsCard(
              <Ionicons name="people" size={24} color="#f39c12" />,
              'Total Patients',
              stats.totalPatients.toString(),
              '#f39c12'
            )}
            {renderStatsCard(
              <MaterialCommunityIcons name="chart-bar" size={22} color="#1abc9c" />,
              'Avg. Patients',
              stats.avgPatientsPerHospital.toString(),
              '#1abc9c',
              'Per hospital'
            )}
          </ScrollView>
        </View>

        {/* Hospital List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>All Hospitals ({hospitals.length})</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={18} color="#1E96A9" />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* Hospitals List */}
        {hospitals.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="hospital-building" size={80} color="#ecf0f1" />
            <Text style={styles.emptyTitle}>No Hospitals Yet</Text>
            <Text style={styles.emptySubtitle}>Add your first hospital to get started</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => setShowAddScreen(true)}
            >
              <Text style={styles.emptyButtonText}>Create First Hospital</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={hospitals}
            keyExtractor={item => item.id}
            renderItem={renderHospitalCard}
            scrollEnabled={false}
            contentContainerStyle={styles.hospitalsList}
          />
        )}

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Showing {hospitals.length} of {hospitals.length} hospitals
          </Text>
          <Text style={styles.footerNote}>
            Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </ScrollView>

      {/* Add Hospital Modal */}
      <AddHospitalScreen
        visible={showAddScreen}
        onClose={() => setShowAddScreen(false)}
        onHospitalAdded={() => {
          setShowAddScreen(false);
          fetchHospitals();
        }}
      />

      {/* Edit Hospital Modal */}
      {selectedHospital && (
        <EditHospitalModal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedHospital(null);
          }}
          hospital={selectedHospital}
          onHospitalUpdated={() => {
            setShowEditModal(false);
            setSelectedHospital(null);
            fetchHospitals();
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  addHospitalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E96A9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  statsContainer: {
    paddingVertical: 20,
  },
  statsScroll: {
    paddingHorizontal: 20,
    paddingRight: 10,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 160,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'Poppins-Bold',
  },
  statTitle: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
    fontFamily: 'Poppins-Medium',
  },
  statSubtitle: {
    fontSize: 11,
    color: '#BDC3C7',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'Poppins-SemiBold',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterText: {
    color: '#1E96A9',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'Poppins-Medium',
  },
  hospitalsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  hospitalCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  hospitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hospitalLogo: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  hospitalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  hospitalLocation: {
    fontSize: 12,
    color: '#7F8C8D',
    marginLeft: 4,
    fontFamily: 'Poppins-Regular',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Poppins-SemiBold',
  },
  menuButton: {
    padding: 4,
    marginLeft: 8,
  },
  hospitalDetails: {
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#7F8C8D',
    marginLeft: 6,
    fontFamily: 'Poppins-Regular',
  },
  subscriptionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  subscriptionText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  revenueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'Poppins-Bold',
  },
  sloganContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  sloganText: {
    fontSize: 12,
    color: '#34495E',
    fontStyle: 'italic',
    marginLeft: 8,
    flex: 1,
    fontFamily: 'Poppins-Regular',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#BDC3C7',
    marginTop: 20,
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#BDC3C7',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Poppins-Regular',
  },
  emptyButton: {
    backgroundColor: '#1E96A9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
    backgroundColor: 'white',
  },
  footerText: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  footerNote: {
    fontSize: 11,
    color: '#BDC3C7',
    fontFamily: 'Poppins-Regular',
  },
});

export default SuperAdminDashboard;