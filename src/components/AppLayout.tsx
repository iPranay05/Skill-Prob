'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { SocketProvider } from '../contexts/SocketContext';
import { RealTimeNotifications } from './RealTimeNotifications';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  // Don't show navigation on auth pages
  const isAuthPage = pathname.startsWith('/auth') || pathname === '/';

  // Get auth token from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      setAuthToken(token);
    }
  }, []);
  
  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <SocketProvider authToken={authToken || undefined}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>{children}</main>
        <RealTimeNotifications />
      </div>
    </SocketProvider>
  );
}