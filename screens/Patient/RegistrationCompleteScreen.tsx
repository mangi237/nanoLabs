// screens/patient/RegistrationCompleteScreen.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';

const RegistrationCompleteScreen = ({ navigation, route }: any) => {
  const { t } = useLanguage();
  const { primaryColor } = useTheme();
  const { accessCode, patientName, labName } = route.params || {};

  const handleCopyCode = () => {
    // Copy access code to clipboard
    Alert.alert('✅ Copied!', 'Access code copied to clipboard');
  };

  const handleGoToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'LoginScreen' }],
    });
  };
  return (
    <ScrollView style={[styles.container, { backgroundColor: primaryColor }]}>
      <div style={styles.content}>
        {/* Success Animation */}
        <div style={styles.successIconContainer}>
          <div style={styles.successCircle}>
            <Ionicons name="checkmark" size={60} color="white" />
          </view
          <div style={styles.successRing} />
        </view

        <Text style={styles.title}>🎉 Registration Complete!</Text>
        <Text style={styles.subtitle}>
          Your account has been created successfully.
        </Text>

        {/* Patient Info Card */}
        <div style={styles.infoCard}>
          <div style={styles.infoRow}>
            <Text style={styles.infoLabel}>Patient Name</Text>
            <Text style={styles.infoValue}>{patientName || 'N/A'}</Text>
          </view
          <div style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lab</Text>
            <Text style={styles.infoValue}>{labName || 'N/A'}</Text>
          </view
        </view

        {/* Access Code Card */}
        <div style={styles.codeCard}>
          <Text style={styles.codeLabel}>🔑 Your Access Code</Text>
          <Text style={styles.codeValue}>{accessCode || 'N/A'}</Text>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
            <Ionicons name="copy" size={18} color="#1A237E" />
            <Text style={styles.copyText}>Copy Code</Text>
          </TouchableOpacity>
        </view

        {/* Warning Card */}
        <div style={styles.warningCard}>
          <Ionicons name="information-circle" size={24} color="#FF9800" />
          <div style={styles.warningContent}>
            <Text style={styles.warningTitle}>⚠️ Awaiting Confirmation</Text>
            <Text style={styles.warningText}>
              Please visit the receptionist at {labName || 'the lab'} to confirm your registration.
              {'\n\n'}
              After confirmation, you will be able to:
              {'\n'}• Login with your access code
              {'\n'}• View your test results
              {'\n'}• Request virtual results
              {'\n'}• Track your test progress
            </Text>
          </view
        </view

        {/* What's Next */}
        <div style={styles.nextStepsCard}>
          <Text style={styles.nextStepsTitle}>📋 Next Steps</Text>
          <div style={styles.stepItem}>
            <div style={styles.stepNumber}>1</view
            <Text style={styles.stepText}>Go to the receptionist at {labName || 'the lab'}</Text>
          </view
          <div style={styles.stepItem}>
            <div style={styles.stepNumber}>2</view
            <Text style={styles.stepText}>Provide your access code: {accessCode || 'N/A'}</Text>
          </view
          <div style={styles.stepItem}>
            <div style={styles.stepNumber}>3</view
            <Text style={styles.stepText}>Wait for confirmation from the receptionist</Text>
          </view
          <div style={styles.stepItem}>
            <div style={styles.stepNumber}>4</view
            <Text style={styles.stepText}>Login with your access code to access your dashboard</Text>
          </view
        </view

        {/* Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleGoToLogin}>
          <Text style={styles.loginButtonText}>Go to Login</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Having trouble? Contact the lab support team.
        </Text>
      </view
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  successIconContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  successRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    top: -10,
    left: -10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
    marginBottom: 24,
  },
  infoCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  infoLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  infoValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  codeCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  codeLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  codeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A237E',
    letterSpacing: 6,
    marginVertical: 8,
    fontFamily: 'Poppins-Bold',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  copyText: {
    color: '#1A237E',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  warningCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    color: '#FF9800',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
    marginBottom: 4,
  },
  warningText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
  },
  nextStepsCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  nextStepsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    fontFamily: 'Poppins-Bold',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  stepText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    flex: 1,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 10,
    width: '100%',
  },
  loginButtonText: {
    color: '#1A237E',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 16,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
});

export default RegistrationCompleteScreen;