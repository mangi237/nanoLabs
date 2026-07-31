import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

const TestHistoryScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { user, lab } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      if (!user?.id || !lab?.id) return;
      
      const testsRef = collection(db, 'labs', lab.id, 'patients', user.id, 'tests');
      const snapshot = await getDocs(testsRef);
      const testList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTests(testList);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return '#4CAF50';
      case 'processing': return '#FF9800';
      case 'collected': return '#2196F3';
      case 'requested': return '#9E9E9E';
      default: return '#9E9E9E';
    }
  };

  const renderTestItem = ({ item }: any) => (
    <TouchableOpacity 
      style={[styles.testItem, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('ResultViewScreen', { testId: item.id })}
    >
      <View style={styles.testInfo}>
        <Text style={styles.testName}>{item.testName}</Text>
        <Text style={styles.testCategory}>{item.category}</Text>
        <Text style={styles.testDate}>
          {item.requestedDate ? new Date(item.requestedDate).toLocaleDateString() : 'N/A'}
        </Text>
      </View>
      <View style={styles.testStatus}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status || 'requested'}</Text>
        </View>
        {item.status === 'completed' && (
          <Ionicons name="chevron-forward" size={20} color="#999" />
        )}
      </View>
    </TouchableOpacity>
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
      <FlatList
        data={tests}
        renderItem={renderTestItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="flask-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>{t('no_tests_found')}</Text>
            <Text style={styles.emptySubtext}>{t('no_tests_history')}</Text>
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
  listContent: {
    padding: 16,
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
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  testCategory: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  testDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  testStatus: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 15,
    fontFamily: 'Poppins-Medium',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    fontFamily: 'Poppins-Regular',
  },
});

export default TestHistoryScreen;