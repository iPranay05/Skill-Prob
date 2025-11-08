'use client';
import Image from 'next/image';

export default function CTASection() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-100 rounded-xl overflow-hidden flex flex-col md:flex-row items-center">
          {/* Image Side */}
          <div className="w-full md:w-5/12 h-56 md:h-64 relative">
            <Image
              src="/SkillProbe/HomePage/Ready to Master New Skills Section/pexels-divinetechygirl-1181715.jpg"
              alt="People collaborating"
              fill
              className="object-cover"
            />
          </div>

          {/* Content Side */}
          <div className="w-full md:w-7/12 p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-black mb-3">
              Ready to Master New Skills?
            </h2>
            <p className="text-gray-700 text-sm mb-5 leading-relaxed">
              Join thousands of learners who are already advancing their careers with Skill Probe. Start with a free trial today!
            </p>
            <button className="bg-black text-white px-6 py-2.5 rounded-md font-semibold text-sm hover:bg-gray-800 transition-colors">
              Get started
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
