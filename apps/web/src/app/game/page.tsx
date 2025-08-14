"use client";
import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { GameState, Player, Space } from "./types";
import { saveToStorage, loadFromStorage, clearAllStorage } from "./persistence";
import { setupSocketHandlers } from "./socketHandlers";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import AllPlayersInfo from "@/components/AllPlayersInfo";
import Navbar from "@/components/Navbar";
import GameSettings from "@/components/GameSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FaEthereum } from "react-icons/fa";
import { Switch } from "@/components/ui/switch";
import GamePlaySettings from "@/components/GamePlaySettings";
import BoardSpace from "@/components/GameBoard/BoardSpace";
import Dice from "@/components/GameBoard/Dice";
import PlayerPiece from "@/components/GameBoard/Playerpiece";
import UserProperties from "@/components/UserProperties";
import { FiCopy } from "react-icons/fi";
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
import TradeDashboard from "@/components/TradeDashboard";
import { usePathname, useSearchParams } from "next/navigation";

const MonopolyGame: React.FC = () => {
  // Connection state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const containerRef = useRef(null);
  // Navigation state with localStorage persistence
  const [currentPageState, setCurrentPageState] = useState<"menu" | "game">(
    () => {
      const savedPage = loadFromStorage("currentPage", "menu");
      const savedGameState = loadFromStorage("gameState", null);
      // If we have a saved game state, go to game page
      if (savedGameState && savedPage === "game") {
        return "game";
      }
      return "menu";
    }
  );

  // Room state with localStorage persistence
  const [roomId, setRoomId] = useState(() => loadFromStorage("roomId", ""));
  const [username, setUsername] = useState(() =>
    loadFromStorage("username", "")
  );
  const [playerUUID] = useState(() => {
    let uuid = loadFromStorage("playerUUID", null);
    if (!uuid) {
      uuid = Math.random().toString(36).substr(2, 9);
      saveToStorage("playerUUID", uuid);
    }
    return uuid;
  });

  console.log(playerUUID,'pid')

  useEffect(() => {
    if (username !== "") {
      saveToStorage("usernickname", username);
    }
  }, [username]);

  // Game state with localStorage persistence
  const [gameState, setGameState] = useState<GameState | null>(() => {
    return loadFromStorage("gameState", null);
  });

  const [waitingStatus, setWaitingStatus] = useState<any>(() => {
    return loadFromStorage("waitingStatus", null);
  });
  const [messages, setMessages] = useState<string[]>([]);
  const [availableProperty, setAvailableProperty] = useState<any>(null);
  const [error, setError] = useState<string>("");

  // Settings state with localStorage persistence
  const [roomSettings, setRoomSettings] = useState(() => {
    return loadFromStorage("roomSettings", {
      maxPlayers: 4,
      startingAmount: 1500,
      map: "Classic",
      cryptoPoolActivated: false,
      poolAmountToEnter: 0.001,
    });
  });
    const pathname = usePathname();
  const [fullUrl, setFullUrl] = useState('');
  const searchParams = useSearchParams();
  const paramRoomId = searchParams.get('roomId');
  const [tabValue, settabValue] = useState("createroom")
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFullUrl(`${window.location.origin}${pathname}`);
    }
  }, [pathname]);

  const handleCopy = () => {
    if(gameState){
      navigator.clipboard.writeText(fullUrl+`?roomId=${gameState?.roomId}`);
    }
  };

  useEffect(()=>{
    if(paramRoomId){
      setRoomId(paramRoomId)
      settabValue("joinroom")
    }
  },[paramRoomId])

  // Save data to localStorage whenever state changes
  useEffect(() => {
    saveToStorage("roomId", roomId);
  }, [roomId]);

  useEffect(() => {
    saveToStorage("username", username);
  }, [username]);

  useEffect(() => {
    saveToStorage("currentPage", currentPageState);
  }, [currentPageState]);

  useEffect(() => {
    saveToStorage("roomSettings", roomSettings);
  }, [roomSettings]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io("http://localhost:3001"); // Adjust URL as needed
    setSocket(newSocket);

    setupSocketHandlers(
      newSocket,
      setConnected,
      setCurrentPageState,
      setGameState,
      setWaitingStatus,
      setMessages,
      setAvailableProperty,
      setError,
      playerUUID
    );

    return () => {
      newSocket.close();
    };
  }, [playerUUID]);

  // Helper functions
  const createRoom = () => {
    if (!socket || !roomId || !username) return;

    socket.emit("createRoom", {
      roomId,
      settings: roomSettings,
      username,
      playerUUID,
    });
  };

  const joinRoom = () => {
    if (!socket || !roomId || !username) return;

    socket.emit("joinRoom", {
      roomId,
      username,
      playerUUID,
    });
  };

  const startGame = () => {
    if (!socket || !gameState) return;
    socket.emit("startGame", { roomId: gameState.roomId });
  };

  const rollDice = () => {
    if (!socket || !gameState) return;
    socket.emit("rollDice", { roomId: gameState.roomId });
  };

  const updateSettings = () => {
    if (!socket || !gameState) return;
    socket.emit("updateSettings", {
      roomId: gameState.roomId,
      settings: roomSettings,
    });
  };

  const buyProperty = (propertyId: string) => {
    if (!socket || !gameState) return;
    socket.emit("buyProperty", {
      roomId: gameState.roomId,
      propertyId: propertyId,
    });
  };

  const sellProperty = (propertyId: string) => {
    if (!socket || !gameState) return;
    socket.emit("sellProperty", {
      roomId: gameState.roomId,
      propertyId: propertyId,
    });
  };

  const mortagedProperty=(propertyId: string) => {
    if (!socket || !gameState) return;
    socket.emit("mortageProperty", {
      roomId: gameState.roomId,
      propertyId: propertyId,
    });
  };

    const getBackmortagedProperty=(propertyId: string) => {
    if (!socket || !gameState) return;
    socket.emit("getBackMortagedProperty", {
      roomId: gameState.roomId,
      propertyId: propertyId,
    });
  };


  const kickPlayer = (playerId: string) => {
    if (!socket || !gameState) return;
    socket.emit("kickPlayer", {
      roomId: gameState.roomId,
      targetPlayerId: playerId,
    });
  };

  const handleBankrupcy = (playerId: string) => {
    if (!socket || !gameState) return;
    socket.emit("playerBankrupt", {
      roomId: gameState.roomId,
      targetPlayerId: playerId,
    });
  };

  const endTurn = () => {
    if (!socket || !gameState) return;
    socket.emit("endTurn", { roomId: gameState.roomId });
  };

  const requestGameState = () => {
    if (!socket || !gameState) return;
    socket.emit("requestGameState", { roomId: gameState.roomId });
  };

  // Get current player
  const getCurrentPlayer = () => {
    if (!gameState) return null;
    return gameState.players.find((p) => p.uuid === playerUUID);
  };

  const isCurrentPlayerTurn = () => {
    if (!gameState) return false;
    const currentPlayer = getCurrentPlayer();
    return (
      currentPlayer &&
      gameState.players[gameState.currentPlayerIndex]?.uuid === playerUUID
    );
  };

  const [isRolling, setisRolling] = useState(false);
  const [players, setplayers] = useState([]);
  // Render functions
  const renderMenuPage = () => (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-700 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-4xl text-center text-emerald-400">
              Moonopoly
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="createroom" value={tabValue}>
              <TabsList className="bg-gray-600 cursor-pointer w-full">
                <TabsTrigger className="cursor-pointer" value="createroom" onClick={()=>{
                  settabValue("createroom")
                }}>
                  Create Room
                </TabsTrigger>
                <TabsTrigger className="cursor-pointer" value="joinroom" onClick={()=>{
                  settabValue("joinroom")
                }}>
                  Join Room
                </TabsTrigger>
                <TabsTrigger
                  className="cursor-pointer"
                  value="allrooms"
                  disabled={true}
                  onClick={()=>{
                  settabValue("allrooms")
                }}
                >
                  All Rooms
                </TabsTrigger>
              </TabsList>
              <TabsContent value="createroom">
                <div>
                  <Label htmlFor="username">Enter Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <Label htmlFor="roomId">Enter Room ID</Label>
                  <Input
                    id="roomId"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="e.g. ABC123"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxPlayers">Max Players</Label>
                    <Select
                      value={String(roomSettings.maxPlayers)}
                      onValueChange={(value) => {
                        setRoomSettings((s: any) => ({
                          ...s,
                          maxPlayers: Number(value),
                        }));
                      }}
                    >
                      <SelectTrigger className="w-[80px] cursor-pointer">
                        <SelectValue placeholder="Select Players" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {[2, 3, 4, 5, 6].map((num) => (
                            <SelectItem key={num} value={String(num)}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="startingAmount">Starting Amount</Label>
                    <Select
                      value={String(roomSettings.startingAmount)}
                      onValueChange={(value) => {
                        setRoomSettings((s: any) => ({
                          ...s,
                          startingAmount: Number(value),
                        }));
                      }}
                    >
                      <SelectTrigger className="w-[85px] cursor-pointer">
                        <SelectValue placeholder="Select Starting Cash" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {[1000, 1500, 2000, 2500, 3000].map((amount) => (
                            <SelectItem key={amount} value={String(amount)}>
                              {amount}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col justify-between">
                    <div className="flex gap-2 items-center">Crypto Pool</div>
                    <div className="flex gap-2 mr-2">
                      <Switch
                        color="#fff"
                        checked={roomSettings.cryptoPoolActivated}
                        onCheckedChange={(checked) => {
                          setRoomSettings((s: any) => ({
                            ...s,
                            cryptoPoolActivated: checked,
                          }));
                        }}
                        className={
                          roomSettings.cryptoPoolActivated
                            ? "bg-blue-500 data-[state=checked]:bg-blue-500 cursor-pointer"
                            : "bg-gray-300 cursor-pointer"
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="poolEntry">Enter Pool Amount (ETH)</Label>
                    <Input
                      id="poolEntry"
                      type="number"
                      placeholder="0.001 ETH"
                      disabled={!roomSettings.cryptoPoolActivated}
                      value={roomSettings.poolAmountToEnter}
                      onChange={(e) =>
                        setRoomSettings((s: any) => ({
                          ...s,
                          poolAmountToEnter: +e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="flex space-x-4">
                  <Button
                    onClick={createRoom}
                    disabled={!connected || !username || !roomId}
                    className="flex-1 mt-[1rem] cursor-pointer"
                  >
                    Create Room
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="joinroom">
                <div>
                  <Label htmlFor="username">Enter Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <Label htmlFor="roomId">Enter Room ID</Label>
                  <Input
                    id="roomId"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="e.g. ABC123"
                  />
                </div>
                <div className="flex space-x-4 mt-[1rem]">
                  <Button
                    onClick={joinRoom}
                    disabled={!connected || !username || !roomId}
                    className="flex-1 cursor-pointer"
                  >
                    Join Room
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
            <p className="text-center text-sm">
              {connected ? (
                <span className="text-green-400">🟢 Online</span>
              ) : (
                <span className="text-red-400">🔴 Offline</span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderGamePage = () => {
    if (!gameState) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-600 flex flex-col items-center justify-center text-white">
          <p className="text-2xl mb-4">Loading...</p>
          <Button onClick={requestGameState}>Sync</Button>
        </div>
      );
    }

    const currentPlayer =  getCurrentPlayer();
    const myTurn = isCurrentPlayerTurn();

    console.log(currentPlayer, "current player");

    return (
      <div>
        {/* <Navbar /> */}
        <div className=" min-h-screen bg-gradient-to-br from-purple-900 to-indigo-800 p-4">
          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Waiting Status */}

          <div className=" mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Board */}

            <Card className="lg:col-span-2 p-0">
              {/* <CardHeader className="bg-emerald-600 text-white p-4 rounded-t-lg flex justify-between">
                <span>Room {gameState.roomId}</span>
              </CardHeader> */}
              <CardContent className="p-0 bg-transparent border-0 rounded-lg">
                <div
                  ref={containerRef}
                  className="relative w-full aspect-square bg-gray-900 rounded-lg overflow-hidden max-h-[95vh]"
                >
                  {/* Game board */}
                  <div className="absolute inset-0 grid grid-cols-11 grid-rows-11 gap-1 p-4">
                    {/* Corner spaces */}
                    <div className="col-start-1 col-span-1 row-start-11 row-span-1">
                      <BoardSpace space={gameState.boardSpaces[30]} />{" "}
                      {/* GO TO PRISON */}
                    </div>
                    <div className="col-start-11 col-span-1 row-start-11 row-span-1">
                      <BoardSpace space={gameState.boardSpaces[20]} />{" "}
                      {/* VACATION */}
                    </div>
                    <div className="col-start-11 col-span-1 row-start-1 row-span-1">
                      <BoardSpace space={gameState.boardSpaces[10]} />{" "}
                      {/* IN PRISON */}
                    </div>
                    <div className="col-start-1 col-span-1 row-start-1 row-span-1">
                      <BoardSpace space={gameState.boardSpaces[0]} />{" "}
                      {/* Start */}
                    </div>

                    {gameState.boardSpaces
                      .slice(1, 10)
                      .reverse()
                      .map((space, index) => (
                        <div
                          key={space.id}
                          className="row-start-1 col-span-1 bg-blue-900 rounded-lg flex items-center justify-center"
                          style={{ gridColumn: `${9 - index + 1}` }}
                        >
                          <BoardSpace space={space} />
                        </div>
                      ))}

                    {/* Right column */}
                    {gameState.boardSpaces
                      .slice(11, 20)
                      .reverse()
                      .map((space, index) => (
                        <div
                          key={space.id}
                          className="col-start-11 row-span-1 bg-blue-900 rounded-lg flex items-center justify-center"
                          style={{ gridRow: `${10 - index}` }}
                        >
                          <BoardSpace space={space} />
                        </div>
                      ))}

                    {/* Top row */}
                    {gameState.boardSpaces
                      .slice(21, 30)
                      .reverse()
                      .map((space, index) => (
                        <div
                          key={space.id}
                          className="row-start-11 col-span-1 bg-blue-900 rounded-lg flex items-center justify-center"
                          style={{ gridColumn: `${index + 2}` }}
                        >
                          <BoardSpace space={space} />
                        </div>
                      ))}

                    {/* Left column */}
                    {gameState.boardSpaces
                      .slice(31, 40)
                      .reverse()
                      .map((space, index) => (
                        <div
                          key={space.id}
                          className="col-start-1 row-span-1 bg-blue-900 rounded-lg flex items-center justify-center"
                          style={{ gridRow: `${index + 2}` }}
                        >
                          <BoardSpace space={space} />
                        </div>
                      ))}

                    {/* Center area with dice and game info */}
                    <div className="col-start-3 col-span-7 row-start-3 row-span-7 rounded-lg flex flex-col items-center justify-center">
                      {/* Game logo */}
                      <h1 className="text-4xl font-bold text-yellow-400 mb-8">
                        MOONOPOLY
                      </h1>

                      {/* Dice */}
                      <div className="flex space-x-4 mb-8">
                        {gameState.lastDiceRoll?.dice1 && (
                          <Dice
                            value={gameState.lastDiceRoll.dice1}
                            isRolling={isRolling}
                          />
                        )}
                        {gameState.lastDiceRoll?.dice2 && (
                          <Dice
                            value={gameState.lastDiceRoll.dice2}
                            isRolling={isRolling}
                          />
                        )}
                      </div>

                      {/* Game message */}
                      {!gameState.gameStarted &&
                        currentPlayer?.isLeader === true && (
                          <Button
                            className="cursor-pointer"
                            disabled={gameState.players.length < 2}
                            onClick={() => {
                              startGame();
                            }}
                          >
                            Start Game
                          </Button>
                        )}

                      {/* Current player info */}
                      {gameState.gameStarted && (
                        <div className="text-white mb-6">
                          {gameState.players[gameState.currentPlayerIndex] && (
                            <div className="flex items-center">
                              <div
                                className="w-4 h-4 rounded-full mr-2"
                                style={{
                                  backgroundColor:
                                    gameState.players[
                                      gameState.currentPlayerIndex
                                    ].color,
                                }}
                              ></div>
                              <span>
                                {
                                  gameState.players[
                                    gameState.currentPlayerIndex
                                  ].name
                                }
                                &apos;s turn
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      {gameState.gameStarted && (
                        <div className="mt-2 text-center space-y-4">
                          {myTurn ? (
                            currentPlayer?.hasRolled ? (
                              <div className="flex gap-2">
                                {gameState.boardSpaces[
                                  gameState.players[
                                    gameState.currentPlayerIndex
                                  ].position
                                ].ownedBy === null &&
                                  gameState.boardSpaces[
                                    gameState.players[
                                      gameState.currentPlayerIndex
                                    ].position
                                  ].price !== 0 &&
                                  gameState.players[
                                    gameState.currentPlayerIndex
                                  ].money >=
                                    gameState.boardSpaces[
                                      gameState.players[
                                        gameState.currentPlayerIndex
                                      ].position
                                    ].price && (
                                    <Button
                                      className="cursor-pointer"
                                      onClick={() => {
                                        buyProperty(
                                          gameState.boardSpaces[
                                            gameState.players[
                                              gameState.currentPlayerIndex
                                            ].position
                                          ].id
                                        );
                                        // handleBuy();
                                      }}
                                    >
                                      Buy for $
                                      {
                                        gameState.boardSpaces[
                                          gameState.players[
                                            gameState.currentPlayerIndex
                                          ].position
                                        ].price
                                      }
                                    </Button>
                                  )}
                                <Button size="lg" onClick={endTurn}>
                                  End Turn
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <Button
                                  size="lg"
                                  variant="destructive"
                                  onClick={rollDice}
                                >
                                  Roll 🎲
                                </Button>
                              </div>
                            )
                          ) : (
                            <p className="text-gray-200"></p>
                          )}
                        </div>
                      )}
                      <ScrollArea className="h-48 p-4">
                        <div className="space-y-1">
                          {[...messages].reverse().map((msg, i) => (
                            <p key={i} className="text-sm text-white">
                              {msg}
                            </p>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>

                  {/* Player pieces */}
                  {gameState.players.map((player) => (
                    <PlayerPiece
                      key={player.id}
                      player={player}
                      spaces={gameState.boardSpaces}
                      isCurrentPlayer={false}
                      hasRolled={false}
                      containerRef={containerRef}
                      onEndTurn={function (): void {
                        throw new Error("Function not implemented.");
                      }}
                    />
                  ))}
                  {/* Overlay when game is full */}
                </div>
              </CardContent>
            </Card>

            {/* Sidebar */}
            <div className="p-2 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl text-white font-bold">
                  Room: {gameState.roomId}
                  <div className="flex">
                    <div className="flex p-2 gap-[0.4rem] border rounded-lg cursor-pointer items-center">
                      <FiCopy />
                      <text onClick={()=>{
                        handleCopy()
                      }}>Copy Game Url</text>
                    </div>
                  </div>
                </h1>
                <button
                  onClick={() => {
                    clearAllStorage();
                    setCurrentPageState("menu");
                    setGameState(null);
                    setWaitingStatus(null);
                    setMessages([]);
                  }}
                  className="bg-red-700 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-red-800"
                >
                  Leave Game
                </button>
              </div>
              <AllPlayersInfo
                players={gameState.players}
                currentPlayer={currentPlayer}
                gameStarted={gameState.gameStarted}
                gameState={gameState}
                playerUUID={playerUUID}
                setCurrentPageState={setCurrentPageState}
                kickPlayer={kickPlayer}
              />
              {gameState.gameStarted && (
                <div className="flex justify-between mb-4">
                  <Button className="cursor-pointer" disabled={true}>
                    Votekick
                  </Button>
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
                          properties and all the money you have and will loose
                          the game
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="cursor-pointer">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="cursor-pointer bg-red-500 hover:bg-red-600"
                          onClick={() => {
                            if (currentPlayer) {
                              handleBankrupcy(currentPlayer.id);
                            }
                          }}
                        >
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
              {gameState.gameStarted && (
                <TradeDashboard
                  players={gameState?.players}
                  selfUserId={currentPlayer?.id ?? ""}
                  socket={socket}
                  roomId={gameState.roomId}
                />
              )}
              {gameState.settings && !gameState.gameStarted && (
                <GameSettings
                  gameState={gameState}
                  currentPlayer={currentPlayer}
                  updateSettings={updateSettings}
                  setRoomSettings={setRoomSettings}
                  roomSettings={roomSettings}
                />
              )}
              {!gameState.gameStarted ? (
                <GamePlaySettings />
              ) : (
                <UserProperties
                  players={gameState.players}
                  currentPlayerIndex={gameState.players.findIndex(
                    (item) => item?.uuid === currentPlayer?.uuid
                  )}
                  sellProperty={sellProperty}
                  mortageProperty={mortagedProperty}
                  getBackMortagedProperty={getBackmortagedProperty}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return currentPageState === "menu" ? renderMenuPage() : renderGamePage();
};

export default MonopolyGame;
