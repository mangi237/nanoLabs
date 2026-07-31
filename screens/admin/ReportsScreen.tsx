// screens/admin/ReportsScreen.tsx - FULLY FIXED
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface TestData {
  id: string;
  status: string;
  testName: string;
  category: string;
  patientName: string;
  completedDate: string | null;
  requestedDate: string | null;
  result: string | null;
}

const ReportsScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { lab } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalTests: 0,
    completedTests: 0,
    pendingTests: 0,
    totalRevenue: 0,
    pendingRevenue: 0
  });
  const [recentTests, setRecentTests] = useState<TestData[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      if (!lab?.id) {
        setLoading(false);
        return;
      }
      
      const patientsRef = collection(db, 'labs', lab.id, 'patients');
      const patientsSnapshot = await getDocs(patientsRef);
      const patients = patientsSnapshot.docs;
      
      let totalTests = 0;
      let completedTests = 0;
      let pendingTests = 0;
      let totalRevenue = 0;
      let pendingRevenue = 0;
      let allTests: TestData[] = [];
      
      for (const patientDoc of patients) {
        const testsRef = collection(db, 'labs', lab.id, 'patients', patientDoc.id, 'tests');
        const testsSnapshot = await getDocs(testsRef);
        const patientTests = testsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            patientName: patientDoc.data().name || 'Unknown',
            status: data.status || 'requested',
            testName: data.testName || data.name || 'Unknown Test',
            category: data.category || 'General',
            completedDate: data.completedDate || null,
            requestedDate: data.requestedDate || null,
            result: data.result || null
          } as TestData;
        });
        
        totalTests += patientTests.length;
        const completed = patientTests.filter(t => t.status === 'completed');
        const pending = patientTests.filter(t => t.status !== 'completed');
        completedTests += completed.length;
        pendingTests += pending.length;
        
        // Revenue calculation (placeholder - $10 per test)
        totalRevenue += completed.length * 10;
        pendingRevenue += pending.length * 10;
        
        allTests = [...allTests, ...patientTests];
      }
      
      setStats({
        totalPatients: patients.length,
        totalTests,
        completedTests,
        pendingTests,
        totalRevenue,
        pendingRevenue
      });
      
      // Sort by date (most recent first)
      const sortedTests = allTests.sort((a, b) => {
        const dateA = a.requestedDate ? new Date(a.requestedDate).getTime() : 0;
        const dateB = b.requestedDate ? new Date(b.requestedDate).getTime() : 0;
        return dateB - dateA;
      });
      
      setRecentTests(sortedTests.slice(0, 10));
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('loading')}...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>📊 {t('reports')}</Text>
        <Text style={styles.subtitle}>{lab?.name || 'Lab'}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="people" size={24} color="#2196F3" />
          <Text style={styles.statNumber}>{stats.totalPatients}</Text>
          <Text style={styles.statLabel}>{t('total_patients')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="flask" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{stats.totalTests}</Text>
          <Text style={styles.statLabel}>{t('total_tests')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.completedTests}</Text>
          <Text style={styles.statLabel}>{t('completed')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="time" size={24} color="#F44336" />
          <Text style={styles.statNumber}>{stats.pendingTests}</Text>
          <Text style={styles.statLabel}>{t('pending')}</Text>
        </View>
      </View>

      <View style={styles.revenueCard}>
        <Text style={styles.revenueTitle}>{t('revenue_summary')}</Text>
        <View style={styles.revenueRow}>
          <View style={styles.revenueItem}>
            <Text style={styles.revenueLabel}>{t('total_revenue')}</Text>
            <Text style={[styles.revenueAmount, { color: '#4CAF50' }]}>${stats.totalRevenue}</Text>
          </View>
          <View style={styles.revenueItem}>
            <Text style={styles.revenueLabel}>{t('pending_revenue')}</Text>
            <Text style={[styles.revenueAmount, { color: '#FF9800' }]}>${stats.pendingRevenue}</Text>
          </View>
        </View>
      </View>

      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>{t('recent_activity')}</Text>
        {recentTests.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Ionicons name="flask-outline" size={40} color="#ccc" />
            <Text style={styles.emptyText}>{t('no_recent_activity')}</Text>
          </View>
        ) : (
          recentTests.map((test, index) => (
            <View key={index} style={[styles.activityItem, { backgroundColor: colors.surface }]}>
              <View style={styles.activityInfo}>
                <Text style={styles.activityName}>{test.testName}</Text>
                <Text style={styles.activityPatient}>{test.patientName}</Text>
              </View>
              <View style={[styles.activityStatus, { 
                backgroundColor: test.status === 'completed' ? '#4CAF50' : 
                              test.status === 'processing' ? '#FF9800' : 
                              test.status === 'collected' ? '#2196F3' : '#9E9E9E'
              }]}>
                <Text style={styles.activityStatusText}>{test.status}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
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
    fontSize: 28,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A237E',
    marginVertical: 4,
    fontFamily: 'Poppins-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  revenueCard: {
    margin: 16,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  revenueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A237E',
    marginBottom: 16,
    fontFamily: 'Poppins-SemiBold',
  },
  revenueRow: {
    flexDirection: 'row',
    gap: 20,
  },
  revenueItem: {
    flex: 1,
  },
  revenueLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  revenueAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
    fontFamily: 'Poppins-Bold',
  },
  recentSection: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 12,
    fontFamily: 'Poppins-Bold',
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  activityPatient: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  activityStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  emptyState: {
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
  },
});

export default ReportsScreen;