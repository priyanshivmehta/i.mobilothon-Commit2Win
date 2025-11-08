'use client';

import { useEffect } from 'react';
import Hero from './components/Hero';
import ProblemStatement from './components/ProblemStatement';
import SolutionOverview from './components/SolutionOverview';
import HowItWorks from './components/HowItWorks';
import TechnologyShowcase from './components/TechnologyShowcase';
import UserTypes from './components/UserTypes';
import LiveStats from './components/LiveStats';
import PrivacyCommitment from './components/PrivacyCommitment';
import FAQ from './components/FAQ';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';

export default function LandingPage() {
  useEffect(() => {
    document.title = 'VW Driver Attention Platform - Privacy-First Fleet Safety';
  }, []);

  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <ProblemStatement />
      <SolutionOverview />
      <HowItWorks />
      <TechnologyShowcase />
      <UserTypes />
      <LiveStats />
      <PrivacyCommitment />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
