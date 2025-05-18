import { Player, SurpriseCard, TreasureCard } from "@/interfaces/interface";

export const handleCard = (
  card: SurpriseCard | TreasureCard,
  player: Player,
  boardLength: number
) => {
  const cardActions: Record<SurpriseCard | TreasureCard, () => void> = {
    "Advance to Start (Collect $200)": () => {
      player.position = 0;
      player.money += 200;
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
      player.money += 50;
    },
    "Pay tax of $45": () => {
      player.money -= 45;
    },
    "Take a trip to Rome": () => {
      player.position = 24;
    },
    "Advance to New York": () => {
      player.position = 18;
    },
    "Your building loan matures — collect $150": () => {
      player.money += 150;
    },
    "Get out of Jail Free": () => {},

    "Bank error in your favor — collect $200": () => {
      player.money += 200;
    },
    "From sale of stock you get $50": () => {
      player.money += 50;
    },
    "Doctor's fees — Pay $50": () => {
      player.money -= 50;
    },
    "Holiday Fund matures — receive $100": () => {
      player.money += 100;
    },
    "Pay hospital fees of $100": () => {
      player.money -= 100;
    },
    "Life insurance matures — collect $100": () => {
      player.money += 100;
    },
    "You inherit $100": () => {
      player.money += 100;
    },
    "Income tax refund — collect $20": () => {
      player.money += 20;
    },
  };

  cardActions[card]?.();
  //   setGameMessage(`${player.name} drew a card: "${card}"`);
};
