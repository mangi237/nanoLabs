import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import Lab from '../../types/Lab';
const LoginScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { primaryColor } = useTheme();
  const { login, isLoading, getAllLabs } = useAuth();
  const [accessCode, setAccessCode] = useState('');
  const [labId, setLabId] = useState('');
  const [labName, setLabName] = useState('');
  const [showLabSelector, setShowLabSelector] = useState(false);
  const [labs, setLabs] = useState<Lab[]>([]); 
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const labList = await getAllLabs();
      setLabs(labList);
    } catch (error) {
      console.error('Error fetching labs:', error);
    }
  };

  const handleLogin = async () => {
    if (!accessCode.trim() || !labId.trim()) {
      Alert.alert(t('error'), t('fill_all_fields'));
      return;
    }

    try {
      const result = await login(accessCode, labId);
      
      if (result.success) {
        const role = result.user.roles?.[0] || result.user.role || 'staff';
        
        switch(role) {
          case 'patient':
            navigation.replace('PatientDashboard');
            break;
          case 'superadmin':
            navigation.replace('SuperAdminDashboard');
            break;
          case 'admin':
            navigation.replace('AdminDashboard');
            break;
          default:
            navigation.replace('StaffDashboard');
        }
      }
    } catch (error: any) {
      Alert.alert(t('error'), error.message || t('invalid_credentials'));
    }
  };

  const filteredLabs = labs.filter(lab =>
    lab.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lab.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: primaryColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.loginContainer}>
        <Image 
          source={require('../../assets/images/logo.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>🧪 nanoLabs</Text>
        <Text style={styles.logoSubtitle}>{t('login_to_your_lab')}</Text>

        <TouchableOpacity 
          style={styles.labSelector}
          onPress={() => setShowLabSelector(!showLabSelector)}
        >
          <Ionicons name="business" size={20} color="rgba(255,255,255,0.7)" />
          <Text style={styles.labSelectorText}>
            {labName || t('select_your_lab')}
          </Text>
          <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {showLabSelector && (
          <View style={styles.labListContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={t('search_lab')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
            {filteredLabs.map((lab) => (
              <TouchableOpacity
                key={lab.id}
                style={styles.labItem}
                onPress={() => {
                  setLabId(lab.id);
                  setLabName(lab.name);
                  setShowLabSelector(false);
                  setSearchQuery('');
                }}
              >
                <View style={[styles.labColorDot, { backgroundColor: lab.primaryColor || '#1A237E' }]} />
                <View style={styles.labItemInfo}>
                  <Text style={styles.labItemName}>{lab.name}</Text>
                  <Text style={styles.labItemLocation}>{lab.location}</Text>
                </View>
                {labId === lab.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder={t('access_code')}
          value={accessCode}
          onChangeText={setAccessCode}
          secureTextEntry
          placeholderTextColor="rgba(255,255,255,0.7)"
        />

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#1A237E" />
          ) : (
            <Text style={styles.loginButtonText}>{t('login')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.registerButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerText}>
            {t('new_patient_register_here')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loginContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Poppins-Bold',
  },
  logoSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 30,
    fontFamily: 'Poppins-Regular',
  },
  labSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  labSelectorText: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
    fontFamily: 'Poppins-Regular',
  },
  labListContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    maxHeight: 250,
    marginBottom: 16,
    position: 'absolute',
    top: 180,
    zIndex: 1000,
    elevation: 5,
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    fontFamily: 'Poppins-Regular',
  },
  labItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  labColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  labItemInfo: {
    flex: 1,
  },
  labItemName: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins-Medium',
  },
  labItemLocation: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 16,
    fontSize: 16,
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.1)',
    fontFamily: 'Poppins-Regular',
  },
  loginButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: '#1A237E',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  registerButton: {
    padding: 8,
  },
  registerText: {
    color: 'white',
    fontSize: 14,
    textDecorationLine: 'underline',
    fontFamily: 'Poppins-Regular',
  },
});

export default LoginScreen;