'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AboutPage() {
    const [activeTab, setActiveTab] = useState('mission');

    const stats = [
        { label: 'Active Students', value: '10,000+', icon: '👨‍🎓' },
        { label: 'Expert Mentors', value: '500+', icon: '👨‍🏫' },
        { label: 'Courses Available', value: '200+', icon: '📚' },
        { label: 'Success Rate', value: '95%', icon: '🎯' }
    ];

    const team = [
        {
            name: 'Sarah Johnson',
            role: 'CEO & Founder',
            image: '👩‍💼',
            bio: 'Former tech executive with 15+ years in EdTech innovation.'
        },
        {
            name: 'Michael Chen',
            role: 'CTO',
            image: '👨‍💻',
            bio: 'Full-stack architect passionate about scalable learning platforms.'
        },
        {
            name: 'Dr. Emily Rodriguez',
            role: 'Head of Curriculum',
            image: '👩‍🏫',
            bio: 'PhD in Education Technology with expertise in skill development.'
        },
        {
            name: 'David Kim',
            role: 'Head of Partnerships',
            image: '🤝',
            bio: 'Building bridges between education and industry for 10+ years.'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-purple-600 to-blue-600 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-5xl font-bold mb-6">About Skill Probe</h1>
                        <p className="text-xl max-w-3xl mx-auto leading-relaxed">
                            Empowering the next generation of professionals through innovative learning experiences,
                            expert mentorship, and real-world skill development.
                        </p>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-4xl mb-2">{stat.icon}</div>
                                <div className="text-3xl font-bold text-purple-600 mb-1">{stat.value}</div>
                                <div className="text-gray-600">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Content Tabs */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center mb-12">
                        <div className="bg-white rounded-xl p-2 shadow-lg">
                            {[
                                { id: 'mission', label: 'Our Mission' },
                                { id: 'story', label: 'Our Story' },
                                { id: 'values', label: 'Our Values' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${activeTab === tab.id
                                        ? 'bg-purple-600 text-white shadow-lg'
                                        : 'text-gray-600 hover:text-purple-600'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
                        {activeTab === 'mission' && (
                            <div className="text-center">
                                <h2 className="text-3xl font-bold mb-6 text-gray-800">Our Mission</h2>
                                <p className="text-lg text-gray-600 leading-relaxed max-w-4xl mx-auto">
                                    To bridge the gap between traditional education and industry demands by providing
                                    practical, hands-on learning experiences that prepare students for successful careers
                                    in technology and beyond. We believe in democratizing access to quality education
                                    and creating opportunities for everyone to unlock their potential.
                                </p>
                            </div>
                        )}

                        {activeTab === 'story' && (
                            <div>
                                <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Our Story</h2>
                                <div className="space-y-6 text-gray-600 leading-relaxed">
                                    <p>
                                        Skill Probe was born from a simple observation: there was a growing disconnect
                                        between what students learned in traditional educational settings and what
                                        employers actually needed in the workplace.
                                    </p>
                                    <p>
                                        Founded in 2020 by a team of educators and industry professionals, we set out
                                        to create a learning platform that would combine the best of both worlds -
                                        rigorous academic standards with practical, real-world applications.
                                    </p>
                                    <p>
                                        Today, we're proud to have helped thousands of students transition from
                                        learning to earning, with our graduates working at top companies worldwide.
                                        Our platform continues to evolve, incorporating the latest in educational
                                        technology and industry insights.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'values' && (
                            <div>
                                <h2 className="text-3xl font-bold mb-8 text-gray-800 text-center">Our Values</h2>
                                <div className="grid md:grid-cols-2 gap-8">
                                    {[
                                        {
                                            title: 'Excellence',
                                            description: 'We strive for the highest quality in everything we do, from course content to student support.',
                                            icon: '⭐'
                                        },
                                        {
                                            title: 'Innovation',
                                            description: 'We embrace new technologies and methodologies to enhance the learning experience.',
                                            icon: '💡'
                                        },
                                        {
                                            title: 'Accessibility',
                                            description: 'Quality education should be available to everyone, regardless of background or location.',
                                            icon: '🌍'
                                        },
                                        {
                                            title: 'Community',
                                            description: 'We foster a supportive environment where learners and mentors grow together.',
                                            icon: '🤝'
                                        }
                                    ].map((value, index) => (
                                        <div key={index} className="text-center p-6 rounded-xl bg-gray-50">
                                            <div className="text-4xl mb-4">{value.icon}</div>
                                            <h3 className="text-xl font-bold mb-3 text-gray-800">{value.title}</h3>
                                            <p className="text-gray-600">{value.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Meet Our Team</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {team.map((member, index) => (
                            <div key={index} className="text-center bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                                <div className="text-6xl mb-4">{member.image}</div>
                                <h3 className="text-xl font-bold mb-2 text-gray-800">{member.name}</h3>
                                <p className="text-purple-600 font-semibold mb-3">{member.role}</p>
                                <p className="text-gray-600 text-sm">{member.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold mb-6">Ready to Start Your Journey?</h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto">
                        Join thousands of students who have transformed their careers with Skill Probe.
                    </p>
                    <div className="space-x-4">
                        <Link
                            href="/auth/register"
                            className="bg-white text-purple-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors inline-block"
                        >
                            Get Started Today
                        </Link>
                        <Link
                            href="/courses"
                            className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-purple-600 transition-colors inline-block"
                        >
                            Explore Courses
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}