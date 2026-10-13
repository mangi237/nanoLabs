import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Printer,
  ChevronRight,
  User,
  DollarSign,
  Truck,
  Microscope,
  TestTube,
  ShieldCheck,
  Package,
  Shield,
  Layers,
  ArrowRight,
  Info,
  HelpCircle,
  FileText,
  Clock,
  Sparkles,
  Download,
  Share2,
  Award,
  Check,
  RefreshCw,
  X,
  Stethoscope,
  Filter
} from 'lucide-react';
// import labStaffTrainingImg from '../../assets/images/lab_staff_training_1791662450172.jpg';
// import cashierBillingImg from '../../assets/images/cashier_billing_flow_1791662463889.jpg';
// import biologistValidationImg from '../../assets/images/biologist_validation_1791662476698.jpg';
// import analyzerMachineImg from '../../assets/images/medical_laboratory_analyzer_1789043842712.jpg';
// import phlebotomyDrawingImg from '../../assets/images/phlebotomist_specimen_collection_1789043859023.jpg';
// import labDirectorImg from '../../assets/images/lab_director_hero_1786368225928.jpg';

export interface TrainingLesson {
  id: string;
  chapterId: string;
  chapterTitle: string;
  role: 'all' | 'receptionist' | 'cashier' | 'phlebotomist' | 'lab_tech' | 'biologist' | 'inventory_manager' | 'admin' | 'doctor';
  roleBadge: string;
  roleBadgeColor: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  featuredImage?: string;
  steps: {
    number: number;
    title: string;
    description: string;
    uiCallout?: {
      buttonName: string;
      location: string;
      badgeText?: string;
    };
    tip?: string;
    warning?: string;
  }[];
  keyTakeaways: string[];
  faq: { q: string; a: string }[];
}

export const TRAINING_LESSONS: TrainingLesson[] = [
  // -------------------------------------------------------------
  // CHAPTER 1: SYSTEM OVERVIEW
  // -------------------------------------------------------------
  {
    id: 'lesson-sys-overview',
    chapterId: 'ch1',
    chapterTitle: 'Chapter 1: nanoLabs LIMS Architecture & Quality Standards',
    role: 'all',
    roleBadge: 'All Staff & Admins',
    roleBadgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    title: 'The 5-Step Clinical Chain of Custody (ISO 15189 Compliant)',
    summary: 'Understand the end-to-end journey of a patient sample: from front-desk reception, to cashier settlement, barcoded collection, analytical testing, and mandatory biological validation.',
    estimatedMinutes: 5,
    featuredImage:  '',
    steps: [
      {
        number: 1,
        title: 'Step 1: Patient Intake at Reception Desk',
        description: 'Patient arrives as a walk-in or appointment holder. Reception registers demographics, validates telephone number, records doctor referral (or selects Self-Referred), and selects prescribed tests from the Master Catalog.',
        uiCallout: {
          buttonName: '+ Register Walk-In Patient',
          location: 'Top right of Reception Desk view',
          badgeText: 'Reception Console'
        }
      },
      {
        number: 2,
        title: 'Step 2: Settlement & Add-Ons at Cashier Desk',
        description: 'Unpaid orders arrive in real time on the Cashier queue. Cashier opens the modern 2-column modal, adds any billable consumables or acts using code (e.g., KB10 for home sampling) and custom pricing, and collects payment via Cash, Mobile Money, or Insurance.',
        uiCallout: {
          buttonName: 'Collect Payment',
          location: 'Patient billing queue card',
          badgeText: 'Cashier Console'
        }
      },
      {
        number: 3,
        title: 'Step 3: Sample Collection & Barcode Labeling in Phlebotomy',
        description: 'Once payment is cleared, the patient appears immediately on the Phlebotomy workbench. The phlebotomist draws blood or collects fluids in color-coded tubes, prints barcode labels, and dispatches them to the testing benches.',
        uiCallout: {
          buttonName: 'Print Tube Barcodes',
          location: 'Phlebotomy specimen card',
          badgeText: 'Phlebotomy Console'
        }
      },
      {
        number: 4,
        title: 'Step 4: Bench Analysis & Reagent Logging by Lab Technologist',
        description: 'Lab Technologist conducts biochemical/hematological analysis using machines or benches, enters measured values, logs reagent lots/quantities consumed, and inputs tech PIN to submit results to the Biologist. TECHNOLOGISTS CANNOT PRINT OFFICIAL REPORTS WITHOUT BIOLOGIST VALIDATION.',
        uiCallout: {
          buttonName: 'Submit to Biologist (Enter PIN)',
          location: 'Analytical worksheet footer',
          badgeText: 'Lab Tech Console'
        },
        warning: 'Printing is strictly blocked until the Clinical Biologist signs off. This prevents unverified reports from being distributed.'
      },
      {
        number: 5,
        title: 'Step 5: Biological Validation & Official Release by Biologist',
        description: 'The Clinical Biologist reviews all parameter values against medical reference ranges, inspects quality controls, enters clinical comments, inputs their authorized Biologist Passcode, and signs. This releases the report to the patient portal and UNLOCKS official A4 printing for staff.',
        uiCallout: {
          buttonName: 'Sign & Release to Patient Portal',
          location: 'Biologist review modal',
          badgeText: 'Biologist Console'
        }
      }
    ],
    keyTakeaways: [
      'Every test follows an unbreakable chain: Reception -> Cashier -> Phlebotomy -> Lab Tech -> Biologist.',
      'No sample can be collected without cashier payment clearance or validated insurance authorization.',
      'Official physical test reports can NEVER be printed before the Clinical Biologist electronically validates and stamps the document.'
    ],
    faq: [
      {
        q: 'Why can laboratory staff switch roles on the sidebar?',
        a: 'In medium and smaller facilities, staff members frequently perform multi-desk tasks (e.g. Receptionist also operating as Cashier). Role switching allows seamless coordination while maintaining individual audit trails.'
      }
    ]
  },

  // -------------------------------------------------------------
  // CHAPTER 2: RECEPTION DESK
  // -------------------------------------------------------------
  {
    id: 'lesson-reception-intake',
    chapterId: 'ch2',
    chapterTitle: 'Chapter 2: Reception Desk Operations',
    role: 'receptionist',
    roleBadge: 'Receptionist Desk',
    roleBadgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    title: 'Registering Walk-Ins, Selecting Tests & Proper Doctor Referral Formatting',
    summary: 'Master the patient intake workflow: generating patient codes, selecting tests from the catalog, and ensuring self-referrals never mistakenly display the facility name.',
    estimatedMinutes: 6,
    featuredImage: '',
    steps: [
      {
        number: 1,
        title: 'Open Intake Modal',
        description: 'On the Reception Desk console, click "+ Register Walk-In Patient" in the upper right. This opens the comprehensive intake form.',
        uiCallout: {
          buttonName: '+ Register Walk-In Patient',
          location: 'Header bar of Reception view',
          badgeText: 'Quick Action'
        }
      },
      {
        number: 2,
        title: 'Enter Patient Demographics',
        description: 'Fill in Full Name, Age, Gender, and active Phone number. The system verifies if this patient has previous records and automatically links their Patient ID (PID) to maintain lifelong health history.',
        tip: 'Entering the correct phone number is crucial because patients receive their instant Booking Code and electronic report alerts via SMS.'
      },
      {
        number: 3,
        title: 'Handling Referring Doctors vs. Self-Referrals (Crucial Rule)',
        description: 'Under "Attending / Referring Doctor": If a doctor prescribed the test, select their name or enter "Dr. [Name]". If the patient walked in on their own, leave it selected as "Self-Referred / General Outpatient".',
        uiCallout: {
          buttonName: 'Select Referring Doctor',
          location: 'Medical referral field',
          badgeText: 'Auto-Formatting'
        },
        warning: 'NEVER type your laboratory name or hospital name (e.g. Balm of Gilead) into the referring doctor box! The system will automatically format self-referrals as "Self-Referred / Walk-in" on all receipts and official test reports.'
      },
      {
        number: 4,
        title: 'Select Prescribed Tests from Master Catalog',
        description: 'Use the quick search to find tests (e.g., NFS, Widal, Glycémie, Bilan Lipidique, Créatinine, Paludisme). Check the boxes for all requested tests. The total price in FCFA recalculates dynamically.',
        uiCallout: {
          buttonName: 'Catalog Search Bar',
          location: 'Test selection grid',
          badgeText: '400+ Tests'
        }
      },
      {
        number: 5,
        title: 'Dispatch Order to Cashier',
        description: 'Click "Submit Test Order". The system instantly generates a 6-digit Booking Code (e.g. BK-1042) and forwards the invoice to the Cashier queue for immediate collection.'
      }
    ],
    keyTakeaways: [
      'Self-referrals must always be registered as "Self-Referred / Walk-in" so that the receipt and lab report reflect accurate clinical origins.',
      'Test catalog search supports both French and English medical terminologies.',
      'Dispatched orders notify the cashier instantly without physical paperwork.'
    ],
    faq: [
      {
        q: 'What if a patient is covered by corporate health insurance?',
        a: 'Select their insurance provider (Ascoma, Gras Savoye, AXA, Saham) and input their policy number. The system adjusts the patient payable share.'
      }
    ]
  },

  // -------------------------------------------------------------
  // CHAPTER 3: CASHIER & INVOICING
  // -------------------------------------------------------------
  {
    id: 'lesson-cashier-billing',
    chapterId: 'ch3',
    chapterTitle: 'Chapter 3: Cashier & Financial Billing Counter',
    role: 'cashier',
    roleBadge: 'Cashier & Billing',
    roleBadgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    title: 'Settling Orders, Adding Medical Acts with Code (e.g. kb10) & Cashier PIN Authorization',
    summary: 'Step-by-step cashier training: operating the 2-column light modal, adding custom medical consumables with code and price, cash change computation, and official stamped receipts.',
    estimatedMinutes: 7,
    featuredImage: '',
    steps: [
      {
        number: 1,
        title: 'Locate Patient on the Unpaid Billing Queue',
        description: 'On the Cashier queue, click "Collect Payment" on the patient card. This launches the balanced 2-column light modal.',
        uiCallout: {
          buttonName: 'Collect Payment',
          location: 'Patient billing card',
          badgeText: 'Light Theme Modal'
        }
      },
      {
        number: 2,
        title: 'Add Extra Medical Acts & Consumables with Code & Price',
        description: 'If the patient incurred extra fees (such as home nurse transport, special vacutainer tubes, or disposable kits), locate the "Add Extra Medical Acts & Consumables" section in the left column. Enter the Act Code (e.g. "kb10"), Description (e.g. "Prélèvement Domicile"), and Price in XAF, then click "+ Add".',
        uiCallout: {
          buttonName: 'Code: [kb10] + Add',
          location: 'Left column of Payment Modal',
          badgeText: 'Custom Add-Ons'
        },
        tip: 'You can also click the quick preset chips: "KB10 Prélèvement domicile (+2,000 XAF)", "KB5 Ponction veineuse (+1,000 XAF)", or "Tube Vacutainer (+500 XAF)".'
      },
      {
        number: 3,
        title: 'Select Payment Channel',
        description: 'Choose the payment method from the right column: Cash, MTN Mobile Money, Orange Money, Bank Transfer, Insurance Co-Pay, or Staff Welfare (100% Free).',
        uiCallout: {
          buttonName: 'Payment Method Buttons',
          location: 'Right column top grid',
          badgeText: 'Multi-Channel'
        }
      },
      {
        number: 4,
        title: 'Automatic Cash Change Calculator',
        description: 'When Cash is selected, enter the bill amount received from the patient (e.g. 20,000 XAF). The system automatically calculates and highlights the exact change to return (e.g. Return Change: 6,500 XAF).',
        tip: 'This prevents math errors and expedites queue turnover during morning rush hours.'
      },
      {
        number: 5,
        title: 'Enter Cashier Security PIN & Stamp Receipt',
        description: 'Enter your authorized cashier PIN (e.g. CSH123) and click "Confirm & Stamp Payment". This stamps the financial ledger, unlocks sample collection in Phlebotomy, and opens the official A4/thermal receipt.',
        uiCallout: {
          buttonName: 'Confirm & Stamp Payment ✓',
          location: 'Bottom right action button',
          badgeText: 'Security PIN'
        }
      }
    ],
    keyTakeaways: [
      'Cashier modal uses a non-intimidating light theme with 2 balanced columns: items on the left, payment and PIN on the right.',
      'Custom add-ons require both code (e.g. kb10) and price for transparent auditing.',
      'Confirming payment unlocks the patient on the Phlebotomy queue immediately.'
    ],
    faq: [
      {
        q: 'What is the default Cashier PIN for training?',
        a: 'The standard training code is CSH123. Lab administrators can configure custom PINs in Staff Management.'
      }
    ]
  },

  // -------------------------------------------------------------
  // CHAPTER 4: PHLEBOTOMY & SAMPLING
  // -------------------------------------------------------------
  {
    id: 'lesson-phlebotomy-dispatch',
    chapterId: 'ch4',
    chapterTitle: 'Chapter 4: Phlebotomy, Tube Selection & Barcoding',
    role: 'phlebotomist',
    roleBadge: 'Phlebotomy Desk',
    roleBadgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    title: 'Specimen Collection Protocols, Vacutainer Tube Colors & Bench Dispatch',
    summary: 'Ensure 100% sample integrity by following color-coded vacutainer standards, printing barcoded labels, and dispatching tubes to analytical benches.',
    estimatedMinutes: 5,
    featuredImage: '',
    steps: [
      {
        number: 1,
        title: 'Identify Paid Patient on Phlebotomy Queue',
        description: 'Only patients who have cleared payment appear on the Phlebotomy queue. Tap the patient card to view required tube types.',
        uiCallout: {
          buttonName: 'Patient Card',
          location: 'Phlebotomy list',
          badgeText: 'Payment Cleared'
        }
      },
      {
        number: 2,
        title: 'Select Correct Vacutainer Tube Color',
        description: 'Match prescribed tests with standard tube caps: Purple EDTA for Hematology/NFS; Red/Gold Gel for Biochemistry & Serology; Grey Fluoride for Glucose/Glycémie; Blue Citrate for Coagulation/TP-INR.',
        tip: 'Inverting tubes gently 5-8 times prevents micro-clots in EDTA samples.'
      },
      {
        number: 3,
        title: 'Print & Affix Barcoded Identification Labels',
        description: 'Click "Print Tube Barcodes". Stick the unique barcode label horizontally on each tube to ensure complete chain of custody.',
        uiCallout: {
          buttonName: 'Print Tube Barcodes',
          location: 'Specimen drawer',
          badgeText: 'Barcode Trace'
        }
      },
      {
        number: 4,
        title: 'Dispatch Specimens to Testing Benches',
        description: 'Click "Dispatch Sample to Laboratory". The booking moves to "In_Lab_Testing" status and appears instantaneously on the Lab Technologist console.',
        uiCallout: {
          buttonName: 'Dispatch Sample to Lab',
          location: 'Action footer',
          badgeText: 'Bench Routing'
        }
      }
    ],
    keyTakeaways: [
      'Never collect samples from an unpaid order without supervisor override.',
      'Barcodes must be affixed before the patient leaves the drawing chair.',
      'Dispatched samples notify bench technicians in real time.'
    ],
    faq: [
      {
        q: 'How are home collection requests handled?',
        a: 'Home requests display a vehicle icon with patient address. Phlebotomist logs collection timestamp upon returning to the lab.'
      }
    ]
  },

  // -------------------------------------------------------------
  // CHAPTER 5: LAB TECHNOLOGIST & REAGENTS
  // -------------------------------------------------------------
  {
    id: 'lesson-labtech-reagents',
    chapterId: 'ch5',
    chapterTitle: 'Chapter 5: Analytical Testing & Biologist Confirmation Rule',
    role: 'lab_tech',
    roleBadge: 'Lab Technologist',
    roleBadgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    title: 'Entering Test Findings, Reagent Logging & Why Techs CANNOT Print Before Biologist Confirms',
    summary: 'Detailed bench guide: entering biochemical parameters, recording reagent consumption using the card grid, entering tech PIN, and why reports are locked until biological sign-off.',
    estimatedMinutes: 8,
    featuredImage: '',
    steps: [
      {
        number: 1,
        title: 'Open Patient Analytical Worksheet',
        description: 'From the Lab Tech queue, click on the patient order to open their test workspace. Select a test from the left booklet column.',
        uiCallout: {
          buttonName: 'Patient Order Card',
          location: 'Testing queue',
          badgeText: 'A4 Worksheet'
        }
      },
      {
        number: 2,
        title: 'Enter Measured Values & Check Reference Ranges',
        description: 'Input parameter results (e.g. Hemoglobin, White Blood Cells, Platelets). The system flags abnormal values in High (red) or Low (amber) automatically against standard medical ranges.',
        tip: 'You can also switch to the "Analyzer Diagnostic Output" tab to import data directly from automated analyzers (Mindray, Sysmex, Cobas).'
      },
      {
        number: 3,
        title: 'The Biologist Confirmation Rule (Printing Lock)',
        description: 'If you click "Preview / Print Sheet" or "Preview PDF" before biological validation, printing is locked with the message: "Wait for Biologist to Confirm — Lab Tech cannot print without Biologist confirmation".',
        uiCallout: {
          buttonName: 'Print Button (Locked)',
          location: 'Top toolbar',
          badgeText: 'Security Lock'
        },
        warning: 'This is an ISO 15189 compliance requirement: official medical reports cannot be released to patients without a Clinical Biologist reviewing and validating the results.'
      },
      {
        number: 4,
        title: 'Enter Technician Code & Select Reagents (Card Display)',
        description: 'When you are done testing, the Biologist submission modal prompts you: Enter your technician code (e.g. TEC123). You will see a card display of all in-stock unexpired reagents with a search bar.',
        uiCallout: {
          buttonName: 'Search Reagents Cards',
          location: 'Biologist submission modal',
          badgeText: 'Card Grid'
        },
        tip: 'You can search reagents, click "+ Select", and adjust quantities used (- / +). Or you can select a reagent without quantity, or click "Continue Anyway (No Reagents)" if none were consumed.'
      },
      {
        number: 5,
        title: 'Dispatch to Biologist for Validation',
        description: 'Click "Submit to Biologist". The report is electronically dispatched to the Biologist Console. Once the Biologist confirms and signs, printing is automatically unlocked for all staff!',
        uiCallout: {
          buttonName: 'Submit to Biologist',
          location: 'Modal action button',
          badgeText: 'Biologist Queue'
        }
      }
    ],
    keyTakeaways: [
      'Lab Technicians cannot print official test reports until the Clinical Biologist approves them.',
      'Reagent logging allows automatic deduction from lab stock, preventing stockouts.',
      'Technicians can submit with reagents, without quantities, or continue without extra reagents.'
    ],
    faq: [
      {
        q: 'What is the default Technician PIN for testing?',
        a: 'The standard test code is TEC123. Any 4+ character staff PIN is accepted.'
      }
    ]
  },

  // -------------------------------------------------------------
  // CHAPTER 6: BIOLOGIST VALIDATION
  // -------------------------------------------------------------
  {
    id: 'lesson-biologist-signing',
    chapterId: 'ch6',
    chapterTitle: 'Chapter 6: Clinical Biologist Validation & Report Release',
    role: 'biologist',
    roleBadge: 'Biologist Desk',
    roleBadgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    title: 'Reviewing Findings, Electronic Signing & Unlocking Official Physical Printing',
    summary: 'Clinical Biologist guide: inspecting biochemical values, appending specialist remarks, electronic passcode signing, and releasing official reports to patients and printers.',
    estimatedMinutes: 6,
    featuredImage: '',
    steps: [
      {
        number: 1,
        title: 'Access Biologist Validation Console',
        description: 'Switch to the "Biologist Validation" tab on the sidebar. In the "Pending Biologist Sign-Off" queue, all tests submitted by technicians appear ready for review.',
        uiCallout: {
          buttonName: 'Biologist Validation Tab',
          location: 'Sidebar navigation',
          badgeText: 'Validation Desk'
        }
      },
      {
        number: 2,
        title: 'Inspect Analytical Values & Technician Notes',
        description: 'Verify measured numbers, review highlighted abnormal flags, inspect technician identity, and review reagents logged.',
        tip: 'Biological plausibility checks: compare current findings with patient past history if available.'
      },
      {
        number: 3,
        title: 'Append Clinical Interpretation Notes',
        description: 'Add specialist remarks, diagnostic hypotheses, or recommendations for the referring doctor directly in the interpretation field.'
      },
      {
        number: 4,
        title: 'Authorize, Sign & Confirm for Printing',
        description: 'Click "Sign & Release to Patient Portal". Enter authorized Biologist Passcode (e.g. BIO123) and confirm.',
        uiCallout: {
          buttonName: 'Authorize & Sign Report ✓',
          location: 'Review modal footer',
          badgeText: 'Electronic Seal'
        }
      },
      {
        number: 5,
        title: 'Official Printing Unlocked',
        description: 'Once confirmed, two things happen immediately: (1) The patient can view their signed report on their phone; (2) The Lab Tech and Receptionist can now print official physical A4 reports with watermark and QR verification.'
      }
    ],
    keyTakeaways: [
      'Biologist validation is the final regulatory seal of clinical accuracy.',
      'Electronically signing unlocks printing across the entire facility simultaneously.',
      'Reports contain QR verification codes allowing doctors and border authorities to verify authenticity.'
    ],
    faq: [
      {
        q: 'What is the default Biologist Passcode for testing?',
        a: 'The standard test passcode is BIO123.'
      }
    ]
  },

  // -------------------------------------------------------------
  // CHAPTER 7: INVENTORY & STOCK
  // -------------------------------------------------------------
  {
    id: 'lesson-inventory-lots',
    chapterId: 'ch7',
    chapterTitle: 'Chapter 7: Reagent Inventory & Lot Expiry Tracking',
    role: 'inventory_manager',
    roleBadge: 'Inventory Desk',
    roleBadgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    title: 'Managing Reagent Lots, Setting Safety Thresholds & Consumption Auditing',
    summary: 'Maintain zero stockouts: register supplier shipments, track lot numbers and expiry dates, set low stock threshold alerts, and audit consumption.',
    estimatedMinutes: 5,
    featuredImage: '',
    steps: [
      {
        number: 1,
        title: 'Open Inventory Desk',
        description: 'Click "Inventory Desk" on the sidebar. View real-time stock levels, expiring reagents, and critical stockout alerts.',
        uiCallout: {
          buttonName: 'Inventory Desk',
          location: 'Sidebar navigation',
          badgeText: 'Stock Hub'
        }
      },
      {
        number: 2,
        title: 'Add New Reagent Batch / Lot',
        description: 'Click "+ Add Reagent / Consumable". Enter Reagent Name, Manufacturer, Lot Number, Expiry Date, Quantity Received, and Minimum Alert Threshold.',
        uiCallout: {
          buttonName: '+ Add Reagent',
          location: 'Top toolbar',
          badgeText: 'New Stock'
        }
      },
      {
        number: 3,
        title: 'Automated Deductions vs. Manual Adjustments',
        description: 'Reagents are automatically deducted when Lab Technologists log them during test completion. Manual adjustments can be made for calibration or quality control runs.',
        tip: 'Items reaching 10% of their threshold trigger amber alert badges on the dashboard.'
      }
    ],
    keyTakeaways: [
      'Expired reagents are automatically hidden from the Lab Tech selection grid to prevent erroneous use.',
      'Real-time inventory levels update on every completed test.'
    ],
    faq: [
      {
        q: 'Can we export inventory stock sheets?',
        a: 'Yes, click "Export Stock CSV" to download inventory balances for accounting.'
      }
    ]
  },

  // -------------------------------------------------------------
  // CHAPTER 8: LAB ADMINISTRATION
  // -------------------------------------------------------------
  {
    id: 'lesson-admin-management',
    chapterId: 'ch8',
    chapterTitle: 'Chapter 8: Laboratory Administration & Master Catalog',
    role: 'admin',
    roleBadge: 'Lab Administrator',
    roleBadgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    title: 'Managing Staff PINs, Test Catalog Pricing in FCFA & Financial Audits',
    summary: 'Administrative controls: creating staff accounts, assigning roles, updating master pricing in FCFA, and viewing daily cashier reconciliations.',
    estimatedMinutes: 7,
    featuredImage: '',
    steps: [
      {
        number: 1,
        title: 'Staff Management & Role Assignments',
        description: 'From Admin Dashboard, open Staff Management. Add laboratory staff, assign roles (Receptionist, Cashier, Phlebotomist, Tech, Biologist), and assign authorization PINs.',
        uiCallout: {
          buttonName: 'Staff Management',
          location: 'Admin dashboard card',
          badgeText: 'Security'
        }
      },
      {
        number: 2,
        title: 'Update Master Test Catalog Pricing',
        description: 'Access the Master Test Catalog to configure test prices in FCFA, turnaround times, and sample tube requirements for your laboratory.',
        uiCallout: {
          buttonName: 'Master Catalog',
          location: 'Admin navigation',
          badgeText: 'FCFA Pricing'
        }
      },
      {
        number: 3,
        title: 'Daily Cashier Financial Reconciliation',
        description: 'Inspect total revenue collected by payment channel (Cash, MTN MoMo, Orange Money, Insurance). Verify physical drawer balances against system receipts.',
        tip: 'End-of-day reports can be printed or exported directly for laboratory accounting.'
      }
    ],
    keyTakeaways: [
      'Administrators control facility-wide PIN authorizations and staff credentials.',
      'Pricing updates reflect immediately across Reception and Cashier desks.'
    ],
    faq: [
      {
        q: 'Can an administrator override a test in emergency cases?',
        a: 'Yes, administrators have supervisor override credentials to bypass bottlenecks in urgent emergency cases.'
      }
    ]
  }
];

interface StaffTrainingBookletPageProps {
  onBack?: () => void;
  onNavigateDesk?: (role: string) => void;
}

export const StaffTrainingBookletPage: React.FC<StaffTrainingBookletPageProps> = ({
  onBack,
  onNavigateDesk
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [activeLessonId, setActiveLessonId] = useState<string>(TRAINING_LESSONS[0].id);
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});

  // Filter lessons based on search and role
  const filteredLessons = useMemo(() => {
    return TRAINING_LESSONS.filter(lesson => {
      const matchesRole = selectedRole === 'all' || lesson.role === selectedRole || lesson.role === 'all';
      const q = searchTerm.toLowerCase().trim();
      if (!q) return matchesRole;

      const matchesSearch = 
        lesson.title.toLowerCase().includes(q) ||
        lesson.summary.toLowerCase().includes(q) ||
        lesson.chapterTitle.toLowerCase().includes(q) ||
        lesson.steps.some(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || (s.uiCallout?.buttonName && s.uiCallout.buttonName.toLowerCase().includes(q))) ||
        lesson.faq.some(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));

      return matchesRole && matchesSearch;
    });
  }, [searchTerm, selectedRole]);

  // Active Lesson
  const activeLesson = useMemo(() => {
    return TRAINING_LESSONS.find(l => l.id === activeLessonId) || filteredLessons[0] || TRAINING_LESSONS[0];
  }, [activeLessonId, filteredLessons]);

  const toggleLessonComplete = (lessonId: string) => {
    setCompletedLessons(prev => ({
      ...prev,
      [lessonId]: !prev[lessonId]
    }));
  };

  const completedCount = Object.values(completedLessons).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / TRAINING_LESSONS.length) * 100);

  const handlePrintBooklet = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* ======================================================== */}
      {/* TOP ACADEMY HEADER                                      */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer text-xs font-bold"
                title="Return to Dashboard"
              >
                ← Back
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl bg-teal-700 text-white flex items-center justify-center font-black shadow-sm">
              <BookOpen className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  nanoLabs Staff Academy & Operating Manual
                </h1>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200 uppercase tracking-wider">
                  Official Booklet
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Comprehensive training handbook & SOP documentation for all laboratory staff and administrators.
              </p>
            </div>
          </div>

          {/* Quick Actions & Print */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold">
              <Award className="w-4 h-4 text-teal-600" />
              <span>Training Progress: {completedCount}/{TRAINING_LESSONS.length} ({progressPercent}%)</span>
            </div>

            <button
              type="button"
              onClick={handlePrintBooklet}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Print Physical Training Booklet (A4)"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print Booklet</span>
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* HERO BANNER - SAVE TRANSPORT & TRAIN ANYTIME            */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white px-4 sm:px-8 py-6 shadow-md border-b border-teal-800/40">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 text-[11px] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Digital Self-Training • Zero Need for Physical On-Site Travel</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Master Every Laboratory Desk with Illustrated Step-by-Step SOPs
            </h2>
            <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed font-normal">
              Each staff member can learn their exact responsibilities: Receptionist registration, Cashier billing with codes (e.g. KB10), Phlebotomy barcoding, Lab Tech analytical entries with reagents, and Biologist biological validation.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 text-center">
              <span className="block text-lg font-black text-white">8</span>
              <span className="text-[10px] text-teal-200 font-bold uppercase tracking-wider">Chapters</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 text-center">
              <span className="block text-lg font-black text-white">35+</span>
              <span className="text-[10px] text-teal-200 font-bold uppercase tracking-wider">SOP Steps</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 text-center">
              <span className="block text-lg font-black text-white">100%</span>
              <span className="text-[10px] text-teal-200 font-bold uppercase tracking-wider">ISO 15189</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-2xl border border-white/10 text-center">
              <span className="block text-lg font-black text-white">0 FCFA</span>
              <span className="text-[10px] text-teal-200 font-bold uppercase tracking-wider">Travel Cost</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SEARCH & ROLE FILTER BAR                                */}
      {/* ======================================================== */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 sticky top-[61px] z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Universal Search Input */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search any function (e.g. 'kb10', 'reagent', 'biologist confirm', 'cash change', 'print')..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Role Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Desks' },
              { id: 'receptionist', label: 'Receptionist' },
              { id: 'cashier', label: 'Cashier' },
              { id: 'phlebotomist', label: 'Phlebotomist' },
              { id: 'lab_tech', label: 'Lab Tech' },
              { id: 'biologist', label: 'Biologist' },
              { id: 'inventory_manager', label: 'Inventory' },
              { id: 'admin', label: 'Admin' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedRole(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  selectedRole === tab.id
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN TWO-COLUMN CONTENT: TABLE OF CONTENTS & LESSON VIEW */}
      {/* ======================================================== */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ------------------------------------------------------ */}
          {/* LEFT COLUMN: TABLE OF CONTENTS & LESSON SELECTOR       */}
          {/* ------------------------------------------------------ */}
          <aside className="lg:col-span-4 space-y-4">
            
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-600" />
                  Table of Contents
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {filteredLessons.length} Topics
                </span>
              </div>

              {filteredLessons.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <span>No lessons match your search query. Try another keyword.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[72vh] overflow-y-auto pr-1">
                  {filteredLessons.map((lesson) => {
                    const isSelected = lesson.id === activeLesson.id;
                    const isDone = completedLessons[lesson.id];

                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onClick={() => {
                          setActiveLessonId(lesson.id);
                          window.scrollTo({ top: 220, behavior: 'smooth' });
                        }}
                        className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-teal-50/90 border-teal-300 ring-2 ring-teal-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-teal-600' : 'border-slate-300'}`} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded border ${lesson.roleBadgeColor}`}>
                              {lesson.roleBadge}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {lesson.estimatedMinutes} min
                            </span>
                          </div>
                          <h3 className={`text-xs font-bold leading-tight line-clamp-2 ${isSelected ? 'text-teal-950 font-black' : 'text-slate-800'}`}>
                            {lesson.title}
                          </h3>
                        </div>

                        <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-teal-600 translate-x-0.5' : 'text-slate-300'}`} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Interactive Knowledge Check Widget */}
            <div className="bg-gradient-to-br from-indigo-50 to-teal-50 rounded-3xl border border-indigo-100 p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-extrabold text-indigo-950">Quick Staff Certification Check</h4>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Remember: <strong>Can a laboratory technologist print official reports before biological sign-off?</strong>
              </p>
              <div className="p-2.5 bg-white rounded-xl border border-indigo-100 text-[11px] text-slate-700 font-medium">
                <span className="font-bold text-rose-700">Strictly NO:</span> The system locks printing with a security prompt until the Clinical Biologist inputs their passcode and signs the analytical report.
              </div>
            </div>

          </aside>

          {/* ------------------------------------------------------ */}
          {/* RIGHT COLUMN: ACTIVE LESSON FULL OPERATING DOCUMENT     */}
          {/* ------------------------------------------------------ */}
          <article className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            
            {/* Lesson Title Header */}
            <div className="space-y-3 pb-5 border-b border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${activeLesson.roleBadgeColor}`}>
                    {activeLesson.roleBadge}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {activeLesson.estimatedMinutes} minutes study time
                  </span>
                </div>

                {/* Mark as Completed Button */}
                <button
                  type="button"
                  onClick={() => toggleLessonComplete(activeLesson.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                    completedLessons[activeLesson.id]
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{completedLessons[activeLesson.id] ? 'Completed ✓' : 'Mark as Learned'}</span>
                </button>
              </div>

              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 block mb-1">
                  {activeLesson.chapterTitle}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {activeLesson.title}
                </h2>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-normal bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                {activeLesson.summary}
              </p>
            </div>

            {/* Featured Visual Image with Clinical Caption */}
            {activeLesson.featuredImage && (
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative group">
                <img
                  src={activeLesson.featuredImage}
                  alt={activeLesson.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-56 sm:h-72 object-cover object-center group-hover:scale-101 transition-transform duration-300"
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-4 text-white">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-teal-300 font-bold block">
                    Operating Standard Visual
                  </span>
                  <span className="text-xs font-semibold text-slate-100">
                    Live laboratory desk configuration for {activeLesson.roleBadge}
                  </span>
                </div>
              </div>
            )}

            {/* Step-by-Step Numbered Instructions */}
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                Step-by-Step Operating Procedures (Numbered SOPs)
              </h3>

              <div className="space-y-4">
                {activeLesson.steps.map((step) => (
                  <div
                    key={step.number}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all space-y-2.5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-teal-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                        {step.number}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-extrabold text-slate-900 leading-tight">
                          {step.title}
                        </h4>
                        <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed mt-1 font-normal">
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* UI Callout Badge */}
                    {step.uiCallout && (
                      <div className="ml-10 p-2.5 rounded-xl bg-white border border-teal-200 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                            {step.uiCallout.buttonName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {step.uiCallout.location}
                          </span>
                        </div>
                        {step.uiCallout.badgeText && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {step.uiCallout.badgeText}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Warning Callout */}
                    {step.warning && (
                      <div className="ml-10 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span className="font-medium leading-relaxed">{step.warning}</span>
                      </div>
                    )}

                    {/* Tip Callout */}
                    {step.tip && (
                      <div className="ml-10 p-2.5 rounded-xl bg-teal-50/70 border border-teal-200 text-teal-900 text-xs flex items-start gap-2">
                        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span className="font-medium leading-relaxed">{step.tip}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Key Takeaways Section */}
            <div className="p-4 sm:p-5 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-teal-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700" />
                Key Quality Control Rules to Remember
              </h4>
              <ul className="space-y-1.5">
                {activeLesson.keyTakeaways.map((item, idx) => (
                  <li key={idx} className="text-xs text-teal-950 font-medium flex items-start gap-2">
                    <span className="text-teal-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* FAQs */}
            {activeLesson.faq && activeLesson.faq.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Frequently Asked Questions (Troubleshooting)
                </h4>
                <div className="space-y-2">
                  {activeLesson.faq.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <span className="font-extrabold text-slate-800 block">Q: {item.q}</span>
                      <span className="text-slate-600 block font-normal leading-relaxed">A: {item.a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Navigation: Next Lesson & Jump to Live Desk */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              {onNavigateDesk && activeLesson.role !== 'all' ? (
                <button
                  type="button"
                  onClick={() => onNavigateDesk(activeLesson.role)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <span>Open Live {activeLesson.roleBadge} Desk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : <div />}

              <button
                type="button"
                onClick={() => {
                  const currIdx = filteredLessons.findIndex(l => l.id === activeLesson.id);
                  if (currIdx >= 0 && currIdx < filteredLessons.length - 1) {
                    setActiveLessonId(filteredLessons[currIdx + 1].id);
                    window.scrollTo({ top: 220, behavior: 'smooth' });
                  }
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Next Lesson</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </article>
        </div>
      </main>

      {/* ======================================================== */}
      {/* BOTTOM ACTION BAR                                        */}
      {/* ======================================================== */}
      <footer className="bg-white border-t border-slate-200 px-4 sm:px-8 py-4 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span className="font-semibold text-slate-700">nanoLabs LIMS Clinical Accreditation System</span>
            <span>•</span>
            <span>Version 2026 Standard Operational Manual</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrintBooklet}
              className="text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
            >
              Print Complete Manual (PDF)
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default StaffTrainingBookletPage;
