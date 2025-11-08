'use client';
import Link from 'next/link';

export default function CareerServices() {
  const services = [
    {
      title: 'Resume Review',
      description: 'Get expert feedback on your resume',
      icon: '📄',
      image: 'SkillProbe/HomePage/Accelerate Your Career Growth Section/Resume Review.png',
    },
    {
      title: 'LinkedIn Boost',
      description: 'Transform your LinkedIn profile',
      icon: 'in',
      iconBg: 'bg-blue-600',
      image: '/SkillProbe/HomePage/Accelerate Your Career Growth Section/LinkedIn Boost.png',
    },
    {
      title: 'Interview Prep',
      description: 'Quick interview preparation',
      icon: '💼',
      image: '/SkillProbe/HomePage/Accelerate Your Career Growth Section/Interview Prep.jpg',
    },
    {
      title: '1-on-1 Counseling',
      description: 'Personalized career guidance',
      icon: '👥',
      image: '/SkillProbe/HomePage/Accelerate Your Career Growth Section/1-on-1 Counseling.jpg',
    },
  ];

  return (
    <section className="bg-white py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Accelerate Your Career Growth.
          </h2>
          <p className="text-base text-gray-600">
            Get personalized career services from industry experts to land your dream job faster.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon/Image */}
              <div className="mb-3">
                {service.image ? (
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : service.iconBg ? (
                  <div className={`w-12 h-12 ${service.iconBg} rounded-lg flex items-center justify-center`}>
                    <span className="text-white text-lg font-bold">{service.icon}</span>
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">{service.icon}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <h3 className="text-base font-bold text-gray-900 mb-1">
                {service.title}
              </h3>
              <p className="text-gray-600 text-xs mb-3">
                {service.description}
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
          ))}
        </div>
      </div>
    </section>
  );
}
