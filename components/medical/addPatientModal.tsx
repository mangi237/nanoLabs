// components/medical/AddPatientModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { PatientStatus, AdmissionStatus } from '../../types/Patient';
import { useAuth } from '../../context/authContext';

interface AddPatientModalProps {
  visible: boolean;
  onClose: () => void;
  onPatientAdded: () => void;
}

const AddPatientModal: React.FC<AddPatientModalProps> = ({
  visible,
  onClose,
  onPatientAdded
}) => {
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState({
    name: '',
    age: '',
    gender: 'male' as 'male' | 'female' | 'other',
    phone: '',
    address: '',
    bloodType: '' as 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | '',
    insuranceProvider: '',
    insuranceId: '',
    accessCode: '',
    email: '',
    emergencyContact: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    
    guardianName: '',
  });

  const { user } = useAuth();

  const generatePatientId = () => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `PAT${timestamp}${random}`;
  };

  const handleAddPatient = async () => {
    if (!patient.name || !patient.age || !patient.phone || !patient.accessCode) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const patientId = generatePatientId();
      const now = Timestamp.now();
      
      const patientData = {
        patientId: patientId,
        name: patient.name,
        age: parseInt(patient.age),
        gender: patient.gender,
        phone: patient.phone,
        email: patient.email || '',
        address: patient.address,
        emergencyContact: patient.emergencyContact || patient.phone,
        emergencyContactRelationship: patient.emergencyContactRelationship || 'Self',
        emergencyContactPhone: patient.emergencyContactPhone || patient.phone,
        guardianName: patient.guardianName || '',
        bloodType: patient.bloodType || '',
        insuranceProvider: patient.insuranceProvider || '',
        insuranceId: patient.insuranceId || '',
        status: 'registered' as PatientStatus,
        admissionStatus: 'outpatient' as AdmissionStatus,
        accessCode: patient.accessCode,
        createdAt: now,
        updatedAt: now,
        labTests: [], // Initialize empty array
        outstandingBalance: 0,
        
        // Optional fields with default values
        allergies: [],
        medicalConditions: [],
        pastMedicalHistory: [],
        surgicalHistory: [],
        familyHistory: '',
        currentMedications: [],
        resultUrls: [],
        paymentDetails: [],
        medications: [],
        appointments: [],
        bills: [],
        vitals: [],
        clinicalNotes: []
      };

      // 1. Create the main patient document with full path
      const patientRef = doc(db, 'hospitals', user.hospitalId, 'patients', patientId);
      await setDoc(patientRef, patientData);
      
      // 2. Create empty subcollections by adding an initial empty document if needed
      // (Subcollections are created automatically when first document is added)
      // You can initialize them with a dummy document if you want
      
      // For example, to initialize vitals subcollection:
      // const vitalsRef = doc(collection(db, 'hospitals', user.hospitalId, 'patients', patientId, 'vitals'));
      // await setDoc(vitalsRef, { _initialized: true });

      Alert.alert('Success', 'Patient registered successfully!');
      
      // Reset form
      setPatient({
        name: '',
        age: '',
        gender: 'male',
        phone: '',
        address: '',
        bloodType: '',
        insuranceProvider: '',
        insuranceId: '',
        accessCode: '',
        email: '',
        emergencyContact: '',
        emergencyContactRelationship: '',
        emergencyContactPhone: '',
        guardianName: '',
      });
      
      onPatientAdded();
      onClose();
      
    } catch (error) {
      console.error('Error adding patient:', error);
      Alert.alert('Error', 'Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  // Add these new input fields to your form in the ScrollView:

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Register New Patient</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#7F8C8D" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            {/* Existing fields... */}
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={patient.name}
              onChangeText={(text) => setPatient(prev => ({ ...prev, name: text }))}
              placeholder="Enter patient's full name"
            />

            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Age *</Text>
                <TextInput
                  style={styles.input}
                  value={patient.age}
                  onChangeText={(text) => setPatient(prev => ({ ...prev, age: text }))}
                  placeholder="Age"
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Gender *</Text>
                <View style={styles.genderContainer}>
                  {['Male', 'Female', 'Other'].map(gender => (
                    <TouchableOpacity
                      key={gender}
                      style={[
                        styles.genderButton,
                        patient.gender.toLowerCase() === gender.toLowerCase() && styles.genderButtonSelected
                      ]}
                      onPress={() => setPatient(prev => ({ ...prev, gender: gender.toLowerCase() as 'male' | 'female' | 'other' }))}
                    >
                      <Text style={[
                        styles.genderText,
                        patient.gender.toLowerCase() === gender.toLowerCase() && styles.genderTextSelected
                      ]}>
                        {gender}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={patient.phone}
              onChangeText={(text) => setPatient(prev => ({ ...prev, phone: text }))}
              placeholder="Phone number"
              keyboardType="phone-pad"
            />

            {/* Add these new fields before the existing address field: */}
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={patient.email}
              onChangeText={(text) => setPatient(prev => ({ ...prev, email: text }))}
              placeholder="Email address"
              keyboardType="email-address"
            />

            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={patient.address}
              onChangeText={(text) => setPatient(prev => ({ ...prev, address: text }))}
              placeholder="Patient's address"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Emergency Contact Phone</Text>
            <TextInput
              style={styles.input}
              value={patient.emergencyContactPhone}
              onChangeText={(text) => setPatient(prev => ({ ...prev, emergencyContactPhone: text }))}
              placeholder="Emergency contact phone"
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Emergency Contact Name</Text>
            <TextInput
              style={styles.input}
              value={patient.emergencyContact}
              onChangeText={(text) => setPatient(prev => ({ ...prev, emergencyContact: text }))}
              placeholder="Emergency contact name"
            />

            <Text style={styles.inputLabel}>Relationship</Text>
            <TextInput
              style={styles.input}
              value={patient.emergencyContactRelationship}
              onChangeText={(text) => setPatient(prev => ({ ...prev, emergencyContactRelationship: text }))}
              placeholder="Relationship to patient"
            />

            <Text style={styles.inputLabel}>Guardian Name (if minor)</Text>
            <TextInput
              style={styles.input}
              value={patient.guardianName}
              onChangeText={(text) => setPatient(prev => ({ ...prev, guardianName: text }))}
              placeholder="Guardian name"
            />

            {/* Existing blood type section... */}
            <Text style={styles.inputLabel}>Blood Type</Text>
            <View style={styles.bloodTypeContainer}>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.bloodTypeButton,
                    patient.bloodType === type && styles.bloodTypeButtonSelected
                  ]}
                  onPress={() => setPatient(prev => ({ ...prev, bloodType: type as any }))}
                >
                  <Text style={[
                    styles.bloodTypeText,
                    patient.bloodType === type && styles.bloodTypeTextSelected
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Insurance Provider</Text>
            <TextInput
              style={styles.input}
              value={patient.insuranceProvider}
              onChangeText={(text) => setPatient(prev => ({ ...prev, insuranceProvider: text }))}
              placeholder="Insurance company name"
            />

            <Text style={styles.inputLabel}>Insurance ID</Text>
            <TextInput
              style={styles.input}
              value={patient.insuranceId}
              onChangeText={(text) => setPatient(prev => ({ ...prev, insuranceId: text }))}
              placeholder="Insurance policy number"
            />

            <Text style={styles.inputLabel}>Access Code *</Text>
            <TextInput
              style={styles.input}
              value={patient.accessCode}
              onChangeText={(text) => setPatient(prev => ({ ...prev, accessCode: text }))}
              placeholder="Set patient access code for login"
              secureTextEntry
            />
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
              onPress={handleAddPatient}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.submitButtonText}>Register Patient</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Styles remain the same...
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  formContainer: {
    padding: 20,
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2C3E50',
  },
  input: {
    borderWidth: 1,
    borderColor: '#BDC3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  genderButtonSelected: {
    backgroundColor: '#1E96A9',
    borderColor: '#1E96A9',
  },
  genderText: {
    color: '#7F8C8D',
    fontWeight: '600',
  },
  genderTextSelected: {
    color: 'white',
  },
  bloodTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  bloodTypeButton: {
    padding: 8,
    margin: 4,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  bloodTypeButtonSelected: {
    backgroundColor: '#E74C3C',
    borderColor: '#E74C3C',
  },
  bloodTypeText: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  bloodTypeTextSelected: {
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#27AE60',
  },
  disabledButton: {
    backgroundColor: '#95A5A6',
  },
  cancelButtonText: {
    color: '#2C3E50',
    fontWeight: 'bold',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default AddPatientModal;