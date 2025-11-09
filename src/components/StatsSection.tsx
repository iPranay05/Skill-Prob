'use client';

interface Stat {
  value: string;
  label: string;
  color: string;
}

const stats: Stat[] = [
  {
    value: '500+',
    label: 'Courses Available',
    color: 'bg-gray-200'
  },
  {
    value: '10K+',
    label: 'Active Learners',
    color: 'bg-gray-200'
  },
  {
    value: '200+',
    label: 'Expert Mentors',
    color: 'bg-gray-200'
  },
  {
    value: '90%',
    label: 'Job Success Rate',
    color: 'bg-gray-200'
  }
];

export default function StatsSection() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-black text-center mb-10">
          Our Numbers.
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`${stat.color} rounded-lg p-6 text-center`}
            >
              <div className="text-3xl md:text-4xl font-bold text-black mb-1">
                {stat.value}
              </div>
              <div className="text-gray-700 text-xs md:text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
