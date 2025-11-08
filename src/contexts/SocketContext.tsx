'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSocketClient, initializeSocketClient, SocketClient } from '../lib/socketClient';

interface SocketContextType {
  socket: SocketClient | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  updateToken: (token: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: React.ReactNode;
  authToken?: string;
}

export function SocketProvider({ children, authToken }: SocketProviderProps) {
  const [socket, setSocket] = useState<SocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket client
    const socketClient = getSocketClient();
    setSocket(socketClient);

    // Set up connection status listeners
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socketClient.on('error', handleConnect); // This should be a connect event
    socketClient.on('error', handleDisconnect); // This should be a disconnect event

    // Auto-connect if we have a token
    if (authToken) {
      socketClient.updateToken(authToken);
      socketClient.connect();
    }

    // Check initial connection status
    setIsConnected(socketClient.isConnected());

    return () => {
      socketClient.off('error', handleConnect);
      socketClient.off('error', handleDisconnect);
    };
  }, [authToken]);

  const connect = () => {
    if (socket) {
      socket.connect();
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
    }
  };

  const updateToken = (token: string) => {
    if (socket) {
      socket.updateToken(token);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    connect,
    disconnect,
    updateToken,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext(): SocketContextType {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}

// Higher-order component for pages that need socket connection
export function withSocket<P extends object>(
  Component: React.ComponentType<P>
) {
  return function SocketWrappedComponent(props: P) {
    return (
      <SocketProvider>
        <Component {...props} />
      </SocketProvider>
    );
  };
}
