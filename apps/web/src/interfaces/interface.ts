import { Player } from '@/types/game';

export interface Room {
  roomId: string;
  map: string;
  players: number;
  startingAmount: number;
  activePlayers: number;
  createdBy: string;
  createdAt: string;
}

export interface CardEffect {
  type: 'move' | 'money' | 'getOutOfJail' | 'repairs' | 'goToJail';
  value?: number;
  description: string;
}

export interface Space {
  id: string;
  name: string;
  type: 'city' | 'airport' | 'utility' | 'surprise' | 'treasure' | 'tax' | 'special' | 'chance' | 'community' | 'corner';
  position: number | 'top' | 'right' | 'bottom' | 'left' | 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
  price?: number;
  rent?: number;
  ownedBy: Player | null;
  country?: string;
  houses?: number;
  isMonopoly?: boolean;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  properties: Space[];
  bank: number;
  gameStatus: 'setup' | 'playing' | 'ended';
  winner?: string;
  round: number;
}

// ... rest of your existing interfaces ... 