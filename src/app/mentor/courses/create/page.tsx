'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CourseType, SubscriptionType } from '../../../../models/Course';

interface CourseFormData {
  title: string;
  description: string;
  short_description: string;
  category_id: string;
  tags: string[];
  type: CourseType;
  pricing: {
    amount: number;
    currency: string;
    subscriptionType: SubscriptionType;
  };
  content: {
    syllabus: string[];
    prerequisites: string[];
    learningOutcomes: string[];
  };
  media: {
    thumbnail?: string;
    trailer?: string;
  };
  enrollment: {
    maxStudents?: number;
  };
  meta_title?: string;
  meta_description?: string;
}

export default function CreateCourse() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingTrailer, setUploadingTrailer] = useState(false);
  const [categories, setCategories] = useState<{ id: string, name: string, description?: string, count: number }[]>([]);

  useEffect(() => {
    // Check authentication on component load
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchCategories();
  }, [router]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Fetching categories...');
      const response = await fetch('/api/courses/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Categories response status:', response.status);

      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('Categories data:', data);
        setCategories(data.data || []);
      } else {
        const errorData = await response.json();
        console.error('Categories API error:', errorData);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    short_description: '',
    category_id: '',
    tags: [],
    type: CourseType.RECORDED,
    pricing: {
      amount: 0,
      currency: 'INR',
      subscriptionType: SubscriptionType.ONE_TIME
    },
    content: {
      syllabus: [''],
      prerequisites: [''],
      learningOutcomes: ['']
    },
    media: {},
    enrollment: {},
    meta_title: '',
    meta_description: ''
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    } as CourseFormData));
  };

  const handleNestedInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof CourseFormData] as any),
        [field]: value
      }
    } as CourseFormData));
  };

  const handleArrayInputChange = (section: string, field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof CourseFormData] as any),
        [field]: ((prev[section as keyof CourseFormData] as any)[field] as string[]).map((item: string, i: number) =>
          i === index ? value : item
        )
      }
    } as CourseFormData));
  };

  const addArrayItem = (section: string, field: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof CourseFormData] as any),
        [field]: [...((prev[section as keyof CourseFormData] as any)[field] as string[]), '']
      }
    } as CourseFormData));
  };

  const removeArrayItem = (section: string, field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof CourseFormData] as any),
        [field]: ((prev[section as keyof CourseFormData] as any)[field] as string[]).filter((_: any, i: number) => i !== index)
      }
    } as CourseFormData));
  };

  const handleTagInput = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    handleInputChange('tags', tags);
  };

  const handleFileUpload = async (file: File, type: 'thumbnail' | 'trailer') => {
    if (type === 'thumbnail') setUploadingThumbnail(true);
    if (type === 'trailer') setUploadingTrailer(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/upload/course-media', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();

      handleNestedInputChange('media', type, result.data.url);

    } catch (err) {
      setError(`Failed to upload ${type}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      if (type === 'thumbnail') setUploadingThumbnail(false);
      if (type === 'trailer') setUploadingTrailer(false);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.title && formData.description && formData.category_id);
      case 2:
        return formData.content.syllabus.some(item => item.trim()) &&
          formData.content.learningOutcomes.some(item => item.trim());
      case 3:
        return formData.pricing.amount >= 0;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      setError(null);
    } else {
      setError('Please fill in all required fields before proceeding');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check authentication
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('Please login to continue');
      router.push('/auth/login');
      return;
    }

    // Client-side validation
    if (formData.description.length < 10) {
      setError('Description must be at least 10 characters long');
      return;
    }

    if (!formData.title.trim()) {
      setError('Course title is required');
      return;
    }

    if (!formData.category_id) {
      setError('Please select a category');
      return;
    }

    console.log('Form data before submission:', formData);

    setLoading(true);

    try {
      // Clean up empty array items
      const cleanedFormData = {
        ...formData,
        content: {
          syllabus: formData.content.syllabus.filter(item => item.trim()),
          prerequisites: formData.content.prerequisites.filter(item => item.trim()),
          learningOutcomes: formData.content.learningOutcomes.filter(item => item.trim())
        }
      };

      console.log('Sending form data:', cleanedFormData);

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cleanedFormData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError('Session expired. Please login again.');
          localStorage.removeItem('accessToken');
          router.push('/auth/login');
          return;
        }

        const errorData = await response.json();
        console.error('Course creation error:', errorData);
        console.error('Form data sent:', cleanedFormData);

        // Show more specific error message
        if (response.status === 400) {
          setError(`Validation error: ${errorData.error || 'Please check all required fields'}`);
        } else {
          setError(errorData.error || 'Failed to create course');
        }
        return;
      }

      const result = await response.json();

      // Redirect to course management or dashboard
      router.push(`/mentor/courses/${result.data.id}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Course Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          placeholder="Enter course title"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Short Description
        </label>
        <input
          type="text"
          value={formData.short_description}
          onChange={(e) => handleInputChange('short_description', e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          placeholder="Brief description for course cards"
          maxLength={500}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={6}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          placeholder="Detailed course description (minimum 10 characters)"
          required
          minLength={10}
        />
        {formData.description.length > 0 && formData.description.length < 10 && (
          <p className="text-red-500 text-sm mt-1">
            Description must be at least 10 characters long ({formData.description.length}/10)
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={formData.category_id}
            onChange={(e) => handleInputChange('category_id', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            required
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleInputChange('type', e.target.value as CourseType)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value={CourseType.RECORDED}>Recorded</option>
            <option value={CourseType.LIVE}>Live</option>
            <option value={CourseType.HYBRID}>Hybrid</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          value={formData.tags.join(', ')}
          onChange={(e) => handleTagInput(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          placeholder="React, JavaScript, Web Development"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Course Content</h3>

      {/* Syllabus */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Course Syllabus *
        </label>
        {formData.content.syllabus.map((item, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <input
              type="text"
              value={item}
              onChange={(e) => handleArrayInputChange('content', 'syllabus', index, e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder={`Topic ${index + 1}`}
            />
            {formData.content.syllabus.length > 1 && (
              <button
                type="button"
                onClick={() => removeArrayItem('content', 'syllabus', index)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem('content', 'syllabus')}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          + Add Topic
        </button>
      </div>

      {/* Prerequisites */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prerequisites
        </label>
        {formData.content.prerequisites.map((item, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <input
              type="text"
              value={item}
              onChange={(e) => handleArrayInputChange('content', 'prerequisites', index, e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder={`Prerequisite ${index + 1}`}
            />
            {formData.content.prerequisites.length > 1 && (
              <button
                type="button"
                onClick={() => removeArrayItem('content', 'prerequisites', index)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem('content', 'prerequisites')}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          + Add Prerequisite
        </button>
      </div>

      {/* Learning Outcomes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Learning Outcomes *
        </label>
        {formData.content.learningOutcomes.map((item, index) => (
          <div key={index} className="flex items-center space-x-2 mb-2">
            <input
              type="text"
              value={item}
              onChange={(e) => handleArrayInputChange('content', 'learningOutcomes', index, e.target.value)}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder={`Learning outcome ${index + 1}`}
            />
            {formData.content.learningOutcomes.length > 1 && (
              <button
                type="button"
                onClick={() => removeArrayItem('content', 'learningOutcomes', index)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => addArrayItem('content', 'learningOutcomes')}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          + Add Learning Outcome
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Pricing & Enrollment</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (₹)
          </label>
          <input
            type="number"
            min="0"
            value={formData.pricing.amount}
            onChange={(e) => handleNestedInputChange('pricing', 'amount', parseFloat(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={formData.pricing.currency}
            onChange={(e) => handleNestedInputChange('pricing', 'currency', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subscription Type
          </label>
          <select
            value={formData.pricing.subscriptionType}
            onChange={(e) => handleNestedInputChange('pricing', 'subscriptionType', e.target.value as SubscriptionType)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value={SubscriptionType.ONE_TIME}>One-time Payment</option>
            <option value={SubscriptionType.MONTHLY}>Monthly Subscription</option>
            <option value={SubscriptionType.YEARLY}>Yearly Subscription</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Maximum Students (Optional)
        </label>
        <input
          type="number"
          min="1"
          value={formData.enrollment.maxStudents || ''}
          onChange={(e) => handleNestedInputChange('enrollment', 'maxStudents', e.target.value ? parseInt(e.target.value) : undefined)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Leave empty for unlimited"
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Media & SEO</h3>

      {/* Thumbnail Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Course Thumbnail
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          {formData.media.thumbnail ? (
            <div className="text-center">
              <img
                src={formData.media.thumbnail}
                alt="Thumbnail preview"
                className="mx-auto h-32 w-48 object-cover rounded-lg mb-4"
              />
              <button
                type="button"
                onClick={() => handleNestedInputChange('media', 'thumbnail', undefined)}
                className="text-red-600 hover:text-red-800"
              >
                Remove Thumbnail
              </button>
            </div>
          ) : (
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="mt-4">
                <label htmlFor="thumbnail-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    {uploadingThumbnail ? 'Uploading...' : 'Upload thumbnail'}
                  </span>
                  <input
                    id="thumbnail-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'thumbnail');
                    }}
                    disabled={uploadingThumbnail}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trailer Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Course Trailer (Optional)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          {formData.media.trailer ? (
            <div className="text-center">
              <video
                src={formData.media.trailer}
                controls
                className="mx-auto h-32 w-48 rounded-lg mb-4"
              />
              <button
                type="button"
                onClick={() => handleNestedInputChange('media', 'trailer', undefined)}
                className="text-red-600 hover:text-red-800"
              >
                Remove Trailer
              </button>
            </div>
          ) : (
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <div className="mt-4">
                <label htmlFor="trailer-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    {uploadingTrailer ? 'Uploading...' : 'Upload trailer video'}
                  </span>
                  <input
                    id="trailer-upload"
                    type="file"
                    className="sr-only"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'trailer');
                    }}
                    disabled={uploadingTrailer}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SEO Fields */}
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SEO Title
          </label>
          <input
            type="text"
            value={formData.meta_title || ''}
            onChange={(e) => handleInputChange('meta_title', e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="SEO optimized title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SEO Description
          </label>
          <textarea
            value={formData.meta_description || ''}
            onChange={(e) => handleInputChange('meta_description', e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="SEO meta description"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
          <p className="text-gray-600 mt-2">Fill in the details to create your course</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
                  }`}>
                  {step}
                </div>
                <div className={`ml-2 text-sm font-medium ${step <= currentStep ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                  {step === 1 && 'Basic Info'}
                  {step === 2 && 'Content'}
                  {step === 3 && 'Pricing'}
                  {step === 4 && 'Media & SEO'}
                </div>
                {step < 4 && (
                  <div className={`ml-4 w-16 h-0.5 ${step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Course...' : 'Create Course'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}