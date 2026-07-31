// screens/patient/ShareResultsScreen.tsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Share, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

// ✅ Define the Test interface
interface TestData {
  id: string;
  testName: string;
  status: string;
  completedDate: string | null;
  result: string | null;
  patientName?: string;
  category?: string;
}

const ShareResultsScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { user, lab } = useAuth();
  const [tests, setTests] = useState<TestData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      if (!user?.id || !lab?.id) {
        setLoading(false);
        return;
      }
      
      const testsRef = collection(db, 'labs', lab.id, 'patients', user.id, 'tests');
      const snapshot = await getDocs(testsRef);
      
      // ✅ Properly map with type safety
      const testList = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            testName: data.testName || data.name || 'Unknown Test',
            status: data.status || 'requested',
            completedDate: data.completedDate || null,
            result: data.result || null,
            category: data.category || 'General'
          } as TestData;
        })
        .filter((t: TestData) => t.status === 'completed'); // ✅ status exists now
      
      setTests(testList);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (test: TestData) => {
    try {
      const message = `🧪 Test: ${test.testName}\n📊 Status: ${test.status}\n📅 Date: ${test.completedDate ? new Date(test.completedDate).toLocaleDateString() : 'N/A'}\n\n🔬 Results: ${test.result || 'N/A'}\n\n🏥 Lab: ${lab?.name || 'Lab'}`;
      
      await Share.share({
        message,
        title: `${test.testName} Results`,
      });
    } catch (error) {
      Alert.alert(t('error'), t('share_failed'));
    }
  };

  const renderTestItem = ({ item }: { item: TestData }) => (
    <TouchableOpacity 
      style={[styles.testItem, { backgroundColor: colors.surface }]}
      onPress={() => handleShare(item)}
    >
      <View style={styles.testInfo}>
        <Text style={styles.testName}>{item.testName}</Text>
        <Text style={styles.testStatus}>{item.status}</Text>
        <Text style={styles.testDate}>
          {item.completedDate ? new Date(item.completedDate).toLocaleDateString() : 'N/A'}
        </Text>
      </View>
      <Ionicons name="share-social" size={24} color={colors.primary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('loading')}...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.title}>📤 {t('share_results')}</Text>
        <Text style={styles.subtitle}>{t('share_results_with_others')}</Text>
      </View>

      {tests.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={50} color="#ccc" />
          <Text style={styles.emptyText}>{t('no_completed_tests')}</Text>
          <Text style={styles.emptySubtext}>{t('complete_tests_to_share')}</Text>
        </View>
      ) : (
        <FlatList
          data={tests}
          renderItem={renderTestItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default ShareResultsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  header: {
    padding: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A237E',
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  testStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
    textTransform: 'capitalize',
  },
  testDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
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
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
});