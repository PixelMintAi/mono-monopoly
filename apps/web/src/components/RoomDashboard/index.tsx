import React, { useCallback, useEffect, useState, Dispatch, SetStateAction } from "react";
import GameBoard from "../GameBoard";
import AllPlayersInfo from "../AllPlayersInfo";
import GameSettings from "../GameSettings";
import GamePlaySettings from "../GamePlaySettings";
import UserProperties from "../UserProperties";
import TradeDashboard from "../TradeDashboard";
import { useRouter } from "next/navigation";
import { FiCopy } from "react-icons/fi";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useGameSync } from "@/hooks/useGameSync";
import { useGameStore } from "@/store/gameStore";
import { Player, GameState } from "@/types/game";
import { useSocket } from "@/hooks/useSocket";
import { getOrCreatePlayerUUID } from "@/utils/initPlayerId";

const RoomDashboard = ({ roomId }: { roomId: string }) => {
  const router = useRouter();
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { socket, isConnected, error: socketError, joinRoom } = useSocket();
  const [username, setUsername] = useState<string>("");
  const [spectatingUser, setSpectatingUser] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState(false);
  const { gameState, refreshGameState } = useGameSync(roomId);
  const { rollDice, endTurn, buyProperty, startGame, isRolling, updateSettings } = useGameStore();
  const maxRetries = 3;

  // Initialize username from localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem('usernickname');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  // Handle game state updates
  useEffect(() => {
    if (gameState) {
      setGameStarted(gameState.gameStarted);
      const playerId = localStorage.getItem('playerUUID');
      if (playerId) {
        const me = gameState.players.find((p) => p?.uuid === playerId);
        if (me) {
          setCurrentPlayer(me);
          setIsJoined(true);
        }
      }
    }
  }, [gameState]);

  // Handle room joining
  useEffect(() => {
    if (!socket || !isConnected || !username || isJoining || isJoined) {
      return;
    }

    const attemptJoinRoom = async () => {
      try {
        setIsJoining(true);
        setError(null);
        
        const playerUUID = localStorage.getItem('playerUUID');
        if (!playerUUID) {
          throw new Error('Player UUID not found');
        }

        console.log('Attempting to join room:', { roomId, username, playerUUID });
        await joinRoom(roomId, username, playerUUID);
        
        // Request game state after successful join
        socket.emit('requestGameState', { roomId });
        
        setIsJoined(true);
        setRetryCount(0);
      } catch (err) {
        console.error('Failed to join room:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to join room';
        setError(errorMessage);
        
        if (errorMessage === 'Room not found' && retryCount < maxRetries) {
          console.log(`Retrying join (${retryCount + 1}/${maxRetries})...`);
          setRetryCount(prev => prev + 1);
          setTimeout(attemptJoinRoom, 1000 * Math.pow(2, retryCount)); // Exponential backoff
        } else if (retryCount >= maxRetries) {
          setError('Failed to join room after multiple attempts. Please try again later.');
        }
      } finally {
        setIsJoining(false);
      }
    };

    attemptJoinRoom();
  }, [socket, isConnected, username, roomId, isJoining, isJoined, joinRoom, retryCount]);

  // Handle socket errors
  useEffect(() => {
    if (socketError) {
      setError(socketError);
    }
  }, [socketError]);

  // Show loading state while connecting
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

  // Show joining state
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

  const [fullUrl, setFullUrl] = useState("");

  const handleCopy = () => {
    const fullUrl = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard
      .writeText(fullUrl)
      .then(() => {
        alert('URL copied to clipboard!');
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  const handleBankrupt = () => {
    if (!gameState) return;
    const currentPlayerId = currentPlayer?.id;
    if (!currentPlayerId) return;

    socket?.emit('playerBankrupt', { 
      roomId: gameState.roomId,
      playerId: currentPlayerId
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFullUrl(window.location.origin + `/room/${roomId}`);
    }
  }, []);

  const indexMatch = gameState?.players?.findIndex(item => item?.uuid === currentPlayer?.uuid) ?? -1;

  const setPlayers: Dispatch<SetStateAction<Player[]>> = useCallback((newPlayers) => {
    if (typeof newPlayers === 'function') {
      const updatedPlayers = newPlayers(gameState?.players ?? []);
      socket?.emit('updatePlayers', { roomId, players: updatedPlayers });
    } else {
      socket?.emit('updatePlayers', { roomId, players: newPlayers });
    }
  }, [socket, roomId, gameState?.players]);

  // Add a default game state for when gameState is null
  const defaultGameState: GameState = {
    roomId,
    players: [],
    settings: {
      map: 'Classic',
      maxPlayers: 4,
      startingAmount: 1500,
      cryptoPoolActivated: false,
      poolAmountToEnter: 0.001
    },
    currentPlayerIndex: 0,
    gameStarted: false,
    boardSpaces: [],
    lastDiceRoll: null
  };

  return (
    <div className="pt-[5rem] w-full flex p-6 h-[calc(100vh)]">
      <div className="w-1/3 flex flex-col">
        <div className="flex flex-col p-2 bg-amber-800 rounded mr-5">
          <text className="text-center w-full mt-[1.5rem]">
            Share Game Link
          </text>
          <div className="flex gap-[1rem] items-center mt-[1rem] mb-[1rem]">
            <div className="p-2 border rounded">{fullUrl}</div>
            <div className="flex p-2 gap-[0.4rem] border rounded cursor-pointer items-center">
              <FiCopy />
              <text onClick={handleCopy}>Copy</text>
            </div>
          </div>
        </div>
        <div className="flex flex-col mt-4 mr-4 p-2 bg-fuchsia-950 rounded">
          <text className="w-full text-center">Chat Room</text>
          <text className="mt-8 mb-8 w-full font-bold text-2xl text-center">
            Coming Soon!!!!
          </text>
        </div>
      </div>

      <GameBoard
        players={gameState?.players ?? []}
        currentPlayerIndex={gameState?.currentPlayerIndex ?? 0}
        onRollDice={rollDice}
        onEndTurn={endTurn}
        gameStarted={gameStarted}
        setgameStarted={setGameStarted}
        setPlayers={setPlayers}
        attemptJoinRoom={attemptJoinRoom}
        refreshGameState={refreshGameState}
        currentPlayer={currentPlayer}
        startGame={startGame}
        onBuyProperty={buyProperty}
      />

      <div className="w-1/3 overflow-y-auto max-h-full custom-scrollbar">
        <div className="p-2">
          {gameState && (
            <AllPlayersInfo
              players={gameState.players}
              leader={"4"}
              gameStarted={gameStarted}
            />
          )}
          {!gameStarted && gameState && (
            <GameSettings
              leader={"4"}
              players={gameState.players}
              setPlayers={setPlayers}
              playersCount={String(gameState.settings.maxPlayers)}
              setplayersCount={() => {}}
              currentPlayer={currentPlayer}
              updateSettings={updateSettings}
              refreshGameState={refreshGameState}
              gameState={gameState}
            />
          )}
          {!gameStarted && <GamePlaySettings leader={"4"} />}
          {gameStarted && (
            <div className="flex justify-between pl-4 pr-4 mb-4">
              <Button className="cursor-pointer">Votekick</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="cursor-pointer">
                    Bankrupt
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. You will loose all your
                      properties and all the money you have and will loose the
                      game
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="cursor-pointer">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="cursor-pointer bg-red-500 hover:bg-red-600"
                      onClick={handleBankrupt}
                    >
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          {gameStarted && (
            <TradeDashboard
              players={gameState?.players ?? []}
              selfUserId={"2"}
              setPlayers={setPlayers}
            />
          )}
          {gameStarted && (
            <UserProperties
              players={gameState?.players ?? []}
              currentPlayerIndex={indexMatch}
            />
          )}
        </div>
      </div>
      {gameState?.players.length === gameState?.settings?.maxPlayers && !currentPlayer && (
        <div className="fixed inset-0 bg-[rgba(133, 133, 133, 0.6)] bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-500">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center w-[90%] max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Game is Full
            </h2>
            <div className="flex justify-center gap-4">
              <Button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
                onClick={() => {
                  setSpectatingUser(true);
                }}
              >
                Spectate
              </Button>
              <Button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition cursor-pointer"
                onClick={() => {
                  router.push("/");
                }}
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomDashboard;
