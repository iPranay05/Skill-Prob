'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  role: string;
  profile: {
    firstName?: string;
    lastName?: string;
  };
}

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/auth/login');
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  const getNavItems = () => {
    if (!user) {
      return [
        { name: 'Home', href: '/', icon: '🏠' },
        { name: 'Courses', href: '/courses', icon: '📚' },
        { name: 'About', href: '/about', icon: 'ℹ️' },
      ];
    }

    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: '📊' },
      { name: 'Courses', href: '/courses', icon: '📚' },
      { name: 'Live Sessions', href: '/live-sessions', icon: '🎥' },
    ];

    if (user.role === 'mentor') {
      baseItems.push({ name: 'Mentor Dashboard', href: '/mentor/dashboard', icon: '👨‍🏫' });
    } else if (user.role === 'admin' || user.role === 'super_admin') {
      baseItems.push({ name: 'Admin Panel', href: '/admin/dashboard', icon: '⚙️' });
    }

    return baseItems;
  };

  if (!user) {
    return (
      <nav className="bg-white shadow-xl border-b border-gray-200 sticky top-0 z-50" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0 flex items-center group">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105" style={{ backgroundColor: '#5e17eb' }}>
                    <span className="text-white text-xl font-bold">SP</span>
                  </div>
                </div>
                <div className="ml-3">
                  <span className="text-2xl font-bold text-black">
                    Skill Probe
                  </span>
                  <div className="text-xs text-gray-600 font-medium">Learning Management System</div>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <Link
                href="/auth/login"
                className="text-black px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                style={{ color: '#5e17eb' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f0ff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="text-white px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                style={{ backgroundColor: '#5e17eb' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4c14c7'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5e17eb'}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-xl border-b border-gray-200 sticky top-0 z-50" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105" style={{ backgroundColor: '#5e17eb' }}>
                  <span className="text-white text-xl font-bold">SP</span>
                </div>
              </div>
              <div className="ml-3">
                <span className="text-2xl font-bold text-black">
                  Skill Probe
                </span>
                <div className="text-xs text-gray-600 font-medium">Learning Management System</div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {getNavItems().map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive(item.href)
                    ? 'text-white shadow-lg'
                    : 'text-black'
                }`}
                style={isActive(item.href) ? { backgroundColor: '#5e17eb' } : {}}
                onMouseEnter={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.backgroundColor = '#f3f0ff';
                    e.currentTarget.style.color = '#5e17eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#000000';
                  }
                }}
              >
                <span className="flex items-center space-x-2">
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </span>
                {isActive(item.href) && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
                )}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-3 px-4 py-2 rounded-2xl transition-all duration-200 border border-gray-200 group"
                style={{ backgroundColor: '#f3f0ff' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6d9ff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f3f0ff'}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#5e17eb' }}>
                    <span className="text-white text-sm font-bold">
                      {user.profile?.firstName?.[0] || user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-black">
                    {user.profile?.firstName || 'User'}
                  </div>
                  <div className="text-xs text-gray-600 capitalize">{user.role}</div>
                </div>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-black transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl py-2 z-50 border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: '#f3f0ff' }}>
                    <div className="text-sm font-semibold text-black">{user.profile?.firstName || 'User'}</div>
                    <div className="text-xs text-gray-600">{user.email}</div>
                    <div className="text-xs capitalize font-medium mt-1" style={{ color: '#5e17eb' }}>
                      {user.role} Account
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-3 text-sm text-black transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f0ff';
                        e.currentTarget.style.color = '#5e17eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#000000';
                      }}
                    >
                      <span className="mr-3">👤</span>
                      My Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-3 text-sm text-black transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f0ff';
                        e.currentTarget.style.color = '#5e17eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#000000';
                      }}
                    >
                      <span className="mr-3">⚙️</span>
                      Settings
                    </Link>
                    <Link
                      href="/help"
                      className="flex items-center px-4 py-3 text-sm text-black transition-colors"
                      onClick={() => setIsUserMenuOpen(false)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f0ff';
                        e.currentTarget.style.color = '#5e17eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#000000';
                      }}
                    >
                      <span className="mr-3">❓</span>
                      Help & Support
                    </Link>
                  </div>
                  
                  <div className="border-t border-gray-200 py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <span className="mr-3">🚪</span>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-black focus:outline-none p-2 rounded-xl transition-colors"
                style={{ color: '#5e17eb' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f0ff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-4 pt-4 pb-6 space-y-2" style={{ backgroundColor: '#f9f9f9' }}>
            {getNavItems().map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-base font-semibold transition-all duration-200 ${
                  isActive(item.href)
                    ? 'text-white shadow-lg'
                    : 'text-black'
                }`}
                style={isActive(item.href) ? { backgroundColor: '#5e17eb' } : {}}
                onClick={() => setIsMenuOpen(false)}
                onMouseEnter={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.backgroundColor = '#f3f0ff';
                    e.currentTarget.style.color = '#5e17eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.href)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#000000';
                  }
                }}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}