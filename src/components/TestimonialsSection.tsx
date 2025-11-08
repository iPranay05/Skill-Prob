'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  quote: string;
  image: string;
  rating: number;
  initials: string;
  bgColor: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'A.Singh',
    role: 'Software Engineer',
    company: 'Google',
    quote: 'Skill Probe transformed my journey from a confused student to landing my dream job at Google!',
    image: '/SkillProbe/HomePage/Real Success Stories Section/middle img.jpg',
    rating: 4,
    initials: 'AS',
    bgColor: 'bg-pink-500'
  },
  {
    id: 2,
    name: 'P.Sharma',
    role: 'Product Manager',
    company: 'Microsoft',
    quote: 'The mentorship program helped me transition from engineering to product management seamlessly.',
    image: '/SkillProbe/HomePage/Real Success Stories Section/right img.jpg',
    rating: 5,
    initials: 'PS',
    bgColor: 'bg-purple-500'
  },
  {
    id: 3,
    name: 'R.Verma',
    role: 'Data Scientist',
    company: 'Amazon',
    quote: 'Best investment in my career. The live sessions and personalized guidance were game-changers!',
    image: '/SkillProbe/HomePage/Real Success Stories Section/left img.jpg',
    rating: 5,
    initials: 'RV',
    bgColor: 'bg-blue-500'
  }
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];
  const prevIndex = (currentIndex - 1 + testimonials.length) % testimonials.length;
  const nextIndex = (currentIndex + 1) % testimonials.length;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-black mb-12">
          Real Success Stories.
        </h2>

        <div className="relative flex items-center justify-center">
          {/* Previous Testimonial (Blurred) */}
          <div className="hidden lg:block w-56 h-80 relative mr-6">
            <div className="relative w-full h-full rounded-lg overflow-hidden">
              <Image 
                src={testimonials[prevIndex].image} 
                alt={testimonials[prevIndex].name}
                fill
                className="object-cover opacity-40 blur-sm"
                style={{ filter: 'blur(4px) brightness(0.8)' }}
              />
              <div className="absolute inset-0 bg-purple-300 mix-blend-multiply opacity-60"></div>
            </div>
          </div>

          {/* Left Arrow */}
          <button
            onClick={prevTestimonial}
            className="absolute left-4 lg:left-44 z-10 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-6 h-6 text-black" />
          </button>

          {/* Current Testimonial */}
          <div className="flex flex-col md:flex-row items-stretch gap-0 max-w-3xl mx-8">
            {/* Image */}
            <div className="w-56 h-80 rounded-l-lg overflow-hidden flex-shrink-0 relative">
              <Image 
                src={currentTestimonial.image} 
                alt={currentTestimonial.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Testimonial Card */}
            <div className="bg-white rounded-r-lg shadow-xl p-8 flex flex-col justify-between w-96">
              <div>
                <div className="text-pink-500 text-6xl leading-none mb-4">"</div>
                
                <p className="text-gray-800 text-base mb-8 leading-relaxed">
                  {currentTestimonial.quote}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-12 h-12 ${currentTestimonial.bgColor} rounded-full flex items-center justify-center text-white font-bold text-base`}>
                    {currentTestimonial.initials}
                  </div>
                  
                  <div>
                    <h4 className="font-bold text-black text-base">{currentTestimonial.name}</h4>
                    <p className="text-gray-500 text-sm">
                      {currentTestimonial.role} @ {currentTestimonial.company}
                    </p>
                  </div>
                </div>

                {/* Star Rating */}
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-lg ${i < currentTestimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Arrow */}
          <button
            onClick={nextTestimonial}
            className="absolute right-4 lg:right-44 z-10 p-3 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-6 h-6 text-black" />
          </button>

          {/* Next Testimonial (Blurred) */}
          <div className="hidden lg:block w-56 h-80 relative ml-6">
            <div className="relative w-full h-full rounded-lg overflow-hidden">
              <Image 
                src={testimonials[nextIndex].image} 
                alt={testimonials[nextIndex].name}
                fill
                className="object-cover opacity-40 blur-sm"
                style={{ filter: 'blur(4px) brightness(0.8)' }}
              />
              <div className="absolute inset-0 bg-purple-300 mix-blend-multiply opacity-60"></div>
            </div>
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-pink-500 w-6' : 'bg-gray-300 w-2'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
