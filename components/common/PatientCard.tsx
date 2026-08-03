// // components/common/PatientCard.tsx
// import React from 'react';
// import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import PatientDashboard from '../../screens/Patient/PatientDashboard';

// const PatientCard = ({ patient, showStatus = true }: any) => {
//   const navigation = useNavigation();

//   const handlePress = () => {
//     (navigation as any).navigate('PatientDetailsScreen', { 
//       patientId: patient.id, 
//       patient: patient 
//     });
//   };
//   const getStatusColor = (status: string) => {
//     switch(status) {
//       case 'active': return '#4CAF50';
//       case 'pending': return '#FF9800';
//       case 'inactive': return '#F44336';
//       default: return '#9E9E9E';
//     }
//   };

//   return (
//     <TouchableOpacity style={styles.card} onPress={handlePress}>
//       <div style={styles.avatar}>
//         <Ionicons name="person" size={24} color="#1A237E" />
//       </div>
//       <div style={styles.info}>
//         <Text style={styles.name}>{patient.name}</Text>
//         <Text style={styles.details}>
//           {patient.age} years • {patient.gender}
//         </Text>
//         <Text style={styles.phone}>📞 {patient.phone || 'N/A'}</Text>
//       </div>
//       {showStatus && (
//         <div style={[styles.statusBadge, { backgroundColor: getStatusColor(patient.status) }]}>
//           <Text style={styles.statusText}>{patient.status || 'pending'}</Text>
//         </div>
//       )}
//       <Ionicons name="chevron-forward" size={20} color="#ccc" />
//     </TouchableOpacity>
//   );
// };

// const styles = StyleSheet.create({
//   card: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'white',
//     padding: 14,
//     borderRadius: 12,
//     marginBottom: 10,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//   },
//   avatar: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: '#E8EAF6',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   info: {
//     flex: 1,
//   },
//   name: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     fontFamily: 'Poppins-SemiBold',
//   },
//   details: {
//     fontSize: 13,
//     color: '#666',
//     fontFamily: 'Poppins-Regular',
//   },
//   phone: {
//     fontSize: 12,
//     color: '#999',
//     fontFamily: 'Poppins-Regular',
//   },
//   statusBadge: {
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 12,
//     marginRight: 8,
//   },
//   statusText: {
//     color: 'white',
//     fontSize: 10,
//     fontWeight: 'bold',
//     fontFamily: 'Poppins-Bold',
//   },
// });

// export default PatientCard;