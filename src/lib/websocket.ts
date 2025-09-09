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
  return io(wsUrl, {
    transports: ['websocket', 'polling'],
    upgrade: true,
    rememberUpgrade: true,
    timeout: 20000,
    forceNew: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });
};