'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authenticatedFetch, getCurrentUser } from '@/lib/clientAuth';

interface OAuthStep {
    id: number;
    title: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed' | 'error';
}

export default function MentorOAuthSetupPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isAuthenticating, setIsAuthenticating] = useState(true);
    const router = useRouter();

    // Save state to localStorage whenever it changes
    const updateCurrentStep = (step: number) => {
        setCurrentStep(step);
        if (typeof window !== 'undefined') {
            localStorage.setItem('oauth-setup-step', step.toString());
        }
    };

    const updateFormData = (newData: Partial<typeof formData>) => {
        const updated = { ...formData, ...newData };
        setFormData(updated);
        if (typeof window !== 'undefined') {
            localStorage.setItem('oauth-setup-data', JSON.stringify(updated));
        }
    };

    const [formData, setFormData] = useState({
        projectId: '',
        clientId: '',
        clientSecret: '',
        authCode: '',
    });

    const [baseUrl, setBaseUrl] = useState('http://localhost:3000');

    // Auto-detect project ID from URL if user comes back from Google Cloud Console
    useEffect(() => {
        // Set base URL from window location
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin);
        }

        const urlParams = new URLSearchParams(window.location.search);
        const projectFromUrl = urlParams.get('project');
        if (projectFromUrl && !formData.projectId) {
            setFormData(prev => ({ ...prev, projectId: projectFromUrl }));
        }
    }, []);

    const [steps, setSteps] = useState<OAuthStep[]>([
        {
            id: 1,
            title: 'Create Google Cloud Project',
            description: 'Set up a new project in Google Cloud Console',
            status: 'in-progress'
        },
        {
            id: 2,
            title: 'Enable Calendar API',
            description: 'Enable Google Calendar API for your project',
            status: 'pending'
        },
        {
            id: 3,
            title: 'Create OAuth Credentials',
            description: 'Generate OAuth 2.0 Client ID and Secret',
            status: 'pending'
        },
        {
            id: 4,
            title: 'Get Authorization Code',
            description: 'Authorize your application to access Google Calendar',
            status: 'pending'
        },
        {
            id: 5,
            title: 'Complete Setup',
            description: 'Save your credentials and test the integration',
            status: 'pending'
        }
    ]);

    useEffect(() => {
        checkAuthAndSetup();
    }, []);

    const checkAuthAndSetup = async () => {
        try {
            setIsAuthenticating(true);

            // Restore state from localStorage
            if (typeof window !== 'undefined') {
                const savedStep = localStorage.getItem('oauth-setup-step');
                const savedData = localStorage.getItem('oauth-setup-data');

                if (savedStep) {
                    setCurrentStep(parseInt(savedStep));
                }

                if (savedData) {
                    try {
                        const parsedData = JSON.parse(savedData);
                        setFormData(parsedData);
                    } catch (e) {
                        console.warn('Failed to parse saved OAuth data');
                    }
                }
            }

            // Check if user is logged in and is a mentor
            const user = await getCurrentUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }

            if (user.role !== 'mentor') {
                setError('Access denied. Only mentors can set up OAuth.');
                setIsAuthenticating(false);
                return;
            }

            // If authenticated, check existing setup
            await checkExistingSetup();
            setIsAuthenticating(false);
        } catch (error) {
            console.error('Auth check failed:', error);
            router.push('/auth/login');
        }
    };

    const checkExistingSetup = async () => {
        try {
            const response = await authenticatedFetch('/api/mentor/oauth/status');
            if (response.ok) {
                const data = await response.json();
                if (data.hasSetup) {
                    // User already has OAuth setup
                    updateCurrentStep(6); // Show completion step
                    updateStepStatus(5, 'completed');
                }
            } else if (response.status === 401) {
                // Token expired or invalid, redirect to login
                router.push('/auth/login');
            }
        } catch (error) {
            console.error('Error checking OAuth status:', error);
            if (error instanceof Error && error.message === 'No access token available') {
                router.push('/auth/login');
            }
        }
    };

    const updateStepStatus = (stepId: number, status: OAuthStep['status']) => {
        setSteps(prev => prev.map(step =>
            step.id === stepId ? { ...step, status } : step
        ));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        updateFormData({ [name]: value });
    };

    const handleStepComplete = async (stepId: number) => {
        setLoading(true);
        setError('');

        try {
            // Check if user is still authenticated
            const user = await getCurrentUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }
            switch (stepId) {
                case 1:
                    // Project ID validation
                    if (!formData.projectId.trim()) {
                        setError('Please enter your Google Cloud Project ID');
                        return;
                    }
                    updateStepStatus(1, 'completed');
                    updateStepStatus(2, 'in-progress');
                    updateCurrentStep(2);
                    break;

                case 2:
                    // Enable API step - just move to next
                    updateStepStatus(2, 'completed');
                    updateStepStatus(3, 'in-progress');
                    updateCurrentStep(3);
                    break;

                case 3:
                    // OAuth credentials validation
                    if (!formData.clientId.trim() || !formData.clientSecret.trim()) {
                        setError('Please enter both Client ID and Client Secret');
                        return;
                    }

                    // Validate Client ID format
                    if (!formData.clientId.includes('.apps.googleusercontent.com')) {
                        setError('Invalid Client ID format. It should end with .apps.googleusercontent.com');
                        return;
                    }

                    // Validate Client Secret format
                    if (!formData.clientSecret.startsWith('GOCSPX-')) {
                        setError('Invalid Client Secret format. It should start with GOCSPX-');
                        return;
                    }

                    // Save credentials to backend
                    const credentialsResponse = await authenticatedFetch('/api/mentor/oauth/credentials', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            projectId: formData.projectId,
                            clientId: formData.clientId,
                            clientSecret: formData.clientSecret
                        })
                    });

                    if (!credentialsResponse.ok) {
                        const errorData = await credentialsResponse.json();
                        setError(errorData.error || 'Failed to save credentials');
                        return;
                    }

                    updateStepStatus(3, 'completed');
                    updateStepStatus(4, 'in-progress');
                    updateCurrentStep(4);
                    break;

                case 4:
                    // Authorization code validation
                    if (!formData.authCode.trim()) {
                        setError('Please enter the authorization code');
                        return;
                    }

                    // Validate authorization code format (basic check)
                    if (formData.authCode.length < 10) {
                        setError('Authorization code seems too short. Please copy the complete code from the URL.');
                        return;
                    }

                    // Exchange auth code for tokens
                    const tokenResponse = await authenticatedFetch('/api/mentor/oauth/exchange', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            authCode: formData.authCode.trim()
                        })
                    });

                    if (!tokenResponse.ok) {
                        const errorData = await tokenResponse.json();
                        let errorMessage = 'Failed to exchange authorization code';
                        
                        if (tokenResponse.status === 400) {
                            errorMessage = 'Invalid authorization code. Please make sure you copied the complete code from the URL.';
                        } else if (tokenResponse.status === 401) {
                            errorMessage = 'Authorization expired. Please try the authorization process again.';
                        }
                        
                        setError(errorData.error || errorMessage);
                        return;
                    }

                    updateStepStatus(4, 'completed');
                    updateStepStatus(5, 'in-progress');
                    updateCurrentStep(5);
                    break;

                case 5:
                    // Test the setup
                    const testResponse = await authenticatedFetch('/api/mentor/oauth/test');

                    if (!testResponse.ok) {
                        const errorData = await testResponse.json();
                        setError(errorData.error || 'OAuth setup test failed');
                        return;
                    }

                    updateStepStatus(5, 'completed');
                    updateCurrentStep(6);
                    setSuccess('Google OAuth setup completed successfully!');

                    // Clear saved state since setup is complete
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('oauth-setup-step');
                        localStorage.removeItem('oauth-setup-data');
                    }
                    break;
            }
        } catch (error) {
            console.error('Error in step:', error);
            
            if (error instanceof Error) {
                if (error.message === 'No access token available') {
                    router.push('/auth/login');
                    return;
                } else if (error.message.includes('fetch')) {
                    setError('Network error. Please check your internet connection and try again.');
                } else {
                    setError(`Error: ${error.message}`);
                }
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const generateAuthUrl = async () => {
        try {
            const response = await authenticatedFetch('/api/mentor/oauth/auth-url');
            if (response.ok) {
                const data = await response.json();
                window.open(data.authUrl, '_blank');
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to generate authorization URL. Please check your credentials.');
            }
        } catch (error) {
            console.error('Error generating auth URL:', error);
            setError('Failed to generate authorization URL. Please ensure you have saved your OAuth credentials first.');
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-blue-900 mb-4">Step 1: Create Google Cloud Project</h3>
                            <div className="space-y-4">
                                <p className="text-blue-800">Follow these steps to create a new Google Cloud project:</p>
                                <div className="space-y-3">
                                    <p className="text-blue-800">We'll create your Google Cloud project automatically:</p>
                                    <div className="bg-white border border-blue-300 rounded p-4">
                                        <a
                                            href="https://console.cloud.google.com/projectcreate"
                                            target="_blank"
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                            Create New Google Cloud Project
                                        </a>
                                    </div>
                                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                                        <li>Enter project name (e.g., "my-mentoring-sessions")</li>
                                        <li>Click "Create" and wait for project creation</li>
                                        <li>Copy the Project ID from the dashboard</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2">
                                Google Cloud Project ID *
                            </label>
                            <input
                                type="text"
                                id="projectId"
                                name="projectId"
                                value={formData.projectId}
                                onChange={handleInputChange}
                                placeholder="e.g., my-mentoring-platform-123456"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleStepComplete(1)}
                                disabled={loading}
                                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
                            >
                                {loading ? 'Validating...' : 'Continue to Next Step'}
                            </button>

                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-2">Already have a Google Cloud project?</p>
                                <a
                                    href="https://console.cloud.google.com/home/dashboard"
                                    target="_blank"
                                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                    Go to your existing projects →
                                </a>
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-green-900 mb-4">Step 2: Enable Google Calendar API</h3>
                            <div className="space-y-4">
                                <p className="text-green-800">Enable the Google Calendar API for your project:</p>
                                <div className="space-y-3">
                                    <p className="text-green-800">Enable Google Calendar API with one click:</p>
                                    <div className="bg-white border border-green-300 rounded p-4">
                                        <a
                                            href={`https://console.cloud.google.com/apis/library/calendar-json.googleapis.com?project=${formData.projectId}`}
                                            target="_blank"
                                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Enable Google Calendar API
                                        </a>
                                    </div>
                                    <p className="text-sm text-green-700">
                                        This will open the Calendar API page for your project. Just click "Enable" on that page.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => handleStepComplete(2)}
                            disabled={loading}
                            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
                        >
                            API Enabled - Continue
                        </button>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-yellow-900 mb-4">Step 3: Create OAuth 2.0 Credentials</h3>
                            <div className="space-y-4">
                                <p className="text-yellow-800">Create OAuth credentials for your application:</p>
                                <div className="space-y-4">
                                    <p className="text-yellow-800">Create OAuth credentials with guided steps:</p>

                                    <div className="bg-white border border-yellow-300 rounded p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-yellow-800">Step 1: Configure OAuth Consent</span>
                                            <a
                                                href={`https://console.cloud.google.com/apis/credentials/consent?project=${formData.projectId}`}
                                                target="_blank"
                                                className="inline-flex items-center px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                                            >
                                                Configure Consent
                                            </a>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-yellow-800">Step 2: Create OAuth Credentials</span>
                                            <a
                                                href={`https://console.cloud.google.com/apis/credentials/oauthclient?project=${formData.projectId}`}
                                                target="_blank"
                                                className="inline-flex items-center px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
                                            >
                                                Create OAuth Client
                                            </a>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                        <p className="text-sm text-blue-800 font-medium mb-2">Important Settings:</p>
                                        <ul className="text-sm text-blue-700 space-y-1">
                                            <li>• Application type: <strong>Web application</strong></li>
                                            <li>• Authorized redirect URI: <code className="bg-white px-1 rounded">{baseUrl}/mentor/oauth/callback</code></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
                                    Client ID *
                                </label>
                                <input
                                    type="text"
                                    id="clientId"
                                    name="clientId"
                                    value={formData.clientId}
                                    onChange={handleInputChange}
                                    placeholder="123456789-abc.apps.googleusercontent.com"
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700 mb-2">
                                    Client Secret *
                                </label>
                                <input
                                    type="password"
                                    id="clientSecret"
                                    name="clientSecret"
                                    value={formData.clientSecret}
                                    onChange={handleInputChange}
                                    placeholder="GOCSPX-..."
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => handleStepComplete(3)}
                            disabled={loading}
                            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
                        >
                            {loading ? 'Saving Credentials...' : 'Save Credentials & Continue'}
                        </button>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-purple-900 mb-4">Step 4: Get Authorization Code</h3>
                            <div className="space-y-4">
                                <p className="text-purple-800">Authorize your application to access Google Calendar:</p>
                                <ol className="list-decimal list-inside space-y-2 text-purple-800">
                                    <li>Click the "Get Authorization Code" button below</li>
                                    <li>Sign in with your Google account</li>
                                    <li>Grant permission to access Google Calendar</li>
                                    <li>Copy the authorization code from the URL</li>
                                    <li>Paste it in the input field below</li>
                                </ol>
                            </div>
                        </div>

                        <button
                            onClick={generateAuthUrl}
                            className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 flex items-center justify-center space-x-2"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span>Get Authorization Code</span>
                        </button>

                        <div>
                            <label htmlFor="authCode" className="block text-sm font-medium text-gray-700 mb-2">
                                Authorization Code *
                            </label>
                            <input
                                type="text"
                                id="authCode"
                                name="authCode"
                                value={formData.authCode}
                                onChange={handleInputChange}
                                placeholder="Paste the authorization code here..."
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                The code will be in the URL after authorization: ...&code=YOUR_CODE_HERE
                            </p>
                        </div>

                        <button
                            onClick={() => handleStepComplete(4)}
                            disabled={loading}
                            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
                        >
                            {loading ? 'Exchanging Code...' : 'Exchange Code for Tokens'}
                        </button>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-6">
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-indigo-900 mb-4">Step 5: Test Your Setup</h3>
                            <p className="text-indigo-800">Let's test if your Google OAuth integration is working correctly.</p>
                        </div>

                        <button
                            onClick={() => handleStepComplete(5)}
                            disabled={loading}
                            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
                        >
                            {loading ? 'Testing Integration...' : 'Test Google Calendar Integration'}
                        </button>
                    </div>
                );

            case 6:
                return (
                    <div className="space-y-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-green-900 mb-2">Setup Complete!</h3>
                            <p className="text-green-800 mb-6">
                                Your Google OAuth integration is now configured. You can create live sessions with automatic Google Meet links.
                            </p>

                            <div className="flex justify-center space-x-4">
                                <Link
                                    href="/live-sessions/create"
                                    className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700"
                                >
                                    Create Live Session
                                </Link>
                                <Link
                                    href="/live-sessions"
                                    className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
                                >
                                    View All Sessions
                                </Link>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // Show loading screen while checking authentication
    if (isAuthenticating) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking authentication...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/live-sessions/create"
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium transition-colors mb-6"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Back to Create Session</span>
                    </Link>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    Google OAuth Setup
                                </h1>
                                <p className="text-gray-600">
                                    Connect your Google account to create Google Meet sessions
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Setup Progress</h2>
                        <div className="space-y-4">
                            {steps.map((step, index) => (
                                <div key={step.id} className="flex items-center space-x-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.status === 'completed' ? 'bg-green-100 text-green-600' :
                                        step.status === 'in-progress' ? 'bg-purple-100 text-purple-600' :
                                            step.status === 'error' ? 'bg-red-100 text-red-600' :
                                                'bg-gray-100 text-gray-400'
                                        }`}>
                                        {step.status === 'completed' ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <span className="text-sm font-medium">{step.id}</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`font-medium ${step.status === 'in-progress' ? 'text-purple-900' : 'text-gray-900'
                                            }`}>
                                            {step.title}
                                        </h3>
                                        <p className="text-sm text-gray-600">{step.description}</p>
                                    </div>
                                    {step.status === 'in-progress' && (
                                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Current Step Content */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    {renderStepContent()}

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
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

                    {success && (
                        <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-green-800">{success}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}