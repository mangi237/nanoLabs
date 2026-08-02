// screens/admin/AnalyticsDashboard.tsx - COMPLETE FIX WITH REAL DATA

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/authContext';
import { useTheme } from '../../context/themeContext';
import { collection, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { BarChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const AnalyticsDashboard = () => {
  const { colors } = useTheme();
  const { lab } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalTests: 0,
    completedTests: 0,
    pendingTests: 0,
    totalRevenue: 0,
    pendingRevenue: 0
  });
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    if (lab?.id) {
      fetchData();
      setupRealTimeListeners();
    }
  }, [lab?.id]);

  const setupRealTimeListeners = () => {
    if (!lab?.id) return () => {};

    // Listen to patients changes
    const patientsUnsubscribe = onSnapshot(
      collection(db, 'labs', lab.id, 'patients'),
      () => {
        fetchData();
      }
    );

    return () => {
      patientsUnsubscribe();
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!lab?.id) return;

      // Fetch patients
      const patientsRef = collection(db, 'labs', lab.id, 'patients');
      const patientsSnap = await getDocs(patientsRef);
      const patients = patientsSnap.docs;
      
      let allTests: any[] = [];
      let allBills: any[] = [];
      
      for (const patient of patients) {
        // Fetch tests
        const testsRef = collection(db, 'labs', lab.id, 'patients', patient.id, 'tests');
        const testsSnap = await getDocs(testsRef);
        const tests = testsSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          patientName: patient.data().name 
        }));
        allTests = [...allTests, ...tests];

        // Fetch bills
        const billsRef = collection(db, 'labs', lab.id, 'patients', patient.id, 'bills');
        const billsSnap = await getDocs(billsRef);
        const bills = billsSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          patientName: patient.data().name 
        }));
        allBills = [...allBills, ...bills];
      }

      const completed = allTests.filter(t => t.status === 'completed');
      const pending = allTests.filter(t => t.status !== 'completed');
      
      const totalRevenue = allBills
        .filter(b => b.status === 'paid')
        .reduce((sum, b) => sum + (b.amount || 0), 0);
      
      const pendingRevenue = allBills
        .filter(b => b.status === 'pending')
        .reduce((sum, b) => sum + (b.amount || 0), 0);

      // Calculate daily data (last 7 days)
      const dailyData = calculateDailyData(allBills);
      
      // Calculate category data
      const categoryData = calculateCategoryData(allTests);

      setStats({
        totalPatients: patients.length,
        totalTests: allTests.length,
        completedTests: completed.length,
        pendingTests: pending.length,
        totalRevenue,
        pendingRevenue
      });
      setDailyData(dailyData);
      setCategoryData(categoryData);
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDailyData = (bills: any[]) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + 1);
    
    const dailyTotals = days.map((_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      const dateStr = date.toISOString().split('T')[0];
      
      const total = bills
        .filter(b => {
          if (!b.createdAt) return false;
          const billDate = new Date(b.createdAt).toISOString().split('T')[0];
          return billDate === dateStr && b.status === 'paid';
        })
        .reduce((sum, b) => sum + (b.amount || 0), 0);
      
      return total;
    });

    return dailyTotals;
  };

  const calculateCategoryData = (tests: any[]) => {
    const categories: { [key: string]: number } = {};
    tests.forEach(test => {
      const cat = test.category || 'Uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    const colors = ['#4CAF50', '#FF9800', '#2196F3', '#9C27B0', '#F44336', '#00BCD4'];
    return Object.entries(categories).map(([name, count], index) => ({
      name,
      population: count,
      color: colors[index % colors.length],
      legendFontColor: '#333',
      legendFontSize: 12
    }));
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
    barPercentage: 0.7
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
          <Text style={styles.statNumber}>{stats.totalPatients}</Text>
          <Text style={styles.statLabel}>Patients</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="flask" size={24} color="#FF9800" />
          <Text style={styles.statNumber}>{stats.totalTests}</Text>
          <Text style={styles.statLabel}>Total Tests</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.completedTests}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="cash" size={24} color="#4CAF50" />
          <Text style={styles.statNumber}>{stats.totalRevenue.toLocaleString()} FCFA</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>

      {dailyData.length > 0 && (
        <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.chartTitle}>Weekly Revenue</Text>
          <BarChart
            data={{
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [{ data: dailyData }]
            }}
            width={width - 40}
            height={200}
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix=" FCFA"
          />
        </View>
      )}

      {categoryData.length > 0 && (
        <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
          <Text style={styles.chartTitle}>Test Categories</Text>
          <PieChart
            data={categoryData}
            width={width - 40}
            height={200}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      )}
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