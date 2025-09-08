import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import apiConfig from '../config/environment';

export const useSocket = (sessionId: string | null) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!sessionId) {
      console.log('🔌 No sessionId, disconnecting socket');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    console.log('🔌 Setting up socket for session:', sessionId);

    // Create socket connection
    socketRef.current = io(apiConfig.SOCKET_URL);

    // Wait for connection before joining
    socketRef.current.on('connect', () => {
      console.log('🔌 Socket connected, joining session:', sessionId);
      if (socketRef.current) {
        socketRef.current.emit('join-session', sessionId);
      }
    });

    return () => {
      console.log('🔌 Cleaning up socket for session:', sessionId);
      if (socketRef.current) {
        socketRef.current.emit('leave-session', sessionId);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [sessionId]);

  const emitEvent = (event: string, data: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  const onEvent = (event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
      return () => socketRef.current?.off(event, callback);
    }
    return () => {};
  };

  return { socket: socketRef.current, emitEvent, onEvent };
};