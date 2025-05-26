"use client"
import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, Player, Space } from './types';
import { saveToStorage, loadFromStorage, clearAllStorage } from './persistence';
import { setupSocketHandlers } from './socketHandlers';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

const MonopolyGame: React.FC = () => {
  // Connection state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  
  // Navigation state with localStorage persistence
  const [currentPageState, setCurrentPageState] = useState<'menu' | 'game'>(() => {
    const savedPage = loadFromStorage('currentPage', 'menu');
    const savedGameState = loadFromStorage('gameState', null);
    // If we have a saved game state, go to game page
    if (savedGameState && savedPage === 'game') {
      return 'game';
    }
    return 'menu';
  });
  
  // Room state with localStorage persistence
  const [roomId, setRoomId] = useState(() => loadFromStorage('roomId', ''));
  const [username, setUsername] = useState(() => loadFromStorage('username', ''));
  const [playerUUID] = useState(() => {
    let uuid = loadFromStorage('playerUUID', null);
    if (!uuid) {
      uuid = Math.random().toString(36).substr(2, 9);
      saveToStorage('playerUUID', uuid);
    }
    return uuid;
  });
  
  // Game state with localStorage persistence
  const [gameState, setGameState] = useState<GameState | null>(() => {
    return loadFromStorage('gameState', null);
  });
  const [waitingStatus, setWaitingStatus] = useState<any>(() => {
    return loadFromStorage('waitingStatus', null);
  });
  const [messages, setMessages] = useState<string[]>(() => {
    return loadFromStorage('messages', []);
  });
  const [availableProperty, setAvailableProperty] = useState<any>(null);
  const [error, setError] = useState<string>('');
  
  // Settings state with localStorage persistence
  const [roomSettings, setRoomSettings] = useState(() => {
    return loadFromStorage('roomSettings', {
      maxPlayers: 4,
      startingAmount: 1500,
      poolAmountToEnter: 0
    });
  });

  // Save data to localStorage whenever state changes
  useEffect(() => {
    saveToStorage('roomId', roomId);
  }, [roomId]);

  useEffect(() => {
    saveToStorage('username', username);
  }, [username]);

  useEffect(() => {
    saveToStorage('currentPage', currentPageState);
  }, [currentPageState]);

  useEffect(() => {
    saveToStorage('roomSettings', roomSettings);
  }, [roomSettings]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3001'); // Adjust URL as needed
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
    
    socket.emit('createRoom', {
      roomId,
      settings: roomSettings,
      username,
      playerUUID
    });
  };

  const joinRoom = () => {
    if (!socket || !roomId || !username) return;
    
    socket.emit('joinRoom', {
      roomId,
      username,
      playerUUID
    });
  };

  const startGame = () => {
    if (!socket || !gameState) return;
    socket.emit('startGame', { roomId: gameState.roomId });
  };

  const rollDice = () => {
    if (!socket || !gameState) return;
    socket.emit('rollDice', { roomId: gameState.roomId });
  };

  const buyProperty = () => {
    if (!socket || !gameState || !availableProperty) return;
    socket.emit('buyProperty', { 
      roomId: gameState.roomId, 
      propertyId: availableProperty.propertyId 
    });
  };

  const endTurn = () => {
    if (!socket || !gameState) return;
    socket.emit('endTurn', { roomId: gameState.roomId });
  };

  const requestGameState = () => {
    if (!socket || !gameState) return;
    socket.emit('requestGameState', { roomId: gameState.roomId });
  };

  // Get current player
  const getCurrentPlayer = () => {
    if (!gameState) return null;
    return gameState.players.find(p => p.uuid === playerUUID);
  };

  const isCurrentPlayerTurn = () => {
    if (!gameState) return false;
    const currentPlayer = getCurrentPlayer();
    return currentPlayer && gameState.players[gameState.currentPlayerIndex]?.uuid === playerUUID;
  };

  // Render functions
  const renderMenuPage = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-700 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-4xl text-center text-emerald-400">Monopoly</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div>
            <Label htmlFor="roomId">Room ID</Label>
            <Input
              id="roomId"
              value={roomId}
              onChange={e => setRoomId(e.target.value)}
              placeholder="e.g. ABC123"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="maxPlayers">Max</Label>
              <Input
                id="maxPlayers"
                type="number"
                min={2}
                max={8}
                value={roomSettings.maxPlayers}
                onChange={e => setRoomSettings((s:any) => ({ ...s, maxPlayers: +e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="startingAmount">Start $</Label>
              <Input
                id="startingAmount"
                type="number"
                value={roomSettings.startingAmount}
                onChange={e => setRoomSettings((s:any) => ({ ...s, startingAmount: +e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="poolEntry">Pool $</Label>
              <Input
                id="poolEntry"
                type="number"
                value={roomSettings.poolAmountToEnter}
                onChange={e => setRoomSettings((s:any) => ({ ...s, poolAmountToEnter: +e.target.value }))}
              />
            </div>
          </div>
          <div className="flex space-x-4">
            <Button onClick={createRoom} disabled={!connected || !username || !roomId} className="flex-1">
              Create
            </Button>
            <Button
              variant="secondary"
              onClick={joinRoom}
              disabled={!connected || !username || !roomId}
              className="flex-1"
            >
              Join
            </Button>
          </div>
          <p className="text-center text-sm">
            {connected ? <span className="text-green-400">🟢 Online</span> : <span className="text-red-400">🔴 Offline</span>}
          </p>
        </CardContent>
      </Card>
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
  
    const currentPlayer = getCurrentPlayer();
    const myTurn = isCurrentPlayerTurn();
  
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-800 p-4">
           <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Room: {gameState.roomId}</h1>
              <button
                onClick={() => {
                  clearAllStorage();
                  setCurrentPageState('menu');
                  setGameState(null);
                  setWaitingStatus(null);
                  setMessages([]);
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Leave Game
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Waiting Status */}
          {waitingStatus && !gameState.gameStarted && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
              Waiting for players... ({waitingStatus.currentPlayers}/{waitingStatus.maxPlayers})
              {currentPlayer?.isLeader && waitingStatus.currentPlayers >= 2 && (
                <button
                  onClick={startGame}
                  className="ml-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Start Game
                </button>
              )}
              <button
                onClick={requestGameState}
                className="ml-2 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
              >
                Refresh
              </button>
            </div>
          )}

        <div className=" mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Board */}
          <Card className="lg:col-span-2 p-0">
            <CardHeader className="bg-emerald-600 text-white p-4 rounded-t-lg flex justify-between">
              <span>Room {gameState.roomId}</span>
              <Button size="sm" variant="ghost" onClick={() => { clearAllStorage(); setCurrentPageState('menu'); }}>
                Exit
              </Button>
            </CardHeader>
            <CardContent className="bg-green-50 p-2">
              <div className="grid grid-cols-8 gap-2">
                {gameState.boardSpaces.map((s, i) => (
                  <div
                    key={i}
                    className={`
                      border p-1 text-xs text-center flex flex-col justify-center items-centers size-24
                      ${s.ownedBy ? 'bg-emerald-200' : 'bg-gray-100'}
                      ${gameState.players.some(p => p.position === i) ? 'ring-4 ring-red-500' : ''}
                    `}
                  >
                    <div className="truncate font-semibold">{s.name}</div>
                    {s.price && <div className="text-green-700 text-sm">${s.price}</div>}
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center space-y-4">
                {gameState.lastDiceRoll && (
                  <p className="text-lg text-white">
                    Rolled: {gameState.lastDiceRoll.dice1} + {gameState.lastDiceRoll.dice2}
                  </p>
                )}
                {myTurn ? (
                  currentPlayer?.hasRolled ? (
                    <Button size="lg" onClick={endTurn}>
                      End Turn
                    </Button>
                  ) : (
                    <Button size="lg" variant="destructive" onClick={rollDice}>
                      Roll 🎲
                    </Button>
                  )
                ) : (
                  <p className="text-gray-200">
                    {gameState.players[gameState.currentPlayerIndex]?.name}’s turn
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
  
          {/* Sidebar */}
          <div className="space-y-6">
        
            <Card>
              <CardHeader>
                <CardTitle>Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {gameState.players.map((p, idx) => (
                    <div
                      key={p.id}
                      className={`
                        p-3 rounded-lg border
                        ${idx === gameState.currentPlayerIndex ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 bg-white'}
                        ${p.uuid === playerUUID ? 'ring-2 ring-blue-400' : ''}
                      `}
                    >
                      <p className="font-semibold">
                        {p.name} {p.isLeader && '👑'}
                      </p>
                      <p className="text-sm">${p.money} | Pos: {p.position}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
  
            {availableProperty && availableProperty.playerId === currentPlayer?.id && (
              <Card>
                <CardHeader>
                  <CardTitle>Buy Offer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>Price: ${availableProperty.price}</p>
                  <div className="flex space-x-2">
                    <Button onClick={buyProperty}>Buy</Button>
                    <Button variant="ghost" onClick={() => setAvailableProperty(null)}>
                      Skip
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
  
            <Card className="h-64">
              <CardHeader>
                <CardTitle>Game Log</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-48 p-4">
                  <div className="space-y-1">
                    {messages.map((msg, i) => (
                      <p key={i} className="text-sm">
                        {msg}
                      </p>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };
  

  return currentPageState === 'menu' ? renderMenuPage() : renderGamePage();
};

export default MonopolyGame;