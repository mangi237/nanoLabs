import React, { useState } from 'react';
import { Navbar } from '../../components/website/Navbar';
import { Hero } from '../../components/website/Hero';
import { PortalEntranceBanner } from '../../components/website/PortalEntranceBanner';
import { EcosystemSection } from '../../components/website/EcosystemSection';
import { ProblemSection } from '../../components/website/ProblemSection';
import { ProductShowcase } from '../../components/website/ProductShowcase';
import { WorkflowSection } from '../../components/website/WorkflowSection';
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
  onGoToPortal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGoToPortal }) => {
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const scrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#07111F] text-white font-sans selection:bg-[#20C997] selection:text-slate-950">
      {/* 1. Sticky Navigation Bar with Direct Portal Access */}
      <Navbar onGoToPortal={onGoToPortal} />

      <main>
        {/* 2. Main Hero with Dynamic Visuals & Prominent "Go to Portal" Action */}
        <Hero onGoToPortal={onGoToPortal} />

        {/* 3. Strategic Quick Portal Entrance Banner */}
        <PortalEntranceBanner onGoToPortal={onGoToPortal} />

        {/* 4. One Connected Laboratory Ecosystem Section */}
        <EcosystemSection onGoToPortal={onGoToPortal} />

        {/* 5. Fragmented vs Unified Operational Challenge & Solution */}
        <ProblemSection onGoToPortal={onGoToPortal} />

        {/* 6. Comprehensive Product Showcase with 8 Interactive Clinical Workspaces */}
        <ProductShowcase onGoToPortal={onGoToPortal} />

        {/* 7. End-to-End Diagnostic 6-Step Workflow */}
        <WorkflowSection onGoToPortal={onGoToPortal} />

        {/* 8. Built around local reality: Cameroon & Africa Diagnostic Network */}
        <CameroonAfricaSection />

        {/* 9. Tangible Clinical & Operational Impact */}
        <ImpactSection />

        {/* 10. Startup Traction & Milestones */}
        <TractionSection />

        {/* 11. Founder Story & Philosophy */}
        <FounderSection />

        {/* 12. Team & Clinical Advisory Board */}
        <TeamSection />

        {/* 13. Why NanoLabs Section */}
        <WhyNanoLabsSection onGoToPortal={onGoToPortal} />

        {/* 14. Investor & Strategic Growth Section */}
        <InvestorSection onPartnerClick={scrollToContact} />

        {/* 15. Frequently Asked Questions */}
        <FAQSection onGoToPortal={onGoToPortal} />

        {/* 16. Contact & Partnership Section */}
        <ContactSection />

        {/* 17. Final Dramatic Portal Gateway */}
        <FinalPortalCTA onGoToPortal={onGoToPortal} />
      </main>

      {/* 18. Complete Footer with Cameroon Badge */}
      <Footer
        onGoToPortal={onGoToPortal}
        onOpenPrivacy={() => setLegalModal('privacy')}
        onOpenTerms={() => setLegalModal('terms')}
      />

      {/* Legal Modals */}
      <LegalModals
        isOpen={legalModal !== null}
        onClose={() => setLegalModal(null)}
        type={legalModal || 'privacy'}
      />
    </div>
  );
};

export default LandingPage;
