// components/admin/ManageStaff.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { User, RoleType } from '../../types/User';
import { useAuth } from '../../context/authContext';
// import R
const screenHeight = Dimensions.get('window').height;
const ALL_ROLES: RoleType[] = [
  'admin', 'receptionist', 'analyzer', 'cashier', 'lab', 'pharmacy', 
  'doctor', 'nurse', 'radiology', 'surgeon', 'emergency', 'ward', 'matron'
];


// type RoleType = typeof ALL_ROLES[number];÷

const ManageStaff = () => {
  const { user } = useAuth();
  const [staff, setStaff] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStaff, setFilteredStaff] = useState<User[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Update formData to support array of roles
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roles: [] as RoleType[], // Now an array
    department: '',
    code: ''
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = staff.filter(staffMember => 
        staffMember.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staffMember.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (staffMember.roles?.some(role => role.toLowerCase().includes(searchQuery.toLowerCase())) || 
         staffMember.role?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredStaff(filtered);
    } else {
      setFilteredStaff(staff);
    }
  }, [searchQuery, staff]);

  const fetchStaff = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, `hospitals/${user.hospitalId}/staffs`));
      const staffData: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Convert legacy single role to array for display
        const staffMember = { 
          id: doc.id, 
          ...data,
          roles: Array.isArray(data.roles) ? data.roles : [data.role].filter(Boolean)
        } as User;
        staffData.push(staffMember);
      });
      setStaff(staffData);
    } catch (error) {
      console.error('Error fetching staff: ', error);
      Alert.alert('Error', 'Failed to fetch staff data');
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleRoleToggle = (role: RoleType) => {
    const currentRoles = [...formData.roles];
    if (currentRoles.includes(role)) {
      // Remove role
      setFormData({
        ...formData,
        roles: currentRoles.filter(r => r !== role)
      });
    } else {
      // Add role
      setFormData({
        ...formData,
        roles: [...currentRoles, role]
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || formData.roles.length === 0) {
      Alert.alert('Error', 'Please fill in all required fields and select at least one role');
      return;
    }

    setLoading(true);
    try {
      const staffData = {
        name: formData.name,
        email: formData.email,
        roles: formData.roles, // Save as array
        role: formData.roles[0], // Keep single role for backward compatibility
        department: formData.department || '',
        code: formData.code || generateRandomCode(),
        createdAt: new Date(),
        hospitalId: user.hospitalId,
        addedBy: user?.name || 'admin',
        status: 'active'
      };

      if (editingStaff) {
        await updateDoc(doc(db, `hospitals/${user.hospitalId}/staffs`, editingStaff.id), staffData);
        Alert.alert('Success', 'Staff member updated successfully');
      } else {
        await addDoc(collection(db, `hospitals/${user.hospitalId}/staffs`), staffData);
        Alert.alert('Success', 'Staff member added successfully');
      }

      setModalVisible(false);
      setEditingStaff(null);
      resetForm();
      fetchStaff();
    } catch (error) {
      console.error('Error saving staff: ', error);
      Alert.alert('Error', 'Failed to save staff data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (staffMember: User) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      roles: Array.isArray(staffMember.roles) ? staffMember.roles : [staffMember.role].filter(Boolean),
      department: staffMember.department || '',
      code: staffMember.code || ''
    });
    setModalVisible(true);
  };

  const handleDelete = async (staffMember: User) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${staffMember.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, `hospitals/${user.hospitalId}/staffs`, staffMember.id));
              Alert.alert('Success', 'Staff member deleted successfully');
              fetchStaff();
            } catch (error) {
              console.error('Error deleting staff: ', error);
              Alert.alert('Error', 'Failed to delete staff member');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      email: '', 
      roles: [], 
      department: '', 
      code: '' 
    });
    setEditingStaff(null);
  };

  const renderStaffItem = ({ item }: { item: User }) => {
    const displayRoles = Array.isArray(item.roles) ? item.roles : [item.role].filter(Boolean);
    
    return (
      <View style={styles.staffItem}>
        <View style={styles.staffAvatar}>
          <Ionicons name="person" size={24} color="#008080" />
        </View>
        <View style={styles.staffInfo}>
          <Text style={styles.staffName}>{item.name}</Text>
          <Text style={styles.staffDetails}>{item.email}</Text>
          <View style={styles.rolesContainer}>
            {displayRoles.map((role, index) => (
              <View key={index} style={styles.roleBadge}>
                <Text style={styles.roleText}>{role}</Text>
              </View>
            ))}
            {displayRoles.length > 1 && (
              <Text style={styles.moreRolesText}>+{displayRoles.length - 1} more</Text>
            )}
          </View>
        </View>
        <View style={styles.staffActions}>
          <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
            <Ionicons name="create-outline" size={20} color="#2E86C1" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={20} color="#E74C3C" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#7F8C8D" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff by name, email, or role"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Staff</Text>
        </TouchableOpacity>
      </View>
      
      <View style={{ height: screenHeight }}>
        <ScrollView style={{ flex: 1 }}>
          <FlatList
            data={filteredStaff}
            renderItem={renderStaffItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            scrollEnabled={false}
          />
        </ScrollView>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter full name"
                  value={formData.name}
                  onChangeText={(value) => setFormData({ ...formData, name: value })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email address"
                  value={formData.email}
                  onChangeText={(value) => setFormData({ ...formData, email: value })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Roles * (Select multiple)</Text>
                <Text style={styles.rolesHint}>Click to select/deselect roles</Text>
                <View style={styles.rolesGrid}>
                  {ALL_ROLES.map((role) => {
                    const isSelected = formData.roles.includes(role);
                    return (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.roleButton,
                          isSelected && styles.roleButtonSelected
                        ]}
                        onPress={() => handleRoleToggle(role)}
                      >
                        <Ionicons 
                          name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
                          size={16} 
                          color={isSelected ? "white" : "#7F8C8D"} 
                          style={styles.roleIcon}
                        />
                        <Text style={[
                          styles.roleButtonText,
                          isSelected && styles.roleButtonTextSelected
                        ]}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {formData.roles.length > 0 && (
                  <Text style={styles.selectedRolesText}>
                    Selected: {formData.roles.join(', ')}
                  </Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Department</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter department"
                  value={formData.department}
                  onChangeText={(value) => setFormData({ ...formData, department: value })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Access Code</Text>
                <View style={styles.codeContainer}>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    placeholder="Will be auto-generated"
                    value={formData.code}
                    onChangeText={(value) => setFormData({ ...formData, code: value })}
                  />
                  <TouchableOpacity 
                    style={styles.generateButton}
                    onPress={() => setFormData({ ...formData, code: generateRandomCode() })}
                  >
                    <Text style={styles.generateButtonText}>Generate</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <Text style={styles.saveButtonText}>Saving...</Text>
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingStaff ? 'Update Staff' : 'Add Staff'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 15,
    height: screenHeight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#008080',
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 5,
  },
  listContainer: {
    paddingBottom: 20,
  },
  staffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  staffAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    fontFamily: 'Poppins-SemiBold',
    color: '#2C3E50',
  },
  staffDetails: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 5,
    fontFamily: 'Poppins-Regular',
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  roleBadge: {
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  roleText: {
    fontSize: 11,
    color: '#008080',
    fontFamily: 'Poppins-Medium',
  },
  moreRolesText: {
    fontSize: 11,
    color: '#7F8C8D',
    fontStyle: 'italic',
    marginLeft: 4,
  },
  staffActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#ECF0F1',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'Poppins-Bold',
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 5,
    fontFamily: 'Poppins-Medium',
  },
  rolesHint: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 10,
    fontFamily: 'Poppins-Regular',
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#ECF0F1',
    minWidth: 100,
  },
  roleButtonSelected: {
    backgroundColor: '#008080',
  },
  roleIcon: {
    marginRight: 6,
  },
  roleButtonText: {
    color: '#2C3E50',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  roleButtonTextSelected: {
    color: 'white',
  },
  selectedRolesText: {
    marginTop: 8,
    fontSize: 12,
    color: '#008080',
    fontFamily: 'Poppins-Medium',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D5D8DC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  codeInput: {
    flex: 1,
  },
  generateButton: {
    padding: 12,
    backgroundColor: '#008080',
    borderRadius: 8,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  saveButton: {
    backgroundColor: '#008080',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  saveButtonDisabled: {
    backgroundColor: '#7F8C8D',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default ManageStaff;