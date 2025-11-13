'use client';
import CareerServices from '@/components/CareerServices';
import HiringPartners from '@/components/HiringPartners';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import TestimonialsSection from '@/components/TestimonialsSection';

import CTASection from '@/components/CTASection';
import StatsSection from '@/components/StatsSection';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-black overflow-hidden">
      <HeroSection />
      <CareerServices />
      <HiringPartners />
      <HowItWorksSection />
      <TestimonialsSection />
  
      <CTASection />
      <StatsSection />
      <Footer />
    </div>
  );
}
