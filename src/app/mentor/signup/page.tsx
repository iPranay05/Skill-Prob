'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MentorSignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        // Education
        degree: '',
        major: '',
        cgpa: '',
        university: '',
        startYear: '',
        endYear: '',
        // Professional
        skills: [] as string[],
        experience: '',
        linkedinUrl: '',
        motivation: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSkillToggle = (skill: string) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        console.log('🚀 Form submission started');
        console.log('📝 Form data:', formData);

        // Temporary alert for debugging
        alert('Form submitted! Check console for details.');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        // Validate skills selection
        if (formData.skills.length === 0) {
            setError('Please select at least one skill');
            setLoading(false);
            return;
        }

        // Validate required fields
        const requiredFields = ['firstName', 'lastName', 'email', 'password', 'degree', 'major', 'cgpa', 'university', 'startYear', 'endYear', 'experience', 'motivation'];
        for (const field of requiredFields) {
            if (!formData[field as keyof typeof formData]) {
                setError(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field`);
                setLoading(false);
                return;
            }
        }

        try {
            const requestBody = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone || undefined,
                password: formData.password,
                role: 'mentor',
                mentorInfo: {
                    // Education
                    degree: formData.degree,
                    major: formData.major,
                    cgpa: formData.cgpa,
                    university: formData.university,
                    startYear: formData.startYear,
                    endYear: formData.endYear,
                    // Professional
                    skills: formData.skills,
                    experience: formData.experience,
                    linkedinUrl: formData.linkedinUrl,
                    motivation: formData.motivation
                }
            };

            console.log('📤 Sending request:', requestBody);

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            console.log('📥 Response status:', response.status);
            console.log('📥 Response ok:', response.ok);

            const data = await response.json();
            console.log('📥 Response data:', data);

            if (response.ok) {
                setSuccess('Mentor application submitted successfully! Please check your email for verification.');
                setTimeout(() => {
                    router.push('/auth/verify-otp?email=' + encodeURIComponent(formData.email));
                }, 2000);
            } else {
                setError(data.error?.message || `Registration failed: ${response.status}`);
            }
        } catch (err) {
            console.error('❌ Network error:', err);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">

            <div className="max-w-2xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="mx-auto h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mb-6">
                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Become a Mentor
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Share your expertise, inspire students, and build a rewarding teaching career with Skill Probe
                    </p>
                </div>

                {/* Benefits Section */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Become a Mentor?</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            {
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                ),
                                title: "Earn Extra Income",
                                description: "Generate additional revenue by teaching what you love"
                            },
                            {
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                ),
                                title: "Impact Lives",
                                description: "Help students achieve their career goals and dreams"
                            },
                            {
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                ),
                                title: "Flexible Schedule",
                                description: "Teach on your own time with complete flexibility"
                            },
                            {
                                icon: (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                ),
                                title: "Build Your Brand",
                                description: "Establish yourself as an expert in your field"
                            }
                        ].map((benefit, index) => (
                            <div key={index} className="flex items-start space-x-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-primary">
                                    {benefit.icon}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Application Form */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Apply to Become a Mentor</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                    placeholder="Enter your first name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                    placeholder="Enter your last name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                    placeholder="Enter your email address"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                    placeholder="Enter your phone number"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                    placeholder="Create a password"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password *
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                    placeholder="Confirm your password"
                                    required
                                />
                            </div>
                        </div>

                        {/* Education Information */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Education Information</h3>

                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Degree *
                                        </label>
                                        <select
                                            name="degree"
                                            value={formData.degree}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                            required
                                        >
                                            <option value="">Select your degree</option>
                                            <option value="Bachelor's">Bachelor's</option>
                                            <option value="Master's">Master's</option>
                                            <option value="PhD">PhD</option>
                                            <option value="Diploma">Diploma</option>
                                            <option value="Certificate">Certificate</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Major/Field of Study *
                                        </label>
                                        <input
                                            type="text"
                                            name="major"
                                            value={formData.major}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                            placeholder="e.g., Computer Science, Engineering"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            CGPA/Percentage *
                                        </label>
                                        <input
                                            type="text"
                                            name="cgpa"
                                            value={formData.cgpa}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                            placeholder="e.g., 8.5 or 85%"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Start Year *
                                        </label>
                                        <select
                                            name="startYear"
                                            value={formData.startYear}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                            required
                                        >
                                            <option value="">Select year</option>
                                            {Array.from({ length: 30 }, (_, i) => {
                                                const year = new Date().getFullYear() - i;
                                                return <option key={year} value={year}>{year}</option>;
                                            })}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            End Year *
                                        </label>
                                        <select
                                            name="endYear"
                                            value={formData.endYear}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                            required
                                        >
                                            <option value="">Select year</option>
                                            {Array.from({ length: 30 }, (_, i) => {
                                                const year = new Date().getFullYear() - i + 10;
                                                return <option key={year} value={year}>{year}</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        University/Institution *
                                    </label>
                                    <input
                                        type="text"
                                        name="university"
                                        value={formData.university}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                        placeholder="Enter your university or institution name"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Professional Information */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Skills * (Select all that apply)
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                        {[
                                            'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Angular',
                                            'Vue.js', 'PHP', 'C++', 'C#', 'Ruby', 'Go', 'Swift', 'Kotlin',
                                            'HTML/CSS', 'TypeScript', 'SQL', 'MongoDB', 'PostgreSQL', 'MySQL',
                                            'AWS', 'Azure', 'Docker', 'Kubernetes', 'Git', 'Linux',
                                            'Machine Learning', 'Data Science', 'AI', 'UI/UX Design',
                                            'Digital Marketing', 'SEO', 'Content Writing', 'Project Management',
                                            'Business Analysis', 'DevOps', 'Cybersecurity', 'Blockchain'
                                        ].map((skill) => (
                                            <label key={skill} className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.skills.includes(skill)}
                                                    onChange={() => handleSkillToggle(skill)}
                                                    className="rounded border-gray-300 text-primary focus:ring-purple-500"
                                                />
                                                <span className="text-sm text-gray-700">{skill}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {formData.skills.length === 0 && (
                                        <p className="text-error text-sm mt-1">Please select at least one skill</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Years of Experience *
                                    </label>
                                    <select
                                        name="experience"
                                        value={formData.experience}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                        required
                                    >
                                        <option value="">Select experience level</option>
                                        <option value="0-1 years">0-1 years</option>
                                        <option value="1-2 years">1-2 years</option>
                                        <option value="3-5 years">3-5 years</option>
                                        <option value="6-10 years">6-10 years</option>
                                        <option value="10+ years">10+ years</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        LinkedIn Profile
                                    </label>
                                    <input
                                        type="url"
                                        name="linkedinUrl"
                                        value={formData.linkedinUrl}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                        placeholder="https://linkedin.com/in/yourprofile"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Why do you want to become a mentor? *
                                    </label>
                                    <textarea
                                        name="motivation"
                                        value={formData.motivation}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                        placeholder="Tell us about your motivation to teach and mentor students..."
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-error">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-secondary">{success}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Submitting Application...
                                    </div>
                                ) : (
                                    'Submit Mentor Application'
                                )}
                            </button>
                        </div>

                        {/* Terms */}
                        <div className="text-center text-sm text-gray-600">
                            By submitting this application, you agree to our{' '}
                            <Link href="/terms" className="text-primary hover:text-primary-light">
                                Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link href="/privacy" className="text-primary hover:text-primary-light">
                                Privacy Policy
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Already have account */}
                <div className="text-center mt-8">
                    <p className="text-gray-600">
                        Already have a mentor account?{' '}
                        <Link href="/auth/login" className="text-primary hover:text-primary-light font-medium">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}