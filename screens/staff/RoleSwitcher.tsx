import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';

const RoleSwitcher = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { user } = useAuth();

  const roles = user?.roles || [user?.primaryRole || 'receptionist'];

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
    navigation.navigate('StaffDashboard', { activeRole: role });
  };

  const renderRoleItem = ({ item }: any) => (
    <TouchableOpacity 
      style={[styles.roleItem, { backgroundColor: colors.surface }]}
      onPress={() => handleSwitchRole(item)}
    >
      <View style={[styles.roleIcon, { backgroundColor: colors.primary + '20' }]}>
       {/* { <Ionicons name={roleIcons[item] || 'person'} size={30} color={colors.primary} /> || <Text>User</Text>} */}
      <Text>User</Text>
      </View>
      <View style={styles.roleInfo}>
        <Text style={styles.roleName}>{roleNames[item] || item}</Text>
        <Text style={styles.roleDescription}>{t('switch_to')} {roleNames[item] || item}</Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('switch_role')}</Text>
        <Text style={styles.subtitle}>{t('select_role_to_switch')}</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
  roleDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
});

export default RoleSwitcher;