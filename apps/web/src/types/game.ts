export interface Player {
  id: string;
  uuid:string;
  name: string;
  color: string;
  position: number;
  money: number;
  isLeader:boolean;
  properties: any[];
  inJail: boolean;
  jailTurns: number;
  cards: any[];
  hasRolled: boolean;
  bankRupt:boolean;
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
  settings:GameSettings
  currentPlayerIndex: number;
  gameStarted: boolean;
  roomId: string;
} 