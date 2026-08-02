// App.tsx
import React, { useCallback, useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './context/authContext';
import { LanguageProvider } from './context/languageContext';
import { ThemeProvider } from './context/themeContext';
import LabRegistrationModal from './screens/superAdmin/LabRegistrationModal';
// Import ALL screens
import AddStaffModal from './screens/admin/AddStaffModal';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import LabSelectionScreen from './screens/auth/LabSelectionScreen';
import ForgotCodeScreen from './screens/auth/ForgotCodeScreen';
import ProfileScreen from './screens/ProfileScreen';
import NotificationsScreen from './screens/NotificationScreen';
// Import Patient Screens
import PatientDashboard from './screens/Patient/PatientDashboard';
import TestHistoryScreen from './screens/Patient/TestHistoryScreen';
import ResultViewScreen from './screens/Patient/ResultViewScreen';
import TransferScreen from './screens/Patient/TransferScreen';
import ShareResultsScreen from './screens/Patient/ShareResultsScreen';

// Import Patient Onboarding Steps
import Step1_PersonalInfo from './screens/Patient/Onboarding/Step1_personalInfo';
import Step2_ContactInfo from './screens/Patient/Onboarding/Step2_ContactInfo';
import Step3_HealthInfo from './screens/Patient/Onboarding/Step3_HealthInfo';
import Step4_Insurance from './screens/Patient/Onboarding/Step4_Insurance';
import Step5_SelectTests from './screens/Patient/Onboarding/Step5_SelectTests';
import Step6_AccessCode from './screens/Patient/Onboarding/Step6_AccessCode';

// Import Staff Screens
import StaffDashboard from './screens/staff/StaffDashboard';
import RoleSwitcher from './screens/staff/RoleSwitcher';
import ReceptionistView from './screens/staff/ReceptionistView';
import CashierView from './screens/staff/CashierView';
import AnalyzerView from './screens/staff/AnalyzerView';
import LabTechView from './screens/staff/LabTechView';

// Import Admin Screens
import AdminDashboard from './screens/admin/adminDashboard';
import PatientManagement from './screens/admin/PatientManagement';
import StaffManagement from './screens/admin/StaffManagement';
import TestCatalogManagement from './screens/admin/TestCatalogManagement';
import InventoryManagement from './screens/admin/InventoryManagement';

import ReportsScreen from './screens/admin/ReportsScreen';

// Import Super Admin Screens
import SuperAdminDashboard from './screens/superAdmin/SuperAdminDashboard';
import LabDetailsScreen from './screens/superAdmin/LabDetailsScreen';
import RegistrationCompleteScreen from './screens/Patient/RegistrationCompleteScreen';
// Import Cashier, Lab, etc.
import CashierDashboard from './screens/cashier/CashierDashboard';
import LabDashboard from './screens/lab/LabDashboard';

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

export default function App() {
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
        await new Promise(resolve => setTimeout(resolve, 1000));
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
        <Text style={{ color: 'white', fontSize: 24, fontFamily: 'Poppins-Bold' }}> nanoLabs</Text>
        <Text style={{ color: 'white', fontSize: 16, marginTop: 10, fontFamily: 'Poppins-Regular' }}>
          Loading...
        </Text>
      </View>
    );
  }
  console.log('App rendering, fontsLoaded:', fontsLoaded, 'appIsReady:', appIsReady);
  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <NavigationContainer>
              <Stack.Navigator 
                initialRouteName="LoginScreen"
                screenOptions={{ 
                  headerShown: true,
                  headerStyle: {
                    backgroundColor: '#1A237E',
                  },
                  headerTintColor: '#fff',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                    fontFamily: 'Poppins-SemiBold',
                  },
                }}
              >
                {/* ============ AUTH SCREENS ============ */}
                <Stack.Screen 
                  name="LoginScreen" 
                  component={LoginScreen}
                  options={{ headerShown: false }}
                />
                {/* <Stack.Screen 
                  name="RegisterScreen" 
                  component={RegisterScreen}
                  options={{ 
                    title: 'Register as Patient',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                /> */}
                <Stack.Screen 
                  name="LabSelectionScreen" 
                  component={LabSelectionScreen}
                  options={{ 
                    title: 'Select Your Lab',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
                  name="ForgotCodeScreen" 
                  component={ForgotCodeScreen}
                  options={{ 
                    title: 'Forgot Access Code',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />

                {/* ============ PATIENT ONBOARDING ============ */}
                <Stack.Screen 
                  name="Step1_PersonalInfo" 
                  component={Step1_PersonalInfo}
                  options={{ 
                    title: 'Step 1: Personal Info',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
                  name="Step2_ContactInfo" 
                  component={Step2_ContactInfo}
                  options={{ 
                    title: 'Step 2: Contact Info',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
  name="RegistrationCompleteScreen" 
  component={RegistrationCompleteScreen}
  options={{ 
    headerShown: false
  }}
/>
                <Stack.Screen 
                  name="Step3_HealthInfo" 
                  component={Step3_HealthInfo}
                  options={{ 
                    title: 'Step 3: Health Info',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
                  name="Step4_Insurance" 
                  component={Step4_Insurance}
                  options={{ 
                    title: 'Step 4: Insurance (Optional)',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                {/* <Stack.Screen 
                  name="Step5_SelectTests" 
                  component={Step5_SelectTests}
                  options={{ 
                    title: 'Step 5: Select Tests',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                /> */}
                <Stack.Screen 
                  name="Step6_AccessCode" 
                  component={Step6_AccessCode}
                  options={{ 
                    title: 'Step 6: Create Access Code',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />

                {/* ============ PATIENT DASHBOARD ============ */}
                <Stack.Screen 
                  name="PatientDashboard" 
                  component={PatientDashboard}
                  options={{ 
                    title: 'My Dashboard',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
                  name="TestHistoryScreen" 
                  component={TestHistoryScreen}
                  options={{ 
                    title: 'Test History',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
                  name="ResultViewScreen" 
                  component={ResultViewScreen}
                  options={{ 
                    title: 'Test Results',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
                  name="TransferScreen" 
                  component={TransferScreen}
                  options={{ 
                    title: 'Transfer Lab',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
                  name="ShareResultsScreen" 
                  component={ShareResultsScreen}
                  options={{ 
                    title: 'Share Results',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />

                {/* ============ STAFF DASHBOARD (Multi-Role) ============ */}
                <Stack.Screen 
                  name="StaffDashboard" 
                  component={StaffDashboard}
                  options={{ 
                    title: 'Staff Dashboard',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
  name="ProfileScreen" 
  component={ProfileScreen}
  options={{ 
    title: 'Profile',
    headerShown: true,
    headerStyle: { backgroundColor: '#1A237E' }
  }}
/>
<Stack.Screen 
  name="NotificationScreen" 
  component={NotificationsScreen}
  options={{ 
    title: 'Notifications',
    headerShown: true,
    headerStyle: { backgroundColor: '#1A237E' }
  }}
/>
                <Stack.Screen 
                  name="RoleSwitcher" 
                  component={RoleSwitcher}
                  options={{ 
                    title: 'Switch Role',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
                  name="ReceptionistView" 
                  component={ReceptionistView}
                  options={{ 
                    title: 'Receptionist',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
                  name="CashierView" 
                  component={CashierView}
                  options={{ 
                    title: 'Cashier',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
                  name="AnalyzerView" 
                  component={AnalyzerView}
                  options={{ 
                    title: 'Analyzer',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
                  name="LabTechView" 
                  component={LabTechView}
                  options={{ 
                    title: 'Lab Technician',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />

                {/* ============ ADMIN DASHBOARD ============ */}
                <Stack.Screen 
                  name="AdminDashboard" 
                  component={AdminDashboard}
                  options={{ 
                    title: 'Admin Dashboard',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
                  name="PatientManagement" 
                  component={PatientManagement}
                  options={{ 
                    title: 'Manage Patients',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
                  name="StaffManagement" 
                  component={StaffManagement}
                  options={{ 
                    title: 'Manage Staff',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
                  name="TestCatalogManagement" 
                  component={TestCatalogManagement}
                  options={{ 
                    title: 'Test Catalog',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
                  name="InventoryManagement" 
                  component={InventoryManagement}
                  options={{ 
                    title: 'Inventory Management',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
                  name="ReportsScreen" 
                  component={ReportsScreen}
                  options={{ 
                    title: 'Reports & Analytics',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />

                {/* ============ SUPER ADMIN ============ */}
                <Stack.Screen 
                  name="SuperAdminDashboard" 
                  component={SuperAdminDashboard}
                  options={{ 
                    title: 'Super Admin',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
                  name="LabDetailsScreen" 
                  component={LabDetailsScreen}
                  options={{ 
                    title: 'Lab Details',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />

                {/* ============ OTHER DASHBOARDS ============ */}
                <Stack.Screen 
                  name="CashierDashboard" 
                  component={CashierDashboard}
                  options={{ 
                    title: 'Cashier',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
  name="AddStaffModal" 
  component={AddStaffModal}
  options={{ 
    title: 'Add Staff',
    headerShown: true,
    headerStyle: { backgroundColor: '#1A237E' }
  }}
/>
                <Stack.Screen 
                  name="LabDashboard" 
                  component={LabDashboard}
                  options={{ 
                    title: 'Lab',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
                <Stack.Screen 
  name="LabRegistrationModal" 
  component={LabRegistrationModal}
  options={{
    title: 'Create New Lab',
    headerShown: true,
    headerStyle: { backgroundColor: '#1A237E' }
  }}
/>
<Stack.Screen 
  name="RegisterScreen" 
  component={RegisterScreen}
  options={{ 
    title: 'Register as Patient',
    headerShown: true,
    headerStyle: { backgroundColor: '#1A237E' }
  }}
/>
                {/* ============ FALLBACK ============ */}
                <Stack.Screen 
                  name="UnifiedDashboard" 
                  component={LoginScreen}
                  options={{ 
                    title: 'Dashboard',
                    headerShown: true,
                    headerStyle: { backgroundColor: '#1A237E' }
                  }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </View>
  );
}