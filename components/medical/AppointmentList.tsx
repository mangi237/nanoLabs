// components/medical/AppointmentModal.tsx
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, Timestamp, collection } from 'firebase/firestore';
import { db } from '../../services/firebase';
import DateTimePicker from '@react-native-community/datetimepicker';

interface AppointmentModalProps {
  visible: boolean;
  onClose: () => void;
  patientId: string;
  hospitalId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  onAppointmentAdded: () => void;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  visible,
  onClose,
  patientId,
  hospitalId,
  patientName,
  doctorId,
  doctorName,
  onAppointmentAdded
}) => {
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [appointment, setAppointment] = useState({
    date: new Date(),
    time: new Date(),
    title: '',
    type: 'consultation',
    duration: '30',
    location: '',
    notes: ''
  });

  const appointmentTypes = [
    { value: 'consultation', label: 'Consultation', icon: 'chatbubbles' },
    { value: 'follow-up', label: 'Follow-up', icon: 'refresh' },
    { value: 'procedure', label: 'Procedure', icon: 'medical' },
    { value: 'emergency', label: 'Emergency', icon: 'warning' },
    { value: 'surgery', label: 'Surgery', icon: 'cut' },
    { value: 'lab-test', label: 'Lab Test', icon: 'flask' },
  ];

  const handleAddAppointment = async () => {
    if (!appointment.title.trim() || !appointment.location.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Combine date and time
      const appointmentDateTime = new Date(appointment.date);
      appointmentDateTime.setHours(appointment.time.getHours());
      appointmentDateTime.setMinutes(appointment.time.getMinutes());

      await addDoc(
        collection(db, 'hospitals', hospitalId, 'patients', patientId, 'appointments'),
        {
          patientId,
          patientName,
          doctorId,
          doctorName,
          date: Timestamp.fromDate(appointmentDateTime),
          time: `${appointment.time.getHours().toString().padStart(2, '0')}:${appointment.time.getMinutes().toString().padStart(2, '0')}`,
          title: appointment.title,
          type: appointment.type,
          duration: parseInt(appointment.duration) || 30,
          location: appointment.location,
          status: 'scheduled',
          notes: appointment.notes,
          createdAt: Timestamp.now()
        }
      );

      Alert.alert('Success', 'Appointment scheduled successfully!');
      
      // Reset form
      setAppointment({
        date: new Date(),
        time: new Date(),
        title: '',
        type: 'consultation',
        duration: '30',
        location: '',
        notes: ''
      });

      onAppointmentAdded();
      onClose();
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      Alert.alert('Error', 'Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Schedule Appointment</Text>
              <Text style={styles.modalSubtitle}>For: {patientName}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Appointment Title *</Text>
              <TextInput
                style={styles.input}
                value={appointment.title}
                onChangeText={(text) => setAppointment(prev => ({ ...prev, title: text }))}
                placeholder="e.g., Annual Checkup, Follow-up Visit"
              />
            </View>

            {/* Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Appointment Type *</Text>
              <View style={styles.typeGrid}>
                {appointmentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeButton,
                      appointment.type === type.value && styles.typeButtonSelected
                    ]}
                    onPress={() => setAppointment(prev => ({ ...prev, type: type.value }))}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={16}
                      color={appointment.type === type.value ? '#6366F1' : '#6B7280'}
                    />
                    <Text style={[
                      styles.typeText,
                      appointment.type === type.value && styles.typeTextSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date and Time */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.inputLabel}>Date *</Text>
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar" size={16} color="#6366F1" />
                  <Text style={styles.dateTimeText}>{formatDate(appointment.date)}</Text>
                </TouchableOpacity>
              </View>
              
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Time *</Text>
                <TouchableOpacity 
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time" size={16} color="#6366F1" />
                  <Text style={styles.dateTimeText}>{formatTime(appointment.time)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Duration */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duration (minutes) *</Text>
              <View style={styles.durationButtons}>
                {['15', '30', '45', '60', '90', '120'].map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationButton,
                      appointment.duration === duration && styles.durationButtonSelected
                    ]}
                    onPress={() => setAppointment(prev => ({ ...prev, duration }))}
                  >
                    <Text style={[
                      styles.durationText,
                      appointment.duration === duration && styles.durationTextSelected
                    ]}>
                      {duration} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location *</Text>
              <TextInput
                style={styles.input}
                value={appointment.location}
                onChangeText={(text) => setAppointment(prev => ({ ...prev, location: text }))}
                placeholder="e.g., Room 101, Consultation Room 2"
              />
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={appointment.notes}
                onChangeText={(text) => setAppointment(prev => ({ ...prev, notes: text }))}
                placeholder="Any special instructions or notes"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Appointment Summary</Text>
              <View style={styles.summaryRow}>
                <Ionicons name="person" size={16} color="#6366F1" />
                <Text style={styles.summaryText}>Patient: {patientName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="medical" size={16} color="#6366F1" />
                <Text style={styles.summaryText}>Doctor: Dr. {doctorName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="calendar" size={16} color="#6366F1" />
                <Text style={styles.summaryText}>
                  {formatDate(appointment.date)} at {formatTime(appointment.time)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="time" size={16} color="#6366F1" />
                <Text style={styles.summaryText}>
                  Duration: {appointment.duration} minutes
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="location" size={16} color="#6366F1" />
                <Text style={styles.summaryText}>Location: {appointment.location}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={appointment.date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setAppointment(prev => ({ ...prev, date: selectedDate }));
                }
              }}
              minimumDate={new Date()}
            />
          )}

          {/* Time Picker */}
          {showTimePicker && (
            <DateTimePicker
              value={appointment.time}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) {
                  setAppointment(prev => ({ ...prev, time: selectedTime }));
                }
              }}
            />
          )}

          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.submitButton, loading && styles.disabledButton]}
              onPress={handleAddAppointment}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="calendar" size={20} color="white" />
                  <Text style={styles.submitButtonText}>Schedule</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  formContainer: {
    padding: 20,
    maxHeight: 500,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  typeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  typeTextSelected: {
    color: '#6366F1',
    fontWeight: '600',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  dateTimeText: {
    fontSize: 14,
    color: '#374151',
  },
  durationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  durationButtonSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#6366F1',
  },
  durationText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  durationTextSelected: {
    color: '#6366F1',
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  submitButton: {
    backgroundColor: '#6366F1',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AppointmentModal;