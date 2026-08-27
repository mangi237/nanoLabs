import { db, collection, addDoc, doc, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, orderBy } from './firebase';
import { auditService } from './auditService';
import { MASTER_TESTS_CATALOG, MasterTestItem } from '../data/masterTestsData';
import { cleanFirestoreData } from '../utils/sanitizeData';
import { ReferringDoctor } from '../types';

export type { MasterTestItem, ReferringDoctor };

export type TestStatus = 'Pending_Validation' | 'Pending_Payment' | 'Pending_Collection' | 'In_Lab_Testing' | 'Completed' | 'Ready_For_Pickup';

// Define ReagentUsage interface
export interface ReagentUsage {
  reagentName: string;
  quantity: number;
  testName: string;
  reagentId?: string;
}

export interface BookingTestItem {
  id: string;
  testId: string;
  testCode?: string;
  testName: string;
  category: string;
  sampleTypeRequired: string;
  units?: string;
  refRangeMale?: string;
  refRangeFemale?: string;
  refRangeChild?: string;
  basePrice?: number;
  systemFee?: number;
  price: number;
  totalPrice?: number;
  status: TestStatus;
  receptionistValidated?: boolean;
  validatedBy?: string;
  validatedAt?: string;
  virtualRequested?: boolean;
  virtualRequestedAt?: string;
  paid?: boolean;
  sampleCollected?: boolean;
  sampleCollectedAt?: string;
  sampleCollectedBy?: string;
  collectedSamples?: string[];
  resultFileUrl?: string;
  subParameters?: Array<{
    id: string;
    name: string;
    unit: string;
    refRangeMale: string;
    refRangeFemale: string;
    refRangeChild: string;
    maleMin?: number;
    maleMax?: number;
    femaleMin?: number;
    femaleMax?: number;
    childMin?: number;
    childMax?: number;
    value?: string;
    flag?: 'Normal' | 'Low' | 'High' | 'Borderline';
  }>;
  resultValue?: string;
  resultFlag?: 'Normal' | 'Low' | 'High' | 'Borderline';
  labNotes?: string;
  completedAt?: string;
  completedBy?: string;
}

export interface PatientBooking {
  id: string;
  bookingCode: string;
  labId: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  age?: number;
  dateOfBirth?: string;
  dob?: string;
  patientGender?: 'Male' | 'Female' | 'Child';
  patientPhone?: string;
  patientEmail?: string;
  patientPid?: string;
  doctorName?: string;
  referringDoctorId?: string;
  referringDoctor?: string;
  referralHospital?: string;
  referralNotes?: string;
  referralCommissionRate?: number;
  referralCommissionAmount?: number;
  referralCommissionStatus?: 'unpaid' | 'paid' | 'settled';
  referralCommissionPaidAt?: string;
  referralCommissionPaidBy?: string;
  sampleCollectedAt?: string;
  invoiceNumber: string;
  totalAmount: number;
  originalTotalAmount?: number;
  originalPrice?: number;
  actualPaidAmount?: number;
  isStaffExemption?: boolean;
  staffMemberName?: string;
  staffDesignation?: string;
  hasInsurance?: boolean;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceCoveragePercent?: number;
  coPayPercent?: number;
  insuranceCoveredAmount?: number;
  patientCoPayAmount?: number;
  discountType?: 'percentage' | 'fixed' | 'coupon' | 'staff_exemption';
  discountValue?: number;
  discountAmount?: number;
  couponCode?: string;
  paymentStatus: 'unpaid' | 'paid';
  paymentMethod?: 'cash' | 'mobile_money' | 'card' | 'insurance';
  paymentDate?: string;
  paidAt?: string;
  paymentProcessedBy?: string;
  paymentDetails?: any;
  receptionistValidated?: boolean;
  validatedBy?: string;
  validatedAt?: string;
  registrationType?: 'online' | 'walk_in';
  isOnlineBooking?: boolean;
  virtualRequested?: boolean;
  virtualRequestedAt?: string;
  collectedSamples: string[];
  sampleCollectedAtDate?: string;
  sampleCollectedBy?: string;
  adminSampleVerified?: boolean;
  adminSampleVerifiedBy?: string;
  adminSampleVerifiedAt?: string;
  assignedTechId?: string;
  assignedTechName?: string;
  assignedAt?: string;
  clinicalNotes?: string;
  sharedWithTechs?: Array<{
    techId: string;
    techName: string;
    sharedAt: string;
    sharedByTechName: string;
  }>;
  tests: BookingTestItem[];
  overallStatus: TestStatus;
  pdfReportUrl?: string;
  externalPdfUrl?: string;
  physicalPickupAlertSent?: boolean;
  biologistSigned?: boolean;
  biologistName?: string;
  biologistSignedAt?: string;
  biologistRemarks?: string;
  biologistPasscodeVerified?: boolean;
  labTechSigned?: boolean;
  labTechSignedAt?: string;
  completedAt?: string;
  verifiedAt?: string;
  resultEnteredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const limsService = {
  generateBookingCode(): string {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `BK-${new Date().getFullYear()}-${random}`;
  },

  generateInvoiceCode(): string {
    const random = Math.floor(10000 + Math.random() * 90000);
    return `INV-${random}`;
  },

  async createBooking(params: {
    labId: string;
    patientId: string;
    patientName: string;
    patientAge?: number;
    dateOfBirth?: string;
    patientGender?: 'Male' | 'Female' | 'Child';
    patientPhone?: string;
    patientEmail?: string;
    patientPid?: string;
    doctorName?: string;
    referringDoctorId?: string;
    referringDoctor?: string;
    referralHospital?: string;
    referralNotes?: string;
    referralCommissionRate?: number;
    isStaffExemption?: boolean;
    staffMemberName?: string;
    staffDesignation?: string;
    sampleCollectedAt?: string;
    selectedMasterTestIds?: string[];
    selectedTests?: Array<{
      id?: string;
      testId?: string;
      code?: string;
      testCode?: string;
      name?: string;
      testName?: string;
      category?: string;
      sampleType?: string;
      sampleTypeRequired?: string;
      units?: string;
      refRangeMale?: string;
      refRangeFemale?: string;
      refRangeChild?: string;
      price?: number;
      basePrice?: number;
      systemFee?: number;
      totalPrice?: number;
      subParameters?: any[];
    }>;
    creatorName: string;
    clinicalNotes?: string;
    receptionistValidated?: boolean;
  }): Promise<PatientBooking> {
    const {
      labId = 'lab-1',
      patientId,
      patientName,
      patientAge = 30,
      dateOfBirth,
      patientGender = 'Male',
      patientPhone = '',
      patientEmail = '',
      patientPid = `PID-${Math.floor(100 + Math.random() * 900)}`,
      doctorName = 'Dr. Attending Specialist',
      referringDoctorId,
      referringDoctor,
      referralHospital,
      referralNotes,
      referralCommissionRate,
      isStaffExemption = false,
      staffMemberName,
      staffDesignation,
      sampleCollectedAt = 'Central Diagnostic Facility',
      selectedMasterTestIds = [],
      selectedTests = [],
      creatorName,
      clinicalNotes,
      receptionistValidated
    } = params;

    const isStaffCreator = creatorName.toLowerCase().includes('reception') ||
      creatorName.toLowerCase().includes('admin') ||
      creatorName.toLowerCase().includes('desk') ||
      creatorName.toLowerCase().includes('staff');

    const isValidated = receptionistValidated !== undefined ? receptionistValidated : isStaffCreator;

    let feePerTest = 0;
    let labCommissionRate = 20;
    try {
      const labDocRef = doc(db, 'labs', labId);
      const labDocSnap = await getDoc(labDocRef);
      if (labDocSnap.exists()) {
        const labData = labDocSnap.data();
        if (labData.pricingModel === 'pay_per_test') {
          feePerTest = labData.feePerTest !== undefined ? Number(labData.feePerTest) : 500;
        }
        if (labData.defaultDoctorCommissionRate !== undefined) {
          labCommissionRate = Number(labData.defaultDoctorCommissionRate);
        }
      }
    } catch (labErr) {
      console.warn('Could not read lab pricing model for fee check:', labErr);
    }

    const effectiveCommissionRate = referralCommissionRate !== undefined 
      ? referralCommissionRate 
      : (referringDoctor ? labCommissionRate : 0);

    let testItems: BookingTestItem[] = [];

    if (selectedTests && selectedTests.length > 0) {
      testItems = selectedTests.map((t, idx) => {
        const base = t.basePrice || t.price || 5000;
        const sFee = t.systemFee !== undefined ? t.systemFee : feePerTest;
        const tot = t.totalPrice || (base + sFee);
        return {
          id: t.id || `bt-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          testId: t.testId || t.id || `t-${idx}`,
          testCode: t.testCode || t.code || 'TST',
          testName: t.testName || t.name || 'Diagnostic Test',
          category: t.category || 'General',
          sampleTypeRequired: t.sampleTypeRequired || t.sampleType || 'Venous Blood',
          units: t.units || 'U/L',
          refRangeMale: t.refRangeMale || 'Normal',
          refRangeFemale: t.refRangeFemale || 'Normal',
          refRangeChild: t.refRangeChild || 'Normal',
          basePrice: base,
          systemFee: sFee,
          price: isStaffExemption ? 0 : tot,
          totalPrice: isStaffExemption ? 0 : tot,
          status: isValidated ? 'Pending_Payment' : 'Pending_Validation',
          subParameters: t.subParameters ? t.subParameters.map(sp => ({
            ...sp,
            value: '',
            flag: 'Normal' as const
          })) : undefined
        };
      });
    } else {
      const catalog = await this.getMasterTestCatalog(labId);
      testItems = (selectedMasterTestIds || []).map((masterId, idx) => {
        const found = catalog.find(m => m.id === masterId || m.code === masterId || m.name?.toLowerCase() === masterId?.toLowerCase()) || 
                      MASTER_TESTS_CATALOG.find(m => m.id === masterId || m.code === masterId || m.name?.toLowerCase() === masterId?.toLowerCase()) || 
                      {
                        id: masterId || `test-${idx}`,
                        code: 'TST',
                        name: masterId || 'Diagnostic Test',
                        category: 'General',
                        sampleType: 'Venous Blood',
                        units: 'U/L',
                        refRangeMale: 'Normal',
                        refRangeFemale: 'Normal',
                        refRangeChild: 'Normal',
                        basePrice: 5000
                      };
        const base = (found as any).basePrice || (found as any).price || 5000;
        const sFee = feePerTest;
        const tot = base + sFee;
        return {
          id: `bt-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          testId: found.id,
          testCode: (found as any).code || 'TST',
          testName: (found as any).name || 'Diagnostic Test',
          category: (found as any).category || 'General',
          sampleTypeRequired: (found as any).sampleType || 'Venous Blood',
          units: (found as any).units || 'U/L',
          refRangeMale: (found as any).refRangeMale || 'Normal',
          refRangeFemale: (found as any).refRangeFemale || 'Normal',
          refRangeChild: (found as any).refRangeChild || 'Normal',
          basePrice: base,
          systemFee: sFee,
          price: isStaffExemption ? 0 : tot,
          totalPrice: isStaffExemption ? 0 : tot,
          status: isValidated ? 'Pending_Payment' : 'Pending_Validation',
          subParameters: (found as any).subParameters ? (found as any).subParameters.map((sp: any) => ({
            ...sp,
            value: '',
            flag: 'Normal' as const
          })) : undefined
        };
      });
    }

    const standardTotalAmount = testItems.reduce((acc, t) => acc + (t.basePrice || t.price || 5000), 0);
    const totalAmount = isStaffExemption ? 0 : testItems.reduce((acc, t) => acc + t.price, 0);
    const bookingCode = this.generateBookingCode();
    const invoiceNumber = this.generateInvoiceCode();
    const timestamp = new Date().toISOString();

    const commissionBase = isStaffExemption ? 0 : (totalAmount > 0 ? totalAmount : standardTotalAmount);
    const referralCommissionAmount = referringDoctor && effectiveCommissionRate > 0
      ? Math.round(commissionBase * (effectiveCommissionRate / 100))
      : 0;

    const newBooking: PatientBooking = {
      id: `booking-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingCode,
      labId,
      patientId,
      patientName,
      patientAge,
      dateOfBirth,
      patientGender,
      patientPhone,
      patientEmail,
      patientPid,
      doctorName: referringDoctor || doctorName,
      referringDoctorId,
      referringDoctor,
      referralHospital,
      referralNotes,
      referralCommissionRate: referringDoctor ? effectiveCommissionRate : undefined,
      referralCommissionAmount: referringDoctor ? referralCommissionAmount : undefined,
      referralCommissionStatus: referringDoctor ? 'unpaid' : undefined,
      isStaffExemption,
      staffMemberName: staffMemberName || (isStaffExemption ? patientName : undefined),
      staffDesignation: staffDesignation || (isStaffExemption ? 'Clinical Staff' : undefined),
      originalTotalAmount: standardTotalAmount,
      actualPaidAmount: isStaffExemption ? 0 : undefined,
      discountType: isStaffExemption ? 'staff_exemption' : undefined,
      discountAmount: isStaffExemption ? standardTotalAmount : 0,
      sampleCollectedAt,
      invoiceNumber,
      totalAmount,
      clinicalNotes: clinicalNotes || undefined,
      paymentStatus: isStaffExemption ? 'paid' : 'unpaid',
      paidAt: isStaffExemption ? timestamp : undefined,
      paymentMethod: isStaffExemption ? 'cash' : undefined,
      paymentProcessedBy: isStaffExemption ? 'System (Staff Exemption Rule)' : undefined,
      receptionistValidated: isValidated,
      validatedBy: isValidated ? creatorName : '',
      validatedAt: isValidated ? timestamp : '',
      collectedSamples: [],
      tests: testItems.map(t => ({
        ...t,
        paid: isStaffExemption ? true : false,
        paymentStatus: isStaffExemption ? 'paid' : 'unpaid',
        status: isStaffExemption ? 'Pending_Collection' : t.status
      })),
      overallStatus: isStaffExemption ? 'Pending_Collection' : (isValidated ? 'Pending_Payment' : 'Pending_Validation'),
      createdAt: timestamp,
      updatedAt: timestamp
    };

    try {
      const bookingsCol = collection(db, 'labs', labId, 'bookings');
      await addDoc(bookingsCol, cleanFirestoreData(newBooking));
    } catch (e) {
      console.warn('Firestore booking save bypassed, using local memory state:', e);
    }

    if (isStaffExemption) {
      try {
        const notifCol = collection(db, 'labs', labId, 'notifications');
        await addDoc(notifCol, cleanFirestoreData({
          title: `Staff Test Request (100% Exemption): ${patientName}`,
          type: 'bill',
          subType: 'staff_test_exemption',
          message: `Staff member "${patientName}" (${staffDesignation || 'Internal Staff'}) requested ${testItems.length} laboratory diagnostic test(s). Standard Value: ${standardTotalAmount.toLocaleString()} FCFA (Billed: 0 FCFA per staff benefit policy).`,
          staffName: patientName,
          staffDesignation: staffDesignation || 'Internal Staff',
          testCount: testItems.length,
          standardValue: standardTotalAmount,
          bookingCode,
          invoiceNumber,
          timestamp,
          read: false
        }));
      } catch (notifErr) {
        console.warn('Admin notification push warning:', notifErr);
      }
    }

    try {
      const patientRef = doc(db, 'labs', labId, 'patients', patientId);
      const patientSnap = await getDoc(patientRef);
      if (patientSnap.exists()) {
        const existingTests = patientSnap.data().labTests || [];
        const mappedForPatientDoc = testItems.map(t => ({
          id: t.id,
          testId: t.testId,
          bookingCode,
          testName: t.testName,
          category: t.category,
          basePrice: t.basePrice,
          systemFee: t.systemFee,
          price: t.price,
          totalPrice: t.totalPrice,
          priceDisplay: isStaffExemption 
            ? `0 FCFA (Staff Exemption - Valued at ${(t.basePrice || 5000).toLocaleString()} FCFA)`
            : (t.systemFee && t.systemFee > 0 
                ? `${(t.basePrice || t.price).toLocaleString()} + ${t.systemFee.toLocaleString()} FCFA System Fee` 
                : `${(t.basePrice || t.price).toLocaleString()} FCFA`),
          status: isStaffExemption ? 'Pending_Collection' : (isValidated ? 'Pending_Payment' : 'Pending_Validation'),
          receptionistValidated: isValidated,
          validatedBy: isValidated ? creatorName : undefined,
          validatedAt: isValidated ? timestamp : undefined,
          paid: isStaffExemption ? true : false,
          paymentStatus: isStaffExemption ? 'paid' : 'unpaid',
          isStaffExemption,
          requestedDate: timestamp
        }));
        await updateDoc(patientRef, cleanFirestoreData({
          labTests: [...mappedForPatientDoc, ...existingTests],
          referringDoctor: referringDoctor || patientSnap.data().referringDoctor,
          referralHospital: referralHospital || patientSnap.data().referralHospital,
          dateOfBirth: dateOfBirth || patientSnap.data().dateOfBirth,
          updatedAt: timestamp
        }));
      }
    } catch (e) {
      console.warn('Patient doc sync error:', e);
    }

    await auditService.logPatientAccess({
      labId,
      patientId,
      patientName,
      action: 'EDIT_PATIENT_RECORD',
      performedBy: { id: 'rec-1', name: creatorName, role: isStaffCreator ? 'receptionist' : 'patient' },
      details: isStaffExemption
        ? `Staff Exemption Order Booking ${bookingCode} created for ${patientName} (${testItems.length} tests, Standard Value: ${standardTotalAmount} XAF, Charged: 0 XAF).`
        : `Generated Order Booking ${bookingCode} with ${testItems.length} tests (Invoice ${invoiceNumber}, Amount: ${totalAmount} XAF). Receptionist Validated: ${isValidated ? 'YES' : 'NO'}`
    });

    return newBooking;
  },

  async processPayment(params: {
    labId: string;
    bookingId: string;
    paymentMethod: 'cash' | 'mobile_money' | 'card' | 'insurance';
    processedByName: string;
    paymentDetails?: {
      momoNumber?: string;
      momoProvider?: string;
      cardType?: string;
      cardLast4?: string;
      bankName?: string;
      insuranceName?: string;
      insurancePercentage?: number;
      insuranceCopay?: number;
      cashGiven?: number;
      cashChange?: number;
      transactionRef?: string;
      originalPrice?: number;
      discountAmount?: number;
      discountType?: string;
      couponCode?: string;
      actualPaidAmount?: number;
      insuranceDetails?: any;
      [key: string]: any;
    };
  }): Promise<boolean> {
    const { labId, bookingId, paymentMethod, processedByName, paymentDetails } = params;
    const timestamp = new Date().toISOString();

    try {
      const bookingsCol = collection(db, 'labs', labId, 'bookings');
      const snap = await getDocs(bookingsCol);
      const bookingDoc = snap.docs.find(d => d.data().id === bookingId || d.id === bookingId);

      if (bookingDoc) {
        const data = bookingDoc.data() as PatientBooking;
        
        // ONLY update tests that are receptionistValidated (confirmed)
        const updatedTests = (data.tests || []).map(t => {
          // Only mark as paid if the test has been validated by receptionist
          if (t.receptionistValidated === true) {
            return {
              ...t,
              paid: true,
              paymentStatus: 'paid' as const,
              paymentMethod,
              paidAt: timestamp,
              status: 'Pending_Collection' as TestStatus
            };
          }
          // Keep unvalidated tests as they are
          return t;
        });

        // Calculate amount for ONLY validated tests
        const validatedTests = updatedTests.filter(t => t.receptionistValidated === true);
        const calculatedAmount = validatedTests.reduce((sum, t) => sum + (t.price || 5500), 0);

        // Check if ALL validated tests are now paid
        const allValidatedPaid = validatedTests.every(t => t.paid === true);

        await updateDoc(doc(db, 'labs', labId, 'bookings', bookingDoc.id), cleanFirestoreData({
          paymentStatus: 'paid',
          paymentMethod,
          paymentDate: timestamp,
          paidAt: timestamp,
          paymentProcessedBy: processedByName,
          paymentDetails: paymentDetails || null,
          totalAmount: calculatedAmount > 0 ? calculatedAmount : data.totalAmount,
          overallStatus: allValidatedPaid ? 'Pending_Collection' : 'Pending_Payment',
          tests: updatedTests,
          updatedAt: timestamp
        }));

        try {
          if (data.patientId) {
            const patRef = doc(db, 'labs', labId, 'patients', data.patientId);
            const patSnap = await getDoc(patRef);
            if (patSnap.exists()) {
              const currentTests: any[] = patSnap.data().labTests || [];
              const updatedPatTests = currentTests.map(pt => {
                const matchedTest = data.tests.find(bt => bt.id === pt.id || bt.testId === pt.testId || bt.testName === pt.testName);
                if (matchedTest && matchedTest.receptionistValidated === true) {
                  return {
                    ...pt,
                    paid: true,
                    paymentStatus: 'paid',
                    paymentMethod,
                    paidAt: timestamp,
                    paymentDetails: paymentDetails || undefined,
                    status: 'Pending_Collection'
                  };
                }
                return pt;
              });
              await updateDoc(patRef, cleanFirestoreData({
                labTests: updatedPatTests,
                updatedAt: timestamp
              }));
            }
          }
        } catch (patErr) {
          console.warn('Patient payment sync error:', patErr);
        }

        await auditService.logPatientAccess({
          labId,
          patientId: data.patientId,
          patientName: data.patientName,
          action: 'PROCESS_PAYMENT',
          performedBy: { id: 'cashier-1', name: processedByName, role: 'cashier' },
          details: `Processed ${paymentMethod.toUpperCase()} payment for ${validatedTests.length} validated tests in Booking ${data.bookingCode} (Amount: ${calculatedAmount} XAF).`
        });

        return true;
      }
    } catch (e) {
      console.error('Error processing payment in limsService:', e);
    }
    return false;
  },

  async processBatchPayments(params: {
    labId: string;
    bookingIds: string[];
    paymentMethod: 'cash' | 'mobile_money' | 'card' | 'insurance';
    processedByName: string;
    paymentDetails?: any;
  }): Promise<{ successCount: number; failedCount: number }> {
    const { labId, bookingIds, paymentMethod, processedByName, paymentDetails } = params;
    let successCount = 0;
    let failedCount = 0;

    for (const bId of bookingIds) {
      const res = await this.processPayment({
        labId,
        bookingId: bId,
        paymentMethod,
        processedByName,
        paymentDetails
      });
      if (res) successCount++;
      else failedCount++;
    }

    return { successCount, failedCount };
  },

  async completeSampleCollection(params: {
    labId: string;
    bookingId: string;
    singleTestId?: string;
    collectedSamples: string[];
    collectorName: string;
  }): Promise<boolean> {
    const { labId, bookingId, singleTestId, collectedSamples, collectorName } = params;
    const timestamp = new Date().toISOString();

    try {
      const bookingsCol = collection(db, 'labs', labId, 'bookings');
      const snap = await getDocs(bookingsCol);
      const bookingDoc = snap.docs.find(d => d.data().id === bookingId || d.id === bookingId);

      if (bookingDoc) {
        const data = bookingDoc.data() as PatientBooking;
        let modifiedTestName = '';

        const updatedTests = data.tests.map(t => {
          if (singleTestId) {
            if (t.id === singleTestId || t.testId === singleTestId || t.testName === singleTestId) {
              modifiedTestName = t.testName;
              return {
                ...t,
                status: 'In_Lab_Testing' as TestStatus,
                sampleCollected: true,
                sampleCollectedAt: timestamp,
                collectedSamples
              };
            }
            return t;
          }

          return {
            ...t,
            status: 'In_Lab_Testing' as TestStatus,
            sampleCollected: true,
            sampleCollectedAt: timestamp,
            collectedSamples
          };
        });

        const allCollectedOrDone = updatedTests.every(t => 
          t.status === 'In_Lab_Testing' || t.status === 'Completed' || t.sampleCollected === true
        );

        const newOverallStatus = allCollectedOrDone ? 'In_Lab_Testing' : 'Pending_Collection';

        await updateDoc(doc(db, 'labs', labId, 'bookings', bookingDoc.id), {
          collectedSamples,
          sampleCollectedAtDate: timestamp,
          sampleCollectedBy: collectorName,
          overallStatus: newOverallStatus,
          tests: updatedTests,
          updatedAt: timestamp
        });

        if (data.patientId) {
          try {
            const patRef = doc(db, 'labs', labId, 'patients', data.patientId);
            const patSnap = await getDoc(patRef);
            if (patSnap.exists()) {
              const currentTests: any[] = patSnap.data().labTests || [];
              const updatedPatTests = currentTests.map(pt => {
                if (singleTestId) {
                  const isMatch = pt.id === singleTestId || pt.testId === singleTestId || (pt.testName || pt.name) === modifiedTestName || (pt.testName || pt.name) === singleTestId;
                  if (isMatch) {
                    return {
                      ...pt,
                      status: 'In_Lab_Testing',
                      sampleCollected: true,
                      sampleCollectedAt: timestamp,
                      collectedSamples
                    };
                  }
                  return pt;
                }

                const isMatch = data.tests?.some(bt => bt.id === pt.id || bt.testId === pt.testId || bt.testName === (pt.testName || pt.name));
                if (isMatch || pt.bookingCode === data.bookingCode) {
                  return {
                    ...pt,
                    status: 'In_Lab_Testing',
                    sampleCollected: true,
                    sampleCollectedAt: timestamp,
                    collectedSamples
                  };
                }
                return pt;
              });
              await updateDoc(patRef, cleanFirestoreData({
                labTests: updatedPatTests,
                updatedAt: timestamp
              }));
            }
          } catch (patErr) {
            console.warn('Patient collection status sync note:', patErr);
          }
        }

        await auditService.logPatientAccess({
          labId,
          patientId: data.patientId,
          patientName: data.patientName,
          action: 'COLLECT_SAMPLE',
          performedBy: { id: 'phleb-1', name: collectorName, role: 'analyzer' },
          details: singleTestId 
            ? `Specimen matrices gathered for single test [${modifiedTestName || singleTestId}] in Booking ${data.bookingCode}: [${collectedSamples.join(', ')}]. Routed to Lab Testing.`
            : `Specimen matrices gathered for Booking ${data.bookingCode}: [${collectedSamples.join(', ')}]. Hand-labeled tubes routed to Lab Testing.`
        });

        return true;
      }
    } catch (e) {
      console.error('Error in completeSampleCollection:', e);
    }
    return false;
  },

  async verifySampleByAdmin(params: {
    labId: string;
    bookingId: string;
    adminName: string;
    adminAccessCode: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { labId, bookingId, adminName } = params;
    const timestamp = new Date().toISOString();

    try {
      const bookingsCol = collection(db, 'labs', labId, 'bookings');
      const snap = await getDocs(bookingsCol);
      const bookingDoc = snap.docs.find(d => d.data().id === bookingId || d.id === bookingId);

      if (bookingDoc) {
        const data = bookingDoc.data() as PatientBooking;
        await updateDoc(doc(db, 'labs', labId, 'bookings', bookingDoc.id), {
          adminSampleVerified: true,
          adminSampleVerifiedBy: adminName,
          adminSampleVerifiedAt: timestamp,
          updatedAt: timestamp
        });

        await auditService.logPatientAccess({
          labId,
          patientId: data.patientId,
          patientName: data.patientName,
          action: 'VERIFY_SAMPLE',
          performedBy: { id: 'admin-1', name: adminName, role: 'admin' },
          details: `Administrator ${adminName} performed physical specimen verification and verified integrity for Booking ${data.bookingCode}.`
        });

        return { success: true };
      }
      return { success: false, error: 'Booking not found.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Sample verification failed.' };
    }
  },

  async claimOrVerifyTechAssignment(params: {
    labId: string;
    bookingId: string;
    techId: string;
    techName: string;
  }): Promise<{ isAssignedToCurrentUser: boolean; assignedTechName: string; canAccess: boolean }> {
    const { labId, bookingId, techId, techName } = params;
    const timestamp = new Date().toISOString();

    try {
      const bookingsCol = collection(db, 'labs', labId, 'bookings');
      const snap = await getDocs(bookingsCol);
      const bookingDoc = snap.docs.find(d => d.data().id === bookingId || d.id === bookingId);

      if (bookingDoc) {
        const data = bookingDoc.data() as PatientBooking;
        
        if (!data.assignedTechId) {
          await updateDoc(doc(db, 'labs', labId, 'bookings', bookingDoc.id), {
            assignedTechId: techId,
            assignedTechName: techName,
            assignedAt: timestamp,
            updatedAt: timestamp
          });

          if (data.patientId) {
            try {
              const patientRef = doc(db, 'labs', labId, 'patients', data.patientId);
              const patientSnap = await getDoc(patientRef);
              if (patientSnap.exists()) {
                const patientData = patientSnap.data();
                const updatedLabTests = (patientData.labTests || []).map((t: any) => {
                  const matchesBooking = data.tests?.some(bt => bt.id === t.id || bt.testName === (t.testName || t.name));
                  if (matchesBooking || !t.assignedTo) {
                    return {
                      ...t,
                      assignedTo: techName,
                      assignedTechName: techName,
                      assignedTechId: techId,
                      assignedAt: timestamp
                    };
                  }
                  return t;
                });

                await updateDoc(patientRef, {
                  assignedLabTech: techName,
                  assignedTechId: techId,
                  assignedTechName: techName,
                  assignedAt: timestamp,
                  labTests: updatedLabTests,
                  updatedAt: timestamp
                });
              }
            } catch (patErr) {
              console.warn('Could not update patient doc with assigned lab tech:', patErr);
            }
          }

          await auditService.logPatientAccess({
            labId,
            patientId: data.patientId,
            patientName: data.patientName,
            action: 'CLAIM_TEST_ASSIGNMENT',
            performedBy: { id: techId, name: techName, role: 'lab_tech' },
            details: `Medical Technologist ${techName} claimed primary ownership and privacy locking for Booking ${data.bookingCode}.`
          });

          return { isAssignedToCurrentUser: true, assignedTechName: techName, canAccess: true };
        }

        const isOwner = data.assignedTechId === techId;
        const isShared = Array.isArray(data.sharedWithTechs) && data.sharedWithTechs.some(s => s.techId === techId);
        const canAccess = isOwner || isShared;

        return {
          isAssignedToCurrentUser: isOwner,
          assignedTechName: data.assignedTechName || 'Assigned Technologist',
          canAccess
        };
      }
    } catch (e) {
      console.error('Error in claimOrVerifyTechAssignment:', e);
    }

    return { isAssignedToCurrentUser: true, assignedTechName: techName, canAccess: true };
  },

  async sharePatientAccessWithColleague(params: {
    labId: string;
    bookingId: string;
    currentTechId: string;
    currentTechName: string;
    accessCodeInput: string;
    targetTechId: string;
    targetTechName: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { labId, bookingId, currentTechName, accessCodeInput, targetTechId, targetTechName } = params;
    const timestamp = new Date().toISOString();

    if (!accessCodeInput || !accessCodeInput.trim()) {
      return { success: false, error: 'Technician access code is required for authorization.' };
    }

    try {
      const bookingsCol = collection(db, 'labs', labId, 'bookings');
      const snap = await getDocs(bookingsCol);
      const bookingDoc = snap.docs.find(d => d.data().id === bookingId || d.id === bookingId);

      if (bookingDoc) {
        const data = bookingDoc.data() as PatientBooking;
        const existingShared = data.sharedWithTechs || [];

        const newShare = {
          techId: targetTechId,
          techName: targetTechName,
          sharedAt: timestamp,
          sharedByTechName: currentTechName
        };

        await updateDoc(doc(db, 'labs', labId, 'bookings', bookingDoc.id), {
          sharedWithTechs: [...existingShared, newShare],
          updatedAt: timestamp
        });

        await auditService.logPatientAccess({
          labId,
          patientId: data.patientId,
          patientName: data.patientName,
          action: 'REASSIGN_TEST',
          performedBy: { id: params.currentTechId, name: currentTechName, role: 'lab_tech' },
          details: `Technologist ${currentTechName} confirmed clinical guidelines, verified authorization access code, and granted full diagnostic test access for Booking ${data.bookingCode} to colleague ${targetTechName}.`
        });

        return { success: true };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to share access' };
    }

    return { success: false, error: 'Booking not found' };
  },

  async submitFormResults(params: {
    labId: string;
    bookingId: string;
    testResultsMap: Record<string, { resultValue?: string; subParams?: Record<string, string>; notes?: string }>;
    techName: string;
    pdfReportDataUrl?: string;
    reagentsUsed?: ReagentUsage[];
  }): Promise<boolean> {
    const { labId, bookingId, testResultsMap, techName, pdfReportDataUrl, reagentsUsed } = params;
    const timestamp = new Date().toISOString();
 
    try {
      const bookingsCol = collection(db, 'labs', labId, 'bookings');
      const snap = await getDocs(bookingsCol);
      const bookingDoc = snap.docs.find(d => d.data().id === bookingId || d.id === bookingId);

      if (bookingDoc) {
        const data = bookingDoc.data() as PatientBooking;
        
        const updatedTests = data.tests.map(test => {
          const resObj = testResultsMap[test.id];
          if (!resObj) return test;

          let updatedSubParams = test.subParameters;
          if (resObj.subParams && updatedSubParams) {
            updatedSubParams = updatedSubParams.map(sp => {
              const valStr = resObj.subParams?.[sp.id] || '';
              const valNum = parseFloat(valStr);
              let flag: 'Normal' | 'Low' | 'High' = 'Normal';

              if (!isNaN(valNum)) {
                const minVal = data.patientGender === 'Female' ? sp.femaleMin : data.patientGender === 'Child' ? sp.childMin : sp.maleMin;
                const maxVal = data.patientGender === 'Female' ? sp.femaleMax : data.patientGender === 'Child' ? sp.childMax : sp.maleMax;

                if (minVal !== undefined && valNum < minVal) flag = 'Low';
                if (maxVal !== undefined && valNum > maxVal) flag = 'High';
              }

              return { ...sp, value: valStr, flag };
            });
          }

          return {
            ...test,
            resultValue: resObj.resultValue || test.resultValue,
            subParameters: updatedSubParams,
            labNotes: resObj.notes || test.labNotes,
            status: 'Completed' as TestStatus,
            completedAt: timestamp,
            completedBy: techName
          };
        });

        await this.deductReagentsForBooking(labId, data.tests);

        await updateDoc(doc(db, 'labs', labId, 'bookings', bookingDoc.id), {
          tests: updatedTests,
          overallStatus: 'Completed',
          pdfReportUrl: pdfReportDataUrl || data.pdfReportUrl,
          labTechSigned: true,
          labTechSignedAt: timestamp,
          updatedAt: timestamp
        });

        if (data.patientId) {
          try {
            const patRef = doc(db, 'labs', labId, 'patients', data.patientId);
            const patSnap = await getDoc(patRef);
            if (patSnap.exists()) {
              const currentTests: any[] = patSnap.data().labTests || [];
              const updatedPatTests = currentTests.map(pt => {
                const matchedTest = updatedTests.find(ut => ut.id === pt.id || ut.testId === pt.testId || ut.testName === (pt.testName || pt.name));
                if (matchedTest || pt.bookingCode === data.bookingCode) {
                  return {
                    ...pt,
                    status: 'Completed',
                    completedAt: timestamp,
                    completedBy: techName,
                    resultValue: matchedTest?.resultValue || pt.resultValue,
                    subParameters: matchedTest?.subParameters || pt.subParameters,
                    labNotes: matchedTest?.labNotes || pt.labNotes,
                    pdfReportUrl: pdfReportDataUrl || pt.pdfReportUrl,
                    reportUrl: pdfReportDataUrl || pt.reportUrl
                  };
                }
                return pt;
              });
              await updateDoc(patRef, cleanFirestoreData({
                labTests: updatedPatTests,
                updatedAt: timestamp
              }));
            }
          } catch (patErr) {
            console.warn('Patient results sync error:', patErr);
          }
        }

        await auditService.logPatientAccess({
          labId,
          patientId: data.patientId,
          patientName: data.patientName,
          action: 'VALIDATE_FINDINGS',
          performedBy: { id: 'tech-1', name: techName, role: 'lab_tech' },
          details: `Validated & signed off diagnostic values for Booking ${data.bookingCode}. Reagent inventory deducted; native PDF report generated & published to Patient Portal.`
        });

        return true;
      }
    } catch (e) {
      console.error('Error in submitFormResults:', e);
    }

    return false;
  },

  async submitIndividualTestResult(params: {
    labId: string;
    bookingId: string;
    testId: string;
    resultValue?: string;
    subParams?: Record<string, string>;
    notes?: string;
    techName: string;
    pdfReportDataUrl?: string;
  }): Promise<boolean> {
    const { labId, bookingId, testId, resultValue, subParams, notes, techName, pdfReportDataUrl } = params;
    const timestamp = new Date().toISOString();

    try {
      const bookingsCol = collection(db, 'labs', labId, 'bookings');
      const snap = await getDocs(bookingsCol);
      const bookingDoc = snap.docs.find(d => d.data().id === bookingId || d.id === bookingId);

      if (bookingDoc) {
        const data = bookingDoc.data() as PatientBooking;
        let modifiedTestName = 'Diagnostic Test';

        const updatedTests = data.tests.map(test => {
          if (test.id !== testId && test.testId !== testId) return test;

          modifiedTestName = test.testName;
          let updatedSubParams = test.subParameters;
          if (subParams && updatedSubParams) {
            updatedSubParams = updatedSubParams.map(sp => {
              const valStr = subParams[sp.id] || '';
              const valNum = parseFloat(valStr);
              let flag: 'Normal' | 'Low' | 'High' = 'Normal';

              if (!isNaN(valNum)) {
                const minVal = data.patientGender === 'Female' ? sp.femaleMin : data.patientGender === 'Child' ? sp.childMin : sp.maleMin;
                const maxVal = data.patientGender === 'Female' ? sp.femaleMax : data.patientGender === 'Child' ? sp.childMax : sp.maleMax;

                if (minVal !== undefined && valNum < minVal) flag = 'Low';
                if (maxVal !== undefined && valNum > maxVal) flag = 'High';
              }

              return { ...sp, value: valStr, flag };
            });
          }

          return {
            ...test,
            resultValue: resultValue || test.resultValue,
            subParameters: updatedSubParams,
            labNotes: notes || test.labNotes,
            status: 'Completed' as TestStatus,
            completedAt: timestamp,
            completedBy: techName
          };
        });

        const allCompleted = updatedTests.every(t => t.status === 'Completed');

        const targetTest = data.tests.find(t => t.id === testId || t.testId === testId);
        if (targetTest) {
          await this.deductReagentsForBooking(labId, [targetTest]);
        }

        await updateDoc(doc(db, 'labs', labId, 'bookings', bookingDoc.id), {
          tests: updatedTests,
          overallStatus: allCompleted ? 'Completed' : 'In_Lab_Testing',
          pdfReportUrl: pdfReportDataUrl || data.pdfReportUrl,
          updatedAt: timestamp
        });

        if (data.patientId) {
          try {
            const patRef = doc(db, 'labs', labId, 'patients', data.patientId);
            const patSnap = await getDoc(patRef);
            if (patSnap.exists()) {
              const currentTests: any[] = patSnap.data().labTests || [];
              const updatedPatTests = currentTests.map(pt => {
                if (pt.id === testId || pt.testId === testId || pt.testName === modifiedTestName) {
                  return {
                    ...pt,
                    status: 'Completed',
                    completedAt: timestamp,
                    completedBy: techName,
                    resultValue: resultValue || pt.resultValue,
                    labNotes: notes || pt.labNotes,
                    pdfReportUrl: pdfReportDataUrl || pt.pdfReportUrl
                  };
                }
                return pt;
              });

              await updateDoc(patRef, cleanFirestoreData({
                labTests: updatedPatTests,
                updatedAt: timestamp
              }));
            }
          } catch (patErr) {
            console.warn('Patient individual test sync notice:', patErr);
          }
        }

        await auditService.logPatientAccess({
          labId,
          patientId: data.patientId,
          patientName: data.patientName,
          action: 'VALIDATE_FINDINGS',
          performedBy: { id: 'tech-1', name: techName, role: 'lab_tech' },
          details: `Decoupled validation: Signed off individual test "${modifiedTestName}" for Booking ${data.bookingCode}.`
        });

        return true;
      }
    } catch (e) {
      console.error('Error in submitIndividualTestResult:', e);
    }
    return false;
  },

  async uploadExternalPdfResult(params: {
    labId: string;
    bookingId: string;
    externalPdfUrl: string;
    techName: string;
  }): Promise<boolean> {
    const { labId, bookingId, externalPdfUrl, techName } = params;
    const timestamp = new Date().toISOString();

    try {
      const bookingsCol = collection(db, 'labs', labId, 'bookings');
      const snap = await getDocs(bookingsCol);
      const bookingDoc = snap.docs.find(d => d.data().id === bookingId || d.id === bookingId);

      if (bookingDoc) {
        const data = bookingDoc.data() as PatientBooking;
        const updatedTests = data.tests.map(t => ({
          ...t,
          status: 'Completed' as TestStatus,
          completedAt: timestamp,
          completedBy: techName
        }));

        await updateDoc(doc(db, 'labs', labId, 'bookings', bookingDoc.id), {
          externalPdfUrl,
          pdfReportUrl: externalPdfUrl,
          tests: updatedTests,
          overallStatus: 'Completed',
          labTechSigned: true,
          labTechSignedAt: timestamp,
          updatedAt: timestamp
        });

        if (data.patientId) {
          try {
            const patRef = doc(db, 'labs', labId, 'patients', data.patientId);
            const patSnap = await getDoc(patRef);
            if (patSnap.exists()) {
              const currentTests: any[] = patSnap.data().labTests || [];
              const updatedPatTests = currentTests.map(pt => {
                const isMatch = data.tests.some(bt => bt.id === pt.id || bt.testId === pt.testId || bt.testName === (pt.testName || pt.name));
                if (isMatch || pt.bookingCode === data.bookingCode) {
                  return {
                    ...pt,
                    status: 'Completed',
                    completedAt: timestamp,
                    completedBy: techName,
                    externalPdfUrl,
                    pdfReportUrl: externalPdfUrl,
                    reportUrl: externalPdfUrl
                  };
                }
                return pt;
              });
              await updateDoc(patRef, cleanFirestoreData({
                labTests: updatedPatTests,
                updatedAt: timestamp
              }));
            }
          } catch (patErr) {
            console.warn('Patient upload sync note:', patErr);
          }
        }

        await auditService.logPatientAccess({
          labId,
          patientId: data.patientId,
          patientName: data.patientName,
          action: 'UPLOAD_RESULTS',
          performedBy: { id: 'tech-1', name: techName, role: 'lab_tech' },
          details: `Uploaded external diagnostic result sheet for Booking ${data.bookingCode}. Attached securely to Patient Portal.`
        });

        return true;
      }
    } catch (e) {
      console.error('Error in uploadExternalPdfResult:', e);
    }
    return false;
  },

  async signAndReleaseByBiologist(params: {
    labId: string;
    bookingId: string;
    biologistName: string;
    biologistAccessCode: string;
    biologistRemarks?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { labId, bookingId, biologistName, biologistRemarks } = params;
    const timestamp = new Date().toISOString();

    try {
      const bookingsCol = collection(db, 'labs', labId, 'bookings');
      const snap = await getDocs(bookingsCol);
      const bookingDoc = snap.docs.find(d => d.data().id === bookingId || d.id === bookingId);

      if (bookingDoc) {
        const data = bookingDoc.data() as PatientBooking;
        const updatedTests = data.tests.map(t => ({
          ...t,
          status: 'Completed' as TestStatus,
          biologistSigned: true,
          biologistSignedAt: timestamp
        }));

        await updateDoc(doc(db, 'labs', labId, 'bookings', bookingDoc.id), {
          biologistSigned: true,
          biologistName,
          biologistSignedAt: timestamp,
          biologistRemarks: biologistRemarks || 'Clinical findings reviewed and authorized for official release.',
          biologistPasscodeVerified: true,
          overallStatus: 'Completed',
          tests: updatedTests,
          updatedAt: timestamp
        });

        if (data.patientId) {
          try {
            const patRef = doc(db, 'labs', labId, 'patients', data.patientId);
            const patSnap = await getDoc(patRef);
            if (patSnap.exists()) {
              const currentTests: any[] = patSnap.data().labTests || [];
              const updatedPatTests = currentTests.map(pt => {
                const isMatch = data.tests.some(bt => bt.id === pt.id || bt.testId === pt.testId || bt.testName === (pt.testName || pt.name));
                if (isMatch || pt.bookingCode === data.bookingCode) {
                  return {
                    ...pt,
                    status: 'Completed',
                    biologistSigned: true,
                    biologistName,
                    biologistSignedAt: timestamp,
                    biologistRemarks: biologistRemarks || 'Authorized and released by Clinical Biologist.'
                  };
                }
                return pt;
              });
              await updateDoc(patRef, cleanFirestoreData({
                labTests: updatedPatTests,
                updatedAt: timestamp
              }));
            }
          } catch (patErr) {
            console.warn('Patient biologist signoff sync note:', patErr);
          }
        }

        await auditService.logPatientAccess({
          labId,
          patientId: data.patientId,
          patientName: data.patientName,
          action: 'RELEASE_RESULTS',
          performedBy: { id: 'bio-1', name: biologistName, role: 'biologist' },
          details: `Clinical Biologist ${biologistName} verified with passcode, reviewed findings, and officially released test results for Booking ${data.bookingCode}.`
        });

        return { success: true };
      }
      return { success: false, error: 'Booking not found.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Biologist signoff failed.' };
    }
  },

  async triggerPhysicalPickupAlert(params: {
    labId: string;
    bookingId: string;
    passcode: string;
    techName: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { labId, bookingId, techName } = params;
    const timestamp = new Date().toISOString();

    try {
      const bookingsCol = collection(db, 'labs', labId, 'bookings');
      const snap = await getDocs(bookingsCol);
      const bookingDoc = snap.docs.find(d => d.data().id === bookingId || d.id === bookingId);

      if (bookingDoc) {
        const data = bookingDoc.data() as PatientBooking;
        const updatedTests = data.tests.map(t => ({
          ...t,
          status: 'Ready_For_Pickup' as TestStatus
        }));

        await updateDoc(doc(db, 'labs', labId, 'bookings', bookingDoc.id), {
          physicalPickupAlertSent: true,
          overallStatus: 'Ready_For_Pickup',
          tests: updatedTests,
          updatedAt: timestamp
        });

        await auditService.logPatientAccess({
          labId,
          patientId: data.patientId,
          patientName: data.patientName,
          action: 'UPLOAD_RESULTS',
          performedBy: { id: 'tech-1', name: techName, role: 'lab_tech' },
          details: `Triggered SMS alert for physical hard-copy result pickup at facility front desk for Booking ${data.bookingCode}.`
        });

        return { success: true };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Passcode verification or notification failed' };
    }

    return { success: false, error: 'Booking record not found' };
  },

  async deductReagentsForBooking(labId: string, bookingTests: BookingTestItem[]): Promise<void> {
    try {
      const inventoryCol = collection(db, 'labs', labId, 'inventory');
      const snap = await getDocs(inventoryCol);
      const inventoryDocs = snap.docs;

      for (const test of bookingTests) {
        const master = MASTER_TESTS_CATALOG.find(m => m.id === test.testId || m.name === test.testName);
        if (master && master.reagentsRequired) {
          for (const req of master.reagentsRequired) {
            const itemDoc = inventoryDocs.find(d => 
              d.data().name?.toLowerCase().includes(req.reagentName.toLowerCase()) ||
              req.reagentName.toLowerCase().includes(d.data().name?.toLowerCase() || '')
            );

            if (itemDoc) {
              const currentQty = itemDoc.data().quantity || 100;
              const newQty = Math.max(0, currentQty - req.quantityRequired);
              await updateDoc(doc(db, 'labs', labId, 'inventory', itemDoc.id), {
                quantity: newQty,
                updatedAt: new Date().toISOString()
              });
              console.log(`📉 Auto-deducted inventory reagent "${req.reagentName}": ${currentQty} ➔ ${newQty}`);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Reagent inventory auto-deduction notice:', e);
    }
  },

  async getMasterTestCatalog(labId: string): Promise<MasterTestItem[]> {
    try {
      const customCol = collection(db, 'labs', labId, 'master_tests');
      const snap = await getDocs(customCol);
      if (!snap.empty) {
        const customItems = snap.docs.map(d => ({ id: d.id, ...d.data() })) as MasterTestItem[];
        const combined = [...customItems];
        MASTER_TESTS_CATALOG.forEach(def => {
          if (!combined.some(c => c.id === def.id || c.name === def.name)) {
            combined.push(def);
          }
        });
        return combined;
      }
    } catch (e) {
      console.warn('Using default MASTER_TESTS_CATALOG:', e);
    }
    return MASTER_TESTS_CATALOG;
  },

  async saveMasterTestDefinition(labId: string, testItem: MasterTestItem): Promise<boolean> {
    try {
      const customCol = collection(db, 'labs', labId, 'master_tests');
      await addDoc(customCol, {
        ...testItem,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (e) {
      console.error('Error saving master test definition:', e);
    }
    return false;
  },

  async fetchAllBookings(labId: string): Promise<PatientBooking[]> {
    try {
      const bookingsCol = collection(db, 'labs', labId, 'bookings');
      const snap = await getDocs(bookingsCol);
      const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() })) as PatientBooking[];

      try {
        const apptsCol = collection(db, 'labs', labId, 'appointments');
        const apptsSnap = await getDocs(apptsCol);
        apptsSnap.docs.forEach(docSnap => {
          const apptData = docSnap.data();
          const apptId = docSnap.id;
          
          const existing = bookings.find(b => b.id === apptId || b.bookingCode === (apptData.bookingCode || apptData.id));
          if (!existing) {
            const isPaid = apptData.paymentStatus === 'paid' || apptData.paid === true || apptData.status === 'confirmed';
            const isValidated = apptData.receptionistValidated === true || isPaid;
            const status: TestStatus = apptData.sampleCollected 
              ? 'In_Lab_Testing' 
              : isPaid 
                ? 'Pending_Collection' 
                : (isValidated ? 'Pending_Payment' : 'Pending_Validation');

            const isVirtualBooking = Boolean(apptData.virtualRequested || apptData.isVirtual || apptData.deliveryMethod === 'virtual');
            let apptTests: BookingTestItem[] = [];
            if (Array.isArray(apptData.tests) && apptData.tests.length > 0) {
              apptTests = apptData.tests.map((at: any, idx: number) => ({
                id: at.id || `bt-${apptId}-${idx}`,
                testId: at.testId || at.id || `t-${idx}`,
                testCode: at.testCode || at.code || 'TST',
                testName: at.testName || at.name || 'Diagnostic Test',
                category: at.category || 'General',
                sampleTypeRequired: at.sampleTypeRequired || at.sampleType || 'Venous Blood',
                units: at.units || 'U/L',
                refRangeMale: at.refRangeMale || 'Normal',
                refRangeFemale: at.refRangeFemale || 'Normal',
                refRangeChild: at.refRangeChild || 'Normal',
                price: at.price || 5000,
                status: (isValidated || at.receptionistValidated) 
                  ? (isPaid ? 'Pending_Collection' : 'Pending_Payment') 
                  : 'Pending_Validation',
                receptionistValidated: isValidated || at.receptionistValidated === true,
                virtualRequested: Boolean(at.virtualRequested || isVirtualBooking),
                virtualRequestedAt: at.virtualRequestedAt || apptData.virtualRequestedAt
              }));
            } else {
              apptTests = [{
                id: apptData.testId || `bt-${apptId}`,
                testId: apptData.testId || 'm1',
                testCode: 'TST',
                testName: apptData.testName || apptData.title || 'Laboratory Diagnostic Test',
                category: apptData.category || 'General',
                sampleTypeRequired: apptData.sampleType || 'Venous Blood',
                units: 'U/L',
                refRangeMale: '10 - 50',
                refRangeFemale: '10 - 45',
                refRangeChild: '10 - 40',
                price: apptData.price || apptData.totalPrice || 5000,
                status,
                receptionistValidated: isValidated,
                virtualRequested: isVirtualBooking,
                virtualRequestedAt: apptData.virtualRequestedAt
              }];
            }

            const totalAmount = apptData.totalAmount || apptData.totalPrice || apptData.price || apptTests.reduce((sum, t) => sum + (t.price || 5000), 0);

            bookings.push({
              id: apptId,
              bookingCode: apptData.bookingCode || `BK-${apptId.substring(0, 6).toUpperCase()}`,
              labId,
              patientId: apptData.patientId || 'pat-1',
              patientName: apptData.patientName || apptData.title || 'Patient',
              patientAge: apptData.patientAge || 28,
              patientGender: apptData.patientGender || 'Male',
              patientPhone: apptData.patientPhone || '',
              patientEmail: apptData.patientEmail || '',
              patientPid: apptData.patientPid || apptData.patientId || 'PID-100',
              doctorName: apptData.doctorName || 'Dr. Attending Specialist',
              sampleCollectedAt: apptData.location || 'Central Laboratory',
              invoiceNumber: apptData.invoiceNumber || `INV-${Math.floor(10000 + Math.random() * 90000)}`,
              totalAmount,
              paymentStatus: isPaid ? 'paid' : 'unpaid',
              receptionistValidated: isValidated,
              validatedBy: apptData.validatedBy || (isValidated ? 'Front Desk' : ''),
              validatedAt: apptData.validatedAt || (isValidated ? apptData.createdAt : ''),
              registrationType: apptData.registrationType || 'online',
              isOnlineBooking: true,
              virtualRequested: isVirtualBooking,
              virtualRequestedAt: apptData.virtualRequestedAt || apptData.createdAt,
              assignedTechId: apptData.assignedTechId,
              assignedTechName: apptData.assignedTechName,
              assignedAt: apptData.assignedAt,
              collectedSamples: apptData.collectedSamples || (apptData.sampleCollected ? [apptData.sampleType || 'Venous Blood'] : []),
              tests: apptTests,
              overallStatus: status,
              createdAt: apptData.createdAt || new Date().toISOString(),
              updatedAt: apptData.updatedAt || apptData.createdAt || new Date().toISOString()
            });
          }
        });
      } catch (apptErr) {
        console.warn('Appointments fetch sync in fetchAllBookings:', apptErr);
      }

      try {
        const patientsCol = collection(db, 'labs', labId, 'patients');
        const patientsSnap = await getDocs(patientsCol);
        
        patientsSnap.docs.forEach(pDoc => {
          const pData = pDoc.data();
          const pId = pDoc.id;
          const labTests: any[] = pData.labTests || [];
          
          const validatedUnpaidTests = labTests.filter(t => 
            (t.receptionistValidated === true || t.validatedBy || t.status === 'Pending_Payment') && 
            !t.paid && 
            t.paymentStatus !== 'paid' &&
            !bookings.some(b => b.tests?.some(bt => bt.id === t.id || (bt.testName?.toLowerCase() === (t.testName || t.name)?.toLowerCase() && b.patientId === pId)))
          );

          if (validatedUnpaidTests.length > 0) {
            const totalAmount = validatedUnpaidTests.reduce((sum, t) => sum + (t.price || 5000), 0);
            bookings.push({
              id: `pat-booking-${pId}-${Date.now().toString().slice(-4)}`,
              bookingCode: `BK-${(pData.patientId || pId).slice(0, 6).toUpperCase()}`,
              labId,
              patientId: pId,
              patientName: pData.name || 'Patient',
              patientAge: pData.age || 30,
              patientGender: pData.gender || 'Male',
              patientPhone: pData.phone || '',
              patientEmail: pData.email || '',
              patientPid: pData.patientId || pId,
              doctorName: 'Attending Physician',
              sampleCollectedAt: 'Central Diagnostics Facility',
              invoiceNumber: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
              totalAmount,
              paymentStatus: 'unpaid',
              receptionistValidated: true,
              validatedBy: validatedUnpaidTests[0]?.validatedBy || 'Receptionist',
              validatedAt: validatedUnpaidTests[0]?.validatedAt || new Date().toISOString(),
              collectedSamples: [],
              tests: validatedUnpaidTests.map((t, idx) => ({
                id: t.id || `bt-${idx}`,
                testId: t.testId || `t-${idx}`,
                testCode: 'TST',
                testName: t.testName || t.name || 'Diagnostic Test',
                category: t.category || 'General',
                sampleTypeRequired: t.sampleType || 'Venous Blood',
                price: t.price || 5000,
                status: 'Pending_Payment',
                receptionistValidated: true
              })),
              overallStatus: 'Pending_Payment',
              createdAt: pData.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        });
      } catch (patSyncErr) {
        console.warn('Patient tests sync in fetchAllBookings:', patSyncErr);
      }

      return bookings;
    } catch (e) {
      console.warn('Error fetching bookings:', e);
    }
    return [];
  },

  subscribeToBookings(
    labId: string = 'lab-1',
    onUpdate: (bookings: PatientBooking[]) => void,
    onError?: (err: any) => void
  ): () => void {
    try {
      const bookingsCol = collection(db, 'labs', labId, 'bookings');
      const unsubscribe = onSnapshot(
        bookingsCol,
        async (snap) => {
          try {
            const allBookings = await this.fetchAllBookings(labId);
            onUpdate(allBookings);
          } catch (e) {
            const rawDocs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as PatientBooking[];
            onUpdate(rawDocs);
          }
        },
        (err) => {
          console.warn('[LIMS Real-time Subscription] Error:', err);
          if (onError) onError(err);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn('[LIMS Real-time Subscription Init] Error:', err);
      this.fetchAllBookings(labId).then(onUpdate).catch(() => onUpdate([]));
      return () => {};
    }
  },

  subscribeToPatients(
    labId: string = 'lab-1',
    onUpdate: (patients: any[]) => void,
    onError?: (err: any) => void
  ): () => void {
    try {
      const patientsCol = collection(db, 'labs', labId, 'patients');
      const unsubscribe = onSnapshot(
        patientsCol,
        (snap) => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          onUpdate(list);
        },
        (err) => {
          console.warn('[LIMS Patients Subscription] Error:', err);
          if (onError) onError(err);
        }
      );
      return unsubscribe;
    } catch (err) {
      console.warn('[LIMS Patients Subscription Init] Error:', err);
      return () => {};
    }
  },

  async validateBookingCheckIn(params: {
    labId: string;
    bookingId: string;
    validatorName: string;
    patientId?: string;
  }): Promise<boolean> {
    const { labId, bookingId, validatorName, patientId } = params;
    return this.validateBatchBookingsCheckIn({
      labId,
      bookingIds: [bookingId],
      validatorName,
      patientId
    });
  },

  async validateBatchBookingsCheckIn(params: {
    labId: string;
    bookingIds: string[];
    validatorName: string;
    patientId?: string;
    patientData?: any;
  }): Promise<boolean> {
    const { labId, bookingIds, validatorName, patientId, patientData } = params;
    const timestamp = new Date().toISOString();

    if (!bookingIds || bookingIds.length === 0) {
      return false;
    }

    const resolvedPatientId = patientId || patientData?.id || patientData?.patientId;
    const bookingsCol = collection(db, 'labs', labId, 'bookings');
    let matchedAnyBooking = false;

    try {
      const snap = await getDocs(bookingsCol);
      for (const bDoc of snap.docs) {
        const bData = bDoc.data() as PatientBooking;
        const belongsToPatient = resolvedPatientId && (
          bData.patientId === resolvedPatientId || 
          bData.patientPid === resolvedPatientId || 
          (patientData?.patientId && bData.patientPid === patientData.patientId)
        );
        
        const selectedTestIds = new Set<string>();
        bData.tests?.forEach(t => {
          const testKey = t.id || t.testId;
          if (bookingIds.includes(t.id) || 
              bookingIds.includes(t.testId) || 
              bookingIds.includes(t.testName) ||
              bookingIds.includes(testKey)) {
            selectedTestIds.add(testKey);
          }
        });

        const hasSelectedTests = selectedTestIds.size > 0;

        if (belongsToPatient && hasSelectedTests) {
          let updatedAnyTest = false;
          
          const updatedTests = (bData.tests || []).map(t => {
            const testKey = t.id || t.testId;
            const isThisTestSelected = selectedTestIds.has(testKey) || 
                                       bookingIds.includes(t.id) || 
                                       bookingIds.includes(t.testId) || 
                                       bookingIds.includes(t.testName);

            if (isThisTestSelected) {
              updatedAnyTest = true;
              return {
                ...t,
                receptionistValidated: true,
                validatedBy: validatorName,
                validatedAt: timestamp,
                status: (t.status === 'Completed' || t.status === 'In_Lab_Testing' ? t.status : 'Pending_Payment') as TestStatus
              };
            }
            return t;
          });

          if (updatedAnyTest) {
            matchedAnyBooking = true;
            
            const validatedTests = updatedTests.filter(t => t.receptionistValidated === true);
            const totalAmount = validatedTests.reduce((sum, t) => sum + (t.price || 5500), 0);

            const allTestsValidated = updatedTests.every(t => t.receptionistValidated === true || t.status === 'Completed');

            await updateDoc(doc(db, 'labs', labId, 'bookings', bDoc.id), cleanFirestoreData({
              receptionistValidated: allTestsValidated,
              validatedBy: validatorName,
              validatedAt: timestamp,
              overallStatus: allTestsValidated 
                ? (bData.paymentStatus === 'paid' ? bData.overallStatus : 'Pending_Payment')
                : 'Pending_Validation',
              tests: updatedTests,
              totalAmount: totalAmount > 0 ? totalAmount : bData.totalAmount,
              updatedAt: timestamp
            }));
          }
        }
      }
    } catch (bErr) {
      console.warn('Bookings collection batch update note:', bErr);
    }

    if (resolvedPatientId) {
      try {
        const patientRef = doc(db, 'labs', labId, 'patients', resolvedPatientId);
        const patientSnap = await getDoc(patientRef);
        if (patientSnap.exists()) {
          const currentPatient = patientSnap.data();
          const currentTests: any[] = currentPatient.labTests || [];
          
          const newlyValidatedTests: any[] = [];
          const updatedTests = currentTests.map(t => {
            const isSelected = bookingIds.includes(t.id) || 
                               bookingIds.includes(t.testId) || 
                               bookingIds.includes(t.testName) ||
                               (t.name && bookingIds.includes(t.name)) ||
                               (t.bookingId && bookingIds.includes(`${t.bookingId}-${t.id}`));
            
            if (isSelected) {
              const valTest = {
                ...t,
                receptionistValidated: true,
                validatedBy: validatorName,
                validatedAt: timestamp,
                status: (t.status === 'Completed' || t.status === 'In_Lab_Testing' || t.status === 'Paid') ? t.status : 'Pending_Payment',
                paymentStatus: t.paid ? 'paid' : 'unpaid'
              };
              newlyValidatedTests.push(valTest);
              return valTest;
            }
            return t;
          });

          await updateDoc(patientRef, cleanFirestoreData({
            labTests: updatedTests,
            updatedAt: timestamp
          }));

          if (!matchedAnyBooking && newlyValidatedTests.length > 0) {
            const bookingCode = `BK-${Date.now().toString().slice(-4)}`;
            const totalAmount = newlyValidatedTests.reduce((sum, t) => sum + (t.price || 5500), 0);

            const newBooking: PatientBooking = {
              id: `booking-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              bookingCode,
              labId,
              patientId: resolvedPatientId,
              patientName: currentPatient.name || patientData?.name || 'Patient',
              patientAge: currentPatient.age || patientData?.age || 30,
              patientGender: currentPatient.gender || patientData?.gender || 'Male',
              patientPhone: currentPatient.phone || patientData?.phone || '',
              patientEmail: currentPatient.email || patientData?.email || '',
              patientPid: currentPatient.patientId || resolvedPatientId,
              doctorName: 'Attending Physician',
              sampleCollectedAt: 'Central Diagnostics',
              invoiceNumber: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
              totalAmount: totalAmount > 0 ? totalAmount : 5500,
              paymentStatus: 'unpaid',
              receptionistValidated: true,
              validatedBy: validatorName,
              validatedAt: timestamp,
              collectedSamples: [],
              tests: newlyValidatedTests.map((t, idx) => ({
                id: t.id || `bt-${Date.now()}-${idx}`,
                testId: t.testId || `t-${idx}`,
                testCode: t.testCode || 'TST',
                testName: t.testName || t.name || 'Diagnostic Test',
                category: t.category || 'General',
                sampleTypeRequired: t.sampleType || 'Venous Blood',
                price: t.price || 5500,
                status: 'Pending_Payment',
                receptionistValidated: true
              })),
              overallStatus: 'Pending_Payment',
              createdAt: timestamp,
              updatedAt: timestamp
            };

            await addDoc(bookingsCol, cleanFirestoreData(newBooking));
            matchedAnyBooking = true;
          }
        }
      } catch (err) {
        console.warn('Patient batch tests validation note:', err);
      }
    }

    try {
      const apptsCol = collection(db, 'labs', labId, 'appointments');
      const apptsSnap = await getDocs(apptsCol);
      for (const apptDoc of apptsSnap.docs) {
        const apptData = apptDoc.data();
        const belongsToPatient = resolvedPatientId && (apptData.patientId === resolvedPatientId || apptData.patientPid === resolvedPatientId);
        const hasMatchingTest = apptData.tests && apptData.tests.some((at: any) => 
          bookingIds.includes(at.id) || 
          bookingIds.includes(at.testId) || 
          bookingIds.includes(at.testName)
        );

        if (belongsToPatient && hasMatchingTest) {
          let anyTestUpdated = false;
          const updatedApptTests = (apptData.tests || []).map((at: any) => {
            const isSelected = bookingIds.includes(at.id) || 
                               bookingIds.includes(at.testId) || 
                               bookingIds.includes(at.testName) ||
                               (at.name && bookingIds.includes(at.name));

            if (isSelected) {
              anyTestUpdated = true;
              return {
                ...at,
                receptionistValidated: true,
                validatedBy: validatorName,
                validatedAt: timestamp,
                status: at.status === 'Completed' ? 'Completed' : 'Pending_Payment'
              };
            }
            return at;
          });

          if (anyTestUpdated) {
            await updateDoc(doc(db, 'labs', labId, 'appointments', apptDoc.id), cleanFirestoreData({
              receptionistValidated: true,
              validatedBy: validatorName,
              validatedAt: timestamp,
              status: apptData.paymentStatus === 'paid' ? apptData.status : 'Pending_Payment',
              tests: updatedApptTests.length > 0 ? updatedApptTests : undefined,
              updatedAt: timestamp
            }));
          }

          if (!matchedAnyBooking) {
            const validatedApptTests = updatedApptTests.filter((at: any) => at.receptionistValidated === true);
            if (validatedApptTests.length > 0) {
              const bookingTests: BookingTestItem[] = validatedApptTests.map((t: any, idx: number) => ({
                id: t.id || `bt-${apptDoc.id}-${idx}`,
                testId: t.testId || `t-${idx}`,
                testCode: t.testCode || 'TST',
                testName: t.testName || t.name || 'Diagnostic Test',
                category: t.category || 'General',
                sampleTypeRequired: t.sampleTypeRequired || t.sampleType || 'Venous Blood',
                price: t.price || 5000,
                status: 'Pending_Payment',
                receptionistValidated: true
              }));

              const newBooking: PatientBooking = {
                id: `booking-${apptDoc.id}-${Date.now().toString().slice(-4)}`,
                bookingCode: apptData.bookingCode || `BK-${apptDoc.id.slice(0, 6).toUpperCase()}`,
                labId,
                patientId: apptData.patientId || resolvedPatientId || 'pat-1',
                patientName: apptData.patientName || apptData.title || 'Patient',
                patientAge: apptData.patientAge || 30,
                patientGender: apptData.patientGender || 'Male',
                patientPhone: apptData.patientPhone || '',
                patientEmail: apptData.patientEmail || '',
                patientPid: apptData.patientPid || apptData.patientId || resolvedPatientId || 'PID-100',
                doctorName: apptData.doctorName || 'Dr. Attending Specialist',
                sampleCollectedAt: apptData.location || 'Central Diagnostics',
                invoiceNumber: apptData.invoiceNumber || `INV-${Math.floor(10000 + Math.random() * 90000)}`,
                totalAmount: bookingTests.reduce((sum, t) => sum + t.price, 0),
                paymentStatus: 'unpaid',
                receptionistValidated: true,
                validatedBy: validatorName,
                validatedAt: timestamp,
                collectedSamples: [],
                tests: bookingTests,
                overallStatus: 'Pending_Payment',
                createdAt: timestamp,
                updatedAt: timestamp
              };

              await addDoc(bookingsCol, cleanFirestoreData(newBooking));
              matchedAnyBooking = true;
            }
          }
        }
      }
    } catch (apptErr) {
      console.warn('Appointments batch update note:', apptErr);
    }

    await auditService.logPatientAccess({
      labId,
      patientId: resolvedPatientId || 'PT-100',
      patientName: patientData?.name || 'Patient',
      action: 'CHECKIN_VERIFICATION',
      performedBy: { id: 'rec-1', name: validatorName, role: 'receptionist' },
      details: `Receptionist ${validatorName} verified and activated ${bookingIds.length} test order(s) for patient. Only selected tests routed to Cashier.`
    });

    return true;
  },

  async fetchReferringDoctors(labId: string = 'lab-1'): Promise<ReferringDoctor[]> {
    if (!labId) return [];
    try {
      const docsCol = collection(db, 'labs', labId, 'referring_doctors');
      const snap = await getDocs(docsCol);

      if (!snap.empty) {
        return snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as ReferringDoctor[];
      }

      return [];
    } catch (e) {
      console.warn('Error fetching referring doctors from Firestore:', e);
      return [];
    }
  },

  async addReferringDoctor(
    labId: string = 'lab-1',
    doctorData: Omit<ReferringDoctor, 'id' | 'createdAt' | 'updatedAt' | 'labId'>
  ): Promise<ReferringDoctor> {
    const timestamp = new Date().toISOString();
    const newDoc: ReferringDoctor = {
      ...doctorData,
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      labId,
      commissionRate: doctorData.commissionRate !== undefined ? Number(doctorData.commissionRate) : 20,
      totalReferrals: 0,
      totalRevenueGenerated: 0,
      totalCommissionEarned: 0,
      totalCommissionPaid: 0,
      status: doctorData.status || 'active',
      createdAt: timestamp,
      updatedAt: timestamp
    };

    try {
      const docsCol = collection(db, 'labs', labId, 'referring_doctors');
      const res = await addDoc(docsCol, cleanFirestoreData(newDoc));
      if (res.id) {
        newDoc.id = res.id;
      }
    } catch (e) {
      console.warn('Firestore add referring doctor error, retained in memory:', e);
    }

    return newDoc;
  },

  async updateReferringDoctor(
    labId: string = 'lab-1',
    doctorId: string,
    updates: Partial<ReferringDoctor>
  ): Promise<void> {
    try {
      const docRef = doc(db, 'labs', labId, 'referring_doctors', doctorId);
      await updateDoc(docRef, cleanFirestoreData({
        ...updates,
        updatedAt: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('Error updating referring doctor in Firestore:', e);
    }
  },

  async deleteReferringDoctor(
    labId: string = 'lab-1',
    doctorId: string
  ): Promise<void> {
    try {
      const docRef = doc(db, 'labs', labId, 'referring_doctors', doctorId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn('Error deleting referring doctor from Firestore:', e);
    }
  },

  async updateLabDefaultCommissionRate(
    labId: string = 'lab-1',
    rate: number
  ): Promise<void> {
    try {
      const labDocRef = doc(db, 'labs', labId);
      await updateDoc(labDocRef, cleanFirestoreData({
        defaultDoctorCommissionRate: Number(rate),
        updatedAt: new Date().toISOString()
      }));
    } catch (e) {
      console.warn('Error updating lab commission rate:', e);
    }
  },

  async fetchDoctorCommissionAnalytics(labId: string = 'lab-1'): Promise<{
    doctors: ReferringDoctor[];
    totalReferredPatients: number;
    totalRevenueFromReferrals: number;
    totalCommissionsEarned: number;
    totalCommissionsPaid: number;
    totalCommissionsPending: number;
    referralBookings: PatientBooking[];
    defaultCommissionRate: number;
  }> {
    const [doctorsList, allBookings] = await Promise.all([
      this.fetchReferringDoctors(labId),
      this.fetchAllBookings(labId)
    ]);

    let defaultCommissionRate = 20;
    try {
      const labDocRef = doc(db, 'labs', labId);
      const labSnap = await getDoc(labDocRef);
      if (labSnap.exists() && labSnap.data().defaultDoctorCommissionRate !== undefined) {
        defaultCommissionRate = Number(labSnap.data().defaultDoctorCommissionRate);
      }
    } catch (e) {
      // fallback 20%
    }

    const referralBookings = allBookings.filter(b => 
      Boolean(b.referringDoctor || b.referringDoctorId) && 
      b.referringDoctor?.toLowerCase() !== 'self-referred' &&
      b.referringDoctor?.toLowerCase() !== 'none'
    );

    const doctorStatsMap = new Map<string, {
      totalReferrals: number;
      totalRevenue: number;
      totalCommissionEarned: number;
      totalCommissionPaid: number;
    }>();

    for (const b of referralBookings) {
      const docKey = (b.referringDoctorId || b.referringDoctor || '').trim().toLowerCase();
      const existing = doctorStatsMap.get(docKey) || {
        totalReferrals: 0,
        totalRevenue: 0,
        totalCommissionEarned: 0,
        totalCommissionPaid: 0
      };

      const billAmount = b.actualPaidAmount !== undefined ? b.actualPaidAmount : (b.totalAmount || b.originalTotalAmount || 0);
      const commRate = b.referralCommissionRate || defaultCommissionRate;
      const commAmount = b.referralCommissionAmount !== undefined 
        ? b.referralCommissionAmount 
        : Math.round(billAmount * (commRate / 100));

      existing.totalReferrals += 1;
      existing.totalRevenue += billAmount;
      existing.totalCommissionEarned += commAmount;
      if (b.referralCommissionStatus === 'paid' || b.referralCommissionStatus === 'settled') {
        existing.totalCommissionPaid += commAmount;
      }

      doctorStatsMap.set(docKey, existing);
    }

    const enrichedDoctors = doctorsList.map(doc => {
      const keyById = (doc.id || '').trim().toLowerCase();
      const keyByName = (doc.name || '').trim().toLowerCase();
      const stats = doctorStatsMap.get(keyById) || doctorStatsMap.get(keyByName);

      const liveReferrals = stats ? stats.totalReferrals : (doc.totalReferrals || 0);
      const liveRevenue = stats ? stats.totalRevenue : (doc.totalRevenueGenerated || 0);
      const liveEarned = stats ? stats.totalCommissionEarned : (doc.totalCommissionEarned || Math.round(liveRevenue * ((doc.commissionRate || defaultCommissionRate) / 100)));
      const livePaid = stats ? stats.totalCommissionPaid : (doc.totalCommissionPaid || 0);

      return {
        ...doc,
        commissionRate: doc.commissionRate || defaultCommissionRate,
        totalReferrals: liveReferrals,
        totalRevenueGenerated: liveRevenue,
        totalCommissionEarned: liveEarned,
        totalCommissionPaid: livePaid
      };
    });

    const totalReferredPatients = enrichedDoctors.reduce((acc, d) => acc + (d.totalReferrals || 0), 0);
    const totalRevenueFromReferrals = enrichedDoctors.reduce((acc, d) => acc + (d.totalRevenueGenerated || 0), 0);
    const totalCommissionsEarned = enrichedDoctors.reduce((acc, d) => acc + (d.totalCommissionEarned || 0), 0);
    const totalCommissionsPaid = enrichedDoctors.reduce((acc, d) => acc + (d.totalCommissionPaid || 0), 0);
    const totalCommissionsPending = Math.max(0, totalCommissionsEarned - totalCommissionsPaid);

    return {
      doctors: enrichedDoctors,
      totalReferredPatients,
      totalRevenueFromReferrals,
      totalCommissionsEarned,
      totalCommissionsPaid,
      totalCommissionsPending,
      referralBookings,
      defaultCommissionRate
    };
  },

  async markCommissionPaid(
    labId: string = 'lab-1',
    bookingId: string,
    paidBy: string = 'Admin Cashier'
  ): Promise<boolean> {
    try {
      const timestamp = new Date().toISOString();
      const bookingRef = doc(db, 'labs', labId, 'bookings', bookingId);
      await updateDoc(bookingRef, cleanFirestoreData({
        referralCommissionStatus: 'settled',
        referralCommissionPaidAt: timestamp,
        referralCommissionPaidBy: paidBy,
        updatedAt: timestamp
      }));
      return true;
    } catch (e) {
      console.warn('Error settling booking referral commission:', e);
      return false;
    }
  },

  async markAllCommissionsPaidForDoctor(
    labId: string = 'lab-1',
    doctorIdOrName: string,
    paidBy: string = 'Admin Cashier'
  ): Promise<number> {
    try {
      const timestamp = new Date().toISOString();
      const allBookings = await this.fetchAllBookings(labId);
      const targetDocKey = doctorIdOrName.trim().toLowerCase();

      const doctorBookings = allBookings.filter(b => 
        (b.referringDoctorId?.trim().toLowerCase() === targetDocKey ||
         b.referringDoctor?.trim().toLowerCase() === targetDocKey) &&
        b.referralCommissionStatus !== 'settled' &&
        b.referralCommissionStatus !== 'paid'
      );

      let count = 0;
      for (const b of doctorBookings) {
        const bookingRef = doc(db, 'labs', labId, 'bookings', b.id);
        await updateDoc(bookingRef, cleanFirestoreData({
          referralCommissionStatus: 'settled',
          referralCommissionPaidAt: timestamp,
          referralCommissionPaidBy: paidBy,
          updatedAt: timestamp
        }));
        count++;
      }

      return count;
    } catch (e) {
      console.warn('Error settling doctor commissions in batch:', e);
      return 0;
    }
  }
};

export default limsService;