import { useEffect, useCallback, useRef } from "react";
import { useSocket } from "./useSocket";
import { useGameStore } from "@/store/gameStore";
import type { GameState } from "@/store/gameStore";

export function useGameSync(roomId: string) {
  const { socket, isConnected } = useSocket();
  const {
    setSocket,
    setGameState,
    setError,
    setIsRolling,
    setGameMessage,
  } = useGameStore();

  // Use a ref to track if we're currently refreshing to prevent loops
  const isRefreshingRef = useRef(false);
  const gameStateRef = useRef<GameState | null>(null);

  // Subscribe to game state changes using a selector
  const gameState = useGameStore(state => state.gameState);

  // Update ref only when gameState actually changes
  useEffect(() => {
    if (JSON.stringify(gameStateRef.current) !== JSON.stringify(gameState)) {
      gameStateRef.current = gameState;
    }
  }, [gameState]);

  const refreshGameState = useCallback(() => {
    if (socket?.connected && roomId && !isRefreshingRef.current) {
      isRefreshingRef.current = true;
      console.log("[GameSync] Manually refreshing game state");
      socket.emit("requestGameState", { roomId });
      // Reset the refreshing flag after a short delay
      setTimeout(() => {
        isRefreshingRef.current = false;
      }, 100);
    }
  }, [socket, roomId]);

  useEffect(() => {
    if (socket) {
      setSocket(socket);
    }
  }, [socket, setSocket]);

  const handleConnect = useCallback(() => {
    if (!socket || !roomId) return;
    console.log("[GameSync] Socket connected:", socket.id);
    if (!isRefreshingRef.current) {
      socket.emit("requestGameState", { roomId });
      socket.emit("stateAcknowledged", { roomId });
    }
  }, [socket, roomId]);

  const handleDisconnect = useCallback(() => {
    console.warn("[GameSync] Disconnected from server");
    setError("Disconnected from server");
    isRefreshingRef.current = false;
  }, [setError]);

  const handleGameStateUpdate = useCallback((state: GameState) => {
    // Only update if the state has actually changed
    if (JSON.stringify(gameStateRef.current) !== JSON.stringify(state)) {
      console.log("[GameSync] Received gameStateUpdated", state);
      setGameState(state);
      gameStateRef.current = state;
    }
    isRefreshingRef.current = false;
  }, [setGameState]);

  const handleDiceRolled = useCallback((roll: { dice1: number; dice2: number; playerId: string }) => {
    setIsRolling(false);
    const player = gameStateRef.current?.players.find((p) => p.id === roll.playerId);
    setGameMessage(`${player?.name || "A player"} rolled ${roll.dice1} and ${roll.dice2}`);
  }, [setIsRolling, setGameMessage]);

  const handlePropertyAvailable = useCallback((data: { playerId: string; propertyId: string; price: number }) => {
    if (data.playerId === socket?.id) {
      setGameMessage(`You landed on a property! You can buy it for $${data.price}`);
    }
  }, [socket?.id, setGameMessage]);

  const handlePropertyBought = useCallback((data: { playerId: string; propertyId: string }) => {
    const player = gameStateRef.current?.players.find((p) => p.id === data.playerId);
    if (player) {
      setGameMessage(`${player.name} bought a property!`);
    }
  }, [setGameMessage]);

  const handleTurnChanged = useCallback((data: { nextPlayerIndex: number }) => {
    const nextPlayer = gameStateRef.current?.players[data.nextPlayerIndex];
    if (nextPlayer) {
      setGameMessage(`${nextPlayer.name}'s turn`);
    }
  }, [setGameMessage]);

  const handlePlayerJoined = useCallback((data: { playerId: string; playerName: string; playerCount: number; maxPlayers: number }) => {
    console.log(`[GameSync] Player joined: ${data.playerName} (${data.playerCount}/${data.maxPlayers})`);
    setGameMessage(`${data.playerName} joined the game!`);
    // Ensure state refresh
    socket?.emit("requestGameState", { roomId });
  }, [socket, roomId, setGameMessage]);

  const handleWaitingStatus = useCallback((data: { roomId: string; waitingForPlayers: boolean; currentPlayers: number; maxPlayers: number }) => {
    console.log(`[GameSync] Waiting for players: ${data.currentPlayers}/${data.maxPlayers}`);
    if (data.waitingForPlayers) {
      setGameMessage(`Waiting for players (${data.currentPlayers}/${data.maxPlayers})`);
    }
  }, [setGameMessage]);

  const handleError = useCallback((message: string) => {
    console.error("[GameSync] Server error:", message);
    setError(message);
  }, [setError]);

  useEffect(() => {
    if (!socket || !roomId) return;

    const handlers = {
      connect: handleConnect,
      disconnect: handleDisconnect,
      gameStateUpdated: handleGameStateUpdate,
      diceRolled: handleDiceRolled,
      propertyAvailable: handlePropertyAvailable,
      propertyBought: handlePropertyBought,
      turnChanged: handleTurnChanged,
      playerJoined: handlePlayerJoined,
      waitingStatus: handleWaitingStatus,
      error: handleError,
    };

    // Register handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    if (socket.connected) {
      handleConnect();
    }

    // Remove the fallback timeout as it's not needed and can cause extra refreshes
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
      isRefreshingRef.current = false;
    };
  }, [
    socket,
    roomId,
    handleConnect,
    handleDisconnect,
    handleGameStateUpdate,
    handleDiceRolled,
    handlePropertyAvailable,
    handlePropertyBought,
    handleTurnChanged,
    handlePlayerJoined,
    handleWaitingStatus,
    handleError
  ]);

  return {
    isConnected,
    error: useGameStore(state => state.error),
    gameState: useGameStore(state => state.gameState),
    refreshGameState,
  };
}
