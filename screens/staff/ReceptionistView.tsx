import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const ReceptionistView = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { user, lab } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      if (!lab?.id) return;
      
      const patientsRef = collection(db, 'labs', lab.id, 'patients');
      const snapshot = await getDocs(patientsRef);
      const patientList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPatients(patientList);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPatients();
    setRefreshing(false);
  };

  const handleConfirmPatient = async (patientId: string) => {
    try {
      if (!lab?.id) return;
      
      const patientRef = doc(db, 'labs', lab.id, 'patients', patientId);
      await updateDoc(patientRef, {
        status: 'active',
        confirmedAt: new Date().toISOString()
      });
      
      await fetchPatients();
    } catch (error) {
      console.error('Error confirming patient:', error);
    }
  };

  const pendingPatients = patients.filter(p => p.status === 'pending');
  const activePatients = patients.filter(p => p.status === 'active');

  const renderPatientItem = ({ item }: any) => (
    <View style={[styles.patientItem, { backgroundColor: colors.surface }]}>
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientDetails}>
          {item.age} years • {item.gender}
        </Text>
        <Text style={styles.patientPhone}>📞 {item.phone}</Text>
      </View>
      {item.status === 'pending' ? (
        <TouchableOpacity 
          style={styles.confirmButton}
          onPress={() => handleConfirmPatient(item.id)}
        >
          <Text style={styles.confirmButtonText}>{t('confirm')}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.activeBadge}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.activeText}>{t('active')}</Text>
        </View>
      )}
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
          <Text style={styles.statNumber}>{pendingPatients.length}</Text>
          <Text style={styles.statLabel}>{t('pending')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.statNumber}>{activePatients.length}</Text>
          <Text style={styles.statLabel}>{t('active')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.statNumber}>{patients.length}</Text>
          <Text style={styles.statLabel}>{t('total')}</Text>
        </View>
      </View>

      <FlatList
        data={patients}
        renderItem={renderPatientItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>{t('no_patients')}</Text>
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
  patientItem: {
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
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  patientDetails: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  patientPhone: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeText: {
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

export default ReceptionistView;