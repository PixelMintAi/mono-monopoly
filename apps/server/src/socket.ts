import { Server, Socket } from "socket.io";
import {
  Player,
  Room,
  SocketEvents,
  Space,
  Trade,
  treasureCards,
} from "@monopoly/shared";
import { BOARD_SPACES, surpriseCards } from "@monopoly/shared/constants";
import { handleCard } from "./utils/handleCard";

// ─── Helpers ────────────────────────────────────────────────────────────────────

// Validate that a room's state is well‑formed before broadcasting
function validateRoomState(room: Room): boolean {
  if (!room || !room.players || !room.boardSpaces) return false;
  if (room.currentPlayerIndex >= room.players.length) return false;
  if (room.players.some((p) => !p.id || !p.name)) return false;
  return true;
}

// Broadcast an error message to everyone in a room
function broadcastError(io: Server, roomId: string, error: string) {
  io.to(roomId).emit("error", error);
  console.error(`Room ${roomId} error:`, error);
}

// Broadcast the full game state to everyone in a room
function broadcastGameState(io: Server, room: Room) {
  if (!validateRoomState(room)) {
    console.error("Invalid room state, not broadcasting:", room);
    return;
  }
  io.to(room.id).emit("gameStateUpdated", {
    roomId: room.id,
    players: room.players,
    currentPlayerIndex: room.currentPlayerIndex,
    gameStarted: room.gameStarted,
    lastDiceRoll: room.lastDiceRoll,
    boardSpaces: room.boardSpaces,
    settings: room.settings,
  });
}

// ─── Main Socket Setup ─────────────────────────────────────────────────────────

export function setupSocketHandlers(io: Server, rooms: Map<string, Room>) {
  console.log(rooms, "rooms");
  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    // ─── State Queries ────────────────────────────────────────────────

    // Client asks for the current game state
    socket.on("requestGameState", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) {
        return socket.emit("error", "Room not found");
      }
      socket.emit("gameStateUpdated", {
        roomId: room.id,
        settings: room.settings,
        players: room.players,
        currentPlayerIndex: room.currentPlayerIndex,
        gameStarted: room.gameStarted,
        lastDiceRoll: room.lastDiceRoll,
        boardSpaces: room.boardSpaces,
      });
    });

    // Client acknowledges receipt of the state
    socket.on("stateAcknowledged", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      console.log(`Player ${socket.id} acknowledged state in room ${roomId}`);
      socket.emit("waitingStatus", {
        roomId,
        waitingForPlayers:
          !room.gameStarted && room.players.length < room.settings.maxPlayers,
        currentPlayers: room.players.length,
        maxPlayers: room.settings.maxPlayers,
      });
    });

    // ─── Room Lifecycle ──────────────────────────────────────────────

    // Create a new room
    socket.on(
      "createRoom",
      ({
        roomId,
        settings,
        username,
        playerUUID,
      }: SocketEvents["createRoom"]) => {
        if (rooms.has(roomId)) {
          return socket.emit("error", "Room already exists");
        }
        // initialize board
        const boardSpaces: Space[] = BOARD_SPACES.map((space) => ({
          ...space,
          ownedBy: null,
        }));
        const room: Room = {
          id: roomId,
          settings,
          players: [
            {
              id: socket.id,
              uuid: playerUUID,
              name: username,
              isLeader: true,
              color: "#FF0000",
              position: 0,
              money: settings.startingAmount,
              properties: [],
              inJail: false,
              jailTurns: 0,
              cards: [],
              hasRolled: false,
              bankRupt: false,
            },
          ],
          gameStarted: false,
          currentPlayerIndex: 0,
          boardSpaces,
          lastDiceRoll: null,
          activeTrades: [],
        };

        if (!validateRoomState(room)) {
          return socket.emit("error", "Invalid room state");
        }

        rooms.set(roomId, room);
        socket.join(roomId);
        socket.emit("roomCreated", { roomId });
        socket.emit("waitingStatus", {
          roomId,
          waitingForPlayers: true,
          currentPlayers: 1,
          maxPlayers: settings.maxPlayers,
        });
        broadcastGameState(io, room);
        console.log(`Room ${roomId} created by ${username} ${rooms}`);
      }
    );

    // Join an existing room
    socket.on(
      "joinRoom",
      ({ roomId, username, playerUUID }: SocketEvents["joinRoom"]) => {
        const room = rooms.get(roomId);
        if (!room) {
          return socket.emit("error", "Room not found");
        }
        if (room.gameStarted) {
          return socket.emit("error", "Game has already started");
        }
        if (room.players.length >= room.settings.maxPlayers) {
          return socket.emit("error", "Room is full");
        }

        // Check if player already exists (prevents duplicate joins)
        const existingPlayer = room.players.find((p) => p.uuid === playerUUID);
        if (existingPlayer) {
          // Update socket ID for reconnecting player
          existingPlayer.id = socket.id;
          socket.join(roomId);
          socket.emit("joinConfirmed");
          broadcastGameState(io, room);
          return;
        }

        const player: Player = {
          id: socket.id,
          name: username,
          uuid: playerUUID,
          isLeader: false,
          color: "#0000FF",
          position: 0,
          money: room.settings.startingAmount,
          properties: [],
          inJail: false,
          jailTurns: 0,
          cards: [],
          hasRolled: false,
          bankRupt: false,
        };

        // Add player to room
        room.players.push(player);
        socket.join(roomId);

        // First, broadcast to everyone that a new player has joined
        io.to(roomId).emit("playerJoined", { player });

        // Then send confirmation to the joining player
        socket.emit("joinConfirmed");

        // Finally, broadcast the updated game state to everyone
        broadcastGameState(io, room);

        // Update waiting status for all players
        io.to(roomId).emit("waitingStatus", {
          roomId,
          waitingForPlayers: room.players.length < room.settings.maxPlayers,
          currentPlayers: room.players.length,
          maxPlayers: room.settings.maxPlayers,
        });

        console.log(
          `${username} joined room ${roomId}. Total players: ${room.players.length}`
        );
      }
    );

    // Start the game
    socket.on("startGame", ({ roomId }: SocketEvents["startGame"]) => {
      const room = rooms.get(roomId);
      if (!room) return socket.emit("error", "Room not found");
      console.log("found");
      if (room.players.length < 2)
        return socket.emit("error", "Need at least 2 players to start");
      console.log("work");
      if (!validateRoomState(room)) {
        return broadcastError(io, roomId, "Invalid room state");
      }

      room.gameStarted = true;
      room.currentPlayerIndex = 0;
      room.players.forEach((p) => (p.hasRolled = false));
       room.players.forEach((p) => (p.money = room.settings.startingAmount));

      io.to(roomId).emit("gameStarted", {
        roomId,
        players: room.players,
        currentPlayerIndex: room.currentPlayerIndex,
      });
      broadcastGameState(io, room);
      console.log(`Game started in room ${roomId}`);
    });

    // ─── Gameplay Actions ────────────────────────────────────────────

    // Roll the dice
    socket.on("rollDice", ({ roomId }: SocketEvents["rollDice"]) => {
      const room = rooms.get(roomId);
      if (!room) return socket.emit("error", "Room not found");

      const player = room.players[room.currentPlayerIndex];
      const boardLength = room.boardSpaces.length;

      if (player.hasRolled) {
        return socket.emit("error", "You have already rolled this turn");
      }

      const dice1 = Math.floor(Math.random() * 6) + 1;
      const dice2 = Math.floor(Math.random() * 6) + 1;
      const total = dice1 + dice2;
      const isDouble = dice1 === dice2;

      const movePlayer = (steps: number) =>
        (player.position + steps) % boardLength;

      // Jail Logic
      if (player.inJail) {
        if (isDouble || player.jailTurns >= 2) {
          player.inJail = false;
          player.jailTurns = 0;
          player.position = movePlayer(total);
          io.to(roomId).emit(
            "gameMessage",
            `${player.name} rolled ${dice1}+${dice2} and got out of jail!`
          );
        } else {
          player.jailTurns += 1;
          player.hasRolled = true;
          io.to(roomId).emit(
            "gameMessage",
            `${player.name} rolled ${dice1}+${dice2} but is still in jail (${player.jailTurns}/3 tries)`
          );
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
        io.to(roomId).emit(
          "gameMessage",
          `${player.name} landed on Go To Jail! Sent to jail at space 10.`
        );
      }
      // Vacation space
      else if (
        currentSpace.id === "vacation" &&
        typeof currentSpace.price === "number"
      ) {
        player.money += currentSpace.price;
        currentSpace.price = 0;
        io.to(roomId).emit(
          "gameMessage",
          `${player.name} received $${currentSpace.price} for vacation!`
        );
      }
      // Tax space
      else if (
        currentSpace.type === "tax" &&
        typeof currentSpace.price === "number"
      ) {
        player.money -= currentSpace.price;
        const taxSpace = room.boardSpaces[20];
        if (taxSpace && typeof taxSpace.price === "number") {
          taxSpace.price += currentSpace.price;
        }
        io.to(roomId).emit(
          "gameMessage",
          `${player.name} paid $${currentSpace.price} in taxes.`
        );
      } else if (currentSpace.type === "surprise") {
        const card =
          surpriseCards[Math.floor(Math.random() * surpriseCards.length)];
        handleCard(card, player, boardLength);
        io.to(roomId).emit("gameMessage", `${card}`);
      } else if (currentSpace.type === "treasure") {
        const card =
          treasureCards[Math.floor(Math.random() * treasureCards.length)];
        handleCard(card, player, boardLength);
        io.to(roomId).emit("gameMessage", `${card}`);
      }
      // Property logic
      else if (["city", "airport", "utility"].includes(currentSpace.type)) {
        if (currentSpace.ownedBy === null) {
          io.to(roomId).emit("propertyAvailable", {
            playerId: player.id,
            propertyId: currentSpace.id,
            price: currentSpace.price,
          });
        } else if (currentSpace.ownedBy !== player.id) {
          const rent = currentSpace.rent ?? 0;
           const Owner = room.players.find((p) => p.id === currentSpace.ownedBy);
           if(Owner){
             Owner.money+=rent;
              player.money -= rent;
              io.to(roomId).emit(
                "gameMessage",
                `${player.name} paid $${rent} in rent to ${Owner.name}`
              );
           }
          // currentSpace.ownedBy.money += rent;
        }
      } else {
        io.to(roomId).emit(
          "gameMessage",
          `${player.name} rolled ${dice1}+${dice2}=${total} and moved to space ${currentSpace.name}`
        );
      }

      player.hasRolled = true;

      room.lastDiceRoll = { dice1, dice2, playerId: player.id };

      io.to(roomId).emit("diceRolled", room.lastDiceRoll);
      broadcastGameState(io, room);

      console.log(`Player ${player.name} rolled ${dice1} & ${dice2}`);
    });

    // Buy a property
    socket.on(
      "buyProperty",
      ({ roomId, propertyId }: SocketEvents["buyProperty"]) => {
        const room = rooms.get(roomId);
        if (!room) return socket.emit("error", "Room not found");

        const current = room.players[room.currentPlayerIndex];

        const property = room.boardSpaces.find((s) => s.id === propertyId);
        if (!property || property.ownedBy !== null) {
          return socket.emit("error", "Property not available for purchase");
        }
        if (typeof property.price !== "number") {
          return socket.emit("error", "Property price is invalid");
        }
        if (current.money < property.price) {
          return socket.emit("error", "Not enough money to buy property");
        }

        // Assign ownership (store only player ID to avoid circular refs)
        property.ownedBy = current.id;
        current.money -= property.price;
        current.properties.push(property); // Or just track by ID if needed

        io.to(roomId).emit("propertyBought", {
          playerId: current.id,
          propertyId: property.id,
        });
        broadcastGameState(io, room);
        console.log(`Player ${current.name} bought ${property.name}`);
      }
    );

    // End the current turn
    socket.on("endTurn", ({ roomId }: SocketEvents["endTurn"]) => {
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit("error", "Room not found");
        console.error(`endTurn error: Room ${roomId} not found`);
        return;
      }

      const current = room.players[room.currentPlayerIndex];
      if (!current.hasRolled) {
        socket.emit("error", "You must roll before ending turn");
        console.warn(
          `endTurn warning: Player ${current.name} tried to end turn without rolling`
        );
        return;
      }

      const player = room.players[room.currentPlayerIndex];
      player.hasRolled = false;
      room.lastDiceRoll = null;

      // Find next active (non-bankrupt) player
      const totalPlayers = room.players.length;
      let nextPlayerIndex = (room.currentPlayerIndex + 1) % totalPlayers;

      let attempts = 0;
      while (room.players[nextPlayerIndex].bankRupt) {
        nextPlayerIndex = (nextPlayerIndex + 1) % totalPlayers;
        attempts++;

        if (attempts >= totalPlayers) {
          console.warn(
            `endTurn warning: No active players found in room ${roomId}`
          );
          io.to(roomId).emit("gameEnded", {
            message: "All players are bankrupt. Game over.",
          });
          return;
        }
      }

      room.currentPlayerIndex = nextPlayerIndex;

      io.to(roomId).emit("turnChanged", {
        nextPlayerIndex: room.currentPlayerIndex,
      });
      broadcastGameState(io, room);
      console.log(
        `Turn ended. Next: ${room.players[room.currentPlayerIndex].name}`
      );
    });

    socket.on(
      "playerBankrupt",
      ({ roomId, targetPlayerId }: SocketEvents["playerBankrupt"]) => {
        const room = rooms.get(roomId);
        if (!room) {
          socket.emit("error", "Room not found");
          console.error(`playerBankrupt error: Room ${roomId} not found`);
          return;
        }

        const player = room.players.find((p) => p.id === targetPlayerId);
        if (!player) {
          socket.emit("error", "Player not found");
          console.error(
            `playerBankrupt error: Player ${targetPlayerId} not found in room ${roomId}`
          );
          return;
        }

        // Mark player as bankrupt
        player.money = 0;
        player.properties = [];
        player.bankRupt = true;

        // Remove ownership from board spaces
        room.boardSpaces.forEach((space) => {
          if (space.ownedBy === targetPlayerId) {
            space.ownedBy = null;
          }
        });

        // Notify room and update state
        io.to(roomId).emit("bankrupt", { roomId, playerId: player.name });
        broadcastGameState(io, room);
        console.log(
          `playerBankrupt: ${player.name} marked as bankrupt and properties released`
        );
      }
    );

    // Update room settings
    socket.on(
      "updateSettings",
      ({ roomId, settings }: SocketEvents["updateSettings"]) => {
        const room = rooms.get(roomId);
        if (!room) return socket.emit("error", "Room not found");

        const newSettings = settings;

        // Validate new settings (optional: add more checks if needed)
        if (newSettings.maxPlayers < 2 || newSettings.maxPlayers > 8) {
          return socket.emit("error", "maxPlayers must be between 2 and 8");
        }
        if (newSettings.startingAmount < 0) {
          return socket.emit("error", "startingAmount must be positive");
        }
        if (
          typeof newSettings.poolAmountToEnter !== "number" ||
          newSettings.poolAmountToEnter < 0
        ) {
          return socket.emit("error", "Invalid pool amount");
        }

        // Apply new settings
        room.settings = {
          ...room.settings,
          ...newSettings,
        };

        // Notify all players in the room
        io.to(roomId).emit("settingsUpdated", {
          roomId,
          settings: room.settings,
        });
        broadcastGameState(io, room);
      }
    );

    // Kick a player from the room (only by leader)
    socket.on(
      "kickPlayer",
      ({ roomId, targetPlayerId }: SocketEvents["kickPlayer"]) => {
        const room = rooms.get(roomId);
        if (!room) return socket.emit("error", "Room not found");

        const leader = room.players.find((p) => p.id === socket.id);
        if (!leader || !leader.isLeader) {
          return socket.emit("error", "Only the room leader can kick players");
        }

        const targetIndex = room.players.findIndex(
          (p) => p.id === targetPlayerId
        );
        if (targetIndex === -1) {
          return socket.emit("error", "Player to kick not found");
        }

        const kickedPlayer = room.players[targetIndex];

        // Remove player from room
        room.players.splice(targetIndex, 1);

        // Notify the kicked player directly (if still connected)
        io.to(roomId).emit("kickPlayer", {
          roomId,
          playerId: kickedPlayer.name,
        });

        broadcastGameState(io, room);
        console.log(
          `${kickedPlayer.name} was kicked from room ${roomId} by ${leader.name}`
        );
      }
    );

    socket.on(
      "createTrade",
      ({
        roomId,
        toPlayerId,
        moneyOffered,
        moneyRequested,
        propertiesOffered,
        propertiesRequested,
      }: SocketEvents["createTrade"]) => {
        const room = rooms.get(roomId);
        if (!room) return socket.emit("error", "Room not found");

        const fromPlayer = room.players.find((p) => p.id === socket.id);
        const toPlayer = room.players.find((p) => p.id === toPlayerId);

        if (!fromPlayer) return socket.emit("error", "Player not found");
        if (!toPlayer) return socket.emit("error", "Target player not found");

        // Validate the trade
        if (moneyOffered > fromPlayer.money) {
          return socket.emit("error", "Insufficient funds to offer");
        }

        if (moneyRequested > toPlayer.money) {
          return socket.emit("error", "Target player has insufficient funds");
        }

        // Validate offered properties belong to fromPlayer
        const fromPlayerPropertyIds = fromPlayer.properties.map((p) => p.id);
        const invalidOfferedProps = propertiesOffered.filter(
          (id) => !fromPlayerPropertyIds.includes(id)
        );
        if (invalidOfferedProps.length > 0) {
          return socket.emit(
            "error",
            "You don't own some of the offered properties"
          );
        }

        // Validate requested properties belong to toPlayer
        const toPlayerPropertyIds = toPlayer.properties.map((p) => p.id);
        const invalidRequestedProps = propertiesRequested.filter(
          (id) => !toPlayerPropertyIds.includes(id)
        );
        if (invalidRequestedProps.length > 0) {
          return socket.emit(
            "error",
            "Target player doesn't own some of the requested properties"
          );
        }

        const newTrade: Trade = {
          id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          fromPlayerId: socket.id,
          toPlayerId,
          moneyOffered,
          moneyRequested,
          propertiesOffered,
          propertiesRequested,
          status: "pending",
          createdAt: new Date(),
        };

        // Initialize activeTrades if it doesn't exist
        if (!room.activeTrades) {
          room.activeTrades = [];
        }

        room.activeTrades.push(newTrade);

        // Broadcast trade created to all players in room
        io.to(roomId).emit("tradeCreated", {
          trade: newTrade,
          fromPlayerName: fromPlayer.name,
          toPlayerName: toPlayer.name,
        });

        // Send updated trades list
        io.to(roomId).emit("tradesUpdated", { trades: room.activeTrades });

        console.log(`Trade created: ${fromPlayer.name} -> ${toPlayer.name}`);
      }
    );

    // Accept a trade
    socket.on(
      "acceptTrade",
      ({ roomId, tradeId }: SocketEvents["acceptTrade"]) => {
        const room = rooms.get(roomId);
        if (!room) return socket.emit("error", "Room not found");

        const trade = room.activeTrades?.find((t) => t.id === tradeId);
        if (!trade) return socket.emit("error", "Trade not found");

        const acceptingPlayer = room.players.find((p) => p.id === socket.id);
        if (!acceptingPlayer) return socket.emit("error", "Player not found");

        // Only the target player can accept the trade
        if (trade.toPlayerId !== socket.id) {
          return socket.emit("error", "You cannot accept this trade");
        }

        if (trade.status !== "pending") {
          return socket.emit("error", "Trade is no longer pending");
        }

        const fromPlayer = room.players.find(
          (p) => p.id === trade.fromPlayerId
        );
        const toPlayer = room.players.find((p) => p.id === trade.toPlayerId);

        if (!fromPlayer || !toPlayer) {
          return socket.emit("error", "Players not found");
        }

        // Validate players still have sufficient funds and properties
        if (trade.moneyOffered > fromPlayer.money) {
          return socket.emit("error", "Offering player has insufficient funds");
        }

        if (trade.moneyRequested > toPlayer.money) {
          return socket.emit("error", "You have insufficient funds");
        }

        // Execute the trade
        try {
          // Transfer money
          fromPlayer.money -= trade.moneyOffered;
          toPlayer.money += trade.moneyOffered;
          toPlayer.money -= trade.moneyRequested;
          fromPlayer.money += trade.moneyRequested;

          // Transfer properties offered by fromPlayer to toPlayer
          trade.propertiesOffered.forEach((propertyId) => {
            const propertyIndex = fromPlayer.properties.findIndex(
              (p) => p.id === propertyId
            );
            if (propertyIndex !== -1) {
              const property = fromPlayer.properties.splice(
                propertyIndex,
                1
              )[0];
              toPlayer.properties.push(property);

              // Update board space ownership
              const boardSpace = room.boardSpaces.find(
                (s) => s.id === propertyId
              );
              if (boardSpace) {
                boardSpace.ownedBy = toPlayer.id;
              }
            }
          });

          // Transfer properties requested by fromPlayer from toPlayer
          trade.propertiesRequested.forEach((propertyId) => {
            const propertyIndex = toPlayer.properties.findIndex(
              (p) => p.id === propertyId
            );
            if (propertyIndex !== -1) {
              const property = toPlayer.properties.splice(propertyIndex, 1)[0];
              fromPlayer.properties.push(property);

              // Update board space ownership
              const boardSpace = room.boardSpaces.find(
                (s) => s.id === propertyId
              );
              if (boardSpace) {
                boardSpace.ownedBy = fromPlayer.id;
              }
            }
          });

          // Mark trade as accepted
          trade.status = "accepted";

          // Remove the trade from active trades
          room.activeTrades = room.activeTrades.filter((t) => t.id !== tradeId);

          // Broadcast trade acceptance
          io.to(roomId).emit("tradeAccepted", {
            tradeId,
            fromPlayerName: fromPlayer.name,
            toPlayerName: toPlayer.name,
            message: `${toPlayer.name} accepted the trade from ${fromPlayer.name}`,
          });

          // Send updated trades list and game state
          io.to(roomId).emit("tradesUpdated", { trades: room.activeTrades });
          broadcastGameState(io, room);

          console.log(
            `Trade accepted: ${fromPlayer.name} <-> ${toPlayer.name}`
          );
        } catch (error) {
          console.error("Error executing trade:", error);
          socket.emit("error", "Failed to execute trade");
        }
      }
    );

    // Reject/Cancel a trade
    socket.on(
      "rejectTrade",
      ({ roomId, tradeId }: SocketEvents["rejectTrade"]) => {
        const room = rooms.get(roomId);
        if (!room) return socket.emit("error", "Room not found");

        const trade = room.activeTrades?.find((t) => t.id === tradeId);
        if (!trade) return socket.emit("error", "Trade not found");

        const rejectingPlayer = room.players.find((p) => p.id === socket.id);
        if (!rejectingPlayer) return socket.emit("error", "Player not found");

        // Only the trade participants can reject/cancel the trade
        if (
          trade.fromPlayerId !== socket.id &&
          trade.toPlayerId !== socket.id
        ) {
          return socket.emit("error", "You cannot reject this trade");
        }

        if (trade.status !== "pending") {
          return socket.emit("error", "Trade is no longer pending");
        }

        // Mark trade as rejected and remove it
        trade.status = "rejected";
        room.activeTrades = room.activeTrades.filter((t) => t.id !== tradeId);

        const fromPlayer = room.players.find(
          (p) => p.id === trade.fromPlayerId
        );
        const toPlayer = room.players.find((p) => p.id === trade.toPlayerId);

        const action =
          trade.fromPlayerId === socket.id ? "cancelled" : "rejected";
        const message = `${rejectingPlayer.name} ${action} the trade`;

        // Broadcast trade rejection
        io.to(roomId).emit("tradeRejected", {
          tradeId,
          fromPlayerName: fromPlayer?.name,
          toPlayerName: toPlayer?.name,
          message,
        });

        // Send updated trades list
        io.to(roomId).emit("tradesUpdated", { trades: room.activeTrades });

        console.log(
          `Trade ${action}: ${fromPlayer?.name} <-> ${toPlayer?.name}`
        );
      }
    );

    // Get all active trades for a room
    socket.on("requestTrades", ({ roomId }: SocketEvents["requestTrades"]) => {
      const room = rooms.get(roomId);
      if (!room) return socket.emit("error", "Room not found");

      // Initialize activeTrades if it doesn't exist
      if (!room.activeTrades) {
        room.activeTrades = [];
      }

      socket.emit("tradesUpdated", { trades: room.activeTrades });
    });

    // ─── Cleanup ──────────────────────────────────────────────────────

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      rooms.forEach((room, roomId) => {
        const playerIndex = room.players.findIndex((p) => p.id === socket.id);
        if (playerIndex === -1) return;

        const disconnectedPlayer = room.players[playerIndex];

        // Remove the player
        room.players.splice(playerIndex, 1);

        // If room is empty, delete it
        if (room.players.length === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
          return;
        }

        // Adjust turn index if needed
        if (room.currentPlayerIndex >= room.players.length) {
          room.currentPlayerIndex = 0;
        }

        // Notify all players about the disconnection
        io.to(roomId).emit("playerLeft", { playerId: socket.id });

        // Update waiting status if game hasn't started
        if (!room.gameStarted) {
          io.to(roomId).emit("waitingStatus", {
            roomId,
            waitingForPlayers: room.players.length < room.settings.maxPlayers,
            currentPlayers: room.players.length,
            maxPlayers: room.settings.maxPlayers,
          });
        }

        // Broadcast updated game state
        broadcastGameState(io, room);

        console.log(
          `${disconnectedPlayer.name} left room ${roomId}. Remaining players: ${room.players.length}`
        );
      });
    });
  });
}
