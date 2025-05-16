import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/gameStore";
import type { Player } from "@/store/gameStore";

interface GameControlsProps {
  gameStarted: boolean;
  canRoll: boolean;
  currentPlayer: Player;
  onRollDice: () => void;
  onEndTurn: () => void;
  onBuyProperty: () => void;
  onStartGame: () => void;
}

export function GameControls({
  gameStarted,
  canRoll,
  currentPlayer,
  onRollDice,
  onEndTurn,
  onBuyProperty,
  onStartGame,
}: GameControlsProps) {
  const { isRolling, gameState } = useGameStore();
  const currentSpace = gameState?.boardSpaces[currentPlayer.position];

  if (!gameStarted) {
    return (
      <Button
        onClick={onStartGame}
        className="bg-green-600 hover:bg-green-700"
      >
        Start Game
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Current player info */}
      <div className="text-white">
        <div className="flex items-center">
          <div
            className="w-4 h-4 rounded-full mr-2"
            style={{ backgroundColor: currentPlayer.color }}
          />
          <span>{currentPlayer.name}&apos;s turn</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4">
        { (
          <Button
            onClick={onRollDice}
            disabled={isRolling}
            className="bg-green-600 hover:bg-green-700"
          >
            Roll Dice
          </Button>
        )}
        
        {currentPlayer.hasRolled && (
          <div className="flex gap-2">
            <Button
              onClick={onEndTurn}
              className="bg-blue-600 hover:bg-blue-700"
            >
              End Turn
            </Button>
            
            {currentSpace && 
             (currentSpace.type === "city" || 
              currentSpace.type === "airport" || 
              currentSpace.type === "utility") && 
             currentSpace.ownedBy === null && 
             currentPlayer.money >= (currentSpace.price || 0) && (
              <Button
                onClick={onBuyProperty}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Buy for ${currentSpace.price}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 