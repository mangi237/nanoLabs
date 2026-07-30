import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedHeader from '../../components/common/AnimateHeader';
import PatientList from '../../components/medical/PatientList';
import PatientDetailsScreen from '../PatientDetailsScreen';
import OrderRadiologyModal from '../../components/radiology/OrderRadiologyModal';

const Stack = createStackNavigator();

const RadiologyDashboard = () => {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const handleOrderRadiology = (patientId) => {
    setSelectedPatientId(patientId);
    setShowOrderModal(true);
  };

  return (
    <>
      <AnimatedHeader />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#9C27B0' },
          headerTintColor: 'white',
          headerTitleStyle: { fontFamily: 'Poppins-SemiBold' },
        }}
      >
        <Stack.Screen 
          name="PatientList" 
          options={{ title: 'Radiology Patients', headerShown: true }}
        >
          {props => (
            <PatientList 
              {...props} 
              onOrderRadiology={handleOrderRadiology}
            />
          )}
        </Stack.Screen>
        <Stack.Screen 
          name="PatientDetails" 
          component={PatientDetailsScreen}
          options={{ title: 'Patient Details', headerShown: true }}
        />
      </Stack.Navigator>

      <OrderRadiologyModal
      patientName={''}
        visible={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        patientId={selectedPatientId}
      />
    </>
  );
};

export default RadiologyDashboard;