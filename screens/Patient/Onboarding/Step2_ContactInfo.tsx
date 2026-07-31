import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/languageContext';
import { useTheme } from '../../../context/themeContext';

const Step2_ContactInfo = ({ navigation, route }: any) => {
  const { t } = useLanguage();
  const { primaryColor } = useTheme();
  const { patientData } = route.params || {};
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    address: '',
    emergencyContact: '',
    guardianName: ''
  });

  const handleNext = () => {
    if (!formData.phone.trim() || !formData.email.trim()) {
      alert(t('fill_required_fields'));
      return;
    }
    navigation.navigate('Step3_HealthInfo', { 
      patientData: { ...patientData, ...formData }
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: primaryColor }]}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '33%' }]} />
      </View>
      <Text style={styles.stepText}>Step 2/6</Text>
      
      <Text style={styles.title}>{t('contact_info')}</Text>
      <Text style={styles.subtitle}>{t('how_to_reach_you')}</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder={t('phone_number')}
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          keyboardType="phone-pad"
          placeholderTextColor="rgba(255,255,255,0.7)"
        />
        
        <TextInput
          style={styles.input}
          placeholder={t('email_address')}
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="rgba(255,255,255,0.7)"
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={t('address')}
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          multiline
          numberOfLines={3}
          placeholderTextColor="rgba(255,255,255,0.7)"
        />

        <TextInput
          style={styles.input}
          placeholder={t('emergency_contact')}
          value={formData.emergencyContact}
          onChangeText={(text) => setFormData({ ...formData, emergencyContact: text })}
          keyboardType="phone-pad"
          placeholderTextColor="rgba(255,255,255,0.7)"
        />

        <TextInput
          style={styles.input}
          placeholder={t('guardian_name')}
          value={formData.guardianName}
          onChangeText={(text) => setFormData({ ...formData, guardianName: text })}
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
    minHeight: 80,
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

export default Step2_ContactInfo;