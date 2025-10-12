'use client';

import Link from 'next/link';
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
    <nav className="sticky top-0 z-50" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                SkillProbe
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/courses" className="font-medium transition-colors" style={{ color: '#181c31' }}>
              Courses
            </Link>
            <Link href="/mentors" className="font-medium transition-colors" style={{ color: '#181c31' }}>
              Mentors
            </Link>
            <Link href="/live-sessions" className="font-medium transition-colors" style={{ color: '#181c31' }}>
              Live Sessions
            </Link>
            <Link href="/careers" className="font-medium transition-colors" style={{ color: '#181c31' }}>
              Careers
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" style={{ color: '#181c31' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="flex items-center space-x-3 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
                    {getInitials(user.name)}
                  </div>
                  <span className="font-medium" style={{ color: '#181c31' }}>
                    {user.name}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} style={{ color: '#181c31' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <Link
                      href={getDashboardLink()}
                      className="block px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                      style={{ color: '#181c31' }}
                      onClick={() => setShowDropdown(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/student/profile"
                      className="block px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                      style={{ color: '#181c31' }}
                      onClick={() => setShowDropdown(false)}
                    >
                      Profile
                    </Link>
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors text-red-600"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login" className="px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ color: '#181c31' }}>
                  Sign In
                </Link>
                <Link href="/auth/register" className="text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}>
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
              href="/courses" 
              className="block font-medium transition-colors" 
              style={{ color: '#181c31' }}
              onClick={() => setShowMobileMenu(false)}
            >
              Courses
            </Link>
            <Link 
              href="/mentors" 
              className="block font-medium transition-colors" 
              style={{ color: '#181c31' }}
              onClick={() => setShowMobileMenu(false)}
            >
              Mentors
            </Link>
            <Link 
              href="/live-sessions" 
              className="block font-medium transition-colors" 
              style={{ color: '#181c31' }}
              onClick={() => setShowMobileMenu(false)}
            >
              Live Sessions
            </Link>
            <Link 
              href="/careers" 
              className="block font-medium transition-colors" 
              style={{ color: '#181c31' }}
              onClick={() => setShowMobileMenu(false)}
            >
              Careers
            </Link>
            
            {user ? (
              <div className="pt-4 border-t border-gray-200 space-y-4">
                <Link
                  href={getDashboardLink()}
                  className="block font-medium transition-colors"
                  style={{ color: '#181c31' }}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/student/profile"
                  className="block font-medium transition-colors"
                  style={{ color: '#181c31' }}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMobileMenu(false);
                  }}
                  className="block w-full text-left font-medium text-red-600"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-gray-200 space-y-4">
                <Link 
                  href="/auth/login" 
                  className="block font-medium transition-colors" 
                  style={{ color: '#181c31' }}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/register" 
                  className="block text-white px-6 py-2.5 rounded-xl text-sm font-semibold text-center" 
                  style={{ background: 'linear-gradient(135deg, #181c31 0%, #3a8ebe 100%)' }}
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