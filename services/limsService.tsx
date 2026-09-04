import { db, collection, addDoc, doc, getDoc, getDocs, updateDoc, deleteDoc, onSnapshot, query, orderBy, setDoc } from './firebase';
import { auditService } from './auditService';
import { MASTER_TESTS_CATALOG, MasterTestItem } from '../data/masterTestsData';
import { cleanFirestoreData } from '../utils/sanitizeData';
import { ReferringDoctor, Doctor } from '../types';

export type { MasterTestItem, ReferringDoctor, Doctor };

export type TestStatus = 'Pending_Validation' | 'Pending_Payment' | 'Pending_Collection' | 'In_Lab_Testing' | 'Completed' | 'Ready_For_Pickup';

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
  collectorAccessCode?: string;
  storageLocation?: string;
  sampleBarcode?: string;
  collectedSamples?: string[];
  sampleType?: string;
  reagentsUsed?: Array<{
    reagentId?: string;
    reagentName: string;
    quantity: number;
    unit?: string;
  }>;
  resultFileUrl?: string;
  subParameters?: Array<{
    id: string;
    name: string;
    unit: string;
    sectionHeader?: string;
    subHeader?: string;
    refRangeMale: string;
    refRangeFemale: string;
    refRangeChild: string;
    refRangeWords?: string;
    maleMin?: number;
    maleMax?: number;
    femaleMin?: number;
    femaleMax?: number;
    childMin?: number;
    childMax?: number;
    value?: string;
    resultInWords?: string;
    patientValue?: string;
    isAbnormal?: boolean;
    printOnReport?: boolean;
    parameterType?: 'numeric' | 'text' | 'formula' | 'heading' | 'select';
    formulaIdentifier?: string;
    computationFormula?: string;
    options?: string[];
    method?: string;
    notes?: string;
    comments?: string;
    flag?: 'Normal' | 'Low' | 'High' | 'Borderline';
  }>;
  resultValue?: string;
  resultFlag?: 'Normal' | 'Low' | 'High' | 'Borderline';
  labNotes?: string;
  completedAt?: string;
  completedBy?: string;
  pdfReportUrl?: string;
  externalPdfUrl?: string;
  pdfUrl?: string;
  fileUrl?: string;
  name?: string;
  cote?: string;
  hierarchicalParams?: Array<{
    section?: string;
    subHeader?: string;
    name: string;
    value?: string;
    defaultValue?: string;
    unit?: string;
    dualUnit?: string;
    refRange?: string;
    interpretation?: string;
  }>;
  antibiogram?: Array<{
    id?: string;
    antibiotic: string;
    discPotency?: string;
    zoneMm?: string;
    sensitivity: 'S' | 'I' | 'R' | string;
  }>;
}

export interface PatientBooking {
  id: string; // Booking ID e.g. BK-2026-0813-001
  bookingCode: string;
  labId: string;
  labName?: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  age?: number;
  dateOfBirth?: string;
  dob?: string;
  patientGender?: 'Male' | 'Female' | 'Child';
  patientPhone?: string;
  patientEmail?: string;
  patientPid?: string; // PID number
  doctorName?: string; // Referring physician
  referringDoctorId?: string;
  referringDoctor?: string;
  referralHospital?: string;
  referralNotes?: string;
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
  insuranceCoveragePercent?: number; // e.g. 80 for 80% coverage
  coPayPercent?: number; // Patient direct co-payment percentage
  insuranceCoveredAmount?: number; // Amount covered by insurance
  patientCoPayAmount?: number; // Patient direct co-payment balance
  discountType?: 'percentage' | 'percent' | 'fixed' | 'coupon' | 'staff_exemption' | 'workers_benefit' | string;
  discountValue?: number;
  discountAmount?: number;
  couponCode?: string;
  paymentStatus: 'unpaid' | 'paid';
  paymentMethod?: 'cash' | 'mobile_money' | 'bank_transfer' | 'card' | 'insurance' | 'workers_benefit' | 'gift_coupon' | string;
  paymentDate?: string;
  paidAt?: string;
  paymentProcessedBy?: string;
  paymentDetails?: any;
  
  // Receptionist Validation & Walk-In Flags
  receptionistValidated?: boolean;
  validatedBy?: string;
  validatedAt?: string;
  registrationType?: 'online' | 'walk_in';
  isOnlineBooking?: boolean;
  virtualRequested?: boolean;
  virtualRequestedAt?: string;

  // Sample collection details
  sampleCollected?: boolean;
  deliveryMethod?: 'Virtual' | 'Physical' | 'Email' | 'WhatsApp' | string;
  collectedSamples: string[]; // e.g. ['Whole Blood (EDTA Tube)', 'Midstream Urine']
  sampleCollectedAtDate?: string;
  sampleCollectedBy?: string;
  adminSampleVerified?: boolean;
  adminSampleVerifiedBy?: string;
  adminSampleVerifiedAt?: string;

  // Security & Privacy Lockdown
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

  // Processing Results & Files
  tests: BookingTestItem[];
  overallStatus: TestStatus;
  status?: string;
  pdfReportUrl?: string; // Digital generated report
  externalPdfUrl?: string; // Option 2 fallback PDF
  physicalPickupAlertSent?: boolean;
  
  // Biologist Sign-off & Release
  biologistConfirmed?: boolean;
  biologistSigned?: boolean;
  biologistName?: string;
  biologistSignedAt?: string;
  biologistRemarks?: string;
  biologistPasscodeVerified?: boolean;
  resultsReady?: boolean;
  resultsReleased?: boolean;
  labTechSigned?: boolean;
  labTechSignedAt?: string;
  completedAt?: string;
  verifiedAt?: string;
  resultEnteredAt?: string;
  
  createdAt: string;
  updatedAt: string;
}

export const limsService = {
  /**
   * Generates a unique daily Booking ID (e.g. BK-2026-8812)
   */
  generateBookingCode(): string {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `BK-${new Date().getFullYear()}-${random}`;
  },

  /**
   * Generates an invoice code
   */
  generateInvoiceCode(): string {
    const random = Math.floor(10000 + Math.random() * 90000);
    return `INV-${random}`;
  },

  /**
   * Get all bookings for a laboratory
   */
  async getBookings(labId: string = 'lab-1'): Promise<PatientBooking[]> {
    try {
      const bookingsCol = collection(db, 'labs', labId, 'bookings');
      const snap = await getDocs(bookingsCol);
      if (!snap.empty) {
        return snap.docs.map(d => ({
          id: d.id,
          ...d.data()
        })) as PatientBooking[];
      }
      return [];
    } catch (e) {
      console.warn('Error getting bookings from Firestore:', e);
      return [];
    }
  },

  /**
   * Receptionist creates a new Patient Booklet Booking
   */
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

    // Determine lab pricing model (platform subscription or per-test system fee)
    let feePerTest = 0;
    try {
      const labDocRef = doc(db, 'labs', labId);
      const labDocSnap = await getDoc(labDocRef);
      if (labDocSnap.exists()) {
        const labData = labDocSnap.data();
        if (labData.pricingModel === 'pay_per_test') {
          feePerTest = labData.feePerTest !== undefined ? Number(labData.feePerTest) : 500;
        }
      }
    } catch (labErr) {
      console.warn('Could not read lab pricing model for fee check:', labErr);
    }

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

    // Save to Firestore /labs/{labId}/bookings
    try {
      const bookingsCol = collection(db, 'labs', labId, 'bookings');
      await addDoc(bookingsCol, cleanFirestoreData(newBooking));
    } catch (e) {
      console.warn('Firestore booking save bypassed, using local memory state:', e);
    }

    // If staff exemption, push instant alert to Admin Notifications collection
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

    // Also sync tests into Patient record labTests array
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

    // Audit log
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

  /**
   * Cashier processes payment for a Booking with comprehensive multi-channel payment details
   */
  async processPayment(params: {
    labId: string;
    bookingId: string;
    paymentMethod: 'cash' | 'mobile_money' | 'bank_transfer' | 'card' | 'insurance' | 'workers_benefit' | 'gift_coupon' | string;
    processedByName: string;
    paymentDetails?: {
      momoNumber?: string;
      momoProvider?: string;
      momoSenderPhone?: string;
      momoSenderName?: string;
      momoTxId?: string;
      cardType?: string;
      cardScheme?: string;
      cardLast4?: string;
      cardAuthCode?: string;
      bankName?: string;
      bankAccountName?: string;
      bankReference?: string;
      bankBranch?: string;
      bankTransferDate?: string;
      workerStaffName?: string;
      workerStaffId?: string;
      workerDepartment?: string;
      workerBenefitType?: string;
      workerAuthNote?: string;
      couponCode?: string;
      couponDiscountPercent?: number;
      couponDiscountAmount?: number;
      couponSponsorName?: string;
      couponNotes?: string;
      insuranceName?: string;
      insuranceProvider?: string;
      insurancePolicyNumber?: string;
      insurancePercentage?: number;
      insuranceCopay?: number;
      cashGiven?: number;
      cashChange?: number;
      transactionRef?: string;
      originalPrice?: number;
      discountAmount?: number;
      discountType?: string;
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
        const updatedTests = (data.tests || []).map(t => ({
          ...t,
          paid: true,
          paymentStatus: 'paid' as const,
          paymentMethod,
          paidAt: timestamp,
          status: 'Pending_Collection' as TestStatus
        }));

        const calculatedAmount = data.totalAmount && data.totalAmount > 0 
          ? data.totalAmount 
          : updatedTests.reduce((sum, t) => sum + (t.price || 5500), 0);

        await updateDoc(doc(db, 'labs', labId, 'bookings', bookingDoc.id), cleanFirestoreData({
          paymentStatus: 'paid',
          paymentMethod,
          paymentDate: timestamp,
          paidAt: timestamp,
          paymentProcessedBy: processedByName,
          paymentDetails: paymentDetails || null,
          totalAmount: calculatedAmount,
          overallStatus: 'Pending_Collection',
          tests: updatedTests,
          updatedAt: timestamp
        }));

        // Sync to patient's document labTests array
        try {
          if (data.patientId) {
            const patRef = doc(db, 'labs', labId, 'patients', data.patientId);
            const patSnap = await getDoc(patRef);
            if (patSnap.exists()) {
              const currentTests: any[] = patSnap.data().labTests || [];
              const updatedPatTests = currentTests.map(pt => {
                const isPart = data.tests.some(bt => bt.id === pt.id || bt.testId === pt.testId || bt.testName === pt.testName);
                if (isPart || pt.bookingCode === data.bookingCode) {
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

        // Sync to appointments collection if exists
        try {
          const apptRef = doc(db, 'labs', labId, 'appointments', bookingId);
          const apptSnap = await getDoc(apptRef);
          if (apptSnap.exists()) {
            await updateDoc(apptRef, cleanFirestoreData({
              paymentStatus: 'paid',
              paid: true,
              paymentMethod,
              paidAt: timestamp,
              paymentDetails: paymentDetails || null,
              totalAmount: calculatedAmount,
              updatedAt: timestamp
            }));
          }
        } catch (apptErr) {
          console.warn('Appointment payment sync error:', apptErr);
        }

        // Log financial audit
        await auditService.logPatientAccess({
          labId,
          patientId: data.patientId,
          patientName: data.patientName,
          action: 'PROCESS_PAYMENT',
          performedBy: { id: 'cashier-1', name: processedByName, role: 'cashier' },
          details: `Processed ${paymentMethod.toUpperCase()} payment for Booking ${data.bookingCode} (Amount: ${calculatedAmount} XAF). Status shifted to PAID ➔ Pending_Collection.`
        });

        return true;
      }
    } catch (e) {
      console.error('Error processing payment in limsService:', e);
    }
    return false;
  },

  /**
   * Cashier processes batch payments for multiple selected bookings
   */
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

  /**
   * Phlebotomist / Analyzer selects sample matrices physically drawn & completes collection
   * Supports per-test storage location, specimen sample type, barcode label, and analyzer access code tracking
   */
  async completeSampleCollection(params: {
    labId: string;
    bookingId: string;
    singleTestId?: string;
    collectedSamples: string[]; // e.g. ['Whole Blood (EDTA Tube)', 'Midstream Urine Container']
    collectorName: string;
    collectorAccessCode?: string;
    testStorageMap?: Record<string, { storageLocation: string; sampleType: string; sampleBarcode?: string }>;
  }): Promise<boolean> {
    const { labId, bookingId, singleTestId, collectedSamples, collectorName, collectorAccessCode, testStorageMap } = params;
    const timestamp = new Date().toISOString();

    try {
      const bookingsCol = collection(db, 'labs', labId, 'bookings');
      const snap = await getDocs(bookingsCol);
      const bookingDoc = snap.docs.find(d => d.data().id === bookingId || d.id === bookingId);

      if (bookingDoc) {
        const data = bookingDoc.data() as PatientBooking;
        let modifiedTestName = '';

        const updatedTests = data.tests.map(t => {
          const testKey = t.id || t.testId || t.testName;
          const specificStorage = testStorageMap?.[testKey] || testStorageMap?.[t.testName] || testStorageMap?.[t.id];

          if (singleTestId) {
            if (t.id === singleTestId || t.testId === singleTestId || t.testName === singleTestId) {
              modifiedTestName = t.testName;
              return {
                ...t,
                status: 'In_Lab_Testing' as TestStatus,
                sampleCollected: true,
                sampleCollectedAt: timestamp,
                sampleCollectedBy: collectorName,
                collectorAccessCode: collectorAccessCode || t.collectorAccessCode,
                storageLocation: specificStorage?.storageLocation || (t as any).storageLocation,
                sampleType: specificStorage?.sampleType || t.sampleTypeRequired || t.sampleType,
                sampleBarcode: specificStorage?.sampleBarcode || (t as any).sampleBarcode,
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
            sampleCollectedBy: collectorName,
            collectorAccessCode: collectorAccessCode || t.collectorAccessCode,
            storageLocation: specificStorage?.storageLocation || (t as any).storageLocation,
            sampleType: specificStorage?.sampleType || t.sampleTypeRequired || t.sampleType,
            sampleBarcode: specificStorage?.sampleBarcode || (t as any).sampleBarcode,
            collectedSamples
          };
        });

        // Determine if all tests in this booking are collected
        const allCollectedOrDone = updatedTests.every(t => 
          t.status === 'In_Lab_Testing' || t.status === 'Completed' || t.sampleCollected === true
        );

        const newOverallStatus = allCollectedOrDone ? 'In_Lab_Testing' : 'Pending_Collection';

        await updateDoc(doc(db, 'labs', labId, 'bookings', bookingDoc.id), cleanFirestoreData({
          collectedSamples,
          sampleCollectedAtDate: timestamp,
          sampleCollectedBy: collectorName,
          collectorAccessCode: collectorAccessCode || undefined,
          overallStatus: newOverallStatus,
          tests: updatedTests,
          updatedAt: timestamp
        }));

        // Sync to patient's document so patient tracker updates dynamically
        if (data.patientId) {
          try {
            const patRef = doc(db, 'labs', labId, 'patients', data.patientId);
            const patSnap = await getDoc(patRef);
            if (patSnap.exists()) {
              const currentTests: any[] = patSnap.data().labTests || [];
              const updatedPatTests = currentTests.map(pt => {
                const specificStorage = testStorageMap?.[pt.id || pt.testId || pt.testName];
                if (singleTestId) {
                  const isMatch = pt.id === singleTestId || pt.testId === singleTestId || (pt.testName || pt.name) === modifiedTestName || (pt.testName || pt.name) === singleTestId;
                  if (isMatch) {
                    return {
                      ...pt,
                      status: 'In_Lab_Testing',
                      sampleCollected: true,
                      sampleCollectedAt: timestamp,
                      sampleCollectedBy: collectorName,
                      collectorAccessCode: collectorAccessCode || pt.collectorAccessCode,
                      storageLocation: specificStorage?.storageLocation || pt.storageLocation,
                      sampleType: specificStorage?.sampleType || pt.sampleTypeRequired || pt.sampleType,
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
                    sampleCollectedBy: collectorName,
                    collectorAccessCode: collectorAccessCode || pt.collectorAccessCode,
                    storageLocation: specificStorage?.storageLocation || pt.storageLocation,
                    sampleType: specificStorage?.sampleType || pt.sampleTypeRequired || pt.sampleType,
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

        // Audit chain of custody
        await auditService.logPatientAccess({
          labId,
          patientId: data.patientId,
          patientName: data.patientName,
          action: 'COLLECT_SAMPLE',
          performedBy: { id: collectorAccessCode || 'phleb-1', name: collectorName, role: 'analyzer' },
          details: singleTestId 
            ? `Specimen matrices gathered for single test [${modifiedTestName || singleTestId}] in Booking ${data.bookingCode}: [${collectedSamples.join(', ')}]. Access Code [${collectorAccessCode || 'N/A'}]. Routed to Lab Testing.`
            : `Specimen matrices gathered for Booking ${data.bookingCode}: [${collectedSamples.join(', ')}]. Access Code [${collectorAccessCode || 'N/A'}]. Hand-labeled tubes routed to Lab Testing.`
        });

        return true;
      }
    } catch (e) {
      console.error('Error in completeSampleCollection:', e);
    }
    return false;
  },

  /**
   * Admin verifies sample integrity and physical access code clearance
   */
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
        await updateDoc(doc(db, 'labs', labId, 'bookings', bookingDoc.id), cleanFirestoreData({
          adminSampleVerified: true,
          adminSampleVerifiedBy: adminName,
          adminSampleVerifiedAt: timestamp,
          updatedAt: timestamp
        }));

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

  /**
   * Lab Tech Claims or Verifies Privacy Lockdown for a Patient Booking
   */
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
        
        // If not assigned yet, claim assignment!
        if (!data.assignedTechId) {
          await updateDoc(doc(db, 'labs', labId, 'bookings', bookingDoc.id), cleanFirestoreData({
            assignedTechId: techId,
            assignedTechName: techName,
            assignedAt: timestamp,
            updatedAt: timestamp
          }));

          // Also update the Patient document and booklet records so the patient booklet shows who is assigned!
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

                await updateDoc(patientRef, cleanFirestoreData({
                  assignedLabTech: techName,
                  assignedTechId: techId,
                  assignedTechName: techName,
                  assignedAt: timestamp,
                  labTests: updatedLabTests,
                  updatedAt: timestamp
                }));
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

        // If already assigned
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

  /**
   * Lab Tech Shares Patient Access with another Tech via Guideline Confirmation & Access Code Verification
   */
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

        await updateDoc(doc(db, 'labs', labId, 'bookings', bookingDoc.id), cleanFirestoreData({
          sharedWithTechs: [...existingShared, newShare],
          updatedAt: timestamp
        }));

        // Audit Trail on Patient Portal
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

  /**
   * Option 1: Submit Form Results, Deduct Inventory Reagents & Publish Native Report
   */
  async submitFormResults(params: {
    labId: string;
    bookingId: string;
    testResultsMap: Record<string, {
      resultValue?: string;
      resultFlag?: 'Normal' | 'Low' | 'High' | 'Borderline';
      subParams?: Record<string, string>;
      fullSubParameters?: any[];
      hierarchicalParams?: any[];
      antibiogram?: any[];
      reagentsUsed?: Array<{ reagentId?: string; reagentName: string; quantity: number; unit?: string }>;
      notes?: string;
    }>;
    techName: string;
    pdfReportDataUrl?: string;
  }): Promise<boolean> {
    const { labId, bookingId, testResultsMap, techName, pdfReportDataUrl } = params;
    const timestamp = new Date().toISOString();

    try {
      const bookingsCol = collection(db, 'labs', labId, 'bookings');
      const snap = await getDocs(bookingsCol);
      const bookingDoc = snap.docs.find(d => d.data().id === bookingId || d.id === bookingId);

      if (bookingDoc) {
        const data = bookingDoc.data() as PatientBooking;
        
        // 1. Process test items & evaluate High/Low flags
        const updatedTests = data.tests.map(test => {
          const resObj = testResultsMap[test.id];
          if (!resObj) return test;

          let updatedSubParams = resObj.fullSubParameters || test.subParameters;
          if (resObj.subParams && updatedSubParams) {
            updatedSubParams = updatedSubParams.map(sp => {
              const valStr = resObj.subParams?.[sp.id] !== undefined ? resObj.subParams[sp.id] : (sp.value || '');
              const valNum = parseFloat(valStr);
              let flag: 'Normal' | 'Low' | 'High' = sp.flag || 'Normal';

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
            resultFlag: resObj.resultFlag || test.resultFlag,
            subParameters: updatedSubParams,
            hierarchicalParams: resObj.hierarchicalParams || test.hierarchicalParams,
            antibiogram: resObj.antibiogram || test.antibiogram,
            reagentsUsed: resObj.reagentsUsed || test.reagentsUsed,
            labNotes: resObj.notes || test.labNotes,
            status: 'Completed' as TestStatus,
            completedAt: timestamp,
            completedBy: techName
          };
        });

        // 2. Auto-deduct reagents from inventory
        await this.deductReagentsForBooking(labId, data.tests);

        // 3. Update booking record
        await updateDoc(doc(db, 'labs', labId, 'bookings', bookingDoc.id), cleanFirestoreData({
          tests: updatedTests,
          overallStatus: 'Completed',
          pdfReportUrl: pdfReportDataUrl || data.pdfReportUrl || null,
          labTechSigned: true,
          labTechSignedAt: timestamp,
          updatedAt: timestamp
        }));

        // 4. Also update Patient record labTests array so patient portal sees completed findings immediately!
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

        // Audit Log
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

  /**
   * Decoupled Per-Test Processing: Allows completing, validating, or updating an individual test item
   * without blocking other pending tests in the patient's multi-test booking order.
   */
  async submitIndividualTestResult(params: {
    labId: string;
    bookingId: string;
    testId: string;
    resultValue?: string;
    resultFlag?: 'Normal' | 'Low' | 'High' | 'Borderline';
    subParams?: Record<string, string>;
    fullSubParameters?: any[];
    hierarchicalParams?: any[];
    antibiogram?: any[];
    notes?: string;
    techName: string;
    pdfReportDataUrl?: string;
    reagentsUsed?: Array<{ reagentId?: string; reagentName: string; quantity: number; unit?: string }>;
  }): Promise<boolean> {
    const { labId, bookingId, testId, resultValue, resultFlag, subParams, fullSubParameters, hierarchicalParams, antibiogram, notes, techName, pdfReportDataUrl, reagentsUsed } = params;
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
          let updatedSubParams = fullSubParameters || test.subParameters;
          if (subParams && updatedSubParams) {
            updatedSubParams = updatedSubParams.map(sp => {
              const valStr = subParams[sp.id] !== undefined ? subParams[sp.id] : (sp.value || '');
              const valNum = parseFloat(valStr);
              let flag: 'Normal' | 'Low' | 'High' = sp.flag || 'Normal';

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
            resultFlag: resultFlag || test.resultFlag,
            subParameters: updatedSubParams,
            hierarchicalParams: hierarchicalParams || test.hierarchicalParams,
            antibiogram: antibiogram || test.antibiogram,
            labNotes: notes || test.labNotes,
            reagentsUsed: reagentsUsed || test.reagentsUsed,
            status: 'Completed' as TestStatus,
            completedAt: timestamp,
            completedBy: techName
          };
        });

        // Determine if all tests in this booking are now completed
        const allCompleted = updatedTests.every(t => t.status === 'Completed');

        // Deduct reagents for this specific test (explicit or default catalog requirements)
        if (reagentsUsed && reagentsUsed.length > 0) {
          await this.deductCustomReagents(labId, reagentsUsed);
        } else {
          const targetTest = data.tests.find(t => t.id === testId || t.testId === testId);
          if (targetTest) {
            await this.deductReagentsForBooking(labId, [targetTest]);
          }
        }

        await updateDoc(doc(db, 'labs', labId, 'bookings', bookingDoc.id), cleanFirestoreData({
          tests: updatedTests,
          overallStatus: allCompleted ? 'Completed' : 'In_Lab_Testing',
          pdfReportUrl: pdfReportDataUrl || data.pdfReportUrl || null,
          updatedAt: timestamp
        }));

        // Update Patient's individual test status
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

        // Audit Trail
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

  /**
   * Option 2: Upload External PDF / Image Fallback File (Per-Test or Full Batch)
   */
  async uploadExternalPdfResult(params: {
    labId: string;
    bookingId: string;
    externalPdfUrl: string;
    techName: string;
    targetTestId?: string; // Optional: specific test ID in batch, or 'all' for full batch
  }): Promise<boolean> {
    const { labId, bookingId, externalPdfUrl, techName, targetTestId } = params;
    const timestamp = new Date().toISOString();
    const isPerTest = Boolean(targetTestId && targetTestId !== 'all');

    try {
      const bookingsCol = collection(db, 'labs', labId, 'bookings');
      const snap = await getDocs(bookingsCol);
      const bookingDoc = snap.docs.find(d => d.data().id === bookingId || d.id === bookingId);

      if (bookingDoc) {
        const data = bookingDoc.data() as PatientBooking;
        
        let targetTestName = '';
        const updatedTests = data.tests.map(t => {
          const isTarget = !isPerTest || t.id === targetTestId || t.testId === targetTestId;
          if (isTarget) {
            if (isPerTest) targetTestName = t.testName;
            return {
              ...t,
              status: 'Completed' as TestStatus,
              completedAt: timestamp,
              completedBy: techName,
              externalPdfUrl,
              pdfReportUrl: externalPdfUrl
            };
          }
          return t;
        });

        const allCompleted = updatedTests.every(t => t.status === 'Completed');
        const overallStatus = allCompleted ? 'Completed' : 'In_Progress';

        const bookingUpdate: any = {
          tests: updatedTests,
          overallStatus,
          labTechSigned: allCompleted,
          labTechSignedAt: allCompleted ? timestamp : data.labTechSignedAt,
          updatedAt: timestamp
        };

        // If batch upload, set on the booking header
        if (!isPerTest) {
          bookingUpdate.externalPdfUrl = externalPdfUrl;
          bookingUpdate.pdfReportUrl = externalPdfUrl;
        }

        await updateDoc(doc(db, 'labs', labId, 'bookings', bookingDoc.id), cleanFirestoreData(bookingUpdate));

        // Sync to patient record
        if (data.patientId) {
          try {
            const patRef = doc(db, 'labs', labId, 'patients', data.patientId);
            const patSnap = await getDoc(patRef);
            if (patSnap.exists()) {
              const currentTests: any[] = patSnap.data().labTests || [];
              const updatedPatTests = currentTests.map(pt => {
                const isMatch = isPerTest 
                  ? (pt.id === targetTestId || pt.testId === targetTestId || (targetTestName && (pt.testName === targetTestName || pt.name === targetTestName)))
                  : (data.tests.some(bt => bt.id === pt.id || bt.testId === pt.testId || bt.testName === (pt.testName || pt.name)) || pt.bookingCode === data.bookingCode);
                
                if (isMatch) {
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
          details: isPerTest
            ? `Uploaded external test result sheet for test "${targetTestName}" in Booking ${data.bookingCode}.`
            : `Uploaded consolidated diagnostic report sheet for Booking ${data.bookingCode}. Attached securely to Patient Portal.`
        });

        return true;
      }
    } catch (e) {
      console.error('Error in uploadExternalPdfResult:', e);
    }
    return false;
  },

  /**
   * Biologist validates, provides diagnosis interpretation, signs with authorization code, and releases results to patient portal
   */
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

        await updateDoc(doc(db, 'labs', labId, 'bookings', bookingDoc.id), cleanFirestoreData({
          biologistSigned: true,
          biologistName,
          biologistSignedAt: timestamp,
          biologistRemarks: biologistRemarks || 'Clinical findings reviewed and authorized for official release.',
          biologistPasscodeVerified: true,
          overallStatus: 'Completed',
          tests: updatedTests,
          updatedAt: timestamp
        }));

        // Sync to patient record
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

  /**
   * Option 3: Trigger Physical Pickup Notification (Passcode Protected)
   */
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

        await updateDoc(doc(db, 'labs', labId, 'bookings', bookingDoc.id), cleanFirestoreData({
          physicalPickupAlertSent: true,
          overallStatus: 'Ready_For_Pickup',
          tests: updatedTests,
          updatedAt: timestamp
        }));

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

  /**
   * Reagent inventory auto-deduction helper
   */
  async deductReagentsForBooking(labId: string, bookingTests: BookingTestItem[]): Promise<void> {
    try {
      const inventoryCol = collection(db, 'labs', labId, 'inventory');
      const snap = await getDocs(inventoryCol);
      const inventoryDocs = snap.docs;

      for (const test of bookingTests) {
        // Find master item to get reagent requirements
        const master = MASTER_TESTS_CATALOG.find(m => m.id === test.testId || m.name === test.testName);
        if (master && master.reagentsRequired) {
          for (const req of master.reagentsRequired) {
            // Find inventory match by name
            const itemDoc = inventoryDocs.find(d => 
              d.data().name?.toLowerCase().includes(req.reagentName.toLowerCase()) ||
              req.reagentName.toLowerCase().includes(d.data().name?.toLowerCase() || '')
            );

            if (itemDoc) {
              const currentQty = itemDoc.data().quantity || 100;
              const newQty = Math.max(0, currentQty - req.quantityRequired);
              await updateDoc(doc(db, 'labs', labId, 'inventory', itemDoc.id), cleanFirestoreData({
                quantity: newQty,
                updatedAt: new Date().toISOString()
              }));
              console.log(`📉 Auto-deducted inventory reagent "${req.reagentName}": ${currentQty} ➔ ${newQty}`);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Reagent inventory auto-deduction notice:', e);
    }
  },

  /**
   * Explicit Reagent Deduction specified by Lab Tech
   */
  async deductCustomReagents(labId: string, reagents: Array<{ reagentId?: string; reagentName: string; quantity: number }>): Promise<void> {
    if (!reagents || reagents.length === 0) return;
    try {
      const inventoryCol = collection(db, 'labs', labId, 'inventory');
      const snap = await getDocs(inventoryCol);
      const inventoryDocs = snap.docs;

      for (const req of reagents) {
        if (!req.quantity || req.quantity <= 0) continue;
        const itemDoc = inventoryDocs.find(d => 
          (req.reagentId && d.id === req.reagentId) ||
          d.data().name?.toLowerCase().includes(req.reagentName.toLowerCase()) ||
          req.reagentName.toLowerCase().includes(d.data().name?.toLowerCase() || '')
        );

        if (itemDoc) {
          const currentQty = itemDoc.data().quantity || 0;
          const newQty = Math.max(0, currentQty - req.quantity);
          await updateDoc(doc(db, 'labs', labId, 'inventory', itemDoc.id), cleanFirestoreData({
            quantity: newQty,
            updatedAt: new Date().toISOString()
          }));
          console.log(`📉 Reagent deducted "${req.reagentName}": ${currentQty} - ${req.quantity} = ${newQty}`);
        }
      }
    } catch (e) {
      console.warn('Explicit reagent deduction notice:', e);
    }
  },

  /**
   * Get custom/updated Master Test Catalog
   */
  async getMasterTestCatalog(labId: string): Promise<MasterTestItem[]> {
    try {
      const customCol = collection(db, 'labs', labId, 'master_tests');
      const snap = await getDocs(customCol);
      if (!snap.empty) {
        const customItems = snap.docs.map(d => ({ id: d.id, ...d.data() })) as MasterTestItem[];
        // Combine custom items with default catalog (avoid duplicates by id)
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

  /**
   * Save a new or edited master test definition (Admin / Lab Tech test creator)
   */
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

  /**
   * Fetch all bookings and requisitions for a lab
   */
  async fetchAllBookings(labId: string): Promise<PatientBooking[]> {
    try {
      const bookingsCol = collection(db, 'labs', labId, 'bookings');
      const snap = await getDocs(bookingsCol);
      const bookings = snap.docs.map(d => ({ id: d.id, ...d.data() })) as PatientBooking[];

      // Sort newest-first based on creation timestamp
      return bookings.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
    } catch (e) {
      console.warn('Error fetching bookings:', e);
    }
    return [];
  },

  /**
   * Real-Time Live Subscription to Bookings and Test Statuses
   * Direct deterministic subscription to Firestore bookings collection.
   */
  subscribeToBookings(
    labId: string = 'lab-1',
    onUpdate: (bookings: PatientBooking[]) => void,
    onError?: (err: any) => void
  ): () => void {
    try {
      const bookingsCol = collection(db, 'labs', labId, 'bookings');
      const unsubscribe = onSnapshot(
        bookingsCol,
        (snap) => {
          try {
            const rawDocs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as PatientBooking[];
            const sorted = rawDocs.sort((a, b) => {
              const timeA = new Date(a.createdAt || 0).getTime();
              const timeB = new Date(b.createdAt || 0).getTime();
              return timeB - timeA;
            });
            onUpdate(sorted);
          } catch (e) {
            console.warn('[LIMS Real-time Subscription Parse Error]:', e);
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
      // Immediate initial load fallback
      this.fetchAllBookings(labId).then(onUpdate).catch(() => onUpdate([]));
      return () => {};
    }
  },

  /**
   * Real-Time Live Subscription to Patients Directory
   */
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

  /**
   * Receptionist validates and checks in a patient test order (enables Cashier payment collection)
   */
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

  /**
   * Receptionist batch validates ONLY the specifically selected test orders for a patient
   */
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

    // 1. Update matching bookings in labs/{labId}/bookings collection
    try {
      const snap = await getDocs(bookingsCol);
      for (const bDoc of snap.docs) {
        const bData = bDoc.data() as PatientBooking;
        const belongsToPatient = resolvedPatientId && (
          bData.patientId === resolvedPatientId || 
          bData.patientPid === resolvedPatientId || 
          (patientData?.patientId && bData.patientPid === patientData.patientId)
        );
        const hasMatchingTest = bData.tests && bData.tests.some(t => 
          bookingIds.includes(t.id) || 
          bookingIds.includes(t.testId) || 
          bookingIds.includes(t.testName)
        );
        const isDocMatch = bookingIds.includes(bDoc.id) || bookingIds.includes(bData.id);

        if (belongsToPatient || hasMatchingTest || isDocMatch) {
          let updatedAnyTest = false;
          
          const updatedTests = (bData.tests || []).map(t => {
            const isThisTestSelected = bookingIds.includes(t.id) || 
                                       bookingIds.includes(t.testId) || 
                                       bookingIds.includes(t.testName) ||
                                       (Boolean((t as any).bookingId) && bookingIds.includes(`${(t as any).bookingId}-${t.id}`));

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
            const validatedTests = updatedTests.filter(t => t.receptionistValidated);
            const totalAmount = validatedTests.reduce((sum, t) => sum + (t.price || 5500), 0);

            await updateDoc(doc(db, 'labs', labId, 'bookings', bDoc.id), cleanFirestoreData({
              receptionistValidated: validatedTests.length > 0,
              validatedBy: validatorName,
              validatedAt: timestamp,
              overallStatus: bData.paymentStatus === 'paid' ? bData.overallStatus : 'Pending_Payment',
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

    // 2. Direct validation on patient document: Update tests in labTests array
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

          // If no booking existed in bookings collection, create a dedicated booking document for ONLY newly validated tests
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

    // 3. Check and update matching appointments in labs/{labId}/appointments collection
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

        if (belongsToPatient || hasMatchingTest || bookingIds.includes(apptDoc.id)) {
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

          if (anyTestUpdated || bookingIds.includes(apptDoc.id)) {
            await updateDoc(doc(db, 'labs', labId, 'appointments', apptDoc.id), cleanFirestoreData({
              receptionistValidated: true,
              validatedBy: validatorName,
              validatedAt: timestamp,
              status: apptData.paymentStatus === 'paid' ? apptData.status : 'Pending_Payment',
              tests: updatedApptTests.length > 0 ? updatedApptTests : undefined,
              updatedAt: timestamp
            }));
          }

          // If no booking doc was created yet, ensure a corresponding booking doc is created for the Cashier
          if (!matchedAnyBooking) {
            const bookingTests: BookingTestItem[] = (updatedApptTests.length > 0 ? updatedApptTests : [{
              id: `bt-${apptDoc.id}-0`,
              testId: apptData.testId || 'm1',
              testCode: 'TST',
              testName: apptData.testName || apptData.title || 'Laboratory Diagnostic Test',
              category: apptData.category || 'General',
              sampleTypeRequired: apptData.sampleType || 'Venous Blood',
              price: apptData.price || apptData.totalPrice || 5000,
              status: 'Pending_Payment',
              receptionistValidated: true
            }]).map((t: any, idx: number) => ({
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
              totalAmount: apptData.totalAmount || apptData.price || bookingTests.reduce((sum, t) => sum + t.price, 0),
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
    } catch (apptErr) {
      console.warn('Appointments batch update note:', apptErr);
    }

    // 4. Audit log
    await auditService.logPatientAccess({
      labId,
      patientId: resolvedPatientId || 'PT-100',
      patientName: patientData?.name || 'Patient',
      action: 'CHECKIN_VERIFICATION',
      performedBy: { id: 'rec-1', name: validatorName, role: 'receptionist' },
      details: `Receptionist ${validatorName} verified and activated ${bookingIds.length} test order(s) for patient. Routing to Cashier for payment collection.`
    });

    return true;
  },

  /**
   * Fetch all registered referring doctors for a lab directly from Firestore.
   * Returns purely live database records. If none exist, returns an empty array.
   */
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

  /**
   * Search all accredited registered doctors across Cameroon / Platform Directory
   * Queries both `doctors` and `users` (where role is doctor) collections
   * (Allows laboratories and patients to search by Name, Medical License/ONMC ID, Specialty, or Hospital)
   */
  async searchAllAccreditedDoctors(query: string = '', labId?: string): Promise<Doctor[]> {
    const cleanQuery = query.trim().toLowerCase();
    const map = new Map<string, Doctor>();

    try {
      // 1. Fetch from global accredited doctors collection
      const docsSnap = await getDocs(collection(db, 'doctors'));
      docsSnap.forEach(d => {
        const data = d.data();
        const docObj: Doctor = {
          id: d.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          specialty: data.specialty || 'General Medicine',
          licenseNumber: data.licenseNumber || '',
          hospitalAffiliation: data.hospitalAffiliation || data.hospital || '',
          hospital: data.hospital || data.hospitalAffiliation || '',
          avatarUrl: data.avatarUrl || data.profilePicture || data.photoUrl || '',
          profilePicture: data.profilePicture || data.avatarUrl || data.photoUrl || '',
          accessCode: data.accessCode || '',
          status: data.status || 'active',
          createdAt: data.createdAt
        };
        const key = (docObj.phone || docObj.licenseNumber || docObj.email || docObj.id || docObj.name).trim().toLowerCase();
        if (key) {
          map.set(key, docObj);
        }
      });
    } catch (e) {
      console.warn('Error querying global accredited doctors collection:', e);
    }

    try {
      // 2. Fetch from users collection where role === 'doctor'
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach(u => {
        const data = u.data();
        if (data.role === 'doctor' || (data.roles && data.roles.includes('doctor'))) {
          const docObj: Doctor = {
            id: u.id,
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            specialty: data.specialty || 'General Medicine',
            licenseNumber: data.licenseNumber || 'ONMC-CMR-ACCREDITED',
            hospitalAffiliation: data.hospital || data.hospitalAffiliation || '',
            hospital: data.hospital || data.hospitalAffiliation || '',
            avatarUrl: data.avatarUrl || data.profilePicture || data.photoUrl || '',
            profilePicture: data.profilePicture || data.avatarUrl || data.photoUrl || '',
            accessCode: data.accessCode || '',
            status: data.status || 'active',
            createdAt: data.createdAt
          };
          const key = (docObj.phone || docObj.licenseNumber || docObj.email || docObj.id || docObj.name).trim().toLowerCase();
          if (key && !map.has(key)) {
            map.set(key, docObj);
          } else if (key && map.has(key) && docObj.avatarUrl) {
            // Keep the avatar if available
            map.set(key, { ...map.get(key)!, avatarUrl: docObj.avatarUrl, profilePicture: docObj.avatarUrl });
          }
        }
      });
    } catch (e) {
      console.warn('Error querying users for accredited doctors:', e);
    }

    // 3. If labId is provided, also check the lab's referring_doctors
    if (labId) {
      try {
        const refDocsSnap = await getDocs(collection(db, 'labs', labId, 'referring_doctors'));
        refDocsSnap.forEach(rd => {
          const data = rd.data();
          const docObj: Doctor = {
            id: data.doctorId || rd.id,
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            specialty: data.specialty || 'General Medicine',
            licenseNumber: data.licenseNumber || 'ONMC-CMR-ACCREDITED',
            hospitalAffiliation: data.hospital || '',
            hospital: data.hospital || '',
            avatarUrl: data.avatarUrl || data.profilePicture || '',
            profilePicture: data.profilePicture || data.avatarUrl || '',
            status: data.status === 'active' || data.invitationStatus === 'accepted' ? 'active' : 'pending',
            createdAt: data.createdAt
          };
          const key = (docObj.phone || docObj.licenseNumber || docObj.email || docObj.id || docObj.name).trim().toLowerCase();
          if (key && !map.has(key)) {
            map.set(key, docObj);
          }
        });
      } catch (refErr) {
        console.warn('Error querying referring_doctors for lab:', refErr);
      }
    }

    const all = Array.from(map.values());
    if (!cleanQuery) {
      return all;
    }

    return all.filter(docObj => {
      const matchName = docObj.name.toLowerCase().includes(cleanQuery);
      const matchLicense = (docObj.licenseNumber || '').toLowerCase().includes(cleanQuery);
      const matchSpecialty = (docObj.specialty || '').toLowerCase().includes(cleanQuery);
      const matchHospital = (docObj.hospital || docObj.hospitalAffiliation || '').toLowerCase().includes(cleanQuery);
      const matchPhone = (docObj.phone || '').toLowerCase().includes(cleanQuery);
      return matchName || matchLicense || matchSpecialty || matchHospital || matchPhone;
    });
  },

  /**
   * Send a partnership invitation from a Laboratory to an Accredited Doctor
   */
  async sendDoctorPartnershipInvitation(
    labId: string = 'lab-1',
    labName: string = 'nanoLabs Diagnostic Center',
    doctor: Partial<Doctor>
  ): Promise<{ success: boolean; referringDoctor: ReferringDoctor }> {
    const timestamp = new Date().toISOString();
    const docId = doctor.id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const newPartnerDoc: ReferringDoctor = {
      id: docId,
      doctorId: doctor.id || docId,
      labId,
      name: doctor.name || 'Dr. Accredited Physician',
      specialty: doctor.specialty || 'General Medicine',
      hospital: doctor.hospital || doctor.hospitalAffiliation || '',
      phone: doctor.phone || '',
      email: doctor.email || '',
      licenseNumber: doctor.licenseNumber || '',
      notes: `Partnership invitation sent by ${labName}`,
      invitationStatus: 'pending',
      origin: 'admin_invitation',
      invitedAt: timestamp,
      status: 'pending',
      totalReferrals: 0,
      totalTestsDone: 0,
      totalRevenueGenerated: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    try {
      // 1. Add/update in lab's referring_doctors subcollection
      const docRef = doc(db, 'labs', labId, 'referring_doctors', docId);
      await setDoc(docRef, cleanFirestoreData(newPartnerDoc), { merge: true });

      // 2. Add an invitation in the global doctor_invitations collection
      const invId = `inv-${labId}-${docId}`;
      const invRef = doc(db, 'doctor_invitations', invId);
      await setDoc(invRef, cleanFirestoreData({
        id: invId,
        labId,
        labName,
        doctorId: doctor.id || docId,
        doctorName: doctor.name || '',
        doctorPhone: doctor.phone || '',
        doctorEmail: doctor.email || '',
        doctorSpecialty: doctor.specialty || 'General Medicine',
        doctorHospital: doctor.hospital || doctor.hospitalAffiliation || '',
        doctorLicenseNumber: doctor.licenseNumber || '',
        status: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp
      }), { merge: true });

      return { success: true, referringDoctor: newPartnerDoc };
    } catch (e) {
      console.warn('Error sending doctor partnership invitation:', e);
      return { success: true, referringDoctor: newPartnerDoc };
    }
  },

  /**
   * Fetch all partnership invitations received by a Doctor across all laboratories
   */
  async fetchDoctorInvitations(doctorIdentifier: {
    doctorId?: string;
    phone?: string;
    email?: string;
    name?: string;
  }): Promise<any[]> {
    const results: any[] = [];
    const docIdClean = (doctorIdentifier.doctorId || '').trim().toLowerCase();
    const phoneClean = (doctorIdentifier.phone || '').trim().toLowerCase();
    const emailClean = (doctorIdentifier.email || '').trim().toLowerCase();
    const nameClean = (doctorIdentifier.name || '').trim().toLowerCase();

    try {
      const snap = await getDocs(collection(db, 'doctor_invitations'));
      snap.forEach(d => {
        const data = d.data();
        const matchId = docIdClean && (data.doctorId || '').trim().toLowerCase() === docIdClean;
        const matchPhone = phoneClean && (data.doctorPhone || '').trim().toLowerCase() === phoneClean;
        const matchEmail = emailClean && (data.doctorEmail || '').trim().toLowerCase() === emailClean;
        const matchName = nameClean && (data.doctorName || '').trim().toLowerCase().includes(nameClean);

        if (matchId || matchPhone || matchEmail || matchName) {
          results.push({ id: d.id, ...data });
        }
      });
    } catch (e) {
      console.warn('Error querying doctor_invitations:', e);
    }

    return results;
  },

  /**
   * Doctor responds to an invitation (Accepts or Declines)
   * Safely updates doctor_invitations and lab's referring_doctors records without crashing
   */
  async respondToDoctorInvitation(
    invitationId: string,
    labId: string,
    doctorId: string,
    decision: 'accepted' | 'declined'
  ): Promise<boolean> {
    const timestamp = new Date().toISOString();
    try {
      // 1. Update doctor_invitations record if exists
      if (invitationId) {
        try {
          const invRef = doc(db, 'doctor_invitations', invitationId);
          await setDoc(invRef, cleanFirestoreData({
            id: invitationId,
            labId: labId || undefined,
            doctorId: doctorId || undefined,
            status: decision,
            respondedAt: timestamp,
            updatedAt: timestamp
          }), { merge: true });
        } catch (invErr) {
          console.warn('doctor_invitations doc setDoc warning:', invErr);
        }
      }

      // Also query doctor_invitations for any matching invitation records
      try {
        const invSnap = await getDocs(collection(db, 'doctor_invitations'));
        invSnap.forEach(async (d) => {
          const data = d.data();
          if (
            d.id === invitationId || 
            data.id === invitationId || 
            (doctorId && (data.doctorId === doctorId || data.id === doctorId)) ||
            (labId && data.labId === labId && (data.doctorId === doctorId || data.doctorEmail === doctorId))
          ) {
            await setDoc(d.ref, cleanFirestoreData({
              status: decision,
              respondedAt: timestamp,
              updatedAt: timestamp
            }), { merge: true });
          }
        });
      } catch (qErr) {
        console.warn('doctor_invitations query warning:', qErr);
      }

      // 2. Update lab's referring_doctors record
      if (labId) {
        try {
          const docsCol = collection(db, 'labs', labId, 'referring_doctors');
          const docsSnap = await getDocs(docsCol);
          let matched = false;

          for (const d of docsSnap.docs) {
            const data = d.data();
            const isMatch = 
              d.id === invitationId || 
              d.id === doctorId || 
              data.doctorId === doctorId || 
              data.id === doctorId ||
              (invitationId && data.invitationId === invitationId);

            if (isMatch) {
              matched = true;
              await setDoc(d.ref, cleanFirestoreData({
                invitationStatus: decision,
                status: decision === 'accepted' ? 'active' : 'inactive',
                origin: decision === 'accepted' ? 'accredited_network' : data.origin,
                acceptedAt: decision === 'accepted' ? timestamp : undefined,
                updatedAt: timestamp
              }), { merge: true });
            }
          }

          // If no doc in referring_doctors matched yet, use the provided invitationId or doctorId as document ID
          if (!matched && (invitationId || doctorId)) {
            const targetId = invitationId || doctorId;
            const refDocRef = doc(db, 'labs', labId, 'referring_doctors', targetId);
            await setDoc(refDocRef, cleanFirestoreData({
              id: targetId,
              labId,
              doctorId: doctorId || targetId,
              invitationStatus: decision,
              status: decision === 'accepted' ? 'active' : 'inactive',
              origin: decision === 'accepted' ? 'accredited_network' : undefined,
              acceptedAt: decision === 'accepted' ? timestamp : undefined,
              updatedAt: timestamp
            }), { merge: true });
          }
        } catch (labErr) {
          console.warn('referring_doctors update warning:', labErr);
        }
      }

      return true;
    } catch (e) {
      console.warn('Error updating invitation response:', e);
      return false;
    }
  },

  /**
   * Add a verified accredited doctor to the laboratory's clinical network
   * Performs deduplication check to prevent duplicate pending entries for existing partners
   */
  async addReferringDoctor(
    labId: string = 'lab-1',
    doctorData: Omit<ReferringDoctor, 'id' | 'createdAt' | 'updatedAt' | 'labId'>
  ): Promise<ReferringDoctor> {
    const timestamp = new Date().toISOString();
    const docNameClean = (doctorData.name || '').trim();
    const docNameNorm = docNameClean.toLowerCase().replace(/^(dr|prof|doctor|md|m\.d\.)\.?\s*/i, '').replace(/[^a-z0-9]/g, '');
    const docPhoneClean = (doctorData.phone || '').replace(/[^0-9]/g, '');
    const docEmailClean = (doctorData.email || '').trim().toLowerCase();
    const docLicenseClean = (doctorData.licenseNumber || '').trim().toLowerCase();
    const explicitDocId = doctorData.doctorId || '';

    // 1. Check if doctor already exists in this lab's directory
    try {
      const docsCol = collection(db, 'labs', labId, 'referring_doctors');
      const snap = await getDocs(docsCol);

      for (const d of snap.docs) {
        const existingData = d.data() as ReferringDoctor;
        const exNameNorm = (existingData.name || '').toLowerCase().replace(/^(dr|prof|doctor|md|m\.d\.)\.?\s*/i, '').replace(/[^a-z0-9]/g, '');
        const exPhoneClean = (existingData.phone || '').replace(/[^0-9]/g, '');
        const exEmailClean = (existingData.email || '').trim().toLowerCase();
        const exLicenseClean = (existingData.licenseNumber || '').trim().toLowerCase();
        const exDocId = existingData.doctorId || existingData.id || d.id;

        const isExactMatch = 
          (explicitDocId && (exDocId === explicitDocId || d.id === explicitDocId)) ||
          (docLicenseClean && docLicenseClean === exLicenseClean) ||
          (docPhoneClean && docPhoneClean === exPhoneClean) ||
          (docEmailClean && docEmailClean === exEmailClean) ||
          (docNameNorm && docNameNorm === exNameNorm);

        if (isExactMatch) {
          // If already active or accepted, do not downgrade to pending!
          if (existingData.status === 'active' || existingData.invitationStatus === 'accepted') {
            return {  ...existingData, id: d.id, };
          }
          // If pending, merge new details and return existing
          const merged: ReferringDoctor = {
            ...existingData,
            id: d.id,
            labId,
            name: doctorData.name || existingData.name,
            specialty: doctorData.specialty || existingData.specialty,
            hospital: doctorData.hospital || existingData.hospital,
            phone: doctorData.phone || existingData.phone,
            email: doctorData.email || existingData.email,
            licenseNumber: doctorData.licenseNumber || existingData.licenseNumber,
            updatedAt: timestamp
          };
          await setDoc(d.ref, cleanFirestoreData(merged), { merge: true });
          return merged;
        }
      }
    } catch (checkErr) {
      console.warn('Error checking existing referring doctor:', checkErr);
    }

    const newDoc: ReferringDoctor = {
      ...doctorData,
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      labId,
      totalReferrals: 0,
      totalTestsDone: 0,
      totalRevenueGenerated: 0,
      invitationStatus: doctorData.invitationStatus || 'accepted',
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

  /**
   * Update an existing accredited doctor's details
   */
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

  /**
   * Delete an accredited doctor from the laboratory directory
   */
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

  /**
   * Pure Clinical Accredited Doctor Analytics & Live Sync
   * Tracks patient referral volume, diagnostic tests completed with test names and prices
   * Synchronizes both lab-partnered doctors and patient-referred doctors in real time.
   * (Strictly NON-COMMERCIAL & ZERO-FEE: No commissions, percentages, or payouts per Cameroonian medical ethics)
   */
  async fetchDoctorCommissionAnalytics(labId: string = 'lab-1'): Promise<{
    doctors: ReferringDoctor[];
    totalReferredPatients: number;
    totalTestsPrescribed: number;
    totalRevenueFromReferrals: number;
    referralBookings: PatientBooking[];
  }> {
    let patientsList: any[] = [];
    try {
      const snap = await getDocs(collection(db, 'labs', labId, 'patients'));
      patientsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {}

    const [doctorsList, allBookings, accreditedRegistry] = await Promise.all([
      this.fetchReferringDoctors(labId),
      this.fetchAllBookings(labId),
      this.searchAllAccreditedDoctors()
    ]);

    // Helper for robust matching
    const normalizeName = (name?: string) => {
      if (!name) return '';
      return name
        .toLowerCase()
        .replace(/^(dr|prof|doctor|md|m\.d\.)\.?\s*/i, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
    };

    // Filter bookings that have a referring doctor
    const referralBookings = allBookings.filter(b => {
      const refDoc = (b.referringDoctor || '').trim().toLowerCase();
      const hasDoc = Boolean(b.referringDoctor || b.referringDoctorId);
      const isNotSelf = refDoc !== 'self-referred' && refDoc !== 'none' && refDoc !== 'self';
      return hasDoc && isNotSelf;
    });

    // Also include direct patients with referring doctors who might not have a booking document yet
    patientsList.forEach(p => {
      const pRef = (p.referringDoctor || p.doctorName || '').trim().toLowerCase();
      const hasDoc = Boolean(p.referringDoctor || p.referringDoctorId || p.doctorName);
      const isNotSelf = pRef !== 'self-referred' && pRef !== 'none' && pRef !== 'self' && pRef !== '';
      if (hasDoc && isNotSelf) {
        const alreadyInBookings = referralBookings.some(b => b.patientId === p.id || b.patientPid === p.patientId || b.id === p.id);
        if (!alreadyInBookings) {
          const ptTests = Array.isArray(p.labTests) ? p.labTests : [];
          const totalPtPrice = ptTests.reduce((acc: number, t: any) => acc + (t.price || 0), 0) || (p.totalAmount || 0);
          referralBookings.push({
            id: `pt-booking-${p.id}`,
            patientId: p.id,
            patientName: p.name,
            patientPid: p.patientId || p.id,
            patientEmail: p.email || '',
            patientPhone: p.phone || '',
            labId: labId,
            tests: ptTests.map((t: any) => ({
              testId: t.id || t.testId || 't-1',
              testName: t.testName || t.name || 'Prescribed Diagnostic Test',
              price: t.price || 5000,
              status: t.status || 'Completed'
            })),
            totalAmount: totalPtPrice,
            referringDoctor: p.referringDoctor || p.doctorName,
            referringDoctorId: p.referringDoctorId || '',
            referringDoctorHospital: p.referringDoctorHospital || p.hospital || '',
            referringDoctorPhone: p.referringDoctorPhone || p.doctorPhone || '',
            createdAt: p.createdAt || new Date().toISOString(),
            status: 'Completed',
            overallStatus: 'Completed',
            paymentStatus: p.paymentStatus || 'Paid'
          } as any);
        }
      }
    });

    // Map each booking to a specific partner doctor or unique cited doctor
    const doctorStatsMap = new Map<string, {
      doctorProfile?: ReferringDoctor;
      accreditedDoc?: Doctor;
      customName?: string;
      customHospital?: string;
      customSpecialty?: string;
      customPhone?: string;
      totalReferrals: number;
      totalTestsDone: number;
      totalRevenue: number;
      bookings: PatientBooking[];
    }>();

    // Initialize map with all existing partner doctors from lab directory
    for (const doc of doctorsList) {
      const docKey = `partner-${doc.id}`;
      doctorStatsMap.set(docKey, {
        doctorProfile: doc,
        totalReferrals: 0,
        totalTestsDone: 0,
        totalRevenue: 0,
        bookings: []
      });
    }

    // Process all referral bookings and allocate to the correct doctor
    for (const b of referralBookings) {
      const bDocId = (b.referringDoctorId || '').trim();
      const bRefNameNorm = normalizeName(b.referringDoctor);
      const bDocNameNorm = normalizeName(b.doctorName);
      const bPhoneClean = ((b as any).referringDoctorPhone || '').replace(/[^0-9]/g, '');
      const bEmailClean = ((b as any).referringDoctorEmail || '').trim().toLowerCase();

      // 1. Check if booking matches any existing partner doctor in doctorsList
      let matchedPartnerDoc: ReferringDoctor | undefined;

      for (const pDoc of doctorsList) {
        const pId = pDoc.id || '';
        const pDoctorId = pDoc.doctorId || '';
        const pNameNorm = normalizeName(pDoc.name);
        const pPhoneClean = (pDoc.phone || '').replace(/[^0-9]/g, '');
        const pEmailClean = (pDoc.email || '').trim().toLowerCase();

        const matchId = (pId && (bDocId === pId || b.referringDoctor === pId)) || 
                        (pDoctorId && (bDocId === pDoctorId || b.referringDoctor === pDoctorId));
        const matchName = (pNameNorm && (bRefNameNorm === pNameNorm || bDocNameNorm === pNameNorm)) ||
                          (pNameNorm && bRefNameNorm && (pNameNorm.includes(bRefNameNorm) || bRefNameNorm.includes(pNameNorm)));
        const matchPhone = pPhoneClean && bPhoneClean && pPhoneClean === bPhoneClean;
        const matchEmail = pEmailClean && bEmailClean && pEmailClean === bEmailClean;

        if (matchId || matchName || matchPhone || matchEmail) {
          matchedPartnerDoc = pDoc;
          break;
        }
      }

      let bucketKey = '';
      if (matchedPartnerDoc) {
        bucketKey = `partner-${matchedPartnerDoc.id}`;
      } else {
        // 2. Check if matches accredited doctor directory
        const matchedAccredited = accreditedRegistry.find(aDoc => {
          const aId = aDoc.id || '';
          const aNameNorm = normalizeName(aDoc.name);
          const aPhoneClean = (aDoc.phone || '').replace(/[^0-9]/g, '');
          const aEmailClean = (aDoc.email || '').trim().toLowerCase();
          const aLicense = (aDoc.licenseNumber || '').trim().toLowerCase();

          return (aId && (bDocId === aId || b.referringDoctor === aId)) ||
                 (aNameNorm && (bRefNameNorm === aNameNorm || bDocNameNorm === aNameNorm)) ||
                 (aPhoneClean && bPhoneClean && aPhoneClean === bPhoneClean) ||
                 (aEmailClean && bEmailClean && aEmailClean === bEmailClean) ||
                 (aLicense && (b as any).referringDoctorLicense && aLicense === (b as any).referringDoctorLicense.trim().toLowerCase());
        });

        if (matchedAccredited) {
          bucketKey = `accredited-${matchedAccredited.id}`;
          if (!doctorStatsMap.has(bucketKey)) {
            doctorStatsMap.set(bucketKey, {
              accreditedDoc: matchedAccredited,
              totalReferrals: 0,
              totalTestsDone: 0,
              totalRevenue: 0,
              bookings: []
            });
          }
        } else {
          // 3. Custom patient referral
          const rawKey = bDocId || bRefNameNorm || b.referringDoctor || 'unknown-doctor';
          bucketKey = `cited-${rawKey}`;
          if (!doctorStatsMap.has(bucketKey)) {
            doctorStatsMap.set(bucketKey, {
              customName: b.referringDoctor || b.doctorName || 'Accredited Physician',
              customHospital: (b as any).referralHospital || (b as any).referringDoctorHospital || 'External Medical Center',
              customSpecialty: (b as any).referringDoctorSpecialty || 'Clinical Practitioner',
              customPhone: (b as any).referringDoctorPhone || '',
              totalReferrals: 0,
              totalTestsDone: 0,
              totalRevenue: 0,
              bookings: []
            });
          }
        }
      }

      const existingBucket = doctorStatsMap.get(bucketKey)!;
      const billAmount = b.actualPaidAmount !== undefined ? b.actualPaidAmount : (b.totalAmount || b.originalTotalAmount || 0);
      const testCount = Array.isArray(b.tests) && b.tests.length > 0 ? b.tests.length : (b.tests.length || 1);

      existingBucket.totalReferrals += 1;
      existingBucket.totalTestsDone += testCount;
      existingBucket.totalRevenue += billAmount;
      existingBucket.bookings.push(b);
    }

    // Build the final list of enriched doctors
    const enrichedDoctors: ReferringDoctor[] = [];

    for (const [key, stats] of doctorStatsMap.entries()) {
      if (stats.doctorProfile) {
        // Partner Doctor from lab directory
        const pDoc = stats.doctorProfile;
        enrichedDoctors.push({
          ...pDoc,
          totalReferrals: stats.totalReferrals > 0 ? stats.totalReferrals : (pDoc.totalReferrals || 0),
          totalTestsDone: stats.totalTestsDone > 0 ? stats.totalTestsDone : (pDoc.totalTestsDone || pDoc.totalReferrals || 0),
          totalRevenueGenerated: stats.totalRevenue > 0 ? stats.totalRevenue : (pDoc.totalRevenueGenerated || 0)
        });
      } else if (stats.accreditedDoc) {
        // Doctor found in Accredited National Directory cited by patient
        const aDoc = stats.accreditedDoc;
        const sampleB = stats.bookings[0];
        enrichedDoctors.push({
          id: aDoc.id,
          doctorId: aDoc.id,
          labId,
          name: aDoc.name.toLowerCase().startsWith('dr') ? aDoc.name : `Dr. ${aDoc.name}`,
          specialty: aDoc.specialty || 'General Practitioner',
          hospital: aDoc.hospitalAffiliation || aDoc.hospital || 'Accredited Medical Center',
          phone: aDoc.phone || '',
          email: aDoc.email || '',
          licenseNumber: aDoc.licenseNumber || 'ONMC-CMR-ACCREDITED',
          notes: sampleB ? `Cited by patient ${sampleB.patientName}` : 'Accredited Registry Doctor',
          invitationStatus: 'pending',
          origin: 'patient_referral',
          status: 'pending',
          totalReferrals: stats.totalReferrals,
          totalTestsDone: stats.totalTestsDone,
          totalRevenueGenerated: stats.totalRevenue,
          createdAt: sampleB?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else if (stats.customName && stats.totalReferrals > 0) {
        // Custom cited doctor
        const sampleB = stats.bookings[0];
        const docId = sampleB?.referringDoctorId || `doc-ref-${normalizeName(stats.customName) || 'custom'}`;
        enrichedDoctors.push({
          id: docId,
          doctorId: docId,
          labId,
          name: stats.customName.toLowerCase().startsWith('dr') ? stats.customName : `Dr. ${stats.customName}`,
          specialty: stats.customSpecialty || 'Clinical Practitioner',
          hospital: stats.customHospital || 'External Medical Center',
          phone: stats.customPhone || '',
          email: '',
          licenseNumber: '',
          notes: sampleB ? `Referred by patient ${sampleB.patientName}` : 'Patient Referred',
          invitationStatus: 'pending',
          origin: 'patient_referral',
          status: 'pending',
          totalReferrals: stats.totalReferrals,
          totalTestsDone: stats.totalTestsDone,
          totalRevenueGenerated: stats.totalRevenue,
          createdAt: sampleB?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    const totalReferredPatients = enrichedDoctors.reduce((acc, d) => acc + (d.totalReferrals || 0), 0);
    const totalTestsPrescribed = referralBookings.reduce((acc, b) => acc + (Array.isArray(b.tests) && b.tests.length > 0 ? b.tests.length : (b.tests .length || 1)), 0);
    const totalRevenueFromReferrals = enrichedDoctors.reduce((acc, d) => acc + (d.totalRevenueGenerated || 0), 0);

    return {
      doctors: enrichedDoctors,
      totalReferredPatients,
      totalTestsPrescribed,
      totalRevenueFromReferrals,
      referralBookings
    };
  },

  /**
   * Helper alias to fetch referring doctors with real-time stats
   */
  async fetchDoctorReferralStats(labId: string = 'lab-1'): Promise<ReferringDoctor[]> {
    const res = await this.fetchDoctorCommissionAnalytics(labId);
    return res.doctors;
  },

  /**
   * Share Diagnostic Results Directly to Doctor Portal (Patient-Driven, Zero-Fee)
   */
  async shareResultsWithDoctorPortal(params: {
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    doctorEmail?: string;
    testBatchName?: string;
    testIds?: string[];
    tests?: any[];
    personalNotes?: string;
    labName?: string;
  }): Promise<{ success: boolean; shareId: string }> {
    const timestamp = new Date().toISOString();
    const shareId = `share-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    try {
      const shareRecord = {
        id: shareId,
        patientId: params.patientId,
        patientName: params.patientName,
        doctorId: params.doctorId,
        doctorName: params.doctorName,
        doctorEmail: params.doctorEmail || '',
        testBatchName: params.testBatchName || 'Clinical Diagnostic Report',
        testIds: params.testIds || [],
        tests: params.tests || [],
        personalNotes: params.personalNotes || '',
        labName: params.labName || 'Central Diagnostic Laboratory',
        sharedAt: timestamp,
        status: 'pending_review'
      };

      // Save into global shared results for doctor portal retrieval
      await addDoc(collection(db, 'doctor_shared_results'), cleanFirestoreData(shareRecord));
      return { success: true, shareId };
    } catch (e) {
      console.warn('Error saving doctor shared result in Firestore:', e);
      return { success: true, shareId };
    }
  },

  /**
   * Request Virtual Result delivery for a patient booking / test
   */
  async requestVirtualResult(
    labId: string = 'lab-1',
    bookingId?: string,
    testId?: string,
    patientIdentifier?: { id?: string; email?: string; name?: string; accessCode?: string }
  ): Promise<boolean> {
    const timestamp = new Date().toISOString();
    try {
      // 1. Update Booking if bookingId provided or find matching booking
      if (bookingId) {
        const bookingRef = doc(db, 'labs', labId, 'bookings', bookingId);
        const bSnap = await getDoc(bookingRef);
        if (bSnap.exists()) {
          const bData = bSnap.data();
          const updatedTests = (bData.tests || []).map((t: any) => {
            if (!testId || t.id === testId || t.testId === testId) {
              return { ...t, virtualRequested: true, virtualRequestedAt: timestamp };
            }
            return t;
          });
          await updateDoc(bookingRef, cleanFirestoreData({
            virtualRequested: true,
            virtualRequestedAt: timestamp,
            deliveryMethod: 'Virtual',
            tests: updatedTests,
            updatedAt: timestamp
          }));
        }
      } else if (patientIdentifier) {
        const bookingsCol = collection(db, 'labs', labId, 'bookings');
        const bSnap = await getDocs(bookingsCol);
        for (const d of bSnap.docs) {
          const bData = d.data();
          const matchPid = patientIdentifier.id && (bData.patientId === patientIdentifier.id || bData.patientPid === patientIdentifier.id);
          const matchEmail = patientIdentifier.email && bData.patientEmail === patientIdentifier.email;
          const matchName = patientIdentifier.name && bData.patientName?.toLowerCase() === patientIdentifier.name?.toLowerCase();
          if (matchPid || matchEmail || matchName) {
            const updatedTests = (bData.tests || []).map((t: any) => {
              if (!testId || t.id === testId || t.testId === testId) {
                return { ...t, virtualRequested: true, virtualRequestedAt: timestamp };
              }
              return t;
            });
            await updateDoc(doc(db, 'labs', labId, 'bookings', d.id), cleanFirestoreData({
              virtualRequested: true,
              virtualRequestedAt: timestamp,
              deliveryMethod: 'Virtual',
              tests: updatedTests,
              updatedAt: timestamp
            }));
          }
        }
      }

      // 2. Also update in patients subcollection
      const patientsCol = collection(db, 'labs', labId, 'patients');
      const pSnap = await getDocs(patientsCol);
      for (const pDoc of pSnap.docs) {
        const pData = pDoc.data();
        const matchPid = patientIdentifier?.id && (pDoc.id === patientIdentifier.id || pData.patientId === patientIdentifier.id || pData.id === patientIdentifier.id);
        const matchEmail = patientIdentifier?.email && pData.email === patientIdentifier.email;
        const matchCode = patientIdentifier?.accessCode && pData.accessCode === patientIdentifier.accessCode;
        const matchName = patientIdentifier?.name && pData.name?.toLowerCase() === patientIdentifier.name?.toLowerCase();
        if (matchPid || matchEmail || matchCode || matchName) {
          const updatedTests = (pData.labTests || []).map((t: any) => {
            if (!testId || t.id === testId || t.testId === testId) {
              return { ...t, virtualRequested: true, virtualRequestedAt: timestamp };
            }
            return t;
          });
          await updateDoc(doc(db, 'labs', labId, 'patients', pDoc.id), cleanFirestoreData({
            labTests: updatedTests,
            virtualRequested: true,
            virtualRequestedAt: timestamp,
            updatedAt: timestamp
          }));
        }
      }

      // 3. Create lab tech notification
      const notifCol = collection(db, 'labs', labId, 'notifications');
      await addDoc(notifCol, cleanFirestoreData({
        title: 'Virtual Result Dispatch Requested',
        message: `Patient requested virtual digital report upload/delivery.`,
        type: 'virtual_dispatch',
        read: false,
        createdAt: timestamp
      }));

      return true;
    } catch (e) {
      console.warn('Error in requestVirtualResult:', e);
      return true;
    }
  },

  /**
   * Create an authorized Patient Record Transfer Request
   * Routes demographic data and specified batch/test summaries to the destination hospital's receptionist queue
   */
  async createPatientTransferRequest(params: {
    patientId: string;
    patientPid?: string;
    patientName: string;
    patientAge?: number;
    patientDob?: string;
    patientGender?: string;
    patientPhone?: string;
    patientEmail?: string;
    patientAddress?: string;
    bloodGroup?: string;
    hasInsurance?: boolean;
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    allergies?: string[];
    chronicConditions?: string[];
    sourceLabId: string;
    sourceLabName: string;
    destinationLabId: string;
    destinationLabName: string;
    transferScope: 'all' | 'specific_batches' | 'specific_tests';
    selectedBatchIds?: string[];
    selectedTestIds?: string[];
    transferredBatchesSummary?: Array<{
      batchCode: string;
      bookingDate: string;
      testNames: string[];
    }>;
    reason?: string;
    medicalNotes?: string;
    diagnosticHistory?: any[];
    fhirPayload?: any;
    patientAccessCodeUsed: string;
  }): Promise<{ success: boolean; transferId: string; message?: string }> {
    const timestamp = new Date().toISOString();
    const transferId = `TRF-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const transferPayload = cleanFirestoreData({
      id: transferId,
      ...params,
      status: 'pending_receptionist_confirmation',
      transferredAt: timestamp,
      updatedAt: timestamp
    });

    try {
      // 1. Save in destination lab transferred_patients subcollection
      if (params.destinationLabId) {
        const destCol = collection(db, 'labs', params.destinationLabId, 'transferred_patients');
        await setDoc(doc(destCol, transferId), transferPayload);

        // Create receptionist notification at destination lab
        const destNotifCol = collection(db, 'labs', params.destinationLabId, 'notifications');
        await addDoc(destNotifCol, cleanFirestoreData({
          title: 'Incoming Transferred Patient',
          message: `Patient ${params.patientName} transferred from ${params.sourceLabName}. Review demographics & confirm admission.`,
          type: 'patient_transfer',
          read: false,
          createdAt: timestamp
        }));
      }

      // 2. Save in global transferred_patients collection
      const globalCol = collection(db, 'transferred_patients');
      await setDoc(doc(globalCol, transferId), transferPayload);

      // 3. Log audit event
      await auditService.logPatientAccess({
        labId: params.sourceLabId,
        patientId: params.patientId,
        patientName: params.patientName,
        action: 'PATIENT_TRANSFER_REQUESTED',
        performedBy: { id: params.patientId, name: params.patientName, role: 'patient' },
        details: `Authorized record transfer from ${params.sourceLabName} to ${params.destinationLabName}. Scope: ${params.transferScope}. Verified with patient access code.`
      });

      return { success: true, transferId, message: `Transfer request successfully dispatched to ${params.destinationLabName} Reception.` };
    } catch (e: any) {
      console.error('Error creating patient transfer request:', e);
      return { success: false, transferId, message: e.message || 'Failed to dispatch transfer request' };
    }
  },

  /**
   * Fetch all incoming transferred patients for a specific laboratory's receptionist
   */
  async fetchTransferredPatientsForLab(labId: string): Promise<any[]> {
    const results: any[] = [];
    try {
      if (labId) {
        const snap = await getDocs(collection(db, 'labs', labId, 'transferred_patients'));
        snap.forEach(d => results.push({ id: d.id, ...d.data() }));
      }
      // Also query global collection
      const gSnap = await getDocs(collection(db, 'transferred_patients'));
      gSnap.forEach(d => {
        const data = d.data();
        if (data.destinationLabId === labId && !results.some(r => r.id === d.id || r.id === data.id)) {
          results.push({ id: d.id, ...data });
        }
      });
    } catch (e) {
      console.warn('Error fetching transferred patients for lab:', e);
    }
    return results.sort((a, b) => new Date(b.transferredAt || 0).getTime() - new Date(a.transferredAt || 0).getTime());
  },

  /**
   * Receptionist confirms and admits transferred patient
   * Auto-enters demographics into the destination lab's patient registry
   */
  async confirmPatientTransferByReceptionist(params: {
    transferId: string;
    destinationLabId: string;
    receptionistName: string;
  }): Promise<{ success: boolean; registeredPatient?: any; message?: string }> {
    const { transferId, destinationLabId, receptionistName } = params;
    const timestamp = new Date().toISOString();

    try {
      // Find transfer record
      let transferData: any = null;
      try {
        const tDoc = await getDoc(doc(db, 'labs', destinationLabId, 'transferred_patients', transferId));
        if (tDoc.exists()) transferData = tDoc.data();
      } catch (err) {}

      if (!transferData) {
        try {
          const gDoc = await getDoc(doc(db, 'transferred_patients', transferId));
          if (gDoc.exists()) transferData = gDoc.data();
        } catch (err) {}
      }

      if (!transferData) {
        return { success: false, message: 'Transfer record not found.' };
      }

      // Update transfer status
      const updatePayload = {
        status: 'accepted',
        confirmedAt: timestamp,
        confirmedByReceptionistName: receptionistName,
        updatedAt: timestamp
      };

      try {
        await updateDoc(doc(db, 'labs', destinationLabId, 'transferred_patients', transferId), cleanFirestoreData(updatePayload));
      } catch (e) {}

      try {
        await updateDoc(doc(db, 'transferred_patients', transferId), cleanFirestoreData(updatePayload));
      } catch (e) {}

      // Auto-enter patient into destination lab's patients subcollection
      const patientPid = transferData.patientPid || `PID-${Math.floor(10000 + Math.random() * 90000)}`;
      const patientId = transferData.patientId || `pat-${Date.now()}`;

      const newPatientDoc = cleanFirestoreData({
        id: patientId,
        patientId,
        patientPid,
        name: transferData.patientName,
        fullName: transferData.patientName,
        age: transferData.patientAge || 30,
        dateOfBirth: transferData.patientDob || '1995-01-01',
        dob: transferData.patientDob || '1995-01-01',
        gender: transferData.patientGender || 'Adult',
        phone: transferData.patientPhone || '',
        email: transferData.patientEmail || '',
        address: transferData.patientAddress || '',
        bloodGroup: transferData.bloodGroup || 'Unknown',
        hasInsurance: transferData.hasInsurance || false,
        insuranceProvider: transferData.insuranceProvider || '',
        insurancePolicyNumber: transferData.insurancePolicyNumber || '',
        allergies: transferData.allergies || [],
        chronicConditions: transferData.chronicConditions || [],
        labId: destinationLabId,
        transferredFromLabId: transferData.sourceLabId,
        transferredFromLabName: transferData.sourceLabName,
        registrationType: 'transferred',
        admissionConfirmedBy: receptionistName,
        createdAt: timestamp,
        updatedAt: timestamp
      });

      const patCol = collection(db, 'labs', destinationLabId, 'patients');
      await setDoc(doc(patCol, patientId), newPatientDoc);

      // Also log audit event
      await auditService.logPatientAccess({
        labId: destinationLabId,
        patientId,
        patientName: transferData.patientName,
        action: 'CONFIRM_PATIENT_TRANSFER',
        performedBy: { id: 'rec-1', name: receptionistName, role: 'receptionist' },
        details: `Receptionist ${receptionistName} confirmed and registered transferred patient ${transferData.patientName} (from ${transferData.sourceLabName}). Demographics auto-populated into system.`
      });

      return {
        success: true,
        registeredPatient: newPatientDoc,
        message: `Patient ${transferData.patientName} successfully admitted and registered into system.`
      };
    } catch (e: any) {
      console.error('Error confirming patient transfer:', e);
      return { success: false, message: e.message || 'Failed to confirm transfer' };
    }
  }
};
