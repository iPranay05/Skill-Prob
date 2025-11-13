'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import AnnouncementBar from './AnnouncementBar';
import { SocketProvider } from '../contexts/SocketContext';
import { RealTimeNotifications } from './RealTimeNotifications';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Don't show navigation on auth pages (but show on homepage)
  const isAuthPage = pathname.startsWith('/auth');

  // Get auth token from localStorage after mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      setAuthToken(token);
    }
  }, []);

  // For auth pages, render without navbar
  if (isAuthPage) {
    return <>{children}</>;
  }

  // For all other pages, render with announcement bar and navbar
  return (
    <div className="min-h-screen bg-gray-50">
      {/* <AnnouncementBar /> */}
      <Navbar />
      <main>{children}</main>
      {mounted && authToken && (
        <SocketProvider authToken={authToken}>
          <RealTimeNotifications />
        </SocketProvider>
      )}
    </div>
  );
}


