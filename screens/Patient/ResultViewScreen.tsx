import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useLanguage } from '../../context/languageContext';
import { useTheme } from '../../context/themeContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const ResultViewScreen = ({ route, navigation }: any) => {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const { user, lab } = useAuth();
  const { testId } = route.params || {};
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestResult();
  }, []);

  const fetchTestResult = async () => {
    try {
      if (!user?.id || !lab?.id || !testId) return;
      
      const testRef = doc(db, 'labs', lab.id, 'patients', user.id, 'tests', testId);
      const testDoc = await getDoc(testRef);
      if (testDoc.exists()) {
        setTest({ id: testDoc.id, ...testDoc.data() });
      }
    } catch (error) {
      console.error('Error fetching test result:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `🧪 Test: ${test?.testName}\n📊 Status: ${test?.status}\n📅 Date: ${test?.completedDate ? new Date(test.completedDate).toLocaleDateString() : 'N/A'}\n\n🔬 Results: ${test?.result || 'Pending...'}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleRequestVirtual = () => {
    navigation.navigate('RequestVirtualResults', { testId });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!test) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={60} color="#F44336" />
        <Text style={styles.errorText}>{t('test_not_found')}</Text>
      </View>
    );
  }

  const isCompleted = test.status === 'completed';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.testName}>{test.testName}</Text>
        <View style={[styles.statusBadge, { backgroundColor: isCompleted ? '#4CAF50' : '#FF9800' }]}>
          <Text style={styles.statusText}>{isCompleted ? '✅ ' + t('completed') : '⏳ ' + t('processing')}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>{t('test_details')}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('category')}</Text>
            <Text style={styles.detailValue}>{test.category || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('requested_date')}</Text>
            <Text style={styles.detailValue}>
              {test.requestedDate ? new Date(test.requestedDate).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          {isCompleted && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('completed_date')}</Text>
              <Text style={styles.detailValue}>
                {test.completedDate ? new Date(test.completedDate).toLocaleDateString() : 'N/A'}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={styles.cardTitle}>{t('result')}</Text>
          {isCompleted ? (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>{test.result || t('result_ready')}</Text>
              {test.resultFile && (
                <TouchableOpacity style={styles.viewResultButton}>
                  <Text style={styles.viewResultText}>{t('view_full_result')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.pendingContainer}>
              <Ionicons name="time" size={40} color="#FF9800" />
              <Text style={styles.pendingText}>{t('result_pending')}</Text>
              <Text style={styles.pendingSubtext}>{t('check_back_later')}</Text>
            </View>
          )}
        </View>

        {isCompleted && (
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handleShare}>
              <Ionicons name="share-social" size={20} color="white" />
              <Text style={styles.actionButtonText}>{t('share_result')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#25D366' }]} onPress={handleRequestVirtual}>
              <Ionicons name="logo-whatsapp" size={20} color="white" />
              <Text style={styles.actionButtonText}>{t('request_virtual')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#F44336',
    marginTop: 15,
    fontFamily: 'Poppins-Medium',
  },
  header: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  testName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Poppins-Bold',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  content: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 12,
    fontFamily: 'Poppins-Bold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  resultContainer: {
    padding: 8,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    fontFamily: 'Poppins-Regular',
  },
  viewResultButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    alignItems: 'center',
  },
  viewResultText: {
    color: '#1A237E',
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  pendingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  pendingText: {
    fontSize: 18,
    color: '#FF9800',
    marginTop: 10,
    fontFamily: 'Poppins-Medium',
  },
  pendingSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default ResultViewScreen;