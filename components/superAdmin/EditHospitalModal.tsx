// components/superAdmin/EditHospitalModal.tsx - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const PACKAGES = [
  { 
    id: 'nano-basic',
    name: 'NANO BASIC', 
    price: 9900,
    monthlyRate: 99,
    color: '#3498db'
  },
  { 
    id: 'nano-pro',
    name: 'NANO PRO', 
    price: 29900,
    monthlyRate: 299,
    color: '#27ae60'
  },
  { 
    id: 'nano-premium',
    name: 'NANO PREMIUM', 
    price: 69900,
    monthlyRate: 699,
    color: '#9b59b6'
  },
];

interface EditHospitalModalProps {
  visible: boolean;
  onClose: () => void;
  hospital: any;
  onHospitalUpdated: () => void;
}

const EditHospitalModal: React.FC<EditHospitalModalProps> = ({ 
  visible, 
  onClose, 
  hospital, 
  onHospitalUpdated 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    slogan: '',
    location: '',
    address: '',
    email: '',
    phone: '',
    description: '',
    status: 'active',
    package: '',
    subscriptionStatus: 'active',
    maxPatients: 0,
    maxStaff: 0,
  });
  const [loading, setLoading] = useState(false);
  const [updatingPackage, setUpdatingPackage] = useState(false);

  useEffect(() => {
    if (hospital) {
      setFormData({
        name: hospital.name || '',
        slogan: hospital.slogan || '',
        location: hospital.location || hospital.address || '',
        address: hospital.address || '',
        email: hospital.email || '',
        phone: hospital.phone || '',
        description: hospital.description || '',
        status: hospital.status || 'active',
        package: hospital.package || 'nano-basic',
        subscriptionStatus: hospital.subscriptionStatus || 'active',
        maxPatients: hospital.maxPatients || 100,
        maxStaff: hospital.maxStaff || 5,
      });
    }
  }, [hospital]);

  const handleUpdate = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Hospital name is required');
      return;
    }

    setLoading(true);
    try {
      const selectedPackage = PACKAGES.find(p => p.id === formData.package);
      
      const updateData: any = {
        ...formData,
        updatedAt: Timestamp.now(),
      };

      // If package changed, update pricing and features
      if (hospital.package !== formData.package && selectedPackage) {
        updateData.packageName = selectedPackage.name;
        updateData.subscriptionAmount = selectedPackage.price;
        updateData.monthlyRate = selectedPackage.monthlyRate;
        updateData.maxPatients = getPackageMaxPatients(formData.package);
        updateData.maxStaff = getPackageMaxStaff(formData.package);
        
        // Update package-specific settings
        updateData.settings = {
          labPdfOnly: formData.package === 'nano-basic',
          digitalLabOrders: formData.package !== 'nano-basic',
          wardManagement: formData.package !== 'nano-basic',
          insuranceBilling: formData.package !== 'nano-basic',
          advancedReports: formData.package === 'nano-premium',
          customReports: formData.package === 'nano-premium',
          telemedicineAvailable: formData.package === 'nano-premium'
        };
      }

      await updateDoc(doc(db, 'hospitals', hospital.id), updateData);
      
      Alert.alert('Success', 'Hospital updated successfully');
      onHospitalUpdated();
    } catch (error: any) {
      console.error('Error updating hospital:', error);
      Alert.alert('Error', `Failed to update hospital: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getPackageMaxPatients = (packageId: string) => {
    switch(packageId) {
      case 'nano-basic': return 100;
      case 'nano-pro': return 500;
      case 'nano-premium': return 2000;
      default: return 100;
    }
  };

  const getPackageMaxStaff = (packageId: string) => {
    switch(packageId) {
      case 'nano-basic': return 5;
      case 'nano-pro': return 15;
      case 'nano-premium': return 50;
      default: return 5;
    }
  };

  const handlePackageUpgrade = async (newPackage: string) => {
    setUpdatingPackage(true);
    try {
      const selectedPackage = PACKAGES.find(p => p.id === newPackage);
      if (!selectedPackage) return;

      await updateDoc(doc(db, 'hospitals', hospital.id), {
        package: newPackage,
        packageName: selectedPackage.name,
        subscriptionAmount: selectedPackage.price,
        monthlyRate: selectedPackage.monthlyRate,
        maxPatients: getPackageMaxPatients(newPackage),
        maxStaff: getPackageMaxStaff(newPackage),
        updatedAt: Timestamp.now(),
        settings: {
          labPdfOnly: newPackage === 'nano-basic',
          digitalLabOrders: newPackage !== 'nano-basic',
          wardManagement: newPackage !== 'nano-basic',
          insuranceBilling: newPackage !== 'nano-basic',
          advancedReports: newPackage === 'nano-premium',
          customReports: newPackage === 'nano-premium',
          telemedicineAvailable: newPackage === 'nano-premium'
        }
      });

      setFormData(prev => ({ ...prev, package: newPackage }));
      Alert.alert('Success', `Package upgraded to ${selectedPackage.name}`);
    } catch (error: any) {
      console.error('Error upgrading package:', error);
      Alert.alert('Error', `Failed to upgrade package: ${error.message}`);
    } finally {
      setUpdatingPackage(false);
    }
  };

  if (!hospital) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Edit Hospital</Text>
                <Text style={styles.subtitle}>{hospital.name}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#7f8c8d" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Basic Information */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="hospital-building" size={20} color="#1E96A9" />
                  <Text style={styles.sectionTitle}>Basic Information</Text>
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Hospital Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={name => setFormData({ ...formData, name })}
                    placeholder="Enter hospital name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Slogan</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.slogan}
                    onChangeText={slogan => setFormData({ ...formData, slogan })}
                    placeholder="Enter hospital slogan"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Location *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.location}
                    onChangeText={location => setFormData({ ...formData, location })}
                    placeholder="City, Country"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Address</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.address}
                    onChangeText={address => setFormData({ ...formData, address })}
                    placeholder="Enter full address"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              {/* Package Information */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="cube" size={20} color="#9b59b6" />
                  <Text style={styles.sectionTitle}>Package Information</Text>
                </View>

                <View style={styles.currentPackage}>
                  <Text style={styles.currentPackageLabel}>Current Package:</Text>
                  <View style={[styles.packageBadge, { backgroundColor: PACKAGES.find(p => p.id === formData.package)?.color || '#3498db' }]}>
                    <Text style={styles.packageBadgeText}>
                      {PACKAGES.find(p => p.id === formData.package)?.name || 'NANO BASIC'}
                    </Text>
                  </View>
                </View>

                <View style={styles.packageStats}>
                  <View style={styles.statBox}>
                    <Ionicons name="people" size={20} color="#3498db" />
                    <Text style={styles.statNumber}>{formData.maxStaff}</Text>
                    <Text style={styles.statLabel}>Max Staff</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Ionicons name="person" size={20} color="#27ae60" />
                    <Text style={styles.statNumber}>{formData.maxPatients}</Text>
                    <Text style={styles.statLabel}>Max Patients/Month</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Ionicons name="cash" size={20} color="#f39c12" />
                    <Text style={styles.statNumber}>
                      ${PACKAGES.find(p => p.id === formData.package)?.monthlyRate || 99}
                    </Text>
                    <Text style={styles.statLabel}>Monthly Rate</Text>
                  </View>
                </View>

                <Text style={styles.upgradeTitle}>Upgrade Package:</Text>
                <View style={styles.packageOptions}>
                  {PACKAGES.map(pkg => (
                    <TouchableOpacity
                      key={pkg.id}
                      style={[
                        styles.packageOption,
                        formData.package === pkg.id && styles.packageOptionSelected,
                        { borderColor: pkg.color }
                      ]}
                      onPress={() => {
                         handlePackageUpgrade(pkg.id);
                      }}
                      disabled={formData.package === pkg.id || updatingPackage}
                    >
                      <View style={[styles.packageOptionHeader, { backgroundColor: `${pkg.color}15` }]}>
                        <Text style={[styles.packageOptionName, { color: pkg.color }]}>
                          {pkg.name}
                        </Text>
                        <Text style={styles.packageOptionPrice}>${pkg.monthlyRate}/month</Text>
                      </View>
                      <View style={styles.packageOptionFeatures}>
                        <Text style={styles.packageOptionFeature}>
                          Max Staff: {getPackageMaxStaff(pkg.id)}
                        </Text>
                        <Text style={styles.packageOptionFeature}>
                          Max Patients: {getPackageMaxPatients(pkg.id)}/month
                        </Text>
                      </View>
                      {formData.package === pkg.id && (
                        <View style={[styles.currentBadge, { backgroundColor: pkg.color }]}>
                          <Ionicons name="checkmark" size={14} color="white" />
                          <Text style={styles.currentBadgeText}>CURRENT</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Contact Information */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="call" size={20} color="#3498db" />
                  <Text style={styles.sectionTitle}>Contact Information</Text>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.email}
                      onChangeText={email => setFormData({ ...formData, email })}
                      placeholder="hospital@email.com"
                      keyboardType="email-address"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Phone</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.phone}
                      onChangeText={phone => setFormData({ ...formData, phone })}
                      placeholder="+1234567890"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description}
                    onChangeText={description => setFormData({ ...formData, description })}
                    placeholder="Brief description about the hospital"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </View>

              {/* Status */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="progress-check" size={20} color="#27ae60" />
                  <Text style={styles.sectionTitle}>Status & Subscription</Text>
                </View>

                <View style={styles.statusRow}>
                  <View style={styles.statusGroup}>
                    <Text style={styles.inputLabel}>Hospital Status</Text>
                    <View style={styles.statusOptions}>
                      <TouchableOpacity
                        style={[
                          styles.statusOption,
                          formData.status === 'active' && styles.statusOptionActive
                        ]}
                        onPress={() => setFormData({ ...formData, status: 'active' })}
                      >
                        <View style={[
                          styles.statusDot,
                          formData.status === 'active' ? styles.statusDotActive : styles.statusDotInactive
                        ]} />
                        <Text style={[
                          styles.statusText,
                          formData.status === 'active' && styles.statusTextActive
                        ]}>
                          Active
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.statusOption,
                          formData.status === 'inactive' && styles.statusOptionActive
                        ]}
                        onPress={() => setFormData({ ...formData, status: 'inactive' })}
                      >
                        <View style={[
                          styles.statusDot,
                          formData.status === 'inactive' ? styles.statusDotInactive : styles.statusDotInactive
                        ]} />
                        <Text style={[
                          styles.statusText,
                          formData.status === 'inactive' && styles.statusTextActive
                        ]}>
                          Inactive
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.statusGroup}>
                    <Text style={styles.inputLabel}>Subscription Status</Text>
                    <View style={styles.statusOptions}>
                      <TouchableOpacity
                        style={[
                          styles.statusOption,
                          formData.subscriptionStatus === 'active' && styles.statusOptionActive
                        ]}
                        onPress={() => setFormData({ ...formData, subscriptionStatus: 'active' })}
                      >
                        <View style={[
                          styles.statusDot,
                          formData.subscriptionStatus === 'active' ? styles.statusDotActive : styles.statusDotInactive
                        ]} />
                        <Text style={[
                          styles.statusText,
                          formData.subscriptionStatus === 'active' && styles.statusTextActive
                        ]}>
                          Active
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.statusOption,
                          formData.subscriptionStatus === 'suspended' && styles.statusOptionActive
                        ]}
                        onPress={() => setFormData({ ...formData, subscriptionStatus: 'suspended' })}
                      >
                        <View style={[
                          styles.statusDot,
                          formData.subscriptionStatus === 'suspended' ? styles.statusDotInactive : styles.statusDotInactive
                        ]} />
                        <Text style={[
                          styles.statusText,
                          formData.subscriptionStatus === 'suspended' && styles.statusTextActive
                        ]}>
                          Suspended
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleUpdate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="save" size={18} color="white" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
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
  scrollView: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 8,
    fontFamily: 'Poppins-SemiBold',
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
  currentPackage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  currentPackageLabel: {
    fontSize: 14,
    color: '#2C3E50',
    fontFamily: 'Poppins-Regular',
  },
  packageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  packageBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  packageStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginVertical: 4,
    fontFamily: 'Poppins-Bold',
  },
  statLabel: {
    fontSize: 11,
    color: '#7F8C8D',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  upgradeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  packageOptions: {
    gap: 12,
  },
  packageOption: {
    borderWidth: 2,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  packageOptionSelected: {
    backgroundColor: '#F8F9FA',
  },
  packageOptionHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageOptionName: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  packageOptionPrice: {
    fontSize: 14,
    color: '#2C3E50',
    fontFamily: 'Poppins-SemiBold',
  },
  packageOptionFeatures: {
    padding: 16,
    backgroundColor: 'white',
    gap: 8,
  },
  packageOptionFeature: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  currentBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  currentBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 20,
  },
  statusGroup: {
    flex: 1,
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECF0F1',
    borderRadius: 10,
    padding: 12,
    flex: 1,
  },
  statusOptionActive: {
    borderColor: '#1E96A9',
    backgroundColor: '#E3F2FD',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusDotActive: {
    backgroundColor: '#27ae60',
  },
  statusDotInactive: {
    backgroundColor: '#e74c3c',
  },
  statusText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontFamily: 'Poppins-Regular',
  },
  statusTextActive: {
    color: '#2C3E50',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: '#D5D8DC',
    borderRadius: 10,
  },
  cancelButtonText: {
    color: '#2C3E50',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E96A9',
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
});

export default EditHospitalModal;