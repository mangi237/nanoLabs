import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/languageContext';
import { useTheme } from '../../../context/themeContext';

const Step3_HealthInfo = ({ navigation, route }: any) => {
  const { t } = useLanguage();
  const { primaryColor } = useTheme();
  const { patientData } = route.params || {};
  const [formData, setFormData] = useState({
    bloodType: '',
    allergies: '',
    medicalConditions: '',
    currentMedications: ''
  });

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-','Do not know'];

  const handleNext = () => {
    navigation.navigate('Step4_Insurance', { 
      patientData: { ...patientData, ...formData }
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: primaryColor }]}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '50%' }]} />
      </View>
      <Text style={styles.stepText}>Step 3/6</Text>
      
      <Text style={styles.title}>{t('health_info')}</Text>
      <Text style={styles.subtitle}>{t('tell_us_about_your_health')}</Text>

      <View style={styles.form}>
        <Text style={styles.label}>{t('blood_type')}</Text>
        <View style={styles.bloodTypeGrid}>
          {bloodTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.bloodTypeOption, formData.bloodType === type && styles.bloodTypeSelected]}
              onPress={() => setFormData({ ...formData, bloodType: type })}
            >
              <Text style={[styles.bloodTypeText, formData.bloodType === type && styles.bloodTypeTextSelected]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder={t('allergies')}
          value={formData.allergies}
          onChangeText={(text) => setFormData({ ...formData, allergies: text })}
          placeholderTextColor="rgba(255,255,255,0.7)"
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={t('medical_conditions')}
          value={formData.medicalConditions}
          onChangeText={(text) => setFormData({ ...formData, medicalConditions: text })}
          multiline
          numberOfLines={2}
          placeholderTextColor="rgba(255,255,255,0.7)"
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={t('current_medications')}
          value={formData.currentMedications}
          onChangeText={(text) => setFormData({ ...formData, currentMedications: text })}
          multiline
          numberOfLines={2}
          placeholderTextColor="rgba(255,255,255,0.7)"
        />

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
    marginBottom: 30,
    fontFamily: 'Poppins-Regular',
  },
  form: {
    flex: 1,
  },
  label: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
    fontFamily: 'Poppins-Medium',
  },
  bloodTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  bloodTypeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bloodTypeSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderColor: 'white',
  },
  bloodTypeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  bloodTypeTextSelected: {
    color: 'white',
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
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  nextButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  nextButtonText: {
    color: '#1A237E',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
});

export default Step3_HealthInfo;