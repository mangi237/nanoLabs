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
    name: 'nanoLabs',
    category: 'Diagnostics Marketplace & Health Records',
    industry: 'HealthTech / Digital Health / Medical Diagnostics',
    tagline: 'Find, compare and book lab tests near you.',
    supportingTagline: 'Built in Cameroon. Designed for Africa.',
    description: 'nanoLabs connects patients, doctors and laboratories in one platform. Search a test or scan your prescription, compare nearby labs by price, turnaround and distance, then book, pay with MoMo or cash, and track every result in real time.',
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
      role: 'Founder & Product Architect, nanoLabs',
      quote: "The difficult part isn't building software. It's building something that survives contact with reality.",
      bio: 'nanoLabs began after Mangi observed how hard it was for ordinary patients to find, compare and trust laboratory testing in Cameroon. As a software engineer, he set out to build a consumer-first diagnostics platform that lets patients book directly, pay the way they already pay, and keep every result — while giving doctors and labs the connected tools they need.',
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
        description: 'First-hand observation of how patients struggle to compare lab prices, wait on paper results, and lose their diagnostic history sparked the vision for nanoLabs.',
        badge: 'Discovery'
      },
      {
        year: '2025',
        title: 'Marketplace & LIMS Engine',
        description: 'Engineered the patient booking engine, multi-lab comparison, dynamic GPS home-sampling pricing, MoMo payment verification, and the lab-side LIMS with cashier controls.',
        badge: 'Engineering'
      },
      {
        year: '2026',
        date: 'Early 2026',
        title: 'Consumer & Lab Pilot',
        description: 'Launched patient bookings and lab onboarding across Douala and Yaoundé, gathering live feedback from patients, cashiers, technicians and referring doctors.',
        badge: 'Deployment'
      },
      {
        year: '2026',
        date: 'September 2026',
        title: 'B2C Expansion & Doctor Network',
        description: 'Scaling direct patient booking, the doctor connection network, digital prescriptions, WhatsApp result delivery, and standardized lab-branded reports.',
        badge: 'Current Phase'
      }
    ],

    faqs: [
      {
        question: 'What is nanoLabs?',
        answer: 'nanoLabs is a consumer diagnostics platform. Patients search or scan a prescription, compare nearby laboratories by price, turnaround time and distance, book one or several labs at once, pay by cash or Mobile Money, and receive tamper-proof digital results — all in one app.'
      },
      {
        question: 'How do I book a lab test?',
        answer: 'Log in with your phone number and access code, search the test you need (or scan your doctor’s prescription), compare the labs near you, choose walk-in or home sample collection, then confirm and pay. You will see your itemized invoice and live sample tracking instantly.'
      },
      {
        question: 'How do I pay?',
        answer: 'You can pay in cash at the lab, or by Mobile Money (MTN MoMo, Orange Money). For Mobile Money, you transfer to the lab’s displayed number and enter your transaction reference; the lab cashier confirms it with a secure access code.'
      },
      {
        question: 'Can I use my insurance?',
        answer: 'Yes. You can save your insurer (Ascoma, Activa, SAHAM/Sanlam, GMC, Chanas, AXA, Zenithe, Beneficial and others) with your policy number and agreed coverage split. Coverage is verified by the laboratory at check-in.'
      },
      {
        question: 'What is the home sample collection option?',
        answer: 'Instead of visiting the lab, you can request a phlebotomist to collect your sample at home or the office. nanoLabs uses your live location to calculate distance, and the lab’s configured home-visit pricing is added automatically to your invoice.'
      },
      {
        question: 'Are the platform fees fixed?',
        answer: 'For online bookings, nanoLabs applies a small percentage platform fee per test batch to cover secure record storage, real-time tracking, compliance auditing and notifications. Walk-in patients who register at the front desk are never charged this online fee.'
      },
      {
        question: 'Can my doctor see my results?',
        answer: 'Yes. You can connect with your doctor and share a single test batch or your full medical booklet in one tap, secured with Yebo KYC verification. Doctors can also send you digital prescriptions and test recommendations you can book instantly.'
      },
      {
        question: 'Can my laboratory join nanoLabs?',
        answer: 'Yes. Laboratories can configure their profile, Mobile Money accounts, home-sampling rates and pricing, then run reception, cashier, technical bench and biologist sign-off from the connected lab workspace. Freelance labs can start on the entry plan.'
      },
      {
        question: 'Where is nanoLabs available?',
        answer: 'nanoLabs is built in Cameroon with active hubs in Douala and Yaoundé, and is expanding across Central and West Africa.'
      }
    ],

    impactStats: [
      {
        label: 'Compare Before You Book',
        value: 'Price · TAT · Distance',
        description: 'See transparent pricing, turnaround time and distance across every nearby lab before you pay.'
      },
      {
        label: 'Pay Your Way',
        value: 'Cash · MoMo',
        description: 'MTN Mobile Money, Orange Money or cash — with cashier-verified payment confirmation.'
      },
      {
        label: 'Results You Keep',
        value: '100% Digital',
        description: 'Consolidated, signed and tamper-proof result batches stored in your medical booklet forever.'
      },
      {
        label: 'Book Multiple Labs',
        value: 'One Checkout',
        description: 'Split your prescription across several labs at once, or bundle everything with one provider.'
      }
    ],

    productTabs: [
      {
        id: 'patient_app',
        label: 'Patient App',
        tagline: 'Your health, one tap away',
        description: 'Log in with your phone and access code, manage your profile, avatar and insurance, and see your spend, pending tests and health trends in one place.',
        keyHighlights: ['Phone + access code login', 'Insurance with coverage split', 'Spend & health trend summary'],
        roleAttribution: 'Patients (B2C)',
        mockupType: 'patient_portal'
      },
      {
        id: 'search_book',
        label: 'Search & AI Scan',
        tagline: 'Find any test, instantly',
        description: 'Search 80+ tests by name, category or symptom, or scan a handwritten or printed prescription and let the AI extract and pre-select the required tests for you.',
        keyHighlights: ['80+ master test catalog', 'AI prescription scanner (OCR)', 'Doctor referral credited automatically'],
        roleAttribution: 'Patients & Referring Doctors',
        mockupType: 'tests'
      },
      {
        id: 'marketplace',
        label: 'Lab Marketplace',
        tagline: 'Compare nearby labs and book',
        description: 'View nearby laboratories for your selected tests with transparent price, turnaround time, distance and accreditation, then book one lab or several at once.',
        keyHighlights: ['Price, TAT & GPS distance compare', 'Walk-in or home sample collection', 'Multi-lab simultaneous booking'],
        roleAttribution: 'Patients (B2C)',
        mockupType: 'dashboard'
      },
      {
        id: 'payments',
        label: 'Invoicing & Cashier',
        tagline: 'Transparent invoices, verified payments',
        description: 'See a real-time itemized invoice — test fees, sampling acts, distance-based home collection and the platform percentage — then pay by cash or MoMo with cashier access-code confirmation.',
        keyHighlights: ['Dynamic distance-based pricing', 'MoMo proof + reference submission', 'Cashier security access-code approval'],
        roleAttribution: 'Laboratory Cashiers & Reception',
        mockupType: 'staff'
      },
      {
        id: 'doctors',
        label: 'Doctor Network',
        tagline: 'Connect, consult and prescribe',
        description: 'Patients connect with doctors, share test batches or full booklets in one tap, book video or in-person consultations, and convert a doctor’s recommendation into a booked test instantly.',
        keyHighlights: ['Two-way patient connections', 'Digital prescriptions & recommendations', 'Video / in-person / Waspito consults'],
        roleAttribution: 'Doctors & Patients',
        mockupType: 'physicians'
      },
      {
        id: 'tracking',
        label: 'Live Tracking & Results',
        tagline: 'Follow your sample to the result',
        description: 'Track your sample from intake to phlebotomy, transit, bench analysis, quality validation and signed-ready — then download lab-branded, signed consolidated reports.',
        keyHighlights: ['Real-time sample status timeline', 'Lab-branded signed report batches', 'WhatsApp & SMS result delivery'],
        roleAttribution: 'Patients & Family Members',
        mockupType: 'results'
      },
      {
        id: 'records',
        label: 'Medical Booklet',
        tagline: 'One secure health history',
        description: 'Every result, prescription and lab visit is organized in a single medical booklet — grouped cleanly by laboratory batch and ready to share with any connected doctor.',
        keyHighlights: ['Lifetime result archive', 'Grouped by laboratory batch', 'One-tap secure sharing'],
        roleAttribution: 'Patients (B2C)',
        mockupType: 'patients'
      },
      {
        id: 'audit',
        label: 'Audit & Compliance',
        tagline: 'Trust every result',
        description: 'An immutable, timestamped audit log records who sampled, analyzed, signed and validated each result, with cryptographic hashing for regulatory-grade traceability.',
        keyHighlights: ['SHA-256 cryptographic hashes', 'Immutable who-did-what log', 'Compliance audit readiness'],
        roleAttribution: 'Quality Assurance & Auditors',
        mockupType: 'audit'
      }
    ]
  };
