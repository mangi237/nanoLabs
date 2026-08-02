// screens/staff/RoleSwitcher.tsx - FIXED
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';

const RoleSwitcher = ({ navigation, route }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { user } = useAuth();

  const roles = user?.roles || [user?.primaryRole || 'receptionist'];
  const currentRole = route.params?.currentRole || roles[0];

  const roleIcons: { [key: string]: string } = {
    receptionist: 'person-outline',
    cashier: 'cash-outline',
    analyzer: 'flask-outline',
    lab_tech: 'medical-outline',
    admin: 'shield-outline',
  };

  const roleNames: { [key: string]: string } = {
    receptionist: 'Receptionist',
    cashier: 'Cashier',
    analyzer: 'Analyzer',
    lab_tech: 'Lab Technician',
    admin: 'Admin',
  };

  const handleSwitchRole = (role: string) => {
    navigation.replace('StaffDashboard', { activeRole: role });
  };

  const renderRoleItem = ({ item }: any) => (
    <TouchableOpacity 
      style={[
        styles.roleItem, 
        { backgroundColor: currentRole === item ? colors.primary : colors.surface },
        currentRole === item && styles.roleItemActive
      ]}
      onPress={() => handleSwitchRole(item)}
    >
      <View style={[styles.roleIcon, { backgroundColor: currentRole === item ? 'rgba(255,255,255,0.2)' : colors.primary + '20' }]}>
        <Ionicons 
          name={roleIcons[item] || 'person'} 
          size={28} 
          color={currentRole === item ? 'white' : colors.primary} 
        />
      </View>
      <View style={styles.roleInfo}>
        <Text style={[styles.roleName, currentRole === item && styles.roleNameActive]}>
          {roleNames[item] || item}
        </Text>
        <Text style={[styles.roleDescription, currentRole === item && styles.roleDescriptionActive]}>
          {currentRole === item ? 'Active Role' : 'Switch to this role'}
        </Text>
      </View>
      {currentRole === item && (
        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.title}>🔄 Switch Role</Text>
        <Text style={styles.subtitle}>Select which role you want to use</Text>
      </View>

      <FlatList
        data={roles}
        renderItem={renderRoleItem}
        keyExtractor={item => item}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A237E',
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  listContent: {
    paddingHorizontal: 16,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  roleItemActive: {
    elevation: 4,
  },
  roleIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Poppins-SemiBold',
  },
  roleNameActive: {
    color: 'white',
  },
  roleDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  roleDescriptionActive: {
    color: 'rgba(255,255,255,0.7)',
  },
});

export default RoleSwitcher;