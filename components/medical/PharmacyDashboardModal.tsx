// components/pharmacy/DispenseMedicationModal.tsx
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
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/authContext';

interface Medication {
  id?: string;
  name: string;
  quantity: number;
  price: number;
  measurementUnit: string;
}

interface DispenseMedicationModalProps {
  visible: boolean;
  onClose: () => void;
  patientId: string | null;
}

const DispenseMedicationModal: React.FC<DispenseMedicationModalProps> = ({ 
  visible, 
  onClose, 
  patientId 
}) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [quantity, setQuantity] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (visible) {
      fetchMedications();
    }
  }, [visible]);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'medications'));
      const meds = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Medication[];
      setMedications(meds);
    } catch (error) {
      console.error('Error fetching medications:', error);
      Alert.alert('Error', 'Failed to load medications');
    } finally {
      setLoading(false);
    }
  };

  const handleDispense = async () => {
    if (!selectedMedication || !quantity) {
      Alert.alert('Error', 'Please select medication and enter quantity');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (qty > selectedMedication.quantity) {
      Alert.alert('Error', 'Not enough stock available');
      return;
    }

    try {
      // Update medication stock
      const newQuantity = selectedMedication.quantity - qty;
      await updateDoc(doc(db, 'medications', selectedMedication.id!), {
        quantity: newQuantity,
        updatedAt: new Date(),
      });

      // Record dispense
      await addDoc(collection(db, 'dispenses'), {
        medicationId: selectedMedication.id,
        medicationName: selectedMedication.name,
        patientId: patientId || 'walkin',
        patientName: patientId ? 'Patient' : 'Walk-in Customer',
        quantity: qty,
        price: selectedMedication.price,
        totalAmount: qty * selectedMedication.price,
        instructions: instructions,
        dispensedBy: user?.name,
        dispensedAt: new Date(),
        status: 'dispensed',
      });

      Alert.alert('Success', `Medication dispensed successfully!`);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error dispensing medication:', error);
      Alert.alert('Error', 'Failed to dispense medication');
    }
  };

  const resetForm = () => {
    setSelectedMedication(null);
    setQuantity('');
    setInstructions('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <div style={styles.modalContainer}>
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Dispense Medication</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#7F8C8D" />
            </TouchableOpacity>
          </view

          {loading ? (
            <div style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1E96A9" />
              <Text style={styles.loadingText}>Loading medications...</Text>
            </view
          ) : (
            <ScrollView style={styles.formContainer}>
              <Text style={styles.label}>Select Medication *</Text>
              <ScrollView style={styles.medicationList} nestedScrollEnabled>
                {medications.map(med => (
                  <TouchableOpacity
                    key={med.id}
                    style={[
                      styles.medicationItem,
                      selectedMedication?.id === med.id && styles.selectedMedication
                    ]}
                    onPress={() => setSelectedMedication(med)}
                  >
                    <Text style={styles.medicationName}>{med.name}</Text>
                    <Text style={styles.medicationDetails}>
                      {med.quantity} {med.measurementUnit} • ${med.price}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {selectedMedication && (
                <div style={styles.selectedInfo}>
                  <Text style={styles.selectedName}>{selectedMedication.name}</Text>
                  <Text style={styles.selectedStock}>
                    Available: {selectedMedication.quantity} {selectedMedication.measurementUnit}
                  </Text>
                </view
              )}

              <TextInput
                style={styles.input}
                placeholder="Quantity *"
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Instructions (optional)"
                value={instructions}
                onChangeText={setInstructions}
                multiline
                numberOfLines={3}
              />

              {selectedMedication && quantity && !isNaN(parseFloat(quantity)) && (
                <div style={styles.summary}>
                  <Text style={styles.summaryText}>
                    Total: {quantity} {selectedMedication.measurementUnit}
                  </Text>
                  <Text style={styles.summaryAmount}>
                    Amount: ${(parseFloat(quantity) * selectedMedication.price).toFixed(2)}
                  </Text>
                </view
              )}

              <div style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    onClose();
                    resetForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.dispenseButton}
                  onPress={handleDispense}
                  disabled={!selectedMedication || !quantity}
                >
                  <Ionicons name="medical" size={20} color="white" />
                  <Text style={styles.dispenseButtonText}>Dispense</Text>
                </TouchableOpacity>
              </view
            </ScrollView>
          )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
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
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#7F8C8D',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  medicationList: {
    maxHeight: 150,
    marginBottom: 16,
  },
  medicationItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  selectedMedication: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  medicationDetails: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  selectedInfo: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  selectedStock: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D5D8DC',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  summary: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '600',
  },
  summaryAmount: {
    fontSize: 18,
    color: '#27AE60',
    fontWeight: 'bold',
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ECF0F1',
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontWeight: '600',
    fontSize: 16,
  },
  dispenseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#3498DB',
    borderRadius: 10,
    gap: 8,
  },
  dispenseButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default DispenseMedicationModal;