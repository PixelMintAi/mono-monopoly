import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Player } from '@/types/game';
import { Space } from '@/interfaces/interface';

interface PlayerPieceProps {
  player: Player;
  spaces: Space[];
  offset?: { x: number, y: number };
  isCurrentPlayer: boolean;
  hasRolled: boolean;
  onEndTurn: () => void;
  containerRef: any;
}

const PlayerPiece = ({ 
  player, 
  spaces, 
  offset = { x: 0, y: 0 },
  isCurrentPlayer,
  hasRolled,
  onEndTurn,
  containerRef
}: PlayerPieceProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Calculate position based on board space
    const container = containerRef.current;
    if (container) {
      const { width, height } = container.getBoundingClientRect();
      calculatePosition(width, height);
    }
  }, [player.position, containerRef]);

  const calculatePosition = (containerWidth: number, containerHeight: number) => {
    const spaceIndex = player.position;
    const space = spaces[spaceIndex];
  
    if (!space) return;

    // Board dimensions
    const boardWidth = containerWidth;
    const boardHeight = containerHeight;
    
    // Space dimensions (approximated from the screenshot)
    const cornerSize = Math.min(boardWidth, boardHeight) * 0.09; // Corner spaces are slightly larger
    const horizontalSpaceWidth = (boardWidth - 2 * cornerSize) / 9; // 9 spaces between corners
    const verticalSpaceHeight = (boardHeight - 2 * cornerSize) / 9;
    
    // Small random offset for multiple players
    const randomOffset = {
      x: (Math.random() - 0.5) * 10,
      y: (Math.random() - 0.5) * 10
    };
    
    let x = 0;
    let y = 0;
    
    // Get absolute space position
    const spacePos = getAbsolutePosition(space, spaces);
    
    if (spacePos === 0) { // Start (TOP LEFT)
      x = cornerSize / 2;
      y = cornerSize / 2;
    } 
    else if (spacePos > 0 && spacePos < 10) { // Top row
      x = cornerSize + (spacePos - 0.5) * horizontalSpaceWidth;
      y = cornerSize / 2;
    }
    else if (spacePos === 10) { // Prison (TOP RIGHT)
      x = boardWidth - cornerSize;
      y = cornerSize / 2;
    }
    else if (spacePos > 10 && spacePos < 20) { // Right column
      x = boardWidth - cornerSize;
      y = cornerSize + (spacePos - 10 - 0.5) * verticalSpaceHeight;
    }
    else if (spacePos === 20) { // Vacation (BOTTOM RIGHT)
      x = boardWidth - cornerSize;
      y = boardHeight - cornerSize;
    }
    else if (spacePos > 20 && spacePos < 30) { // Bottom row
      x = boardWidth - cornerSize - (spacePos - 20 - 0.2) * horizontalSpaceWidth;
      y = boardHeight - cornerSize;
    }
    else if (spacePos === 30) { // Go to Prison (BOTTOM LEFT)
      x = cornerSize / 2;
      y = boardHeight - cornerSize / 2;
    }
    else if (spacePos > 30 && spacePos < 40) { // Left column
      x = cornerSize/2;
      y = boardHeight - cornerSize - (spacePos - 30 - 0.3) * verticalSpaceHeight;
    }
    
    // Add random offset for multiple players on same space
    x += randomOffset.x;
    y += randomOffset.y;
    
    // Apply any custom offset
    x += offset.x;
    y += offset.y;
    
    setPosition({ x, y });
  };
  
  // Helper function to get the absolute position (0-39) on the board
  const getAbsolutePosition = (space: Space, allSpaces: Space[]): number => {
    // This is crucial - we need to determine the actual position (0-39) on the board
    const index = allSpaces.findIndex(s => s.id === space.id);
    return index;
  };
  
  return (
    <>
      <motion.div
        className="absolute w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold"
        style={{
          backgroundColor: player.color,
          color: getContrastColor(player.color),
          zIndex: 70,
          transform: 'translate(-50%, -50%)' // Center the piece on its coordinates
        }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          x: position.x,
          y: position.y,
          transition: { type: 'spring', stiffness: 200, damping: 20 }
        }}
      >
        {player.name.charAt(0)}
      </motion.div>
      
      {/* End Turn Button - Only shown for current player after they've rolled */}
      {isCurrentPlayer && hasRolled && (
        <motion.button
          className="absolute bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onEndTurn}
        >
          End Turn
        </motion.button>
      )}
    </>
  );
};

// Helper function to get contrasting text color
const getContrastColor = (hexColor: string): string => {
  // Remove # if present
  const color = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

export default PlayerPiece;