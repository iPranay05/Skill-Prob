'use client';
import CareerServices from '@/components/CareerServices';
import WhyChooseUs from '@/components/WhyChooseUs';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import CampusAmbassadorSection from '@/components/CampusAmbassadorSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import TopMentorsSection from '@/components/TopMentorsSection';
import CTASection from '@/components/CTASection';
import StatsSection from '@/components/StatsSection';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-black overflow-hidden">
      <HeroSection />
      <CareerServices />
      <WhyChooseUs />
      <CampusAmbassadorSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <TopMentorsSection />
      <CTASection />
      <StatsSection />
      <Footer />
    </div>
  );
}
