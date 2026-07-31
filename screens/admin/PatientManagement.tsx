import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

const PatientManagement = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { lab } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredPatients = patients.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patientId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone?.includes(searchQuery)
  );

  const renderPatientItem = ({ item }: any) => (
    <TouchableOpacity 
      style={[styles.patientItem, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('PatientDetails', { patientId: item.id })}
    >
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <Text style={styles.patientDetails}>
          {item.age} years • {item.gender}
        </Text>
        <Text style={styles.patientPhone}>📞 {item.phone || 'N/A'}</Text>
      </View>
      <View style={styles.patientStatus}>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#4CAF50' : '#FF9800' }]}>
          <Text style={styles.statusText}>{item.status || 'pending'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
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
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search_patients')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <FlatList
        data={filteredPatients}
        renderItem={renderPatientItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>{t('no_patients_found')}</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
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
  patientStatus: {
    alignItems: 'flex-end',
    gap: 4,
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
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontFamily: 'Poppins-Medium',
  },
});

export default PatientManagement;