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
    mockupImage: string;
  }[];
}

export const siteConfig: SiteConfig = {
  name: 'nanoLabs',
  category: 'B2B2C Diagnostic Hub',
  industry: 'HealthTech / Digital Health / Medical Diagnostics',
  tagline: 'One hub. Every test. Every lab. Every result.',
  supportingTagline: 'Built in Cameroon. Connecting patients, doctors, and laboratories.',
  description: 'nanoLabs connects patients, doctors, and laboratories on one mobile-first platform — from AI prescription scan and multi-lab booking, to live sample tracking and lab-branded reports.',
  portalUrl: '/?view=portal',
  email: 'nanolabsolutions26@gmail.com',
  phone: '+237 670 000 000',
  location: 'Douala & Yaoundé, Cameroon',

  cities: [
    { name: 'Douala', region: 'Littoral', coordinates: [4.0511, 9.7679], status: 'Active Hub' },
    { name: 'Yaoundé', region: 'Centre', coordinates: [3.8480, 11.5021], status: 'Active Hub' },
    { name: 'Bafoussam', region: 'West', coordinates: [5.4778, 10.4176], status: 'Regional Node' },
    { name: 'Buea', region: 'South West', coordinates: [4.1560, 9.2415], status: 'Innovation Node' },
    { name: 'Bamenda', region: 'North West', coordinates: [5.9631, 10.1591], status: 'Partner Network' },
    { name: 'Garoua', region: 'North', coordinates: [9.3014, 13.3977], status: 'Planned Expansion' }
  ],

  founder: {
    name: 'Mangi Lerine Laslie Jr.',
    role: 'Founder & Product Architect, nanoLabs',
    quote: "The difficult part isn't building software. It's building something that survives contact with reality.",
    bio: 'nanoLabs began after Mangi observed inefficiencies around laboratory healthcare during a hospital experience in Cameroon. As a software engineer, he set out to build a connected diagnostic hub designed around real African clinical workflows — patients, doctors, and laboratories on one platform.',
    socials: {
      linkedin: 'https://linkedin.com/in/mangi-lerine',
      x: 'https://x.com/mangilerine',
      github: 'https://github.com/mangilerine',
      substack: 'https://nanolabs.substack.com',
      email: 'nanolabsolutions26@gmail.com'
    },
    image: 'assets/images/founder.jpg'
  },

  milestones: [
    {
      year: '2024',
      title: 'Problem First Identified',
      description: 'First-hand observation of fragmented paper test results, prolonged turnaround times, and lost reports in Cameroonian clinics sparked the vision for nanoLabs.',
      badge: 'Discovery'
    },
    {
      year: '2025',
      title: 'Architecture & Engine Design',
      description: 'Engineered the multi-lab booking core, batch-based invoicing, live sample tracking, lab-branded reports, and the append-only audit chain.',
      badge: 'Engineering'
    },
    {
      year: '2026',
      date: 'Early 2026',
      title: 'Real-World Laboratory Deployment',
      description: 'Deployed pilot versions with clinical laboratory partners across Douala and Yaoundé, gathering live feedback from lab technicians, cashiers, and biologists.',
      badge: 'Deployment'
    },
    {
      year: '2026',
      date: 'September 2026',
      title: 'B2B2C Transition',
      description: 'Transitioning to the full B2B2C hub: patients, doctors, and labs on one platform, with monthly settlement, live tracking, and automatic patient audit.',
      badge: 'Current Phase'
    }
  ],

  faqs: [
    {
      question: 'What is nanoLabs?',
      answer: 'nanoLabs is a B2B2C diagnostic hub. It connects patients, doctors, and laboratories on one mobile-first platform — from AI prescription scan and multi-lab booking, to payment verification, live sample tracking, and lab-branded reports.'
    },
    {
      question: 'Who is nanoLabs for?',
      answer: 'Three audiences. Patients book tests, scan prescriptions, pay via MTN MoMo or Orange Money, and track their sample live. Doctors connect with patients, send e-prescriptions, and get credited for referrals. Laboratories keep their own brand, prices, and staff while gaining bookings, verified payments, branded reports, and an audit trail.'
    },
    {
      question: 'How does nanoLabs make money?',
      answer: 'A 5% record management fee is added to the patient portion of each invoice, and charged only when the lab cashier verifies payment. The insurance portion is never touched. nanoLabs never holds money — every payment goes directly to the lab. Labs settle with nanoLabs monthly through the Super Admin dashboard.'
    },
    {
      question: 'Does nanoLabs handle payments?',
      answer: 'No. All money moves from the patient directly to the lab — cash, MTN MoMo, or Orange Money. nanoLabs never touches payment rails. The cashier verifies payment manually at intake, and monthly settlement happens between nanoLabs and the lab.'
    },
    {
      question: 'How do I log in?',
      answer: 'Phone number plus access code. Every role uses the same flow. There are no passwords on nanoLabs. A separate cashier security access code exists for payment verification, rotatable by the lab admin.'
    },
    {
      question: 'How does insurance work?',
      answer: 'You add your insurer, policy number, policyholder name, and coverage % at signup. When you pay with insurance, that data flows to the lab. The cashier verifies your policy manually at intake using the Prestataires Agréés portal, then marks it "Verified at lab intake."'
    },
    {
      question: 'Can I book at more than one lab?',
      answer: 'Yes. Multi-lab bookings produce separate batches, separate invoices, and separate reports. Nothing is merged. Each lab sees its own batch and issues its own report with its own branding.'
    },
    {
      question: 'What is live tracking?',
      answer: 'Every sample goes through seven stages: intake, collected, in-transit, received, analysis, validation, signed and ready. When collection happens at home, you can watch the phlebotomist move on a live map, with ETA updates and a "last seen" fallback if they go offline.'
    },
    {
      question: 'Where is nanoLabs available?',
      answer: 'Cameroon is the launch market, with active hubs in Douala and Yaoundé and regional nodes across Bafoussam, Buea, Bamenda, and Garoua. The architecture is built for expansion across CEMAC and West Africa.'
    },
    {
      question: 'How do laboratories join?',
      answer: 'Through the portal. Lab admins configure branding, per-insurer price lists, B-code fees, home collection rates, MTN MoMo and Orange Money numbers, and cashier access codes. Onboarding is instant.'
    }
  ],

  impactStats: [
    { label: 'Batch-based invoicing', value: '100%', description: 'One invoice per collection event, never per test.' },
    { label: 'Live sample tracking', value: '7', description: 'From intake to signed and ready, visible to the patient.' },
    { label: 'Audit chain', value: 'SHA-256', description: 'Append-only. Tamper attempts rejected at the database level.' },
    { label: 'Platform fee', value: '5%', description: 'On the patient portion only, charged when payment is verified.' }
  ],

  productTabs: [
    {
      id: 'patient',
      label: 'Patient app',
      tagline: 'Symptom to signed report, in one tap.',
      description: 'Search 80+ tests, scan a handwritten prescription with AI, compare nearby labs on real distance and price, book at one or several, choose walk-in or home collection, pay with MoMo, and watch the sample move.',
      keyHighlights: [
        'AI prescription scanner for handwritten and printed sheets',
        'Lab comparison by real GPS distance, TAT, price, and accreditation',
        'Home collection with live phlebotomist map and ETA'
      ],
      roleAttribution: 'Patients & Family Members',
      mockupImage: '/assets/phone-nanoscan-result.png'
    },
    {
      id: 'doctor',
      label: 'Doctor app',
      tagline: 'Prescribe. Connect. Get results.',
      description: 'Connect with patients, send e-prescriptions and test recommendations straight to their account, receive signed reports the moment they are ready, and get credited for every referral.',
      keyHighlights: [
        'Two-way patient connections',
        'E-prescriptions with one-tap convert to a lab booking',
        'Referral ledger with per-doctor credits'
      ],
      roleAttribution: 'Attending Doctors & Partner Clinics',
      mockupImage: '/assets/tablet-lab-dashboard.png'
    },
    {
      id: 'lab',
      label: 'Lab app',
      tagline: 'Your lab. Your brand. Digitally front-doored.',
      description: 'Configure your per-insurer price list, B-code fees, home collection rate, MoMo and Orange Money numbers, and cashier access codes. Receive auto-generated invoices, verify payments, and issue lab-branded reports.',
      keyHighlights: [
        'Auto-generated batch invoices with insurance columns',
        'Cashier payment verification with a dedicated access code',
        'Lab-branded reports with QR to the audit chain'
      ],
      roleAttribution: 'Laboratory Owners & Directors',
      mockupImage: '/assets/tablet-report.png'
    }
  ]
};