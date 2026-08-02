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
import PatientDetailsScreen from './screens/PatientDetailsScreen';
import EditStaffModal from './screens/admin/EditStaffModal';
import AnalyticsDashboard from './screens/admin/AnalyticsDashboard';
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
  const [fontsLoaded] = useFonts({
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
        <Text style={{ color: 'white', fontSize: 24, fontFamily: 'Poppins-Bold' }}>🧪 nanoLabs</Text>
        <Text style={{ color: 'white', fontSize: 16, marginTop: 10, fontFamily: 'Poppins-Regular' }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <NavigationContainer>
              <Stack.Navigator 
                initialRouteName="LoginScreen"
                screenOptions={{ 
                  headerShown: false,
                }}
              >
                {/* ============ AUTH SCREENS ============ */}
                <Stack.Screen name="LoginScreen" component={LoginScreen} />
                <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
                <Stack.Screen name="LabSelectionScreen" component={LabSelectionScreen} />
                <Stack.Screen name="ForgotCodeScreen" component={ForgotCodeScreen} />

                {/* ============ PATIENT ONBOARDING ============ */}
                <Stack.Screen name="Step1_PersonalInfo" component={Step1_PersonalInfo} />
                <Stack.Screen name="Step2_ContactInfo" component={Step2_ContactInfo} />
                <Stack.Screen name="Step3_HealthInfo" component={Step3_HealthInfo} />
                <Stack.Screen name="Step4_Insurance" component={Step4_Insurance} />
                <Stack.Screen name="Step5_SelectTests" component={Step5_SelectTests} />
                <Stack.Screen name="Step6_AccessCode" component={Step6_AccessCode} />

                {/* ============ PATIENT DASHBOARD ============ */}
                <Stack.Screen name="PatientDashboard" component={PatientDashboard} />
                <Stack.Screen name="TestHistoryScreen" component={TestHistoryScreen} />
                <Stack.Screen name="ResultViewScreen" component={ResultViewScreen} />
                <Stack.Screen name="TransferScreen" component={TransferScreen} />
                <Stack.Screen name="ShareResultsScreen" component={ShareResultsScreen} />
                <Stack.Screen name="RegistrationCompleteScreen" component={RegistrationCompleteScreen} />
                <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
                <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
                <Stack.Screen name="PatientDetailsScreen" component={PatientDetailsScreen} />

                {/* ============ STAFF DASHBOARD ============ */}
                <Stack.Screen name="StaffDashboard" component={StaffDashboard} />
                <Stack.Screen name="RoleSwitcher" component={RoleSwitcher} />
                <Stack.Screen name="ReceptionistView" component={ReceptionistView} />
                <Stack.Screen name="CashierView" component={CashierView} />
                <Stack.Screen name="AnalyzerView" component={AnalyzerView} />
                <Stack.Screen name="LabTechView" component={LabTechView} />

                {/* ============ ADMIN DASHBOARD ============ */}
                <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
                <Stack.Screen name="PatientManagement" component={PatientManagement} />
                <Stack.Screen name="StaffManagement" component={StaffManagement} />
                <Stack.Screen name="TestCatalogManagement" component={TestCatalogManagement} />
                <Stack.Screen name="InventoryManagement" component={InventoryManagement} />
                <Stack.Screen name="ReportsScreen" component={ReportsScreen} />
                <Stack.Screen name="AnalyticsDashboard" component={AnalyticsDashboard} />

                {/* ============ SUPER ADMIN ============ */}
                <Stack.Screen name="SuperAdminDashboard" component={SuperAdminDashboard} />
                <Stack.Screen name="LabDetailsScreen" component={LabDetailsScreen} />
                <Stack.Screen name="LabRegistrationModal" component={LabRegistrationModal} />

                {/* ============ MODALS ============ */}
                <Stack.Screen name="AddStaffModal" component={AddStaffModal} />
                <Stack.Screen name="EditStaffModal" component={EditStaffModal} />

                {/* ============ OTHER DASHBOARDS ============ */}
                <Stack.Screen name="CashierDashboard" component={CashierDashboard} />
                <Stack.Screen name="LabDashboard" component={LabDashboard} />
              </Stack.Navigator>
            </NavigationContainer>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </View>
  );
}
