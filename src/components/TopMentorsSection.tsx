'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface Mentor {
  id: number;
  name: string;
  title: string;
  company: string;
  category: string;
  rating: number;
  image: string;
}

const mentors: Mentor[] = [
  {
    id: 1,
    name: 'A. Mehta',
    title: 'Senior Software Engineer',
    company: 'Microsoft',
    category: 'Software Development Mentor',
    rating: 4.7,
    image: '/SkillProbe/HomePage/TopMentorsSection/img1.jpg'
  },
  {
    id: 2,
    name: 'P. Nair',
    title: 'Data Scientist',
    company: 'Deloitte',
    category: 'Data Science Mentor',
    rating: 4.8,
    image: '/SkillProbe/HomePage/TopMentorsSection/img2.jpg'
  },
  {
    id: 3,
    name: 'N. Sharma',
    title: 'Career Coach & Leadership Consultant',
    company: '',
    category: 'Career Coach',
    rating: 4.9,
    image: '/SkillProbe/HomePage/TopMentorsSection/img3.webp'
  },
  {
    id: 4,
    name: 'R. Kumar',
    title: 'Product Manager',
    company: 'Google',
    category: 'Product Management Mentor',
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop'
  }
];

export default function TopMentorsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsToShow = 3;

  const nextSlide = () => {
    setCurrentIndex((prev) => 
      prev + cardsToShow >= mentors.length ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? Math.max(0, mentors.length - cardsToShow) : prev - 1
    );
  };

  const visibleMentors = mentors.slice(currentIndex, currentIndex + cardsToShow);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-2">
            Top Mentors.
          </h2>
          <p className="text-gray-600 text-base">
            Learn from industry experts and leaders shaping the future.
          </p>
        </div>

        <div className="relative">
          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black rounded-full hover:bg-gray-800 transition-colors"
            aria-label="Previous mentors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black rounded-full hover:bg-gray-800 transition-colors"
            aria-label="Next mentors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Mentor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleMentors.map((mentor) => (
              <div
                key={mentor.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex"
              >
                {/* Mentor Image - Left Side */}
                <div className="w-40 h-full flex-shrink-0 relative">
                  <Image
                    src={mentor.image}
                    alt={mentor.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Mentor Info - Right Side */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-black text-sm mb-2 leading-tight">
                      {mentor.category}
                    </h3>
                    <div className="flex items-center gap-1 mb-4">
                      <span className="text-yellow-400 text-base">★</span>
                      <span className="text-gray-800 font-semibold text-sm">
                        {mentor.rating}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="font-bold text-black text-base mb-1">
                      {mentor.name}
                    </p>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      {mentor.title}
                      {mentor.company && ` at ${mentor.company}`}
                    </p>
                  </div>

                  {/* Learn More Button */}
                  <button className="flex items-center gap-2 text-black font-semibold text-sm hover:gap-3 transition-all self-start">
                    Learn More
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
