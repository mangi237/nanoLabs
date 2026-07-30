import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Image, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Patient } from '../../types/Patient';
import AddPatientModal from './addPatientModal';
import { useAuth } from '../../context/authContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/Navigation';

type PatientListNavigationProp = StackNavigationProp<RootStackParamList, 'PatientDetails'>;

// Define the props interface
// In your PatientList component file
interface PatientListProps {
  onPatientSelect?: (patientId: string) => void;
  onPrescribeMedication?: (patientId: string) => void;
  onConsultationNotes?: (patientId: string) => void;
  onRecordVitals?: (patientId: string) => void;
  onOrderRadiology?: (patientId: string) => void;
  onScheduleSurgery?: (patientId: string) => void;
  onEmergencyTriage?: (patientId: string) => void;
  onWardManagement?: (patientId: string) => void;
  onStaffManagement?: () => void;
  onAddBill?: (patientId: string) => void;
  onCollectSamples?: (patientId: string) => void;
  onValidatePayment?: (patientId: string) => void;
  navigation?: any;
  onRecordPayment?: (patientId: string) => void;
  route?: any;
  showPaymentButton?: boolean;
  filter?: string;
}

const PatientList: React.FC<PatientListProps> = ({ onPatientSelect }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('registered');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  
  const { user } = useAuth();
  const navigation = useNavigation<PatientListNavigationProp>();

  // Fetch all patients and store them in state.
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const patientsQuery = query(collection(db, `hospitals/${user.hospitalId}/patients`));

    const unsubscribe = onSnapshot(patientsQuery,
      (snapshot) => {
        const allPatients = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Patient[];
        setPatients(allPatients);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching patients: ", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Filter patients based on the active tab and search query
  const filteredPatients = patients.filter(patient => {
    // First, filter by the active tab
    const isMatchingTab = patient.status === activeTab;
    
    // Then, filter by the search query
    const isMatchingSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (patient.patientId && patient.patientId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (patient.phone && patient.phone.includes(searchQuery));
      
    return isMatchingTab && isMatchingSearch;
  });

  const handlePatientPress = (patient: Patient) => {
    // If onPatientSelect prop is provided, call it (for modal)
    if (onPatientSelect) {
      onPatientSelect(patient.id);
    } else {
      // Otherwise, navigate to patient details
      navigation.navigate('PatientDetails', { patient });
      console.log('Navigating to details for patient: ', patient);
    }
  };

  const renderPatientItem = ({ item }: { item: Patient }) => (
    <TouchableOpacity 
      style={styles.patientItem}
      onPress={() => handlePatientPress(item)}
    >
      {item.profileImage ? (
        <Image source={{ uri: item.profileImage }} style={styles.patientImage} />
      ) : (
        <View style={styles.patientImagePlaceholder}>
          <Ionicons name="person" size={24} color="#7F8C8D" />
        </View>
      )}
      
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientDetails}>ID: {item.patientId}</Text>
        <Text style={styles.patientDetails}>Phone: {item.phone}</Text>
        <Text style={styles.patientStatus}>Status: {item.status}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#7F8C8D" />
    </TouchableOpacity>
  );

  const handlePatientAdded = () => {
    setModalVisible(false);
    setSuccessModalVisible(true);
  };

  const onAddPatient = () => {
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E96A9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patients</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddPatient}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Patient</Text>
        </TouchableOpacity>
      </View>

     <View style={styles.tabContainer}>
  {['registered', 'admitted', 'discharged', 'emergency'].map(tab => (
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


      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#7F8C8D" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search patients..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {filteredPatients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No patients found with this status.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          renderItem={renderPatientItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <AddPatientModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onPatientAdded={handlePatientAdded}
      />
      
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.successModalContainer}>
          <View style={styles.successModalView}>
            <Ionicons name="checkmark-circle" size={80} color="#27AE60" />
            <Text style={styles.successModalText}>Patient Added Successfully!</Text>
            <Pressable
              style={styles.successModalButton}
              onPress={() => setSuccessModalVisible(false)}
            >
              <Text style={styles.successModalButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Your existing styles remain the same...
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    padding: 15,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'Poppins-Bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27AE60',
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingVertical: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    borderWidth: 0,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    borderBottomColor: 'transparent',
    shadowRadius: 2,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20, 
  },
  activeTab: {
    borderBottomColor: '#1E96A9',
  },
  tabText: {
    color: '#34495E',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  activeTabText: {
    color: 'black',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    height: 40,
    fontFamily: 'Poppins-Regular',
  },
  listContainer: {
    paddingBottom: 20,
  },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  patientImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  patientImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ECF0F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
    fontFamily: 'Poppins-SemiBold',
    color: '#2C3E50',
  },
  patientDetails: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 3,
    fontFamily: 'Poppins-Regular',
  },
  patientStatus: {
    fontSize: 14,
    color: '#27AE60',
    fontFamily: 'Poppins-Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#7F8C8D',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  successModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  successModalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  successModalText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    color: '#2C3E50',
    fontFamily: 'Poppins-Bold',
  },
  successModalButton: {
    backgroundColor: '#27AE60',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    marginTop: 10,
  },
  successModalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default PatientList;