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
import { FounderSection } from '../../components/website/FounderSection';
import { TeamSection } from '../../components/website/TeamSection';
import { WhyNanoLabsSection } from '../../components/website/WhyNanoLabsSection';
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

  return (
    <div className="min-h-screen bg-white text-[#0B1F1D] font-sans flex flex-col">
      <Navbar
        onGoToPortal={onGoToPortal}
        onOpenTerms={() => setLegalModal('terms')}
        onOpenPrivacy={() => setLegalModal('privacy')}
      />

      <main>
        <Hero onGoToPortal={onGoToPortal} />
        <PortalEntranceBanner onGoToPortal={onGoToPortal} />
        <EcosystemSection onGoToPortal={onGoToPortal} />
        <ProblemSection onGoToPortal={onGoToPortal} />
        <ProductShowcase onGoToPortal={onGoToPortal} />
        <WorkflowSection onGoToPortal={onGoToPortal} />
        <CameroonAfricaSection />
        <ImpactSection />
        <FounderSection />
        <TeamSection />
        <WhyNanoLabsSection onGoToPortal={onGoToPortal} />
        <FAQSection onGoToPortal={onGoToPortal} />
        <ContactSection />
        <FinalPortalCTA onGoToPortal={onGoToPortal} />
      </main>

      <Footer
        onGoToPortal={onGoToPortal}
        onOpenTerms={() => setLegalModal('terms')}
        onOpenPrivacy={() => setLegalModal('privacy')}
      />

      <LegalModals
        isOpen={legalModal !== null}
        onClose={() => setLegalModal(null)}
        type={legalModal || 'privacy'}
      />
    </div>
  );
};

export default LandingPage;