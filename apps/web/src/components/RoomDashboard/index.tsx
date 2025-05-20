import React, { useCallback, useEffect, useState } from "react";
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
import { Player } from "@/types/game";
import { useSocket } from "@/hooks/useSocket";
import { getOrCreatePlayerUUID } from "@/utils/initPlayerId";

const RoomDashboard = ({ roomId }: { roomId: string }) => {
  const [players, setPlayers] = useState<Player[]>([
    {
      id: "1",
      name: "Player 1",
      color: "#FF5733",
      position: 0,
      money: 1500,
      properties: [],
      inJail: false,
      jailTurns: 0,
      cards: [],
      bankRupt: false,
      uuid: "",
      isLeader: false,
      hasRolled: false
    },
  ]);
  const [currentPlayer, setcurrentPlayer] = useState<Player |null>(null)
  const [error, setError] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { socket, isConnected, error: socketError, joinRoom} = useSocket();
  const [username, setusername] = useState<string>("trial");
  const maxRetries = 3;
  useEffect(()=>{
    console.log(socket,'socket triggered')
  },[socket])
  // useEffect(() => {
  //   if (username !== "") {
  //     localStorage.setItem("usernickname", username);
  //   }
  // }, [username]);
  const attemptJoinRoom = async () => {
    if (!socket || !isConnected || !username) {
      return;
    }

    try {
      setIsJoining(true);
      setError(null);
      console.log(retryCount, "netry");
      const playerUUID = getOrCreatePlayerUUID();
      if (playerUUID) {
        localStorage.setItem("playerUUID", playerUUID);
      }
      await joinRoom(roomId, username, playerUUID);
      setIsJoined(true);
      setRetryCount(0);
    } catch (err) {
      console.error("Failed to join room:", err);
      setError(err instanceof Error ? err.message : "Failed to join room");

      if (retryCount < maxRetries) {
        console.log(`Retrying join (${retryCount + 1}/${maxRetries})...`);
        setRetryCount((prev) => prev + 1);
        setTimeout(attemptJoinRoom, 2000);
      }
    } finally {
      setIsJoining(false);
    }
  };

    useEffect(()=>{
    const playerId=localStorage?.getItem('playerUUID')
    if(playerId){
      const me = gameState?.players.find((p:any) => p?.uuid === playerId);
      if(me){
        setcurrentPlayer(me)
      }
    }
  },[attemptJoinRoom])
  const [playersCount, setplayersCount] = useState<string>("2");
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [gameMessage, setGameMessage] = useState<string>(
    "Game started! Roll the dice."
  );
  const { gameState, refreshGameState } = useGameSync(roomId);
  useEffect(() => {
    if (roomId && socket) {
      if (gameState) {
        setPlayers(gameState?.players);
        setgameStarted(gameState?.gameStarted)
        setCurrentPlayerIndex(gameState?.currentPlayerIndex)
      }
    }
  }, [gameState,socket]);
  console.log(gameState,'game')

  const { rollDice, endTurn, buyProperty, startGame, isRolling ,updateSettings} =
    useGameStore();
  const [spectatingUser, setspectatingUser] = useState<boolean>(false);
  const [gameStarted, setgameStarted] = useState(false);
  // Handle dice roll
  const handleRollDice = (roll: number[]) => {
    const currentPlayer = players[currentPlayerIndex];
    const diceSum = roll[0] + roll[1];

    // Create a copy of the players array to modify
    const updatedPlayers = [...players];

    // Calculate new position (wrap around the board at 40 spaces)
    const newPosition = (currentPlayer.position + diceSum) % 40;

    // Update player position
    updatedPlayers[currentPlayerIndex] = {
      ...currentPlayer,
      position: newPosition,
    };

    setPlayers(updatedPlayers);
    setGameMessage(
      `${currentPlayer.name} rolled ${roll[0]}+${roll[1]}=${diceSum} and moved to space ${newPosition}`
    );
  };
  const currentPlayerId = 1;

  const handleBankrupt = () => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) =>
        player.id === String(currentPlayerId)
          ? { ...player, bankRupted: true, money: 0, properties: [] }
          : player
      )
    );
  };

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

  // Handle end turn
  const handleEndTurn = () => {
    let nextPlayerIndex = currentPlayerIndex;
    const totalPlayers = players.length;

    // Loop to find the next non-bankrupted player
    for (let i = 1; i <= totalPlayers; i++) {
      const potentialIndex = (currentPlayerIndex + i) % totalPlayers;
      if (!players[potentialIndex].bankRupt) {
        nextPlayerIndex = potentialIndex;
        break;
      }
    }

    setCurrentPlayerIndex(nextPlayerIndex);
    setGameMessage(`${players[nextPlayerIndex].name}'s turn`);
  };
  const router = useRouter();
  useEffect(() => {
    if (typeof window !== "undefined") {
      setFullUrl(window.location.origin + `/room/${roomId}`);
    }
  }, []);
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
              <text
                onClick={() => {
                  handleCopy();
                }}
              >
                Copy
              </text>
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
        players={players}
        currentPlayerIndex={currentPlayerIndex}
        onRollDice={rollDice}
        onEndTurn={endTurn}
        gameStarted={gameStarted}
        setgameStarted={setgameStarted}
        setPlayers={setPlayers}
        attemptJoinRoom={attemptJoinRoom}
        refreshGameState={refreshGameState}
        currentPlayer={currentPlayer}
        startGame={startGame}
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
                      onClick={() => {
                        handleBankrupt();
                      }}
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
      {players.length == gameState?.settings?.maxPlayers && !currentPlayer && (
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
