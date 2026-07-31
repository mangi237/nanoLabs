import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

const AdminDashboard = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { user, lab } = useAuth();
  const [stats, setStats] = useState({
    patients: 0,
    staff: 0,
    tests: 0,
    revenue: 0
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      if (!lab?.id) return;
      
      const patientsRef = collection(db, 'labs', lab.id, 'patients');
      const patientsSnapshot = await getDocs(patientsRef);
      
      const staffRef = collection(db, 'labs', lab.id, 'staff');
      const staffSnapshot = await getDocs(staffRef);
      
      let testCount = 0;
      for (const patientDoc of patientsSnapshot.docs) {
        const testsRef = collection(db, 'labs', lab.id, 'patients', patientDoc.id, 'tests');
        const testsSnapshot = await getDocs(testsRef);
        testCount += testsSnapshot.size;
      }
      
      setStats({
        patients: patientsSnapshot.size,
        staff: staffSnapshot.size,
        tests: testCount,
        revenue: testCount * 10 // Placeholder
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  const menuItems = [
    { id: 'patients', icon: 'people', label: t('patients'), color: '#2196F3', screen: 'PatientManagement' },
    { id: 'staff', icon: 'person-add', label: t('staff'), color: '#4CAF50', screen: 'StaffManagement' },
    { id: 'tests', icon: 'flask', label: t('test_catalog'), color: '#FF9800', screen: 'TestCatalogManagement' },
    { id: 'inventory', icon: 'cube', label: t('inventory'), color: '#9C27B0', screen: 'InventoryManagement' },
    { id: 'reports', icon: 'stats-chart', label: t('reports'), color: '#F44336', screen: 'ReportsScreen' },
  ];

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>👋 {t('admin_dashboard')}</Text>
        <Text style={styles.subtitle}>{lab?.name}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="people" size={28} color="#2196F3" />
          <Text style={styles.statNumber}>{stats.patients}</Text>
          <Text style={styles.statLabel}>{t('patients')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="person-add" size={28} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.staff}</Text>
          <Text style={styles.statLabel}>{t('staff')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="flask" size={28} color="#FF9800" />
          <Text style={styles.statNumber}>{stats.tests}</Text>
          <Text style={styles.statLabel}>{t('tests')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="cash" size={28} color="#4CAF50" />
          <Text style={styles.statNumber}>${stats.revenue}</Text>
          <Text style={styles.statLabel}>{t('revenue')}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{t('quick_actions')}</Text>
      <View style={styles.menuGrid}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.menuItem, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
              <Ionicons name={item.icon as any} size={28} color={item.color} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A237E',
    paddingHorizontal: 16,
    marginBottom: 16,
    fontFamily: 'Poppins-Bold',
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 30,
  },
  menuItem: {
    width: '30%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuLabel: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontFamily: 'Poppins-Medium',
  },
});

export default AdminDashboard;