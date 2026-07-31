import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import Lab from '../../types/Lab';

const LabSelectionScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { primaryColor } = useTheme();
  const { getAllLabs } = useAuth();
  const [labs, setLabs] = useState<Lab[]>([]); 
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const labList = await getAllLabs();
      setLabs(labList);
    } catch (error) {
      console.error('Error fetching labs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLabs = labs.filter(lab =>
    lab.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lab.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: primaryColor }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      
      <View style={styles.header}>
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>{t('select_your_lab')}</Text>
        <Text style={styles.subtitle}>{t('choose_lab_to_continue')}</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="rgba(255,255,255,0.7)" />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search_lab')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="rgba(255,255,255,0.7)"
        />
      </View>

      {loading ? (
        <ActivityIndicator color="white" size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredLabs}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.labItem}
              onPress={() => navigation.navigate('Login', { 
                labId: item.id, 
                labName: item.name 
              })}
            >
              <View style={[styles.labIcon, { backgroundColor: item.primaryColor || '#1A237E' }]}>
                <Text style={styles.labIconText}>🧪</Text>
              </View>
              <View style={styles.labInfo}>
                <Text style={styles.labName}>{item.name}</Text>
                <Text style={styles.labLocation}>
                  <Ionicons name="location" size={14} color="rgba(255,255,255,0.7)" />
                  {' '}{item.location}
                </Text>
                <Text style={styles.labPatients}>
                  👥 {item.patientCount || 0} patients
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>🔍 {t('no_labs_found')}</Text>
              <Text style={styles.emptySubtext}>{t('try_different_search')}</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    marginBottom: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Poppins-Regular',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: 'white',
    fontFamily: 'Poppins-Regular',
  },
  loader: {
    marginTop: 40,
  },
  labItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  labIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  labIconText: {
    fontSize: 24,
  },
  labInfo: {
    flex: 1,
  },
  labName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  labLocation: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  labPatients: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
  },
});

export default LabSelectionScreen;