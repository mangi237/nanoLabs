// components/pharmacy/PharmacyDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  TextInput, 
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/authContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Pressable } from 'react-native';

const { width } = Dimensions.get('window');

// Product Categories
const PRODUCT_CATEGORIES = [
  { id: 'tablets', name: 'Tablets/Capsules', icon: 'medical' },
  { id: 'syrups', name: 'Syrups/Liquids', icon: 'water' },
  { id: 'injections', name: 'Injections', icon: 'syringe' },
  { id: 'drips', name: 'IV Fluids/Drips', icon: 'fitness' },
  { id: 'ointments', name: 'Ointments/Creams', icon: 'bandage' },
  { id: 'equipment', name: 'Equipment', icon: 'hardware-chip' },
  { id: 'supplies', name: 'Supplies', icon: 'cube' },
  { id: 'machines', name: 'Machines', icon: 'construct' },
  { id: 'other', name: 'Other', icon: 'apps' },
];

// Measurement units by category
const MEASUREMENT_UNITS: Record<string, string[]> = {
  'tablets': ['Tablets', 'Capsules', 'Pills', 'Strips', 'Bottles'],
  'syrups': ['ml', 'L', 'Bottles', 'Sachets'],
  'injections': ['Ampoules', 'Vials', 'Syringes', 'Cartridges'],
  'drips': ['ml', 'L', 'Bags', 'Bottles'],
  'ointments': ['g', 'mg', 'Tubes', 'Jars'],
  'equipment': ['Pieces', 'Sets', 'Kits'],
  'supplies': ['Pieces', 'Boxes', 'Rolls', 'Packs'],
  'machines': ['Units', 'Sets'],
  'other': ['Units', 'Pieces', 'Boxes'],
};

interface Product {
  id?: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  
  // Stock Structure
  stockType: 'pack' | 'unit';
  totalQuantity: number; // Total packs or units
  
  // For pack-based items
  itemsPerPack?: number; // How many items in one pack
  retailable: boolean; // Can it be sold as single items?
  
  // Pricing
  pricePerPack?: number; // Price for entire pack
  pricePerUnit?: number; // Price for single item
  
  // For unit-based items (no pack structure)
  pricePerItem?: number; // Price per unit for unit-based items
  
  // Common
  measurementUnit: string;
  expiryDate: Date;
  supplier: string;
  batchNumber: string;
  reorderLevel: number;
  createdAt: Date;
  updatedAt: Date;
  hospitalId: string;
  addedBy: string;
  accessCode?: string;
  status: 'active' | 'out_of_stock' | 'expired';
}

interface Sale {
  id?: string;
  productId: string;
  productName: string;
  saleType: 'pack' | 'unit';
  quantity: number; // Number of packs or units sold
  totalAmount: number;
  soldBy: string;
  soldAt: Date;
  customerName?: string;
  customerType: 'patient' | 'staff' | 'walkin';
}

const PharmacyDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Add product flow
  const [addFlowStep, setAddFlowStep] = useState<'newOrRestock' | 'basicInfo' | 'stockStructure' | 'pricing' | 'finalize'>('newOrRestock');
  const [isNewProduct, setIsNewProduct] = useState(true);
  const [selectedExistingProduct, setSelectedExistingProduct] = useState<Product | null>(null);
  const [restockQuantity, setRestockQuantity] = useState('');

  // Add product form
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    category: 'tablets',
    brand: '',
    stockType: 'pack',
    totalQuantity: 0,
    itemsPerPack: 1,
    retailable: false,
    pricePerPack: 0,
    pricePerUnit: 0,
    pricePerItem: 0,
    measurementUnit: 'Tablets',
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    supplier: '',
    batchNumber: '',
    reorderLevel: 10,
    status: 'active',
  });
  const [accessCode, setAccessCode] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Sale form
  const [saleQuantity, setSaleQuantity] = useState('');
  const [saleType, setSaleType] = useState<'pack' | 'unit'>('pack');
  const [customerName, setCustomerName] = useState('');
  const [customerType, setCustomerType] = useState<'patient' | 'staff' | 'walkin'>('walkin');

  const { user } = useAuth();

  useEffect(() => {
    if (!user?.hospitalId) return;

    const productsQuery = query(
      collection(db, 'hospitals', user.hospitalId, 'pharmacyProducts'),
      orderBy('createdAt', 'desc')
    );
    
    const productsUnsubscribe = onSnapshot(productsQuery, (snapshot) => {
      const productData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          expiryDate: data.expiryDate?.toDate ? data.expiryDate.toDate() : new Date(data.expiryDate),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as Product;
      });
      setProducts(productData);
      setFilteredProducts(productData);
      setLoading(false);
    });

    const salesQuery = query(
      collection(db, 'hospitals', user.hospitalId, 'pharmacySales'),
      orderBy('soldAt', 'desc')
    );
    const salesUnsubscribe = onSnapshot(salesQuery, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Sale[];
      setSales(salesData);
    });

    return () => {
      productsUnsubscribe();
      salesUnsubscribe();
    };
  }, [user?.hospitalId]);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedCategory, products]);

  const filterProducts = () => {
    let filtered = products;

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.batchNumber?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const getExpiryStatus = (expiryDate: Date): { color: string, label: string, daysLeft: number } => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { color: '#DC2626', label: 'EXPIRED', daysLeft };
    if (daysLeft <= 30) return { color: '#EA580C', label: `${daysLeft}d left`, daysLeft };
    if (daysLeft <= 90) return { color: '#F59E0B', label: `${daysLeft}d left`, daysLeft };
    return { color: '#16A34A', label: 'Valid', daysLeft };
  };

  const getStockStatus = (quantity: number, reorderLevel: number): { color: string, label: string } => {
    if (quantity === 0) return { color: '#DC2626', label: 'Out of Stock' };
    if (quantity <= reorderLevel) return { color: '#EA580C', label: 'Low Stock' };
    if (quantity > reorderLevel * 3) return { color: '#16A34A', label: 'In Stock' };
    return { color: '#F59E0B', label: 'Moderate' };
  };

  const calculateTotalItems = (product: Product): number => {
    if (product.stockType === 'pack') {
      return product.totalQuantity * (product.itemsPerPack || 1);
    }
    return product.totalQuantity;
  };

  const calculateTotalValue = (product: Product): number => {
    if (product.stockType === 'pack') {
      if (product.retailable && product.pricePerUnit) {
        return calculateTotalItems(product) * product.pricePerUnit;
      }
      return product.totalQuantity * (product.pricePerPack || 0);
    }
    return product.totalQuantity * (product.pricePerItem || 0);
  };
const handleAddNewProduct = async () => {
  if (!user?.hospitalId) {
    Alert.alert('Error', 'No hospital selected');
    return;
  }

  // Validation
  if (!newProduct.name || !newProduct.totalQuantity || !newProduct.category) {
    Alert.alert('Error', 'Please fill all required fields');
    return;
  }

  if (newProduct.stockType === 'pack') {
    if (!newProduct.itemsPerPack) {
      Alert.alert('Error', 'Please enter items per pack');
      return;
    }
    if (!newProduct.pricePerPack && !(newProduct.retailable && newProduct.pricePerUnit)) {
      Alert.alert('Error', 'Please enter price information');
      return;
    }
  } else {
    if (!newProduct.pricePerItem) {
      Alert.alert('Error', 'Please enter price per item');
      return;
    }
  }

  if (!accessCode) {
    Alert.alert('Error', 'Please enter your access code');
    return;
  }

  try {
    // Prepare product data with safe defaults - NO undefined values
    const productData: any = {
      name: newProduct.name || '',
      description: newProduct.description || '',
      category: newProduct.category || 'tablets',
      brand: newProduct.brand || '',
      stockType: newProduct.stockType || 'pack',
      totalQuantity: Number(newProduct.totalQuantity) || 0,
      itemsPerPack: newProduct.stockType === 'pack' ? (Number(newProduct.itemsPerPack) || 1) : null,
      retailable: Boolean(newProduct.retailable),
      measurementUnit: newProduct.measurementUnit || 'Tablets',
      expiryDate: Timestamp.fromDate(newProduct.expiryDate ? new Date(newProduct.expiryDate) : new Date()),
      supplier: newProduct.supplier || '',
      batchNumber: newProduct.batchNumber || '',
      reorderLevel: Number(newProduct.reorderLevel) || 10,
      hospitalId: user.hospitalId,
      addedBy: user.name || 'Unknown',
      accessCode: accessCode,
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Handle pricing based on stock type - ensure no undefined values
    if (newProduct.stockType === 'pack') {
      // Pack-based items
      productData.pricePerPack = Number(newProduct.pricePerPack) || 0;
      
      if (newProduct.retailable) {
        // Retailable pack items (can sell individual units)
        productData.pricePerUnit = Number(newProduct.pricePerUnit) || 0;
        productData.pricePerItem = null; // Not used for pack-based items
      } else {
        // Non-retailable pack items (sell only by pack)
        productData.pricePerUnit = 0; // Set to 0 instead of undefined
        productData.pricePerItem = null;
      }
    } else {
      // Unit-based items (no pack structure)
      productData.pricePerItem = Number(newProduct.pricePerItem) || 0;
      productData.pricePerPack = null;
      productData.pricePerUnit = null;
      productData.itemsPerPack = null;
      productData.retailable = false; // Unit-based items are always retailable by definition
    }

    console.log('Adding product with data:', JSON.stringify(productData, null, 2));

    await addDoc(
      collection(db, 'hospitals', user.hospitalId, 'pharmacyProducts'),
      productData
    );

    Alert.alert('Success', 'Product added successfully!');
    resetAddFlow();
  } catch (error: any) {
    console.error('Error adding product:', error);
    console.error('Error details:', error.message, error.code);
    Alert.alert('Error', `Failed to add product: ${error.message}`);
  }
};
  const handleRestockProduct = async () => {
    if (!selectedExistingProduct || !restockQuantity || !user?.hospitalId) {
      Alert.alert('Error', 'Please select a product and enter quantity');
      return;
    }

    const quantity = parseInt(restockQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (!accessCode) {
      Alert.alert('Error', 'Please enter your access code');
      return;
    }

    try {
      const newQuantity = selectedExistingProduct.totalQuantity + quantity;
      await updateDoc(
        doc(db, 'hospitals', user.hospitalId, 'pharmacyProducts', selectedExistingProduct.id!),
        {
          totalQuantity: newQuantity,
          status: newQuantity === 0 ? 'out_of_stock' : 'active',
          updatedAt: Timestamp.now(),
        }
      );

      Alert.alert('Success', `Restocked ${quantity} items successfully!`);
      resetAddFlow();
    } catch (error) {
      console.error('Error restocking product:', error);
      Alert.alert('Error', 'Failed to restock product');
    }
  };

  const handleSellProduct = async () => {
    if (!selectedProduct || !user?.hospitalId) return;

    const quantity = parseFloat(saleQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    let quantityToDeduct = 0;
    let totalAmount = 0;

    // Calculate based on sale type
    if (selectedProduct.stockType === 'pack') {
      if (saleType === 'pack') {
        // Selling by pack
        if (quantity > selectedProduct.totalQuantity) {
          Alert.alert('Error', 'Not enough packs in stock');
          return;
        }
        quantityToDeduct = quantity;
        totalAmount = quantity * (selectedProduct.pricePerPack || 0);
      } else {
        // Selling by unit (retailable items only)
        if (!selectedProduct.retailable) {
          Alert.alert('Error', 'This product cannot be sold by unit');
          return;
        }
        const totalUnits = quantity;
        const unitsAvailable = calculateTotalItems(selectedProduct);
        if (totalUnits > unitsAvailable) {
          Alert.alert('Error', 'Not enough units in stock');
          return;
        }
        quantityToDeduct = Math.ceil(totalUnits / (selectedProduct.itemsPerPack || 1));
        totalAmount = totalUnits * (selectedProduct.pricePerUnit || 0);
      }
    } else {
      // Unit-based items
      if (quantity > selectedProduct.totalQuantity) {
        Alert.alert('Error', 'Not enough items in stock');
        return;
      }
      quantityToDeduct = quantity;
      totalAmount = quantity * (selectedProduct.pricePerItem || 0);
    }

    try {
      // Update product quantity
      const newQuantity = selectedProduct.totalQuantity - quantityToDeduct;
      await updateDoc(
        doc(db, 'hospitals', user.hospitalId, 'pharmacyProducts', selectedProduct.id!),
        {
          totalQuantity: newQuantity,
          status: newQuantity === 0 ? 'out_of_stock' : 'active',
          updatedAt: Timestamp.now(),
        }
      );

      // Record sale
      const saleData: Sale = {
        productId: selectedProduct.id!,
        productName: selectedProduct.name,
        saleType: saleType,
        quantity: quantity,
        totalAmount: totalAmount,
        soldBy: user.name || 'Unknown',
        soldAt: new Date(),
        customerName: customerName || undefined,
        customerType: customerType,
      };

      await addDoc(
        collection(db, 'hospitals', user.hospitalId, 'pharmacySales'),
        saleData
      );

      Alert.alert('Success', `Sale recorded! Total: ₦${totalAmount.toFixed(2)}`);
      setShowSaleModal(false);
      resetSaleForm();
    } catch (error) {
      console.error('Error recording sale:', error);
      Alert.alert('Error', 'Failed to record sale');
    }
  };

  const resetAddFlow = () => {
    setShowAddModal(false);
    setAddFlowStep('newOrRestock');
    setIsNewProduct(true);
    setSelectedExistingProduct(null);
    setRestockQuantity('');
    setNewProduct({
      name: '',
      description: '',
      category: 'tablets',
      brand: '',
      stockType: 'pack',
      totalQuantity: 0,
      itemsPerPack: 1,
      retailable: false,
      pricePerPack: 0,
      pricePerUnit: 0,
      pricePerItem: 0,
      measurementUnit: 'Tablets',
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      supplier: '',
      batchNumber: '',
      reorderLevel: 10,
      status: 'active',
    });
    setAccessCode('');
  };

  const resetSaleForm = () => {
    setSelectedProduct(null);
    setSaleQuantity('');
    setSaleType('pack');
    setCustomerName('');
    setCustomerType('walkin');
  };

  const renderAddProductModal = () => {
    switch (addFlowStep) {
      case 'newOrRestock':
        return (
          <div style={styles.flowStep}>
            <Text style={styles.flowTitle}>Add or Restock Product</Text>
            <Text style={styles.flowSubtitle}>Do you want to add a new product or restock an existing one?</Text>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => {
                setIsNewProduct(true);
                setAddFlowStep('basicInfo');
              }}
            >
              <Ionicons name="add-circle" size={32} color="#4F46E5" />
              <div style={styles.optionContent}>
                <Text style={styles.optionTitle}>Add New Product</Text>
                <Text style={styles.optionDesc}>Add a completely new item to inventory</Text>
              </view
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => {
                setIsNewProduct(false);
                setAddFlowStep('basicInfo');
              }}
            >
              <Ionicons name="refresh" size={32} color="#10B981" />
              <div style={styles.optionContent}>
                <Text style={styles.optionTitle}>Restock Existing Product</Text>
                <Text style={styles.optionDesc}>Add more quantity to an existing item</Text>
              </view
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelBtn}
              onPress={resetAddFlow}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </view
        );

      case 'basicInfo':
        return (
          <ScrollView style={styles.flowStep} showsVerticalScrollIndicator={false}>
            <Text style={styles.flowTitle}>
              {isNewProduct ? 'New Product Details' : 'Restock Product'}
            </Text>
            
            {isNewProduct ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Product Name *"
                  value={newProduct.name}
                  onChangeText={(text) => setNewProduct({...newProduct, name: text})}
                />

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Description (optional)"
                  value={newProduct.description}
                  onChangeText={(text) => setNewProduct({...newProduct, description: text})}
                  multiline
                />

                <Text style={styles.label}>Category *</Text>
                <div style={styles.categoryGrid}>
                  {PRODUCT_CATEGORIES.map(category => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryOption,
                        newProduct.category === category.id && styles.categoryOptionSelected
                      ]}
                      onPress={() => {
                        setNewProduct({ 
                          ...newProduct, 
                          category: category.id,
                          measurementUnit: MEASUREMENT_UNITS[category.id]?.[0] || 'Units'
                        });
                      }}
                    >
                      <Ionicons 
                        name={category.icon as any} 
                        size={20} 
                        color={newProduct.category === category.id ? '#4F46E5' : '#6B7280'} 
                      />
                      <Text style={[
                        styles.categoryOptionText,
                        newProduct.category === category.id && styles.categoryOptionTextSelected
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </view

                <TextInput
                  style={styles.input}
                  placeholder="Brand/Manufacturer (optional)"
                  value={newProduct.brand}
                  onChangeText={(text) => setNewProduct({...newProduct, brand: text})}
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>Select Product to Restock</Text>
                <ScrollView style={styles.productSelectionList} nestedScrollEnabled>
                  {products.map(product => (
                    <TouchableOpacity
                      key={product.id}
                      style={[
                        styles.productSelectionItem,
                        selectedExistingProduct?.id === product.id && styles.productSelectionItemSelected
                      ]}
                      onPress={() => setSelectedExistingProduct(product)}
                    >
                      <Text style={styles.productSelectionName}>{product.name}</Text>
                      <Text style={styles.productSelectionDetails}>
                        {product.stockType === 'pack'
                          ? `${product.totalQuantity} packs • ${calculateTotalItems(product)} items`
                          : `${product.totalQuantity} units`
                        }
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {selectedExistingProduct && (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="Quantity to Add *"
                      keyboardType="numeric"
                      value={restockQuantity}
                      onChangeText={setRestockQuantity}
                    />
                    <Text style={styles.hintText}>
                      Current stock: {selectedExistingProduct.totalQuantity} {selectedExistingProduct.stockType === 'pack' ? 'packs' : 'units'}
                    </Text>
                  </>
                )}
              </>
            )}

            <div style={styles.flowButtons}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setAddFlowStep('newOrRestock')}
              >
                <Ionicons name="arrow-back" size={20} color="#4F46E5" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.nextButton,
                  (isNewProduct ? !newProduct.name || !newProduct.category : !selectedExistingProduct || !restockQuantity) && 
                  styles.nextButtonDisabled
                ]}
                onPress={() => setAddFlowStep(isNewProduct ? 'stockStructure' : 'finalize')}
                disabled={isNewProduct ? !newProduct.name || !newProduct.category : !selectedExistingProduct || !restockQuantity}
              >
                <Text style={styles.nextButtonText}>
                  {isNewProduct ? 'Next: Stock Structure' : 'Next: Finalize'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            </view
          </ScrollView>
        );

      case 'stockStructure':
        return (
          <ScrollView style={styles.flowStep} showsVerticalScrollIndicator={false}>
            <Text style={styles.flowTitle}>Stock Structure</Text>
            <Text style={styles.flowSubtitle}>How is this product stored and sold?</Text>

            {/* Stock Type Selection */}
            <Text style={styles.label}>Stock Type *</Text>
            <div style={styles.stockTypeOptions}>
              <TouchableOpacity
                style={[
                  styles.stockTypeOption,
                  newProduct.stockType === 'pack' && styles.stockTypeOptionSelected
                ]}
                onPress={() => setNewProduct({...newProduct, stockType: 'pack'})}
              >
                <Ionicons name="cube" size={24} color={newProduct.stockType === 'pack' ? '#4F46E5' : '#6B7280'} />
                <Text style={[
                  styles.stockTypeOptionTitle,
                  newProduct.stockType === 'pack' && styles.stockTypeOptionTitleSelected
                ]}>
                  Pack-based
                </Text>
                <Text style={styles.stockTypeOptionDesc}>
                  Sold in packs/boxes (e.g., Paracetamol packs)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.stockTypeOption,
                  newProduct.stockType === 'unit' && styles.stockTypeOptionSelected
                ]}
                onPress={() => setNewProduct({...newProduct, stockType: 'unit'})}
              >
                <Ionicons name="cube-outline" size={24} color={newProduct.stockType === 'unit' ? '#4F46E5' : '#6B7280'} />
                <Text style={[
                  styles.stockTypeOptionTitle,
                  newProduct.stockType === 'unit' && styles.stockTypeOptionTitleSelected
                ]}>
                  Unit-based
                </Text>
                <Text style={styles.stockTypeOptionDesc}>
                  Sold individually (e.g., Surgical gloves, Bandages)
                </Text>
              </TouchableOpacity>
            </view

            {/* Pack-based Configuration */}
            {newProduct.stockType === 'pack' && (
              <>
                <Text style={styles.label}>Pack Details *</Text>
                <div style={styles.row}>
                  <div style={styles.halfInput}>
                    <TextInput
                      style={styles.input}
                      placeholder="Total Packs *"
                      keyboardType="numeric"
                      value={newProduct.totalQuantity?.toString()}
                      onChangeText={(text) => setNewProduct({...newProduct, totalQuantity: parseInt(text) || 0})}
                    />
                    <Text style={styles.inputHint}>Number of packs you're adding</Text>
                  </view
                  
                  <div style={styles.halfInput}>
                    <TextInput
                      style={styles.input}
                      placeholder="Items per Pack *"
                      keyboardType="numeric"
                      value={newProduct.itemsPerPack?.toString()}
                      onChangeText={(text) => setNewProduct({...newProduct, itemsPerPack: parseInt(text) || 1})}
                    />
                    <Text style={styles.inputHint}>e.g., 10 tablets per pack</Text>
                  </view
                </view

                <Text style={styles.label}>Measurement Unit</Text>
                <div style={styles.unitsGrid}>
                  {(MEASUREMENT_UNITS[newProduct.category!] || ['Tablets']).map(unit => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitOption,
                        newProduct.measurementUnit === unit && styles.unitOptionSelected
                      ]}
                      onPress={() => setNewProduct({...newProduct, measurementUnit: unit})}
                    >
                      <Text style={[
                        styles.unitOptionText,
                        newProduct.measurementUnit === unit && styles.unitOptionTextSelected
                      ]}>
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </view

                {/* Retailable Option */}
                <TouchableOpacity
                  style={styles.retailableOption}
                  onPress={() => setNewProduct({...newProduct, retailable: !newProduct.retailable})}
                >
                  <div style={styles.checkbox}>
                    {newProduct.retailable && (
                      <Ionicons name="checkmark" size={20} color="#4F46E5" />
                    )}
                  </view
                  <div style={styles.retailableContent}>
                    <Text style={styles.retailableTitle}>Can be sold by single item</Text>
                    <Text style={styles.retailableDesc}>
                      Check if customers can buy individual items from the pack
                    </Text>
                  </view
                </TouchableOpacity>
              </>
            )}

            {/* Unit-based Configuration */}
            {newProduct.stockType === 'unit' && (
              <>
                <Text style={styles.label}>Stock Details *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Total Units *"
                  keyboardType="numeric"
                  value={newProduct.totalQuantity?.toString()}
                  onChangeText={(text) => setNewProduct({...newProduct, totalQuantity: parseInt(text) || 0})}
                />
                <Text style={styles.inputHint}>Total number of individual items</Text>

                <Text style={styles.label}>Measurement Unit</Text>
                <div style={styles.unitsGrid}>
                  {(MEASUREMENT_UNITS[newProduct.category!] || ['Units']).map(unit => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitOption,
                        newProduct.measurementUnit === unit && styles.unitOptionSelected
                      ]}
                      onPress={() => setNewProduct({...newProduct, measurementUnit: unit})}
                    >
                      <Text style={[
                        styles.unitOptionText,
                        newProduct.measurementUnit === unit && styles.unitOptionTextSelected
                      ]}>
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </view
              </>
            )}

            <div style={styles.flowButtons}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setAddFlowStep('basicInfo')}
              >
                <Ionicons name="arrow-back" size={20} color="#4F46E5" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.nextButton,
                  (!newProduct.totalQuantity || (newProduct.stockType === 'pack' && !newProduct.itemsPerPack)) && 
                  styles.nextButtonDisabled
                ]}
                onPress={() => setAddFlowStep('pricing')}
                disabled={!newProduct.totalQuantity || (newProduct.stockType === 'pack' && !newProduct.itemsPerPack)}
              >
                <Text style={styles.nextButtonText}>Next: Pricing</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            </view
          </ScrollView>
        );

      case 'pricing':
        return (
          <ScrollView style={styles.flowStep} showsVerticalScrollIndicator={false}>
            <Text style={styles.flowTitle}>Pricing</Text>
            <Text style={styles.flowSubtitle}>Set the prices for this product</Text>

            {newProduct.stockType === 'pack' ? (
              <>
                {newProduct.retailable ? (
                  <>
                    {/* Retail pricing - show both pack and unit prices */}
                    <Text style={styles.label}>Pricing for Retailable Items</Text>
                    <div style={styles.row}>
                      <div style={styles.halfInput}>
                        <TextInput
                          style={styles.input}
                          placeholder="Price per Pack *"
                          keyboardType="numeric"
                          value={newProduct.pricePerPack?.toString()}
                          onChangeText={(text) => setNewProduct({...newProduct, pricePerPack: parseFloat(text) || 0})}
                        />
                        <Text style={styles.inputHint}>
                          Total pack price
                        </Text>
                      </view
                      <div style={styles.halfInput}>
                        <TextInput
                          style={styles.input}
                          placeholder="Price per Unit *"
                          keyboardType="numeric"
                          value={newProduct.pricePerUnit?.toString()}
                          onChangeText={(text) => setNewProduct({...newProduct, pricePerUnit: parseFloat(text) || 0})}
                        />
                        <Text style={styles.inputHint}>
                          Price per single item
                        </Text>
                      </view
                    </view
                    
                    {/* Auto-calculation summary */}
                    <div style={styles.calculationBox}>
                      <Text style={styles.calculationTitle}>Summary:</Text>
                      <div style={styles.calculationRow}>
                        <Text style={styles.calculationLabel}>Total packs:</Text>
                        <Text style={styles.calculationValue}>{newProduct.totalQuantity || 0}</Text>
                      </view
                      <div style={styles.calculationRow}>
                        <Text style={styles.calculationLabel}>Items per pack:</Text>
                        <Text style={styles.calculationValue}>{newProduct.itemsPerPack || 1}</Text>
                      </view
                      <div style={styles.calculationRow}>
                        <Text style={styles.calculationLabel}>Total items:</Text>
                        <Text style={styles.calculationValue}>
                          {(newProduct.totalQuantity || 0) * (newProduct.itemsPerPack || 1)}
                        </Text>
                      </view
                      <div style={styles.calculationRow}>
                        <Text style={styles.calculationLabel}>Total value (packs):</Text>
                        <Text style={styles.calculationValue}>
                          ₦{((newProduct.totalQuantity || 0) * (newProduct.pricePerPack || 0)).toFixed(2)}
                        </Text>
                      </view
                      <div style={styles.calculationRow}>
                        <Text style={styles.calculationLabel}>Total value (units):</Text>
                        <Text style={styles.calculationValue}>
                          ₦{(((newProduct.totalQuantity || 0) * (newProduct.itemsPerPack || 1)) * (newProduct.pricePerUnit || 0)).toFixed(2)}
                        </Text>
                      </view
                    </view
                  </>
                ) : (
                  <>
                    {/* Non-retail pricing - only pack price */}
                    <Text style={styles.label}>Pack Pricing *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Price per Pack"
                      keyboardType="numeric"
                      value={newProduct.pricePerPack?.toString()}
                      onChangeText={(text) => setNewProduct({...newProduct, pricePerPack: parseFloat(text) || 0})}
                    />
                    <Text style={styles.inputHint}>
                      Enter the price for one complete pack
                    </Text>
                    
                    {/* Auto-calculation summary */}
                    <div style={styles.calculationBox}>
                      <Text style={styles.calculationTitle}>Summary:</Text>
                      <div style={styles.calculationRow}>
                        <Text style={styles.calculationLabel}>Total packs:</Text>
                        <Text style={styles.calculationValue}>{newProduct.totalQuantity || 0}</Text>
                      </view
                      <div style={styles.calculationRow}>
                        <Text style={styles.calculationLabel}>Items per pack:</Text>
                        <Text style={styles.calculationValue}>{newProduct.itemsPerPack || 1}</Text>
                      </view
                      <div style={styles.calculationRow}>
                        <Text style={styles.calculationLabel}>Total items:</Text>
                        <Text style={styles.calculationValue}>
                          {(newProduct.totalQuantity || 0) * (newProduct.itemsPerPack || 1)}
                        </Text>
                      </view
                      <div style={styles.calculationRow}>
                        <Text style={styles.calculationLabel}>Total value:</Text>
                        <Text style={styles.calculationValue}>
                          ₦{((newProduct.totalQuantity || 0) * (newProduct.pricePerPack || 0)).toFixed(2)}
                        </Text>
                      </view
                    </view
                  </>
                )}
              </>
            ) : (
              <>
                {/* Unit-based pricing */}
                <Text style={styles.label}>Unit Pricing *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Price per Unit"
                  keyboardType="numeric"
                  value={newProduct.pricePerItem?.toString()}
                  onChangeText={(text) => setNewProduct({...newProduct, pricePerItem: parseFloat(text) || 0})}
                />
                <Text style={styles.inputHint}>
                  Price for one individual unit
                </Text>
                
                {/* Auto-calculation summary */}
                <div style={styles.calculationBox}>
                  <Text style={styles.calculationTitle}>Summary:</Text>
                  <div style={styles.calculationRow}>
                    <Text style={styles.calculationLabel}>Total units:</Text>
                    <Text style={styles.calculationValue}>{newProduct.totalQuantity || 0}</Text>
                  </view
                  <div style={styles.calculationRow}>
                    <Text style={styles.calculationLabel}>Total value:</Text>
                    <Text style={styles.calculationValue}>
                      ₦{((newProduct.totalQuantity || 0) * (newProduct.pricePerItem || 0)).toFixed(2)}
                    </Text>
                  </view
                </view
              </>
            )}

            <div style={styles.flowButtons}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setAddFlowStep('stockStructure')}
              >
                <Ionicons name="arrow-back" size={20} color="#4F46E5" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.nextButton,
                  (newProduct.stockType === 'pack' 
                    ? (!newProduct.pricePerPack || (newProduct.retailable && !newProduct.pricePerUnit))
                    : !newProduct.pricePerItem) && 
                  styles.nextButtonDisabled
                ]}
                onPress={() => setAddFlowStep('finalize')}
                disabled={newProduct.stockType === 'pack' 
                  ? (!newProduct.pricePerPack || (newProduct.retailable && !newProduct.pricePerUnit))
                  : !newProduct.pricePerItem}
              >
                <Text style={styles.nextButtonText}>Next: Finalize</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            </view
          </ScrollView>
        );

      case 'finalize':
        return (
          <ScrollView style={styles.flowStep} showsVerticalScrollIndicator={false}>
            <Text style={styles.flowTitle}>Final Details</Text>
            <Text style={styles.flowSubtitle}>Complete the product information</Text>

            {/* Expiry Date with Working Calendar */}
            <Text style={styles.label}>Expiry Date *</Text>
       <Pressable 
  style={styles.dateInput}
  onPress={() => setShowDatePicker(true)}
>
  <Ionicons name="calendar" size={20} color="#4F46E5" />
  <Text style={styles.dateText}>
    {newProduct.expiryDate?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })}
  </Text>
  <Ionicons name="chevron-down" size={20} color="#6B7280" />
</Pressable>
{Platform.OS === 'web' ? (
  <TextInput
    type="date"
    style={{ 
      padding: '10px', 
      fontSize: '16px', 
      border: '1px solid #ccc', 
      borderRadius: '4px',
      width: '100%' 
    }}
    value={newProduct.expiryDate ? newProduct.expiryDate.toISOString().split('T')[0] : ''}
    onChange={(e) => {
      const selectedDate = new Date(e.target.value);
      setNewProduct({ ...newProduct, expiryDate: selectedDate });
    }}
  />
) : (
  <>
    <Pressable onPress={() => setShowDatePicker(true)}>
      <Text>{newProduct.expiryDate?.toLocaleDateString() || 'Select Date'}</Text>
    </Pressable>
    {showDatePicker && (
      <DateTimePicker
        value={newProduct.expiryDate || new Date()}
        mode="date"
        minimumDate={new Date()}
        onChange={(event, selectedDate) => {
          setShowDatePicker(false);
          if (selectedDate) {
            setNewProduct({ ...newProduct, expiryDate: selectedDate });
          }
        }}
      />
    )}
  </>
)}

            {/* Supplier Information */}
            <Text style={styles.label}>Supplier Information</Text>
            <TextInput
              style={styles.input}
              placeholder="Supplier Name"
              value={newProduct.supplier}
              onChangeText={(text) => setNewProduct({...newProduct, supplier: text})}
            />
            <Text style={styles.inputHint}>
              Name of the company or person who supplied this product
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Batch Number"
              value={newProduct.batchNumber}
              onChangeText={(text) => setNewProduct({...newProduct, batchNumber: text})}
            />
            <Text style={styles.inputHint}>
              Manufacturer's batch number for tracking
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Reorder Level (default: 10)"
              keyboardType="numeric"
              value={newProduct.reorderLevel?.toString()}
              onChangeText={(text) => setNewProduct({...newProduct, reorderLevel: parseInt(text) || 10})}
            />
            <Text style={styles.inputHint}>
              Alert when stock reaches this level
            </Text>

            {/* Security Code */}
            <Text style={styles.label}>Security Verification</Text>
            <TextInput
              style={styles.input}
              placeholder="Your Access Code *"
              value={accessCode}
              onChangeText={setAccessCode}
              secureTextEntry
            />
            <Text style={styles.inputHint}>
              Enter your security code to confirm this action
            </Text>

            {/* Summary Preview */}
            <div style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Product Summary</Text>
              <div style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Name:</Text>
                <Text style={styles.summaryValue}>{newProduct.name}</Text>
              </view
              <div style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Category:</Text>
                <Text style={styles.summaryValue}>
                  {PRODUCT_CATEGORIES.find(c => c.id === newProduct.category)?.name}
                </Text>
              </view
              <div style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Stock Type:</Text>
                <Text style={styles.summaryValue}>
                  {newProduct.stockType === 'pack' ? 'Pack-based' : 'Unit-based'}
                </Text>
              </view
              
              {newProduct.stockType === 'pack' && (
                <>
                  <div style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Packs:</Text>
                    <Text style={styles.summaryValue}>{newProduct.totalQuantity}</Text>
                  </view
                  <div style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Items per Pack:</Text>
                    <Text style={styles.summaryValue}>{newProduct.itemsPerPack}</Text>
                  </view
                  <div style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Items:</Text>
                    <Text style={styles.summaryValue}>
                      {(newProduct.totalQuantity || 0) * (newProduct.itemsPerPack || 1)}
                    </Text>
                  </view
                  {newProduct.retailable ? (
                    <>
                      <div style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Price per Pack:</Text>
                        <Text style={styles.summaryValue}>₦{newProduct.pricePerPack?.toFixed(2)}</Text>
                      </view
                      <div style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Price per Unit:</Text>
                        <Text style={styles.summaryValue}>₦{newProduct.pricePerUnit?.toFixed(2)}</Text>
                      </view
                    </>
                  ) : (
                    <div style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Price per Pack:</Text>
                      <Text style={styles.summaryValue}>₦{newProduct.pricePerPack?.toFixed(2)}</Text>
                    </view
                  )}
                </>
              )}
              
              {newProduct.stockType === 'unit' && (
                <>
                  <div style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Units:</Text>
                    <Text style={styles.summaryValue}>{newProduct.totalQuantity}</Text>
                  </view
                  <div style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Price per Unit:</Text>
                    <Text style={styles.summaryValue}>₦{newProduct.pricePerItem?.toFixed(2)}</Text>
                  </view
                </>
              )}
              
              <div style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Expiry Date:</Text>
                <Text style={styles.summaryValue}>
                  {newProduct.expiryDate?.toLocaleDateString()}
                </Text>
              </view
              <div style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Value:</Text>
                <Text style={[styles.summaryValue, {color: '#059669', fontWeight: 'bold'}]}>
                  ₦{
                    newProduct.stockType === 'pack'
                      ? newProduct.retailable
                        ? ((newProduct.totalQuantity || 0) * (newProduct.itemsPerPack || 1) * (newProduct.pricePerUnit || 0)).toFixed(2)
                        : ((newProduct.totalQuantity || 0) * (newProduct.pricePerPack || 0)).toFixed(2)
                      : ((newProduct.totalQuantity || 0) * (newProduct.pricePerItem || 0)).toFixed(2)
                  }
                </Text>
              </view
            </view

            <div style={styles.flowButtons}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setAddFlowStep('pricing')}
              >
                <Ionicons name="arrow-back" size={20} color="#4F46E5" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveBtn, !accessCode && styles.saveBtnDisabled]}
                onPress={isNewProduct ? handleAddNewProduct : handleRestockProduct}
                disabled={!accessCode}
              >
                <Ionicons name="checkmark" size={20} color="white" />
                <Text style={styles.saveBtnText}>
                  {isNewProduct ? 'Add Product' : 'Restock Product'}
                </Text>
              </TouchableOpacity>
            </view
          </ScrollView>
        );
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const expiryStatus = getExpiryStatus(item.expiryDate);
    const stockStatus = getStockStatus(item.totalQuantity, item.reorderLevel);
    const totalItems = calculateTotalItems(item);
    const category = PRODUCT_CATEGORIES.find(c => c.id === item.category);
    
    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => {
          setSelectedProduct(item);
          setShowDetailModal(true);
        }}
      >
        <div style={styles.productHeader}>
          <div style={[styles.categoryIcon, { backgroundColor: `#${Math.floor(Math.random()*16777215).toString(16)}20` }]}>
            <Ionicons name={category?.icon as any || 'cube'} size={24} color="#4F46E5" />
          </view
          <div style={styles.productTitle}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.productBrand} numberOfLines={1}>
              {item.brand || 'Generic'} • {item.category}
            </Text>
          </view
        </view

        <div style={styles.productDetails}>
          {/* Stock Type Badge */}
          <div style={styles.stockTypeBadge}>
            <Text style={styles.stockTypeText}>
              {item.stockType === 'pack' ? 'PACK-BASED' : 'UNIT-BASED'}
            </Text>
          </view

          <div style={styles.detailRow}>
            <div style={styles.detailItem}>
              <Ionicons name="pricetag" size={14} color="#6B7280" />
              <Text style={styles.detailText}>
                {item.stockType === 'pack' 
                  ? item.retailable 
                    ? `₦${item.pricePerUnit}/unit` 
                    : `₦${item.pricePerPack}/pack`
                  : `₦${item.pricePerItem}/unit`
                }
              </Text>
            </view
            <div style={styles.detailItem}>
              <Ionicons name="cube" size={14} color="#6B7280" />
              <Text style={styles.detailText}>
                {item.stockType === 'pack'
                  ? `${item.totalQuantity} packs (${totalItems} items)`
                  : `${item.totalQuantity} units`
                }
              </Text>
            </view
          </view

          <div style={styles.detailRow}>
            <div style={styles.detailItem}>
              <Ionicons name="calendar" size={14} color={expiryStatus.color} />
              <Text style={[styles.detailText, { color: expiryStatus.color }]}>
                {expiryStatus.label}
              </Text>
            </view
            <div style={[styles.stockBadge, { backgroundColor: `${stockStatus.color}20` }]}>
              <Text style={[styles.stockText, { color: stockStatus.color }]}>
                {stockStatus.label}
              </Text>
            </view
          </view
        </view

        <TouchableOpacity 
          style={[styles.sellButton, item.totalQuantity === 0 && styles.sellButtonDisabled]}
          onPress={() => {
            setSelectedProduct(item);
            setShowSaleModal(true);
          }}
          disabled={item.totalQuantity === 0}
        >
          <Ionicons name="cart" size={16} color="white" />
          <Text style={styles.sellButtonText}>
            {item.totalQuantity === 0 ? 'Out of Stock' : 'Sell'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderSaleItem = ({ item }: { item: Sale }) => (
    <div style={styles.saleItem}>
      <div style={styles.saleIcon}>
        <Ionicons name="receipt" size={20} color="#10B981" />
      </view
      <div style={styles.saleInfo}>
        <Text style={styles.saleProduct}>{item.productName}</Text>
        <Text style={styles.saleDetails}>
          {item.quantity} {item.saleType} • ₦{item.totalAmount.toFixed(2)}
        </Text>
        <Text style={styles.saleMeta}>
          {item.customerName || 'Walk-in'} • {new Date(item.soldAt).toLocaleDateString()}
        </Text>
      </view
    </view
  );

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading Pharmacy...</Text>
      </view
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div 
          <Text style={styles.title}>Pharmacy Store</Text>
          <Text style={styles.subtitle}>Hospital Inventory & Sales</Text>
        </view
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Product</Text>
        </TouchableOpacity>
      </view

      {/* Search */}
      <div style={styles.searchSection}>
        <div style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </view
      </view

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
      >
        <TouchableOpacity
          style={[styles.categoryButton, selectedCategory === 'all' && styles.categoryButtonActive]}
          onPress={() => setSelectedCategory('all')}
        >
          <Ionicons name="grid" size={20} color={selectedCategory === 'all' ? '#4F46E5' : '#6B7280'} />
          <Text style={[styles.categoryText, selectedCategory === 'all' && styles.categoryTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        
        {PRODUCT_CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryButton, selectedCategory === category.id && styles.categoryButtonActive]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons 
              name={category.icon as any} 
              size={20} 
              color={selectedCategory === category.id ? '#4F46E5' : '#6B7280'} 
            />
            <Text style={[styles.categoryText, selectedCategory === category.id && styles.categoryTextActive]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <Text style={styles.statNumber}>{products.length}</Text>
          <Text style={styles.statLabel}>Total Products</Text>
        </view
        <div style={styles.statCard}>
          <Text style={styles.statNumber}>
            ₦{sales.reduce((total, sale) => total + sale.totalAmount, 0).toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Total Sales</Text>
        </view
        <div style={styles.statCard}>
          <Text style={styles.statNumber}>
            {products.filter(p => p.totalQuantity === 0).length}
          </Text>
          <Text style={styles.statLabel}>Out of Stock</Text>
        </view
        <div style={styles.statCard}>
          <Text style={styles.statNumber}>
            {products.filter(p => getExpiryStatus(p.expiryDate).daysLeft <= 30).length}
          </Text>
          <Text style={styles.statLabel}>Expiring Soon</Text>
        </view
      </view

      {/* Products List */}
      <div style={styles.productsSection}>
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={item => item.id!}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.productsGrid}
          ListEmptyComponent={
            <div style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No products found</Text>
            </view
          }
        />
      </view

      {/* Recent Sales */}
      <div style={styles.salesSection}>
        <div style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Sales</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </view
        
        <FlatList
          data={sales.slice(0, 3)}
          renderItem={renderSaleItem}
          keyExtractor={item => item.id!}
          scrollEnabled={false}
        />
      </view

      {/* Add Product Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <div style={styles.modalOverlay}>
          <div style={styles.modalContainer}>
            <div style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {addFlowStep === 'newOrRestock' ? 'Add or Restock' : 
                 addFlowStep === 'basicInfo' ? (isNewProduct ? 'New Product' : 'Restock Product') :
                 addFlowStep === 'stockStructure' ? 'Stock Structure' :
                 addFlowStep === 'pricing' ? 'Pricing' : 'Final Details'}
              </Text>
              <TouchableOpacity onPress={resetAddFlow}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </view
            
            {renderAddProductModal()}
          </view
        </view
      </Modal>

      {/* Sell Modal */}
      <Modal visible={showSaleModal} animationType="slide" transparent>
        <div style={styles.modalOverlay}>
          <div style={styles.saleModalContainer}>
            <Text style={styles.modalTitle}>Sell Product</Text>
            
            {selectedProduct && (
              <>
                <div style={styles.selectedProduct}>
                  <div style={styles.selectedProductIcon}>
                    <Ionicons name="medical" size={32} color="#4F46E5" />
                  </view
                  <div style={styles.selectedProductInfo}>
                    <Text style={styles.selectedProductName}>{selectedProduct.name}</Text>
                    <Text style={styles.selectedProductDetails}>
                      Available: {selectedProduct.totalQuantity} {selectedProduct.stockType === 'pack' ? 'packs' : 'units'}
                    </Text>
                    <Text style={styles.selectedProductPrice}>
                      {selectedProduct.stockType === 'pack' 
                        ? selectedProduct.retailable
                          ? `₦${selectedProduct.pricePerPack}/pack • ₦${selectedProduct.pricePerUnit}/unit`
                          : `₦${selectedProduct.pricePerPack}/pack`
                        : `₦${selectedProduct.pricePerItem}/unit`}
                    </Text>
                  </view
                </view

                {/* Sale Type */}
                <Text style={styles.saleLabel}>How do you want to sell?</Text>
                <div style={styles.saleTypeOptions}>
                  {selectedProduct.stockType === 'pack' && (
                    <TouchableOpacity
                      style={[styles.saleTypeBtn, saleType === 'pack' && styles.saleTypeBtnActive]}
                      onPress={() => setSaleType('pack')}
                    >
                      <Text style={[styles.saleTypeBtnText, saleType === 'pack' && styles.saleTypeBtnTextActive]}>
                        Sell by Pack
                      </Text>
                      <Text style={styles.saleTypeBtnDesc}>
                        {selectedProduct.itemsPerPack} items per pack
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {selectedProduct.retailable && (
                    <TouchableOpacity
                      style={[styles.saleTypeBtn, saleType === 'unit' && styles.saleTypeBtnActive]}
                      onPress={() => setSaleType('unit')}
                    >
                      <Text style={[styles.saleTypeBtnText, saleType === 'unit' && styles.saleTypeBtnTextActive]}>
                        Sell by Unit
                      </Text>
                      <Text style={styles.saleTypeBtnDesc}>
                        Individual items
                      </Text>
                    </TouchableOpacity>
                  )}
                </view

                {/* Quantity */}
                <Text style={styles.saleLabel}>
                  {saleType === 'pack' ? 'Number of packs' : 'Number of units'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={
                    saleType === 'pack' 
                      ? `Enter packs (${selectedProduct.itemsPerPack} items per pack)`
                      : 'Enter number of units'
                  }
                  keyboardType="numeric"
                  value={saleQuantity}
                  onChangeText={setSaleQuantity}
                />

                {/* Customer Info */}
                <Text style={styles.saleLabel}>Customer Information</Text>
                <div style={styles.customerTypeRow}>
                  {(['walkin', 'patient', 'staff'] as const).map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.customerTypeBtn, customerType === type && styles.customerTypeBtnActive]}
                      onPress={() => setCustomerType(type)}
                    >
                      <Text style={[
                        styles.customerTypeText,
                        customerType === type && styles.customerTypeTextActive
                      ]}>
                        {type === 'walkin' ? 'Walk-in' : type === 'patient' ? 'Patient' : 'Staff'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </view

                <TextInput
                  style={styles.input}
                  placeholder="Customer Name (optional)"
                  value={customerName}
                  onChangeText={setCustomerName}
                />

                {/* Total Calculation */}
                {saleQuantity && !isNaN(parseFloat(saleQuantity)) && (
                  <div style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Total Amount</Text>
                    <Text style={styles.totalAmount}>
                      ₦{
                        saleType === 'pack'
                          ? (parseFloat(saleQuantity) * (selectedProduct.pricePerPack || 0)).toFixed(2)
                          : (parseFloat(saleQuantity) * (selectedProduct.pricePerUnit || selectedProduct.pricePerItem || 0)).toFixed(2)
                      }
                    </Text>
                  </view
                )}

                <div style={styles.saleActions}>
                  <TouchableOpacity 
                    style={styles.cancelBtn}
                    onPress={() => {
                      setShowSaleModal(false);
                      resetSaleForm();
                    }}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.confirmBtn, (!saleQuantity || parseFloat(saleQuantity) <= 0) && styles.confirmBtnDisabled]}
                    onPress={handleSellProduct}
                    disabled={!saleQuantity || parseFloat(saleQuantity) <= 0}
                  >
                    <Text style={styles.confirmBtnText}>Confirm Sale</Text>
                  </TouchableOpacity>
                </view
              </>
            )}
          </view
        </view
      </Modal>

      {/* Product Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <div style={styles.modalOverlay}>
          <div style={styles.detailModalContainer}>
            {selectedProduct && (
              <>
                <div style={styles.detailHeader}>
                  <div style={styles.detailIcon}>
                    <Ionicons name="medical" size={40} color="#4F46E5" />
                  </view
                  <div style={styles.detailTitle}>
                    <Text style={styles.detailName}>{selectedProduct.name}</Text>
                    <Text style={styles.detailBrand}>{selectedProduct.brand || 'Generic'}</Text>
                  </view
                  <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                    <Ionicons name="close" size={24} color="#374151" />
                  </TouchableOpacity>
                </view

                <ScrollView style={styles.detailContent}>
                  <div style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Product Information</Text>
                    <div style={styles.detailGrid}>
                      <div style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Category</Text>
                        <Text style={styles.detailValue}>{selectedProduct.category}</Text>
                      </view
                      <div style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Measurement Unit</Text>
                        <Text style={styles.detailValue}>{selectedProduct.measurementUnit}</Text>
                      </view
                      <div style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Stock Type</Text>
                        <Text style={styles.detailValue}>
                          {selectedProduct.stockType === 'pack' ? 'Pack-based' : 'Unit-based'}
                        </Text>
                      </view
                      {selectedProduct.stockType === 'pack' && (
                        <>
                          <div style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Items per Pack</Text>
                            <Text style={styles.detailValue}>{selectedProduct.itemsPerPack}</Text>
                          </view
                          <div style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Retailable</Text>
                            <Text style={styles.detailValue}>{selectedProduct.retailable ? 'Yes' : 'No'}</Text>
                          </view
                        </>
                      )}
                    </view
                  </view

                  <div style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Pricing</Text>
                    <div style={styles.detailGrid}>
                      {selectedProduct.stockType === 'pack' && selectedProduct.retailable && (
                        <>
                          <div style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Price per Pack</Text>
                            <Text style={styles.detailValue}>₦{selectedProduct.pricePerPack?.toFixed(2)}</Text>
                          </view
                          <div style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Price per Unit</Text>
                            <Text style={styles.detailValue}>₦{selectedProduct.pricePerUnit?.toFixed(2)}</Text>
                          </view
                        </>
                      )}
                      {selectedProduct.stockType === 'pack' && !selectedProduct.retailable && (
                        <div style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Price per Pack</Text>
                          <Text style={styles.detailValue}>₦{selectedProduct.pricePerPack?.toFixed(2)}</Text>
                        </view
                      )}
                      {selectedProduct.stockType === 'unit' && (
                        <div style={styles.detailItem}>
                          <Text style={styles.detailLabel}>Price per Unit</Text>
                          <Text style={styles.detailValue}>₦{selectedProduct.pricePerItem?.toFixed(2)}</Text>
                        </view
                      )}
                      <div style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Stock Value</Text>
                        <Text style={styles.detailValue}>₦{calculateTotalValue(selectedProduct).toFixed(2)}</Text>
                      </view
                      <div style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Total Items</Text>
                        <Text style={styles.detailValue}>{calculateTotalItems(selectedProduct)}</Text>
                      </view
                    </view
                  </view

                  <div style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Stock & Expiry</Text>
                    <div style={styles.detailGrid}>
                      <div style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Current Stock</Text>
                        <Text style={styles.detailValue}>
                          {selectedProduct.totalQuantity} {selectedProduct.stockType === 'pack' ? 'packs' : 'units'}
                        </Text>
                      </view
                      <div style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Reorder Level</Text>
                        <Text style={styles.detailValue}>{selectedProduct.reorderLevel}</Text>
                      </view
                      <div style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Expiry Date</Text>
                        <Text style={[styles.detailValue, 
                          { color: getExpiryStatus(selectedProduct.expiryDate).color }]}>
                          {selectedProduct.expiryDate.toLocaleDateString()}
                        </Text>
                      </view
                      <div style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Batch Number</Text>
                        <Text style={styles.detailValue}>{selectedProduct.batchNumber || 'N/A'}</Text>
                      </view
                    </view
                  </view

                  {selectedProduct.description && (
                    <div style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Description</Text>
                      <Text style={styles.detailDescription}>{selectedProduct.description}</Text>
                    </view
                  )}

                  {selectedProduct.supplier && (
                    <div style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Supplier</Text>
                      <Text style={styles.detailValue}>{selectedProduct.supplier}</Text>
                    </view
                  )}
                </ScrollView>

                <TouchableOpacity 
                  style={[styles.detailSellButton, selectedProduct.totalQuantity === 0 && styles.detailSellButtonDisabled]}
                  onPress={() => {
                    setShowDetailModal(false);
                    setShowSaleModal(true);
                  }}
                  disabled={selectedProduct.totalQuantity === 0}
                >
                  <Ionicons name="cart" size={20} color="white" />
                  <Text style={styles.detailSellButtonText}>
                    {selectedProduct.totalQuantity === 0 ? 'Out of Stock' : 'Sell this Product'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </view
        </view
      </Modal>
    </view
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: '#4F46E5',
  },
  categoryText: {
    color: '#6B7280',
    fontWeight: '500',
    fontSize: 12,
  },
  categoryTextActive: {
    color: 'white',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  productsSection: {
    flex: 1,
    padding: 16,
  },
  productsGrid: {
    paddingBottom: 20,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    width: (width - 32 - 16) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productTitle: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  productBrand: {
    fontSize: 12,
    color: '#6B7280',
  },
  productDetails: {
    marginBottom: 12,
  },
  stockTypeBadge: {
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  stockTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4F46E5',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 10,
    fontWeight: '600',
  },
  sellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  sellButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sellButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  salesSection: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  viewAll: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 14,
  },
  saleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  saleIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  saleInfo: {
    flex: 1,
  },
  saleProduct: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  saleDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  saleMeta: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#9CA3AF',
    marginTop: 8,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  
  // Flow styles
  flowStep: {
    padding: 20,
  },
  flowTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  flowSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 12,
    color: '#6B7280',
  },

  productSelectionList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  productSelectionItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productSelectionItemSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  productSelectionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productSelectionDetails: {
    fontSize: 12,
    color: '#6B7280',
  },

  stockTypeOptions: {
    gap: 12,
    marginBottom: 20,
  },
  stockTypeOption: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stockTypeOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  stockTypeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  stockTypeOptionTitleSelected: {
    color: '#4F46E5',
  },
  stockTypeOptionDesc: {
    fontSize: 12,
    color: '#6B7280',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  hintText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: -8,
    marginBottom: 12,
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: -8,
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    gap: 8,
    minWidth: '30%',
    flex: 1,
  },
  categoryOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  categoryOptionText: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryOptionTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  unitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  unitOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  unitOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  unitOptionText: {
    fontSize: 12,
    color: '#6B7280',
  },
  unitOptionTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  retailableOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  retailableContent: {
    flex: 1,
  },
  retailableTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  retailableDesc: {
    fontSize: 12,
    color: '#6B7280',
  },

  calculationBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  calculationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0369A1',
    marginBottom: 8,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  calculationLabel: {
    fontSize: 12,
    color: '#374151',
  },
  calculationValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },

  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },

  summaryBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },

  flowButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  backButtonText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 14,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    flex: 2,
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#059669',
    borderRadius: 8,
    flex: 2,
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelBtnText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },

  saleModalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  selectedProduct: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  selectedProductIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedProductInfo: {
    flex: 1,
  },
  selectedProductName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  selectedProductDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  selectedProductPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  saleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  saleTypeOptions: {
    gap: 8,
    marginBottom: 16,
  },
  saleTypeBtn: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  saleTypeBtnActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  saleTypeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  saleTypeBtnTextActive: {
    color: '#4F46E5',
  },
  saleTypeBtnDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  customerTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  customerTypeBtn: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    alignItems: 'center',
  },
  customerTypeBtnActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  customerTypeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  customerTypeTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  totalBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#047857',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#065F46',
  },
  saleActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmBtn: {
    flex: 1,
    padding: 14,
    backgroundColor: '#059669',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#9CA3AF',
  },
  confirmBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  detailModalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailTitle: {
    flex: 1,
  },
  detailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  detailBrand: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailContent: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },

  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  detailDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  detailSellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    padding: 16,
    margin: 20,
    borderRadius: 8,
    gap: 8,
  },
  detailSellButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  detailSellButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default PharmacyDashboard;