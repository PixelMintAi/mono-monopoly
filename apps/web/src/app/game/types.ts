
// types.ts
export interface Player {
    id: string;
    uuid: string;
    name: string;
    isLeader: boolean;
    color: string;
    position: number;
    money: number;
    properties: Space[];
    inJail: boolean;
    jailTurns: number;
    cards: any[];
    hasRolled: boolean;
    bankRupt: boolean;
  }
  
  export interface Space {
    id: string;
    name: string;
    type: string;
    price?: number;
    rent?: number;
    ownedBy?: string | null;
  }
  
  export interface Room {
    id: string;
    settings: {
      maxPlayers: number;
      startingAmount: number;
      poolAmountToEnter: number;
    };
    players: Player[];
    gameStarted: boolean;
    currentPlayerIndex: number;
    boardSpaces: Space[];
    lastDiceRoll: {
      dice1: number;
      dice2: number;
      playerId: string;
    } | null;
  }
  
  export interface GameState {
    roomId: string;
    players: Player[];
    currentPlayerIndex: number;
    gameStarted: boolean;
    lastDiceRoll: any;
    boardSpaces: Space[];
    settings?: any;
  }