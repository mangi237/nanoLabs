import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';

const TransferScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { user, lab } = useAuth();
  const [labs, setLabs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLab, setSelectedLab] = useState<any>(null);

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const labsRef = collection(db, 'labs');
      const snapshot = await getDocs(labsRef);
      const labList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(l => l.id !== lab?.id);
      setLabs(labList);
    } catch (error) {
      console.error('Error fetching labs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLabs = labs.filter(l =>
    l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTransfer = () => {
    if (!selectedLab) {
      Alert.alert(t('error'), t('select_lab_to_transfer'));
      return;
    }
    Alert.alert(
      t('confirm_transfer'),
      `${t('transfer_to')} ${selectedLab.name}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('confirm'), 
          onPress: () => {
            Alert.alert(t('success'), t('transfer_request_sent'));
            navigation.goBack();
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search_labs')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <FlatList
        data={filteredLabs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[
              styles.labItem, 
              { backgroundColor: colors.surface },
              selectedLab?.id === item.id && styles.labItemSelected
            ]}
            onPress={() => setSelectedLab(item)}
          >
            <View style={styles.labInfo}>
              <Text style={styles.labName}>{item.name}</Text>
              <Text style={styles.labLocation}>{item.location}</Text>
            </View>
            {selectedLab?.id === item.id && (
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={50} color="#ccc" />
            <Text style={styles.emptyText}>{t('no_labs_found')}</Text>
          </View>
        }
      />

      {selectedLab && (
        <TouchableOpacity 
          style={[styles.transferButton, { backgroundColor: colors.primary }]}
          onPress={handleTransfer}
        >
          <Text style={styles.transferButtonText}>
            {t('transfer_to')} {selectedLab.name}
          </Text>
        </TouchableOpacity>
      )}
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
  labItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  labItemSelected: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  labInfo: {
    flex: 1,
  },
  labName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  labLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    fontFamily: 'Poppins-Medium',
  },
  transferButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  transferButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
});

export default TransferScreen;