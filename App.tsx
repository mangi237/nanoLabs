// App.js
import React, { useCallback, useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './context/authContext';
import { initializeEmailJS } from './services/emailService';
import CategorySelection from './screens/categorySelection';
import LoginScreen from './screens/authentication/authScreen'; // Fixed path - from authentication/authScreen to auth/LoginScreen
import AdminDashboard from './screens/admin/adminDashboard';
import DoctorDashboard from './screens/doctor/ReceptionistDashboard';
import LabDashboard from './screens/lab/LabDashboard';
import PharmacistDashboard from './screens/pharmacist/pharmacistDashboard';
import PatientDetailsScreen from './screens/PatientDetailsScreen';
import PortalSelection from './screens/authentication/PortalSelection';
import ReceptionistDashboard from './screens/doctor/ReceptionistDashboard';
import CashierDashboard from './screens/cashier/CashierDashboard';
import AnalyzerDashboard from './screens/Analyzer/AnalyzerDashboard';
import PatientLogin from './screens/authentication/PatientLogin';
import PatientViewDetailsScreen from './screens/Patient/PatientDashboard'; // Fixed path and component name
import NurseDashboard from './screens/nurse/NurseDashboard';
import MainDoctorDashboard from './screens/doctor/MainDoctorDashboard';
import RadiologyDashboard from './screens/Radiology/RadiologyDashboard';
import SurgeonDashboard from './screens/Surgeon/SurgeonDashboard';
import WardDashboard from './screens/Ward/WardDashboard';
import SuperAdminDashboard from './screens/superAdmin/SuperAdminDashboard';
import EmergencyDashboard from './screens/Emergency/EmergencyDashboard';
import DispenseMedicationModal from './screens/pharmacist/pharmacistDashboard';
import HospitalDetailsScreen from './screens/superAdmin/HosptialDetailsScreen';
import UnifiedDashboard from './screens/UnifiedDashboard';
// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

export default function App() {
  initializeEmailJS('service_zjlxy2x','gTiUtFIwwHMJYEIeY ');
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Regular': require('./assets/fonts/Poppins/Poppins-Regular.ttf'),
    'Poppins-Medium': require('./assets/fonts/Poppins/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('./assets/fonts/Poppins/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('./assets/fonts/Poppins/Poppins-Bold.ttf'),
  });

  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load any other resources here
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady, fontsLoaded]);

  if (!appIsReady || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#013220' }}>
        <Text style={{ color: 'white', fontSize: 24, fontFamily: 'Poppins-Bold' }}>Nano Technologies Made By Mangi</Text>
        <Text style={{ color: 'white', fontSize: 16, marginTop: 10 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator 
            initialRouteName="LoginScreen" 
            screenOptions={{ 
              headerShown: true,
              headerStyle: {
                backgroundColor: '#1E96A9',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontFamily: 'Poppins-SemiBold',
              },
              cardStyleInterpolator: ({ current, layouts }) => {
                return {
                  cardStyle: {
                    transform: [
                      {
                        translateX: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [layouts.screen.width, 0],
                        }),
                      },
                    ],
                  },
                };
              },
            }}
          >
            {/* Authentication Screens */}
            <Stack.Screen 
              name="PortalSelection" 
              component={PortalSelection} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
  name="hospitalDetailsScreen" 
  component={HospitalDetailsScreen}
  options={{ 
    title: 'Hospital Details',
    headerShown: true 
  }}
/>
            <Stack.Screen 
              name="LoginScreen" 
              component={LoginScreen} 
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="PatientLogin" 
              component={PatientLogin} 
              options={{ title: 'Patient Login' }}
            />
            
            {/* Main Dashboards */}
            <Stack.Screen 
              name="AdminDashboard" 
              component={AdminDashboard} 
              options={{ title: 'Admin Dashboard' }}
            />
            <Stack.Screen 
              name="SuperAdminDashboard" 
              component={SuperAdminDashboard} 
              options={{ title: 'Super Admin Dashboard' }}
            />
            <Stack.Screen 
              name="ReceptionistDashboard" 
              component={ReceptionistDashboard} 
              options={{ title: 'Receptionist Dashboard' }}
            />
            <Stack.Screen 
              name="DoctorDashboard" 
              component={MainDoctorDashboard} 
              options={{ title: 'Doctor Dashboard' }}
            />
            <Stack.Screen 
              name="NurseDashboard" 
              component={NurseDashboard} 
              options={{ title: 'Nurse Dashboard' }}
            />
            <Stack.Screen 
              name="LabDashboard" 
              component={LabDashboard} 
              options={{ title: 'Lab Dashboard' }}
            />
            <Stack.Screen 
              name="PharmacistDashboard" 
              component={DispenseMedicationModal} 
              options={{ title: 'Pharmacist Dashboard' }}
            />
            <Stack.Screen 
              name="CashierDashboard" 
              component={CashierDashboard} 
              options={{ title: 'Cashier Dashboard' }}
            />
            <Stack.Screen 
              name="AnalyzerDashboard" 
              component={AnalyzerDashboard} 
              options={{ title: 'Analyzer Dashboard' }}
            />
            <Stack.Screen 
              name="RadiologyDashboard" 
              component={RadiologyDashboard} 
              options={{ title: 'Radiology Dashboard' }}
            />
            <Stack.Screen 
              name="SurgeonDashboard" 
              component={SurgeonDashboard} 
              options={{ title: 'Surgeon Dashboard' }}
            />
            <Stack.Screen 
              name="WardDashboard" 
              component={WardDashboard} 
              options={{ title: 'Ward Dashboard' }}
            />
            <Stack.Screen 
              name="EmergencyDashboard" 
              component={EmergencyDashboard} 
              options={{ title: 'Emergency Dashboard' }}
            />
            
            {/* Patient Screens - CRITICAL FIXES HERE */}
            <Stack.Screen 
              name="PatientDetails" 
              component={PatientDetailsScreen}
              options={{ 
                title: 'Patient Details',
                headerShown: true
              }}
            />
            <Stack.Screen 
              name="PatientViewDetailsScreen" 
              component={PatientViewDetailsScreen}
              options={{
                title: 'Patient Dashboard',
                headerShown: true
              }}
            />
            
            {/* Other Screens */}
            <Stack.Screen 
              name="CategorySelection" 
              component={CategorySelection}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
  name="UnifiedDashboard" 
  component={UnifiedDashboard}
  options={{ 
    headerShown: false,
    title: 'Dashboard'
  }}
/>
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </View>
  );
}

// Fix import paths in your LoginScreen.tsx