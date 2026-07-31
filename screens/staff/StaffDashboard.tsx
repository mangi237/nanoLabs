import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import RoleSwitcher from './RoleSwitcher';

const StaffDashboard = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { user, lab } = useAuth();
  const [activeRole, setActiveRole] = useState(user?.roles?.[0] || user?.primaryRole || 'receptionist');

  const roles = user?.roles || [user?.primaryRole || 'receptionist'];

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View>
          <Text style={styles.greeting}>👋 {t('welcome')},</Text>
          <Text style={styles.userName}>{user?.name || 'Staff'}</Text>
          <Text style={styles.roleLabel}>{activeRole.toUpperCase()}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.switchButton}
            onPress={() => navigation.navigate('RoleSwitcher')}
          >
            <Ionicons name="swap-horizontal" size={20} color="white" />
            <Text style={styles.switchText}>{t('switch_role')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.labCard}>
        <Text style={styles.labName}>🧪 {lab?.name || 'Lab'}</Text>
        <Text style={styles.labLocation}>{lab?.location || 'Location'}</Text>
      </View>

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

      {renderRoleView()}
    </View>
  );
};

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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
});

export default StaffDashboard;