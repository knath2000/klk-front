"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getWebSocketUrl, handleTabSwitch } from '@/lib/websocket';
import { getNeonAuthToken } from '@/lib/neonAuth';
import { useAuth } from '@/context/AuthContext';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WebSocketContextType {
  socket: Socket | null;
  connectionState: ConnectionState;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  error: string | null;
  latency: number | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: React.ReactNode;
}

// Define proper types for Socket.IO auth
interface SocketAuth {
  token?: string;
  [key: string]: unknown;
}

// Token cache to avoid repeated fetches
let tokenCache: { token: string | null; timestamp: number } | null = null;
const TOKEN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedToken = async (): Promise<string | null> => {
  // Return cached token if still valid
  if (tokenCache && Date.now() - tokenCache.timestamp < TOKEN_CACHE_TTL) {
    return tokenCache.token;
  }

  try {
    const token = await getNeonAuthToken();
    tokenCache = { token, timestamp: Date.now() };
    return token;
  } catch (error) {
    console.warn('Failed to get auth token:', error);
    return null;
  }
};

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPingTimeRef = useRef<number>(0);
  // Guard to differentiate intentional disconnects vs. unexpected ones
  const manualDisconnectRef = useRef<boolean>(false);
  const { user } = useAuth();
  const isAuthenticated = Boolean(user?.id);
  const requireAuth = process.env.NEXT_PUBLIC_WEBSOCKET_REQUIRE_AUTH === 'true';
  const shouldConnect = isAuthenticated || !requireAuth;

  useEffect(() => {
    if (!isAuthenticated) {
      tokenCache = null;
    }
  }, [isAuthenticated]);

  const getSessionId = useCallback((): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('websocket_session_id');
    }
    return null;
  }, []);

  const setSessionId = useCallback((sessionId: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('websocket_session_id', sessionId);
    }
  }, []);

  const createSocket = useCallback((): Socket => {
    const wsUrl = getWebSocketUrl();
    const sessionId = getSessionId();

    console.log('🔌 Creating optimized WebSocket connection to:', wsUrl);

    const newSocket = io(wsUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      secure: process.env.NODE_ENV === 'production',
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000, // Reduced timeout for faster failure detection
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 5, // Reduced attempts for faster fallback
      reconnectionDelay: 1000,
      reconnectionDelayMax: 3000, // Faster max delay
      randomizationFactor: 0.5,
      autoConnect: false,
      withCredentials: true,
      query: sessionId ? { sessionId } : undefined,
    });

    // Optimized connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ WebSocket CONNECTED:', newSocket.id);
      setConnectionState('connected');
      setError(null);

      // Store session ID for reconnection
      if (newSocket.id) {
        setSessionId(newSocket.id);
      }
      manualDisconnectRef.current = false;

      // Start latency monitoring
      startLatencyMonitoring(newSocket);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket DISCONNECTED:', reason);
      setConnectionState('disconnected');
      stopLatencyMonitoring();

      if (reason === 'io client disconnect') {
        if (!manualDisconnectRef.current) {
          console.log('🔄 Auto-reconnecting after unexpected disconnect');
          setConnectionState('connecting');
          setTimeout(() => {
            if (newSocket.disconnected) {
              newSocket.connect();
            }
          }, 1000);
        }
      }
    });

    newSocket.on('connect_error', (err) => {
      const message = err?.message || '';
      console.error('❌ WebSocket ERROR:', message);

      if (requireAuth && (message.toLowerCase().includes('token required') || message.toLowerCase().includes('invalid token'))) {
        setError('token-required');
        setConnectionState('disconnected');
        manualDisconnectRef.current = true;
        tokenCache = null;
        newSocket.disconnect();
        return;
      }

      setConnectionState('error');
      setError(message);

      // Faster fallback to polling
      if (message.includes('websocket')) {
        console.log('🔄 Falling back to polling transport');
        newSocket.io!.opts.transports = ['polling', 'websocket'];
        setTimeout(() => newSocket.connect(), 1000);
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Successfully reconnected on attempt:', attemptNumber);
      setConnectionState('connected');
      setError(null);
    });

    newSocket.on('reconnect_error', (err) => {
      console.error('❌ Reconnect failed:', err.message);
      setConnectionState('error');
      setError(`Reconnection failed: ${err.message}`);
    });

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (newSocket.disconnected) {
          console.log('🔄 Reconnecting due to tab visibility');
          newSocket.connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    const cleanup = () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };

    (newSocket as Socket & { _cleanup?: () => void })._cleanup = cleanup;

    return newSocket;
  }, [getSessionId, setSessionId, requireAuth]);

  const startLatencyMonitoring = (socket: Socket) => {
    stopLatencyMonitoring();

    const ping = () => {
      lastPingTimeRef.current = Date.now();
      socket.emit('ping');
    };

    // Send ping every 30 seconds
    pingIntervalRef.current = setInterval(ping, 30000);

    const handlePong = () => {
      if (lastPingTimeRef.current) {
        const latency = Date.now() - lastPingTimeRef.current;
        setLatency(latency);
      }
    };

    socket.on('pong', handlePong);
  };

  const stopLatencyMonitoring = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  };

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting WebSocket');
      manualDisconnectRef.current = true;
      stopLatencyMonitoring();

      const cleanup = (socketRef.current as Socket & { _cleanup?: () => void })._cleanup;
      if (cleanup) cleanup();

      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnectionState('disconnected');
    }
  }, []);

  const connect = useCallback(async () => {
    if (!shouldConnect) {
      if (requireAuth) {
        setError('token-required');
      }
      setConnectionState('disconnected');
      if (socketRef.current) {
        disconnect();
      }
      return;
    }

    if (socketRef.current?.connected) {
      return; // Already connected
    }

    if (!socketRef.current || socketRef.current.disconnected) {
      console.log('🔌 Initiating optimized WebSocket connection');
      manualDisconnectRef.current = false;

      try {
        const token = isAuthenticated ? await getCachedToken() : null;
        if (isAuthenticated && !token) {
          console.warn('🔐 Auth token required but not available; skipping WebSocket connection');
          setError('missing-token');
          setConnectionState('error');
          return;
        }

        const newSocket = createSocket();
        socketRef.current = newSocket;
        setSocket(newSocket);
        setConnectionState('connecting');
        setError(null);

        if (token) {
          (newSocket as Socket & { auth?: SocketAuth }).auth = { token };
          console.log('🔐 Auth token set (cached)');
        }

        newSocket.connect();
      } catch (error) {
        console.error('Failed to create socket:', error);
        setConnectionState('error');
        setError('Failed to create connection');
      }
    }
  }, [createSocket, shouldConnect, isAuthenticated, requireAuth, disconnect]);

  // Initialize connection on mount
  useEffect(() => {
    if (shouldConnect) {
      connect();
    } else {
      setSocket(null);
      if (requireAuth) {
        setError('token-required');
      }
      setConnectionState('disconnected');
    }
  }, [shouldConnect, connect, requireAuth]);

  // Handle window beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socketRef.current) {
        console.log('🔌 Cleaning up WebSocket before page unload');
        manualDisconnectRef.current = true;
        const s = socketRef.current as (Socket & { _cleanup?: () => void }) | null;
        if (s?._cleanup) {
          try { s._cleanup(); } catch {}
        }
        socketRef.current.disconnect();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [connect, disconnect]);

  const value: WebSocketContextType = {
    socket,
    connectionState,
    isConnected: connectionState === 'connected',
    connect,
    disconnect,
    error,
    latency,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};