'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Logo and Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/images/logo1.png" 
                alt="Skill Probe Logo" 
                className="w-50 h-20 object-contain"
              />
              {/* <span className="text-xl font-bold">Skill Probe</span> */}
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Transform your skills, transform your future. Master new technologies through live classes and expert mentorship.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[#5e17eb] transition-colors duration-300">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[#5e17eb] transition-colors duration-300">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[#5e17eb] transition-colors duration-300">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-[#5e17eb] transition-colors duration-300">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/courses/browse" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Browse Courses
                </Link>
              </li>
              <li>
                <Link href="/live-sessions" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Live Sessions
                </Link>
              </li>
              <li>
                <Link href="/mentor/signup" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Become a Mentor
                </Link>
              </li>
              <li>
                <Link href="/ambassador/signup" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Campus Ambassador
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors duration-300">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          {/* <div>
            <h3 className="text-lg font-semibold mb-4">Popular Categories</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/courses/web-development" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Web Development
                </Link>
              </li>
              <li>
                <Link href="/courses/data-science" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Data Science & AI
                </Link>
              </li>
              <li>
                <Link href="/courses/digital-marketing" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Digital Marketing
                </Link>
              </li>
              <li>
                <Link href="/courses/design" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Design & Creative
                </Link>
              </li>
              <li>
                <Link href="/courses/business" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Business & Management
                </Link>
              </li>
              <li>
                <Link href="/courses/programming" className="text-gray-400 hover:text-white transition-colors duration-300">
                  Programming Languages
                </Link>
              </li>
            </ul>
          </div> */}

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-[#5e17eb] mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-400">
                   C-116, Office ON, Sector-2, Noida, Uttar Pradesh, IN, 201301
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-[#5e17eb] flex-shrink-0" />
                <p className="text-gray-400">+91 7481998386</p>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-[#5e17eb] flex-shrink-0" />
                <p className="text-gray-400">admin@skillprobe.co</p>
              </div>
            </div>
            
            {/* Newsletter Signup */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-3">Stay Updated</h4>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:border-[#5e17eb] text-white placeholder-gray-400"
                />
                <button className="px-4 py-2 bg-[#5e17eb] hover:bg-[#4a12c4] rounded-r-lg transition-colors duration-300">
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2025 Skill Probe. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors duration-300">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors duration-300">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white transition-colors duration-300">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}