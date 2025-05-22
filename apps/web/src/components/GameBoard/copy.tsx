import { useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import { useGameSync } from "@/hooks/useGameSync";
import { cn } from "@/lib/utils";
import BoardSpace from "./BoardSpace";
import Dice from "./Dice";
import PlayerPiece from "./Playerpiece";
import { GameControls } from "./GameControls";
import { GameMessage } from "./GameMessage";
import { GameBoardGrid } from "./GameBoardGrid";
import { Space } from '@/interfaces/interface';
import { Player } from '@/types/game';
import { Card } from "../ui/card";
import { motion, AnimatePresence } from "framer-motion";

interface GameBoardProps {
  roomId: string;
}

const GameBoard = ({ roomId }: GameBoardProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isConnected, error, gameState } = useGameSync(roomId);
  const { rollDice, endTurn, buyProperty, startGame, isRolling } = useGameStore();

  // Transform board spaces to match expected Space type
  const transformedSpaces: Space[] = gameState?.boardSpaces.map(space => ({
    ...space,
    ownedBy: space.ownedBy ? gameState.players.find(p => p.id === space.ownedBy) || null : null
  })) || [];

  if (!gameState) {
    return (
      <Card className="flex items-center justify-center min-h-[85vh] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-yellow-500"
            )} />
            <p className="text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
          {!isConnected && (
            <p className="text-yellow-500/90 text-sm">
              Waiting for connection to server...
            </p>
          )}
        </div>
      </Card>
    );
  }

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isCurrentPlayerTurn = currentPlayer?.id === useGameStore.getState().socket?.id;
  const canRoll = isCurrentPlayerTurn && !currentPlayer?.hasRolled;

  return (
    <div className="relative w-full max-w-5xl mx-auto aspect-square bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg shadow-lg overflow-hidden">
      {/* Game board grid */}
      <div className="absolute inset-0">
        <GameBoardGrid boardSpaces={gameState.boardSpaces} />
      </div>

      {/* Center game area */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Card className="w-[min(90%,36rem)] aspect-square flex flex-col items-center justify-center p-8 bg-background/80 backdrop-blur-sm border-border/50">
          {/* Game title */}
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-8 tracking-tight"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            TRAVEL MONOPOLY
          </motion.h1>

          {/* Game state display */}
          <div className="w-full max-w-md mb-8">
            <Card className="p-4 bg-background/60 border-border/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: currentPlayer.color }}
                  />
                  <span className="font-medium text-foreground">
                    {currentPlayer.name}'s Turn
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  ${currentPlayer.money}
                </div>
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={gameState.lastDiceRoll ? 'rolled' : 'not-rolled'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-center gap-6 mb-4"
                >
                  <Dice 
                    value={gameState.lastDiceRoll?.dice1 || 1} 
                    isRolling={isRolling} 
                  />
                  <Dice 
                    value={gameState.lastDiceRoll?.dice2 || 1} 
                    isRolling={isRolling} 
                  />
                </motion.div>
              </AnimatePresence>

              {/* Game message */}
              <div className="w-full">
                <GameMessage />
              </div>
            </Card>
          </div>

          {/* Game controls */}
          <div className="w-full max-w-md">
            <GameControls
              gameStarted={gameState.gameStarted}
              canRoll={canRoll}
              currentPlayer={currentPlayer}
              onRollDice={rollDice}
              onEndTurn={endTurn}
              onBuyProperty={buyProperty}
              onStartGame={startGame}
            />
          </div>
        </Card>
      </div>

      {/* Player pieces */}
      <div className="absolute inset-0 pointer-events-none">
        {gameState.players.map((player) => (
          <PlayerPiece
            key={player.id}
            player={player}
            spaces={transformedSpaces}
            isCurrentPlayer={player.id === currentPlayer?.id}
            hasRolled={player.hasRolled}
            containerRef={containerRef}
            onEndTurn={endTurn}
          />
        ))}
      </div>
    </div>
  );
};

export default GameBoard;
