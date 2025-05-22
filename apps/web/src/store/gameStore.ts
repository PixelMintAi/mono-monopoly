import { create } from 'zustand';
import { z } from 'zod';
import { Socket } from 'socket.io-client';
import { GameSettingsSchema, type GameSettings } from '@monopoly/shared';

// Zod schemas for runtime validation
const playerSchema = z.object({
  id: z.string(),
  uuid: z.string(),
  isLeader: z.boolean(),
  name: z.string(),
  color: z.string(),
  position: z.number().min(0).max(39),
  money: z.number().min(0),
  properties: z.array(z.any()),
  inJail: z.boolean(),
  jailTurns: z.number().min(0),
  cards: z.array(z.any()),
  hasRolled: z.boolean(),
  bankRupt: z.boolean()
});

const spaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['city', 'airport', 'utility', 'surprise', 'treasure', 'tax', 'special', 'chance', 'community', 'corner']),
  position: z.union([
    z.number().min(0).max(39),
    z.enum(['top', 'right', 'bottom', 'left', 'top-right', 'bottom-right', 'bottom-left', 'top-left'])
  ]),
  price: z.number().optional(),
  rent: z.number().optional(),
  ownedBy: z.string().nullable(),
});

const gameStateSchema = z.object({
  players: z.array(playerSchema),
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
export type Player = z.infer<typeof playerSchema>;
export type Space = z.infer<typeof spaceSchema>;
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
  setSocket: (socket) => set({ socket }),
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