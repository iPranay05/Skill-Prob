'use client';
import Link from 'next/link';

export default function WhyChooseUs() {
  const categories = [
    {
      title: 'Students',
      description: 'Compete. Grow. Get Hired.',
      icon: '🎓',
      image: '/SkillProbe/HomePage/whychooseus/Students & Professionals.jpg',
    },
    {
      title: 'Companies and Recruiters',
      description: 'Find. Engage. Brand Differently.',
      icon: '💼',
      image: '/SkillProbe/HomePage/whychooseus/Companies & Recruiters.jpg',
    },
    {
      title: 'Colleges',
      description: 'Connecting Classrooms to Careers.',
      icon: '🏛️',
      image: '/SkillProbe/HomePage/whychooseus/Colleges.jpg',
    },
  ];

  return (
    <section className="bg-gray-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Who's Using Skillprobe<span className="text-primary">?</span>
          </h2>
          <p className="text-base text-gray-600">
            Empowering Every Stakeholder in the Education Ecosystem.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <div
              key={index}
              className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image */}
              <div className="relative h-40">
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {category.title}
                </h3>
                <p className="text-gray-600 text-xs mb-3">
                  {category.description}
                </p>

                {/* Learn More Link */}
                <Link
                  href="#"
                  className="inline-flex items-center text-xs font-semibold text-gray-900 hover:text-primary transition-colors"
                >
                  Learn More
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
