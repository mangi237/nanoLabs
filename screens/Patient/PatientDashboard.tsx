import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

const PatientDashboard = ({ navigation }: any) => {
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTests();
    setRefreshing(false);
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

  const getStatusEmoji = (status: string) => {
    switch(status) {
      case 'completed': return '✅';
      case 'processing': return '⏳';
      case 'collected': return '🧪';
      case 'requested': return '📋';
      default: return '📋';
    }
  };

  const stats = {
    total: tests.length,
    pending: tests.filter(t => t.status === 'requested' || t.status === 'collected').length,
    processing: tests.filter(t => t.status === 'processing').length,
    completed: tests.filter(t => t.status === 'completed').length,
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('loading')}</Text>
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
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View>
          <Text style={styles.greeting}>👋 {t('welcome')},</Text>
          <Text style={styles.userName}>{user?.name || 'Patient'}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => navigation.navigate('NotificationsScreen')}
          >
            <Ionicons name="notifications" size={24} color="white" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>.</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
  onPress={() => navigation.navigate('ProfileScreen')}
  style={styles.profileButton}
>
  <Ionicons name="person-circle" size={40} color="white" />
</TouchableOpacity>
        </View>
      </View>

      {/* Lab Info */}
      <View style={styles.labCard}>
        <Text style={styles.labName}>🧪 {lab?.name || 'Lab'}</Text>
        <Text style={styles.labLocation}>{lab?.location || 'Location'}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>{t('total_tests')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statNumber, { color: '#FF9800' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>{t('pending')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statNumber, { color: '#2196F3' }]}>{stats.processing}</Text>
          <Text style={styles.statLabel}>{t('processing')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>{t('completed')}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>{t('quick_actions')}</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={[styles.actionItem, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('TestHistoryScreen')}
          >
            <Ionicons name="clipboard" size={30} color={colors.primary} />
            <Text style={styles.actionText}>{t('my_tests')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionItem, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('TransferScreen')}
          >
            <Ionicons name="swap-horizontal" size={30} color={colors.primary} />
            <Text style={styles.actionText}>{t('transfer')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionItem, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('ShareResultsScreen')}
          >
            <Ionicons name="share-social" size={30} color={colors.primary} />
            <Text style={styles.actionText}>{t('share')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionItem, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('ProfileScreen')}
          >
            <Ionicons name="settings" size={30} color={colors.primary} />
            <Text style={styles.actionText}>{t('profile')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Tests */}
      <View style={styles.recentTests}>
        <Text style={styles.sectionTitle}>{t('recent_tests')}</Text>
        {tests.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Ionicons name="flask-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>{t('no_tests_yet')}</Text>
            <Text style={styles.emptySubtext}>{t('visit_lab_for_tests')}</Text>
          </View>
        ) : (
          tests.slice(0, 5).map((test) => (
            <TouchableOpacity 
              key={test.id} 
              style={[styles.testItem, { backgroundColor: colors.surface }]}
              onPress={() => navigation.navigate('ResultViewScreen', { testId: test.id })}
            >
              <View style={styles.testLeft}>
                <Text style={styles.testName}>{test.testName}</Text>
                <Text style={styles.testDate}>
                  {test.requestedDate ? new Date(test.requestedDate).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
              <View style={styles.testRight}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(test.status) }]}>
                  <Text style={styles.statusText}>
                    {getStatusEmoji(test.status)} {test.status}
                  </Text>
                </View>
                {test.status === 'completed' && (
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
        {tests.length > 5 && (
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('TestHistoryScreen')}
          >
            <Text style={styles.viewAllText}>{t('view_all')} →</Text>
          </TouchableOpacity>
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
    paddingTop: 50,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  userName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F44336',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  labCard: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  labName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A237E',
    fontFamily: 'Poppins-Bold',
  },
  labLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A237E',
    fontFamily: 'Poppins-Bold',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  quickActions: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 12,
    fontFamily: 'Poppins-Bold',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionItem: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    marginTop: 6,
    fontFamily: 'Poppins-Medium',
  },
  recentTests: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  testItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  testLeft: {
    flex: 1,
  },
  testName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  testDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  testRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  emptyState: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    fontFamily: 'Poppins-Medium',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  viewAllButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllText: {
    color: '#1A237E',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default PatientDashboard;