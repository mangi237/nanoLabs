// // screens/superAdmin/HospitalDetailsScreen.tsx
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Alert,
//   RefreshControl,
//   SafeAreaView,
// } from 'react-native';
// import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
// import { doc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
// import { db } from '../../services/firebase';
// import { 
//   Ionicons, 
//   MaterialIcons, 
//   FontAwesome5, 
//   MaterialCommunityIcons,
// } from '@expo/vector-icons';
// import Hospital from '../../types/hospital';
// import EditHospitalModal from '../../components/superAdmin/EditHospitalModal';

// // Define types

// type Admin = {
//   id: string;
//   name?: string;
//   email?: string;
//   role?: string;
//   accessCode?: string;
//   phone?: string;
// };

// type Stats = {
//   totalPatients: number;
//   totalStaff: number;
//   totalRevenue: number;
//   monthlyPatients: number;
// };

// type RootStackParamList = {
//   HospitalDetailsScreen: { hospitalId: string };
// };

// type HospitalDetailsScreenRouteProp = RouteProp<RootStackParamList, 'HospitalDetailsScreen'>;

// const HospitalDetailsScreen = () => {
//   const route = useRoute<HospitalDetailsScreenRouteProp>();
//   const navigation = useNavigation();
//   const { hospitalId } = route.params;
  
//   const [hospital, setHospital] = useState<Hospital | null>(null);
//   const [admins, setAdmins] = useState<Admin[]>([]);
//   const [stats, setStats] = useState<Stats>({
//     totalPatients: 0,
//     totalStaff: 0,
//     totalRevenue: 0,
//     monthlyPatients: 0,   
//   });
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);

//   useEffect(() => {
//     fetchHospitalDetails();
//   }, [hospitalId]);

//   const fetchHospitalDetails = async () => {
//     try {
//       setLoading(true);
      
//       // Fetch hospital
//       const hospitalDoc = await getDoc(doc(db, 'hospitals', hospitalId));
//       if (hospitalDoc.exists()) {
//         const hospitalData = { id: hospitalDoc.id, ...hospitalDoc.data() } as Hospital;
//         setHospital(hospitalData);
        
//         // Fetch admins - FIXED: properly filter staff with role 'admin'
//         const staffsRef = collection(db, `hospitals/${hospitalId}/staffs`);
//         const staffsSnap = await getDocs(staffsRef);
        
//         const adminsData: Admin[] = [];
//         staffsSnap.forEach((doc) => {
//           const staffData = doc.data();
//           if (staffData.role === 'admin') {
//             adminsData.push({ id: doc.id, ...staffData });
//           }
//         });
//         setAdmins(adminsData);
        
//         // Calculate stats
//         const patientsRef = collection(db, `hospitals/${hospitalId}/patients`);
//         const patientsSnap = await getDocs(patientsRef);
        
//         const staffsSnap2 = await getDocs(collection(db, `hospitals/${hospitalId}/staffs`));
        
//         // Monthly patients - more accurate calculation
//         const currentMonth = new Date().getMonth();
//         const currentYear = new Date().getFullYear();
//         let monthlyPatients = 0;
        
//         patientsSnap.forEach((doc) => {
//           const patientData = doc.data();
//           if (patientData.createdAt) {
//             const createdDate = patientData.createdAt.toDate();
//             if (createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
//               monthlyPatients++;
//             }
//           }
//         });
        
//         setStats({
//           totalPatients: patientsSnap.size,
//           totalStaff: staffsSnap2.size,
//           totalRevenue: hospitalData.subscriptionAmount || 0,
//           monthlyPatients,
//         });
//       } else {
//         Alert.alert('Error', 'Hospital not found');
//         navigation.goBack();
//       }
//     } catch (error) {
//       console.error('Error fetching hospital details:', error);
//       Alert.alert('Error', 'Failed to load hospital details');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchHospitalDetails();
//   };

//   const handleDeleteAdmin = (adminId: string) => {
//     Alert.alert(
//       'Delete Admin',
//       'Are you sure you want to delete this admin?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Delete', 
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await deleteDoc(doc(db, `hospitals/${hospitalId}/staffs`, adminId));
//               Alert.alert('Success', 'Admin deleted successfully');
//               fetchHospitalDetails();
//             } catch (error) {
//               console.error('Error deleting admin:', error);
//               Alert.alert('Error', 'Failed to delete admin');
//             }
//           }
//         }
//       ]
//     );
//   };

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-US', {
//       style: 'currency',
//       currency: 'USD',
//       minimumFractionDigits: 0,
//     }).format(amount);
//   };

//   const formatDate = (date: any) => {
//     if (!date) return 'N/A';
//     try {
//       const dateObj = date.toDate ? date.toDate() : new Date(date);
//       return dateObj.toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric',
//       });
//     } catch (error) {
//       return 'Invalid Date';
//     }
//   };

//   const handleAddAdmin = () => {
//     // Navigate to add admin screen or show modal
//     Alert.alert('Info', 'Add admin functionality coming soon');
//   };

//   const handleDeactivateHospital = () => {
//     Alert.alert(
//       'Deactivate Hospital',
//       'Are you sure you want to deactivate this hospital?',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         { 
//           text: 'Deactivate', 
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               Alert.alert('Info', 'Deactivation feature coming soon');
//             } catch (error) {
//               console.error('Error deactivating hospital:', error);
//             }
//           }
//         }
//       ]
//     );
//   };

//   if (loading) {
//     return (
//       <div style={styles.loadingContainer}>
//         <Ionicons name="medical" size={40} color="#1E96A9" />
//         <Text style={styles.loadingText}>Loading hospital details...</Text>
//       </view
//     );
//   }

//   if (!hospital) {
//     return (
//       <div style={styles.errorContainer}>
//         <Ionicons name="alert-circle" size={60} color="#e74c3c" />
//         <Text style={styles.errorText}>Hospital not found</Text>
//         <TouchableOpacity 
//           style={styles.backButton}
//           onPress={() => navigation.goBack()}
//         >
//           <Text style={{color:'white', backgroundColor:
//         'red', padding:10, borderRadius:5
//           }}>Go Back</Text>
//         </TouchableOpacity>
//       </view
//     );
//   }

//   return (
//     <ScrollView scrollEnabled showsVerticalScrollIndicator>
//   <SafeAreaView style={styles.container}>
//       <ScrollView
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//       >
//         {/* Header */}
//         <div style={styles.header}>
//           <TouchableOpacity 
//             style={styles.backButton}
//             onPress={() => navigation.goBack()}
//           >
//             <Ionicons name="arrow-back" size={24} color="#2C3E50" />
//           </TouchableOpacity>
//           <div style={styles.headerTitle}>
//             <Text style={styles.hospitalName}>{hospital.name}</Text>
//             <Text style={styles.hospitalLocation}>{hospital.location}</Text>
//           </view
//           <TouchableOpacity 
//             style={styles.editButton}
//             onPress={() => setShowEditModal(true)}
//           >
//             <Ionicons name="create-outline" size={20} color="#1E96A9" />
//           </TouchableOpacity>
//         </view

//         {/* Hospital Overview */}
//         <div style={styles.overviewCard}>
//           <div style={styles.overviewHeader}>
//             <div style={styles.hospitalLogo}>
//               <MaterialCommunityIcons name="hospital-building" size={40} color="#1E96A9" />
//             </view
//             <div style={styles.overviewInfo}>
//               <div style={[styles.statusBadge, { backgroundColor: hospital.status === 'active' ? '#27ae60' : '#e74c3c' }]}>
//                 <Text style={styles.statusText}>{hospital.status || 'inactive'}</Text>
//               </view
//               <Text style={styles.subscriptionType}>{hospital.subscriptionType || 'No subscription'}</Text>
//             </view
//           </view
          
//           {hospital.slogan && (
//             <div style={styles.sloganContainer}>
//               <Ionicons name="book" size={16} color="#1E96A9" />
//               <Text style={styles.sloganText}>{hospital.slogan}</Text>
//             </view
//           )}

//           <div style={styles.overviewDetails}>
//             <div style={styles.detailItem}>
//               <Ionicons name="calendar" size={16} color="#7f8c8d" />
//               <Text style={styles.detailLabel}>Created:</Text>
//               <Text style={styles.detailValue}>{formatDate(hospital.createdAt)}</Text>
//             </view
//             {hospital.email && (
//               <div style={styles.detailItem}>
//                 <Ionicons name="mail" size={16} color="#7f8c8d" />
//                 <Text style={styles.detailLabel}>Email:</Text>
//                 <Text style={styles.detailValue}>{hospital.email}</Text>
//               </view
//             )}
//             {hospital.phone && (
//               <div style={styles.detailItem}>
//                 <Ionicons name="call" size={16} color="#7f8c8d" />
//                 <Text style={styles.detailLabel}>Phone:</Text>
//                 <Text style={styles.detailValue}>{hospital.phone}</Text>
//               </view
//             )}
//             {hospital.address && (
//               <div style={styles.detailItem}>
//                 <Ionicons name="location" size={16} color="#7f8c8d" />
//                 <Text style={styles.detailLabel}>Address:</Text>
//                 <Text style={styles.detailValue} numberOfLines={2}>{hospital.address}</Text>
//               </view
//             )}
//           </view
//         </view

//         {/* Statistics */}
//         <div style={styles.section}>
//           <Text style={styles.sectionTitle}>Hospital Statistics</Text>
//           <div style={styles.statsGrid}>
//             <div style={styles.statItem}>
//               <div style={[styles.statIcon, { backgroundColor: '#3498db15' }]}>
//                 <FontAwesome5 name="user-injured" size={20} color="#3498db" />
//               </view
//               <Text style={styles.statValue}>{stats.totalPatients}</Text>
//               <Text style={styles.statLabel}>Total Patients</Text>
//             </view
//             <div style={styles.statItem}>
//               <div style={[styles.statIcon, { backgroundColor: '#27ae6015' }]}>
//                 <FontAwesome5 name="user-md" size={20} color="#27ae60" />
//               </view
//               <Text style={styles.statValue}>{stats.totalStaff}</Text>
//               <Text style={styles.statLabel}>Total Staff</Text>
//             </view
//             <div style={styles.statItem}>
//               <div style={[styles.statIcon, { backgroundColor: '#9b59b615' }]}>
//                 <MaterialIcons name="attach-money" size={20} color="#9b59b6" />
//               </view
//               <Text style={styles.statValue}>{formatCurrency(stats.totalRevenue)}</Text>
//               <Text style={styles.statLabel}>Revenue</Text>
//             </view
//             <div style={styles.statItem}>
//               <div style={[styles.statIcon, { backgroundColor: '#e74c3c15' }]}>
//                 <MaterialCommunityIcons name="chart-line" size={22} color="#e74c3c" />
//               </view
//               <Text style={styles.statValue}>{stats.monthlyPatients}</Text>
//               <Text style={styles.statLabel}>Monthly Growth</Text>
//             </view
//           </view
//         </view

//         {/* Admin List */}
//         <div style={styles.section}>
//           <div style={styles.sectionHeader}>
//             <Text style={styles.sectionTitle}>Admin Accounts ({admins.length})</Text>
//             <TouchableOpacity style={styles.addButton} onPress={handleAddAdmin}>
//               <Ionicons name="add" size={20} color="#1E96A9" />
//               <Text style={styles.addButtonText}>Add Admin</Text>
//             </TouchableOpacity>
//           </view
          
//           {admins.length === 0 ? (
//             <div style={styles.emptyState}>
//               <Ionicons name="people" size={40} color="#ecf0f1" />
//               <Text style={styles.emptyText}>No admins found</Text>
//               <Text style={styles.emptySubtext}>Add an admin to manage this hospital</Text>
//             </view
//           ) : (
//             admins.map(admin => (
//               <div key={admin.id} style={styles.adminCard}>
//                 <div style={styles.adminInfo}>
//                   <div style={styles.adminAvatar}>
//                     <Text style={styles.adminInitial}>
//                       {admin.name?.charAt(0)?.toUpperCase() || 'A'}
//                     </Text>
//                   </view
//                   <div style={styles.adminDetails}>
//                     <Text style={styles.adminName}>{admin.name || 'Unnamed Admin'}</Text>
//                     <Text style={styles.adminEmail}>{admin.email || 'No email'}</Text>
//                     <div style={styles.adminMeta}>
//                       <Text style={styles.adminAccessCode}>Code: {admin.accessCode || 'No code'}</Text>
//                       <Text style={styles.adminRole}>{admin.role || 'admin'}</Text>
//                     </view
//                   </view
//                 </view
//                 <TouchableOpacity 
//                   style={styles.deleteButton}
//                   onPress={() => handleDeleteAdmin(admin.id)}
//                 >
//                   <Ionicons name="trash" size={18} color="#e74c3c" />
//                 </TouchableOpacity>
//               </view
//             ))
//           )}
//         </view

//         {/* Subscription Details */}
//         <div style={styles.section}>
//           <Text style={styles.sectionTitle}>Subscription Details</Text>
//           <div style={styles.subscriptionCard}>
//             <div style={styles.subscriptionHeader}>
//               <Text style={styles.subscriptionPlan}>{hospital.subscriptionType || 'Basic'}</Text>
//               <Text style={styles.subscriptionAmount}>
//                 {formatCurrency(hospital.subscriptionAmount || 0)}
//               </Text>
//             </view
//             <Text style={styles.subscriptionDescription}>
//               {hospital.subscriptionPatientRange || '0-50'} patients per month
//             </Text>
//             <div style={styles.subscriptionFooter}>
//               <Text style={styles.subscriptionStatus}>
//                 Status: <Text style={{ color: hospital.status === 'active' ? '#27ae60' : '#e74c3c' }}>
//                   {hospital.status || 'inactive'}
//                 </Text>
//               </Text>
//               <TouchableOpacity style={styles.upgradeButton}>
//                 <Text style={styles.upgradeText}>Upgrade Plan</Text>
//               </TouchableOpacity>
//             </view
//           </view
//         </view

//         {/* Description */}
//         {hospital.description && (
//           <div style={styles.section}>
//             <Text style={styles.sectionTitle}>About</Text>
//             <div style={styles.descriptionCard}>
//               <Text style={styles.descriptionText}>{hospital.description}</Text>
//             </view
//           </view
//         )}

//         {/* Action Buttons */}
//         <div style={styles.actionsSection}>
//           <TouchableOpacity 
//             style={[styles.actionButton, styles.dangerButton]}
//             onPress={handleDeactivateHospital}
//           >
//             <Ionicons name="power" size={18} color="white" />
//             <Text style={styles.actionButtonText}>Deactivate Hospital</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.actionButton}>
//             <Ionicons name="download" size={18} color="#1E96A9" />
//             <Text style={[styles.actionButtonText, { color: '#1E96A9' }]}>Export Data</Text>
//           </TouchableOpacity>
//         </view
//       </ScrollView>

//       {/* Edit Modal */}
//       {hospital && (
//         <EditHospitalModal
//           visible={showEditModal}
//           onClose={() => setShowEditModal(false)}
//           hospital={hospital}
//           onHospitalUpdated={() => {
//             setShowEditModal(false);
//             fetchHospitalDetails();
//           }}
//         />
//       )}
//     </SafeAreaView>
//     </ScrollView>
  
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F8F9FA',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#F8F9FA',
//   },
//   loadingText: {
//     marginTop: 20,
//     fontSize: 16,
//     color: '#555',
//     fontFamily: 'Poppins-Regular',
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#F8F9FA',
//     padding: 20,
//   },
//   errorText: {
//     fontSize: 18,
//     color: '#333',
//     marginTop: 20,
//     marginBottom: 30,
//     textAlign: 'center',
//     fontFamily: 'Poppins-SemiBold',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingTop: 20,
//     paddingBottom: 15,
//     backgroundColor: 'white',
//     borderBottomWidth: 1,
//     borderBottomColor: '#ECF0F1',
//   },
//   backButton: {
//     padding: 8,
//     marginRight: 12,
//   },
//   headerTitle: {
//     flex: 1,
//   },
//   hospitalName: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#2C3E50',
//     fontFamily: 'Poppins-SemiBold',
//   },
//   hospitalLocation: {
//     fontSize: 14,
//     color: '#7f8c8d',
//     marginTop: 2,
//     fontFamily: 'Poppins-Regular',
//   },
//   editButton: {
//     padding: 8,
//   },
//   overviewCard: {
//     backgroundColor: 'white',
//     margin: 20,
//     borderRadius: 16,
//     padding: 20,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   overviewHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 20,
//   },
//   hospitalLogo: {
//     width: 60,
//     height: 60,
//     borderRadius: 12,
//     backgroundColor: '#E3F2FD',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   overviewInfo: {
//     alignItems: 'flex-end',
//   },
//   statusBadge: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 12,
//     marginBottom: 8,
//   },
//   statusText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: 'bold',
//     fontFamily: 'Poppins-SemiBold',
//   },
//   subscriptionType: {
//     fontSize: 12,
//     color: '#1E96A9',
//     fontWeight: '600',
//     fontFamily: 'Poppins-SemiBold',
//   },
//   sloganContainer: {
//     flexDirection: 'row',
//     backgroundColor: '#F8F9FA',
//     padding: 12,
//     borderRadius: 8,
//     marginBottom: 20,
//   },
//   sloganText: {
//     fontSize: 14,
//     color: '#34495E',
//     fontStyle: 'italic',
//     marginLeft: 8,
//     flex: 1,
//     fontFamily: 'Poppins-Regular',
//   },
//   overviewDetails: {
//     borderTopWidth: 1,
//     borderTopColor: '#ECF0F1',
//     paddingTop: 20,
//   },
//   detailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   detailLabel: {
//     fontSize: 14,
//     color: '#7f8c8d',
//     marginLeft: 8,
//     marginRight: 8,
//     width: 70,
//     fontFamily: 'Poppins-Regular',
//   },
//   detailValue: {
//     fontSize: 14,
//     color: '#2C3E50',
//     flex: 1,
//     fontFamily: 'Poppins-Regular',
//   },
//   section: {
//     marginHorizontal: 20,
//     marginBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#2C3E50',
//     marginBottom: 16,
//     fontFamily: 'Poppins-SemiBold',
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   statsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//   },
//   statItem: {
//     width: '48%',
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 12,
//     alignItems: 'center',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   statIcon: {
//     width: 44,
//     height: 44,
//     borderRadius: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   statValue: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#2C3E50',
//     marginBottom: 4,
//     fontFamily: 'Poppins-Bold',
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#7f8c8d',
//     textAlign: 'center',
//     fontFamily: 'Poppins-Regular',
//   },
//   addButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#E3F2FD',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 8,
//   },
//   addButtonText: {
//     color: '#1E96A9',
//     fontSize: 12,
//     fontWeight: '600',
//     marginLeft: 6,
//     fontFamily: 'Poppins-Medium',
//   },
//   emptyState: {
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 40,
//     alignItems: 'center',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: '#BDC3C7',
//     marginTop: 12,
//     fontFamily: 'Poppins-SemiBold',
//   },
//   emptySubtext: {
//     fontSize: 12,
//     color: '#BDC3C7',
//     marginTop: 4,
//     fontFamily: 'Poppins-Regular',
//   },
//   adminCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 8,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   adminInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   adminAvatar: {
//     width: 44,
//     height: 44,
//     borderRadius: 22,
//     backgroundColor: '#1E96A9',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   adminInitial: {
//     color: 'white',
//     fontSize: 18,
//     fontWeight: 'bold',
//     fontFamily: 'Poppins-Bold',
//   },
//   adminDetails: {
//     flex: 1,
//   },
//   adminName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#2C3E50',
//     marginBottom: 2,
//     fontFamily: 'Poppins-SemiBold',
//   },
//   adminEmail: {
//     fontSize: 12,
//     color: '#7f8c8d',
//     marginBottom: 4,
//     fontFamily: 'Poppins-Regular',
//   },
//   adminMeta: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   adminAccessCode: {
//     fontSize: 11,
//     color: '#f39c12',
//     backgroundColor: '#FFF9E6',
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 4,
//     fontFamily: 'Poppins-Medium',
//   },
//   adminRole: {
//     fontSize: 11,
//     color: '#27ae60',
//     backgroundColor: '#E8F5E9',
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 4,
//     fontFamily: 'Poppins-Medium',
//   },
//   deleteButton: {
//     padding: 8,
//   },
//   subscriptionCard: {
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 20,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   subscriptionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   subscriptionPlan: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#2C3E50',
//     fontFamily: 'Poppins-SemiBold',
//   },
//   subscriptionAmount: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#27ae60',
//     fontFamily: 'Poppins-Bold',
//   },
//   subscriptionDescription: {
//     fontSize: 14,
//     color: '#7f8c8d',
//     marginBottom: 16,
//     fontFamily: 'Poppins-Regular',
//   },
//   subscriptionFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     borderTopWidth: 1,
//     borderTopColor: '#ECF0F1',
//     paddingTop: 16,
//   },
//   subscriptionStatus: {
//     fontSize: 14,
//     color: '#7f8c8d',
//     fontFamily: 'Poppins-Regular',
//   },
//   upgradeButton: {
//     backgroundColor: '#1E96A9',
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 8,
//   },
//   upgradeText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: '600',
//     fontFamily: 'Poppins-SemiBold',
//   },
//   descriptionCard: {
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 20,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   descriptionText: {
//     fontSize: 14,
//     color: '#34495E',
//     lineHeight: 22,
//     fontFamily: 'Poppins-Regular',
//   },
//   actionsSection: {
//     flexDirection: 'row',
//     paddingHorizontal: 20,
//     paddingBottom: 30,
//     gap: 12,
//   },
//   actionButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 14,
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: '#1E96A9',
//     gap: 8,
//   },
//   dangerButton: {
//     backgroundColor: '#e74c3c',
//     borderColor: '#e74c3c',
//   },
//   actionButtonText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: 'white',
//     fontFamily: 'Poppins-SemiBold',
//   },
// });

// export default HospitalDetailsScreen;