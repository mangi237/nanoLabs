// components/cashier/RecordPaymentModal.tsx
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/authContext';

interface RecordPaymentModalProps {
  visible: boolean;
  patientId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  visible,
  patientId,
  onClose,
  onSuccess,
}) => {
  const [patient, setPatient] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [outstandingBills, setOutstandingBills] = useState<any[]>([]);
  const [selectedBills, setSelectedBills] = useState<Set<string>>(new Set());

  const { user } = useAuth();

  useEffect(() => {
    if (visible && patientId) {
      fetchPatientDetails();
    }
  }, [visible, patientId]);

  const fetchPatientDetails = async () => {
    if (!patientId) return;

    try {
      const patientRef = doc(db, 'patients', patientId);
      const patientDoc = await getDoc(patientRef);
      
      if (patientDoc.exists()) {
        const patientData = patientDoc.data();
        setPatient({
          id: patientDoc.id,
          ...patientData,
        });

        // Get outstanding bills
        if (patientData.bills && Array.isArray(patientData.bills)) {
          const pendingBills = patientData.bills.filter(
            (bill: any) => bill.status === 'pending'
          );
          setOutstandingBills(pendingBills);
        }
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
    }
  };

  const handleBillSelection = (billId: string) => {
    const newSelected = new Set(selectedBills);
    if (newSelected.has(billId)) {
      newSelected.delete(billId);
    } else {
      newSelected.add(billId);
    }
    setSelectedBills(newSelected);
  };

  const calculateSelectedAmount = () => {
    return Array.from(selectedBills).reduce((total, billId) => {
      const bill = outstandingBills.find(b => b.id === billId);
      return total + (bill?.amount || 0);
    }, 0);
  };

  const handleSubmit = async () => {
    if (!patientId || !amount) {
      Alert.alert('Error', 'Please enter payment amount');
      return;
    }

    if (parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Amount must be greater than 0');
      return;
    }

    setIsLoading(true);

    try {
      const paymentAmount = parseFloat(amount);
      const patientRef = doc(db, 'patients', patientId);
      const patientDoc = await getDoc(patientRef);
      const patientData = patientDoc.data();

      // Create payment record
      const paymentData = {
        patientId,
        patientName: patient?.name || 'Unknown',
        amount: paymentAmount,
        paymentMethod,
        referenceNumber: referenceNumber || null,
        notes: notes || null,
        recordedBy: user?.id,
        recordedByName: user?.name || user?.email,
        createdAt: Timestamp.now(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        status: 'completed',
      };

      await addDoc(collection(db, 'payments'), paymentData);

      // Update patient's outstanding balance
      const currentBalance = patientData?.outstandingBalance || 0;
      const newBalance = Math.max(0, currentBalance - paymentAmount);

      await updateDoc(patientRef, {
        outstandingBalance: newBalance,
        lastPaymentDate: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Update selected bills to paid status
      if (selectedBills.size > 0) {
        const updatedBills = patientData?.bills?.map((bill: any) => {
          if (selectedBills.has(bill.id)) {
            return {
              ...bill,
              status: 'paid',
              paidAt: Timestamp.now(),
              paidBy: user?.id,
              paymentReference: referenceNumber || null,
            };
          }
          return bill;
        }) || [];

        await updateDoc(patientRef, {
          bills: updatedBills,
        });
      }

      // If full payment, mark all outstanding bills as paid
      if (paymentAmount >= currentBalance) {
        const allBillsUpdated = patientData?.bills?.map((bill: any) => {
          if (bill.status === 'pending') {
            return {
              ...bill,
              status: 'paid',
              paidAt: Timestamp.now(),
              paidBy: user?.id,
              paymentReference: referenceNumber || null,
            };
          }
          return bill;
        }) || [];

        await updateDoc(patientRef, {
          bills: allBillsUpdated,
          outstandingBalance: 0,
        });
      }

      Alert.alert(
        'Success',
        `Payment of $${paymentAmount.toFixed(2)} recorded successfully`,
        [{ text: 'OK', onPress: onSuccess }]
      );

      resetForm();
      onClose();
    } catch (error) {
      console.error('Error recording payment:', error);
      Alert.alert('Error', 'Failed to record payment');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setPaymentMethod('cash');
    setReferenceNumber('');
    setNotes('');
    setSelectedBills(new Set());
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <div style={styles.modalOverlay}>
        <div style={styles.modalContainer}>
          <div style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
          </view

          <ScrollView style={styles.modalContent}>
            {patient && (
              <div style={styles.patientInfo}>
                <Text style={styles.patientName}>{patient.name}</Text>
                <div style={styles.patientDetails}>
                  <Text style={styles.patientDetail}>
                    ID: {patient.id?.substring(0, 8)}
                  </Text>
                  <Text style={styles.patientDetail}>
                    Outstanding Balance: $
                    {(patient.outstandingBalance || 0).toFixed(2)}
                  </Text>
                </view
              </view
            )}

            {outstandingBills.length > 0 && (
              <div style={styles.billsSection}>
                <Text style={styles.sectionTitle}>Select Bills to Pay</Text>
                {outstandingBills.map((bill) => (
                  <TouchableOpacity
                    key={bill.id}
                    style={[
                      styles.billOption,
                      selectedBills.has(bill.id) && styles.billOptionSelected,
                    ]}
                    onPress={() => handleBillSelection(bill.id)}
                  >
                    <div style={styles.billOptionContent}>
                      <div style={styles.billOptionHeader}>
                        <Text style={styles.billDescription}>
                          {bill.description}
                        </Text>
                        <Text style={styles.billAmount}>
                          ${bill.amount?.toFixed(2)}
                        </Text>
                      </view
                      <Text style={styles.billCategory}>
                        {bill.category} • Created: {new Date(bill.createdAt?.toDate()).toLocaleDateString()}
                      </Text>
                    </view
                    {selectedBills.has(bill.id) && (
                      <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
                    )}
                  </TouchableOpacity>
                ))}
                
                {selectedBills.size > 0 && (
                  <div style={styles.selectedTotal}>
                    <Text style={styles.selectedTotalText}>
                      Selected: ${calculateSelectedAmount().toFixed(2)}
                    </Text>
                  </view
                )}
              </view
            )}

            <div style={styles.formSection}>
              <Text style={styles.sectionTitle}>Payment Details</Text>

              <div style={styles.inputGroup}>
                <Text style={styles.label}>Amount ($)</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter amount"
                  keyboardType="decimal-pad"
                  editable={selectedBills.size === 0}
                />
                {selectedBills.size > 0 && (
                  <Text style={styles.hint}>
                    Amount will be set to selected bills total
                  </Text>
                )}
              </view

              <div style={styles.inputGroup}>
                <Text style={styles.label}>Payment Method</Text>
                <div style={styles.paymentMethodOptions}>
                  {['cash', 'card', 'insurance', 'bank_transfer'].map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.paymentMethodOption,
                        paymentMethod === method && styles.paymentMethodSelected,
                      ]}
                      onPress={() => setPaymentMethod(method)}
                    >
                      <Text
                        style={[
                          styles.paymentMethodText,
                          paymentMethod === method && styles.paymentMethodTextSelected,
                        ]}
                      >
                        {method.replace('_', ' ').toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </view
              </view

              <div style={styles.inputGroup}>
                <Text style={styles.label}>Reference Number (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={referenceNumber}
                  onChangeText={setReferenceNumber}
                  placeholder="Receipt/Transaction number"
                />
              </view

              <div style={styles.inputGroup}>
                <Text style={styles.label}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any notes about this payment"
                  multiline
                  numberOfLines={3}
                />
              </view
            </view
          </ScrollView>

          <div style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!amount || isLoading) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!amount || isLoading}
            >
              {isLoading ? (
                <Text style={styles.submitButtonText}>Processing...</Text>
              ) : (
                <Text style={styles.submitButtonText}>Record Payment</Text>
              )}
            </TouchableOpacity>
          </view
        </view
      </view
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
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
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  patientInfo: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  patientDetails: {
    gap: 4,
  },
  patientDetail: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  billsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 15,
  },
  billOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  billOptionSelected: {
    borderColor: '#27AE60',
    backgroundColor: '#E8F6F3',
  },
  billOptionContent: {
    flex: 1,
  },
  billOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  billDescription: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
    marginRight: 10,
  },
  billAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  billCategory: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  selectedTotal: {
    backgroundColor: '#E8F6F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  selectedTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  formSection: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#D5D8DC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2C3E50',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
  },
  paymentMethodOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethodOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#D5D8DC',
  },
  paymentMethodSelected: {
    backgroundColor: '#1E96A9',
    borderColor: '#1E96A9',
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  paymentMethodTextSelected: {
    color: 'white',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D5D8DC',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7F8C8D',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: '#27AE60',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#BDC3C7',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default RecordPaymentModal;