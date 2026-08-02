import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const TestCatalogManagement = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { lab } = useAuth();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: ''
  });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      if (!lab?.id) return;
      
      const testsRef = collection(db, 'labs', lab.id, 'testCatalog');
      const snapshot = await getDocs(testsRef);
      const testList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTests(testList);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTests();
    setRefreshing(false);
  };

  const handleSaveTest = async () => {
    if (!formData.name.trim() || !formData.price.trim()) {
      Alert.alert(t('error'), t('fill_required_fields'));
      return;
    }

    try {
      if (!lab?.id) return;
      
      const testData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        createdAt: new Date().toISOString()
      };

      if (editingTest) {
        await updateDoc(doc(db, 'labs', lab.id, 'testCatalog', editingTest.id), testData);
      } else {
        await addDoc(collection(db, 'labs', lab.id, 'testCatalog'), testData);
      }

      setShowModal(false);
      setEditingTest(null);
      setFormData({ name: '', category: '', price: '', description: '' });
      await fetchTests();
    } catch (error) {
      console.error('Error saving test:', error);
    }
  };

 
 
const handleDeleteTest = async (testId: string, testName: string) => {
  Alert.alert(
    'Delete Test',
    `Are you sure you want to delete "${testName}"?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await deleteDoc(doc(db, 'labs', lab?.id, 'testCatalog', testId));
            await fetchTests();
            Alert.alert('✅ Success', 'Test deleted successfully');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete test');
          } finally {
            setLoading(false);
          }
        }
      }
    ]
  );
};
 

  const renderTestItem = ({ item }: any) => (
    <View style={[styles.testItem, { backgroundColor: colors.surface }]}>
      <View style={styles.testInfo}>
        <Text style={styles.testName}>{item.name}</Text>
        <Text style={styles.testCategory}>{item.category}</Text>
        <Text style={styles.testPrice}>${item.price?.toFixed(2) || '0.00'}</Text>
      </View>
      <View style={styles.testActions}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => {
            setEditingTest(item);
            setFormData({
              name: item.name,
              category: item.category,
              price: String(item.price),
              description: item.description || ''
            });
            setShowModal(true);
          }}
        >
          <Ionicons name="pencil" size={20} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteTest(item.id, item.name)}
        >
          <Ionicons name="trash" size={20} color="#F44336" />
        </TouchableOpacity>
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
      <FlatList
        data={tests}
        renderItem={renderTestItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="flask-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>{t('no_tests_in_catalog')}</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => {
          setEditingTest(null);
          setFormData({ name: '', category: '', price: '', description: '' });
          setShowModal(true);
        }}
      >
        <Ionicons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>{t('add_test')}</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={styles.modalTitle}>
              {editingTest ? t('edit_test') : t('add_new_test')}
            </Text>
            
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.background }]}
              placeholder={t('test_name')}
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
              placeholder={t('price')}
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="numeric"
            />
            
            <TextInput
              style={[styles.modalInput, styles.modalTextArea, { backgroundColor: colors.background }]}
              placeholder={t('description')}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowModal(false);
                  setEditingTest(null);
                  setFormData({ name: '', category: '', price: '', description: '' });
                }}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveTest}
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
  testItem: {
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
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  testCategory: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  testPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 2,
    fontFamily: 'Poppins-Bold',
  },
  testActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    padding: 8,
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
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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

export default TestCatalogManagement;