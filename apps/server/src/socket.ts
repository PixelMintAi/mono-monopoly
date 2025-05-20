import { Server, Socket } from 'socket.io';
import { Player, Room, SocketEvents, Space } from '@monopoly/shared';
import { BOARD_SPACES } from '@monopoly/shared/constants';

// ─── Helpers ────────────────────────────────────────────────────────────────────

// Validate that a room's state is well‑formed before broadcasting
function validateRoomState(room: Room): boolean {
  if (!room || !room.players || !room.boardSpaces) return false;
  if (room.currentPlayerIndex >= room.players.length) return false;
  if (room.players.some(p => !p.id || !p.name)) return false;
  return true;
}

// Broadcast an error message to everyone in a room
function broadcastError(io: Server, roomId: string, error: string) {
  io.to(roomId).emit('error', error);
  console.error(`Room ${roomId} error:`, error);
}

// Broadcast the full game state to everyone in a room
function broadcastGameState(io: Server, room: Room) {
  if (!validateRoomState(room)) {
    console.error('Invalid room state, not broadcasting:', room);
    return;
  }
  io.to(room.id).emit('gameStateUpdated', {
    roomId: room.id,
    players: room.players,
    currentPlayerIndex: room.currentPlayerIndex,
    gameStarted: room.gameStarted,
    lastDiceRoll: room.lastDiceRoll,
    boardSpaces: room.boardSpaces,
  });
}

// ─── Main Socket Setup ─────────────────────────────────────────────────────────

export function setupSocketHandlers(io: Server, rooms: Map<string, Room>) {
  console.log(rooms,'rooms')
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // ─── State Queries ────────────────────────────────────────────────

    // Client asks for the current game state
    socket.on('requestGameState', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) {
        return socket.emit('error', 'Room not found');
      }
      socket.emit('gameStateUpdated', {
        roomId: room.id,
        settings:room.settings,
        players: room.players,
        currentPlayerIndex: room.currentPlayerIndex,
        gameStarted: room.gameStarted,
        lastDiceRoll: room.lastDiceRoll,
        boardSpaces: room.boardSpaces,
      });
    });

    // Client acknowledges receipt of the state
    socket.on('stateAcknowledged', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      console.log(`Player ${socket.id} acknowledged state in room ${roomId}`);
      socket.emit('waitingStatus', {
        roomId,
        waitingForPlayers: !room.gameStarted && room.players.length < room.settings.maxPlayers,
        currentPlayers: room.players.length,
        maxPlayers: room.settings.maxPlayers,
      });
    });

    // ─── Room Lifecycle ──────────────────────────────────────────────

    // Create a new room
    socket.on('createRoom', ({ roomId, settings, username,playerUUID }: SocketEvents['createRoom']) => {
      if (rooms.has(roomId)) {
        return socket.emit('error', 'Room already exists');
      }
      // initialize board
      const boardSpaces: Space[] = BOARD_SPACES.map(space => ({ ...space, ownedBy: null }));
      const room: Room = {
        id: roomId,
        settings,
        players: [{
          id: socket.id,
          uuid:playerUUID,
          name: username,
          isLeader:true,
          color: '#FF0000',
          position: 0,
          money: settings.startingAmount,
          properties: [],
          inJail: false,
          jailTurns: 0,
          cards: [],
          hasRolled: false,
          bankRupt:false
        }],
        gameStarted: false,
        currentPlayerIndex: 0,
        boardSpaces,
        lastDiceRoll: null,
      };

      if (!validateRoomState(room)) {
        return socket.emit('error', 'Invalid room state');
      }

      rooms.set(roomId, room);
      socket.join(roomId);
      socket.emit('roomCreated', { roomId });
      socket.emit('waitingStatus', {
        roomId,
        waitingForPlayers: true,
        currentPlayers: 1,
        maxPlayers: settings.maxPlayers,
      });
      broadcastGameState(io, room);
      console.log(`Room ${roomId} created by ${username} ${rooms}`);
    });

    // Join an existing room
    socket.on('joinRoom', ({ roomId, username,playerUUID }: SocketEvents['joinRoom']) => {
      const room = rooms.get(roomId);
      if (!room) {
        return socket.emit('error', 'Room not found');
      }
      if (room.gameStarted) {
        return socket.emit('error', 'Game has already started');
      }
      if (room.players.length >= room.settings.maxPlayers) {
        return socket.emit('error', 'Room is full');
      }

      const player: Player = {
        id: socket.id,
        name: username,
        uuid:playerUUID,
        isLeader:false,
        color: '#0000FF',
        position: 0,
        money: room.settings.startingAmount,
        properties: [],
        inJail: false,
        jailTurns: 0,
        cards: [],
        hasRolled: false,
        bankRupt:false
      };
      room.players.push(player);
      socket.join(roomId);

      // Confirmation to the new player
      socket.emit('joinConfirmed', {
        roomId,
        playerId: socket.id,
        waitingForPlayers: room.players.length < room.settings.maxPlayers,
        currentPlayers: room.players.length,
        maxPlayers: room.settings.maxPlayers,
      });
      io.to(roomId).emit('playerJoined', {
        playerId: socket.id,
        playerName: player.name,
        playerCount: room.players.length,
        maxPlayers: room.settings.maxPlayers
      });
      console.log("Emitting gameStateUpdated to room", roomId);
      io.to(roomId).emit("gameStateUpdated",{
        roomId: room.id,
        settings:room.settings,
        players: room.players,
        currentPlayerIndex: room.currentPlayerIndex,
        gameStarted: room.gameStarted,
        lastDiceRoll: room.lastDiceRoll,
        boardSpaces: room.boardSpaces,
      });
      
      // Notify everyone of updated waiting status & state
      io.to(roomId).emit('waitingStatus', {
        roomId,
        waitingForPlayers: room.players.length < room.settings.maxPlayers,
        currentPlayers: room.players.length,
        maxPlayers: room.settings.maxPlayers,
      });
      broadcastGameState(io, room);
      console.log(`${username} joined room ${roomId}`);
    });

    // Start the game
    socket.on('startGame', ({ roomId }: SocketEvents['startGame']) => {
      const room = rooms.get(roomId);
      if (!room) return socket.emit('error', 'Room not found');
      console.log('found')
      if (room.players.length < 2) return socket.emit('error', 'Need at least 2 players to start');
      console.log('work')
      if (!validateRoomState(room)) {
        return broadcastError(io, roomId, 'Invalid room state');
      }

      room.gameStarted = true;
      room.currentPlayerIndex = 0;
      room.players.forEach(p => (p.hasRolled = false));

      io.to(roomId).emit('gameStarted', {
        roomId,
        players: room.players,
        currentPlayerIndex: room.currentPlayerIndex,
      });
      broadcastGameState(io, room);
      console.log(`Game started in room ${roomId}`);
    });

    // ─── Gameplay Actions ────────────────────────────────────────────

    // Roll the dice
 socket.on('rollDice', ({ roomId }: SocketEvents['rollDice']) => {
  const room = rooms.get(roomId);
  if (!room) return socket.emit('error', 'Room not found');

  const player = room.players[room.currentPlayerIndex];
  const boardLength = room.boardSpaces.length;

  if (player.hasRolled) {
    return socket.emit('error', 'You have already rolled this turn');
  }

  const dice1 = Math.floor(Math.random() * 6) + 1;
  const dice2 = Math.floor(Math.random() * 6) + 1;
  const total = dice1 + dice2;
  const isDouble = dice1 === dice2;

  const movePlayer = (steps: number) => (player.position + steps) % boardLength;

  // Jail Logic
  if (player.inJail) {
    if (isDouble || player.jailTurns >= 2) {
      player.inJail = false;
      player.jailTurns = 0;
      player.position = movePlayer(total);
      io.to(roomId).emit('gameMessage', `${player.name} rolled ${dice1}+${dice2} and got out of jail!`);
    } else {
      player.jailTurns += 1;
      player.hasRolled = true;
      io.to(roomId).emit('gameMessage', `${player.name} rolled ${dice1}+${dice2} but is still in jail (${player.jailTurns}/3 tries)`);
      room.lastDiceRoll = { dice1, dice2, playerId: player.id };
      broadcastGameState(io, room);
      return;
    }
  } else {
    const passedStart = player.position + total >= boardLength;
    player.position = movePlayer(total);
    if (passedStart) player.money += 200;
    if (player.position === 0) player.money += 300;
  }

  const currentSpace = room.boardSpaces[player.position];

  // Handle Go To Jail
  if (player.position === 30) {
    player.position = 10;
    player.inJail = true;
    player.jailTurns = 0;
    io.to(roomId).emit('gameMessage', `${player.name} landed on Go To Jail! Sent to jail at space 10.`);
  }
  // Surprise card
  // Vacation space
  else if (currentSpace.id === 'vacation') {
    player.money += currentSpace.price;
    io.to(roomId).emit('gameMessage', `${player.name} received $${currentSpace.price} for vacation!`);
  }
  // Tax space
  else if (currentSpace.type === 'tax') {
    player.money -= currentSpace.price;
    room.boardSpaces[20].price += currentSpace.price;
    io.to(roomId).emit('gameMessage', `${player.name} paid $${currentSpace.price} in taxes.`);
  }
  // Property logic
  else if (['city', 'airport', 'utility'].includes(currentSpace.type)) {
    if (currentSpace.ownedBy === null) {
      io.to(roomId).emit('propertyAvailable', {
        playerId: player.id,
        propertyId: currentSpace.id,
        price: currentSpace.price,
      });
    } else if (currentSpace.ownedBy.id !== player.id) {
      const rent = currentSpace.rent ?? 0;
      player.money -= rent;
      currentSpace.ownedBy.money += rent;
      io.to(roomId).emit('gameMessage', `${player.name} paid $${rent} in rent to ${currentSpace.ownedBy.name}`);
    }
  } else {
    io.to(roomId).emit('gameMessage', `${player.name} rolled ${dice1}+${dice2}=${total} and moved to space ${player.position}`);
  }

  player.hasRolled = true;

  room.lastDiceRoll = { dice1, dice2, playerId: player.id };

  io.to(roomId).emit('diceRolled', room.lastDiceRoll);
  broadcastGameState(io, room);

  console.log(`Player ${player.name} rolled ${dice1} & ${dice2}`);
});


    // Buy a property
    socket.on('buyProperty', ({ roomId, propertyId }: SocketEvents['buyProperty']) => {
      const room = rooms.get(roomId);
      if (!room) return socket.emit('error', 'Room not found');

      const current = room.players[room.currentPlayerIndex];
      if (!current || current.id !== socket.id) {
        return socket.emit('error', 'Not your turn');
      }

      const property = room.boardSpaces.find(s => s.id === propertyId);
      if (!property || property.ownedBy !== null) {
        return socket.emit('error', 'Property not available for purchase');
      }
      if (typeof property.price !== 'number') {
        return socket.emit('error', 'Property price is invalid');
      }
      if (current.money < property.price) {
        return socket.emit('error', 'Not enough money to buy property');
      }

      property.ownedBy = current;
      current.money -= property.price;
      current.properties.push(property);

      io.to(roomId).emit('propertyBought', {
        playerId: current.id,
        propertyId: property.id,
      });
      broadcastGameState(io, room);
      console.log(`Player ${current.name} bought ${property.name}`);
    });

    // End the current turn
    socket.on('endTurn', ({ roomId }: SocketEvents['endTurn']) => {
      const room = rooms.get(roomId);
      if (!room) return socket.emit('error', 'Room not found');

      const current = room.players[room.currentPlayerIndex];
      if (!current.hasRolled) {
        return socket.emit('error', 'You must roll before ending turn');
      }

      room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
      room.players[room.currentPlayerIndex].hasRolled = false;
      room.lastDiceRoll = null;

      io.to(roomId).emit('turnChanged', { nextPlayerIndex: room.currentPlayerIndex });
      broadcastGameState(io, room);
      console.log(`Turn ended, next: ${room.players[room.currentPlayerIndex].name}`);
    });

    // Update room settings
    socket.on('updateSettings', ({ roomId, settings }: SocketEvents['updateSettings']) => {
      const room = rooms.get(roomId);
      if (!room) return socket.emit('error', 'Room not found');

      const newSettings=settings

      // Validate new settings (optional: add more checks if needed)
      if (newSettings.maxPlayers < 2 || newSettings.maxPlayers > 8) {
        return socket.emit('error', 'maxPlayers must be between 2 and 8');
      }
      if (newSettings.startingAmount < 0) {
        return socket.emit('error', 'startingAmount must be positive');
      }
      if (typeof newSettings.poolAmountToEnter !== 'number' || newSettings.poolAmountToEnter < 0) {
        return socket.emit('error', 'Invalid pool amount');
      }

      // Apply new settings
      room.settings = {
        ...room.settings,
        ...newSettings,
      };

      // Notify all players in the room
      io.to(roomId).emit('settingsUpdated', {
        roomId,
        settings: room.settings,
      });
    });


    // ─── Cleanup ──────────────────────────────────────────────────────

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      rooms.forEach((room, roomId) => {
        const idx = room.players.findIndex(p => p.id === socket.id);
        console.log(idx,room.players.length,'index')
        if (idx === -1) return;

        // room.players.splice(idx, 1);

        if (room.players.length === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
          return;
        }

        // Adjust turn index
        if (room.currentPlayerIndex >= room.players.length) {
          room.currentPlayerIndex = 0;
        }

        // Notify about waiting status if game not started
        if (!room.gameStarted) {
          io.to(roomId).emit('waitingStatus', {
            roomId,
            waitingForPlayers: room.players.length < room.settings.maxPlayers,
            currentPlayers: room.players.length,
            maxPlayers: room.settings.maxPlayers,
          });
        }

        // Broadcast updated game state or error
        if (validateRoomState(room)) {
          broadcastGameState(io, room);
          io.to(roomId).emit('playerLeft', {
            playerId: socket.id,
            waitingForPlayers: !room.gameStarted && room.players.length < room.settings.maxPlayers,
            currentPlayers: room.players.length,
            maxPlayers: room.settings.maxPlayers,
          });
        } else {
          broadcastError(io, roomId, 'Invalid room state after disconnect');
        }
        console.log(`Player removed from room ${roomId}`);
      });
    });

  });
}
