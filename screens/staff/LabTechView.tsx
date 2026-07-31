import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const LabTechView = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { user, lab } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [result, setResult] = useState('');

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      if (!lab?.id) return;
      
      const patientsRef = collection(db, 'labs', lab.id, 'patients');
      const patientsSnapshot = await getDocs(patientsRef);
      
      let allTests: any[] = [];
      
      for (const patientDoc of patientsSnapshot.docs) {
        const testsRef = collection(db, 'labs', lab.id, 'patients', patientDoc.id, 'tests');
        const testsSnapshot = await getDocs(testsRef);
        const patientTests = testsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          patientId: patientDoc.id,
          patientName: patientDoc.data().name
        }));
        allTests = [...allTests, ...patientTests];
      }
      
      setTests(allTests);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTests();
    setRefreshing(false);
  };

  const handleProcessTest = (test: any) => {
    setSelectedTest(test);
    setShowResultModal(true);
  };

  const handleUploadResult = async () => {
    if (!result.trim()) {
      Alert.alert(t('error'), t('enter_result'));
      return;
    }

    try {
      if (!lab?.id || !selectedTest) return;
      
      const testRef = doc(db, 'labs', lab.id, 'patients', selectedTest.patientId, 'tests', selectedTest.id);
      await updateDoc(testRef, {
        status: 'completed',
        result: result,
        completedDate: new Date().toISOString(),
        completedBy: user?.id
      });
      
      setShowResultModal(false);
      setResult('');
      setSelectedTest(null);
      await fetchTests();
    } catch (error) {
      console.error('Error uploading result:', error);
    }
  };

  const pendingTests = tests.filter(t => t.status === 'collected');
  const completedTests = tests.filter(t => t.status === 'completed');

  const renderTestItem = ({ item }: any) => (
    <View style={[styles.testItem, { backgroundColor: colors.surface }]}>
      <View style={styles.testInfo}>
        <Text style={styles.patientName}>{item.patientName}</Text>
        <Text style={styles.testName}>{item.testName}</Text>
        <Text style={styles.testCategory}>{item.category}</Text>
      </View>
      <View style={styles.testRight}>
        <Text style={styles.testStatus}>{item.status}</Text>
        {item.status === 'collected' ? (
          <TouchableOpacity 
            style={styles.processButton}
            onPress={() => handleProcessTest(item)}
          >
            <Ionicons name="flask" size={20} color="white" />
            <Text style={styles.processButtonText}>{t('process')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-done" size={16} color="#4CAF50" />
            <Text style={styles.completedText}>{t('completed')}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.statNumber}>{pendingTests.length}</Text>
          <Text style={styles.statLabel}>{t('pending_processing')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.statNumber}>{completedTests.length}</Text>
          <Text style={styles.statLabel}>{t('completed')}</Text>
        </View>
      </View>

      <FlatList
        data={pendingTests}
        renderItem={renderTestItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="flask-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>{t('no_tests_to_process')}</Text>
          </View>
        }
      />

      <Modal visible={showResultModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={styles.modalTitle}>{t('enter_result')}</Text>
            {selectedTest && (
              <View style={styles.modalInfo}>
                <Text style={styles.modalPatient}>{selectedTest.patientName}</Text>
                <Text style={styles.modalTest}>{selectedTest.testName}</Text>
              </View>
            )}
            <TextInput
              style={[styles.resultInput, { backgroundColor: colors.background }]}
              placeholder={t('enter_test_result')}
              value={result}
              onChangeText={setResult}
              multiline
              numberOfLines={4}
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowResultModal(false);
                  setResult('');
                  setSelectedTest(null);
                }}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleUploadResult}
              >
                <Text style={styles.submitButtonText}>{t('upload_result')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A237E',
    fontFamily: 'Poppins-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  testItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  testInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  testName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  testCategory: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  testRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  testStatus: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  processButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completedText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontFamily: 'Poppins-Medium',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  modalInfo: {
    marginBottom: 16,
  },
  modalPatient: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  modalTest: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  resultInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: 'Poppins-Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default LabTechView;