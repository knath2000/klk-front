import { io, Socket } from 'socket.io-client';

export const getWebSocketUrl = (): string => {
  if (typeof window !== 'undefined') {
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction 
      ? 'wss://klk-back-production.up.railway.app'
      : 'ws://localhost:3001';
  }
  return 'ws://localhost:3001';
};

export const createWebSocketConnection = (url?: string): Socket => {
  const wsUrl = url || getWebSocketUrl();
  console.log('🔌 Creating WebSocket connection to:', wsUrl);

  const socket = io(wsUrl, {
    path: '/socket.io', // Match server path
    transports: ['websocket', 'polling'],
    secure: process.env.NODE_ENV === 'production', // Enforce wss:// in production
    upgrade: true,
    rememberUpgrade: true,
    timeout: 20000,
    forceNew: false,
    reconnection: true,
    reconnectionAttempts: 10, // Increased for intermittent
    reconnectionDelay: 2000, // Delay to avoid race on tab switch
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
    autoConnect: true,
    withCredentials: true // For CORS cookies
  });

  // Enhanced logging with timing
  socket.on('connect', () => {
    console.log('✅ WebSocket CONNECTED:', socket.id, 'at', new Date().toISOString());
  });

  // Enhanced error handling with auto-fallback
  socket.on('connect_error', (err) => {
    console.error('❌ WebSocket ERROR:', err.message, 'at', new Date().toISOString());

    // Auto-fallback if websocket fails
    const transports = socket.io?.opts?.transports as string[] | undefined;
    if (err.message.includes('websocket') && transports?.includes('websocket')) {
      console.log('🔄 Auto-falling back to polling');
      socket.io!.opts.transports = ['polling'];
      socket.connect();
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 WebSocket DISCONNECTED:', reason, 'at', new Date().toISOString());
  });

  socket.on('reconnect_attempt', (data) => {
    console.log('🔄 Reconnect attempt in', data.delay, 'ms');
  });

  // Listen for server fallback
  socket.on('translation_fallback', (data) => {
    console.log('Server activated fallback:', data.transport);
    // Handle via polling if needed
  });

  return socket;
};

// Add utility for tab switch detection
export const handleTabSwitch = (socket: Socket) => {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      console.log('Tab visible - checking connection');
      if (socket.disconnected) {
        setTimeout(() => socket.connect(), 1000); // Delay reconnect
      }
    }
  });
};