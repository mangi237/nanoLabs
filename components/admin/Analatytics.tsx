// components/admin/Analytics.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Bill, Patient } from '../../types/Patient';

const { width: screenWidth } = Dimensions.get('window');

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<any>(null);
  const [revenueByCategory, setRevenueByCategory] = useState<any>(null);
  const [patientStats, setPatientStats] = useState<any>(null);

 useEffect(() => {
  fetchAnalyticsData();
  
  // Real-time subscriptions
  const patientsUnsubscribe = onSnapshot(
    query(collection(db, 'patients')),
    () => {
      fetchAnalyticsData(); // Re-fetch when patients change
    }
  );

  const billsUnsubscribe = onSnapshot(
    query(collection(db, 'bills')),
    () => {
      fetchAnalyticsData(); // Re-fetch when bills change
    }
  );

  return () => {
    patientsUnsubscribe();
    billsUnsubscribe();
  };
}, []);

const fetchAnalyticsData = async () => {
  try {
    setLoading(true);
    
    // Fetch all patients
    const patientsSnapshot = await getDocs(collection(db, 'patients'));
    const patients = patientsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Patient[];

    // Collect all bills from patient subcollections
    let allBills: Bill[] = [];
    
    for (const patient of patients) {
      const billsQuery = query(collection(db, 'patients', patient.id!, 'bills'));
      const billsSnapshot = await getDocs(billsQuery);
      const patientBills = billsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bill[];
      
      allBills = [...allBills, ...patientBills];
    }

    processAnalyticsData(allBills, patients);
    
  } catch (error) {
    console.error('Error fetching analytics data:', error);
  } finally {
    setLoading(false);
  }
};


  const subscribeToRealTimeData = () => {
    const billsUnsubscribe = onSnapshot(
      query(collection(db, 'bills')),
      (snapshot) => {
        const bills = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Bill[];
        
        // Re-fetch patients to get updated data
        getDocs(query(collection(db, 'patients'))).then(patientsSnapshot => {
          const patients = patientsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Patient[];
          processAnalyticsData(bills, patients);
        });
      }
    );

    return billsUnsubscribe;
  };

  const processAnalyticsData = (bills: Bill[], patients: Patient[]) => {
    // Process last 7 days revenue
    const last7Days = getLast7Days();
    const dailyRevenue = calculateDailyRevenue(bills, last7Days);
    
    // Process revenue by category
    const categoryRevenue = calculateRevenueByCategory(bills);
    
    // Process patient statistics
    const stats = calculatePatientStats(patients, bills);

    setFinancialData({
      labels: last7Days.map(day => day.label),
      datasets: [{
        data: dailyRevenue,
        color: (opacity = 1) => `rgba(30, 150, 169, ${opacity})`,
        strokeWidth: 2
      }]
    });

    setRevenueByCategory({
      labels: categoryRevenue.map(item => item.category),
      datasets: [{
        data: categoryRevenue.map(item => item.amount),
      }]
    });

    setPatientStats(stats);
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: new Date(date),
        label: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    return days;
  };

 const calculateDailyRevenue = (bills: Bill[], days: any[]) => {
  return days.map(day => {
    const dayStart = new Date(day.date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(day.date);
    dayEnd.setHours(23, 59, 59, 999);

    return bills
      .filter(bill => {
        const billDate = bill.createdAt ? bill.createdAt : null;
        return billDate >= dayStart && billDate <= dayEnd && bill.status === 'paid';
      })
      .reduce((total, bill) => total + bill.amount, 0);
  });
};
  const calculateRevenueByCategory = (bills: Bill[]) => {
    const categoryMap: { [key: string]: number } = {};
    
    bills
      .filter(bill => bill.status === 'paid')
      .forEach(bill => {
        categoryMap[bill.category] = (categoryMap[bill.category] || 0) + bill.amount;
      });

    return Object.entries(categoryMap)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const calculatePatientStats = (patients: Patient[], bills: Bill[]) => {
    const totalPatients = patients.length;
    const admittedPatients = patients.filter(p => p.status === 'admitted').length;
    const outpatientPatients = patients.filter(p => p.admissionStatus === 'outpatient').length;
    const inpatientPatients = patients.filter(p => p.admissionStatus === 'inpatient').length;
    
    const totalRevenue = bills
      .filter(bill => bill.status === 'paid')
      .reduce((total, bill) => total + bill.amount, 0);

    const averageBillAmount = bills.length > 0 ? totalRevenue / bills.length : 0;

    return {
      totalPatients,
      admittedPatients,
      outpatientPatients,
      inpatientPatients,
      totalRevenue,
      averageBillAmount
    };
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(30, 150, 169, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#1E96A9'
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#1E96A9" />
        <Text style={styles.loadingText}>Loading Analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Financial Analytics</Text>
      
      {/* Revenue Overview Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${patientStats?.totalRevenue?.toLocaleString() || 0}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{patientStats?.totalPatients || 0}</Text>
          <Text style={styles.statLabel}>Total Patients</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${patientStats?.averageBillAmount?.toFixed(0) || 0}</Text>
          <Text style={styles.statLabel}>Avg Bill</Text>
        </View>
      </View>

      {/* 7-Day Revenue Trend */}
      {financialData && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>7-Day Revenue Trend</Text>
          <LineChart
            data={financialData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      )}

      {/* Revenue by Category */}
      {revenueByCategory && revenueByCategory.labels.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Revenue by Category</Text>
          <BarChart
          yAxisLabel='Amount'
yAxisSuffix='income'
            data={revenueByCategory}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
            }}
            style={styles.chart}
            showValuesOnTopOfBars
          />
        </View>
      )}

      {/* Patient Distribution */}
      {patientStats && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Patient Distribution</Text>
          <View style={styles.patientStats}>
            <View style={styles.patientStatItem}>
              <View style={[styles.statIndicator, { backgroundColor: '#3498DB' }]} />
              <Text style={styles.patientStatText}>
                Outpatient: {patientStats.outpatientPatients}
              </Text>
            </View>
            <View style={styles.patientStatItem}>
              <View style={[styles.statIndicator, { backgroundColor: '#27AE60' }]} />
              <Text style={styles.patientStatText}>
                Inpatient: {patientStats.inpatientPatients}
              </Text>
            </View>
            <View style={styles.patientStatItem}>
              <View style={[styles.statIndicator, { backgroundColor: '#E74C3C' }]} />
              <Text style={styles.patientStatText}>
                Admitted: {patientStats.admittedPatients}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Category Breakdown */}
      {revenueByCategory && revenueByCategory.labels.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Revenue Breakdown</Text>
          <View style={styles.categoryList}>
            {revenueByCategory.labels.map((category: string, index: number) => (
              <View key={category} style={styles.categoryItem}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                  <Text style={styles.categoryAmount}>
                    ${revenueByCategory.datasets[0].data[index].toLocaleString()}
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${(revenueByCategory.datasets[0].data[index] / Math.max(...revenueByCategory.datasets[0].data)) * 100}%`,
                        backgroundColor: getCategoryColor(category)
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    consultation: '#3498DB',
    laboratory: '#27AE60',
    radiology: '#E67E22',
    surgery: '#E74C3C',
    medication: '#9B59B6',
    ward: '#1E96A9',
    emergency: '#F39C12',
    miscellaneous: '#95A5A6'
  };
  return colors[category] || '#7F8C8D';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#7F8C8D',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 8,
  },
  patientStats: {
    marginTop: 8,
  },
  patientStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  patientStatText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  categoryList: {
    marginTop: 8,
  },
  categoryItem: {
    marginBottom: 12,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
    textTransform: 'capitalize',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E96A9',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#ECF0F1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});

export default Analytics;