import { z } from 'zod';

export const SpaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['city', 'airport', 'utility', 'tax', 'chance', 'community', 'corner','treasure','special','community','surprise']),
  price: z.number().optional(),
  rent: z.number().nullable(),
  ownedBy: z.any().nullable(),
  country:z.string().optional(),
  position: z.string(),
  isMortgaged:z.boolean()
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

export const TradeSchema=z.object({
  id:z.string(),
  fromPlayerId:z.string(),
  toPlayerId:z.string(),
  moneyOffered:z.number(),
  moneyRequested:z.number(),
  propertiesOffered:z.array(z.string()),
  propertiesRequested:z.array(z.string()),
   status:z.enum([ 'pending',  'accepted',  'rejected']),
   createdAt:z.date()
})

export type Trade=z.infer<typeof TradeSchema>;


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
  }).nullable(),
  activeTrades:z.array(TradeSchema)
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
  playerBankrupt:{roomId:string;targetPlayerId:string};
  createTrade:{roomId:string;toPlayerId:string;moneyOffered:number;moneyRequested:number;propertiesOffered:string[];propertiesRequested:string[]}
  acceptTrade:{roomId:string;tradeId:string};
  rejectTrade:{roomId:string;tradeId:string};
  requestTrades:{roomId:string}
  // Game events
  gameStateUpdated: { players: Player[]; currentPlayerIndex: number };
  playerMove: { roomId: string; playerId: string; newPosition: number };
  turnEnd: { roomId: string; nextPlayerIndex: number };
  turnChanged: { nextPlayerIndex: number };

  // Added events
  rollDice: { roomId: string };
  endTurn: { roomId: string };
  buyProperty: { roomId: string; propertyId: string };
  sellProperty:{roomId:string;propertyId:string};
  updateSettings: { roomId: string; settings: GameSettings };
  mortageProperty:{roomId:string;propertyId:string};
  getBackMortagedProperty:{roomId:string;propertyId:string};
  
  // Error events
  error: string | Error | { message: string };
  connect_error: Error;
  reconnect_error: Error;
  reconnect_failed: void;
}; 