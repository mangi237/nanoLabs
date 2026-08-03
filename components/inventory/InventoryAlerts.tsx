// components/inventory/InventoryAlerts.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/authContext';
import { useTheme } from '../../context/themeContext';

const InventoryAlerts = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { lab } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkInventory();
  }, []);

  const checkInventory = async () => {
    try {
      const inventoryRef = collection(db, 'labs', lab?.id, 'inventory');
      const snapshot = await getDocs(inventoryRef);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const lowStockItems = items.filter(
        item => item.quantity <= (item.reorderLevel || 5)
      );
      
      setAlerts(lowStockItems);
    } catch (error) {
      console.error('Error checking inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAlertItem = ({ item }: any) => (
    <div style={[styles.alertItem, { backgroundColor: colors.surface }]}>
      <div style={styles.alertIcon}>
        <Ionicons name="warning" size={24} color="#FF9800" />
      </view
      <div style={styles.alertInfo}>
        <Text style={styles.alertTitle}>{item.name}</Text>
        <Text style={styles.alertMessage}>
          Low stock: {item.quantity} remaining (Reorder at {item.reorderLevel || 5})
        </Text>
      </view
      <TouchableOpacity style={styles.reorderButton}>
        <Text style={styles.reorderText}>Reorder</Text>
      </TouchableOpacity>
    </view
  );

  return (
    <div style={[styles.container, { backgroundColor: colors.background }]}>
      <div style={styles.header}>
        <Text style={styles.title}>⚠️ Inventory Alerts</Text>
        <Text style={styles.subtitle}>{alerts.length} items need attention</Text>
      </view

      <FlatList
        data={alerts}
        renderItem={renderAlertItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <div style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={50} color="#4CAF50" />
            <Text style={styles.emptyText}>All items are well stocked</Text>
          </view
        }
      />
    </view
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A237E',
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  alertItem: {
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
  alertIcon: {
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  alertMessage: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  reorderButton: {
    backgroundColor: '#1A237E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reorderText: {
    color: 'white',
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
    color: '#4CAF50',
    marginTop: 10,
    fontFamily: 'Poppins-Medium',
  },
});

export default InventoryAlerts;