import React, { useState } from 'react';
import { Navbar } from '../../components/website/Navbar';
import { Hero } from '../../components/website/Hero';
import { PortalEntranceBanner } from '../../components/website/PortalEntranceBanner';
import { EcosystemSection } from '../../components/website/EcosystemSection';
import { ProblemSection } from '../../components/website/ProblemSection';
import { ProductShowcase } from '../../components/website/ProductShowcase';
import { WorkflowSection } from '../../components/website/WorkflowSection';
// import { HowToUseSection } from '../../components/website/HowToUseSection';
import { CameroonAfricaSection } from '../../components/website/CameroonAfricaSection';
import { ImpactSection } from '../../components/website/ImpactSection';
import { TractionSection } from '../../components/website/TractionSection';
import { FounderSection } from '../../components/website/FounderSection';
import { TeamSection } from '../../components/website/TeamSection';
import { WhyNanoLabsSection } from '../../components/website/WhyNanoLabsSection';
import { InvestorSection } from '../../components/website/InvestorSection';
import { FAQSection } from '../../components/website/FAQSection';
import { ContactSection } from '../../components/website/ContactSection';
import { FinalPortalCTA } from '../../components/website/FinalPortalCTA';
import { Footer } from '../../components/website/Footer';
import { LegalModals } from '../../components/website/LegalModals';

interface LandingPageProps {
  onGoToPortal: (roleHint?: 'patient' | 'doctor' | 'lab') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGoToPortal }) => {
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const handlePartnerClick = () => {
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] text-[#0B1F1D] font-sans flex flex-col selection:bg-[#14B8A6]/20 selection:text-[#0D3B38]">
      {/* 1. Top Navbar with smooth section anchor links and Portal Access */}
      <Navbar 
        onGoToPortal={() => onGoToPortal()}
        onOpenTerms={() => setLegalModal('terms')}
        onOpenPrivacy={() => setLegalModal('privacy')}
      />

      {/* 2. Hero with Modern Chic UI & Sleek iPhone Frame for Search, Lab Selection & Split */}
      <Hero onGoToPortal={() => onGoToPortal()} />

      {/* 3. Portal Entrance Banner */}
      <PortalEntranceBanner onGoToPortal={() => onGoToPortal()} />

      {/* 4. Ecosystem Interconnection Section */}
      <EcosystemSection onGoToPortal={() => onGoToPortal()} />

      {/* 5. Cameroon & African Diagnostic Challenges / Problem Section */}
      <ProblemSection onGoToPortal={() => onGoToPortal()} />

      {/* 6. Comprehensive Product Showcase */}
      <ProductShowcase onGoToPortal={() => onGoToPortal()} />

      {/* 7. Core 6-Step Diagnostic Movement Workflow (Search -> See Labs -> Select & Split -> Dispatch -> Report) */}
      <WorkflowSection onGoToPortal={() => onGoToPortal()} />

      {/* 7.5 Interactive How-To-Use Guide with Step-by-Step Cards & Quick Help Widget */}
      {/* <HowToUseSection onGoToPortal={onGoToPortal} /> */}

      {/* 8. Built for Cameroon & African Clinical Realities */}
      <CameroonAfricaSection />

      {/* 9. Multi-Stakeholder Healthcare Impact */}
      <ImpactSection />

      {/* 10. Startup Traction, Milestones & Roadmap */}
      <TractionSection />

      {/* 11. Founder Story & Vision */}
      <FounderSection />

      {/* 12. Multidisciplinary Technical & Clinical Governance Team */}
      <TeamSection />

      {/* 13. Why Choose NanoLabs */}
      <WhyNanoLabsSection onGoToPortal={() => onGoToPortal()} />

      {/* 14. Investor & Strategic Partnerships */}
      <InvestorSection onPartnerClick={handlePartnerClick} />

      {/* 15. Frequently Asked Questions */}
      <FAQSection onGoToPortal={() => onGoToPortal()} />

      {/* 16. Contact & Laboratory Onboarding Inquiry */}
      <ContactSection />

      {/* 17. Final High-Impact Portal Call-to-Action */}
      <FinalPortalCTA onGoToPortal={() => onGoToPortal()} />

      {/* 18. Website Footer */}
      <Footer 
        onGoToPortal={() => onGoToPortal()}
        onOpenTerms={() => setLegalModal('terms')}
        onOpenPrivacy={() => setLegalModal('privacy')}
      />

      {/* 19. Legal Terms & Privacy Modals */}
      <LegalModals
        isOpen={legalModal !== null}
        onClose={() => setLegalModal(null)}
        type={legalModal || 'terms'}
      />
    </div>
  );
};

export default LandingPage;

