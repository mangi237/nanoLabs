// screens/superAdmin/SuperAdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
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
      setLoading(true);
      const labsRef = collection(db, 'labs');
      const snapshot = await getDocs(labsRef);
      const labList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setLabs(labList);
      
      let totalPatients = 0;
      let totalStaff = 0;
      
      for (const lab of labList) {
        try {
          const patientsRef = collection(db, 'labs', lab.id, 'patients');
          const patientsSnap = await getDocs(patientsRef);
          totalPatients += patientsSnap.size;
        } catch (e) {}
        
        try {
          const staffRef = collection(db, 'labs', lab.id, 'staff');
          const staffSnap = await getDocs(staffRef);
          totalStaff += staffSnap.size;
        } catch (e) {}
      }
      
      setStats({
        totalLabs: labList.length,
        totalPatients,
        totalStaff,
        totalRevenue: totalPatients * 1000 // 1000 FCFA per patient
      });
    } catch (error) {
      console.error('Error fetching labs:', error);
      Alert.alert('Error', 'Failed to load labs');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLabs();
    setRefreshing(false);
  };

  const handleDeleteLab = (labId: string, labName: string) => {
    Alert.alert(
      'Delete Lab',
      `Are you sure you want to delete "${labName}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'labs', labId));
              Alert.alert('Success', 'Lab deleted successfully');
              fetchLabs();
            } catch (error) {
              console.error('Error deleting lab:', error);
              Alert.alert('Error', 'Failed to delete lab');
            }
          }
        }
      ]
    );
  };

  const handleCreateLab = () => {
    navigation.navigate('LabRegistrationModal');
  };

  const handleLabPress = (lab: any) => {
    navigation.navigate('LabDetailsScreen', { labId: lab.id });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading labs...</Text>
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
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>👑 Super Admin</Text>
        <Text style={styles.subtitle}>Manage all labs</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="business" size={24} color="#2196F3" />
          <Text style={styles.statNumber}>{stats.totalLabs}</Text>
          <Text style={styles.statLabel}>Total Labs</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="people" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.totalPatients}</Text>
          <Text style={styles.statLabel}>Total Patients</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="person-add" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{stats.totalStaff}</Text>
          <Text style={styles.statLabel}>Total Staff</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="cash" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.totalRevenue.toLocaleString()} FCFA</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={handleCreateLab}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.createButtonText}>Create New Lab</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>All Labs</Text>
      
      {labs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>No Labs Created</Text>
          <Text style={styles.emptySubtext}>Click "Create New Lab" to get started</Text>
        </View>
      ) : (
        labs.map((lab) => (
          <TouchableOpacity
            key={lab.id}
            style={[styles.labItem, { backgroundColor: colors.surface }]}
            onPress={() => handleLabPress(lab)}
            activeOpacity={0.7}
          >
            <View style={[styles.labColor, { backgroundColor: lab.primaryColor || '#1A237E' }]} />
            <View style={styles.labInfo}>
              <Text style={styles.labName}>{lab.name}</Text>
              <Text style={styles.labLocation}>
                <Ionicons name="location" size={12} color="#666" /> {lab.location || 'No location'}
              </Text>
              <Text style={styles.labStats}>
                👥 {lab.patientCount || 0} patients • 👤 {lab.staffCount || 0} staff
              </Text>
            </View>
            <View style={styles.labActions}>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
          </TouchableOpacity>
        ))
      )}
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
    marginHorizontal: 16,
    marginBottom: 20,
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
  labItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderRadius: 12,
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
  labActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    fontFamily: 'Poppins-Bold',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontFamily: 'Poppins-Regular',
  },
});

export default SuperAdminDashboard;