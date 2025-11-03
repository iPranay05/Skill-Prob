'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showRolesDropdown, setShowRolesDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const rolesDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (rolesDropdownRef.current && !rolesDropdownRef.current.contains(event.target as Node)) {
        setShowRolesDropdown(false);
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
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-white border-b border-gray-200"
    >
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="hidden md:flex items-center space-x-8"
          >
            {user && user.role === 'mentor' ? (
              // Mentor Navigation
              <>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <Link href="/mentor/dashboard" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Dashboard</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <Link href="/mentor/courses" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">My Courses</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <Link href="/mentor/students" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Students</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                >
                  <Link href="/mentor/analytics" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Analytics</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                  className="relative"
                >
                  <div className="relative group">
                    <button className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 flex items-center space-x-1">
                      <span className="relative z-10">Live Sessions</span>
                      <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                    </button>

                    {/* Dropdown Menu */}
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-2">
                        <Link
                          href="/live-sessions/create"
                          className="block px-4 py-3 text-gray-700 hover:bg-[#5e17eb]/5 hover:text-[#5e17eb] transition-colors duration-200 flex items-center space-x-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Create Session</span>
                        </Link>
                        <Link
                          href="/live-sessions"
                          className="block px-4 py-3 text-gray-700 hover:bg-[#5e17eb]/5 hover:text-[#5e17eb] transition-colors duration-200 flex items-center space-x-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>View Sessions</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            ) : user && user.role === 'student' ? (
              // Student Navigation
              <>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <Link href="/student/dashboard" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Dashboard</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <Link href="/courses/browse" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Browse Courses</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <Link href="/student/courses" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">My Courses</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                >
                  <Link href="/live-sessions" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Live Sessions</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  <Link href="/jobs" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Jobs</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
              </>
            ) : user && user.role === 'ambassador' ? (
              // Ambassador Navigation
              <>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <Link href="/ambassador/dashboard" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Dashboard</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <Link href="/courses/browse" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Courses</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <Link href="/live-sessions" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Live Sessions</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                >
                  <Link href="/ambassador/referrals" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Referrals</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  <Link href="/ambassador/earnings" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Earnings</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
              </>
            ) : user && user.role === 'admin' ? (
              // Admin Navigation
              <>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <Link href="/admin/dashboard" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Dashboard</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <Link href="/admin/users" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Manage Users</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <Link href="/admin/courses" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Manage Courses</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                >
                  <Link href="/admin/kyc" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">KYC Reviews</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  <Link href="/admin/analytics" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Analytics</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
              </>
            ) : user && user.role === 'super_admin' ? (
              // Super Admin Navigation (Enhanced with additional features)
              <>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                >
                  <Link href="/admin/dashboard" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Dashboard</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <Link href="/admin/users" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Manage Users</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <Link href="/admin/courses" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Manage Courses</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                >
                  <Link href="/admin/kyc" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">KYC Reviews</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  <Link href="/admin/analytics" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Analytics</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.4 }}
                >
                  <Link href="/admin/system" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">System Config</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.0, duration: 0.4 }}
                >
                  <Link href="/admin/audit" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Audit Logs</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
              </>
            ) : (
              // Default Navigation
              <>
                {pathname !== '/' && (
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                  >
                    <Link href="/" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                      <span className="relative z-10">Homepage</span>
                      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                    </Link>
                  </motion.div>
                )}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <Link href="/about" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">About Us</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <Link href="/courses" className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 group">
                    <span className="relative z-10">Courses</span>
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                  className="relative"
                  ref={rolesDropdownRef}
                >
                  <div className="relative group">
                    <button
                      onClick={() => setShowRolesDropdown(!showRolesDropdown)}
                      className="relative text-gray-600 hover:text-[#5e17eb] font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:bg-[#5e17eb]/5 flex items-center space-x-1"
                    >
                      <span className="relative z-10">Roles</span>
                      <svg className={`w-4 h-4 transition-transform duration-200 ${showRolesDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#5e17eb] transition-all duration-300 group-hover:w-full"></div>
                    </button>

                    {/* Dropdown Menu */}
                    {showRolesDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                        <Link
                          href="/for-students"
                          className="block px-4 py-3 text-gray-700 hover:bg-[#5e17eb]/5 hover:text-[#5e17eb] transition-colors duration-200 flex items-center space-x-3"
                          onClick={() => setShowRolesDropdown(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          </svg>
                          <span>For Students</span>
                        </Link>
                        <Link
                          href="/for-mentors"
                          className="block px-4 py-3 text-gray-700 hover:bg-[#5e17eb]/5 hover:text-[#5e17eb] transition-colors duration-200 flex items-center space-x-3"
                          onClick={() => setShowRolesDropdown(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>For Mentors</span>
                        </Link>
                        <Link
                          href="/for-ambassadors"
                          className="block px-4 py-3 text-gray-700 hover:bg-[#5e17eb]/5 hover:text-[#5e17eb] transition-colors duration-200 flex items-center space-x-3"
                          onClick={() => setShowRolesDropdown(false)}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>For Ambassadors</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-700"
            >
              {showMobileMenu ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
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
                <Link href="/auth/login" className="text-[#5e17eb] hover:text-white font-medium px-4 py-2 border-2 border-[#5e17eb] hover:bg-[#5e17eb] rounded-lg transition-all duration-300">
                  Sign In
                </Link>
                <Link href="/auth/register" className="bg-[#5e17eb] hover:bg-[#4a12c4] text-white px-4 py-2 rounded-lg font-medium transition-colors duration-300">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-white border-t border-gray-200 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4">
              {user && user.role === 'mentor' ? (
                // Mentor Mobile Navigation
                <>
                  <Link
                    href="/mentor/dashboard"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/mentor/courses"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    My Courses
                  </Link>
                  <Link
                    href="/mentor/students"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Students
                  </Link>
                  <Link
                    href="/mentor/analytics"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Analytics
                  </Link>
                  <Link
                    href="/live-sessions/create"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Create Session
                  </Link>
                  <Link
                    href="/live-sessions"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    View Sessions
                  </Link>
                </>
              ) : user && user.role === 'student' ? (
                // Student Mobile Navigation
                <>
                  <Link
                    href="/student/dashboard"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/courses/browse"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Browse Courses
                  </Link>
                  <Link
                    href="/student/courses"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    My Courses
                  </Link>
                  <Link
                    href="/live-sessions"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Live Sessions
                  </Link>
                  <Link
                    href="/jobs"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Jobs
                  </Link>
                </>
              ) : user && user.role === 'ambassador' ? (
                // Ambassador Mobile Navigation
                <>
                  <Link
                    href="/ambassador/dashboard"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/courses/browse"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Courses
                  </Link>
                  <Link
                    href="/live-sessions"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Live Sessions
                  </Link>
                  <Link
                    href="/ambassador/referrals"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Referrals
                  </Link>
                  <Link
                    href="/ambassador/earnings"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Earnings
                  </Link>
                </>
              ) : user && user.role === 'admin' ? (
                // Admin Mobile Navigation
                <>
                  <Link
                    href="/admin/dashboard"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/users"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Manage Users
                  </Link>
                  <Link
                    href="/admin/courses"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Manage Courses
                  </Link>
                  <Link
                    href="/admin/kyc"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    KYC Reviews
                  </Link>
                  <Link
                    href="/admin/analytics"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Analytics
                  </Link>
                </>
              ) : user && user.role === 'super_admin' ? (
                // Super Admin Mobile Navigation (Enhanced)
                <>
                  <Link
                    href="/admin/dashboard"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/users"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Manage Users
                  </Link>
                  <Link
                    href="/admin/courses"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Manage Courses
                  </Link>
                  <Link
                    href="/admin/kyc"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    KYC Reviews
                  </Link>
                  <Link
                    href="/admin/analytics"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Analytics
                  </Link>
                  <Link
                    href="/admin/system"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    System Config
                  </Link>
                  <Link
                    href="/admin/audit"
                    className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Audit Logs
                  </Link>
                </>
              ) : (
                // Default Mobile Navigation
                <>
                  {pathname !== '/' && (
                    <Link
                      href="/"
                      className="block text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Homepage
                    </Link>
                  )}
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
                  <div className="py-2">
                    <p className="text-sm font-semibold text-gray-500 mb-2">Roles</p>
                    <div className="pl-4 space-y-2">
                      <Link
                        href="/for-students"
                        className="block text-gray-600 hover:text-gray-900 font-medium py-1 transition-colors"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        For Students
                      </Link>
                      <Link
                        href="/for-mentors"
                        className="block text-gray-600 hover:text-gray-900 font-medium py-1 transition-colors"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        For Mentors
                      </Link>
                      <Link
                        href="/for-ambassadors"
                        className="block text-gray-600 hover:text-gray-900 font-medium py-1 transition-colors"
                        onClick={() => setShowMobileMenu(false)}
                      >
                        For Ambassadors
                      </Link>
                    </div>
                  </div>
                </>
              )}

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
                    className="block text-[#5e17eb] hover:text-white font-medium py-2 px-4 border-2 border-[#5e17eb] hover:bg-[#5e17eb] rounded-lg transition-all duration-300 text-center"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block bg-[#5e17eb] hover:bg-[#4a12c4] text-white px-4 py-2 rounded-lg font-medium text-center transition-colors duration-300"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}