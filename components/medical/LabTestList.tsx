// components/medical/LabTestsList.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { LabTestConfig } from '../../types/LabTest';

interface LabTest { 
  id: string;
  testType: string;
  result: string;
  status: string;
  createdAt: any;
  values?: Record<string, any>;
  notes?: string;
  technicianName?: string;
}

interface LabTestsListProps {
  patientId: string;
  onAddTest?: () => void;
  userRole?: string;
}

const LabTestsList: React.FC<LabTestsListProps> = ({ patientId, onAddTest, userRole }) => {
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('LabTestsList - User role:', userRole);
  console.log('LabTestsList - onAddTest provided:', !!onAddTest);

  useEffect(() => {
    if (!patientId) {
      setError('No patient ID provided');
      setLoading(false);
      return;
    }

    console.log('Setting up lab tests listener for patient:', patientId);
    
    try {
      const q = query(
        collection(db, 'labTests'),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const tests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as LabTest[];
          
          console.log('Lab tests loaded:', tests.length);
          setLabTests(tests);
          setLoading(false);
          setError(null);
        },
        (error) => {
          console.error('Error fetching lab tests:', error);
          setError('Failed to load lab tests');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up lab tests listener:', error);
      setError('Error setting up lab tests listener');
      setLoading(false);
    }
  }, [patientId]);

  const renderTestItem = ({ item }: { item: LabTest }) => (
    <View style={styles.testItem}>
      <View style={styles.testInfo}>
        <Text style={styles.testName}>
          {LabTestConfig[item.testType as keyof typeof LabTestConfig]?.name || item.testType}
        </Text>
        <Text style={[
          styles.testResult, 
          { color: item.result === 'positive' ? '#E74C3C' : item.result === 'negative' ? '#27AE60' : '#F39C12' }
        ]}>
          Result: {item.result || 'Pending'}
        </Text>
        <Text style={styles.testStatus}>Status: {item.status}</Text>
        {item.technicianName && (
          <Text style={styles.technician}>By: {item.technicianName}</Text>
        )}
      </View>
      <View style={styles.testDate}>
        <Text style={styles.dateText}>
          {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : 'N/A'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2E86C1" />
        <Text style={styles.loadingText}>Loading lab tests...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={50} color="#E74C3C" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lab Tests</Text>
        {onAddTest && (
          <TouchableOpacity style={styles.addButton} onPress={onAddTest}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>Add Test</Text>
          </TouchableOpacity>
        )}
      </View>

      {labTests.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="flask-outline" size={50} color="#BDC3C7" />
          <Text style={styles.emptyStateText}>No lab tests found</Text>
          {onAddTest && (
            <TouchableOpacity style={styles.addFirstButton} onPress={onAddTest}>
              <Text style={styles.addFirstButtonText}>Add First Test</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={labTests}
          renderItem={renderTestItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    color: '#7F8C8D',
  },
  errorText: {
    marginTop: 10,
    color: '#E74C3C',
    textAlign: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8E44AD',
    padding: 8,
    borderRadius: 6,
    gap: 5,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
  },
  listContent: {
    padding: 15,
  },
  testItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 5,
  },
  testResult: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 3,
  },
  testStatus: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 3,
  },
  technician: {
    fontSize: 12,
    color: '#7F8C8D',
    fontStyle: 'italic',
  },
  testDate: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    flex: 1,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 10,
    textAlign: 'center',
  },
  addFirstButton: {
    marginTop: 20,
    backgroundColor: '#8E44AD',
    padding: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LabTestsList;