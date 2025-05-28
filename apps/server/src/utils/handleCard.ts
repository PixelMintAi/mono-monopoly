import { Player } from "@monopoly/shared";


/**
 * Executes the effect of a SurpriseCard or TreasureCard on the given player.
 *
 * @param card - The card drawn by the player
 * @param player - The player who drew the card
 * @param boardLength - The total number of board spaces (used for wrap-around logic)
 */
export const handleCard = (
  card: string,
  player: Player,
  boardLength: number
): void => {
  const cardActions: Record<string, () => void> = {
    "Advance to Start (Collect $200)": () => {
      player.position = 0;
      player.money = Number(player.money) + 200;
    },
    "Go to Jail": () => {
      player.position = 10;
      player.inJail = true;
      player.jailTurns = 0;
    },
    "Go back 3 spaces": () => {
      player.position = (player.position - 3 + boardLength) % boardLength;
    },
    "Bank pays you dividend of $50": () => {
      player.money = Number(player.money) + 50;
    },
    "Pay tax of $45": () => {
      player.money = Number(player.money) - 45;
    },
    "Take a trip to Rome": () => {
      player.position = 24;
    },
    "Advance to New York": () => {
      player.position = 18;
    },
    "Your building loan matures — collect $150": () => {
      player.money = Number(player.money) + 150;
    },
    "Get out of Jail Free": () => {
      // No-op for now — implement token or card logic elsewhere
    },

    "Bank error in your favor — collect $200": () => {
      player.money = Number(player.money) + 200;
    },
    "From sale of stock you get $50": () => {
      player.money = Number(player.money) + 50;
    },
    "Doctor's fees — Pay $50": () => {
      player.money = Number(player.money) - 50;
    },
    "Holiday Fund matures — receive $100": () => {
      player.money = Number(player.money) + 100;
    },
    "Pay hospital fees of $100": () => {
      player.money = Number(player.money) - 100;
    },
    "Life insurance matures — collect $100": () => {
      player.money = Number(player.money) + 100;
    },
    "You inherit $100": () => {
      player.money = Number(player.money) + 100;
    },
    "Income tax refund — collect $20": () => {
      player.money = Number(player.money) + 20;
    },
  };

  if (typeof player.money !== "number") {
    console.warn(`Fixing non-numeric player.money for ${player.name}:`, player.money);
    player.money = Number(player.money);
  }

  const action = cardActions[card];
  if (action) action();
  else console.warn(`Unknown card: ${card}`);
};
