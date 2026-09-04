export interface SiteConfig {
    name: string;
    category: string;
    industry: string;
    tagline: string;
    supportingTagline: string;
    description: string;
    portalUrl: string;
    email: string;
    phone: string;
    location: string;
    cities: { name: string; region: string; coordinates: [number, number]; status: string }[];
    founder: {
      name: string;
      role: string;
      quote: string;
      bio: string;
      socials: {
        linkedin?: string;
        x?: string;
        github?: string;
        substack?: string;
        email?: string;
      };
      image: string;
    };
    milestones: { year: string; date?: string; title: string; description: string; badge?: string }[];
    faqs: { question: string; answer: string; category?: string }[];
    impactStats: { label: string; value: string; description: string; change?: string }[];
    productTabs: {
      id: string;
      label: string;
      tagline: string;
      description: string;
      keyHighlights: string[];
      roleAttribution: string;
      mockupType: 'dashboard' | 'patients' | 'tests' | 'results' | 'staff' | 'physicians' | 'patient_portal' | 'audit';
    }[];
  }
  
  export const siteConfig: SiteConfig = {
    name: 'NanoLabs',
    category: 'Laboratory Information Management System (LIMS)',
    industry: 'HealthTech / Digital Health / Medical Diagnostics',
    tagline: 'The Operating System for Modern Laboratories.',
    supportingTagline: 'Built in Cameroon. Designed for Africa.',
    description: 'NanoLabs connects patients, tests, results, laboratory teams and doctors through one modern digital ecosystem.',
    portalUrl: '/?view=portal',
    email: 'nanolabsolutions26@gmail.com',
    phone: '+237 670 000 000',
    location: 'Douala & Yaoundé, Cameroon',
  
    cities: [
      { name: 'Douala', region: 'Littoral', coordinates: [4.0511, 9.7679], status: 'Active Hub' },
      { name: 'Yaoundé', region: 'Centre', coordinates: [3.8480, 11.5021], status: 'Clinical Deployment' },
      { name: 'Bafoussam', region: 'West', coordinates: [5.4778, 10.4176], status: 'Regional Node' },
      { name: 'Garoua', region: 'North', coordinates: [9.3014, 13.3977], status: 'Planned Expansion' },
      { name: 'Bamenda', region: 'North West', coordinates: [5.9631, 10.1591], status: 'Partner Network' },
      { name: 'Buea', region: 'South West', coordinates: [4.1560, 9.2415], status: 'Innovation Node' }
    ],
  
    founder: {
      name: 'Mangi Lerine Laslie Jr.',
      role: 'Founder & Product Architect, NanoLabs',
      quote: "The difficult part isn't building software. It's building something that survives contact with reality.",
      bio: 'NanoLabs began after Mangi observed inefficiencies around laboratory healthcare during a hospital experience in Cameroon. As a software engineer, he set out to build a connected laboratory system designed around real African clinical workflows and operational realities.',
      socials: {
        linkedin: 'https://linkedin.com/in/mangi-lerine',
        x: 'https://x.com/mangilerine',
        github: 'https://github.com/mangilerine',
        substack: 'https://nanolabs.substack.com',
        email: 'nanolabsolutions26@gmail.com'
      },
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
    },
  
    milestones: [
      {
        year: '2024',
        title: 'Problem First Identified',
        description: 'First-hand observation of fragmented paper test results, prolonged turnaround times, and lost reports in Cameroonian clinics sparked the vision for NanoLabs.',
        badge: 'Discovery'
      },
      {
        year: '2025',
        title: 'Architecture & Engine Design',
        description: 'Engineered the multi-tenant LIMS core, integrating offline-first data caching, HL7 FHIR standards, multi-role clinical permissions, and sealed digital envelopes.',
        badge: 'Engineering'
      },
      {
        year: '2026',
        date: 'Early 2026',
        title: 'Real-World Laboratory Deployment',
        description: 'Deployed initial pilot versions with clinical laboratory partners across Douala and Yaoundé, gathering live feedback from lab technicians and biologists.',
        badge: 'Deployment'
      },
      {
        year: '2026',
        date: 'September 2026',
        title: 'Active Expansion & Clinical Learning',
        description: 'Expanding public digital result verification, physician connectivity, WhatsApp consolidated batch delivery, and standardized African laboratory operations.',
        badge: 'Current Phase'
      }
    ],
  
    faqs: [
      {
        question: 'What is NanoLabs?',
        answer: 'NanoLabs is a modern Laboratory Information Management System (LIMS) designed to help medical laboratories streamline patient registration, sample barcoding, test processing, results validation, and secure patient & physician communication through one connected digital ecosystem.'
      },
      {
        question: 'Who can use NanoLabs?',
        answer: 'NanoLabs is primarily designed for medical laboratories, hospital diagnostic centers, lab technicians, biologists, pathologists, and receptionists. Patients and referring physicians also access dedicated portals for real-time tracking and encrypted digital result receipts.'
      },
      {
        question: 'Is NanoLabs already available?',
        answer: 'Yes. NanoLabs is actively moving through its operational deployment phase with medical laboratories and diagnostic centers in Cameroon, with ongoing customer onboarding.'
      },
      {
        question: 'Where is NanoLabs based?',
        answer: 'NanoLabs is proudly built in Cameroon, with initial deployment hubs in Douala and Yaoundé.'
      },
      {
        question: 'Can my laboratory join NanoLabs?',
        answer: 'Yes! Interested medical laboratories, polyclinics, and diagnostic centers can request an onboarding consultation or directly enter the portal to configure their laboratory workspace.'
      },
      {
        question: 'How do I access the portal?',
        answer: 'Click any "Continue to Portal" or "Go to Portal" button on this website to instantly access the live NanoLabs authentication and management environment.'
      },
      {
        question: 'Is NanoLabs only for Cameroon?',
        answer: 'Cameroon is NanoLabs’ primary launching market. The platform architecture is engineered from the ground up for scalable deployment across Central and West Africa.'
      },
      {
        question: 'Can investors and strategic partners contact NanoLabs?',
        answer: 'Yes. Investors, health-tech partners, and institutional stakeholders can submit a partnership enquiry through the Contact section or reach out directly to nanolabsolutions26@gmail.com.'
      },
      {
        question: 'Does NanoLabs replace medical professionals?',
        answer: 'No. NanoLabs is specialized clinical infrastructure software designed to empower medical biologists, technicians, and physicians with greater precision, organization, and traceability. Diagnostic validation remains under licensed medical authority.'
      }
    ],
  
    impactStats: [
      {
        label: 'Turnaround Time Reduction',
        value: 'Up to 65%',
        description: 'Faster result delivery from specimen collection to validated patient receipt.'
      },
      {
        label: 'Consolidated Batches',
        value: '100% Digital',
        description: 'Multi-test panels delivered as verified, tamper-proof signed PDF records.'
      },
      {
        label: 'Zero Lost Reports',
        value: 'Traceable Audit',
        description: 'End-to-end specimen chain of custody with encrypted archival.'
      },
      {
        label: 'Physician Connectivity',
        value: 'Real-Time',
        description: 'Direct referral routing and instant diagnostic access for attending doctors.'
      }
    ],
  
    productTabs: [
      {
        id: 'dashboard',
        label: 'Laboratory Dashboard',
        tagline: 'See your laboratory at a glance',
        description: 'Centralized live overview of daily patient throughput, urgent stat tests, pending biologist validations, sample queues, and revenue metrics.',
        keyHighlights: ['Live turnaround time monitors', 'Urgent specimen alert indicators', 'Daily throughput & financial reconciliation'],
        roleAttribution: 'Laboratory Directors & Shift Supervisors',
        mockupType: 'dashboard'
      },
      {
        id: 'patients',
        label: 'Patient Management',
        tagline: 'Keep patient records organized',
        description: 'Instant national ID / PID lookup, visit history, emergency contacts, insurance eligibility, and multi-visit diagnostic timeline.',
        keyHighlights: ['Instant PID lookup', 'Cameroon insurance coverage matching', 'Complete diagnostic history archives'],
        roleAttribution: 'Receptionists & Front Desk Staff',
        mockupType: 'patients'
      },
      {
        id: 'tests',
        label: 'Test Catalog & Processing',
        tagline: 'Manage examinations with clarity',
        description: 'Pre-configured African clinical test catalog spanning Hematology, Biochemistry, Microbiology, Serology, Hormonology, and Antibiograms.',
        keyHighlights: ['Automated tube color & specimen guidance', 'Antibiogram zone diameter matrix', 'Batch barcode generation'],
        roleAttribution: 'Medical Laboratory Technicians',
        mockupType: 'tests'
      },
      {
        id: 'results',
        label: 'Results & Biologist Validation',
        tagline: 'From result entry to validation',
        description: 'Structured parameter data entry, automated reference interval delta-checking, critical value alerts, and digital biologist sign-off.',
        keyHighlights: ['Age/gender-adjusted reference intervals', 'Critical value flag highlights', 'ONMC digital signature stamp'],
        roleAttribution: 'Medical Biologists & Pathologists',
        mockupType: 'results'
      },
      {
        id: 'staff',
        label: 'Staff & Role Permissions',
        tagline: 'Give every team member the right workspace',
        description: 'Granular role-based access control separating Reception, Phlebotomy, Technical Bench, Biologist Sign-Off, Cashier, and Administration.',
        keyHighlights: ['Strict role separation', 'Audit-logged specimen handoffs', 'Multi-shift handover notes'],
        roleAttribution: 'Human Resources & Lab Management',
        mockupType: 'staff'
      },
      {
        id: 'physicians',
        label: 'Physicians & Referrals',
        tagline: 'Connect laboratories and physicians',
        description: 'Seamless referral network connecting outside clinics and attending physicians directly to real-time diagnostic findings.',
        keyHighlights: ['Doctor referral commission ledgers', 'Instant e-prescription ingestion', 'Confidential doctor portal access'],
        roleAttribution: 'Attending Doctors & Partner Clinics',
        mockupType: 'physicians'
      },
      {
        id: 'patient_portal',
        label: 'Patient Portal & Sealed Envelope',
        tagline: 'Bring the patient experience forward',
        description: 'Patients receive instant WhatsApp / SMS notifications to view tactile sealed digital envelopes and download consolidated signed PDF results.',
        keyHighlights: ['Tactile digital wax-seal envelope', 'Direct WhatsApp signed batch PDF share', 'Yebo KYC mobile identity sign-off'],
        roleAttribution: 'Patients & Family Members',
        mockupType: 'patient_portal'
      },
      {
        id: 'audit',
        label: 'Audit & Traceability',
        tagline: 'Know what happens inside your system',
        description: 'Comprehensive, immutable timestamped audit trail tracking every specimen collection, parameter modification, and result release.',
        keyHighlights: ['SHA-256 cryptographic hashes', 'Immutable access logs', 'Regulatory compliance audit readiness'],
        roleAttribution: 'Quality Assurance & Regulatory Auditors',
        mockupType: 'audit'
      }
    ]
  };
  