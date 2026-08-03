// components/lab/LabTestModal.tsx - CORRECTED
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
  ActivityIndicator,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LabTestModalProps {
  visible: boolean;
  onClose: () => void;
  hospitalId: string;
  // hospitalId: string;
  patientId: string;
    onTestRequested: () => void;
  patientName: string;
  doctorName: string;
  doctorId: string;
  onTestAdded: (testData: any) => Promise<void>;
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
}

// Predefined lab tests with categories and prices
const PREDEFINED_LAB_TESTS = [
  // Blood Tests
  { id: '1', name: 'Complete Blood Count (CBC)', category: 'blood', price: 25.00, samples: ['Blood Sample'], description: 'Measures different components of blood' },
  { id: '2', name: 'Blood Glucose Test', category: 'blood', price: 15.00, samples: ['Blood Sample'], description: 'Measures blood sugar levels' },
  { id: '3', name: 'Lipid Profile', category: 'blood', price: 30.00, samples: ['Blood Sample'], description: 'Cholesterol and triglyceride levels' },
  { id: '4', name: 'Liver Function Test', category: 'blood', price: 45.00, samples: ['Blood Sample'], description: 'Assesses liver health' },
  { id: '5', name: 'Kidney Function Test', category: 'blood', price: 40.00, samples: ['Blood Sample'], description: 'Measures kidney function' },
  { id: '6', name: 'Thyroid Function Test', category: 'blood', price: 35.00, samples: ['Blood Sample'], description: 'Thyroid hormone levels' },
  
  // Urine Tests
  { id: '7', name: 'Urinalysis', category: 'urine', price: 20.00, samples: ['Urine Sample'], description: 'General urine examination' },
  { id: '8', name: 'Urine Culture', category: 'urine', price: 35.00, samples: ['Urine Sample'], description: 'Detects bacterial infections' },
  { id: '9', name: 'Microalbumin Test', category: 'urine', price: 25.00, samples: ['Urine Sample'], description: 'Detects early kidney damage' },
  
  // Imaging Tests
  { id: '10', name: 'X-ray Chest', category: 'imaging', price: 50.00, samples: ['X-ray'], description: 'Chest radiography' },
  { id: '11', name: 'CT Scan Head', category: 'imaging', price: 200.00, samples: ['CT Scan'], description: 'Head CT imaging' },
  { id: '12', name: 'MRI Spine', category: 'imaging', price: 300.00, samples: ['MRI'], description: 'Spinal MRI imaging' },
  { id: '13', name: 'Ultrasound Abdomen', category: 'imaging', price: 80.00, samples: ['Ultrasound'], description: 'Abdominal ultrasound' },
  
  // Other Tests
  { id: '14', name: 'Stool Analysis', category: 'stool', price: 25.00, samples: ['Stool Sample'], description: 'Stool examination' },
  { id: '15', name: 'Sputum Culture', category: 'sputum', price: 40.00, samples: ['Sputum Sample'], description: 'Respiratory culture' },
  { id: '16', name: 'Pregnancy Test', category: 'urine', price: 10.00, samples: ['Urine Sample'], description: 'HCG detection' },
  { id: '17', name: 'HIV Test', category: 'blood', price: 20.00, samples: ['Blood Sample'], description: 'HIV screening' },
  { id: '18', name: 'Malaria Test', category: 'blood', price: 15.00, samples: ['Blood Sample'], description: 'Malaria parasite detection' },
];

const LabTestModal: React.FC<LabTestModalProps> = ({
  visible,
  onClose,
  patientId,
  patientName,
  hospitalId,
  doctorName,
  onTestAdded,
  currentUser,
  onTestRequested,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [customTest, setCustomTest] = useState({
    name: '',
    price: '',
    description: '',
    category: 'blood'
  });

  const categories = ['All', 'blood', 'urine', 'imaging', 'stool', 'sputum'];

  // Filter tests based on search and category
  const filteredTests = PREDEFINED_LAB_TESTS.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || test.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTestSelection = (testId: string) => {
    const newSelected = new Set(selectedTests);
    if (newSelected.has(testId)) {
      newSelected.delete(testId);
    } else {
      newSelected.add(testId);
    }
    setSelectedTests(newSelected);
  };

  const handleAddCustomTest = () => {
    if (!customTest.name || !customTest.price) {
      Alert.alert('Error', 'Please enter test name and price');
      return;
    }

    const price = parseFloat(customTest.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    // Add custom test to selected tests temporarily
    const customTestId = `custom-${Date.now()}`;
    const newSelected = new Set(selectedTests);
    newSelected.add(customTestId);
    setSelectedTests(newSelected);

    // Reset custom test form
    setCustomTest({
      name: '',
      price: '',
      description: '',
      category: 'blood'
    });
  };

  const handleSubmit = async () => {
    if (selectedTests.size === 0) {
      Alert.alert('Error', 'Please select at least one lab test');
      return;
    }

    setLoading(true);
    try {
      const selectedTestData = Array.from(selectedTests).map(testId => {
        if (testId.startsWith('custom-')) {
          return {
            name: customTest.name,
            description: customTest.description || 'Custom lab test',
            category: customTest.category,
            price: parseFloat(customTest.price),
            samples: getSamplesForCategory(customTest.category),
            status: 'requested',
            requestedBy: currentUser.id,
            requestedByName: currentUser.name,
            requestedDate: new Date(),
            patientId: patientId,
            patientName: patientName
          };
        }
        
        const predefinedTest = PREDEFINED_LAB_TESTS.find(t => t.id === testId);
        return {
          ...predefinedTest,
          status: 'requested',
          requestedBy: currentUser.id,
          requestedByName: currentUser.name,
          requestedDate: new Date(),
          patientId: patientId,
          patientName: patientName
        };
      });

      // Calculate total amount for billing
      const totalAmount = selectedTestData.reduce((sum, test) => sum + (test.price || 0), 0);

      // Prepare lab test data and bill data
      const requestData = {
        labTests: selectedTestData,
        bill: {
          category: 'laboratory' as const,
          description: `Lab Tests: ${selectedTestData.map(t => t.name).join(', ')}`,
          amount: totalAmount,
          status: 'pending' as const,
          createdBy: currentUser.id,
          createdByName: currentUser.name,
          createdAt: new Date(),
          patientId: patientId,
          patientName: patientName,
          relatedLabTestIds: selectedTestData.map(t => t.patientId || Date.now().toString())
        }
      };

      await onTestAdded(requestData);
      
      // Reset form
      setSelectedTests(new Set());
      setSearchQuery('');
      setSelectedCategory('All');
      setCustomTest({
        name: '',
        price: '',
        description: '',
        category: 'blood'
      });
      
    } catch (error) {
      console.error('Error in lab test modal:', error);
      Alert.alert('Error', 'Failed to add lab tests');
    } finally {
      setLoading(false);
    }
  };

  const getSamplesForCategory = (category: string) => {
    const samples: { [key: string]: string[] } = {
      blood: ['Blood Sample'],
      urine: ['Urine Sample'],
      imaging: ['X-ray', 'CT Scan', 'MRI'],
      stool: ['Stool Sample'],
      sputum: ['Sputum Sample']
    };
    return samples[category] || ['Sample'];
  };

  const calculateTotal = () => {
    let total = 0;
    selectedTests.forEach(testId => {
      if (testId.startsWith('custom-')) {
        total += parseFloat(customTest.price) || 0;
      } else {
        const test = PREDEFINED_LAB_TESTS.find(t => t.id === testId);
        total += test?.price || 0;
      }
    });
    return total;
  };

  const resetForm = () => {
    setSelectedTests(new Set());
    setSearchQuery('');
    setSelectedCategory('All');
    setCustomTest({
      name: '',
      price: '',
      description: '',
      category: 'blood'
    });
    onClose();
  };

  const renderTestItem = ({ item }: { item: typeof PREDEFINED_LAB_TESTS[0] }) => (
    <TouchableOpacity
      style={[
        styles.testItem,
        selectedTests.has(item.id) && styles.selectedTestItem
      ]}
      onPress={() => handleTestSelection(item.id)}
    >
      <div style={styles.testCheckbox}>
        {selectedTests.has(item.id) && (
          <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
        )}
      </view
      <div style={styles.testInfo}>
        <Text style={styles.testName}>{item.name}</Text>
        <Text style={styles.testDescription}>{item.description}</Text>
        <div style={styles.testDetails}>
          <div style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) }]}>
            <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
          </view
          <Text style={styles.testPrice}>${item.price.toFixed(2)}</Text>
        </view
        <Text style={styles.testSamples}>
          Samples: {item.samples.join(', ')}
        </Text>
      </view
    </TouchableOpacity>
  );

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      blood: '#E74C3C',
      urine: '#3498DB',
      imaging: '#9B59B6',
      stool: '#E67E22',
      sputum: '#1ABC9C'
    };
    return colors[category] || '#7F8C8D';
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
              <Text style={styles.modalTitle}>Request Lab Tests</Text>
              <Text style={styles.patientName}>For: {patientName}</Text>
            </view
            <TouchableOpacity onPress={resetForm} style={styles.closeButton}>
              <Ionicons name="close-circle" size={28} color="#7F8C8D" />
            </TouchableOpacity>
          </view

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* Search and Filter */}
            <div style={styles.searchSection}>
              <div style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#7F8C8D" />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search lab tests..."
                  placeholderTextColor="#BDC3C7"
                />
              </view
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      selectedCategory === category && styles.selectedCategoryButton
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      selectedCategory === category && styles.selectedCategoryButtonText
                    ]}>
                      {category.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </view

            {/* Selected Tests Summary */}
            {selectedTests.size > 0 && (
              <div style={styles.selectedSummary}>
                <Text style={styles.selectedTitle}>
                  Selected Tests: {selectedTests.size}
                </Text>
                <Text style={styles.selectedTotal}>
                  Total: ${calculateTotal().toFixed(2)}
                </Text>
              </view
            )}

            {/* Predefined Tests List */}
            <Text style={styles.sectionTitle}>Available Lab Tests</Text>
            <FlatList
              data={filteredTests}
              renderItem={renderTestItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              style={styles.testsList}
            />

            {/* Custom Test Form */}
            <Text style={styles.sectionTitle}>Add Custom Test</Text>
            <div style={styles.customTestForm}>
              <div style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  value={customTest.name}
                  onChangeText={(text) => setCustomTest(prev => ({ ...prev, name: text }))}
                  placeholder="Test Name *"
                  placeholderTextColor="#BDC3C7"
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={customTest.price}
                  onChangeText={(text) => setCustomTest(prev => ({ ...prev, price: text }))}
                  placeholder="Price *"
                  placeholderTextColor="#BDC3C7"
                  keyboardType="decimal-pad"
                />
              </view
              
              <TextInput
                style={[styles.input, styles.textArea]}
                value={customTest.description}
                onChangeText={(text) => setCustomTest(prev => ({ ...prev, description: text }))}
                placeholder="Description (optional)"
                placeholderTextColor="#BDC3C7"
                multiline
                numberOfLines={2}
              />
              
              <div style={styles.customTestActions}>
                <TouchableOpacity 
                  style={styles.addCustomButton}
                  onPress={handleAddCustomTest}
                >
                  <Ionicons name="add" size={20} color="white" />
                  <Text style={styles.addCustomButtonText}>Add Custom Test</Text>
                </TouchableOpacity>
              </view
            </view
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
              onPress={handleSubmit}
              disabled={loading || selectedTests.size === 0}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="flask" size={20} color="white" />
                  <Text style={styles.submitButtonText}>
                    Request {selectedTests.size} Test{selectedTests.size !== 1 ? 's' : ''}
                  </Text>
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
    maxHeight: '90%',
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
    maxHeight: 500,
  },
  searchSection: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#2C3E50',
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  selectedCategoryButton: {
    backgroundColor: '#1E96A9',
    borderColor: '#1E96A9',
  },
  categoryButtonText: {
    color: '#7F8C8D',
    fontWeight: '500',
    fontSize: 12,
  },
  selectedCategoryButtonText: {
    color: 'white',
  },
  selectedSummary: {
    backgroundColor: '#E8F5E8',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27AE60',
  },
  selectedTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  testsList: {
    marginBottom: 20,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  selectedTestItem: {
    borderColor: '#27AE60',
    backgroundColor: '#E8F5E8',
  },
  testCheckbox: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  testDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  testDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  testPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
  },
  testSamples: {
    fontSize: 12,
    color: '#7F8C8D',
    fontStyle: 'italic',
  },
  customTestForm: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D5D8DC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#2C3E50',
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  customTestActions: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498DB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addCustomButtonText: {
    color: 'white',
    fontWeight: '600',
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
    backgroundColor: '#9C27B0',
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

export default LabTestModal;