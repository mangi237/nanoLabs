import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const AnalyzerView = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { user, lab } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleCollectSample = async (test: any) => {
    try {
      if (!lab?.id) return;
      
      const testRef = doc(db, 'labs', lab.id, 'patients', test.patientId, 'tests', test.id);
      await updateDoc(testRef, {
        status: 'collected',
        collectedDate: new Date().toISOString(),
        collectedBy: user?.id
      });
      
      await fetchTests();
    } catch (error) {
      console.error('Error collecting sample:', error);
    }
  };

  const pendingTests = tests.filter(t => t.status === 'requested' || t.status === 'paid');
  const collectedTests = tests.filter(t => t.status === 'collected');

  const renderTestItem = ({ item }: any) => (
    <View style={[styles.testItem, { backgroundColor: colors.surface }]}>
      <View style={styles.testInfo}>
        <Text style={styles.patientName}>{item.patientName}</Text>
        <Text style={styles.testName}>{item.testName}</Text>
        <Text style={styles.testCategory}>{item.category}</Text>
      </View>
      <View style={styles.testRight}>
        <Text style={styles.testStatus}>{item.status}</Text>
        {item.status !== 'collected' ? (
          <TouchableOpacity 
            style={styles.collectButton}
            onPress={() => handleCollectSample(item)}
          >
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.collectButtonText}>{t('collect')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.collectedBadge}>
            <Ionicons name="checkmark-done" size={16} color="#4CAF50" />
            <Text style={styles.collectedText}>{t('collected')}</Text>
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
          <Text style={styles.statLabel}>{t('pending_collection')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.statNumber}>{collectedTests.length}</Text>
          <Text style={styles.statLabel}>{t('collected')}</Text>
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
            <Text style={styles.emptyText}>{t('no_pending_tests')}</Text>
          </View>
        }
      />
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
  collectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  collectButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  collectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  collectedText: {
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
});

export default AnalyzerView;