// screens/superAdmin/LabDetailsScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const LabDetailsScreen = ({ route, navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { labId } = route.params || {};
  const [lab, setLab] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!labId) {
      Alert.alert('Error', 'No lab ID provided');
      navigation.goBack();
      return;
    }
    fetchLabDetails();
  }, [labId]);

  const fetchLabDetails = async () => {
    try {
      setLoading(true);
      const labRef = doc(db, 'labs', labId);
      const labDoc = await getDoc(labRef);
      if (labDoc.exists()) {
        setLab({ id: labDoc.id, ...labDoc.data() });
      } else {
        Alert.alert('Error', 'Lab not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching lab:', error);
      Alert.alert('Error', 'Failed to load lab details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLabDetails();
    setRefreshing(false);
  };

  const handleDeleteLab = () => {
    Alert.alert(
      'Delete Lab',
      `Are you sure you want to delete "${lab?.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'labs', labId));
              Alert.alert('Success', 'Lab deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting lab:', error);
              Alert.alert('Error', 'Failed to delete lab');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading lab details...</Text>
      </View>
    );
  }

  if (!lab) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={60} color="#EF4444" />
        <Text style={styles.errorText}>Lab not found</Text>
        <TouchableOpacity 
          style={styles.goBackButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
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
      <View style={[styles.header, { backgroundColor: lab.primaryColor || colors.primary }]}>
        <Text style={styles.labName}>{lab.name}</Text>
        <Text style={styles.labLocation}>{lab.location || 'No location'}</Text>
        <View style={styles.labStatus}>
          <Text style={styles.statusText}>Active</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Lab Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>{lab.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Location</Text>
          <Text style={styles.infoValue}>{lab.location || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Address</Text>
          <Text style={styles.infoValue}>{lab.address || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Phone</Text>
          <Text style={styles.infoValue}>{lab.phone || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{lab.email || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.infoTitle}>Statistics</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{lab.patientCount || 0}</Text>
            <Text style={styles.statLabel}>Patients</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{lab.staffCount || 0}</Text>
            <Text style={styles.statLabel}>Staff</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{lab.subscription?.type || 'N/A'}</Text>
            <Text style={styles.statLabel}>Subscription</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => Alert.alert('Edit', 'Edit lab functionality coming soon')}
        >
          <Ionicons name="pencil" size={20} color="white" />
          <Text style={styles.actionButtonText}>Edit Lab</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDeleteLab}
        >
          <Ionicons name="trash" size={20} color="white" />
          <Text style={styles.actionButtonText}>Delete Lab</Text>
        </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    marginTop: 15,
    fontFamily: 'Poppins-Medium',
  },
  goBackButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#1A237E',
    borderRadius: 8,
  },
  goBackText: {
    color: 'white',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  header: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 30,
  },
  labName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Poppins-Bold',
  },
  labLocation: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  labStatus: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  infoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 12,
    fontFamily: 'Poppins-Bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A237E',
    fontFamily: 'Poppins-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 30,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
});

export default LabDetailsScreen;