import React, { useEffect, useState } from "react";
import GameBoard from "../GameBoard";
import { Player } from "@/interfaces/interface";
import AllPlayersInfo from "../AllPlayersInfo";
import GameSettings from "../GameSettings";
import GamePlaySettings from "../GamePlaySettings";
import UserProperties from "../UserProperties";
import TradeDashboard from "../TradeDashboard";
import { useRouter } from "next/router";
import { FiCopy } from "react-icons/fi";
import { Button } from "../ui/button";
import { useSocket } from "@/hooks/useSocket";
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

const RoomDashboard = () => {
  const { socket } = useSocket();
  const router = useRouter();
  const { id: roomId } = router.query;
  const [isRouterReady, setIsRouterReady] = useState(false);

  console.log(roomId, "roomId in room dashboard");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playersCount, setplayersCount] = useState<string>("4");
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [gameMessage, setGameMessage] = useState<string>("Waiting for players to join...");
  const [spectatingUser, setspectatingUser] = useState<boolean>(false);
  const [gameStarted, setgameStarted] = useState(false);
  const [fullUrl, setFullUrl] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Router ready effect
  useEffect(() => {
    if (router.isReady) {
      setIsRouterReady(true);
    }
  }, [router.isReady]);

  // Socket connection effect
  useEffect(() => {
    if (!socket || !roomId || !isRouterReady) return;

    console.log('Joining room:', roomId);
    socket.emit('joinRoom', roomId);

    socket.on('roomState', (roomState: { players: Player[], currentPlayerIndex: number }) => {
      console.log('Received room state:', roomState);
      setPlayers(roomState.players);
      setCurrentPlayerIndex(roomState.currentPlayerIndex);
      setGameMessage(`Room joined! ${roomState.players.length} players in the room.`);
      setIsJoining(false);
    });

    socket.on('gameStateUpdated', (newState: any) => {
      console.log('Game state updated:', newState);
      if (newState.players) {
        setPlayers(newState.players);
      }
      if (typeof newState.currentPlayerIndex === 'number') {
        setCurrentPlayerIndex(newState.currentPlayerIndex);
      }
    });

    socket.on('playerJoined', (newPlayer: Player) => {
      console.log('Player joined:', newPlayer);
      setPlayers(prevPlayers => {
        // Check if player already exists
        if (prevPlayers.some(p => p.id === newPlayer.id)) {
          return prevPlayers;
        }
        const updatedPlayers = [...prevPlayers, newPlayer];
        console.log('Updated players list:', updatedPlayers);
        return updatedPlayers;
      });
      setGameMessage(`${newPlayer.name} joined the game!`);
    });

    socket.on('playerLeft', (playerId: string) => {
      console.log('Player left:', playerId);
      setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== playerId));
      setGameMessage('A player left the game');
    });

    socket.on('gameStarted', () => {
      console.log('Game started');
      setgameStarted(true);
      setGameMessage("Game started! Roll the dice.");
    });

    socket.on('error', (error: string) => {
      console.error('Socket error:', error);
      setGameMessage(`Error: ${error}`);
      setIsJoining(false);
    });

    return () => {
      socket.off('roomState');
      socket.off('gameStateUpdated');
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('gameStarted');
      socket.off('error');
    };
  }, [socket, roomId, isRouterReady]);

  // Effect to handle player count changes
  useEffect(() => {
    if (players.length > 0) {
      setGameMessage(`${players.length} players in the room`);
    }
  }, [players.length]);

  // Effect to handle game start when enough players join
  useEffect(() => {
    if (players.length === Number(playersCount) && !gameStarted) {
      setGameMessage('All players have joined! Ready to start the game.');
    }
  }, [players.length, playersCount, gameStarted]);

  // Handle dice roll
  const handleRollDice = (roll: number[]) => {
    if (!socket || !roomId) return;
    
    const currentPlayer = players[currentPlayerIndex];
    const diceSum = roll[0] + roll[1];

    socket.emit('updatePlayerPosition', {
      roomId,
      playerId: currentPlayer.id,
      roll: diceSum
    });

    setGameMessage(
      `${currentPlayer.name} rolled ${roll[0]}+${roll[1]}=${diceSum}`
    );
  };

  const handleBankrupt = () => {
    if (!socket || !roomId) return;
    const currentPlayer = players[currentPlayerIndex];
    
    socket.emit('playerBankrupt', {
      roomId,
      playerId: currentPlayer.id
    });
  };

  const handleCopy = () => {
    const fullUrl = `${window.location.origin}${router.asPath}`;
    navigator.clipboard
      .writeText(fullUrl)
      .then(() => {
        setGameMessage('Room link copied to clipboard!');
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
        setGameMessage('Failed to copy room link');
      });
  };

  // Handle end turn
  const handleEndTurn = () => {
    if (!socket || !roomId) return;
    socket.emit('endTurn', { roomId });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFullUrl(window.location.origin + router.asPath);
    }
  }, [router.asPath]);
  console.log(players, "players in room dashboard ")
  console.log(currentPlayerIndex, "currentPlayerIndex in room dashboard")
  console.log(gameMessage, "gameMessage in room dashboard")
  console.log(gameStarted, "gameStarted in room dashboard")
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

        {/* Players List */}
        <div className="mt-4 p-4 bg-amber-800 rounded">
          <h2 className="text-xl font-bold mb-4">Players in Room</h2>
          <div className="space-y-2">
            {players.map((player) => (
              <div key={player.id} className="flex items-center gap-2 p-2 bg-amber-700 rounded">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: player.color }}
                />
                <span>{player.name}</span>
              </div>
            ))}
          </div>
          {players.length === 0 && (
            <p className="text-center text-gray-300">No players yet</p>
          )}
        </div>
      </div>

      <GameBoard
        players={players}
        currentPlayerIndex={currentPlayerIndex}
        onRollDice={handleRollDice}
        onEndTurn={handleEndTurn}
        gameStarted={gameStarted}
        setgameStarted={setgameStarted}
        setPlayers={setPlayers}
        roomId={roomId as string}
      />

      <div className="w-1/3 overflow-y-auto max-h-full custom-scrollbar">
        <div className="p-2">
          <AllPlayersInfo
            players={players}
            leader={"4"}
            gameStarted={gameStarted}
          />
          {!gameStarted && (
            <GameSettings
              leader={"4"}
              players={players}
              setPlayers={setPlayers}
              playersCount={playersCount}
              setplayersCount={setplayersCount}
            />
          )}
          {!gameStarted && <GamePlaySettings leader={"4"} />}
          {gameStarted && (
            <div className="flex justify-between pl-4 pr-4 mb-4">
              <Button className="cursor-pointer">Votekick</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="cursor-pointer">Bankrupt</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. You will loose all your properties and all the money you have and will loose the game
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                    <AlertDialogAction className="cursor-pointer bg-red-500 hover:bg-red-600" onClick={handleBankrupt}>
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          {gameStarted && (
            <TradeDashboard
              players={players}
              selfUserId={"2"}
              setPlayers={setPlayers}
            />
          )}
          {gameStarted && (
            <UserProperties
              players={players}
              currentPlayerIndex={currentPlayerIndex}
            />
          )}
        </div>
      </div>
      {players.length == Number(playersCount) && !spectatingUser && (
        <div className="fixed inset-0 bg-[rgba(133, 133, 133, 0.6)] bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-500">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center w-[90%] max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Game is Full
            </h2>
            <div className="flex justify-center gap-4">
              <Button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
                onClick={() => {
                  setspectatingUser(true);
                }}
              >
                Spectate
              </Button>
              <Button className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition cursor-pointer" onClick={()=>{
                router.push('/')
              }}>
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
