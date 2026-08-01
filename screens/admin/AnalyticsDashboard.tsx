// screens/admin/AnalyticsDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useTheme } from '../../context/themeContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const AnalyticsDashboard = () => {
  const { colors } = useTheme();
  const { lab } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    revenue: [],
    tests: [],
    patients: [],
    categories: [],
    stats: {
      totalPatients: 0,
      totalTests: 0,
      completedTests: 0,
      totalRevenue: 0,
      pendingRevenue: 0
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch all data here
      const patientsRef = collection(db, 'labs', lab?.id, 'patients');
      const patientsSnap = await getDocs(patientsRef);
      const patients = patientsSnap.docs;
      
      let allTests: any[] = [];
      for (const patient of patients) {
        const testsRef = collection(db, 'labs', lab?.id, 'patients', patient.id, 'tests');
        const testsSnap = await getDocs(testsRef);
        const tests = testsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        allTests = [...allTests, ...tests];
      }

      const completed = allTests.filter(t => t.status === 'completed');
      const totalRevenue = completed.length * 1000;
      const pendingRevenue = (allTests.length - completed.length) * 1000;

      setData({
        revenue: [],
        tests: [],
        patients: [],
        categories: [],
        stats: {
          totalPatients: patients.length,
          totalTests: allTests.length,
          completedTests: completed.length,
          totalRevenue,
          pendingRevenue
        }
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(26, 35, 126, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    barPercentage: 0.5
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>📊 Analytics Dashboard</Text>
        <Text style={styles.subtitle}>{lab?.name}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="people" size={24} color="#2196F3" />
          <Text style={styles.statNumber}>{data.stats.totalPatients}</Text>
          <Text style={styles.statLabel}>Total Patients</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="flask" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{data.stats.totalTests}</Text>
          <Text style={styles.statLabel}>Total Tests</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{data.stats.completedTests}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="cash" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{data.stats.totalRevenue.toLocaleString()} FCFA</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
        <Text style={styles.chartTitle}>Revenue Overview</Text>
        <BarChart
          data={{
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{ data: [50, 120, 80, 200, 150, 100, 180] }]
          }}
          width={width - 40}
          height={200}
          chartConfig={chartConfig}
          style={styles.chart}
        />
      </View>

      <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
        <Text style={styles.chartTitle}>Test Status Distribution</Text>
        <PieChart
          data={[
            { name: 'Completed', population: data.stats.completedTests, color: '#4CAF50' },
            { name: 'Pending', population: data.stats.totalTests - data.stats.completedTests, color: '#FF9800' }
          ]}
          width={width - 40}
          height={200}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  header: {
    padding: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A237E',
    fontFamily: 'Poppins-Bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontFamily: 'Poppins-Regular',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A237E',
    marginVertical: 4,
    fontFamily: 'Poppins-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins-Regular',
  },
  chartCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  chart: {
    borderRadius: 8,
  },
});

export default AnalyticsDashboard;