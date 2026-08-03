import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/languageContext';
import { useTheme } from '../../../context/themeContext';

const Step4_Insurance = ({ navigation, route }: any) => {
  const { t } = useLanguage();
  const { primaryColor } = useTheme();
  const { patientData } = route.params || {};
  const [formData, setFormData] = useState({
    insuranceProvider: '',
    insuranceId: ''
  });
  const [skip, setSkip] = useState(false);

  const handleNext = () => {
    navigation.navigate('Step5_SelectTests', { 
      patientData: { ...patientData, ...formData }
    });
  };

  const handleSkip = () => {
    setSkip(true);
    navigation.navigate('Step5_SelectTests', { 
      patientData: { ...patientData, insuranceProvider: '', insuranceId: '' }
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: primaryColor }]}>
      <div style={styles.progressBar}>
        <div style={[styles.progressFill, { width: '66%' }]} />
      </div>
      <Text style={styles.stepText}>Step 4/6</Text>
      
      <Text style={styles.title}>{t('insurance_info')}</Text>
      <Text style={styles.subtitle}>{t('optional_insurance_details')}</Text>

      <div style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder={t('insurance_provider')}
          value={formData.insuranceProvider}
          onChangeText={(text) => setFormData({ ...formData, insuranceProvider: text })}
          placeholderTextColor="rgba(255,255,255,0.7)"
        />

        <TextInput
          style={styles.input}
          placeholder={t('insurance_id')}
          value={formData.insuranceId}
          onChangeText={(text) => setFormData({ ...formData, insuranceId: text })}
          placeholderTextColor="rgba(255,255,255,0.7)"
        />

        <div style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.skipButton]} onPress={handleSkip}>
            <Text style={styles.skipButtonText}>{t('skip')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.nextButton]} onPress={handleNext}>
            <Text style={styles.nextButtonText}>{t('next')} →</Text>
          </TouchableOpacity>
        </div>
      </div>
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
    marginBottom: 30,
    fontFamily: 'Poppins-Regular',
  },
  form: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.1)',
    fontFamily: 'Poppins-Regular',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  skipButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  nextButton: {
    backgroundColor: 'white',
  },
  nextButtonText: {
    color: '#1A237E',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
});

export default Step4_Insurance;