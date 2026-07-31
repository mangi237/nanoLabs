// screens/auth/LoginScreen.tsx - COMPLETE FIXED VERSION
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
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';

const LoginScreen = ({ navigation }: any) => {
  const { t } = useLanguage();
  const { primaryColor } = useTheme();
  const { login, isLoading, getAllLabs } = useAuth();
  const [accessCode, setAccessCode] = useState('');
  const [labId, setLabId] = useState('');
  const [labName, setLabName] = useState('');
  const [showLabSelector, setShowLabSelector] = useState(false);
  const [labs, setLabs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const labList = await getAllLabs();
      setLabs(labList || []);
    } catch (error) {
      console.error('Error fetching labs:', error);
    }
  };

  const handleLogin = async () => {
    if (!accessCode.trim()) {
      Alert.alert('Error', 'Please enter your access code');
      return;
    }

    try {
      const result = await login(accessCode, labId);
      
      if (result.success) {
        const role = result.user?.role || 'staff';
        
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
      Alert.alert('Error', error.message || 'Invalid credentials');
    }
  };

  const filteredLabs = labs.filter((lab: any) =>
    lab.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lab.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: primaryColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.loginContainer}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>🧪 nanoLabs</Text>
          <Text style={styles.logoSubtitle}>Login to your lab</Text>

          {/* Lab Selector */}
          <TouchableOpacity 
            style={styles.labSelector}
            onPress={() => setShowLabSelector(!showLabSelector)}
          >
            <Ionicons name="business" size={20} color="rgba(255,255,255,0.7)" />
            <Text style={styles.labSelectorText}>
              {labName || 'Select Your Lab'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          {showLabSelector && (
            <View style={styles.labListContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search lab..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="rgba(0,0,0,0.5)"
              />
              <ScrollView style={{ maxHeight: 200 }}>
                {filteredLabs.map((lab: any) => (
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
                      <Text style={styles.labItemLocation}>{lab.location || 'No location'}</Text>
                    </View>
                    {labId === lab.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Access Code Input */}
          <TextInput
            style={styles.input}
            placeholder="Enter your access code"
            value={accessCode}
            onChangeText={setAccessCode}
            secureTextEntry
            autoCapitalize="none"
            placeholderTextColor="rgba(255,255,255,0.7)"
          />

          {/* Super Admin Hint */}
          <Text style={styles.superAdminHint}>
            👑 Super Admin: Use "SUPER123"
          </Text>

          {/* Login Button */}
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#1A237E" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => navigation.navigate('RegisterScreen')}
          >
            <Text style={styles.registerText}>
              New patient? Register here
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loginContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
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
    maxHeight: 300,
    marginBottom: 16,
    position: 'absolute',
    top: 200,
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
    marginBottom: 12,
    fontSize: 16,
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.1)',
    fontFamily: 'Poppins-Regular',
  },
  superAdminHint: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginBottom: 16,
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