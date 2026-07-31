import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';

const RegisterScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { primaryColor } = useTheme();

  const handleStartRegistration = () => {
    navigation.navigate('Step1_PersonalInfo');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: primaryColor }]}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>🧪</Text>
        <Text style={styles.title}>{t('patient_registration')}</Text>
        <Text style={styles.subtitle}>{t('create_your_account')}</Text>
      </View>

      {/* Features List */}
      <View style={styles.featuresCard}>
        <Text style={styles.featuresTitle}>📋 {t('what_to_expect')}</Text>
        
        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Text style={styles.featureEmoji}>📝</Text>
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureName}>{t('personal_info')}</Text>
            <Text style={styles.featureDesc}>{t('tell_us_about_yourself')}</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Text style={styles.featureEmoji}>📞</Text>
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureName}>{t('contact_info')}</Text>
            <Text style={styles.featureDesc}>{t('how_to_reach_you')}</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Text style={styles.featureEmoji}>🩺</Text>
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureName}>{t('health_info')}</Text>
            <Text style={styles.featureDesc}>{t('tell_us_about_your_health')}</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Text style={styles.featureEmoji}>🏥</Text>
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureName}>{t('insurance_info')}</Text>
            <Text style={styles.featureDesc}>{t('optional_insurance_details')}</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Text style={styles.featureEmoji}>🔬</Text>
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureName}>{t('select_tests')}</Text>
            <Text style={styles.featureDesc}>{t('choose_tests_to_perform')}</Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Text style={styles.featureEmoji}>🔐</Text>
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureName}>{t('create_access_code')}</Text>
            <Text style={styles.featureDesc}>{t('secure_your_account')}</Text>
          </View>
        </View>
      </View>

      {/* Start Button */}
      <TouchableOpacity 
        style={styles.startButton}
        onPress={handleStartRegistration}
      >
        <Text style={styles.startButtonText}>{t('start_registration')}</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </TouchableOpacity>

      {/* Already have account */}
      <TouchableOpacity 
        style={styles.loginLink}
        onPress={() => navigation.navigate('LoginScreen')}
      >
        <Text style={styles.loginLinkText}>
          {t('already_have_account')} {t('login')}
        </Text>
      </TouchableOpacity>

      {/* Footer */}
      <Text style={styles.footerText}>
        {t('registration_takes_5_minutes')}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  backButton: {
    marginBottom: 20,
    width: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  emoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  featuresCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    fontFamily: 'Poppins-Bold',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureInfo: {
    flex: 1,
  },
  featureName: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
  },
  featureDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Poppins-Regular',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16,
  },
  startButtonText: {
    color: '#1A237E',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  loginLink: {
    alignItems: 'center',
    padding: 8,
  },
  loginLinkText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  footerText: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 20,
    fontFamily: 'Poppins-Regular',
  },
});

export default RegisterScreen;