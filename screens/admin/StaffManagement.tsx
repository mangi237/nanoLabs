import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const StaffManagement = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { lab } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      if (!lab?.id) return;
      
      const staffRef = collection(db, 'labs', lab.id, 'staff');
      const snapshot = await getDocs(staffRef);
      const staffList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStaff(staffList);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStaff();
    setRefreshing(false);
  };

  const handleDeleteStaff = (staffId: string) => {
    Alert.alert(
      t('confirm_delete'),
      t('delete_staff_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              if (!lab?.id) return;
              await deleteDoc(doc(db, 'labs', lab.id, 'staff', staffId));
              await fetchStaff();
            } catch (error) {
              console.error('Error deleting staff:', error);
            }
          }
        }
      ]
    );
  };

  const renderStaffItem = ({ item }: any) => (
    <View style={[styles.staffItem, { backgroundColor: colors.surface }]}>
      <View style={styles.staffInfo}>
        <Text style={styles.staffName}>{item.name}</Text>
        <Text style={styles.staffRoles}>
          {item.roles?.join(', ') || item.primaryRole || 'Staff'}
        </Text>
        <Text style={styles.staffCode}>🔑 {item.accessCode}</Text>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteStaff(item.id)}
      >
        <Ionicons name="trash" size={20} color="#F44336" />
      </TouchableOpacity>
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
      <FlatList
        data={staff}
        renderItem={renderStaffItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>{t('no_staff')}</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('AddStaffModal')}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>{t('add_staff')}</Text>
      </TouchableOpacity>
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  staffItem: {
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
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  staffRoles: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  staffCode: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  deleteButton: {
    padding: 8,
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
  addButton: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
});

export default StaffManagement;