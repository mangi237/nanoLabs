// screens/patient/Onboarding/Step1_PersonalInfo.tsx
// This should be the NEW Step 1 - Lab Selection

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/authContext';
import { useLanguage } from '../../../context/languageContext';
import { useTheme } from '../../../context/themeContext';

const Step1_PersonalInfo = ({ navigation, route }: any) => {
  const { t } = useLanguage();
  const { primaryColor } = useTheme();
  const { getAllLabs } = useAuth();
  const [labs, setLabs] = useState<any[]>([]);
  const [selectedLab, setSelectedLab] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const labList = await getAllLabs();
      setLabs(labList || []);
    } catch (error) {
      console.error('Error fetching labs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!selectedLab) {
      alert('Please select a lab first');
      return;
    }
    navigation.navigate('Step2_ContactInfo', { 
      selectedLabId: selectedLab.id,
      selectedLabName: selectedLab.name
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: primaryColor, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: primaryColor }]}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '16%' }]} />
      </View>
      <Text style={styles.stepText}>Step 1/6</Text>
      
      <Text style={styles.title}>🏥 {t('select_your_lab')}</Text>
      <Text style={styles.subtitle}>{t('choose_lab_for_tests')}</Text>

      <View style={styles.labList}>
        {labs.map((lab) => (
          <TouchableOpacity
            key={lab.id}
            style={[styles.labCard, selectedLab?.id === lab.id && styles.labCardSelected]}
            onPress={() => setSelectedLab(lab)}
          >
            <View style={[styles.labColor, { backgroundColor: lab.primaryColor || '#1A237E' }]} />
            <View style={styles.labInfo}>
              <Text style={styles.labName}>{lab.name}</Text>
              <Text style={styles.labLocation}>{lab.location || 'Location not specified'}</Text>
            </View>
            {selectedLab?.id === lab.id && (
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.nextButton, !selectedLab && styles.disabledButton]}
        onPress={handleNext}
        disabled={!selectedLab}
      >
        <Text style={styles.nextButtonText}>{t('next')} →</Text>
      </TouchableOpacity>
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
    marginBottom: 24,
    fontFamily: 'Poppins-Regular',
  },
  labList: {
    flex: 1,
  },
  labCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  labCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  labColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
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
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  nextButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonText: {
    color: '#1A237E',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default Step1_PersonalInfo;