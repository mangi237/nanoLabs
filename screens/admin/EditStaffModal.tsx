// components/admin/EditStaffModal.tsx - COMPLETE FIX

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
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/authContext';

const EditStaffModal = ({ visible, onClose, staff, onStaffUpdated }: any) => {
  const { lab } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: staff?.name || '',
    email: staff?.email || '',
    phone: staff?.phone || '',
    accessCode: staff?.accessCode || '',
    roles: staff?.roles || ['receptionist']
  });

  const roleOptions = [
    { value: 'receptionist', label: 'Receptionist', icon: '👤' },
    { value: 'cashier', label: 'Cashier', icon: '💰' },
    { value: 'analyzer', label: 'Analyzer', icon: '🔬' },
    { value: 'lab_tech', label: 'Lab Technician', icon: '🧪' },
    { value: 'admin', label: 'Admin', icon: '👑' },
    { value: 'inventory_manager', label: 'Inventory Manager', icon: '📦' }
  ];

  const generateAccessCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const toggleRole = (role: string) => {
    let updatedRoles = [...formData.roles];
    if (updatedRoles.includes(role)) {
      updatedRoles = updatedRoles.filter(r => r !== role);
    } else {
      updatedRoles.push(role);
    }
    setFormData({ ...formData, roles: updatedRoles });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert('Error', 'Name and email are required');
      return;
    }

    if (formData.roles.length === 0) {
      Alert.alert('Error', 'Please select at least one role');
      return;
    }

    setLoading(true);
    try {
      const staffRef = doc(db, 'labs', lab?.id, 'staff', staff.id);
      await updateDoc(staffRef, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        accessCode: formData.accessCode,
        roles: formData.roles,
        updatedAt: new Date().toISOString()
      });

      Alert.alert('✅ Success', 'Staff updated successfully');
      onStaffUpdated();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update staff');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <div style={styles.modalContent}>
          <div style={styles.header}>
            <Text style={styles.headerTitle}>Edit Staff Member</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </div>

          <ScrollView showsVerticalScrollIndicator={false}>
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Email *"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Phone"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />

            <div style={styles.codeContainer}>
              <TextInput
                style={[styles.input, styles.codeInput]}
                placeholder="Access Code"
                value={formData.accessCode}
                onChangeText={(text) => setFormData({ ...formData, accessCode: text })}
                maxLength={6}
                autoCapitalize="characters"
              />
              <TouchableOpacity 
                style={styles.generateButton}
                onPress={() => setFormData({ ...formData, accessCode: generateAccessCode() })}
              >
                <Ionicons name="refresh" size={16} color="white" />
                <Text style={styles.generateText}>Generate</Text>
              </TouchableOpacity>
            </div>

            <Text style={styles.sectionTitle}>Roles</Text>
            <div style={styles.roleGrid}>
              {roleOptions.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  style={[
                    styles.roleCard,
                    formData.roles.includes(role.value) && styles.roleCardSelected
                  ]}
                  onPress={() => toggleRole(role.value)}
                >
                  <Text style={styles.roleIcon}>{role.icon}</Text>
                  <Text style={[
                    styles.roleLabel,
                    formData.roles.includes(role.value) && styles.roleLabelSelected
                  ]}>
                    {role.label}
                  </Text>
                  {formData.roles.includes(role.value) && (
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              ))}
            </div>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Update Staff</Text>}
            </TouchableOpacity>
          </ScrollView>
        </div>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A237E',
    fontFamily: 'Poppins-Bold',
  },
  closeButton: {
    padding: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: '#F8F9FA',
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  generateText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardSelected: {
    borderColor: '#1A237E',
    backgroundColor: '#E8EAF6',
  },
  roleIcon: {
    fontSize: 16,
  },
  roleLabel: {
    fontSize: 13,
    color: '#555',
    fontFamily: 'Poppins-Regular',
  },
  roleLabelSelected: {
    color: '#1A237E',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#1A237E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default EditStaffModal;