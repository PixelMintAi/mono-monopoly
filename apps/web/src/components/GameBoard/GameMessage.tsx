import { useGameStore } from "@/store/gameStore";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function GameMessage() {
  const { gameMessage, gameState } = useGameStore();

  if (!gameState?.gameStarted) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={gameMessage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "text-center py-2 px-4 rounded-lg",
          gameMessage?.includes("rolled") 
            ? "bg-primary/10 text-primary"
            : gameMessage?.includes("bought") 
            ? "bg-green-500/10 text-green-500"
            : gameMessage?.includes("paid") 
            ? "bg-yellow-500/10 text-yellow-500"
            : "bg-muted text-muted-foreground"
        )}
      >
        <p className="text-sm font-medium">
          {gameMessage}
        </p>
      </motion.div>
    </AnimatePresence>
  );
} 