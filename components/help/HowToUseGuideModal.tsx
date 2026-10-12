import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Search,
  X,
  User,
  Building2,
  Stethoscope,
  ChevronRight,
  CheckCircle2,
  DollarSign,
  TestTube,
  Truck,
  ShieldCheck,
  Printer,
  Sparkles,
  Lock,
  ArrowRight,
  HelpCircle,
  FileText,
  Calendar,
  MessageSquare,
  Package,
  Layers,
  Camera,
  Coins,
  Smartphone,
  ShieldAlert,
  Info,
  ChevronDown,
  KeyRound,
  AlertTriangle,
  Clock,
  RefreshCw,
  Bot,
  Send,
  Tag,
  Users,
  Award,
  Sliders,
  Check,
  ExternalLink
} from 'lucide-react';

export type GuideCategory = 'all' | 'patients' | 'laboratories' | 'doctors';

export interface GuideStep {
  stepNumber: number;
  title: string;
  instruction: string;
  tip?: string;
  uiPreview?: {
    element: string;
    description: string;
    badge?: string;
    color?: string;
  };
}

export interface ButtonGuideItem {
  id: string;
  role: string;
  buttonLabel: string;
  iconName: string;
  buttonColor: string; // tailwind classes
  location: string;
  actionSummary: string;
  requirements?: string;
  relatedArticleId: string;
}

export interface GuideArticle {
  id: string;
  category: 'patients' | 'laboratories' | 'doctors';
  roleName?: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  icon: any;
  overview: string;
  buttonsOnThisScreen?: {
    name: string;
    color: string;
    whatItDoes: string;
  }[];
  steps: GuideStep[];
  faq: { q: string; a: string }[];
}

// -----------------------------------------------------------------------------
// ALL BUTTONS DIRECTORY (Every button in nanoLabs explained with function & rules)
// -----------------------------------------------------------------------------
export const SYSTEM_BUTTONS_DIRECTORY: ButtonGuideItem[] = [
  // Receptionist Buttons
  {
    id: 'btn-register-patient',
    role: 'Reception Desk',
    buttonLabel: '+ Register Walk-In Patient',
    iconName: 'User',
    buttonColor: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    location: 'Reception Console → Top Header Action Bar',
    actionSummary: 'Opens the patient demographic intake modal to record Full Name, Age, Gender, Phone, and select Referring Doctor or Walk-In.',
    requirements: 'Patient Phone & Name are mandatory to generate unique PID.',
    relatedArticleId: 'lab-reception'
  },
  {
    id: 'btn-submit-order',
    role: 'Reception Desk',
    buttonLabel: 'Submit Test Order & Dispatch to Cashier',
    iconName: 'Send',
    buttonColor: 'bg-teal-600 text-white hover:bg-teal-700',
    location: 'Patient Registration Modal → Bottom Right',
    actionSummary: 'Locks selected clinical tests, generates booking invoice code (e.g. BK-2041), and routes the order directly to Cashier queue.',
    requirements: 'At least 1 test must be checked.',
    relatedArticleId: 'lab-reception'
  },
  {
    id: 'btn-print-routing-slip',
    role: 'Reception Desk',
    buttonLabel: 'Print Routing Slip / Booking Barcode',
    iconName: 'Printer',
    buttonColor: 'bg-slate-800 text-white hover:bg-slate-900',
    location: 'Reception Queue → Patient Action Menu',
    actionSummary: 'Prints physical intake voucher with patient QR code and booking number to hand to patient before heading to Cashier.',
    relatedArticleId: 'lab-reception-queue'
  },

  // Cashier Buttons
  {
    id: 'btn-collect-payment',
    role: 'Cashier & Billing',
    buttonLabel: 'Collect Payment 💳',
    iconName: 'DollarSign',
    buttonColor: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    location: 'Cashier Queue → On each unpaid patient card',
    actionSummary: 'Opens the light-theme 2-column payment settlement modal showing ordered tests, custom acts, payment methods, and PIN verification.',
    requirements: 'Patient must have an unpaid or partially paid order.',
    relatedArticleId: 'lab-cashier'
  },
  {
    id: 'btn-add-act',
    role: 'Cashier & Billing',
    buttonLabel: '+ Add Act (Code & Price)',
    iconName: 'Tag',
    buttonColor: 'bg-emerald-700 text-white hover:bg-emerald-800',
    location: 'Confirm Payment Modal → Left Column under Consumables',
    actionSummary: 'Manually appends an extra billable medical act with custom Code (e.g., kb10), custom Description, and custom Price in XAF.',
    requirements: 'Code and Price in XAF are required. Preset chips like KB10 can also be clicked.',
    relatedArticleId: 'lab-cashier'
  },
  {
    id: 'btn-confirm-payment',
    role: 'Cashier & Billing',
    buttonLabel: 'Confirm & Stamp Payment ✓',
    iconName: 'CheckCircle2',
    buttonColor: 'bg-emerald-600 text-white hover:bg-emerald-700 font-bold',
    location: 'Confirm Payment Modal → Bottom Right Column',
    actionSummary: 'Validates Cashier PIN (CSH123), finalizes the financial transaction, generates the stamped receipt, and moves patient to Phlebotomy.',
    requirements: 'Requires entering authorized Cashier PIN (e.g. CSH123).',
    relatedArticleId: 'lab-cashier'
  },
  {
    id: 'btn-print-receipt',
    role: 'Cashier & Billing',
    buttonLabel: 'Print Official Stamped Receipt 🧾',
    iconName: 'Printer',
    buttonColor: 'bg-slate-700 text-white hover:bg-slate-800',
    location: 'Cashier Modal / Receipts Ledger → Top Actions',
    actionSummary: 'Prints high-resolution thermal or A4 official receipt bearing lab accreditation, cashier stamp, and line-item breakdown.',
    relatedArticleId: 'lab-cashier'
  },

  // Phlebotomy Buttons
  {
    id: 'btn-print-tube-barcodes',
    role: 'Phlebotomy Desk',
    buttonLabel: 'Print Tube Barcodes 🏷️',
    iconName: 'Printer',
    buttonColor: 'bg-indigo-600 text-white hover:bg-indigo-700',
    location: 'Phlebotomy Queue → On selected paid patient card',
    actionSummary: 'Generates and prints waterproof barcode stickers corresponding to the exact tube types required (EDTA Purple, Serum Red, etc.).',
    requirements: 'Order must be confirmed paid by Cashier.',
    relatedArticleId: 'lab-phlebotomy'
  },
  {
    id: 'btn-dispatch-sample',
    role: 'Phlebotomy Desk',
    buttonLabel: 'Dispatch Sample to Laboratory 🚚',
    iconName: 'Truck',
    buttonColor: 'bg-emerald-600 text-white hover:bg-emerald-700',
    location: 'Phlebotomy Queue → Action Bar',
    actionSummary: 'Confirms successful sample draw, records phlebotomist timestamp, and immediately moves specimen to Lab Tech testing benches.',
    requirements: 'Barcodes must be affixed to tubes.',
    relatedArticleId: 'lab-phlebotomy-dispatch'
  },

  // Lab Tech Buttons
  {
    id: 'btn-tech-test-booklet',
    role: 'Lab Technologist',
    buttonLabel: 'Open Patient Test Booklet 📖',
    iconName: 'TestTube',
    buttonColor: 'bg-cyan-600 text-white hover:bg-cyan-700',
    location: 'Lab Tech Workspace → Queue selection',
    actionSummary: 'Opens analytical input grid for all tests requested for the patient, showing standard reference ranges and previous patient history.',
    relatedArticleId: 'lab-technologist'
  },
  {
    id: 'btn-tech-locked-print',
    role: 'Lab Technologist',
    buttonLabel: 'Print Sheet (Wait for Biologist 🔒)',
    iconName: 'Lock',
    buttonColor: 'bg-amber-100 text-amber-800 border border-amber-300 cursor-not-allowed',
    location: 'Lab Tech Workspace → Top Right',
    actionSummary: 'STRICT SECURITY LOCK: Displays alert: "Wait for Biologist to Confirm — Lab Tech cannot print without Biologist confirmation". Guarantees biological quality validation.',
    requirements: 'Unlocked ONLY after Clinical Biologist signs the report.',
    relatedArticleId: 'lab-tech-lock'
  },
  {
    id: 'btn-submit-to-biologist',
    role: 'Lab Technologist',
    buttonLabel: 'Submit to Biologist for Validation 🧪',
    iconName: 'ShieldCheck',
    buttonColor: 'bg-teal-600 text-white hover:bg-teal-700 font-bold',
    location: 'Lab Tech Test Entry → Bottom Action Bar',
    actionSummary: 'Opens reagent consumption modal with card search, allows deducting unexpired reagents, verifies tech code, and dispatches to Biologist.',
    requirements: 'Requires entering technician authentication code.',
    relatedArticleId: 'lab-tech-reagents'
  },

  // Clinical Biologist Buttons
  {
    id: 'btn-biologist-sign',
    role: 'Clinical Biologist',
    buttonLabel: 'Authorize, Sign & Confirm for Printing ✓',
    iconName: 'Award',
    buttonColor: 'bg-emerald-600 text-white hover:bg-emerald-700 font-extrabold shadow-md',
    location: 'Biologist Validation Tab → Bottom Review Bar',
    actionSummary: 'Officially applies digital signature seal, releases report to Patient Portal, and automatically unlocks physical A4 printing for all staff.',
    requirements: 'Requires Biologist Security Passcode (e.g. BIO123).',
    relatedArticleId: 'lab-biologist-sign'
  },
  {
    id: 'btn-biologist-comment',
    role: 'Clinical Biologist',
    buttonLabel: '+ Add Specialist Clinical Note',
    iconName: 'FileText',
    buttonColor: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300',
    location: 'Biologist Review Console → Below findings table',
    actionSummary: 'Inserts diagnostic interpretations, antibiogram guidance, or follow-up recommendations to appear on the official signed report.',
    relatedArticleId: 'lab-biologist'
  },

  // Lab Administrator Buttons
  {
    id: 'btn-admin-invite-staff',
    role: 'Lab Administrator',
    buttonLabel: '+ Invite New Staff Member',
    iconName: 'Users',
    buttonColor: 'bg-violet-600 text-white hover:bg-violet-700',
    location: 'Staff & Roles Management → Top Right Action',
    actionSummary: 'Opens user provisioning modal to configure Full Name, Email, Role (Reception, Cashier, Phlebotomy, Lab Tech, Biologist) and temporary OTP.',
    relatedArticleId: 'admin-staff'
  },
  {
    id: 'btn-admin-update-price',
    role: 'Lab Administrator',
    buttonLabel: 'Edit Catalog Test Price (FCFA) ⚙️',
    iconName: 'DollarSign',
    buttonColor: 'bg-slate-100 hover:bg-slate-200 text-slate-800',
    location: 'Test Catalog & Pricing → Test item row',
    actionSummary: 'Updates official patient price in XAF, turnaround time target in hours, and specimen tube requirements.',
    relatedArticleId: 'admin-catalog'
  },
  {
    id: 'btn-admin-restock-reagent',
    role: 'Lab Administrator',
    buttonLabel: '+ Log Reagent Delivery / Restock',
    iconName: 'Package',
    buttonColor: 'bg-teal-600 text-white hover:bg-teal-700',
    location: 'Reagents & Inventory → Top Header',
    actionSummary: 'Increments reagent stock levels, sets lot numbers, records expiration dates, and updates low-stock safety alert thresholds.',
    relatedArticleId: 'admin-reagents'
  },

  // Doctor Buttons
  {
    id: 'btn-doctor-rx',
    role: 'Partner Doctor',
    buttonLabel: 'Issue Digital Prescription (Rx) 💊',
    iconName: 'Stethoscope',
    buttonColor: 'bg-purple-600 text-white hover:bg-purple-700 font-bold',
    location: 'Doctor-Patient Chat Hub → Action Toolbar',
    actionSummary: 'Generates standardized digital prescription with medication dosages, durations, advice, and the accredited doctor’s digital stamp.',
    relatedArticleId: 'doc-chat-rx'
  },
  {
    id: 'btn-doctor-view-report',
    role: 'Partner Doctor',
    buttonLabel: 'View High-Res A4 Lab Report 📄',
    iconName: 'FileText',
    buttonColor: 'bg-slate-800 text-white hover:bg-slate-900',
    location: 'Referred Patients List → Actions',
    actionSummary: 'Opens full multi-parameter clinical diagnostic sheet complete with normal reference curves and clinical biologist sign-off.',
    relatedArticleId: 'doc-orders-results'
  },

  // Patient Buttons
  {
    id: 'btn-patient-book',
    role: 'Patient (B2C)',
    buttonLabel: 'Book Test +',
    iconName: 'Calendar',
    buttonColor: 'bg-emerald-600 text-white hover:bg-emerald-700 font-bold',
    location: 'Patient Home Catalog → On any test card',
    actionSummary: 'Opens appointment scheduling to choose Clinic Walk-In or Home Phlebotomy Visit and pick preferred time slot.',
    relatedArticleId: 'pat-book-test'
  },
  {
    id: 'btn-patient-download-a4',
    role: 'Patient (B2C)',
    buttonLabel: 'Download Signed A4 Report (PDF) 📄',
    iconName: 'Printer',
    buttonColor: 'bg-teal-600 text-white hover:bg-teal-700',
    location: 'Patient Tests Tab → On completed order',
    actionSummary: 'Downloads official PDF with QR authenticity verification, Biologist stamp, and complete biochemical panels.',
    requirements: 'Visible only when status is Completed (Biologist signed).',
    relatedArticleId: 'pat-view-results'
  }
];

// -----------------------------------------------------------------------------
// COMPREHENSIVE HOW-TO-USE ARTICLES (All roles, tabs, functions, and rules)
// -----------------------------------------------------------------------------
export const HOW_TO_USE_ARTICLES: GuideArticle[] = [
  // =========================================================================
  // CATEGORY 1: FOR LABORATORIES (B2B STAFF ROLES)
  // =========================================================================

  // Role: Receptionist (Step 1)
  {
    id: 'lab-reception',
    category: 'laboratories',
    roleName: 'Receptionist Desk (Step 1)',
    title: 'How to Register Walk-In Patients & Order Clinical Tests',
    subtitle: 'Step 1 front-desk workflow: demographics, selecting referring doctors vs self-referral, and test ordering.',
    badge: 'Front Desk Intake',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    icon: User,
    overview: 'Reception is the entry gate for all lab patients. Staff record patient identity, specify the prescribing doctor (or keep walk-in self-referral), and check requested diagnostic tests. Orders immediately route to the Cashier queue.',
    buttonsOnThisScreen: [
      { name: '[+ Register Walk-In Patient]', color: 'bg-emerald-600 text-white', whatItDoes: 'Opens clean demographic intake modal (Name, Phone, Age, Gender).' },
      { name: '[Select Referring Doctor]', color: 'bg-slate-100 border text-slate-800', whatItDoes: 'Selects the attending doctor or retains Self-Referred.' },
      { name: '[Submit Test Order & Dispatch]', color: 'bg-teal-600 text-white', whatItDoes: 'Creates booking code and transmits order to Cashier for payment.' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Click "+ Register Walk-In Patient"',
        instruction: 'At the top of the Reception Desk console, tap the green "+ Register Walk-In Patient" button to open the quick intake form.',
        uiPreview: {
          element: 'Button: [+ Register Walk-In Patient]',
          description: 'Top header green action button.',
          badge: 'Quick Action',
          color: 'emerald'
        }
      },
      {
        stepNumber: 2,
        title: 'Enter Patient Demographics & Phone Number',
        instruction: 'Fill in Full Name, Age, Gender, and Phone number. A unique Patient ID (e.g. PID-9042) is generated automatically to prevent duplicate medical files.',
        tip: 'Ensure the mobile phone is accurate so the patient can receive SMS report download links.'
      },
      {
        stepNumber: 3,
        title: 'Select Referring Doctor (Strict Attribution Rule)',
        instruction: 'In the "Referring Doctor" dropdown, pick the clinician who prescribed the tests. If the patient came on their own, select "Self-Referred / Walk-in".',
        uiPreview: {
          element: 'Dropdown: [Referring Doctor: Dr. Kamdem Pierre / Clinique du Centre]',
          description: 'Attributes test order to accredited doctor or walk-in.',
          badge: 'Doctor Attribution'
        },
        tip: 'CRITICAL RULE: NEVER select the laboratory or hospital name as the referring doctor! Self-referrals will cleanly print as "Self-Referred / Walk-in" on all official reports.'
      },
      {
        stepNumber: 4,
        title: 'Check Prescribed Tests from Master Catalog',
        instruction: 'Search and check all requested analyses (e.g., NFS, Glycémie, Bilan Rénal, Paludisme). Prices in FCFA update automatically.',
        uiPreview: {
          element: 'Catalog Search: [Type "NFS" or "Glycemie"] → Checkbox [✓]',
          description: 'Live test picker showing official catalog price in FCFA.',
          badge: 'Catalog Search'
        }
      },
      {
        stepNumber: 5,
        title: 'Submit Order to Cashier',
        instruction: 'Click "Submit Test Order & Dispatch to Cashier". The booking moves to "Unpaid" status and instantly appears on the Cashier’s desk.'
      }
    ],
    faq: [
      {
        q: 'What if a patient is covered by health insurance?',
        a: 'Select the insurance provider (Ascoma, AXA, Gras Savoye) in the dropdown and enter their policy number. The system automatically computes their co-pay share.'
      },
      {
        q: 'Can I edit patient information after creating the order?',
        a: 'Yes. In the reception patient table, click the patient card to edit their phone number, age, or notes at any time.'
      }
    ]
  },

  {
    id: 'lab-reception-queue',
    category: 'laboratories',
    roleName: 'Receptionist Desk (Queue & Routing)',
    title: 'How to Manage Appointment Check-Ins & Print Routing Slips',
    subtitle: 'Handling online patient arrivals, printing intake slips, and searching returning patients.',
    badge: 'Front Desk Routing',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
    overview: 'Receptionists monitor patients who booked appointments online via the patient app and issue physical intake routing slips with QR barcodes.',
    buttonsOnThisScreen: [
      { name: '[Check-In Patient]', color: 'bg-blue-600 text-white', whatItDoes: 'Marks online booking as arrived at the clinic.' },
      { name: '[Print Routing Slip 🧾]', color: 'bg-slate-800 text-white', whatItDoes: 'Prints intake paper voucher with barcode for the patient to hold.' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Search Patient by Name or Booking Code (BK-XXXX)',
        instruction: 'When a patient arrives at the desk, type their 6-digit booking code or family name into the search bar.'
      },
      {
        stepNumber: 2,
        title: 'Verify Identity & Click "Check-In Patient"',
        instruction: 'Confirm the patient’s identity and tap "Check-In". This alerts the Cashier and Phlebotomy teams that the patient is in the clinic waiting area.'
      },
      {
        stepNumber: 3,
        title: 'Print Physical Routing Slip',
        instruction: 'Click "Print Routing Slip". Hand this slip to the patient. It contains their booking reference, ordered tests, and directions to Cashier counter.'
      }
    ],
    faq: [
      {
        q: 'What if an online patient wants to add another test?',
        a: 'Click "Modify Order" on their card, check the extra test from the catalog, and update the invoice before sending them to the Cashier.'
      }
    ]
  },

  // Role: Cashier & Billing (Step 2)
  {
    id: 'lab-cashier',
    category: 'laboratories',
    roleName: 'Cashier & Billing Desk (Step 2)',
    title: 'How to Settle Invoices, Add Extra Medical Acts (Code & Price) & Print Receipts',
    subtitle: 'Step 2 cashier settlement: 2-column light modal, adding acts (e.g. KB10), discounts, PIN CSH123 & receipts.',
    badge: 'Billing & Cashier',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: DollarSign,
    overview: 'The Cashier desk settles diagnostic orders. The light-theme 2-column payment modal allows cashiers to add extra consumables or medical acts with custom code (like kb10) and custom price in XAF, choose payment channels, and finalize with cashier PIN CSH123.',
    buttonsOnThisScreen: [
      { name: '[Collect Payment 💳]', color: 'bg-blue-600 text-white', whatItDoes: 'Opens 2-column light payment modal on any unpaid order.' },
      { name: '[+ Add Act (Code & Price)]', color: 'bg-emerald-700 text-white', whatItDoes: 'Appends consumable with code (e.g. kb10), name, and custom price.' },
      { name: '[KB10 Prélèvement domicile Chip]', color: 'bg-teal-50 border text-teal-800', whatItDoes: '1-click preset chip adding home collection fee (2,000 XAF).' },
      { name: '[Confirm & Stamp Payment ✓]', color: 'bg-emerald-600 text-white', whatItDoes: 'Requires PIN CSH123. Seals transaction and unblocks Phlebotomy.' },
      { name: '[Print Stamped Receipt 🧾]', color: 'bg-slate-700 text-white', whatItDoes: 'Prints official thermal or A4 branded payment receipt.' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Select an Unpaid Patient & Click "Collect Payment"',
        instruction: 'In the Cashier queue, locate the patient card and click "Collect Payment". A clean, 2-column light-theme modal will open immediately.',
        uiPreview: {
          element: 'Modal: [Confirm Patient Payment — 2-Column Balanced Light Layout]',
          description: 'Left: Patient info, tests, extra acts. Right: Payment channel, cash change, PIN.',
          badge: 'Light Theme',
          color: 'blue'
        }
      },
      {
        stepNumber: 2,
        title: 'Add Extra Medical Acts & Consumables (Custom Code & Price)',
        instruction: 'Under "Add Extra Medical Acts & Consumables", type the Act Code (e.g. "kb10"), Description (e.g. "Prélèvement à domicile"), and Price in XAF, then click "Add".',
        uiPreview: {
          element: 'Fields: [Code: kb10] [Description: Prélèvement domicile] [Price: 2000 XAF] [Add +]',
          description: 'Direct manual addition with custom code and custom pricing in XAF.',
          badge: 'Custom Code Support',
          color: 'teal'
        },
        tip: 'You can also click preset chips like "KB10 Prélèvement domicile (2000 XAF)" or "Tube Vacutainer (500 XAF)" for 1-click addition!'
      },
      {
        stepNumber: 3,
        title: 'Select Payment Channel (Insurance Dropdown & Matricule)',
        instruction: 'Choose how the patient is settling: Cash, Mobile Money (MTN MoMo or Orange Money), Bank Transfer, Insurance Co-Pay, or Staff Welfare (100% Free). When Insurance Co-Pay is chosen: (1) Select the insurance company from the accredited Cameroon dropdown list (ASCOMA, AXA, Activa, Gras Savoye, etc., or choose Other); (2) Enter the patient’s mandatory Insurance Matricule / Policy ID. Both the insurance company and matricule are automatically printed on the official receipt.',
        uiPreview: {
          element: 'Insurance Selector: [Dropdown: ASCOMA / AXA / Activa] + [Matricule Input: ASC-2026-992014]',
          description: 'Accredited insurer picker with mandatory policy matricule number for claims.',
          badge: 'Receipt Certified',
          color: 'indigo'
        },
        tip: 'When Cash is selected, enter the bill amount handed by the patient. The system automatically computes and highlights the exact change to return!'
      },
      {
        stepNumber: 4,
        title: 'Enter Cashier PIN (CSH123) & Confirm',
        instruction: 'Enter your authorized Cashier PIN (e.g. CSH123) in the security input box, then click "Confirm & Stamp Payment ✓".',
        uiPreview: {
          element: 'PIN Field: [•••• CSH123] → Button: [Confirm & Stamp Payment ✓]',
          description: 'Authenticates cashier authority and seals the financial transaction.',
          badge: 'PIN Protected',
          color: 'emerald'
        }
      },
      {
        stepNumber: 5,
        title: 'Print Stamped Receipt & Patient Moves to Phlebotomy',
        instruction: 'Click "Print Official Receipt". The patient order status immediately updates to "Paid", unlocking them in the Phlebotomy queue for sample collection.'
      }
    ],
    faq: [
      {
        q: 'What happens if a patient cannot pay the full amount today?',
        a: 'You can choose "Partial Payment / Deposit". The receipt will record the advance received and note the remaining balance due upon report pickup.'
      },
      {
        q: 'What is the default Cashier test PIN?',
        a: 'The default demo PIN for testing cashier actions is CSH123.'
      }
    ]
  },

  // Role: Phlebotomy & Sample Accessioning (Step 3)
  {
    id: 'lab-phlebotomy',
    category: 'laboratories',
    roleName: 'Phlebotomy Desk (Step 3: Tubes & Barcodes)',
    title: 'How to Check Paid Patients, Verify Tube Colors & Print Barcodes',
    subtitle: 'Step 3 sample drawing: color-coded tube verification, printing barcodes, and safety protocols.',
    badge: 'Sample Collection',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: Truck,
    overview: 'Phlebotomists collect biological specimens from patients who cleared payment at the Cashier counter. Phlebotomists verify required tubes by color code, draw specimens, print barcode stickers, and affix them for 100% chain-of-custody traceability.',
    buttonsOnThisScreen: [
      { name: '[Print Tube Barcodes 🏷️]', color: 'bg-indigo-600 text-white', whatItDoes: 'Prints barcode stickers for each required tube.' },
      { name: '[Dispatch Sample to Lab 🚚]', color: 'bg-emerald-600 text-white', whatItDoes: 'Transfers samples to Lab Technologist benches.' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Select Paid Patient from Phlebotomy Queue',
        instruction: 'Only patients who have cleared payment appear in the Phlebotomy queue. Tap the patient card to view the biological tests ordered.'
      },
      {
        stepNumber: 2,
        title: 'Verify Required Vacutainer Tube Color Codes',
        instruction: 'Check which colored tubes must be drawn based on the ordered tests:',
        uiPreview: {
          element: 'Tube Guide: [Purple: EDTA (NFS)] [Red/Gold: Serum (Biochem)] [Grey: Fluoride (Glucose)] [Blue: Citrate (Coagulation)]',
          description: 'Official clinical color-coded tube specification.',
          badge: 'Standard Protocol',
          color: 'indigo'
        },
        tip: 'Purple = Hemato/NFS/CBC; Red/Gold = Serology/Biochemistry; Grey = Blood Sugar/Glycémie; Light Blue = Coagulation/PT/PTT; Green = Heparin.'
      },
      {
        stepNumber: 3,
        title: 'Draw Specimen & Click "Print Tube Barcodes 🏷️"',
        instruction: 'Collect required blood volume following asepsis standards. Click "Print Tube Barcodes" to generate high-resolution barcoded labels with Patient ID and test codes.',
        uiPreview: {
          element: 'Barcode Label: [|||||||||||||| PID-9042 - EDTA - NFS]',
          description: 'Affix lengthwise along the tube without wrinkling.',
          badge: 'Chain of Custody'
        }
      },
      {
        stepNumber: 4,
        title: 'Affix Barcodes & Click "Dispatch Sample to Laboratory 🚚"',
        instruction: 'Stick the barcode label on each tube and click "Dispatch Sample to Laboratory". The patient status updates to "In_Lab_Testing" and moves to the Lab Tech queue.'
      }
    ],
    faq: [
      {
        q: 'What if a sample is hemolyzed or insufficient volume?',
        a: 'Click "Flag Sample Reject / Recollect Needed". The front desk is notified to call the patient back for a fresh redraw without recharging.'
      }
    ]
  },

  {
    id: 'lab-phlebotomy-dispatch',
    category: 'laboratories',
    roleName: 'Phlebotomy Desk (Home Collection Visits)',
    title: 'How to Manage Home Sample Collections & Nurse Dispatch',
    subtitle: 'Managing off-site patient draws, mobile phlebotomist routing, and sample accessioning.',
    badge: 'Home Collection',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: Truck,
    overview: 'When patients book home visits via the app, phlebotomy coordinators dispatch accredited mobile phlebotomists with insulated transport boxes to collect blood and urine at the patient’s home.',
    steps: [
      {
        stepNumber: 1,
        title: 'Filter Queue by "Home Visits 🏠"',
        instruction: 'In the Phlebotomy dashboard, toggle the "Home Collection" filter. Orders feature a Home icon with the patient’s address and phone number.'
      },
      {
        stepNumber: 2,
        title: 'Assign Phlebotomist & Click "Dispatch Nurse"',
        instruction: 'Select the mobile phlebotomist nurse and click "Dispatch Nurse". An automated SMS with GPS details is sent to both the nurse and the patient.'
      },
      {
        stepNumber: 3,
        title: 'Receive Samples at Central Lab Bench',
        instruction: 'Upon the nurse’s return, inspect tube temperature and integrity, click "Sample Received & Accessioned", and route to testing benches.'
      }
    ],
    faq: [
      {
        q: 'How is cold chain maintained for home collection?',
        a: 'Specimens must be stored in temperature-controlled cooler boxes (2°C - 8°C) with cold packs and delivered to the central lab within 2 hours.'
      }
    ]
  },

  // Role: Lab Technologist / Analyst (Step 4)
  {
    id: 'lab-technologist',
    category: 'laboratories',
    roleName: 'Lab Technologist Desk (Step 4)',
    title: 'How to Enter Analytical Results & Understand Automatic Reference Flags',
    subtitle: 'Step 4 test analysis: booklet navigation, inputting parameter values, and normal/abnormal auto-flagging.',
    badge: 'Bench Testing',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    icon: TestTube,
    overview: 'Lab Technologists analyze biological specimens on bench instruments or automated analyzers, enter quantitative/qualitative values, and review auto-flagged normal/abnormal parameters against standard reference ranges.',
    buttonsOnThisScreen: [
      { name: '[Open Patient Test Booklet 📖]', color: 'bg-cyan-600 text-white', whatItDoes: 'Opens test entry matrix for the selected patient.' },
      { name: '[Save Draft Values 💾]', color: 'bg-slate-100 border text-slate-800', whatItDoes: 'Saves measured values without submitting yet.' },
      { name: '[Submit to Biologist for Validation 🧪]', color: 'bg-teal-600 text-white', whatItDoes: 'Opens reagent deduction modal and sends test to Biologist.' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Select Patient from Lab Tech Queue',
        instruction: 'From the testing queue, click on the patient order marked "Sample Received / Ready for Testing".'
      },
      {
        stepNumber: 2,
        title: 'Open Test Booklet & Input Parameter Values',
        instruction: 'In the analytical worksheet, type measured values for each requested parameter (e.g., Hemoglobin: 13.8 g/dL, Leucocytes: 6,400 /mm³, Glycémie: 0.95 g/L).',
        uiPreview: {
          element: 'Worksheet Grid: [Parameter Name] [Result Input] [Unit] [Reference Range] [Flag]',
          description: 'Structured biochemical input table.',
          badge: 'Auto Reference Check'
        }
      },
      {
        stepNumber: 3,
        title: 'Check Automatic High/Low Abnormal Badges',
        instruction: 'The system automatically compares each result against age- and gender-specific reference curves. High values flag in RED (▲ High) and low values flag in BLUE (▼ Low).',
        tip: 'Always double-check red flags before submitting to ensure there were no typographical errors.'
      }
    ],
    faq: [
      {
        q: 'What if an automated analyzer is connected via ASTM / HL7?',
        a: 'If analyzer interfacing is active, results populate directly from the instrument into the worksheet for the technician to verify.'
      }
    ]
  },

  {
    id: 'lab-tech-lock',
    category: 'laboratories',
    roleName: 'Lab Technologist Desk (Printing Security Rule)',
    title: 'Why Lab Technologists Cannot Print Reports ("Wait for Biologist to Confirm")',
    subtitle: 'Strict ISO 15189 security policy: why printing is locked until Clinical Biologist validates and signs.',
    badge: 'Quality & Compliance',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Lock,
    overview: 'A fundamental rule of clinical laboratory practice is that diagnostic reports can NEVER be released or printed physically until validated by a licensed Clinical Biologist or Pathologist. If a Lab Tech attempts to print prematurely, the system locks printing with an explicit notice.',
    buttonsOnThisScreen: [
      { name: '[Print Sheet (Wait for Biologist 🔒)]', color: 'bg-amber-100 text-amber-800 border border-amber-300', whatItDoes: 'Displays alert: Wait for Biologist to Confirm — Lab Tech cannot print without Biologist confirmation.' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Attempting to Print Before Biologist Sign-Off',
        instruction: 'If you click "Preview / Print Sheet" or "Preview PDF" while the test is still in progress, printing is locked with the amber badge: "Wait for Biologist to Confirm — Lab Tech cannot print without Biologist confirmation".',
        uiPreview: {
          element: 'Locked Button: [Print Sheet (Wait for Biologist 🔒)]',
          description: 'Prevents premature release of unvalidated medical reports to patients.',
          badge: 'Security Lock',
          color: 'amber'
        }
      },
      {
        stepNumber: 2,
        title: 'Why this Rule Exists',
        instruction: 'To guarantee patient safety, eliminate analytical errors, and comply with national health regulations and ISO 15189, only authorized Biologists have legal authority to release medical findings.'
      },
      {
        stepNumber: 3,
        title: 'How Printing is Unlocked',
        instruction: 'Once you click "Submit to Biologist", the Clinical Biologist inspects the results and enters their PIN (BIO123) to confirm. The moment they sign, printing is automatically unlocked on all workstations!'
      }
    ],
    faq: [
      {
        q: 'Can the receptionist print the report before the Biologist confirms?',
        a: 'No! The printing lock applies across the entire system. No user can print the official report until the Biologist signs.'
      }
    ]
  },

  {
    id: 'lab-tech-reagents',
    category: 'laboratories',
    roleName: 'Lab Technologist Desk (Reagent Consumption)',
    title: 'How to Log Consumed Reagents (Card Grid with - +) & Submit to Biologist',
    subtitle: 'Logging in-stock reagents consumed during analysis, adjusting quantities, and dispatching to Biologist.',
    badge: 'Reagent Inventory',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    icon: Package,
    overview: 'When submitting test findings to the Biologist, Lab Technologists record reagents and test kits consumed. A visual card grid displays in-stock, unexpired reagents with a search filter and easy +/- quantity buttons.',
    buttonsOnThisScreen: [
      { name: '[Search Reagents Bar]', color: 'bg-slate-50 border', whatItDoes: 'Filters reagent cards by chemical or kit name.' },
      { name: '[Reagent Card with - + Qty]', color: 'bg-white border rounded-xl', whatItDoes: 'Adjusts quantity of reagent used during testing.' },
      { name: '[Continue Anyway (No Reagents)]', color: 'bg-slate-200 text-slate-700', whatItDoes: 'Bypasses reagent deduction if already logged or not applicable.' },
      { name: '[Submit to Biologist ✓]', color: 'bg-teal-600 text-white font-bold', whatItDoes: 'Transmits findings and inventory deductions to Biologist.' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Click "Submit to Biologist for Validation"',
        instruction: 'After verifying your analytical findings, click the green "Submit to Biologist" button. The submission modal will open.'
      },
      {
        stepNumber: 2,
        title: 'Search Reagent Cards & Adjust Quantities Used',
        instruction: 'In the "Reagents Used" card grid, type the reagent name (e.g., "NFS Diluent", "Glucose GOD-PAP", "Malaria RDT Cassette"). Tap "+" or "-" to set the quantity consumed.',
        uiPreview: {
          element: 'Card: [Glucose Reagent 100ml] [Lot: #GL-88] [In Stock: 14] [Used: - 1 +]',
          description: 'Visual reagent card with real-time stock deduction.',
          badge: 'Inventory Deduct',
          color: 'cyan'
        },
        tip: 'If no reagents are applicable for this test (e.g. manual microscopy), click "Continue Anyway (No Reagents)".'
      },
      {
        stepNumber: 3,
        title: 'Enter Technician Code & Confirm Submission',
        instruction: 'Enter your technician authentication code (e.g. TECH01) and click "Submit to Biologist". The test findings and consumed reagents are electronically routed to the Biologist Console.'
      }
    ],
    faq: [
      {
        q: 'What happens to the inventory when reagents are submitted?',
        a: 'The central reagent ledger immediately deducts the logged units and recalculates remaining stock to alert the lab manager if levels drop below the safety threshold.'
      }
    ]
  },

  // Role: Clinical Biologist / Pathologist (Step 5)
  {
    id: 'lab-biologist',
    category: 'laboratories',
    roleName: 'Clinical Biologist Desk (Step 5: Validation)',
    title: 'How to Review Analytical Findings, Verify Tech Signatures & Add Clinical Comments',
    subtitle: 'Step 5 biological validation: verifying findings, abnormal flags, and specialist commentary.',
    badge: 'Biological Review',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: ShieldCheck,
    overview: 'Clinical Biologists hold ultimate medical responsibility for laboratory diagnostics. In the Biologist Console, they inspect analytical findings, check the technician’s credentials and reagents used, and write specialist clinical interpretations.',
    buttonsOnThisScreen: [
      { name: '[Open Biologist Validation Tab]', color: 'bg-teal-700 text-white', whatItDoes: 'Displays all tests awaiting biological sign-off.' },
      { name: '[+ Add Clinical Interpretation Note]', color: 'bg-slate-100 border text-slate-800', whatItDoes: 'Inserts specialist remarks and diagnostic interpretations.' },
      { name: '[Request Re-Analysis / Redo]', color: 'bg-red-50 text-red-700 border border-red-200', whatItDoes: 'Sends sample back to bench if results require confirmation.' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Switch to "Biologist Validation" Tab',
        instruction: 'Click on the "Biologist Validation" tab in the left staff navigation bar. All tests submitted by Lab Technologists appear in the queue.'
      },
      {
        stepNumber: 2,
        title: 'Inspect Values, Flags & Technician Log',
        instruction: 'Review the biochemical values. Verify red and blue flags, inspect previous patient values for delta-check anomalies, and note the technician who performed the analysis.'
      },
      {
        stepNumber: 3,
        title: 'Add Clinical Interpretation Notes',
        instruction: 'Click "+ Add Clinical Note" to type clinical commentary for the attending doctor (e.g., "Aspect évocateur d’une anémie microcytaire hypochrome. Contrôle ferritine conseillé.").'
      }
    ],
    faq: [
      {
        q: 'What if a result seems biologically implausible or conflicting?',
        a: 'Click "Request Re-Analysis". The test moves back to the Lab Tech queue with your note specifying the parameter to re-run on a fresh dilution or calibration.'
      }
    ]
  },

  {
    id: 'lab-biologist-sign',
    category: 'laboratories',
    roleName: 'Clinical Biologist Desk (Sign & Release)',
    title: 'How to Electronically Sign with Passcode (BIO123) & Unlock Printing for All Staff',
    subtitle: 'Finalizing reports: electronic signature seal, patient portal release, and unblocking physical A4 printing.',
    badge: 'Digital Signature',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: Award,
    overview: 'Entering the authorized Biologist Passcode (BIO123) applies the official electronic seal to the diagnostic document. This single action immediately releases the report to the patient portal and unblocks physical A4 printing across all workstations.',
    buttonsOnThisScreen: [
      { name: '[Authorize, Sign & Confirm for Printing ✓]', color: 'bg-emerald-600 text-white font-extrabold shadow-md', whatItDoes: 'Requires PIN BIO123. Seals document and unlocks printing everywhere.' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Click "Authorize, Sign & Confirm for Printing"',
        instruction: 'At the bottom of the Biologist review console, click the green "Authorize, Sign & Confirm for Printing ✓" button.'
      },
      {
        stepNumber: 2,
        title: 'Enter Biologist Passcode (BIO123)',
        instruction: 'In the authorization prompt, enter your authorized Biologist Passcode (e.g., BIO123) and tap "Confirm Electronic Signature".',
        uiPreview: {
          element: 'Passcode Prompt: [Enter Biologist PIN: •••• BIO123] → [Confirm Signature ✓]',
          description: 'Digitally stamps the report with the Biologist’s name and license number.',
          badge: 'Official Signature',
          color: 'emerald'
        }
      },
      {
        stepNumber: 3,
        title: 'Printing is Unlocked on All Workstations!',
        instruction: 'Immediately after signing: (1) The patient can view and download their report on their phone; (2) Receptionists and Lab Techs can now click "Print Official Report (A4)" without any security lock!'
      }
    ],
    faq: [
      {
        q: 'What is the default Biologist demo Passcode?',
        a: 'The demo passcode is BIO123.'
      },
      {
        q: 'Does the printed report show the Biologist signature stamp?',
        a: 'Yes. The generated A4 document features the official electronic signature, accreditation license number, and a verifiable QR code.'
      }
    ]
  },

  // Role: Lab Administrator & Super Admin
  {
    id: 'admin-staff',
    category: 'laboratories',
    roleName: 'Lab Administrator (Staff Governance)',
    title: 'How to Invite Staff Members, Assign Roles & Reset Access Passcodes',
    subtitle: 'Staff user administration: inviting employees, setting roles (Reception, Cashier, Tech, Biologist), and PIN management.',
    badge: 'Staff Administration',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Users,
    overview: 'Lab Administrators manage staff user accounts. They invite team members, assign specific departmental privileges (Reception, Cashier, Phlebotomy, Lab Tech, Biologist), and issue temporary OTP setup codes.',
    buttonsOnThisScreen: [
      { name: '[+ Invite New Staff Member]', color: 'bg-violet-600 text-white', whatItDoes: 'Opens staff creation modal with role checkboxes.' },
      { name: '[Reset Passcode / PIN]', color: 'bg-slate-100 border text-slate-800', whatItDoes: 'Sends a fresh OTP code to staff email/phone.' },
      { name: '[Deactivate Staff Account]', color: 'bg-red-50 text-red-700 border border-red-200', whatItDoes: 'Revokes access immediately upon employee departure.' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Open "Staff & Roles" in Settings',
        instruction: 'In the sidebar, navigate to "Settings" or "Staff Management" to view the active employee roster.'
      },
      {
        stepNumber: 2,
        title: 'Click "+ Invite New Staff Member"',
        instruction: 'Fill in the staff member’s Full Name, Professional Email, Phone Number, and select their clinical role (e.g., Cashier, Lab Technologist).'
      },
      {
        stepNumber: 3,
        title: 'Dispatch Setup OTP Code',
        instruction: 'Click "Send Invitation". The employee receives an invitation link with a one-time setup code to create their personal password.'
      }
    ],
    faq: [
      {
        q: 'Can one employee have multiple roles (e.g. Receptionist & Cashier)?',
        a: 'Yes! Administrators can check multiple role permissions for a single user account.'
      }
    ]
  },

  {
    id: 'admin-catalog',
    category: 'laboratories',
    roleName: 'Lab Administrator (Catalog & Pricing)',
    title: 'How to Manage Master Test Catalog, Custom Panels & Set Prices in FCFA',
    subtitle: 'Configuring available diagnostic exams, official prices in XAF, turnaround times, and health packages.',
    badge: 'Pricing & Catalog',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: DollarSign,
    overview: 'Administrators define which clinical examinations the lab provides, configure official pricing in Central African CFA francs (FCFA / XAF), set sample tube types, and assemble multi-test preventive checkup panels.',
    buttonsOnThisScreen: [
      { name: '[+ Add New Test Exam]', color: 'bg-violet-600 text-white', whatItDoes: 'Adds a new clinical test to the master catalog.' },
      { name: '[Edit Price (FCFA)]', color: 'bg-slate-100 border text-slate-800', whatItDoes: 'Updates price charged to patients and insurance co-pay rates.' },
      { name: '[Create Health Package Panel]', color: 'bg-teal-600 text-white', whatItDoes: 'Bundles multiple exams together with a package discount.' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Navigate to "Test Catalog & Pricing" in Admin Menu',
        instruction: 'Open the Catalog dashboard to view all active examinations sorted by department (Hematology, Biochemistry, Serology, Microbiology).'
      },
      {
        stepNumber: 2,
        title: 'Edit Existing Test Price or Add New Test',
        instruction: 'Click on any test to update its Price in XAF, Target Turnaround Time (hours), and specimen requirements (e.g. Purple EDTA tube, Fasting required).'
      },
      {
        stepNumber: 3,
        title: 'Save Changes to Propagate Instantly',
        instruction: 'Click "Save Changes". The updated price is instantly reflected on the Patient booking app, Reception Desk, and Cashier counter.'
      }
    ],
    faq: [
      {
        q: 'Can we offer promotional discounts on health panels?',
        a: 'Yes. When creating a Health Package, enter a discounted bundle price. The patient app will display both the regular price and the promotional savings.'
      }
    ]
  },

  {
    id: 'admin-reagents',
    category: 'laboratories',
    roleName: 'Lab Administrator (Inventory Control)',
    title: 'How to Manage Reagent Inventory, Log Deliveries & Set Low Stock Alerts',
    subtitle: 'Reagent stock ledger: logging deliveries, tracking lot expiration dates, and setting minimum safety thresholds.',
    badge: 'Inventory Control',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Package,
    overview: 'Ensure your lab never runs out of critical reagents or test kits. Administrators log reagent deliveries, monitor automated deductions by technicians, and configure low-stock alerts before expiration dates arrive.',
    buttonsOnThisScreen: [
      { name: '[+ Log Reagent Delivery]', color: 'bg-teal-600 text-white', whatItDoes: 'Increments stock with new lot number and expiration date.' },
      { name: '[Set Safety Threshold]', color: 'bg-slate-100 border text-slate-800', whatItDoes: 'Triggers amber warning when remaining units drop below threshold.' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Open "Reagents & Inventory" in Sidebar',
        instruction: 'View the live stock table showing current quantity, lot numbers, expiration countdowns, and consumption rates.'
      },
      {
        stepNumber: 2,
        title: 'Click "+ Log Reagent Delivery"',
        instruction: 'Enter Item Name (e.g. "NFS Lyse Reagent 500ml"), Supplier, Quantity Received, Batch/Lot Number, and Expiry Date.'
      },
      {
        stepNumber: 3,
        title: 'Set Low Stock Alert Threshold',
        instruction: 'Set the minimum safety buffer (for example, 5 units). If stock dips below 5, the dashboard alerts managers in red so orders can be placed in advance.'
      }
    ],
    faq: [
      {
        q: 'What happens when a reagent expires?',
        a: 'The system highlights the lot in red and prevents technicians from logging expired reagents during test submission, protecting laboratory quality.'
      }
    ]
  },

  {
    id: 'admin-finance',
    category: 'laboratories',
    roleName: 'Lab Administrator (Financial Audit)',
    title: 'How to Audit Daily Revenue, Cashier Shifts & Mobile Money Reconciliation',
    subtitle: 'Financial ledger: tracking cash intake, MTN MoMo / Orange Money reconciliations, and shift closing.',
    badge: 'Financial Audit',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Coins,
    overview: 'Maintain airtight financial transparency. The Financial Audit dashboard reconciles cash collections, MTN Mobile Money, Orange Money, bank deposits, and insurance receivables with shift-by-shift auditing.',
    buttonsOnThisScreen: [
      { name: '[Export Financial Ledger (CSV/PDF)]', color: 'bg-slate-800 text-white', whatItDoes: 'Downloads accounting spreadsheet of all transactions.' },
      { name: '[Reconcile Cashier Shift]', color: 'bg-blue-600 text-white', whatItDoes: 'Compares recorded cash against physical drawer count.' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Select Date Range in Finance Ledger',
        instruction: 'Choose "Today", "This Week", or select custom dates to inspect aggregate gross revenue, discounts, and net collections.'
      },
      {
        stepNumber: 2,
        title: 'Inspect Payment Method Breakdown',
        instruction: 'Review the breakdown between Cash, MTN MoMo, Orange Money, and Insurance Claims to ensure physical cash in drawer matches the software total.'
      },
      {
        stepNumber: 3,
        title: 'Perform End-of-Day Shift Closeout',
        instruction: 'Click "Reconcile Cashier Shift", verify the cashier PIN, and generate the daily closing summary for the laboratory accountant.'
      }
    ],
    faq: [
      {
        q: 'Can the administrator see which cashier took each payment?',
        a: 'Yes. Every transaction record logs the cashier name, exact timestamp, payment channel, and receipt number.'
      }
    ]
  },

  // =========================================================================
  // CATEGORY 2: FOR DOCTORS & PARTNER PHYSICIANS
  // =========================================================================
  {
    id: 'doc-orders-results',
    category: 'doctors',
    roleName: 'Partner Doctors',
    title: 'How to Review Referred Patients, Inspect High-Res A4 Lab Reports & Antibiograms',
    subtitle: 'Doctor portal guide: inspecting verified clinical findings, antibiogram sensitivity charts, and normal curves.',
    badge: 'Doctor Portal',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Stethoscope,
    overview: 'Partner clinicians monitor referred patients, inspect verified diagnostic reports, review antibiotic sensitivity matrices (antibiograms), and track patient recovery.',
    buttonsOnThisScreen: [
      { name: '[View A4 Lab Report 📄]', color: 'bg-slate-800 text-white', whatItDoes: 'Opens complete clinical report with normal reference ranges.' },
      { name: '[Inspect Antibiogram Matrix 🔬]', color: 'bg-purple-600 text-white', whatItDoes: 'Shows antibiotic sensitivity: Sensitive (S), Intermediate (I), Resistant (R).' },
      { name: '[Download Signed PDF]', color: 'bg-teal-600 text-white', whatItDoes: 'Saves official validated report to physician’s device.' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Log In to the Doctor Portal',
        instruction: 'Access the Doctor Portal using your accredited physician credentials.'
      },
      {
        stepNumber: 2,
        title: 'Inspect Referred Patients & Completed Orders',
        instruction: 'In your patient list, tap any order marked "Completed" to view high-resolution laboratory reports, antibiograms, and reference ranges.'
      },
      {
        stepNumber: 3,
        title: 'Review Biologist Commentary & Recommendations',
        instruction: 'Scroll to the bottom of the clinical report to read interpretation remarks provided by the Clinical Biologist.'
      }
    ],
    faq: [
      {
        q: 'How does doctor referral attribution work?',
        a: 'When receptionists register a patient referred by you, the system displays your name and clinic on the receipt and test report, attributing the patient directly to your practice.'
      }
    ]
  },

  {
    id: 'doc-chat-rx',
    category: 'doctors',
    roleName: 'Partner Doctors',
    title: 'How to Consult Patients in Chat & Issue Digital Medical Prescriptions (Rx)',
    subtitle: 'Consulting connected patients, discussing results, and writing stamped digital prescriptions.',
    badge: 'Doctor-Patient Chat',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: MessageSquare,
    overview: 'Connect directly with patients to explain biological results, answer health questions, and issue standardized digital prescriptions with your accredited electronic stamp.',
    buttonsOnThisScreen: [
      { name: '[Open Doctor-Patient Chat Hub]', color: 'bg-purple-600 text-white', whatItDoes: 'Opens encrypted messaging console with connected patients.' },
      { name: '[Issue Digital Prescription (Rx) 💊]', color: 'bg-indigo-600 text-white font-bold', whatItDoes: 'Opens prescription composer with medications, dosage, and stamp.' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Open the Doctor-Patient Chat Hub',
        instruction: 'In your top menu or sidebar, open the Chat Hub to see consultation requests from patients.'
      },
      {
        stepNumber: 2,
        title: 'Accept Consultation & Discuss Diagnostic Findings',
        instruction: 'Chat securely with the patient, interpret their lab results, and provide lifestyle or therapeutic guidance.'
      },
      {
        stepNumber: 3,
        title: 'Click the Prescription Icon (Rx) to Issue e-Prescription',
        instruction: 'Tap the Rx button to open the digital prescription pad. Add medications, dosages (e.g., 500mg), frequencies (2x daily), and durations (5 days).',
        uiPreview: {
          element: 'Prescription Pad: [Medication Name] [Dose] [Frequency] [Duration] → [Sign & Send Rx 💊]',
          description: 'Digitally stamped prescription delivered directly into patient’s portal.',
          badge: 'Digital Rx',
          color: 'purple'
        }
      }
    ],
    faq: [
      {
        q: 'Can patients present this digital prescription at partner pharmacies?',
        a: 'Yes! The digital prescription carries the doctor’s official registry license number and digital stamp, accepted at accredited pharmacies.'
      }
    ]
  },

  // =========================================================================
  // CATEGORY 3: FOR PATIENTS (B2C MOBILE & WEB APP)
  // =========================================================================
  {
    id: 'pat-book-test',
    category: 'patients',
    roleName: 'Patients (B2C)',
    title: 'How to Search Diagnostic Tests, Compare Prices & Book Appointments',
    subtitle: 'B2C patient guide: finding tests near you, checking official prices in FCFA, and scheduling clinic or home visits.',
    badge: 'Patients (B2C)',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    icon: Calendar,
    overview: 'As a patient, you can quickly locate any accredited laboratory in your city, see guaranteed test prices in FCFA, and book an appointment with zero waiting times.',
    buttonsOnThisScreen: [
      { name: '[Book Test +]', color: 'bg-emerald-600 text-white font-bold', whatItDoes: 'Selects the examination and opens the appointment booking calendar.' },
      { name: '[Home Collection Visit 🏠]', color: 'bg-teal-50 border text-teal-800', whatItDoes: 'Requests a phlebotomist nurse to collect your blood sample at home.' },
      { name: '[Confirm Appointment ✓]', color: 'bg-teal-600 text-white', whatItDoes: 'Generates your 6-digit Booking Code (e.g. BK-9942).' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Search Test Name or Health Panel',
        instruction: 'On your patient homepage, type the test name (e.g., "NFS", "Glycémie", "Paludisme") into the search box or browse Preventive Health Packages.'
      },
      {
        stepNumber: 2,
        title: 'Click "Book Test +"',
        instruction: 'Click on "Book Test +" on any individual test card or health package to automatically add it to your booking schedule.'
      },
      {
        stepNumber: 3,
        title: 'Choose Visit Type: Clinic Walk-In or Home Collection',
        instruction: 'Select whether you want to visit the laboratory in person or request an accredited phlebotomist nurse to visit your home.'
      },
      {
        stepNumber: 4,
        title: 'Select Date & Confirm Booking',
        instruction: 'Pick your preferred date and time slot, verify your phone number, and click "Confirm Appointment". You will receive an instant 6-digit Booking Code (e.g. BK-9942).'
      }
    ],
    faq: [
      {
        q: 'Do I have to pay online immediately?',
        a: 'No. You can choose to pay online via MTN MoMo / Orange Money, or pay cash over the counter directly when you arrive at the laboratory reception.'
      }
    ]
  },

  {
    id: 'pat-view-results',
    category: 'patients',
    roleName: 'Patients (B2C)',
    title: 'How to View & Download Official Signed Test Reports (A4 PDF)',
    subtitle: 'Accessing your biological results, reference curves, and QR-verifiable official PDF documents.',
    badge: 'Patients (B2C)',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: FileText,
    overview: 'All completed clinical tests undergo biological validation before being released to your secure portal for digital download, printable A4 viewing, or direct sharing with your doctor.',
    buttonsOnThisScreen: [
      { name: '[Tests Tab 🧪]', color: 'bg-teal-700 text-white', whatItDoes: 'Displays all ongoing, pending, and completed test orders.' },
      { name: '[View Official Report (A4) 📄]', color: 'bg-slate-800 text-white', whatItDoes: 'Opens high-res A4 document with Biologist signature and QR seal.' },
      { name: '[Download Signed PDF ⬇️]', color: 'bg-emerald-600 text-white', whatItDoes: 'Saves official PDF file to your smartphone or computer.' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Navigate to "My Tests" Tab',
        instruction: 'In your navigation bar, tap the "Tests" tab to see all your laboratory orders.'
      },
      {
        stepNumber: 2,
        title: 'Check Status Badge',
        instruction: 'When status displays "Completed", your diagnostic report has been validated and signed by the Clinical Biologist.'
      },
      {
        stepNumber: 3,
        title: 'Click "View Official Report (A4)"',
        instruction: 'Click the report button to open the full A4 medical document featuring biochemical reference ranges, abnormal flags (High/Low), and the authorized Biologist signature stamp.'
      },
      {
        stepNumber: 4,
        title: 'Download PDF or Share with Doctor',
        instruction: 'Tap "Download PDF" to save it to your phone or click "Share with Doctor" to send it directly into doctor consultation chat.'
      }
    ],
    faq: [
      {
        q: 'Can anyone else see my medical results?',
        a: 'No. Your results are strictly private and encrypted. Only you and doctors you explicitly connect with can view them.'
      }
    ]
  },

  {
    id: 'pat-doctor-chat',
    category: 'patients',
    roleName: 'Patients (B2C)',
    title: 'How to Connect & Chat with Accredited Doctors (with Anonymous Mode)',
    subtitle: 'Consulting certified physicians, sharing test reports, and maintaining private anonymous nicknames.',
    badge: 'Patients (B2C)',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: MessageSquare,
    overview: 'Connect directly with verified specialists to interpret your diagnostic results and provide clinical care with optional anonymous privacy mode.',
    buttonsOnThisScreen: [
      { name: '[Doctors Tab 🩺]', color: 'bg-purple-700 text-white', whatItDoes: 'Shows directory of verified doctors updating in real-time.' },
      { name: '[Connect & Consult 💬]', color: 'bg-teal-600 text-white font-bold', whatItDoes: 'Sends a consultation connection request to the doctor.' },
      { name: '[Anonymous Mode Toggle 🕶️]', color: 'bg-slate-100 border text-slate-800', whatItDoes: 'Hides your real name and shows your private nickname to the doctor.' }
    ],
    steps: [
      {
        stepNumber: 1,
        title: 'Go to the "Doctors" Tab',
        instruction: 'Tap the "Doctors" tab on your navigation bar to view the directory of accredited physicians registered in the network.'
      },
      {
        stepNumber: 2,
        title: 'Search by Specialty or Hospital',
        instruction: 'Type your symptoms, medical specialty (e.g. Cardiology, Hematology, General Medicine), or hospital affiliation to find the right clinician.'
      },
      {
        stepNumber: 3,
        title: 'Send a Connection Request',
        instruction: 'Click "Connect & Consult". You can choose to use your real name or a private patient nickname for extra privacy.'
      },
      {
        stepNumber: 4,
        title: 'Start Chat & Share Results',
        instruction: 'Once connected, tap into the conversation to ask medical questions, share test report batches with 1-click, and receive digital prescriptions.'
      }
    ],
    faq: [
      {
        q: 'Can I stay anonymous when talking to a doctor?',
        a: 'Yes! You can turn on Anonymous Mode in your profile settings. Doctors will only see your custom nickname.'
      }
    ]
  }
];

// -----------------------------------------------------------------------------
// CLIENT-SIDE SEMANTIC SEARCH ENGINE (Synonyms, Lemmas & Intent Detection)
// -----------------------------------------------------------------------------
const SEMANTIC_INTENT_MAP: { keywords: string[]; targetArticleId: string; boost: number }[] = [
  // Cashier & Billing
  { keywords: ['kb10', 'act', 'code', 'consumable', 'domicile', 'add act', 'custom code', 'price xaf'], targetArticleId: 'lab-cashier', boost: 20 },
  { keywords: ['money', 'cash', 'pay', 'billing', 'csh123', 'momo', 'orange', 'change', 'receipt', 'facture', 'argent', 'payer', 'monnaie'], targetArticleId: 'lab-cashier', boost: 15 },
  
  // Printing Lock & Security
  { keywords: ['print', 'imprimer', 'lock', 'bloqué', 'stuck', 'cannot print', 'why', 'biologist confirm', 'wait for biologist', 'locked'], targetArticleId: 'lab-tech-lock', boost: 25 },
  { keywords: ['sign', 'signer', 'bio123', 'authorize', 'validation', 'unlock print', 'pathologist', 'debloquer'], targetArticleId: 'lab-biologist-sign', boost: 20 },
  
  // Phlebotomy & Tubes
  { keywords: ['blood', 'sang', 'tube', 'vein', 'needle', 'aiguille', 'prelevement', 'draw', 'purple', 'edta', 'fluoride', 'barcode', 'etiquette'], targetArticleId: 'lab-phlebotomy', boost: 20 },
  { keywords: ['dispatch', 'envoyer', 'nurse', 'infirmiere', 'home collection', 'maison', 'domicile'], targetArticleId: 'lab-phlebotomy-dispatch', boost: 18 },

  // Reception
  { keywords: ['register', 'enregistrer', 'walk-in', 'accueil', 'reception', 'patient', 'malade', 'pid', 'doctor name', 'self-referred', 'sans medecin'], targetArticleId: 'lab-reception', boost: 20 },
  { keywords: ['check-in', 'arrival', 'routing slip', 'voucher', 'ticket', 'fiche'], targetArticleId: 'lab-reception-queue', boost: 15 },

  // Lab Tech
  { keywords: ['booklet', 'cahier', 'result', 'valeur', 'analyst', 'tech', 'analyzer', 'glycemie', 'nfs', 'high', 'low', 'anormal'], targetArticleId: 'lab-technologist', boost: 18 },
  { keywords: ['reagent', 'reactif', 'stock', 'inventory', 'lot', 'kit', 'deduct', 'consommer'], targetArticleId: 'lab-tech-reagents', boost: 20 },

  // Admin
  { keywords: ['invite', 'worker', 'staff', 'employee', 'personnel', 'role', 'pin', 'passcode', 'reinitialiser'], targetArticleId: 'admin-staff', boost: 20 },
  { keywords: ['price', 'prix', 'catalog', 'tarif', 'exam', 'bilan', 'package', 'fcfa', 'xaf'], targetArticleId: 'admin-catalog', boost: 20 },
  { keywords: ['reagent delivery', 'restock', 'livraison', 'seuil', 'perime', 'expired'], targetArticleId: 'admin-reagents', boost: 20 },
  { keywords: ['audit', 'revenue', 'shift', 'caisse', 'ledger', 'comptabilite', 'reconciliation'], targetArticleId: 'admin-finance', boost: 20 },

  // Doctor & Rx
  { keywords: ['doctor', 'medecin', 'prescription', 'ordonnance', 'rx', 'chat', 'consult', 'specialiste'], targetArticleId: 'doc-chat-rx', boost: 20 },
  { keywords: ['antibiogram', 'antibiogramme', 'sensitivity', 'resistance', 'referred', 'patients du medecin'], targetArticleId: 'doc-orders-results', boost: 20 },

  // Patient B2C
  { keywords: ['book', 'rendez-vous', 'rdv', 'appointment', 'cost', 'combien', 'horaire'], targetArticleId: 'pat-book-test', boost: 18 },
  { keywords: ['download', 'telecharger', 'my results', 'mes resultats', 'pdf', 'qr code', 'compte-rendu'], targetArticleId: 'pat-view-results', boost: 20 }
];

interface HowToUseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: GuideCategory;
}

export const HowToUseGuideModal: React.FC<HowToUseGuideModalProps> = ({
  isOpen,
  onClose,
  initialCategory = 'all'
}) => {
  const [activeTabMode, setActiveTabMode] = useState<'guides' | 'buttons'>('guides');
  const [selectedCategory, setSelectedCategory] = useState<GuideCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(HOW_TO_USE_ARTICLES[0].id);
  const [largeTextMode, setLargeTextMode] = useState(false);

  // AI Smart Assistant State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    directAnswer: string;
    recommendedRole: string;
    targetTab: string;
    actionButton: {
      label: string;
      color: string;
      icon: string;
      description: string;
    };
    steps: string[];
    relevantArticleId?: string;
  } | null>(null);

  // Update selectedCategory when initialCategory prop changes
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  // Execute AI Search
  const handleTriggerAiSearch = async (queryText?: string) => {
    const q = (queryText || searchQuery).trim();
    if (!q) return;

    setIsAiLoading(true);
    try {
      const response = await fetch('/api/guide-ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          roleFilter: selectedCategory
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.result) {
          setAiResult(data.result);
          if (data.result.relevantArticleId) {
            setExpandedArticleId(data.result.relevantArticleId);
            setActiveTabMode('guides');
          }
        }
      }
    } catch (err) {
      console.warn('AI search request failed, using client semantic engine fallback');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Quick prompt click handler
  const handleQuickPromptClick = (prompt: string) => {
    setSearchQuery(prompt);
    handleTriggerAiSearch(prompt);
  };

  // Filter and Score Articles (Client-side Semantic Fuzzy Search)
  const filteredArticles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return HOW_TO_USE_ARTICLES.filter(article => {
      // Category filter
      if (selectedCategory !== 'all' && article.category !== selectedCategory) {
        return false;
      }

      if (!q) return true;

      // Check semantic intent map
      const semanticMatch = SEMANTIC_INTENT_MAP.some(entry => {
        if (entry.targetArticleId !== article.id) return false;
        return entry.keywords.some(kw => q.includes(kw) || kw.includes(q));
      });
      if (semanticMatch) return true;

      // Standard text search
      const titleMatch = article.title.toLowerCase().includes(q);
      const roleMatch = (article.roleName || '').toLowerCase().includes(q);
      const overviewMatch = article.overview.toLowerCase().includes(q);
      const stepMatch = article.steps.some(s =>
        s.title.toLowerCase().includes(q) ||
        s.instruction.toLowerCase().includes(q) ||
        (s.tip && s.tip.toLowerCase().includes(q))
      );
      const buttonMatch = (article.buttonsOnThisScreen || []).some(b =>
        b.name.toLowerCase().includes(q) || b.whatItDoes.toLowerCase().includes(q)
      );
      const faqMatch = article.faq.some(f =>
        f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
      );

      return titleMatch || roleMatch || overviewMatch || stepMatch || buttonMatch || faqMatch;
    });
  }, [selectedCategory, searchQuery]);

  // Filter Buttons for Directory
  const filteredButtons = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return SYSTEM_BUTTONS_DIRECTORY;

    return SYSTEM_BUTTONS_DIRECTORY.filter(btn => {
      return (
        btn.buttonLabel.toLowerCase().includes(q) ||
        btn.role.toLowerCase().includes(q) ||
        btn.location.toLowerCase().includes(q) ||
        btn.actionSummary.toLowerCase().includes(q) ||
        (btn.requirements && btn.requirements.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className={`bg-white border border-slate-200 text-slate-800 rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl relative my-auto max-h-[94vh] flex flex-col font-sans transition-all ${largeTextMode ? 'text-base' : 'text-sm'}`}>
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-700 to-emerald-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">
                  nanoLabs Interactive User Guidebook
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800 border border-teal-200 uppercase tracking-wide">
                  Complete Manual
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>AI Smart Search Enabled</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed step-by-step instructions for every role, button, and function. Designed for clear understanding.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Senior Large Text Toggle */}
            <button
              type="button"
              onClick={() => setLargeTextMode(!largeTextMode)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer border ${
                largeTextMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
              }`}
              title="Toggle Large Text for easier reading"
            >
              <span className="font-extrabold text-sm">A+</span>
              <span className="hidden sm:inline">{largeTextMode ? 'Large Font' : 'Standard'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors shrink-0"
              aria-label="Close Guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top Navigation & Controls */}
        <div className="py-3 space-y-3 shrink-0 border-b border-slate-100">
          
          {/* Main Mode Toggle: Full Booklet vs Button Directory */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTabMode('guides')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTabMode === 'guides'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                <span>Step-by-Step Lessons ({HOW_TO_USE_ARTICLES.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTabMode('buttons')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTabMode === 'buttons'
                    ? 'bg-white text-teal-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-purple-600" />
                <span>Button Directory ({SYSTEM_BUTTONS_DIRECTORY.length} Buttons)</span>
              </button>
            </div>

            {/* Role Filter Tabs (Only shown in Guides mode) */}
            {activeTabMode === 'guides' && (
              <div className="flex items-center gap-1 flex-wrap">
                {[
                  { id: 'all', label: 'All Roles', count: HOW_TO_USE_ARTICLES.length },
                  { id: 'laboratories', label: 'Laboratory Staff (B2B)', count: HOW_TO_USE_ARTICLES.filter(a => a.category === 'laboratories').length },
                  { id: 'doctors', label: 'Doctors', count: HOW_TO_USE_ARTICLES.filter(a => a.category === 'doctors').length },
                  { id: 'patients', label: 'Patients (B2C)', count: HOW_TO_USE_ARTICLES.filter(a => a.category === 'patients').length }
                ].map(tab => {
                  const isSelected = selectedCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedCategory(tab.id as GuideCategory)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Semantic Search Input Bar */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleTriggerAiSearch();
                    }
                  }}
                  placeholder="Ask any question or search functions (e.g. 'why is print locked', 'how to add kb10 code', 'how to take blood', 'send nurse to house')..."
                  className="w-full pl-10 pr-20 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setAiResult(null);
                    }}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* AI Ask Button */}
              <button
                type="button"
                onClick={() => handleTriggerAiSearch()}
                disabled={isAiLoading || !searchQuery.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-teal-700 to-emerald-600 hover:from-teal-800 hover:to-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all shrink-0"
              >
                {isAiLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>{isAiLoading ? 'Analyzing...' : '⚡ AI Smart Search'}</span>
              </button>
            </div>

            {/* Preset Helpful Quick Question Chips (Specially designed for Older Staff & Patients) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs text-slate-500">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">Common Help:</span>
              {[
                'Why is print locked for Lab Tech?',
                'How to add KB10 with custom price at Cashier?',
                'How to register patient with no doctor?',
                'How does Biologist sign and unlock print?',
                'Tube color codes (purple, red, grey)?',
                'How to restock reagents and set threshold?',
                'How to download patient A4 report?'
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickPromptClick(chip)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 border border-transparent text-slate-600 text-[11px] font-medium transition-all shrink-0 cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">

          {/* AI SMART ANSWER HERO CARD (When search is triggered or active) */}
          {aiResult && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-teal-900 via-slate-900 to-indigo-950 text-white border border-teal-500/30 shadow-xl space-y-3.5 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-300">
                      nanoLabs AI Guide Assistant
                    </span>
                    <h4 className="font-extrabold text-sm sm:text-base text-white">
                      Recommended Action: {aiResult.recommendedRole}
                    </h4>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAiResult(null)}
                  className="text-slate-400 hover:text-white text-xs p-1"
                >
                  ✕ Dismiss
                </button>
              </div>

              {/* Direct Explanation in Large, Clear Text */}
              <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-white/95 text-xs sm:text-sm leading-relaxed font-medium">
                {aiResult.directAnswer}
              </div>

              {/* Visual Action Button to look for */}
              {aiResult.actionButton && (
                <div className="p-3 bg-teal-950/60 rounded-xl border border-teal-500/40 flex items-center justify-between flex-wrap gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase text-teal-400 block">
                      Target Screen: {aiResult.targetTab}
                    </span>
                    <span className="text-xs text-white/80 block">
                      {aiResult.actionButton.description}
                    </span>
                  </div>

                  <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Click: {aiResult.actionButton.label}</span>
                  </div>
                </div>
              )}

              {/* Steps in Numbered Sequence */}
              {aiResult.steps && aiResult.steps.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wide">
                    Follow these simple steps:
                  </span>
                  <div className="space-y-1 text-xs text-white/90">
                    {aiResult.steps.map((st, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-teal-500 text-slate-950 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{st}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Jump to Full Lesson Button */}
              {aiResult.relevantArticleId && (
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedArticleId(aiResult.relevantArticleId || null);
                      setActiveTabMode('guides');
                    }}
                    className="px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Open Full Detailed Lesson →</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE 1: STEP-BY-STEP GUIDES ACCORDION */}
          {activeTabMode === 'guides' && (
            <div className="space-y-3.5">
              {filteredArticles.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-700">No matching lesson found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try searching with different terms like "payment", "reagent", "print", or switch to "All Roles".
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setAiResult(null); }}
                    className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Reset Search
                  </button>
                </div>
              ) : (
                filteredArticles.map((article) => {
                  const isExpanded = expandedArticleId === article.id;
                  const Icon = article.icon;

                  return (
                    <div
                      key={article.id}
                      id={`article-${article.id}`}
                      className={`rounded-2xl border transition-all ${
                        isExpanded
                          ? 'bg-white border-teal-400 shadow-md ring-1 ring-teal-400/40'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() => setExpandedArticleId(isExpanded ? null : article.id)}
                        className="w-full p-3.5 sm:p-4 flex items-start sm:items-center justify-between text-left cursor-pointer gap-3"
                      >
                        <div className="flex items-start sm:items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="space-y-0.5 overflow-hidden">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${article.badgeColor}`}>
                                {article.badge}
                              </span>
                              {article.roleName && (
                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                  Role: {article.roleName}
                                </span>
                              )}
                            </div>
                            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                              {article.title}
                            </h3>
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {article.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 p-1.5 rounded-lg bg-slate-100 text-slate-500">
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {/* Accordion Body */}
                      {isExpanded && (
                        <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-100 space-y-5 animate-in fade-in duration-200">
                          
                          {/* Function Summary Box */}
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
                            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 text-teal-600" />
                              <span>Function Summary</span>
                            </div>
                            {article.overview}
                          </div>

                          {/* Action Buttons Available on this Screen */}
                          {article.buttonsOnThisScreen && article.buttonsOnThisScreen.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Sliders className="w-3.5 h-3.5 text-teal-600" />
                                <span>Buttons on this Screen & What They Do</span>
                              </h4>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {article.buttonsOnThisScreen.map((btn, bidx) => (
                                  <div
                                    key={bidx}
                                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] ${btn.color}`}>
                                        {btn.name}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600">
                                      {btn.whatItDoes}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Numbered Steps */}
                          <div className="space-y-3.5">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                              <span>Step-by-Step Directions</span>
                              <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                                {article.steps.length} Steps
                              </span>
                            </h4>

                            <div className="space-y-3">
                              {article.steps.map((st) => (
                                <div
                                  key={st.stepNumber}
                                  className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                                      {st.stepNumber}
                                    </div>
                                    <div className="space-y-1 flex-1">
                                      <h5 className="font-extrabold text-xs sm:text-sm text-slate-900">
                                        {st.title}
                                      </h5>
                                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                        {st.instruction}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Simulated Live UI Visual Preview Mockup Card */}
                                  {st.uiPreview && (
                                    <div className="ml-10 p-2.5 bg-slate-50 rounded-xl border border-dashed border-teal-300 text-xs flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                                        <div className="overflow-hidden">
                                          <span className="font-mono font-bold text-[11px] text-teal-900 block truncate">
                                            {st.uiPreview.element}
                                          </span>
                                          <span className="text-[10px] text-slate-500 block truncate">
                                            {st.uiPreview.description}
                                          </span>
                                        </div>
                                      </div>
                                      {st.uiPreview.badge && (
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-100 text-teal-800 border border-teal-200 shrink-0">
                                          {st.uiPreview.badge}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Pro Tip */}
                                  {st.tip && (
                                    <div className="ml-10 p-2 bg-amber-50/80 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                                      <span className="font-bold text-amber-700 shrink-0">Important Note:</span>
                                      <span>{st.tip}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* FAQ */}
                          {article.faq && article.faq.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
                                <span>Frequently Asked Questions</span>
                              </h4>
                              <div className="space-y-2">
                                {article.faq.map((fq, fidx) => (
                                  <div key={fidx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                                    <span className="font-bold text-slate-900 block">{fq.q}</span>
                                    <span className="text-slate-600 block text-[11px] leading-relaxed">{fq.a}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* VIEW MODE 2: INTERACTIVE BUTTON & CONTROL DIRECTORY */}
          {activeTabMode === 'buttons' && (
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-purple-900 flex items-center justify-between">
                <div>
                  <span className="font-bold block">Interactive Button Directory</span>
                  <span className="text-[11px] text-purple-700">
                    Click any button card to jump directly to its complete training lesson!
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-200 text-purple-900 font-mono">
                  {filteredButtons.length} Controls
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredButtons.map((btn) => (
                  <div
                    key={btn.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all space-y-2.5 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase text-teal-700 tracking-wide bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                          {btn.role}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {btn.location.split('→')[0]}
                        </span>
                      </div>

                      {/* Visual Button Representation */}
                      <div>
                        <span className={`inline-block px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs ${btn.buttonColor}`}>
                          {btn.buttonLabel}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {btn.actionSummary}
                      </p>

                      {btn.requirements && (
                        <div className="p-1.5 bg-amber-50 rounded-lg border border-amber-200 text-[10px] text-amber-900 flex items-center gap-1.5">
                          <Lock className="w-3 h-3 text-amber-700 shrink-0" />
                          <span><strong>Prerequisite:</strong> {btn.requirements}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        {btn.location}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setExpandedArticleId(btn.relatedArticleId);
                          setActiveTabMode('guides');
                        }}
                        className="text-xs font-extrabold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Learn How to Use →</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Print or save user manual as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print User Manual (A4)</span>
            </button>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              nanoLabs Healthcare LIMS • Official Documentation
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer transition-all"
          >
            Close Guidebook
          </button>
        </div>

      </div>
    </div>
  );
};

export default HowToUseGuideModal;
