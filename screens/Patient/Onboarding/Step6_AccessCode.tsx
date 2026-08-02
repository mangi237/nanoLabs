// screens/patient/Onboarding/Step6_AccessCode.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/authContext';
import { useLanguage } from '../../../context/languageContext';
import { useTheme } from '../../../context/themeContext';

const Step6_AccessCode = ({ navigation, route }: any) => {
  const { t } = useLanguage();
  const { primaryColor } = useTheme();
  const { registerPatient } = useAuth();
  const { patientData } = route.params || {};
  const [accessCode, setAccessCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleGenerate = () => {
    const code = generateCode();
    setAccessCode(code);
    setConfirmCode(code);
  };

  const handleRegister = async () => {
    if (isSubmitting) return; 
    if (!accessCode.trim() || !confirmCode.trim()) {
      Alert.alert(t('error'), t('enter_access_code'));
      return;
    }
    if (accessCode !== confirmCode) {
      Alert.alert(t('error'), t('codes_do_not_match'));
      return;
    }
    if (!agreed) {
      Alert.alert(t('error'), t('agree_to_terms'));
      return;
    }

    setLoading(true);
    setIsSubmitting(true);
    try {
      // Get labId from route
      const labId = route.params?.labId || 'lab1';
      
      const result = await registerPatient(labId, {
        ...patientData,
        accessCode,
        status: 'pending'
      });

     // Replace the handleRegister success with:
if (result.success) {
  navigation.reset({
    index: 0,
    routes: [
      { 
        name: 'RegistrationCompleteScreen', 
        params: {
          accessCode: accessCode,
          patientName: patientData?.name || 'Patient',
          labName: route.params?.labName || route.params?.selectedLabName || 'Lab'
        }
      }
    ],
  });
}else {
        Alert.alert(t('error'), result.error || t('registration_failed'));
      }
    } catch (error: any) {
      Alert.alert(t('error'), error.message || t('registration_failed'));
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: primaryColor }]}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '100%' }]} />
      </View>
      <Text style={styles.stepText}>Step 6/6</Text>
      
      <Text style={styles.title}>🔐 {t('create_access_code')}</Text>
      <Text style={styles.subtitle}>{t('secure_your_account')}</Text>

      <View style={styles.form}>
        <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
          <Ionicons name="refresh" size={20} color="#1A237E" />
          <Text style={styles.generateButtonText}>{t('generate_code')}</Text>
        </TouchableOpacity>

        <TextInput
          style={[styles.input, styles.codeInput]}
          placeholder={t('enter_access_code')}
          value={accessCode}
          onChangeText={setAccessCode}
          maxLength={6}
          placeholderTextColor="rgba(255,255,255,0.7)"
        />

        <TextInput
          style={[styles.input, styles.codeInput]}
          placeholder={t('confirm_access_code')}
          value={confirmCode}
          onChangeText={setConfirmCode}
          maxLength={6}
          placeholderTextColor="rgba(255,255,255,0.7)"
        />

        <TouchableOpacity 
          style={styles.termsContainer}
          onPress={() => setAgreed(!agreed)}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Ionicons name="checkmark" size={16} color="white" />}
          </View>
          <Text style={styles.termsText}>
            {t('i_agree_to_terms')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.registerButton, (!agreed || loading) && styles.registerButtonDisabled]}
          onPress={handleRegister}
          disabled={!agreed || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.registerButtonText}>{t('complete_registration')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
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
  codeInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 20,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  termsText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  registerButtonDisabled: {
    backgroundColor: 'rgba(76, 175, 80, 0.5)',
  },
  registerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
});

export default Step6_AccessCode;