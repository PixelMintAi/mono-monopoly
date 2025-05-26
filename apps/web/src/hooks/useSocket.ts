import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameSettings, Player } from '@/types/game';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  clearError: () => void;
  createRoom: (settings: GameSettings, username: string, playerUUID: string) => Promise<string>;
  joinRoom: (roomId: string, username: string, playerUUID: string) => Promise<void>;
  startGame: (roomId: string) => Promise<void>;
  reconnect: () => void;
  disconnect: () => void;
}

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Function to initialize socket connection
  const socketInitializer = async () => {
    try {
      if (socketRef.current && socketRef.current.connected) {
        console.log('Socket already connected, skipping initialization');
        return;
      }

      console.log('Initializing socket connection...');
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
      console.log('Socket URL:', socketUrl);
      
      const socket = io(socketUrl, {
        transports: ['websocket'],
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 10000,
        autoConnect: true,
        withCredentials: true,
        forceNew: true,
        upgrade: false,
      });

      socketRef.current = socket;

      // Set up event listeners
      socket.on('connect', () => {
        console.log('Socket connected successfully with ID:', socket.id);
        setIsConnected(true);
        setError(null);
        setRetryCount(0);
      });

      // Error handling
      const handleError = (error: string | Error | { message: string }) => {
        console.error('Socket error:', error);
        const errorMessage = typeof error === 'string' 
          ? error 
          : error instanceof Error 
            ? error.message 
            : error.message;
        setError(errorMessage);
        
        // Auto-clear non-critical errors after 5 seconds
        setTimeout(() => {
          setError(prev => prev === errorMessage ? null : prev);
        }, 5000);
      };

      socket.on('error', handleError);
      socket.on('connect_error', (error: Error) => handleError(error));
      socket.on('reconnect_error', (error: Error) => handleError(error));
      socket.on('reconnect_failed', () => handleError('Failed to reconnect to server'));

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          console.log('Server initiated disconnect, attempting to reconnect...');
          socket.connect();
        }
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log(`Socket reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
        setError(null);
      });

      // Enhanced debugging events
      socket.on('playerJoined', (data) => {
        console.log('Player joined event received:', data);
      });

      socket.io.on('reconnect_attempt', () => {
        console.log('Socket attempting to reconnect...');
      });

    } catch (error) {
      console.error('Failed to initialize socket:', error);
      
      if (retryCount < maxRetries) {
        console.log(`Retrying initialization (${retryCount + 1}/${maxRetries})...`);
        setRetryCount(prev => prev + 1);
        setTimeout(socketInitializer, 2000);
      } else {
        console.error('Max retry attempts reached');
      }
    }
  };

  // Initialize socket on component mount
  useEffect(() => {
    socketInitializer();

    return () => {
      console.log('Cleaning up socket hook...');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.removeAllListeners();
        socketRef.current = null;
      }
    };
  }, [retryCount]);

  // Helper to clear error state
  const clearError = () => setError(null);

  // Function to manually reconnect
  const reconnect = () => {
    if (socketRef.current) {
      if (!socketRef.current.connected) {
        console.log('Manually reconnecting socket...');
        socketRef.current.connect();
      } else {
        console.log('Socket already connected, no need to reconnect');
      }
    } else {
      console.log('No socket instance, initializing new connection');
      socketInitializer();
    }
  };

  // Function to manually disconnect
  const disconnect = () => {
    if (socketRef.current && socketRef.current.connected) {
      console.log('Manually disconnecting socket...');
      socketRef.current.disconnect();
    }
  };

  // Create a new game room
  const createRoom = async (settings: GameSettings, username: string, playerUUID: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Socket not connected'));
        return;
      }

      // Generate a random room ID
      const roomId = crypto.randomUUID();
      
      // Set up one-time event listeners first
      const onRoomCreated = ({ roomId }: { roomId: string }) => {
        console.log('Room created successfully:', roomId);
        cleanup();
        resolve(roomId);
      };

      const onError = (errorMessage: string) => {
        console.error('Room creation error:', errorMessage);
        cleanup();
        reject(new Error(errorMessage));
      };

      // Create cleanup function for event listeners
      const cleanup = () => {
        socketRef.current?.off('roomCreated', onRoomCreated);
        socketRef.current?.off('error', onError);
      };

      // Register event listeners
      socketRef.current.once('roomCreated', onRoomCreated);
      socketRef.current.once('error', onError);

      // Emit create room event
      socketRef.current.emit('createRoom', { roomId, settings, username, playerUUID });
      console.log('createRoom emitted:', { roomId, username, playerUUID });
    });
  };

  // Join an existing game room
  const joinRoom = async (roomId: string, username: string, playerUUID: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Socket not connected'));
        return;
      }
      console.log('entry join room')

      // Set up one-time event listeners first
      const onJoinSuccess = () => {
        console.log('Successfully joined room:', roomId);
        cleanup();
        resolve();
      };

      const onPlayerJoined = (data: { player: Player }) => {
        console.log('New player joined:', data.player);
        // This event will be handled by the game store to update the players list
      };

      const onError = (errorMessage: string) => {
        console.error('Join room error:', errorMessage);
        cleanup();
        reject(new Error(errorMessage));
      };

      // Create cleanup function
      const cleanup = () => {
        socketRef.current?.off('joinConfirmed', onJoinSuccess);
        socketRef.current?.off('gameStateUpdated', onJoinSuccess);
        socketRef.current?.off('playerJoined', onPlayerJoined);
        socketRef.current?.off('error', onError);
      };

      // Register event listeners
      socketRef.current.once('joinConfirmed', onJoinSuccess);
      socketRef.current.once('gameStateUpdated', onJoinSuccess);
      socketRef.current.on('playerJoined', onPlayerJoined); // Keep this listener active
      socketRef.current.once('error', onError);

      // Emit join room event
      socketRef.current.emit('joinRoom', { roomId, username, playerUUID });
      console.log('joinRoom emitted:', { roomId, username, playerUUID });
    });
  };

  // Start a game
  const startGame = async (roomId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) {
        reject(new Error('Socket not connected'));
        return;
      }

      // Set up one-time event listeners
      const onGameStarted = () => {
        console.log('Game started successfully');
        cleanup();
        resolve();
      };

      const onError = (errorMessage: string) => {
        console.error('Start game error:', errorMessage);
        cleanup();
        reject(new Error(errorMessage));
      };

      // Create cleanup function
      const cleanup = () => {
        socketRef.current?.off('gameStarted', onGameStarted);
        socketRef.current?.off('error', onError);
      };

      // Register event listeners
      socketRef.current.once('gameStarted', onGameStarted);
      socketRef.current.once('error', onError);

      // Emit start game event
      socketRef.current.emit('startGame', { roomId });
      console.log('startGame emitted:', { roomId });
    });
  };

  

  return {
    socket: socketRef.current,
    isConnected,
    error,
    clearError,
    createRoom,
    joinRoom,
    startGame,
    reconnect,
    disconnect,
  };
}