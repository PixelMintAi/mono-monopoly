import { Socket } from "socket.io-client";
import { GameState } from "./types";
import { saveToStorage } from "./persistence";

export const setupSocketHandlers = (
  socket: Socket,
  setConnected: (connected: boolean) => void,
  setCurrentPageState: (page: "menu" | "game") => void,
  setGameState: (state: GameState | null) => void,
  setWaitingStatus: (status: any) => void,
  setMessages: (messages: string[] | ((prev: string[]) => string[])) => void,
  setAvailableProperty: (property: any) => void,
  setError: (error: string) => void,
  playerUUID: string
) => {
  socket.on("connect", () => {
    setConnected(true);
    console.log("Connected to server");

    // Auto-rejoin room if we have saved game data
    const savedGameState = localStorage.getItem("monopoly_gameState");
    const savedRoomId = localStorage.getItem("monopoly_roomId");
    const savedUsername = localStorage.getItem("monopoly_username");

    if (savedGameState && savedRoomId && savedUsername) {
      console.log("Attempting to rejoin room:", savedRoomId);
      socket.emit("joinRoom", {
        roomId: savedRoomId,
        username: savedUsername,
        playerUUID,
      });
      // Request current game state
      setTimeout(() => {
        socket.emit("requestGameState", { roomId: savedRoomId });
      }, 500);
    }
  });

  socket.on("disconnect", () => {
    setConnected(false);
    console.log("Disconnected from server");
  });

  // Room events
  socket.on("roomCreated", ({ roomId: createdRoomId }) => {
    console.log("Room created:", createdRoomId);
    setCurrentPageState("game");
  });

  socket.on("joinConfirmed", () => {
    console.log("Join confirmed");
    setCurrentPageState("game");
  });

  socket.on("gameStateUpdated", (state: GameState) => {
    console.log("Game state updated:", state);
    setGameState(state);
    saveToStorage("gameState", state);
  });

  socket.on("waitingStatus", (status) => {
    setWaitingStatus(status);
    saveToStorage("waitingStatus", status);
  });

  socket.on("gameStarted", (data) => {
    console.log("Game started:", data);
    setMessages((prev) => [...prev, "Game has started!"]);
  });

  socket.on("gameMessage", (message: string) => {
    setMessages((prev) => {
      const newMessages = [...prev, message];
      saveToStorage("messages", newMessages);
      return newMessages;
    });
  });

  socket.on("diceRolled", (rollData) => {
    console.log("Dice rolled:", rollData);
  });

  socket.on("propertyAvailable", (data) => {
    setAvailableProperty(data);
  });

  socket.on("propertyBought", (data) => {
    setMessages((prev) => {
      const newMessages = [
        ...prev,
        `Property bought by player ${data.playerId}`,
      ];
      saveToStorage("messages", newMessages);
      return newMessages;
    });
    setAvailableProperty(null);
  });

  socket.on("turnChanged", (data) => {
    setMessages((prev) => {
      const newMessages = [
        ...prev,
        `Turn changed to player ${data.nextPlayerIndex}`,
      ];
      saveToStorage("messages", newMessages);
      return newMessages;
    });
  });

  socket.on("playerJoined", ({ player }) => {
    setMessages((prev) => {
      const newMessages = [...prev, `${player.name} joined the game`];
      saveToStorage("messages", newMessages);
      return newMessages;
    });
  });

  socket.on("playerLeft", ({ playerId }) => {
    setMessages((prev) => {
      const newMessages = [...prev, `Player ${playerId} left the game`];
      saveToStorage("messages", newMessages);
      return newMessages;
    });
  });

  socket.on("kickPlayer", ({ playerId }) => {
    // Notify user about being kicked (if it's this player)
      setMessages((prev) => {
        const newMessages = [
          ...prev,
          `Player ${playerId} was kicked from the game.`,
        ];
        saveToStorage("messages", newMessages);
        return newMessages;
      });
  });

    socket.on("bankrupt", ({ playerId }) => {
      console.log('entered')
      setMessages((prev) => {
        const newMessages = [
          ...prev,
          `Player ${playerId} has gone bankrupt.`,
        ];
        saveToStorage("messages", newMessages);
        return newMessages;
      });
  });

  socket.on("settingsUpdated", ({ settings }) => {
    setMessages((prev) => {
      const newMessages = [...prev, "Room settings updated"];
      saveToStorage("messages", newMessages);
      return newMessages;
    });
  });

  socket.on("error", (errorMsg: string) => {
    setError(errorMsg);
    setTimeout(() => setError(""), 5000);
  });
};
