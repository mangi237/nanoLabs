import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Note } from '../../types/Notes';
import { useAuth } from '../../context/authContext';

interface NotesListProps {
  patientId: string;
  onAddNote: () => void;
}

const NotesList: React.FC<NotesListProps> = ({ patientId, onAddNote }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!user && !authLoading) {
      setLoading(false);
      return;
    }

    if (user) {
      const q = query(
        collection(db, 'notes'),
        where('patientId', '==', patientId),
        orderBy('createdAt', 'desc')
      );
      
      setLoading(true);
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const notesData: Note[] = [];
          snapshot.forEach((doc) => {
            notesData.push({ id: doc.id, ...doc.data() } as Note);
          });
          setNotes(notesData);
          setLoading(false);
        },
        (error) => {
          console.error('Firestore error:', error);
          setLoading(false);
          Alert.alert('Error', 'Failed to load notes. Please try again.');
        }
      );

      return () => unsubscribe();
    }
  }, [patientId, user, authLoading]);

  const toggleExpand = (noteId: string) => {
    setExpandedNoteId(expandedNoteId === noteId ? null : noteId);
  };

  const getPriorityIcon = (priority: string): { name: keyof typeof Ionicons.glyphMap, color: string } => {
    switch (priority) {
      case 'high': return { name: 'alert-circle', color: '#E74C3C' };
      case 'medium': return { name: 'information-circle', color: '#F39C12' };
      case 'low': return { name: 'checkmark-circle', color: '#27AE60' };
      default: return { name: 'help-circle', color: '#7F8C8D' };
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  const renderNoteItem = ({ item }: { item: Note }) => {
    const isExpanded = expandedNoteId === item.id;
    const priorityIcon = getPriorityIcon(item.priority);

    return (
      <TouchableOpacity 
        style={[styles.noteItem, isExpanded && styles.noteItemExpanded]}
        onPress={() => toggleExpand(item.id!)}
      >
        <View style={styles.noteHeader}>
          <View style={styles.noteTitleContainer}>
            <Ionicons name={priorityIcon.name} size={16} color={priorityIcon.color} />
            <Text style={styles.noteTitle} numberOfLines={1}>{item.title}</Text>
          </View>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color="#7F8C8D" 
          />
        </View>

        <View style={styles.noteMeta}>
          <Text style={styles.noteCategory}>{item.category}</Text>
          <Text style={styles.noteDoctor}>By: {item.doctorName}</Text>
          <Text style={styles.noteDate}>{formatDate(item.createdAt)}</Text>
        </View>

        {isExpanded && (
          <View style={styles.noteContent}>
            <Text style={styles.noteText}>{item.content}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (authLoading || loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Patient Notes</Text>
        </View>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#3498DB" />
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Patient Notes</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="lock-closed" size={48} color="#D5D8DC" />
          <Text style={styles.emptyStateText}>Authentication required</Text>
          <Text style={styles.emptyStateSubtext}>Please sign in to view notes</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Patient Notes</Text>
        <TouchableOpacity style={styles.addButton} onPress={onAddNote}>
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Add Note</Text>
        </TouchableOpacity>
      </View>

      {notes.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text" size={48} color="#D5D8DC" />
          <Text style={styles.emptyStateText}>No notes yet</Text>
          <Text style={styles.emptyStateSubtext}>Add the first note for this patient</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderNoteItem}
          keyExtractor={item => item.id!}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498DB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  listContainer: {
    padding: 16,
  },
  noteItem: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ECF0F1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noteItemExpanded: {
    borderColor: '#3498DB',
    borderWidth: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 8,
  },
  noteMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  noteCategory: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7F8C8D',
    backgroundColor: '#ECF0F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  noteDoctor: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  noteDate: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  noteContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECF0F1',
  },
  noteText: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7F8C8D',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#AAB7B8',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#7F8C8D',
    fontSize: 16,
  },
});

export default NotesList;