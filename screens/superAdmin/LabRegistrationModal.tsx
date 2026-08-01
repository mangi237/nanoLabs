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
import { addDoc, collection } from 'firebase/firestore';
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
    // Subscription
    subscriptionType: 'basic',
    maxPatients: 100,
    maxStaff: 5,
    // Status
    status: 'active'
  });

  const subscriptionPlans = [
    { id: 'basic', name: 'Basic', price: 99, patients: 100, staff: 5, color: '#3498db' },
    { id: 'pro', name: 'Pro', price: 299, patients: 500, staff: 15, color: '#27ae60' },
    { id: 'premium', name: 'Premium', price: 699, patients: 2000, staff: 50, color: '#9b59b6' }
  ];

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.location.trim()) {
      Alert.alert('Error', 'Lab name and location are required');
      return;
    }

    setLoading(true);
    try {
      const labData = {
        ...formData,
        patientCount: 0,
        staffCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subscription: {
          type: formData.subscriptionType,
          price: subscriptionPlans.find(p => p.id === formData.subscriptionType)?.price || 99,
          maxPatients: formData.maxPatients,
          maxStaff: formData.maxStaff,
          status: 'active'
        }
      };

      const docRef = await addDoc(collection(db, 'labs'), labData);
      
      Alert.alert(
        '✅ Lab Created!',
        `"${formData.name}" has been successfully created.\n\nLab ID: ${docRef.id}`,
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
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
      <Text style={styles.sectionTitle}>🏥 Basic Information</Text>
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
        {['#1A237E', '#2E7D32', '#C62828', '#E65100', '#4A148C', '#00695C', '#1A237E', '#880E4F'].map((color) => (
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
      <Text style={styles.sectionTitle}>📦 Subscription Plan</Text>
      <Text style={styles.sectionSubtitle}>Choose a plan for this lab</Text>

      {subscriptionPlans.map((plan) => (
        <TouchableOpacity
          key={plan.id}
          style={[
            styles.planCard,
            formData.subscriptionType === plan.id && styles.planCardSelected,
            { borderColor: plan.color }
          ]}
          onPress={() => {
            setFormData({
              ...formData,
              subscriptionType: plan.id,
              maxPatients: plan.patients,
              maxStaff: plan.staff
            });
          }}
        >
          <View style={[styles.planHeader, { backgroundColor: plan.color + '15' }]}>
            <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
            <Text style={styles.planPrice}>${plan.price}/month</Text>
          </View>
          <View style={styles.planDetails}>
            <Text style={styles.planFeature}>👥 Up to {plan.patients} patients/month</Text>
            <Text style={styles.planFeature}>👤 {plan.staff} staff members</Text>
          </View>
          {formData.subscriptionType === plan.id && (
            <View style={[styles.planBadge, { backgroundColor: plan.color }]}>
              <Ionicons name="checkmark" size={16} color="white" />
              <Text style={styles.planBadgeText}>SELECTED</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
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
            <Text style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}>Basic Info</Text>
            <Text style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}>Theme</Text>
            <Text style={[styles.stepLabel, step === 3 && styles.stepLabelActive]}>Subscription</Text>
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
  planCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    position: 'relative',
  },
  planCardSelected: {
    borderWidth: 2,
  },
  planHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Poppins-Bold',
  },
  planDetails: {
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  planFeature: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  planBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  planBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
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