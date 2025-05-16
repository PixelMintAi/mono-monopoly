export interface Player {
  id: string;
  name: string;
  color: string;
  position: number;
  money: number;
  properties: any[];
  inJail: boolean;
  jailTurns: number;
  cards: any[];
  hasRolled: boolean;
}

export interface Space {
  id: string;
  name: string;
  type: string;
  price?: number;
  rent?: number;
  ownedBy: Player | null;
}

export interface GameSettings {
  map: 'Classic';
  maxPlayers: number;
  startingAmount: number;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  gameStarted: boolean;
  roomId: string;
} 