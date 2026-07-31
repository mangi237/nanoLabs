// screens/auth/RegisterScreen.tsx - Lab Selection First
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import authService from '../../services/authService';

const RegisterScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { primaryColor } = useTheme();
  const { getAllLabs } = useAuth();
  const [step, setStep] = useState(1);
  const [labs, setLabs] = useState<any[]>([]);
  const [selectedLab, setSelectedLab] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    gender: 'male',
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    bloodType: '',
    allergies: '',
    medicalConditions: '',
    currentMedications: '',
    insuranceProvider: '',
    insuranceId: '',
    labTests: [],
    accessCode: ''
  });
  const [selectedTests, setSelectedTests] = useState<any[]>([]);

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const labList = await getAllLabs();
      setLabs(labList || []);
    } catch (error) {
      console.error('Error fetching labs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Select Lab
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>🏥 Select Your Lab</Text>
      <Text style={styles.stepSubtitle}>Choose the lab where you want to get tested</Text>
      
      {labs.map((lab) => (
        <TouchableOpacity
          key={lab.id}
          style={[styles.labCard, selectedLab?.id === lab.id && styles.labCardSelected]}
          onPress={() => setSelectedLab(lab)}
        >
          <View style={[styles.labColor, { backgroundColor: lab.primaryColor || '#1A237E' }]} />
          <View style={styles.labCardInfo}>
            <Text style={styles.labCardName}>{lab.name}</Text>
            <Text style={styles.labCardLocation}>{lab.location || 'Location not specified'}</Text>
          </View>
          {selectedLab?.id === lab.id && (
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity 
        style={[styles.nextButton, !selectedLab && styles.disabledButton]}
        onPress={() => selectedLab && setStep(2)}
        disabled={!selectedLab}
      >
        <Text style={styles.nextButtonText}>Next →</Text>
      </TouchableOpacity>
    </View>
  );

  // Step 2: Personal Info
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>👤 Personal Information</Text>
      <Text style={styles.stepSubtitle}>Tell us about yourself</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name *"
        value={patientData.name}
        onChangeText={(text) => setPatientData({ ...patientData, name: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Age *"
        value={patientData.age}
        onChangeText={(text) => setPatientData({ ...patientData, age: text })}
        keyboardType="numeric"
      />

      <View style={styles.genderContainer}>
        <TouchableOpacity
          style={[styles.genderOption, patientData.gender === 'male' && styles.genderSelected]}
          onPress={() => setPatientData({ ...patientData, gender: 'male' })}
        >
          <Text style={styles.genderText}>♂ Male</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderOption, patientData.gender === 'female' && styles.genderSelected]}
          onPress={() => setPatientData({ ...patientData, gender: 'female' })}
        >
          <Text style={styles.genderText}>♀ Female</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderOption, patientData.gender === 'other' && styles.genderSelected]}
          onPress={() => setPatientData({ ...patientData, gender: 'other' })}
        >
          <Text style={styles.genderText}>⚧ Other</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.backButton, styles.button]} onPress={() => setStep(1)}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.nextButton, styles.button, !patientData.name.trim() && styles.disabledButton]}
          onPress={() => patientData.name.trim() && setStep(3)}
          disabled={!patientData.name.trim()}
        >
          <Text style={styles.nextButtonText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Step 3: Contact Info
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>📞 Contact Information</Text>
      <Text style={styles.stepSubtitle}>How can we reach you?</Text>

      <TextInput
        style={styles.input}
        placeholder="Phone Number *"
        value={patientData.phone}
        onChangeText={(text) => setPatientData({ ...patientData, phone: text })}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={patientData.email}
        onChangeText={(text) => setPatientData({ ...patientData, email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Physical Address"
        value={patientData.address}
        onChangeText={(text) => setPatientData({ ...patientData, address: text })}
        multiline
        numberOfLines={2}
      />

      <TextInput
        style={styles.input}
        placeholder="Emergency Contact"
        value={patientData.emergencyContact}
        onChangeText={(text) => setPatientData({ ...patientData, emergencyContact: text })}
        keyboardType="phone-pad"
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.backButton, styles.button]} onPress={() => setStep(2)}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.nextButton, styles.button, !patientData.phone.trim() && styles.disabledButton]}
          onPress={() => patientData.phone.trim() && setStep(4)}
          disabled={!patientData.phone.trim()}
        >
          <Text style={styles.nextButtonText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Step 4: Health Info
  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>🩺 Health Information</Text>
      <Text style={styles.stepSubtitle}>Tell us about your health</Text>

      <Text style={styles.label}>Blood Type</Text>
      <View style={styles.bloodTypeGrid}>
        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', "Don't Know"].map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.bloodTypeOption, patientData.bloodType === type && styles.bloodTypeSelected]}
            onPress={() => setPatientData({ ...patientData, bloodType: type })}
          >
            <Text style={[styles.bloodTypeText, patientData.bloodType === type && styles.bloodTypeTextSelected]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Allergies (comma separated)"
        value={patientData.allergies}
        onChangeText={(text) => setPatientData({ ...patientData, allergies: text })}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Medical Conditions (comma separated)"
        value={patientData.medicalConditions}
        onChangeText={(text) => setPatientData({ ...patientData, medicalConditions: text })}
        multiline
        numberOfLines={2}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.backButton, styles.button]} onPress={() => setStep(3)}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.nextButton, styles.button]} onPress={() => setStep(5)}>
          <Text style={styles.nextButtonText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Step 5: Insurance (Optional)
  const renderStep5 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>🏥 Insurance (Optional)</Text>
      <Text style={styles.stepSubtitle}>Do you have insurance?</Text>

      <TextInput
        style={styles.input}
        placeholder="Insurance Provider"
        value={patientData.insuranceProvider}
        onChangeText={(text) => setPatientData({ ...patientData, insuranceProvider: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Insurance ID / Policy Number"
        value={patientData.insuranceId}
        onChangeText={(text) => setPatientData({ ...patientData, insuranceId: text })}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.backButton, styles.button]} onPress={() => setStep(4)}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.nextButton, styles.button]} onPress={() => setStep(6)}>
          <Text style={styles.nextButtonText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Step 6: Create Access Code
  const renderStep6 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>🔐 Create Access Code</Text>
      <Text style={styles.stepSubtitle}>Create a 6-digit code to access your account</Text>

      <TextInput
        style={[styles.input, styles.codeInput]}
        placeholder="Enter 6-digit code"
        value={patientData.accessCode}
        onChangeText={(text) => setPatientData({ ...patientData, accessCode: text })}
        maxLength={6}
        secureTextEntry
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleRegister}>
        <Text style={styles.submitButtonText}>Complete Registration ✅</Text>
      </TouchableOpacity>
    </View>
  );

  const handleRegister = async () => {
    if (!selectedLab?.id) {
      Alert.alert('Error', 'Please select a lab first');
      return;
    }

    if (patientData.accessCode.length < 6) {
      Alert.alert('Error', 'Access code must be 6 characters');
      return;
    }

    try {
      const result = await authService.registerPatient(selectedLab.id, patientData);
      if (result.success) {
        Alert.alert(
          '🎉 Registration Complete!',
          `Your access code is: ${patientData.accessCode}\n\nPlease visit the receptionist to confirm your registration.`,
          [{ text: 'OK', onPress: () => navigation.navigate('LoginScreen') }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Registration failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: primaryColor }]}>
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.loadingText}>Loading labs...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: primaryColor }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => {
        if (step > 1) setStep(step - 1);
        else navigation.goBack();
      }}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${(step / 6) * 100}%` }]} />
      </View>

      <Text style={styles.progressText}>Step {step}/6</Text>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
      {step === 5 && renderStep5()}
      {step === 6 && renderStep6()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontFamily: 'Poppins-Regular',
  },
  backButton: {
    marginBottom: 10,
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  progressText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 20,
    fontFamily: 'Poppins-Regular',
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Poppins-Bold',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
    fontFamily: 'Poppins-Regular',
  },
  labCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  labCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  labColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  labCardInfo: {
    flex: 1,
  },
  labCardName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  labCardLocation: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 16,
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.1)',
    fontFamily: 'Poppins-Regular',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 8,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  genderOption: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderSelected: {
    borderColor: 'white',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  genderText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  label: {
    color: 'white',
    fontSize: 14,
    marginBottom: 10,
    fontFamily: 'Poppins-Medium',
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  bloodTypeOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bloodTypeSelected: {
    borderColor: 'white',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  bloodTypeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  bloodTypeTextSelected: {
    color: 'white',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: 'white',
  },
  nextButtonText: {
    color: '#1A237E',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
 
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  disabledButton: {
    opacity: 0.5,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
  },
});

export default RegisterScreen;