'use client';

import { useGameSync } from '@/hooks/useGameSync';
import { useGameStore } from '@/store/gameStore';
import type { Player } from '@/store/gameStore';
import GameBoard from '@/components/GameBoard';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

interface CreateRoomClientProps {
  username: string;
}

export function CreateRoomClient({ username }: CreateRoomClientProps) {
  const { socket, createRoom } = useGameStore();
  const [localRoomId, setLocalRoomId] = useState<string>('');
  const { isConnected, error, gameState } = useGameSync(localRoomId);
  console.log(gameState, "gameState");
  // Create room when component mounts
  useEffect(() => {
    if (!socket || !username || localRoomId) return;

    const initializeRoom = async () => {
      try {
        const settings = {
          map: 'Classic' as const,
          maxPlayers: 4,
          startingAmount: 1500
        };
        const roomId = await createRoom(settings, username);
        setLocalRoomId(roomId);
      } catch (error) {
        console.error('Failed to create room:', error);
      }
    };

    initializeRoom();
  }, [socket, username, localRoomId, createRoom]);

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Connecting to server...</h1>
          {error && <p className="text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  if (!gameState?.roomId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Creating room...</h1>
          {error && <p className="text-red-500">{error}</p>}
        </div>
      </div>
    );
  }

  const isHost = gameState.players.find((player: Player) => player.id === socket?.id);

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Room: {gameState.roomId}</h1>
            <p className="text-gray-400">Share this room ID with friends to join</p>
          </div>
          {isHost && (
            <Button
              onClick={() => useGameStore.getState().startGame()}
              disabled={gameState.players.length < 2 || gameState.gameStarted}
              className="bg-green-600 hover:bg-green-700"
            >
              {gameState.players.length < 2 
                ? `Waiting for players (${gameState.players.length}/4)`
                : gameState.gameStarted 
                  ? 'Game in progress'
                  : 'Start Game'}
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <GameBoard roomId={gameState.roomId} />
      </div>
    </div>
  );
} 