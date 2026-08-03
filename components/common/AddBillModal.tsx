// components/common/AddBillModal.tsx
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
import { BillCategory } from '../../types/Patient';

interface AddBillModalProps {
  visible: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  hospitalId: string;
  onBillAdded: (billData: any) => void;
  createdByName :string;
  createdBy : string;
}

const AddBillModal: React.FC<AddBillModalProps> = ({
  visible,
  onClose,
  patientId,
  patientName,
  hospitalId,
  onBillAdded,
  createdByName,
  createdBy,
}) => {
  const [loading, setLoading] = useState(false);
  const [bill, setBill] = useState({
    category: 'consultation' as BillCategory,
    description: '',
    amount: '',
    notes: ''
  });

  const billCategories: { value: BillCategory; label: string; icon: string }[] = [
    { value: 'consultation', label: 'Consultation', icon: 'medical' },
    { value: 'laboratory', label: 'Laboratory', icon: 'flask' },
    { value: 'radiology', label: 'Radiology', icon: 'scan' },
    { value: 'surgery', label: 'Surgery', icon: 'medkit' },
    { value: 'medication', label: 'Medication', icon: 'medical' },
    { value: 'ward', label: 'Ward Admission', icon: 'bed' },
    { value: 'emergency', label: 'Emergency', icon: 'warning' },
    { value: 'miscellaneous', label: 'Miscellaneous', icon: 'document' }
  ];

  const handleAddBill = async () => {
    if (!bill.description || !bill.amount) {
      Alert.alert('Error', 'Please fill in description and amount');
      return;
    }

    const amount = parseFloat(bill.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const billData = {
        category: bill.category,
        description: bill.description,
        amount: amount,
        notes: bill.notes || ''
      };

      await onBillAdded(billData);
      
      // Reset form
      setBill({
        category: 'consultation',
        description: '',
        amount: '',
        notes: ''
      });
      
    } catch (error) {
      console.error('Error in bill modal:', error);
      Alert.alert('Error', 'Failed to add bill');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setBill({
      category: 'consultation',
      description: '',
      amount: '',
      notes: ''
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={resetForm}
    >
      <div style={styles.modalContainer}>
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <div style={styles.headerTitleContainer}>
              <Text style={styles.modalTitle}>Add New Bill</Text>
              <Text style={styles.patientName}>For: {patientName}</Text>
            </view
            <TouchableOpacity onPress={resetForm} style={styles.closeButton}>
              <Ionicons name="close-circle" size={28} color="#7F8C8D" />
            </TouchableOpacity>
          </view

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Bill Category</Text>
            <div style={styles.categoriesContainer}>
              {billCategories.map(category => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryButton,
                    bill.category === category.value && styles.categoryButtonSelected
                  ]}
                  onPress={() => setBill(prev => ({ ...prev, category: category.value }))}
                >
                  <Ionicons 
                    name={category.icon as any} 
                    size={20} 
                    color={bill.category === category.value ? 'white' : '#7F8C8D'} 
                  />
                  <Text style={[
                    styles.categoryText,
                    bill.category === category.value && styles.categoryTextSelected
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </view

            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bill.description}
              onChangeText={(text) => setBill(prev => ({ ...prev, description: text }))}
              placeholder="Describe the service or item"
              placeholderTextColor="#BDC3C7"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Amount ($) *</Text>
            <div style={styles.amountContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={[styles.input, styles.amountInput]}
                value={bill.amount}
                onChangeText={(text) => setBill(prev => ({ ...prev, amount: text }))}
                placeholder="0.00"
                placeholderTextColor="#BDC3C7"
                keyboardType="decimal-pad"
              />
            </view

            <Text style={styles.inputLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bill.notes}
              onChangeText={(text) => setBill(prev => ({ ...prev, notes: text }))}
              placeholder="Additional notes..."
              placeholderTextColor="#BDC3C7"
              multiline
              numberOfLines={2}
            />
          </ScrollView>

          <div style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={resetForm}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
              onPress={handleAddBill}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Add Bill</Text>
                </>
              )}
            </TouchableOpacity>
          </view
        </view
      </view
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxHeight: '85%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  headerTitleContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  patientName: {
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 24,
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#2C3E50',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#ECF0F1',
    flex: 1,
    minWidth: '48%',
    margin: 2,
  },
  categoryButtonSelected: {
    backgroundColor: '#1E96A9',
    borderColor: '#1E96A9',
  },
  categoryText: {
    marginLeft: 8,
    color: '#7F8C8D',
    fontWeight: '600',
    fontSize: 12,
  },
  categoryTextSelected: {
    color: 'white',
  },
  input: {
    borderWidth: 2,
    borderColor: '#ECF0F1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#F8F9FA',
    color: '#2C3E50',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27AE60',
    marginRight: 12,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ECF0F1',
  },
  amountInput: {
    flex: 1,
    marginBottom: 0,
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#ECF0F1',
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
    fontSize: 16,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddBillModal;