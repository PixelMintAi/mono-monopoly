// utils/initPlayerId.ts
import { v4 as uuidv4 } from 'uuid';

export function getOrCreatePlayerUUID(): string {
  let uuid = localStorage.getItem('playerUUID');
  if (!uuid) {
    uuid = uuidv4();
    localStorage.setItem('playerUUID', uuid);
  }
  return uuid;
}
