import { z } from 'zod';

export const SpaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['city', 'airport', 'utility', 'tax', 'chance', 'community', 'corner','treasure','special','community','surprise']),
  price: z.number().optional(),
  rent: z.number().optional(),
  ownedBy: z.any().nullable(),
  country:z.string().optional(),
  position: z.string(),
});

export type Space = z.infer<typeof SpaceSchema>;

export const GameSettingsSchema = z.object({
  map: z.literal('Classic'),
  maxPlayers: z.number().min(2).max(8),
  startingAmount: z.number().min(1000).max(10000),
  cryptoPoolActivated: z.boolean(),
  poolAmountToEnter: z.number().min(0)
});

export type GameSettings = z.infer<typeof GameSettingsSchema>;

export const PlayerSchema = z.object({
  id: z.string(),
  uuid:z.string(),
  name: z.string(),
  color: z.string(),
  isLeader:z.boolean(),
  position: z.number(),
  money: z.number(),
  properties: z.array(SpaceSchema),
  inJail: z.boolean(),
  jailTurns: z.number(),
  cards: z.array(z.string()),
  hasRolled: z.boolean(),
  bankRupt: z.boolean().default(false)
});

export type Player = z.infer<typeof PlayerSchema>;

export const RoomSchema = z.object({
  id: z.string(),
  settings: z.object({
    maxPlayers: z.number(),
    startingAmount: z.number()
  }),
  players: z.array(PlayerSchema),
  gameStarted: z.boolean(),
  currentPlayerIndex: z.number(),
  boardSpaces: z.array(SpaceSchema),
  lastDiceRoll: z.object({
    dice1: z.number(),
    dice2: z.number(),
    playerId: z.string()
  }).nullable()
});

export type Room = z.infer<typeof RoomSchema>;

export const GameStateSchema = z.object({
  players: z.array(PlayerSchema),
  currentPlayerIndex: z.number(),
  gameStarted: z.boolean(),
  roomId: z.string()
});

export type GameState = z.infer<typeof GameStateSchema>;

// Socket event types
export type SocketEvents = {
  // Room events
  createRoom: { roomId: string; settings: GameSettings; username: string; playerUUID: string };
  roomCreated: { roomId: string };
  joinRoom: { roomId: string; username: string; playerUUID: string };
  playerJoined: { player: Player };
  playerLeft: { playerId: string };
  startGame: { roomId: string };
  gameStarted: { players: Player[]; currentPlayerIndex: number };
  kickPlayer:{roomId:string;targetPlayerId:string};
  
  // Game events
  gameStateUpdated: { players: Player[]; currentPlayerIndex: number };
  playerMove: { roomId: string; playerId: string; newPosition: number };
  turnEnd: { roomId: string; nextPlayerIndex: number };
  turnChanged: { nextPlayerIndex: number };

  // Added events
  rollDice: { roomId: string };
  endTurn: { roomId: string };
  buyProperty: { roomId: string; propertyId: string };
  updateSettings: { roomId: string; settings: GameSettings };
  
  // Error events
  error: string | Error | { message: string };
  connect_error: Error;
  reconnect_error: Error;
  reconnect_failed: void;
}; 