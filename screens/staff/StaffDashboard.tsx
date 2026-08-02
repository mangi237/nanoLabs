// screens/staff/StaffDashboard.tsx - COMPLETE FIX
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';

const StaffDashboard = ({ navigation, route }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { user, lab } = useAuth();
  
  // Get roles from user data
  const userRoles = user?.roles || [user?.primaryRole || 'receptionist'];
  const [activeRole, setActiveRole] = useState(route.params?.activeRole || userRoles[0]);

  // Update active role when route params change
  useEffect(() => {
    if (route.params?.activeRole) {
      setActiveRole(route.params.activeRole);
    }
  }, [route.params?.activeRole]);

  // Navigate to role-specific view
  const renderRoleView = () => {
    switch(activeRole) {
      case 'receptionist':
        return navigation.navigate('ReceptionistView');
      case 'cashier':
        return navigation.navigate('CashierView');
      case 'analyzer':
        return navigation.navigate('AnalyzerView');
      case 'lab_tech':
        return navigation.navigate('LabTechView');
      default:
        return navigation.navigate('ReceptionistView');
    }
  };

  const handleRoleSwitch = (role: string) => {
    setActiveRole(role);
    // Navigate to the same screen with role param to refresh view
    navigation.replace('StaffDashboard', { activeRole: role });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View>
          <Text style={styles.greeting}>👋 Welcome,</Text>
          <Text style={styles.userName}>{user?.name || 'Staff'}</Text>
          <Text style={styles.roleLabel}>{activeRole.toUpperCase()}</Text>
        </View>
        <TouchableOpacity 
          style={styles.switchButton}
          onPress={() => navigation.navigate('RoleSwitcher', { currentRole: activeRole })}
        >
          <Ionicons name="swap-horizontal" size={20} color="white" />
          <Text style={styles.switchText}>Switch</Text>
        </TouchableOpacity>
      </View>

      {/* Lab Info */}
      <View style={styles.labCard}>
        <Text style={styles.labName}>🧪 {lab?.name || 'Lab'}</Text>
        <Text style={styles.labLocation}>{lab?.location || 'Location'}</Text>
      </View>

      {/* Quick Stats for current role */}
      <View style={styles.quickStats}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="people" size={24} color={colors.primary} />
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>{t('patients')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="flask" size={24} color={colors.primary} />
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>{t('pending_tests')}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>{t('completed')}</Text>
        </View>
      </View>

      {/* Role-specific content */}
      <View style={styles.roleContent}>
        {activeRole === 'receptionist' && <ReceptionistContent navigation={navigation} />}
        {activeRole === 'cashier' && <CashierContent navigation={navigation} />}
        {activeRole === 'analyzer' && <AnalyzerContent navigation={navigation} />}
        {activeRole === 'lab_tech' && <LabTechContent navigation={navigation} />}
      </View>
    </View>
  );
};

// Role-specific content components
const ReceptionistContent = ({ navigation }: any) => (
  <View style={styles.rolePanel}>
    <Text style={styles.roleTitle}>👤 Receptionist Dashboard</Text>
    <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('PatientManagement')}>
      <Ionicons name="people" size={24} color="#1A237E" />
      <Text style={styles.actionText}>View Patients</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('RegisterPatientScreen')}>
      <Ionicons name="person-add" size={24} color="#1A237E" />
      <Text style={styles.actionText}>Register Patient</Text>
    </TouchableOpacity>
  </View>
);

const CashierContent = ({ navigation }: any) => (
  <View style={styles.rolePanel}>
    <Text style={styles.roleTitle}>💰 Cashier Dashboard</Text>
    <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('BillingScreen')}>
      <Ionicons name="cash" size={24} color="#1A237E" />
      <Text style={styles.actionText}>Process Payments</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.actionCard}>
      <Ionicons name="receipt" size={24} color="#1A237E" />
      <Text style={styles.actionText}>View Transactions</Text>
    </TouchableOpacity>
  </View>
);

const AnalyzerContent = ({ navigation }: any) => (
  <View style={styles.rolePanel}>
    <Text style={styles.roleTitle}>🔬 Analyzer Dashboard</Text>
    <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('SampleCollectionScreen')}>
      <Ionicons name="flask" size={24} color="#1A237E" />
      <Text style={styles.actionText}>Collect Samples</Text>
    </TouchableOpacity>
  </View>
);

const LabTechContent = ({ navigation }: any) => (
  <View style={styles.rolePanel}>
    <Text style={styles.roleTitle}>🧪 Lab Technician Dashboard</Text>
    <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('TestProcessingScreen')}>
      <Ionicons name="medical" size={24} color="#1A237E" />
      <Text style={styles.actionText}>Process Tests</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  userName: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  roleLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  switchText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  labCard: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
  },
  labName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A237E',
    fontFamily: 'Poppins-Bold',
  },
  labLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A237E',
    marginVertical: 4,
    fontFamily: 'Poppins-Bold',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  roleContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  rolePanel: {
    gap: 12,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 8,
    fontFamily: 'Poppins-Bold',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    elevation: 2,
  },
  actionText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins-Medium',
  },
});

export default StaffDashboard;