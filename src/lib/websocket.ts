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
    transports: ['websocket', 'polling'],
    upgrade: true,
    rememberUpgrade: true,
    timeout: 20000,
    forceNew: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    pingTimeout: 60000,
    pingInterval: 25000,
    autoConnect: true
  });
  
  // Enhanced logging
  socket.on('connect', () => console.log('✅ WebSocket CONNECTED:', socket.id));
  socket.on('connect_error', (err) => console.error('❌ WebSocket ERROR:', err.message));
  socket.on('disconnect', (reason) => console.log('🔌 WebSocket DISCONNECTED:', reason));
  
  return socket;
};