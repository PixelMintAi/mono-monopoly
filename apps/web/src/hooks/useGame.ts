'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { v4 as uuidv4 } from 'uuid';
import type { Player, GameSettings, GameState } from '@/types/game';

interface UseGameProps {
  username: string;
}

export function useGame({ username }: UseGameProps) {
  const { socket, isConnected } = useSocket();
  
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    settings:{
      map: 'Classic',
      maxPlayers: 4,
      startingAmount: 1500,
    },
    currentPlayerIndex: 0,
    gameStarted: false,
    roomId: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (!socket || !username) return;

    const createRoom = () => {
      const newRoomId = uuidv4();
      const settings: GameSettings = {
        map: 'Classic',
        maxPlayers: 4,
        startingAmount: 1500
      };

      socket.emit('createRoom', { 
        roomId: newRoomId, 
        settings,
        username 
      });
      setGameState(prev => ({ ...prev, roomId: newRoomId }));
      setIsHost(true);
    };

    createRoom();

    socket.on('roomCreated', (data: { roomId: string }) => {
      setGameState(prev => ({ ...prev, roomId: data.roomId }));
      setError(null);
    });

    socket.on('playerJoined', (data: { player: Player }) => {
      setGameState(prev => ({
        ...prev,
        players: [...prev.players, data.player]
      }));
    });

    socket.on('gameStateUpdated', (data: { players: Player[] }) => {
      setGameState(prev => ({ ...prev, players: data.players }));
    });

    socket.on('error', (errorMessage: string) => {
      setError(errorMessage);
    });

    return () => {
      socket.off('roomCreated');
      socket.off('playerJoined');
      socket.off('gameStateUpdated');
      socket.off('error');
    };
  }, [socket, username]);

  const handleRollDice = (roll: number[]) => {
    if (!socket || !gameState.roomId) return;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const newPosition = (currentPlayer.position + roll[0] + roll[1]) % 40;
    
    setGameState(prev => {
      const updatedPlayers = [...prev.players];
      updatedPlayers[prev.currentPlayerIndex] = {
        ...updatedPlayers[prev.currentPlayerIndex],
        position: newPosition
      };
      return { ...prev, players: updatedPlayers };
    });

    socket.emit('playerMove', {
      roomId: gameState.roomId,
      playerId: currentPlayer.id,
      newPosition
    });
  };

  const handleEndTurn = () => {
    if (!socket || !gameState.roomId) return;
    const nextPlayerIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    
    setGameState(prev => ({
      ...prev,
      currentPlayerIndex: nextPlayerIndex
    }));

    socket.emit('turnEnd', {
      roomId: gameState.roomId,
      nextPlayerIndex
    });
  };

  const startGame = () => {
    if (!socket || !gameState.roomId) return;
    
    setGameState(prev => ({ ...prev, gameStarted: true }));
    socket.emit('startGame', { roomId: gameState.roomId });
  };

  return {
    gameState,
    error,
    isConnected,
    isHost,
    handleRollDice,
    handleEndTurn,
    startGame
  };
} 