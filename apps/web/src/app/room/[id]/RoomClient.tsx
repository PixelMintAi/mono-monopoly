'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';
import GameBoard from '@/components/GameBoard';
import { Button } from '@/components/ui/button';
import { Player } from '@/types/game';

interface WaitingStatus {
  roomId: string;
  waitingForPlayers: boolean;
  currentPlayers: number;
  maxPlayers: number;
}

interface RoomClientProps {
  roomId: string;
  username: string;
}

export function RoomClient({ roomId, username }: RoomClientProps) {
  const { socket, isConnected, error: socketError, joinRoom } = useSocket();
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [waitingStatus, setWaitingStatus] = useState<WaitingStatus | null>(null);
  const maxRetries = 3;

  const attemptJoinRoom = useCallback(async () => {
    if (!socket || !isConnected || !username || isJoining) {
      return;
    }

    try {
      setIsJoining(true);
      setError(null);
      console.log('Attempting to join room:', { roomId, username });
      
      await joinRoom(roomId, username);
      setIsJoined(true);
      setRetryCount(0);
    } catch (err) {
      console.error('Failed to join room:', err);
      setError(err instanceof Error ? err.message : 'Failed to join room');
      
      if (retryCount < maxRetries) {
        console.log(`Retrying join (${retryCount + 1}/${maxRetries})...`);
        setRetryCount(prev => prev + 1);
        setTimeout(attemptJoinRoom, 2000);
      }
    } finally {
      setIsJoining(false);
    }
  }, [socket, isConnected, username, roomId, joinRoom, isJoining, retryCount]);

  // Handle initial connection and room joining
  useEffect(() => {
    console.log('RoomClient effect triggered:', { 
      socket: !!socket, 
      isConnected, 
      username, 
      roomId,
      isJoined,
      isJoining,
      waitingStatus 
    });

    if (!socket || !isConnected || !username) {
      return;
    }

    // If we're not joined and not currently joining, attempt to join
    if (!isJoined && !isJoining) {
      attemptJoinRoom();
    }

    // Set up socket event listeners
    const handleGameStateUpdate = (data: { 
      players: Player[];
      currentPlayerIndex: number;
      gameStarted: boolean;
      lastDiceRoll: any;
      boardSpaces: any[];
    }) => {
      console.log('Game state updated event received:', {
        players: data.players,
        currentPlayerIndex: data.currentPlayerIndex,
        gameStarted: data.gameStarted,
        hasBoardSpaces: !!data.boardSpaces,
        boardSpacesLength: data.boardSpaces?.length
      });
      setPlayers(data.players);
      setCurrentPlayerIndex(data.currentPlayerIndex);
      setGameStarted(data.gameStarted);
    };

    const handleGameStart = (data: { 
      roomId: string;
      players: Player[];
      currentPlayerIndex: number;
    }) => {
      console.log('Game started event received:', data);
      setGameStarted(true);
      setPlayers(data.players);
      setCurrentPlayerIndex(data.currentPlayerIndex);
    };

    const handleWaitingStatus = (status: WaitingStatus) => {
      console.log('Waiting status updated:', status);
      setWaitingStatus(status);
    };

    const handleTurnChange = (data: { nextPlayerIndex: number }) => {
      console.log('Turn changed event received:', data);
      setCurrentPlayerIndex(data.nextPlayerIndex);
    };

    const handleError = (errorMessage: string) => {
      console.error('Socket error event received:', errorMessage);
      setError(errorMessage);
    };

    const handleConnectError = (err: Error) => {
      console.error('Socket connection error:', err);
      setError('Failed to connect to server');
    };

    const handleDisconnect = (reason: string) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, attempt to reconnect
        socket.connect();
      }
    };

    // Register event listeners
    socket.on('gameStateUpdated', handleGameStateUpdate);
    socket.on('gameStarted', handleGameStart);
    socket.on('waitingStatus', handleWaitingStatus);
    socket.on('turnChanged', handleTurnChange);
    socket.on('error', handleError);
    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);

    // Request initial game state
    if (isJoined) {
      console.log('Requesting initial game state for room:', roomId);
      socket.emit('requestGameState', { roomId }, (response: any) => {
        console.log('Request game state response:', response);
      });
    }

    // Add logging for join confirmation
    socket.on('joinConfirmed', (data) => {
      console.log('Join confirmed event received:', data);
      setIsJoined(true);
    });

    // Add logging for room created
    socket.on('roomCreated', (data) => {
      console.log('Room created event received:', data);
      setIsJoined(true);
    });

    // Cleanup
    return () => {
      console.log('Cleaning up socket listeners');
      socket.off('gameStateUpdated', handleGameStateUpdate);
      socket.off('gameStarted', handleGameStart);
      socket.off('waitingStatus', handleWaitingStatus);
      socket.off('turnChanged', handleTurnChange);
      socket.off('error', handleError);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket, isConnected, username, roomId, isJoined, isJoining, attemptJoinRoom]);

  // Handle socket errors
  useEffect(() => {
    if (socketError) {
      setError(socketError);
    }
  }, [socketError]);

  const handleRollDice = (roll: number[]) => {
    if (!socket || !isConnected || !isJoined) return;
    const currentPlayer = players[currentPlayerIndex];
    const newPosition = (currentPlayer.position + roll[0] + roll[1]) % 40;
    
    socket.emit('playerMove', {
      roomId,
      playerId: currentPlayer.id,
      newPosition
    });
  };

  const handleEndTurn = () => {
    if (!socket || !isConnected || !isJoined) return;
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    
    socket.emit('turnEnd', {
      roomId,
      nextPlayerIndex
    });
  };

  // Connection state UI
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Connecting to server...</h1>
          {error && <p className="text-red-500">{error}</p>}
          {retryCount > 0 && (
            <p className="text-yellow-500">Retrying connection ({retryCount}/{maxRetries})...</p>
          )}
        </div>
      </div>
    );
  }

  // Joining state UI
  if (!isJoined || isJoining) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            {isJoining ? 'Joining room...' : 'Preparing to join room...'}
          </h1>
          {error && <p className="text-red-500">{error}</p>}
          {retryCount > 0 && (
            <p className="text-yellow-500">Retrying join ({retryCount}/{maxRetries})...</p>
          )}
        </div>
      </div>
    );
  }

  // Waiting for players UI
  if (waitingStatus?.waitingForPlayers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Waiting for Players</h1>
          <p className="text-gray-400 mb-2">
            {waitingStatus.currentPlayers} of {waitingStatus.maxPlayers} players joined
          </p>
          <p className="text-gray-400">
            Share this room code with friends: <span className="font-mono bg-gray-800 px-2 py-1 rounded">{roomId}</span>
          </p>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      </div>
    );
  }

  // Main game UI
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Room: {roomId}</h1>
            <p className="text-gray-400">
              {gameStarted ? 'Game in progress' : 'Waiting for game to start...'}
            </p>
            {waitingStatus && (
              <p className="text-gray-400">
                Players: {waitingStatus.currentPlayers}/{waitingStatus.maxPlayers}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <GameBoard
          players={players}
          currentPlayerIndex={currentPlayerIndex}
          onRollDice={handleRollDice}
          onEndTurn={handleEndTurn}
          gameStarted={gameStarted}
          setGameStarted={setGameStarted}
          setPlayers={setPlayers}
          roomId={roomId}
        />
      </div>
    </div>
  );
} 