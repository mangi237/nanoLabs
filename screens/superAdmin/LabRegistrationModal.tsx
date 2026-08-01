// components/superAdmin/LabRegistrationModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const LabRegistrationModal = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    slogan: '',
    location: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    // Theme
    primaryColor: '#1A237E',
    secondaryColor: '#E91E63',
    accentColor: '#F1C40F',
    // Admin User
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    adminAccessCode: '',
    // Status
    status: 'active'
  });

  const generateAccessCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.location.trim()) {
      Alert.alert('Error', 'Lab name and location are required');
      return;
    }

    if (!formData.adminName.trim() || !formData.adminEmail.trim()) {
      Alert.alert('Error', 'Admin name and email are required');
      return;
    }

    setLoading(true);
    try {
      // 1. Create Lab
      const labData = {
        name: formData.name,
        slogan: formData.slogan,
        location: formData.location,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        description: formData.description,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        accentColor: formData.accentColor,
        patientCount: 0,
        staffCount: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Customer Service Fee - 1000 FCFA per patient
        customerServiceFee: 1000,
        currency: 'FCFA'
      };

      const labRef = await addDoc(collection(db, 'labs'), labData);
      const labId = labRef.id;

      // 2. Create Admin User
      const adminAccessCode = formData.adminAccessCode || generateAccessCode();
      const adminData = {
        name: formData.adminName,
        email: formData.adminEmail,
        phone: formData.adminPhone,
        accessCode: adminAccessCode,
        primaryRole: 'admin',
        roles: ['admin'],
        status: 'active',
        labId: labId,
        labName: formData.name,
        isAdmin: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'labs', labId, 'staff'), adminData);

      // 3. Create default test catalog
      const defaultTests = [
        { name: 'Malaria Test', category: 'Blood', price: 5000 },
        { name: 'HIV Screening', category: 'Blood', price: 15000 },
        { name: 'COVID-19 Test', category: 'Swab', price: 20000 },
        { name: 'Blood Sugar Test', category: 'Blood', price: 3000 },
        { name: 'Urinalysis', category: 'Urine', price: 4000 },
        { name: 'Widal Test', category: 'Blood', price: 6000 },
        { name: 'Hepatitis B Test', category: 'Blood', price: 12000 },
        { name: 'Pregnancy Test', category: 'Urine', price: 2500 }
      ];

      for (const test of defaultTests) {
        await addDoc(collection(db, 'labs', labId, 'testCatalog'), {
          ...test,
          createdAt: new Date().toISOString(),
          isActive: true
        });
      }

      Alert.alert(
        '✅ Lab Created Successfully!',
        `Lab: ${formData.name}\n\nAdmin Access Code: ${adminAccessCode}\n\n⚠️ Please share this code with the lab admin.\n\nCustomer Service Fee: 1000 FCFA per patient`,
        [
          { 
            text: 'Go to Dashboard', 
            onPress: () => {
              // Navigate back to Super Admin Dashboard
              navigation.reset({
                index: 0,
                routes: [{ name: 'SuperAdminDashboard' }],
              });
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('Error creating lab:', error);
      Alert.alert('Error', error.message || 'Failed to create lab');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View>
      <Text style={styles.sectionTitle}>🏥 Lab Information</Text>
      <Text style={styles.sectionSubtitle}>Enter the lab's basic details</Text>

      <TextInput
        style={styles.input}
        placeholder="Lab Name *"
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Slogan / Tagline"
        value={formData.slogan}
        onChangeText={(text) => setFormData({ ...formData, slogan: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Location *"
        value={formData.location}
        onChangeText={(text) => setFormData({ ...formData, location: text })}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Full Address"
        value={formData.address}
        onChangeText={(text) => setFormData({ ...formData, address: text })}
        multiline
        numberOfLines={3}
      />

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
          <TextInput
            style={styles.input}
            placeholder="Phone"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        value={formData.description}
        onChangeText={(text) => setFormData({ ...formData, description: text })}
        multiline
        numberOfLines={4}
      />
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.sectionTitle}>🎨 Lab Theme</Text>
      <Text style={styles.sectionSubtitle}>Choose colors for your lab's branding</Text>

      <Text style={styles.label}>Primary Color</Text>
      <View style={styles.colorGrid}>
        {['#1A237E', '#2E7D32', '#C62828', '#E65100', '#4A148C', '#00695C', '#0D47A1', '#880E4F'].map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              formData.primaryColor === color && styles.colorSelected
            ]}
            onPress={() => setFormData({ ...formData, primaryColor: color })}
          >
            {formData.primaryColor === color && (
              <Ionicons name="checkmark" size={20} color="white" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Secondary Color</Text>
      <View style={styles.colorGrid}>
        {['#E91E63', '#FF5722', '#FFC107', '#4CAF50', '#2196F3', '#9C27B0', '#00BCD4', '#795548'].map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              formData.secondaryColor === color && styles.colorSelected
            ]}
            onPress={() => setFormData({ ...formData, secondaryColor: color })}
          >
            {formData.secondaryColor === color && (
              <Ionicons name="checkmark" size={20} color="white" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Accent Color</Text>
      <View style={styles.colorGrid}>
        {['#F1C40F', '#FF6F00', '#D4E157', '#00E5FF', '#FF4081', '#B39DDB', '#FFAB40', '#69F0AE'].map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorOption,
              { backgroundColor: color },
              formData.accentColor === color && styles.colorSelected
            ]}
            onPress={() => setFormData({ ...formData, accentColor: color })}
          >
            {formData.accentColor === color && (
              <Ionicons name="checkmark" size={20} color="white" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.sectionTitle}>👑 Admin Account</Text>
      <Text style={styles.sectionSubtitle}>Create the first admin for this lab</Text>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={24} color="#1A237E" />
        <Text style={styles.infoText}>
          The admin will have full access to manage the lab, staff, and patients.
        </Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Admin Full Name *"
        value={formData.adminName}
        onChangeText={(text) => setFormData({ ...formData, adminName: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Admin Email *"
        value={formData.adminEmail}
        onChangeText={(text) => setFormData({ ...formData, adminEmail: text })}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Admin Phone"
        value={formData.adminPhone}
        onChangeText={(text) => setFormData({ ...formData, adminPhone: text })}
        keyboardType="phone-pad"
      />

      <View style={styles.codeContainer}>
        <TextInput
          style={[styles.input, styles.codeInput]}
          placeholder="Access Code (auto-generated)"
          value={formData.adminAccessCode}
          onChangeText={(text) => setFormData({ ...formData, adminAccessCode: text })}
          maxLength={6}
          autoCapitalize="characters"
        />
        <TouchableOpacity 
          style={styles.generateButton}
          onPress={() => setFormData({ ...formData, adminAccessCode: generateAccessCode() })}
        >
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.generateText}>Generate</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.feeBox}>
        <Text style={styles.feeTitle}>💰 Customer Service Fee</Text>
        <Text style={styles.feeAmount}>1,000 FCFA</Text>
        <Text style={styles.feeSubtext}>Per patient registered at this lab</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Lab</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress Steps */}
        <View style={styles.progressContainer}>
          <View style={styles.stepIndicator}>
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <TouchableOpacity
                  style={[
                    styles.stepCircle,
                    step >= s && styles.stepCircleActive
                  ]}
                  onPress={() => setStep(s)}
                >
                  <Text style={[
                    styles.stepNumber,
                    step >= s && styles.stepNumberActive
                  ]}>
                    {s}
                  </Text>
                </TouchableOpacity>
                {s < 3 && (
                  <View style={[
                    styles.stepLine,
                    step > s && styles.stepLineActive
                  ]} />
                )}
              </React.Fragment>
            ))}
          </View>
          <View style={styles.stepLabels}>
            <Text style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}>Info</Text>
            <Text style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}>Theme</Text>
            <Text style={[styles.stepLabel, step === 3 && styles.stepLabelActive]}>Admin</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </View>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.footerButton, styles.backButton]}
            onPress={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
          >
            <Text style={[styles.backButtonText, step === 1 && styles.disabledText]}>
              Back
            </Text>
          </TouchableOpacity>

          {step < 3 ? (
            <TouchableOpacity
              style={[styles.footerButton, styles.nextButton]}
              onPress={() => setStep(step + 1)}
            >
              <Text style={styles.nextButtonText}>Next →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.footerButton, styles.createButton, loading && styles.disabledButton]}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.createButtonText}>Create Lab 🚀</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A237E',
    fontFamily: 'Poppins-Bold',
  },
  progressContainer: {
    marginBottom: 30,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#1A237E',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
    fontFamily: 'Poppins-Bold',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#E0E0E0',
  },
  stepLineActive: {
    backgroundColor: '#1A237E',
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  stepLabel: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  stepLabelActive: {
    color: '#1A237E',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 4,
    fontFamily: 'Poppins-Bold',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontFamily: 'Poppins-Regular',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 14,
    backgroundColor: 'white',
    fontFamily: 'Poppins-Regular',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    fontFamily: 'Poppins-SemiBold',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderColor: '#333',
    borderWidth: 3,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1A237E',
    fontFamily: 'Poppins-Regular',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  codeInput: {
    flex: 1,
    textAlign: 'center',
    letterSpacing: 4,
    fontSize: 18,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A237E',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  generateText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  feeBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  feeTitle: {
    fontSize: 14,
    color: '#2E7D32',
    fontFamily: 'Poppins-Medium',
  },
  feeAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B5E20',
    marginVertical: 4,
    fontFamily: 'Poppins-Bold',
  },
  feeSubtext: {
    fontSize: 12,
    color: '#388E3C',
    fontFamily: 'Poppins-Regular',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#F0F0F0',
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  disabledText: {
    color: '#999',
  },
  nextButton: {
    backgroundColor: '#1A237E',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default LabRegistrationModal;