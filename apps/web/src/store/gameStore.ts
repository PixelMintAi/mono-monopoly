import { create } from 'zustand';
import { z } from 'zod';
import { Socket } from 'socket.io-client';
import { GameSettingsSchema, type GameSettings, PlayerSchema, type Player, SpaceSchema, type Space } from '@monopoly/shared';

// Zod schemas for runtime validation
const spaceSchema = SpaceSchema.extend({
  position: z.union([
    z.number().min(0).max(39),
    z.enum(['top', 'right', 'bottom', 'left', 'top-right', 'bottom-right', 'bottom-left', 'top-left'])
  ]),
});

const gameStateSchema = z.object({
  players: z.array(PlayerSchema),
  settings: GameSettingsSchema,
  currentPlayerIndex: z.number().min(0),
  boardSpaces: z.array(spaceSchema),
  lastDiceRoll: z.object({
    dice1: z.number().min(1).max(6),
    dice2: z.number().min(1).max(6),
    playerId: z.string(),
  }).nullable(),
  gameStarted: z.boolean(),
  roomId: z.string(),
});

// TypeScript types inferred from Zod schemas
export type GameState = z.infer<typeof gameStateSchema>;

interface GameStore {
  // State
  gameState: GameState | null;
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  isRolling: boolean;
  gameMessage: string;
  
  // Actions
  setSocket: (socket: Socket | null) => void;
  setGameState: (state: GameState) => void;
  setError: (error: string | null) => void;
  setIsRolling: (isRolling: boolean) => void;
  setGameMessage: (message: string) => void;
  
  // Game actions
  rollDice: () => void;
  endTurn: () => void;
  buyProperty: () => void;
  startGame: () => void;
  createRoom: (settings: GameSettings, username: string, playerUUID: string) => Promise<string>;
  updateSettings: (newSettings: GameSettings) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  gameState: null,
  socket: null,
  isConnected: false,
  error: null,
  isRolling: false,
  gameMessage: '',

  // Setters
  setSocket: (socket) => {
    if (socket) {
      // Set up socket event listeners
      socket.on('connect', () => {
        console.log('Socket connected, requesting game state...');
        const { gameState } = get();
        if (gameState?.roomId) {
          socket.emit('requestGameState', { roomId: gameState.roomId });
        }
      });

      // Handle reconnection
      socket.on('reconnect', () => {
        console.log('Socket reconnected, requesting game state...');
        const { gameState } = get();
        if (gameState?.roomId) {
          socket.emit('requestGameState', { roomId: gameState.roomId });
        }
      });

      // Error handling
      const handleError = (error: string | Error | { message: string }) => {
        console.error('Socket error:', error);
        const errorMessage = typeof error === 'string' 
          ? error 
          : error instanceof Error 
            ? error.message 
            : error.message;
        set({ error: errorMessage });
        
        // Auto-clear non-critical errors after 5 seconds
        setTimeout(() => {
          set({ error: null });
        }, 5000);
      };

      socket.on('error', handleError);
      socket.on('connect_error', (error: Error) => handleError(error));
      socket.on('reconnect_error', (error: Error) => handleError(error));
      socket.on('reconnect_failed', () => handleError('Failed to reconnect to server'));

      // Rest of the socket event listeners...
      socket.on('playerJoined', (data: { player: Player }) => {
        console.log('Player joined event received:', data);
        const { gameState } = get();
        if (gameState) {
          // Check if player already exists to avoid duplicates
          const playerExists = gameState.players.some(p => p.id === data.player.id);
          if (!playerExists) {
            const updatedState = {
              ...gameState,
              players: [...gameState.players, data.player]
            };
            set({ gameState: updatedState });
          }
        }
      });

      socket.on('playerLeft', (data: { playerId: string }) => {
        console.log('Player left event received:', data);
        const { gameState } = get();
        if (gameState) {
          const updatedState = {
            ...gameState,
            players: gameState.players.filter(p => p.id !== data.playerId)
          };
          set({ gameState: updatedState });
        }
      });

      socket.on('gameStateUpdated', (newState: GameState) => {
        console.log('Game state updated:', newState);
        try {
          // Validate state with Zod
          const validatedState = gameStateSchema.parse(newState);
          set({ gameState: validatedState });
        } catch (error) {
          console.error('Invalid game state received:', error);
          set({ error: 'Invalid game state received' });
        }
      });
    }
    set({ socket });
  },
  setGameState: (state) => {
    try {
      // Validate state with Zod
      const validatedState = gameStateSchema.parse(state);
      set({ gameState: validatedState });
    } catch (error) {
      console.error('Invalid game state:', error);
      set({ error: 'Invalid game state received' });
    }
  },
  setError: (error) => set({ error }),
  setIsRolling: (isRolling) => set({ isRolling }),
  setGameMessage: (message) => set({ gameMessage: message }),

  // Game actions
  rollDice: () => {
    const { socket, gameState, isRolling } = get();
    if (!socket || !gameState || isRolling) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) return;

    if (currentPlayer.hasRolled) {
      set({ gameMessage: "You have already rolled this turn!" });
      return;
    }

    set({ isRolling: true, gameMessage: "Rolling dice..." });
    socket.emit('rollDice', { roomId: gameState.roomId });
  },

  endTurn: () => {
    const { socket, gameState } = get();
    if (!socket || !gameState) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) return;

    if (!currentPlayer.hasRolled) {
      set({ gameMessage: "You must roll the dice before ending your turn!" });
      return;
    }

    socket.emit('endTurn', { roomId: gameState.roomId });
  },

  buyProperty: () => {
    const { socket, gameState } = get();
    if (!socket || !gameState) return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (!currentPlayer) return;

    const currentSpace = gameState.boardSpaces[currentPlayer.position];
    if (!currentSpace) return;

    if (currentSpace.ownedBy !== null) {
      set({ gameMessage: "This property is not available for purchase!" });
      return;
    }

    if (currentPlayer.money < (currentSpace.price || 0)) {
      set({ gameMessage: "You don't have enough money to buy this property!" });
      return;
    }

    socket.emit('buyProperty', { 
      roomId: gameState.roomId, 
      propertyId: currentSpace.id 
    });
  },

  startGame: () => {
    const { socket, gameState } = get();
    if (!socket || !gameState) return;
    
    socket.emit('startGame', { roomId: gameState.roomId });
  },

  createRoom: async (settings: GameSettings, username: string, playerUUID: string): Promise<string> => {
    const { socket } = get();
    if (!socket) {
      throw new Error('Socket not connected');
    }

    try {
      // Validate settings with Zod
      const validatedSettings = GameSettingsSchema.parse(settings);

      return new Promise((resolve, reject) => {
        const roomId = crypto.randomUUID();
        
        socket.emit('createRoom', { roomId, settings: validatedSettings, username, playerUUID });

        const timeoutId = setTimeout(() => {
          reject(new Error('Room creation timed out'));
        }, 5000);

        socket.once('roomCreated', ({ roomId }) => {
          clearTimeout(timeoutId);
          resolve(roomId);
        });

        socket.once('error', (errorMessage: string) => {
          clearTimeout(timeoutId);
          reject(new Error(errorMessage));
        });
      });
    } catch (error) {
      console.error('Invalid game settings:', error);
      throw new Error('Invalid game settings');
    }
  },

  updateSettings: (newSettings: GameSettings) => {
    const { socket, gameState, setError } = get();
    if (!socket || !gameState) {
      setError("Socket not connected or game not initialized");
      return;
    }

    try {
      // Validate the complete settings object
      const validatedSettings = GameSettingsSchema.parse(newSettings);
      
      socket.emit('updateSettings', {
        roomId: gameState.roomId,
        settings: validatedSettings,
      });
    } catch (error) {
      console.error('Invalid settings update:', error);
      if (error instanceof z.ZodError) {
        setError(`Invalid settings: ${error.errors.map(e => e.message).join(', ')}`);
      } else {
        setError("Invalid settings update");
      }
    }
  },
})); 