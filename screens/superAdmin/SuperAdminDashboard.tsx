import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

const SuperAdminDashboard = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalLabs: 0,
    totalPatients: 0,
    totalStaff: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const labsRef = collection(db, 'labs');
      const snapshot = await getDocs(labsRef);
      const labList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLabs(labList);
      
      let totalPatients = 0;
      let totalStaff = 0;
      
      for (const lab of labList) {
        const patientsRef = collection(db, 'labs', lab.id, 'patients');
        const patientsSnap = await getDocs(patientsRef);
        totalPatients += patientsSnap.size;
        
        const staffRef = collection(db, 'labs', lab.id, 'staff');
        const staffSnap = await getDocs(staffRef);
        totalStaff += staffSnap.size;
      }
      
      setStats({
        totalLabs: labList.length,
        totalPatients,
        totalStaff,
        totalRevenue: totalPatients * 10 // Placeholder
      });
    } catch (error) {
      console.error('Error fetching labs:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLabs();
    setRefreshing(false);
  };

  const renderLabItem = ({ item }: any) => (
    <TouchableOpacity 
      style={[styles.labItem, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('LabDetailsScreen', { labId: item.id })}
    >
      <View style={[styles.labColor, { backgroundColor: item.primaryColor || '#1A237E' }]} />
      <View style={styles.labInfo}>
        <Text style={styles.labName}>{item.name}</Text>
        <Text style={styles.labLocation}>{item.location}</Text>
        <Text style={styles.labStats}>
          👥 {item.patientCount || 0} patients • 👤 {item.staffCount || 0} staff
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>👑 {t('super_admin')}</Text>
        <Text style={styles.subtitle}>{t('manage_all_labs')}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="business" size={24} color="#2196F3" />
          <Text style={styles.statNumber}>{stats.totalLabs}</Text>
          <Text style={styles.statLabel}>{t('total_labs')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="people" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.totalPatients}</Text>
          <Text style={styles.statLabel}>{t('total_patients')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="person-add" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{stats.totalStaff}</Text>
          <Text style={styles.statLabel}>{t('total_staff')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="cash" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>${stats.totalRevenue}</Text>
          <Text style={styles.statLabel}>{t('total_revenue')}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('LabRegistrationModal')}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.createButtonText}>{t('create_new_lab')}</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>{t('all_labs')}</Text>
      <FlatList
        data={labs}
        renderItem={renderLabItem}
        keyExtractor={item => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>{t('no_labs_created')}</Text>
          </View>
        }
      />
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A237E',
    paddingHorizontal: 16,
    marginBottom: 12,
    fontFamily: 'Poppins-Bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  labItem: {
    flexDirection: 'row',
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
  labColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  labInfo: {
    flex: 1,
  },
  labName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  labLocation: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  labStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
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

export default SuperAdminDashboard;