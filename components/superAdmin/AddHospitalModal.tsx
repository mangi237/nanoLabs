// components/superAdmin/AddHospitalModal.tsx - COMPLETE FIXED VERSION
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const PACKAGES = [
  { 
    id: 'nano-basic',
    name: 'NANO BASIC', 
    description: 'For small clinics, solo doctors',
    price: 9900, 
    patients: '0-100 patients/month',
    staff: 'Up to 5 staff',
    color: '#3498db',
    features: [
      '✓ Access code login for all users',
      '✓ Patient records & appointments',
      '✓ Basic pharmacy (inventory & prescriptions)',
      '✓ Lab results (PDF upload only)',
      '✓ Simple billing & receipts',
      '✓ Multi-department support',
      '✓ Email support'
    ],
    monthlyRate: 99,
    icon: '🏥'
  },
  { 
    id: 'nano-pro',
    name: 'NANO PRO', 
    description: 'For medium clinics, multi-doctor practices',
    price: 29900, 
    patients: '101-500 patients/month',
    staff: 'Up to 15 staff',
    color: '#27ae60',
    features: [
      '✓ All Basic features',
      '✓ Ward & bed management',
      '✓ Digital test ordering to lab',
      '✓ Insurance billing',
      '✓ Basic reports dashboard',
      '✓ Advanced patient management'
    ],
    monthlyRate: 299,
    icon: '⚕️'
  },
  { 
    id: 'nano-premium',
    name: 'NANO PREMIUM', 
    description: 'For full hospitals, multi-specialty centers',
    price: 69900, 
    patients: '501-2000 patients/month',
    staff: 'Up to 50 staff',
    color: '#9b59b6',
    features: [
      '✓ All Pro features',
      '✓ Advanced reports with charts & graphs',
      '✓ Custom report builder',
      '✓ Telemedicine add-on available',
      '✓ Priority phone support 24/7',
      '✓ API access',
      '✓ Custom integrations'
    ],
    monthlyRate: 699,
    icon: '🏢'
  },
];

interface AddHospitalModalProps {
  visible: boolean;
  onClose: () => void;
  onHospitalAdded: () => void;
}

const AddHospitalModal: React.FC<AddHospitalModalProps> = ({ 
  visible, 
  onClose, 
  onHospitalAdded 
}) => {
  const [step, setStep] = useState(0);
  const [hospitalInfo, setHospitalInfo] = useState({
    name: '',
    slogan: '',
    location: '',
    address: '',
    email: '',
    phone: '',
    description: '',
  });
  const [selectedPackage, setSelectedPackage] = useState(PACKAGES[0]);
  const [adminInfo, setAdminInfo] = useState({
    name: '',
    email: '',
    role: 'admin',
    accessCode: '',
    phone: '',
    password: '',
  });
  const [showLoader, setShowLoader] = useState(false);
  const [creating, setCreating] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const steps = [
    { title: 'Hospital Info', icon: '🏥' },
    { title: 'Select Package', icon: '💰' },
    { title: 'Admin Setup', icon: '👑' },
  ];

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      // Generate initial access code
      setAdminInfo(prev => ({ 
        ...prev, 
        accessCode: generateAccessCode(),
        password: generatePassword()
      }));
    } else {
      fadeAnim.setValue(0);
      resetForm();
    }
  }, [visible, fadeAnim]);

  const generateAccessCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const resetForm = () => {
    setStep(0);
    setHospitalInfo({
      name: '',
      slogan: '',
      location: '',
      address: '',
      email: '',
      phone: '',
      description: '',
    });
    setSelectedPackage(PACKAGES[0]);
    setAdminInfo({
      name: '',
      email: '',
      role: 'admin',
      accessCode: '',
      phone: '',
      password: '',
    });
  };

  const handleCreate = async () => {
    // Validate inputs
    if (!hospitalInfo.name.trim() || !hospitalInfo.location.trim()) {
      Alert.alert('Error', 'Hospital name and location are required');
      return;
    }

    if (!adminInfo.name.trim() || !adminInfo.email.trim()) {
      Alert.alert('Error', 'Admin name and email are required');
      return;
    }

    setCreating(true);
    try {
      // Create hospital document
      const hospitalRef = await addDoc(collection(db, 'hospitals'), {
        // Basic information
        name: hospitalInfo.name,
        slogan: hospitalInfo.slogan,
        location: hospitalInfo.location,
        address: hospitalInfo.address,
        email: hospitalInfo.email,
        phone: hospitalInfo.phone,
        description: hospitalInfo.description,
        
        // Package information
        package: selectedPackage.id,
        packageName: selectedPackage.name,
        packageIcon: selectedPackage.icon,
        subscriptionType: 'monthly',
        subscriptionAmount: selectedPackage.price,
        monthlyRate: selectedPackage.monthlyRate,
        maxPatients: parseInt(selectedPackage.patients.split('-')[1]) || 100,
        maxStaff: parseInt(selectedPackage.staff.split(' ')[2]) || 5,
        features: selectedPackage.features,
        
        // Status and metadata
        status: 'active',
        subscriptionStatus: 'active',
        totalPatients: 0,
        totalStaff: 1, // Count admin
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        
        // Financial information
        billingCycle: 'monthly',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        totalRevenue: 0,
        monthlyRevenue: selectedPackage.monthlyRate,
        
        // Settings based on package
        settings: {
          labPdfOnly: selectedPackage.id === 'nano-basic',
          digitalLabOrders: selectedPackage.id !== 'nano-basic',
          wardManagement: selectedPackage.id !== 'nano-basic',
          insuranceBilling: selectedPackage.id !== 'nano-basic',
          advancedReports: selectedPackage.id === 'nano-premium',
          customReports: selectedPackage.id === 'nano-premium',
          telemedicineAvailable: selectedPackage.id === 'nano-premium'
        }
      });

      // Create admin account
      await addDoc(collection(db, `hospitals/${hospitalRef.id}/staffs`), {
        name: adminInfo.name,
        email: adminInfo.email,
        role: 'admin',
        accessCode: adminInfo.accessCode,
        password: adminInfo.password, // In production, hash this!
        phone: adminInfo.phone,
        status: 'active',
        createdAt: Timestamp.now(),
        hospitalId: hospitalRef.id,
        permissions: ['all'],
        isSuperAdmin: false
      });

      // Create default collections structure
      await Promise.all([
        // Default departments
        addDoc(collection(db, `hospitals/${hospitalRef.id}/departments`), {
          name: 'General Medicine',
          description: 'General medical department',
          createdAt: Timestamp.now(),
          status: 'active'
        }),
        
        // Default ward (if package includes ward management)
        ...(selectedPackage.id !== 'nano-basic' ? [
          addDoc(collection(db, `hospitals/${hospitalRef.id}/wards`), {
            name: 'General Ward',
            wardType: 'general',
            totalBeds: 20,
            availableBeds: 20,
            ratePerDay: 50,
            description: 'General patient ward',
            createdAt: Timestamp.now(),
            status: 'active'
          })
        ] : []),
        
        // Default notification
        addDoc(collection(db, `hospitals/${hospitalRef.id}/notifications`), {
          type: 'system',
          title: 'Welcome to Hospital Manager',
          message: `Your hospital ${hospitalInfo.name} has been successfully created with ${selectedPackage.name} package.`,
          timestamp: Timestamp.now(),
          read: false,
          priority: 'info'
        })
      ]);

      setShowLoader(true);
      setTimeout(() => {
        setShowLoader(false);
        resetForm();
        onHospitalAdded();
        onClose();
        Alert.alert(
          'Success!',
          `Hospital "${hospitalInfo.name}" created successfully!\n\n` +
          `Admin Access Code: ${adminInfo.accessCode}\n` +
          `Temporary Password: ${adminInfo.password}\n\n` +
          `Please share these credentials securely with the hospital admin.`,
          [{ text: 'OK' }]
        );
      }, 2000);

    } catch (error: any) {
      console.error('Error creating hospital:', error);
      Alert.alert('Error', `Failed to create hospital: ${error.message}`);
      setCreating(false);
    }
  };

  const isStepValid = () => {
    switch(step) {
      case 0:
        return hospitalInfo.name.trim() && hospitalInfo.location.trim();
      case 1:
        return selectedPackage !== null;
      case 2:
        return adminInfo.name.trim() && adminInfo.email.trim() && adminInfo.accessCode.trim();
      default:
        return false;
    }
  };

  const renderStepIndicator = () => (
    <div style={styles.stepIndicator}>
      {steps.map((item, index) => (
        <div key={index} style={styles.stepContainer}>
          <div style={[
            styles.stepCircle,
            index <= step ? styles.stepCircleActive : styles.stepCircleInactive
          ]}>
            <Text style={[
              styles.stepIcon,
              index <= step ? styles.stepIconActive : styles.stepIconInactive
            ]}>
              {item.icon}
            </Text>
          </view
          <Text style={[
            styles.stepTitle,
            index <= step ? styles.stepTitleActive : styles.stepTitleInactive
          ]}>
            {item.title}
          </Text>
          {index < steps.length - 1 && (
            <div style={[
              styles.stepLine,
              index < step ? styles.stepLineActive : styles.stepLineInactive
            ]} />
          )}
        </view
      ))}
    </view
  );

  const renderStepContent = () => {
    switch(step) {
      case 0:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Hospital Information</Text>
            <Text style={styles.sectionSubtitle}>Enter basic details about the hospital</Text>
            
            <div style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hospital Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter hospital name"
                value={hospitalInfo.name}
                onChangeText={name => setHospitalInfo({ ...hospitalInfo, name })}
              />
            </view

            <div style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Slogan / Tagline</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter hospital slogan"
                value={hospitalInfo.slogan}
                onChangeText={slogan => setHospitalInfo({ ...hospitalInfo, slogan })}
              />
            </view

            <div style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="City, Country"
                value={hospitalInfo.location}
                onChangeText={location => setHospitalInfo({ ...hospitalInfo, location })}
              />
            </view

            <div style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter full address"
                value={hospitalInfo.address}
                onChangeText={address => setHospitalInfo({ ...hospitalInfo, address })}
                multiline
                numberOfLines={3}
              />
            </view

            <div style={styles.row}>
              <div style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="hospital@email.com"
                  value={hospitalInfo.email}
                  onChangeText={email => setHospitalInfo({ ...hospitalInfo, email })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </view
              <div style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+1234567890"
                  value={hospitalInfo.phone}
                  onChangeText={phone => setHospitalInfo({ ...hospitalInfo, phone })}
                  keyboardType="phone-pad"
                />
              </view
            </view

            <div style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Brief description about the hospital"
                value={hospitalInfo.description}
                onChangeText={description => setHospitalInfo({ ...hospitalInfo, description })}
                multiline
                numberOfLines={4}
              />
            </view
          </ScrollView>
        );

      case 1:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Select Package</Text>
            <Text style={styles.sectionSubtitle}>Choose a package based on your hospital's needs</Text>

            {PACKAGES.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                style={[
                  styles.packageCard,
                  selectedPackage.id === pkg.id && { 
                    borderColor: pkg.color, 
                    backgroundColor: `${pkg.color}15`,
                    transform: [{ scale: 1.02 }]
                  }
                ]}
                onPress={() => setSelectedPackage(pkg)}
              >
                <div style={styles.packageHeader}>
                  <div style={[styles.packageIcon, { backgroundColor: `${pkg.color}20` }]}>
                    <Text style={[styles.packageIconText, { color: pkg.color }]}>
                      {pkg.icon}
                    </Text>
                  </view
                  <div style={styles.packageInfo}>
                    <Text style={styles.packageName}>{pkg.name}</Text>
                    <Text style={styles.packageDescription}>{pkg.description}</Text>
                  </view
                  <div style={styles.packagePrice}>
                    <Text style={[styles.packageAmount, { color: pkg.color }]}>
                      ${pkg.monthlyRate}/month
                    </Text>
                    <Text style={styles.packageDuration}>billed monthly</Text>
                  </view
                </view

                <div style={styles.packageFeatures}>
                  <Text style={styles.featuresTitle}>Features:</Text>
                  {pkg.features.map((feature, index) => (
                    <div key={index} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color={pkg.color} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </view
                  ))}
                </view

                <div style={styles.packageStats}>
                  <div style={styles.statItem}>
                    <Ionicons name="people" size={16} color={pkg.color} />
                    <Text style={[styles.statText, { color: pkg.color }]}>
                      {pkg.staff}
                    </Text>
                  </view
                  <div style={styles.statItem}>
                    <Ionicons name="person" size={16} color={pkg.color} />
                    <Text style={[styles.statText, { color: pkg.color }]}>
                      {pkg.patients}
                    </Text>
                  </view
                  <div style={styles.statItem}>
                    <Ionicons name="shield-checkmark" size={16} color={pkg.color} />
                    <Text style={[styles.statText, { color: pkg.color }]}>
                      {pkg.id === 'nano-premium' ? '24/7 Support' : 'Email Support'}
                    </Text>
                  </view
                </view

                {selectedPackage.id === pkg.id && (
                  <div style={[styles.selectedBadge, { backgroundColor: pkg.color }]}>
                    <Ionicons name="checkmark" size={20} color="white" />
                    <Text style={styles.selectedText}>SELECTED</Text>
                  </view
                )}
              </TouchableOpacity>
            ))}

            <div style={styles.packageComparison}>
              <Text style={styles.comparisonTitle}>Package Comparison</Text>
              <div style={styles.comparisonTable}>
                <div style={styles.comparisonRow}>
                  <Text style={styles.comparisonHeader}>Feature</Text>
                  {PACKAGES.map(pkg => (
                    <Text key={pkg.id} style={[styles.comparisonHeader, { color: pkg.color }]}>
                      {pkg.name.split(' ')[1]}
                    </Text>
                  ))}
                </view
                <div style={styles.comparisonRow}>
                  <Text style={styles.comparisonCell}>Lab PDF Upload Only</Text>
                  <Text style={styles.comparisonCell}>✓</Text>
                  <Text style={styles.comparisonCell}>-</Text>
                  <Text style={styles.comparisonCell}>-</Text>
                </view
                <div style={styles.comparisonRow}>
                  <Text style={styles.comparisonCell}>Digital Lab Orders</Text>
                  <Text style={styles.comparisonCell}>-</Text>
                  <Text style={styles.comparisonCell}>✓</Text>
                  <Text style={styles.comparisonCell}>✓</Text>
                </view
                <div style={styles.comparisonRow}>
                  <Text style={styles.comparisonCell}>Ward Management</Text>
                  <Text style={styles.comparisonCell}>-</Text>
                  <Text style={styles.comparisonCell}>✓</Text>
                  <Text style={styles.comparisonCell}>✓</Text>
                </view
                <div style={styles.comparisonRow}>
                  <Text style={styles.comparisonCell}>Advanced Reports</Text>
                  <Text style={styles.comparisonCell}>-</Text>
                  <Text style={styles.comparisonCell}>-</Text>
                  <Text style={styles.comparisonCell}>✓</Text>
                </view
              </view
            </view
          </ScrollView>
        );

      case 2:
        return (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>Admin Account Setup</Text>
            <Text style={styles.sectionSubtitle}>Create the primary admin account for hospital management</Text>

            <div style={styles.adminCard}>
              <div style={styles.adminIcon}>
                <MaterialIcons name="admin-panel-settings" size={28} color="#1E96A9" />
              </view
              <Text style={styles.adminTitle}>Primary Administrator</Text>
              <Text style={styles.adminSubtitle}>
                This user will have full control over {hospitalInfo.name || 'the hospital'}
              </Text>
            </view

            <div style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Admin Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter admin's full name"
                value={adminInfo.name}
                onChangeText={name => setAdminInfo({ ...adminInfo, name })}
              />
            </view

            <div style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="admin@hospital.com"
                value={adminInfo.email}
                onChangeText={email => setAdminInfo({ ...adminInfo, email })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </view

            <div style={styles.row}>
              <div style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+1234567890"
                  value={adminInfo.phone}
                  onChangeText={phone => setAdminInfo({ ...adminInfo, phone })}
                  keyboardType="phone-pad"
                />
              </view
              <div style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Access Code *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="6-digit code"
                  value={adminInfo.accessCode}
                  onChangeText={accessCode => setAdminInfo({ ...adminInfo, accessCode })}
                  maxLength={6}
                  autoCapitalize="characters"
                />
              </view
            </view

            <div style={styles.infoBox}>
              <div style={styles.infoHeader}>
                <Ionicons name="key" size={20} color="#f39c12" />
                <Text style={styles.infoTitle}>Access Credentials</Text>
              </view
              <div style={styles.credentialsBox}>
                <div style={styles.credentialItem}>
                  <Text style={styles.credentialLabel}>Access Code:</Text>
                  <Text style={styles.credentialValue}>{adminInfo.accessCode}</Text>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => {
                      // Copy to clipboard logic here
                      Alert.alert('Copied', 'Access code copied to clipboard');
                    }}
                  >
                    <Ionicons name="copy" size={16} color="#3498db" />
                  </TouchableOpacity>
                </view
                <div style={styles.credentialItem}>
                  <Text style={styles.credentialLabel}>Temporary Password:</Text>
                  <Text style={styles.credentialValue}>{adminInfo.password}</Text>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => {
                      // Copy to clipboard logic here
                      Alert.alert('Copied', 'Password copied to clipboard');
                    }}
                  >
                    <Ionicons name="copy" size={16} color="#3498db" />
                  </TouchableOpacity>
                </view
              </view
              <Text style={styles.infoText}>
                These credentials will be used for the initial login. Please share them securely with the hospital administrator.
              </Text>
            </view

            <div style={styles.regenerateSection}>
              <TouchableOpacity 
                style={styles.regenerateButton}
                onPress={() => {
                  setAdminInfo({ 
                    ...adminInfo, 
                    accessCode: generateAccessCode(),
                    password: generatePassword()
                  });
                }}
              >
                <Ionicons name="refresh" size={18} color="#1E96A9" />
                <Text style={styles.regenerateText}>Regenerate Credentials</Text>
              </TouchableOpacity>
            </view

            <div style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Setup Summary</Text>
              <div style={styles.summaryRow}>
                <Ionicons name="business" size={16} color="#6366F1" />
                <Text style={styles.summaryText}>
                  <Text style={styles.summaryLabel}>Hospital:</Text> {hospitalInfo.name || 'Not specified'}
                </Text>
              </view
              <div style={styles.summaryRow}>
                <Ionicons name="cube" size={16} color="#6366F1" />
                <Text style={styles.summaryText}>
                  <Text style={styles.summaryLabel}>Package:</Text> {selectedPackage.name}
                </Text>
              </view
              <div style={styles.summaryRow}>
                <Ionicons name="cash" size={16} color="#6366F1" />
                <Text style={styles.summaryText}>
                  <Text style={styles.summaryLabel}>Monthly Rate:</Text> ${selectedPackage.monthlyRate}
                </Text>
              </view
              <div style={styles.summaryRow}>
                <Ionicons name="person" size={16} color="#6366F1" />
                <Text style={styles.summaryText}>
                  <Text style={styles.summaryLabel}>Admin:</Text> {adminInfo.name || 'Not specified'}
                </Text>
              </view
            </view
          </ScrollView>
        );

      default:
        return null;
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <div style={styles.modal}>
            {/* Header */}
            <div style={styles.header}>
              <div 
                <Text style={styles.title}>Create New Hospital</Text>
                <Text style={styles.subtitle}>Step {step + 1} of {steps.length}: {steps[step].title}</Text>
              </view
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#7f8c8d" />
              </TouchableOpacity>
            </view

            {/* Step Indicator */}
            {renderStepIndicator()}

            {/* Content */}
            <div style={styles.content}>
              {renderStepContent()}
            </view

            {/* Footer */}
            <div style={styles.footer}>
              {step > 0 && (
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => setStep(step - 1)}
                >
                  <Ionicons name="arrow-back" size={18} color="#1E96A9" />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  !isStepValid() && styles.nextButtonDisabled
                ]}
                onPress={() => {
                  if (step < steps.length - 1) {
                    setStep(step + 1);
                  } else {
                    handleCreate();
                  }
                }}
                disabled={!isStepValid() || creating}
              >
                {creating ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text style={styles.nextButtonText}>
                      {step < steps.length - 1 ? 'Continue' : 'Create Hospital'}
                    </Text>
                    <Ionicons 
                      name={step < steps.length - 1 ? "arrow-forward" : "checkmark"} 
                      size={18} 
                      color="white" 
                    />
                  </>
                )}
              </TouchableOpacity>
            </view
          </view
        </Animated.View>

        {/* Success Loader */}
        {showLoader && (
          <div style={styles.successOverlay}>
            <div style={styles.successContent}>
              <div style={styles.successAnimation}>
                <Ionicons name="checkmark-circle" size={80} color="#27ae60" />
                <Animated.View 
                  style={[
                    styles.successRing,
                    {
                      transform: [
                        { rotate: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg']
                        })}
                      ]
                    }
                  ]}
                />
              </view
              <Text style={styles.successTitle}>Hospital Created!</Text>
              <Text style={styles.successMessage}>
                {hospitalInfo.name} has been successfully created.
                Setting up the system...
              </Text>
              <div style={styles.loader}>
                <div style={styles.loaderBar} />
              </view
            </view
          </view
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: width > 700 ? 700 : width - 40,
    maxHeight: height - 80,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'Poppins-SemiBold',
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  closeButton: {
    padding: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#F8F9FA',
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  stepCircleActive: {
    backgroundColor: '#1E96A9',
  },
  stepCircleInactive: {
    backgroundColor: '#ECF0F1',
  },
  stepIcon: {
    fontSize: 16,
  },
  stepIconActive: {
    color: 'white',
  },
  stepIconInactive: {
    color: '#95a5a6',
  },
  stepTitle: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
  },
  stepTitleActive: {
    color: '#2C3E50',
  },
  stepTitleInactive: {
    color: '#95a5a6',
  },
  stepLine: {
    flex: 1,
    height: 2,
    position: 'absolute',
    top: 19,
    left: 40,
    right: 0,
  },
  stepLineActive: {
    backgroundColor: '#1E96A9',
  },
  stepLineInactive: {
    backgroundColor: '#ECF0F1',
  },
  content: {
    flex: 1,
    maxHeight: height * 0.6,
  },
  stepContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
    fontFamily: 'Poppins-Regular',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 6,
    fontFamily: 'Poppins-SemiBold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D5D8DC',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#2C3E50',
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
  packageCard: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#ECF0F1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  packageIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  packageIconText: {
    fontSize: 24,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  packageDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    fontFamily: 'Poppins-Regular',
  },
  packagePrice: {
    alignItems: 'flex-end',
  },
  packageAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  packageDuration: {
    fontSize: 11,
    color: '#95a5a6',
    fontFamily: 'Poppins-Regular',
  },
  packageFeatures: {
    marginBottom: 12,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 12,
    color: '#34495E',
    marginLeft: 8,
    flex: 1,
    fontFamily: 'Poppins-Regular',
    lineHeight: 16,
  },
  packageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  selectedBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  selectedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  packageComparison: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 16,
    marginTop: 20,
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  comparisonTable: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
  },
  comparisonRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  comparisonHeader: {
    flex: 1,
    padding: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
  comparisonCell: {
    flex: 1,
    padding: 12,
    fontSize: 12,
    color: '#34495E',
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  adminCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  adminIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
  },
  adminSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  infoBox: {
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#F1C40F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D97706',
    fontFamily: 'Poppins-SemiBold',
  },
  credentialsBox: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  credentialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  credentialLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  credentialValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Poppins-SemiBold',
  },
  copyButton: {
    padding: 4,
  },
  infoText: {
    fontSize: 11,
    color: '#92400E',
    fontFamily: 'Poppins-Regular',
    lineHeight: 16,
  },
  regenerateSection: {
    marginBottom: 16,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  regenerateText: {
    color: '#1E96A9',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  summaryCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Poppins-Regular',
  },
  summaryLabel: {
    fontWeight: '600',
    color: '#1E96A9',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#1E96A9',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E96A9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
    marginRight: 8,
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    maxWidth: 400,
  },
  successAnimation: {
    position: 'relative',
    marginBottom: 20,
  },
  successRing: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 50,
    borderWidth: 5,
    borderColor: '#27ae60',
    borderLeftColor: 'transparent',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  successMessage: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular',
  },
  loader: {
    width: 200,
    height: 4,
    backgroundColor: '#ECF0F1',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loaderBar: {
    height: '100%',
    backgroundColor: '#27ae60',
    width: '100%',
  },
});

export default AddHospitalModal;