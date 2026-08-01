// screens/patient/BookAppointmentScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/authContext';
import { useTheme } from '../../context/themeContext';
import DateTimePicker from '@react-native-community/datetimepicker';

const BookAppointmentScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const { user, lab } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: new Date(),
    time: new Date(),
    duration: '30',
    location: '',
    notes: '',
    type: 'consultation'
  });

  const appointmentTypes = [
    { value: 'consultation', label: 'Consultation', icon: 'chatbubbles' },
    { value: 'follow-up', label: 'Follow-up', icon: 'refresh' },
    { value: 'test', label: 'Test', icon: 'flask' },
    { value: 'emergency', label: 'Emergency', icon: 'warning' }
  ];

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.location.trim()) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const appointmentDateTime = new Date(formData.date);
      appointmentDateTime.setHours(formData.time.getHours());
      appointmentDateTime.setMinutes(formData.time.getMinutes());

      await addDoc(
        collection(db, 'labs', lab?.id, 'patients', user?.id, 'appointments'),
        {
          ...formData,
          date: Timestamp.fromDate(appointmentDateTime),
          time: `${formData.time.getHours().toString().padStart(2, '0')}:${formData.time.getMinutes().toString().padStart(2, '0')}`,
          status: 'scheduled',
          patientName: user?.name,
          patientId: user?.id,
          createdAt: Timestamp.now()
        }
      );

      Alert.alert('✅ Success', 'Appointment booked successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to book appointment');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
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
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>📅 Book Appointment</Text>

        <TextInput
          style={styles.input}
          placeholder="Appointment Title *"
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
        />

        <Text style={styles.label}>Type</Text>
        <View style={styles.typeGrid}>
          {appointmentTypes.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeButton,
                formData.type === type.value && styles.typeButtonSelected
              ]}
              onPress={() => setFormData({ ...formData, type: type.value })}
            >
              <Ionicons name={type.icon as any} size={20} color={formData.type === type.value ? '#1A237E' : '#666'} />
              <Text style={[styles.typeText, formData.type === type.value && styles.typeTextSelected]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar" size={20} color="#1A237E" />
          <Text style={styles.dateTimeText}>{formatDate(formData.date)}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setFormData({ ...formData, date: selectedDate });
            }}
            minimumDate={new Date()}
          />
        )}

        <Text style={styles.label}>Time</Text>
        <TouchableOpacity style={styles.dateTimeButton} onPress={() => setShowTimePicker(true)}>
          <Ionicons name="time" size={20} color="#1A237E" />
          <Text style={styles.dateTimeText}>{formatTime(formData.time)}</Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            value={formData.time}
            mode="time"
            display="default"
            onChange={(event, selectedTime) => {
              setShowTimePicker(false);
              if (selectedTime) setFormData({ ...formData, time: selectedTime });
            }}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Duration (minutes)"
          value={formData.duration}
          onChangeText={(text) => setFormData({ ...formData, duration: text })}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Location *"
          value={formData.location}
          onChangeText={(text) => setFormData({ ...formData, location: text })}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Notes"
          value={formData.notes}
          onChangeText={(text) => setFormData({ ...formData, notes: text })}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitButtonText}>Book Appointment</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 20,
    fontFamily: 'Poppins-Bold',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: 'white',
    fontFamily: 'Poppins-Regular',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonSelected: {
    borderColor: '#1A237E',
    backgroundColor: '#E8EAF6',
  },
  typeText: {
    fontSize: 13,
    color: '#555',
    fontFamily: 'Poppins-Regular',
  },
  typeTextSelected: {
    color: '#1A237E',
    fontWeight: '600',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  dateTimeText: {
    fontSize: 15,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default BookAppointmentScreen;