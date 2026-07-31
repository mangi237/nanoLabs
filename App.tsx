// App.js
import React, { useCallback, useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './context/authContext';
import { initializeEmailJS } from './services/emailService';
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
  name="hospitalDetailsScreen" 
  component={HospitalDetailsScreen}
  options={{ 
    title: 'Hospital Details',
    headerShown: true 
  }}
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