import { Space } from './types/game';

export const BOARD_SPACES: Omit<Space, 'ownedBy'>[] = [
  {
    id: 'start',
    name: 'Start',
    type: 'corner',
    position: 0
  },
  {
    id: 'city1',
    name: 'New York',
    type: 'city',
    price: 200,
    rent: 20,
    position: 1
  },
  // ... Add more spaces as needed
]; 