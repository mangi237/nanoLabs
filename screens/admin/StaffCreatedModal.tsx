// // components/admin/StaffCreatedModal.tsx
// import React from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Modal
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// const StaffCreatedModal = ({ visible, onClose, staffName, accessCode, roles }: any) => {
//   return (
//     <Modal visible={visible} transparent animationType="fade">
//       <div style={styles.overlay}>
//         <div style={styles.modal}>
//           <div style={styles.successIcon}>
//             <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
//           </view
          
//           <Text style={styles.title}>✅ Staff Added!</Text>
//           <Text style={styles.subtitle}>
//             {staffName} has been successfully added to the system.
//           </Text>

//           <div style={styles.detailsCard}>
//             <div style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Name</Text>
//               <Text style={styles.detailValue}>{staffName}</Text>
//             </view
//             <div style={styles.detailRow}>
//               <Text style={styles.detailLabel}>Roles</Text>
//               <Text style={styles.detailValue}>{roles?.join(', ')}</Text>
//             </view
//             <div style={[styles.detailRow, styles.codeRow]}>
//               <Text style={styles.detailLabel}>🔑 Access Code</Text>
//               <Text style={styles.codeValue}>{accessCode}</Text>
//             </view
//           </view

//           <div style={styles.warningBox}>
//             <Ionicons name="information-circle" size={20} color="#FF9800" />
//             <Text style={styles.warningText}>
//               Please share this access code with the staff member.
//               They will use it to login.
//             </Text>
//           </view

//           <TouchableOpacity style={styles.doneButton} onPress={onClose}>
//             <Text style={styles.doneButtonText}>Done</Text>
//           </TouchableOpacity>
//         </view
//       </view
//     </Modal>
//   );
// };

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   modal: {
//     backgroundColor: 'white',
//     borderRadius: 20,
//     padding: 24,
//     width: '100%',
//     maxWidth: 400,
//     alignItems: 'center',
//   },
//   successIcon: {
//     marginBottom: 16,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#1A237E',
//     fontFamily: 'Poppins-Bold',
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#666',
//     textAlign: 'center',
//     marginBottom: 20,
//     fontFamily: 'Poppins-Regular',
//   },
//   detailsCard: {
//     width: '100%',
//     backgroundColor: '#F8F9FA',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 16,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingVertical: 6,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEE',
//   },
//   detailLabel: {
//     fontSize: 14,
//     color: '#666',
//     fontFamily: 'Poppins-Regular',
//   },
//   detailValue: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#333',
//     fontFamily: 'Poppins-SemiBold',
//   },
//   codeRow: {
//     borderBottomWidth: 0,
//     paddingTop: 8,
//   },
//   codeValue: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#1A237E',
//     letterSpacing: 4,
//     fontFamily: 'Poppins-Bold',
//   },
//   warningBox: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#FFF3E0',
//     borderRadius: 8,
//     padding: 12,
//     gap: 10,
//     marginBottom: 20,
//     width: '100%',
//   },
//   warningText: {
//     flex: 1,
//     fontSize: 12,
//     color: '#E65100',
//     fontFamily: 'Poppins-Regular',
//   },
//   doneButton: {
//     backgroundColor: '#1A237E',
//     paddingVertical: 14,
//     paddingHorizontal: 40,
//     borderRadius: 10,
//     width: '100%',
//     alignItems: 'center',
//   },
//   doneButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: 'bold',
//     fontFamily: 'Poppins-Bold',
//   },
// });

// export default StaffCreatedModal;