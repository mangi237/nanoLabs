import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const CashierView = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { user, lab } = useAuth();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      if (!lab?.id) return;
      
      // Get all patients
      const patientsRef = collection(db, 'labs', lab.id, 'patients');
      const patientsSnapshot = await getDocs(patientsRef);
      
      let allBills: any[] = [];
      
      for (const patientDoc of patientsSnapshot.docs) {
        const billsRef = collection(db, 'labs', lab.id, 'patients', patientDoc.id, 'bills');
        const billsSnapshot = await getDocs(billsRef);
        const patientBills = billsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          patientId: patientDoc.id,
          patientName: patientDoc.data().name
        }));
        allBills = [...allBills, ...patientBills];
      }
      
      setBills(allBills);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBills();
    setRefreshing(false);
  };

  const handlePayment = async (bill: any) => {
    try {
      if (!lab?.id) return;
      
      const billRef = doc(db, 'labs', lab.id, 'patients', bill.patientId, 'bills', bill.id);
      await updateDoc(billRef, {
        status: 'paid',
        paidAt: new Date().toISOString(),
        paidBy: user?.id
      });
      
      await fetchBills();
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  const pendingBills = bills.filter(b => b.status === 'pending');
  const totalAmount = pendingBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);

  const renderBillItem = ({ item }: any) => (
    <View style={[styles.billItem, { backgroundColor: colors.surface }]}>
      <View style={styles.billInfo}>
        <Text style={styles.patientName}>{item.patientName}</Text>
        <Text style={styles.billDescription}>{item.description}</Text>
        <Text style={styles.billCategory}>{item.category}</Text>
      </View>
      <View style={styles.billRight}>
        <Text style={styles.billAmount}>${item.amount?.toFixed(2) || '0.00'}</Text>
        {item.status === 'pending' ? (
          <TouchableOpacity 
            style={styles.payButton}
            onPress={() => handlePayment(item)}
          >
            <Text style={styles.payButtonText}>{t('pay')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.paidBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.paidText}>{t('paid')}</Text>
          </View>
        )}
      </View>
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
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>{t('total_pending')}</Text>
        <Text style={styles.summaryAmount}>${totalAmount.toFixed(2)}</Text>
        <Text style={styles.summaryCount}>{pendingBills.length} {t('pending_bills')}</Text>
      </View>

      <FlatList
        data={bills}
        renderItem={renderBillItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cash-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>{t('no_bills')}</Text>
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
  summaryCard: {
    margin: 16,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A237E',
    marginVertical: 8,
    fontFamily: 'Poppins-Bold',
  },
  summaryCount: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  billItem: {
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
  billInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  billDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  billCategory: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  billRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  billAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A237E',
    fontFamily: 'Poppins-Bold',
  },
  payButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  payButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paidText: {
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

export default CashierView;