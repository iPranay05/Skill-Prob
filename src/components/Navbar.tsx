'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      setShowDropdown(false);
      // Redirect to home page after logout
      window.location.href = '/';
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    
    switch (user.role) {
      case 'student':
        return '/student/dashboard';
      case 'mentor':
        return '/mentor/dashboard';
      case 'ambassador':
        return '/ambassador/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/student/dashboard';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <Image 
                src="/images/logo1.png" 
                alt="Skill Probe Logo" 
                width={150}
                height={150}
              
              />
          
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200">
              Homepage
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200">
              About Us
            </Link>
            <Link href="/courses" className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200">
              Courses
            </Link>
            <Link href="/for-students" className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200">
              For Students
            </Link>
            <Link href="/for-mentors" className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200">
              For Mentors
            </Link>
            <Link href="/for-ambassadors" className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200">
              For Ambassadors
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="flex items-center space-x-4">
                <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-24 h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-sm font-semibold">
                    {getInitials(user.name)}
                  </div>
                  <span className="font-medium text-gray-900">
                    {user.name}
                  </span>
                  <svg className={`w-4 h-4 text-gray-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                    <Link
                      href={getDashboardLink()}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/student/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      Profile
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  Sign In
                </Link>
                <Link href="/auth/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-4">
            <Link 
              href="/" 
              className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors" 
              onClick={() => setShowMobileMenu(false)}
            >
              Homepage
            </Link>
            <Link 
              href="/about" 
              className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors" 
              onClick={() => setShowMobileMenu(false)}
            >
              About Us
            </Link>
            <Link 
              href="/courses" 
              className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors" 
              onClick={() => setShowMobileMenu(false)}
            >
              Courses
            </Link>
            <Link 
              href="/for-students" 
              className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors" 
              onClick={() => setShowMobileMenu(false)}
            >
              For Students
            </Link>
            <Link 
              href="/for-mentors" 
              className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors" 
              onClick={() => setShowMobileMenu(false)}
            >
              For Mentors
            </Link>
            <Link 
              href="/for-ambassadors" 
              className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors" 
              onClick={() => setShowMobileMenu(false)}
            >
              For Ambassadors
            </Link>
            
            {user ? (
              <div className="pt-4 border-t border-gray-200 space-y-4">
                <div className="flex items-center space-x-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-sm font-semibold">
                    {getInitials(user.name)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                </div>
                <Link
                  href={getDashboardLink()}
                  className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/student/profile"
                  className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMobileMenu(false);
                  }}
                  className="block w-full text-left font-medium text-red-600 py-2"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-200 space-y-4">
                <Link 
                  href="/auth/login" 
                  className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors" 
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/register" 
                  className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-center transition-colors" 
                  onClick={() => setShowMobileMenu(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}