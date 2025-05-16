import { useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { useGameStore } from '@/store/gameStore';
import type { GameState } from '@/store/gameStore';

export function useGameSync(roomId: string) {
  const { socket, isConnected } = useSocket();
  const {
    setSocket,
    setGameState,
    setError,
    setIsRolling,
    setGameMessage,
  } = useGameStore();

  // Use refs to access latest game state without causing re-renders
  const gameStateRef = useRef<GameState | null>(null);
  
  // Update ref when game state changes
  useEffect(() => {
    gameStateRef.current = useGameStore.getState().gameState;
  }, []);

  // Set socket in store when available
  useEffect(() => {
    setSocket(socket);
  }, [socket, setSocket]);

  // Memoize event handlers with stable dependencies
  const handleConnect = useCallback(() => {
    if (!socket || !roomId) return;
    console.log('[GameSync] Socket connected', { socketId: socket.id, roomId });
    socket.emit('requestGameState', { roomId });
  }, [socket, roomId]);

  const handleDisconnect = useCallback(() => {
    console.log('[GameSync] Socket disconnected');
    setError('Disconnected from server');
  }, [setError]);

  const handleGameStateUpdate = useCallback((state: GameState) => {
    console.log('[GameSync] Game state updated', { state });
    setGameState(state);
    gameStateRef.current = state;
  }, [setGameState]);

  const handleDiceRolled = useCallback((roll: { dice1: number; dice2: number; playerId: string }) => {
    setIsRolling(false);
    const currentState = gameStateRef.current;
    const player = currentState?.players.find(p => p.id === roll.playerId);
    setGameMessage(`${player?.name || 'A player'} rolled ${roll.dice1} and ${roll.dice2}`);
  }, [setIsRolling, setGameMessage]);

  const handlePropertyAvailable = useCallback((data: { playerId: string; propertyId: string; price: number }) => {
    if (data.playerId === socket?.id) {
      setGameMessage(`You landed on a property! You can buy it for $${data.price}`);
    }
  }, [socket?.id, setGameMessage]);

  const handlePropertyBought = useCallback((data: { playerId: string; propertyId: string }) => {
    const currentState = gameStateRef.current;
    const player = currentState?.players.find(p => p.id === data.playerId);
    if (player) {
      setGameMessage(`${player.name} bought a property!`);
    }
  }, [setGameMessage]);

  const handleTurnChanged = useCallback((data: { nextPlayerIndex: number }) => {
    const currentState = gameStateRef.current;
    const nextPlayer = currentState?.players[data.nextPlayerIndex];
    if (nextPlayer) {
      setGameMessage(`${nextPlayer.name}'s turn`);
    }
  }, [setGameMessage]);

  const handleError = useCallback((message: string) => {
    console.error('[GameSync] Error:', message);
    setError(message);
  }, [setError]);

  // Handle socket events with stable dependencies
  useEffect(() => {
    if (!socket) return;

    const handlers = {
      connect: handleConnect,
      disconnect: handleDisconnect,
      gameStateUpdated: handleGameStateUpdate,
      diceRolled: handleDiceRolled,
      propertyAvailable: handlePropertyAvailable,
      propertyBought: handlePropertyBought,
      turnChanged: handleTurnChanged,
      error: handleError,
    };

    // Register all event handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Initial connection handling
    if (socket.connected && roomId) {
      handleConnect();
    }

    // Cleanup
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket, roomId, handleConnect]); // Only depend on stable values

  return {
    isConnected,
    error: useGameStore.getState().error,
    gameState: useGameStore.getState().gameState,
  };
} 