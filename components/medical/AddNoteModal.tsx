// components/medical/AddNoteModal.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { NoteCreateData } from '../../types/Notes';
import { useAuth } from '../../context/authContext';

interface AddNoteModalProps {
  visible: boolean;
  onClose: () => void;
  onNoteAdded: () => void;
  patientId: string;
}

// Add this helper function
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return '#E74C3C';
    case 'medium': return '#F39C12';
    case 'low': return '#27AE60';
    default: return '#7F8C8D';
  }
};

const AddNoteModal: React.FC<AddNoteModalProps> = ({
  visible,
  onClose,
  onNoteAdded,
  patientId,
}) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [formData, setFormData] = useState<Omit<NoteCreateData, 'patientId' | 'doctorId' | 'doctorName'>>({
    title: '',
    content: '',
    category: 'examination',
    priority: 'medium',
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      Alert.alert('Error', 'Please fill in title and content');
      return;
    }

    setLoading(true);
    try {
      const noteData: NoteCreateData = {
        ...formData,
        patientId,
        doctorId: user?.id || '',
        doctorName: user?.name || 'Unknown Doctor',
      };

      await addDoc(collection(db, 'notes'), {
        ...noteData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      Alert.alert('Success', 'Note added successfully!');
      onNoteAdded();
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        category: 'examination',
        priority: 'medium',
      });
    } catch (error: any) {
      console.error('Error adding note:', error);
      Alert.alert('Error', `Failed to add note: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Patient Note</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#2C3E50" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Note title"
                value={formData.title}
                onChangeText={(value) => setFormData(prev => ({ ...prev, title: value }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {(['examination', 'diagnosis', 'treatment', 'progress', 'lab', 'other'] as const).map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[styles.categoryButton, formData.category === category && styles.categoryButtonSelected]}
                    onPress={() => setFormData(prev => ({ ...prev, category }))}
                  >
                    <Text style={formData.category === category ? styles.categoryTextSelected : styles.categoryText}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.priorityGroup}>
                {(['low', 'medium', 'high'] as const).map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[styles.priorityButton, formData.priority === priority && styles.priorityButtonSelected]}
                    onPress={() => setFormData(prev => ({ ...prev, priority }))}
                  >
                    <Ionicons 
                      name={priority === 'high' ? 'alert-circle' : priority === 'medium' ? 'information-circle' : 'checkmark-circle'} 
                      size={16} 
                      color={formData.priority === priority ? 'white' : getPriorityColor(priority)} 
                    />
                    <Text style={formData.priority === priority ? styles.priorityTextSelected : styles.priorityText}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter your notes here..."
                value={formData.content}
                onChangeText={(value) => setFormData(prev => ({ ...prev, content: value }))}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.saveButtonText}>Adding Note...</Text>
              ) : (
                <Text style={styles.saveButtonText}>Add Note</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Add the missing styles
const styles = StyleSheet.create({
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
    maxHeight: '80%',
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
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D5D8DC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#ECF0F1',
    minWidth: 100,
    alignItems: 'center',
  },
  categoryButtonSelected: {
    backgroundColor: '#2E86C1',
  },
  categoryText: {
    color: '#2C3E50',
    fontSize: 12,
  },
  categoryTextSelected: {
    color: 'white',
  },
  priorityGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#ECF0F1',
    gap: 5,
  },
  priorityButtonSelected: {
    backgroundColor: '#2E86C1',
  },
  priorityText: {
    color: '#2C3E50',
    fontSize: 12,
  },
  priorityTextSelected: {
    color: 'white',
  },
  saveButton: {
    backgroundColor: '#27AE60',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#7F8C8D',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddNoteModal;