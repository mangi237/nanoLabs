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
    fetchLabDetails();
  }, []);

  const fetchLabDetails = async () => {
    try {
      if (!labId) return;
      
      const labRef = doc(db, 'labs', labId);
      const labDoc = await getDoc(labRef);
      if (labDoc.exists()) {
        setLab({ id: labDoc.id, ...labDoc.data() });
      }
    } catch (error) {
      console.error('Error fetching lab details:', error);
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
      t('confirm_delete'),
      t('delete_lab_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'labs', labId));
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting lab:', error);
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
      </View>
    );
  }

  if (!lab) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={50} color="#F44336" />
        <Text style={styles.errorText}>{t('lab_not_found')}</Text>
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
        <Text style={styles.labLocation}>{lab.location}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{t('lab_information')}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('name')}</Text>
          <Text style={styles.infoValue}>{lab.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('location')}</Text>
          <Text style={styles.infoValue}>{lab.location}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('address')}</Text>
          <Text style={styles.infoValue}>{lab.address || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('phone')}</Text>
          <Text style={styles.infoValue}>{lab.phone || 'N/A'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('email')}</Text>
          <Text style={styles.infoValue}>{lab.email || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.infoTitle}>{t('statistics')}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{lab.patientCount || 0}</Text>
            <Text style={styles.statLabel}>{t('patients')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{lab.staffCount || 0}</Text>
            <Text style={styles.statLabel}>{t('staff')}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{lab.subscription?.type || 'N/A'}</Text>
            <Text style={styles.statLabel}>{t('subscription')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('LabEditModal', { lab })}
        >
          <Ionicons name="pencil" size={20} color="white" />
          <Text style={styles.actionButtonText}>{t('edit_lab')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDeleteLab}
        >
          <Ionicons name="trash" size={20} color="white" />
          <Text style={styles.actionButtonText}>{t('delete_lab')}</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginTop: 15,
    fontFamily: 'Poppins-Medium',
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
    backgroundColor: '#F44336',
  },
});

export default LabDetailsScreen;