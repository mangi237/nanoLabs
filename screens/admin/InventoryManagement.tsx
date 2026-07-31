import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const InventoryManagement = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { lab } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    reorderLevel: '',
    supplier: ''
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      if (!lab?.id) return;
      
      const inventoryRef = collection(db, 'labs', lab.id, 'inventory');
      const snapshot = await getDocs(inventoryRef);
      const itemList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(itemList);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  };

  const handleSaveItem = async () => {
    if (!formData.name.trim() || !formData.quantity.trim()) {
      Alert.alert(t('error'), t('fill_required_fields'));
      return;
    }

    try {
      if (!lab?.id) return;
      
      const itemData = {
        ...formData,
        quantity: parseInt(formData.quantity) || 0,
        reorderLevel: parseInt(formData.reorderLevel) || 5,
        updatedAt: new Date().toISOString()
      };

      if (editingItem) {
        await updateDoc(doc(db, 'labs', lab.id, 'inventory', editingItem.id), itemData);
      } else {
        itemData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'labs', lab.id, 'inventory'), itemData);
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({ name: '', category: '', quantity: '', reorderLevel: '', supplier: '' });
      await fetchInventory();
    } catch (error) {
      console.error('Error saving inventory item:', error);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      t('confirm_delete'),
      t('delete_item_confirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              if (!lab?.id) return;
              await deleteDoc(doc(db, 'labs', lab.id, 'inventory', itemId));
              await fetchInventory();
            } catch (error) {
              console.error('Error deleting item:', error);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: any) => {
    const isLowStock = item.quantity <= item.reorderLevel;
    
    return (
      <View style={[styles.inventoryItem, { backgroundColor: colors.surface }]}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
          <Text style={styles.itemSupplier}>🏢 {item.supplier || 'N/A'}</Text>
        </View>
        <View style={styles.itemRight}>
          <View style={[styles.quantityBadge, { backgroundColor: isLowStock ? '#F44336' : '#4CAF50' }]}>
            <Text style={styles.quantityText}>{item.quantity}</Text>
          </View>
          <Text style={styles.reorderLevel}>Reorder: {item.reorderLevel}</Text>
          <View style={styles.itemActions}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => {
                setEditingItem(item);
                setFormData({
                  name: item.name,
                  category: item.category,
                  quantity: String(item.quantity),
                  reorderLevel: String(item.reorderLevel),
                  supplier: item.supplier || ''
                });
                setShowModal(true);
              }}
            >
              <Ionicons name="pencil" size={18} color="#2196F3" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteItem(item.id)}
            >
              <Ionicons name="trash" size={18} color="#F44336" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

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
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>{t('no_inventory_items')}</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => {
          setEditingItem(null);
          setFormData({ name: '', category: '', quantity: '', reorderLevel: '', supplier: '' });
          setShowModal(true);
        }}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>{t('add_item')}</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={styles.modalTitle}>
              {editingItem ? t('edit_item') : t('add_inventory_item')}
            </Text>
            
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background }]}
              placeholder={t('item_name')}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
            
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background }]}
              placeholder={t('category')}
              value={formData.category}
              onChangeText={(text) => setFormData({ ...formData, category: text })}
            />
            
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background }]}
              placeholder={t('quantity')}
              value={formData.quantity}
              onChangeText={(text) => setFormData({ ...formData, quantity: text })}
              keyboardType="numeric"
            />
            
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background }]}
              placeholder={t('reorder_level')}
              value={formData.reorderLevel}
              onChangeText={(text) => setFormData({ ...formData, reorderLevel: text })}
              keyboardType="numeric"
            />
            
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background }]}
              placeholder={t('supplier')}
              value={formData.supplier}
              onChangeText={(text) => setFormData({ ...formData, supplier: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowModal(false);
                  setEditingItem(null);
                  setFormData({ name: '', category: '', quantity: '', reorderLevel: '', supplier: '' });
                }}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveItem}
              >
                <Text style={styles.saveButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  inventoryItem: {
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
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  itemCategory: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  itemSupplier: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  quantityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quantityText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  reorderLevel: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    fontFamily: 'Poppins-Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default InventoryManagement;