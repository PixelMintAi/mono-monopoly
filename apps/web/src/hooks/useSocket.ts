import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameSettings, Player } from '@/types/game';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  createRoom: (settings: GameSettings, username: string) => Promise<string>;
  joinRoom: (roomId: string, username: string) => Promise<void>;
  startGame: (roomId: string) => Promise<void>;
}

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const socketInitializer = async () => {
      try {
        console.log('Initializing socket connection...');
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
        console.log('Socket URL:', socketUrl);
        
        const socket = io(socketUrl, {
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000,
          autoConnect: true,
          withCredentials: true,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          console.log('Socket connected successfully');
          setIsConnected(true);
          setError(null);
          setRetryCount(0);
        });

        socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          setError('Failed to connect to server');
          if (retryCount < maxRetries) {
            console.log(`Retrying connection (${retryCount + 1}/${maxRetries})...`);
            setRetryCount(prev => prev + 1);
            timeoutId = setTimeout(socketInitializer, 2000);
          } else {
            console.error('Max retry attempts reached');
          }
        });

        socket.on('error', (errorMessage: string) => {
          console.error('Socket error:', errorMessage);
          setError(errorMessage);
        });

        socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          setIsConnected(false);
          if (reason === 'io server disconnect') {
            console.log('Server initiated disconnect, attempting to reconnect...');
            socket.connect();
          }
        });

        return () => {
          console.log('Cleaning up socket connection...');
          if (timeoutId) clearTimeout(timeoutId);
          socket.disconnect();
        };
      } catch (error) {
        console.error('Failed to initialize socket:', error);
        setError('Failed to initialize socket connection');
        if (retryCount < maxRetries) {
          console.log(`Retrying initialization (${retryCount + 1}/${maxRetries})...`);
          setRetryCount(prev => prev + 1);
          timeoutId = setTimeout(socketInitializer, 2000);
        } else {
          console.error('Max retry attempts reached');
        }
      }
    };

    socketInitializer();

    return () => {
      console.log('Cleaning up socket hook...');
      if (timeoutId) clearTimeout(timeoutId);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [retryCount]);

  const createRoom = async (settings: GameSettings, username: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Socket not connected'));
        return;
      }

      const roomId = crypto.randomUUID();
      
      socketRef.current.emit('createRoom', { roomId, settings, username });

      const timeoutId = setTimeout(() => {
        reject(new Error('Room creation timed out'));
      }, 5000);

      socketRef.current.once('roomCreated', ({ roomId }) => {
        clearTimeout(timeoutId);
        resolve(roomId);
      });

      socketRef.current.once('error', (errorMessage: string) => {
        clearTimeout(timeoutId);
        reject(new Error(errorMessage));
      });
    });
  };

  const joinRoom = async (roomId: string, username: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Socket not connected'));
        return;
      }

      socketRef.current.emit('joinRoom', { roomId, username });

      const timeoutId = setTimeout(() => {
        reject(new Error('Join room timed out'));
      }, 5000);

      socketRef.current.once('gameStateUpdated', () => {
        clearTimeout(timeoutId);
        resolve();
      });

      socketRef.current.once('error', (errorMessage: string) => {
        clearTimeout(timeoutId);
        reject(new Error(errorMessage));
      });
    });
  };

  const startGame = async (roomId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Socket not connected'));
        return;
      }

      socketRef.current.emit('startGame', { roomId });

      const timeoutId = setTimeout(() => {
        reject(new Error('Start game timed out'));
      }, 5000);

      socketRef.current.once('gameStarted', () => {
        clearTimeout(timeoutId);
        resolve();
      });

      socketRef.current.once('error', (errorMessage: string) => {
        clearTimeout(timeoutId);
        reject(new Error(errorMessage));
      });
    });
  };

  return {
    socket: socketRef.current,
    isConnected,
    error,
    createRoom,
    joinRoom,
    startGame,
  };
} 