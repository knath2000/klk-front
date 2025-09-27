"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getWebSocketUrl, handleTabSwitch } from '@/lib/websocket';
import { getNeonAuthToken } from '@/lib/neonAuth';

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WebSocketContextType {
  socket: Socket | null;
  connectionState: ConnectionState;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  error: string | null;
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

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Guard to differentiate intentional disconnects vs. unexpected ones
  const manualDisconnectRef = useRef<boolean>(false);

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

    console.log('🔌 Creating global WebSocket connection to:', wsUrl);

    const newSocket = io(wsUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      secure: process.env.NODE_ENV === 'production',
      upgrade: true,
      rememberUpgrade: true,
      timeout: 30000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      // Important: do NOT auto-connect; set auth token first, then connect
      autoConnect: false,
      withCredentials: true,
      query: sessionId ? { sessionId } : undefined,
    });

    /* Wait for Stack Auth client app and valid token before connecting */
    const initializeAuthAndConnect = async () => {
      try {
        // Wait for Stack Auth client app to be available (with timeout)
        const waitForStackAuth = (timeoutMs = 5000): Promise<boolean> => {
          return new Promise((resolve) => {
            const checkStackAuth = () => {
              const win = typeof window !== 'undefined' ? (window as any) : undefined;
              if (win?.stackAppInstance) {
                resolve(true);
                return;
              }
              // Check again in 100ms
              setTimeout(checkStackAuth, 100);
            };
            checkStackAuth();
            // Timeout after specified time
            setTimeout(() => resolve(false), timeoutMs);
          });
        };

        const stackAuthReady = await waitForStackAuth();
        if (!stackAuthReady) {
          console.warn('⚠️ Stack Auth client app not available within timeout, proceeding without auth token');
          // Connect without auth token
          try { newSocket.connect(); } catch (connectError) {
            console.error('❌ Failed to connect WebSocket:', connectError);
          }
          return;
        }

        // Now wait for a valid token (user must be authenticated)
        const waitForValidToken = (timeoutMs = 10000): Promise<string | null> => {
          return new Promise(async (resolve) => {
            const checkToken = async () => {
              try {
                const token = await getNeonAuthToken();
                if (token && token.length > 10) { // Basic validation
                  resolve(token);
                  return;
                }
              } catch (error) {
                console.warn('⚠️ Token check failed:', error);
              }
              // Check again in 200ms
              setTimeout(checkToken, 200);
            };
            checkToken();
            // Timeout after specified time
            setTimeout(() => resolve(null), timeoutMs);
          });
        };

        const token = await waitForValidToken();
        if (token) {
          (newSocket as Socket & { auth?: SocketAuth }).auth = { ...(newSocket as Socket & { auth?: SocketAuth }).auth, token };
          console.log('🔐 [WebSocket] Auth token set successfully (length:', token.length, ')');
          console.log('🔐 [WebSocket] Socket auth object:', (newSocket as Socket & { auth?: SocketAuth }).auth);
        } else {
          console.warn('⚠️ [WebSocket] No valid auth token available within timeout, proceeding with anonymous connection');
        }

        // Now initiate the connection
        try { newSocket.connect(); } catch (connectError) {
          console.error('❌ Failed to connect WebSocket:', connectError);
        }
      } catch (error) {
        console.warn('⚠️ Failed to initialize auth for WebSocket:', error);
        // Still try to connect without auth
        try { newSocket.connect(); } catch (connectError) {
          console.error('❌ Failed to connect WebSocket:', connectError);
        }
      }
    };

    // Start the async initialization
    initializeAuthAndConnect();

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ WebSocket CONNECTED:', newSocket.id, 'at', new Date().toISOString());
      setConnectionState('connected');
      setError(null);

      // Store session ID for reconnection
      if (newSocket.id) {
        setSessionId(newSocket.id);
      }
      // Any successful connect implies we are no longer in a manual disconnect state
      manualDisconnectRef.current = false;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 WebSocket DISCONNECTED:', reason, 'at', new Date().toISOString(), 'Socket ID:', newSocket.id);
      setConnectionState('disconnected');

      if (reason === 'io client disconnect') {
        console.log('🔌 Client initiated disconnect - will not auto-reconnect');
        // If this was NOT an intentional disconnect from our code, immediately attempt to reconnect
        if (!manualDisconnectRef.current) {
          console.log('⚠️ Detected unexpected client disconnect; attempting auto-reconnect');
          setConnectionState('connecting');
          try {
            newSocket.connect();
          } catch {
            // Schedule a short retry if immediate connect throws
            setTimeout(() => {
              if (newSocket.disconnected) {
                newSocket.connect();
              }
            }, 500);
          }
        }
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ WebSocket ERROR:', err.message, 'at', new Date().toISOString());
      setConnectionState('error');
      setError(err.message);

      // Aggressive fallback to polling if websocket fails
      if (err.message.includes('websocket') || err.message.includes('connection refused')) {
        console.log('🔄 Falling back to polling transport');
        newSocket.io!.opts.transports = ['polling', 'websocket']; // Prefer polling first
        newSocket.connect();
      }

      // Retry with exponential backoff
      const attempts = typeof newSocket.io?.reconnectionAttempts === 'function'
        ? (newSocket.io.reconnectionAttempts as () => number)()
        : 0;
      const retryDelay = Math.min(1000 * Math.pow(2, attempts), 30000);
      console.log(`⏳ Retrying connection in ${retryDelay}ms`);
      setTimeout(() => {
        if (newSocket.disconnected) {
          // Refresh token before retrying connect
          getNeonAuthToken()
            .then((token) => {
              if (token) (newSocket as Socket & { auth?: SocketAuth }).auth = { ...(newSocket as Socket & { auth?: SocketAuth }).auth, token };
            })
            .finally(() => {
              newSocket.connect();
            });
        }
      }, retryDelay);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnect attempt:', attemptNumber);
      setConnectionState('connecting');
      // Refresh token for the next handshake
      getNeonAuthToken().then((token) => {
        if (token) (newSocket as Socket & { auth?: SocketAuth }).auth = { ...(newSocket as Socket & { auth?: SocketAuth }).auth, token };
      }).catch(() => {});
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

    // Handle server-side session restoration
    newSocket.on('session_restored', (data: { userId?: string; rooms?: string[] }) => {
      console.log('🔄 Session restored:', data);
    });

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 Tab visible - checking connection');
        if (newSocket.disconnected) {
          console.log('🔄 Attempting to reconnect due to tab visibility');
          newSocket.connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    const cleanup = () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };

    // Setup tab visibility handling
    handleTabSwitch(newSocket);

    // Store cleanup function for later use
    (newSocket as Socket & { _cleanup?: () => void })._cleanup = cleanup;

    return newSocket;
  }, [getSessionId, setSessionId]);

  const connect = useCallback(() => {
    if (!socketRef.current || socketRef.current.disconnected) {
      console.log('🔌 Initiating WebSocket connection');
      // Reset manual disconnect guard before creating a new connection
      manualDisconnectRef.current = false;
      const newSocket = createSocket();
      socketRef.current = newSocket;
      setSocket(newSocket);
      setConnectionState('connecting');
    }
  }, [createSocket]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Disconnecting WebSocket');
      // Mark as intentional so we don't auto-reconnect on purpose
      manualDisconnectRef.current = true;
      const cleanup = (socketRef.current as Socket & { _cleanup?: () => void })._cleanup;
      if (cleanup) cleanup();

      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnectionState('disconnected');
    }
  }, []);

  // Initialize connection on mount
  useEffect(() => {
    console.log('🚀 Initializing WebSocket connection');
    connect();

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up WebSocket connection (provider unmount)');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Do NOT hard-disconnect here to avoid client-initiated disconnects during route re-mounts.
      // Just remove visibility listeners and leave the socket to be re-used or GC'd by the browser.
      const s = socketRef.current as (Socket & { _cleanup?: () => void }) | null;
      if (s?._cleanup) {
        try { s._cleanup(); } catch {}
      }
      // We intentionally do not call disconnect() here to prevent "io client disconnect" during mount lifecycles.
    };
  }, [connect]);

  // Handle window beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (socketRef.current) {
        console.log('🔌 Cleaning up WebSocket before page unload');
        // Intentional disconnect on unload
        manualDisconnectRef.current = true;
        socketRef.current.disconnect();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const value: WebSocketContextType = {
    socket,
    connectionState,
    isConnected: connectionState === 'connected',
    connect,
    disconnect,
    error,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};