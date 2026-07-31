import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/languageContext';
import { useTheme } from '../../../context/themeContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../services/firebase';

const Step5_SelectTests = ({ navigation, route }: any) => {
  const { t } = useLanguage();
  const { primaryColor } = useTheme();
  const { patientData } = route.params || {};
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [labId, setLabId] = useState('');

  useEffect(() => {
    const labId = route.params?.labId || route.params?.selectedLabId;
    if (labId) {
      fetchTests(labId);
    }
  }, []);

  const fetchTests = async (labId: string) => {
    const fetchTests = async (labId: string) => {
        try {
          const testsRef = collection(db, 'labs', labId, 'testCatalog');
          const snapshot = await getDocs(testsRef);
          const testList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTests(testList);
        } catch (error) {
          console.error('Error fetching tests:', error);
          // Fallback to mock data if no tests exist
          setTests([
            { id: '1', name: 'Malaria Test', category: 'Blood', price: 5000 },
            { id: '2', name: 'HIV Screening', category: 'Blood', price: 15000 },
            { id: '3', name: 'COVID-19 Test', category: 'Swab', price: 20000 },
          ]);
        }
      };

  const toggleTest = (testId: string) => {
    setSelectedTests(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const getTotalPrice = () => {
    return tests
      .filter(test => selectedTests.includes(test.id))
      .reduce((sum, test) => sum + (test.price || 0), 0);
  };

  const handleNext = () => {
    if (selectedTests.length === 0) {
      alert(t('select_at_least_one_test'));
      return;
    }
    const selectedTestData = tests.filter(test => selectedTests.includes(test.id));
    navigation.navigate('Step6_AccessCode', { 
      patientData: { ...patientData, labTests: selectedTestData }
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: primaryColor, justifyContent: 'center' }]}>
        <ActivityIndicator color="white" size="large" />
        <Text style={styles.loadingText}>{t('loading_tests')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: primaryColor }]}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '83%' }]} />
      </View>
      <Text style={styles.stepText}>Step 5/6</Text>
      
      <Text style={styles.title}>{t('select_tests')}</Text>
      <Text style={styles.subtitle}>{t('choose_tests_to_perform')}</Text>

      <View style={styles.testList}>
        {tests.map((test) => (
          <TouchableOpacity
            key={test.id}
            style={[styles.testItem, selectedTests.includes(test.id) && styles.testSelected]}
            onPress={() => toggleTest(test.id)}
          >
            <View style={styles.testInfo}>
              <Text style={styles.testName}>{test.name}</Text>
              <Text style={styles.testCategory}>{test.category}</Text>
            </View>
            <View style={styles.testRight}>
              <Text style={styles.testPrice}>${test.price || 0}</Text>
              {selectedTests.includes(test.id) && (
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.totalText}>
          {t('total')}: ${getTotalPrice()}
        </Text>
        <Text style={styles.selectedCount}>
          {selectedTests.length} {t('tests_selected')}
        </Text>
        
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>{t('next')} →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  stepText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginBottom: 20,
    fontFamily: 'Poppins-Regular',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
    fontFamily: 'Poppins-Regular',
  },
  testList: {
    flex: 1,
  },
  testItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  testSelected: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  testCategory: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  testRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  testPrice: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  footer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  totalText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  selectedCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Poppins-Regular',
  },
  nextButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#1A237E',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'Poppins-Regular',
  },
});
}

export default Step5_SelectTests;