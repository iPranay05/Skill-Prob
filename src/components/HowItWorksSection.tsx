'use client';
import { useState } from 'react';

export default function HowItWorksSection() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'Choose Your Course',
      description: 'Browse through 500+ courses across multiple categories. Filter by type (live/recorded), price, ratings, and mentor expertise to find your perfect match.',
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=500&fit=crop',
    },
    {
      num: '02',
      title: 'Learn & Practice',
      description: 'Attend live interactive sessions or watch recorded content. Complete assignments, take quizzes, and work on real-world projects with expert guidance.',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=500&fit=crop',
    },
    {
      num: '03',
      title: 'Get Certified & Hired',
      description: 'Earn your certification and apply to exclusive internships. Showcase your skills and kickstart your career with confidence and industry recognition.',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&h=500&fit=crop',
    },
  ];

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % steps.length);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  return (
    <section className="bg-white py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-8">
          {/* Left Side - Image */}
          <div className="relative h-[400px] rounded-2xl overflow-hidden">
            <img
              src={steps[currentStep].image}
              alt={steps[currentStep].title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right Side - Content */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Start Your Learning Journey
              </h2>
              <p className="text-base text-gray-600">
                Master new skills in just 3 simple steps
              </p>
            </div>

            {/* Step Number */}
            <div className="text-5xl font-bold text-gray-900">
              {steps[currentStep].num}
            </div>

            {/* Step Content */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {steps[currentStep].title}
              </h3>
              <p className="text-base text-gray-600 leading-relaxed">
                {steps[currentStep].description}
              </p>
            </div>

            {/* Read More Link */}
            <button className="inline-flex items-center text-sm font-semibold text-gray-900 hover:text-primary transition-colors">
              Read more
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center gap-4">
          {/* Previous Button */}
          <button
            onClick={prevStep}
            className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Step Indicator */}
          <span className="text-sm font-semibold text-gray-900">
            {currentStep + 1}/3
          </span>

          {/* Next Button */}
          <button
            onClick={nextStep}
            className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
