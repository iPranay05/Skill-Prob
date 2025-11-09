'use client';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function WhosUsingSkillprobe() {
  const stakeholders = [
    {
      title: 'Students',
      description: 'Compete. Grow. Get Hired.',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&h=400&fit=crop',
      link: '#'
    },
    {
      title: 'Companies and Recruiters',
      description: 'Find. Engage. Recruit Differently.',
      image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=400&fit=crop',
      link: '#'
    },
    {
      title: 'Colleges',
      description: 'Connecting Classrooms to Careers.',
      image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&h=400&fit=crop',
      link: '#'
    }
  ];

  return (
    <section className="py-10 md:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
            Who's Using Skillprobe?
          </h2>
          <p className="text-gray-600 text-sm md:text-base lg:text-lg">
            Empowering Every Stakeholder in the Education Ecosystem.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stakeholders.map((stakeholder, index) => (
            <div
              key={index}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-150 group"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={stakeholder.image}
                  alt={stakeholder.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {stakeholder.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {stakeholder.description}
                </p>

                {/* Learn More Link */}
                <a
                  href={stakeholder.link}
                  className="inline-flex items-center text-sm font-semibold text-gray-900 hover:text-primary transition-colors duration-150 group"
                >
                  Learn More
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-150" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
