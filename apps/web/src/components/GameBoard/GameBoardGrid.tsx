import { useMemo } from "react";
import BoardSpace from "./BoardSpace";
import type { Space } from "@/store/gameStore";
import { useGameStore } from "@/store/gameStore";

interface GameBoardGridProps {
  boardSpaces: Space[];
}

export function GameBoardGrid({ boardSpaces }: GameBoardGridProps) {
  const { gameState } = useGameStore();

  if (!boardSpaces || boardSpaces.length < 40 || !gameState) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-white">Loading board...</div>
      </div>
    );
  }

  // Transform spaces to include full player objects
  const transformedSpaces = useMemo(() => 
    boardSpaces.map(space => ({
      ...space,
      ownedBy: space.ownedBy ? gameState.players.find(p => p.id === space.ownedBy) || null : null
    })), [boardSpaces, gameState.players]);

  // Memoize the board spaces to avoid unnecessary re-renders
  const { corners, top, right, bottom, left } = useMemo(() => ({
    corners: {
      bottomLeft: transformedSpaces[30] || null,
      bottomRight: transformedSpaces[20] || null,
      topRight: transformedSpaces[10] || null,
      topLeft: transformedSpaces[0] || null,
    },
    top: transformedSpaces.slice(1, 10).reverse(),
    right: transformedSpaces.slice(11, 20).reverse(),
    bottom: transformedSpaces.slice(21, 30).reverse(),
    left: transformedSpaces.slice(31, 40).reverse(),
  }), [transformedSpaces]);

  return (
    <div className="absolute inset-0 grid grid-cols-11 grid-rows-11 gap-1 p-4">
      {/* Corner spaces */}
      <div className="col-start-1 col-span-1 row-start-11 row-span-1">
        <BoardSpace space={corners.bottomLeft} />
      </div>
      <div className="col-start-11 col-span-1 row-start-11 row-span-1">
        <BoardSpace space={corners.bottomRight} />
      </div>
      <div className="col-start-11 col-span-1 row-start-1 row-span-1">
        <BoardSpace space={corners.topRight} />
      </div>
      <div className="col-start-1 col-span-1 row-start-1 row-span-1">
        <BoardSpace space={corners.topLeft} />
      </div>

      {/* Top row */}
      {top.map((space) => (
        <div
          key={space.id}
          className="row-start-1 col-span-1 bg-blue-900 rounded-lg flex items-center justify-center"
          style={{ gridColumn: `${9 - (space.position as number) + 1}` }}
        >
          <BoardSpace space={space} />
        </div>
      ))}

      {/* Right column */}
      {right.map((space) => (
        <div
          key={space.id}
          className="col-start-11 row-span-1 bg-blue-900 rounded-lg flex items-center justify-center"
          style={{ gridRow: `${10 - (space.position as number) + 11}` }}
        >
          <BoardSpace space={space} />
        </div>
      ))}

      {/* Bottom row */}
      {bottom.map((space) => (
        <div
          key={space.id}
          className="row-start-11 col-span-1 bg-blue-900 rounded-lg flex items-center justify-center"
          style={{ gridColumn: `${(space.position as number) - 20}` }}
        >
          <BoardSpace space={space} />
        </div>
      ))}

      {/* Left column */}
      {left.map((space) => (
        <div
          key={space.id}
          className="col-start-1 row-span-1 bg-blue-900 rounded-lg flex items-center justify-center"
          style={{ gridRow: `${(space.position as number) - 30}` }}
        >
          <BoardSpace space={space} />
        </div>
      ))}
    </div>
  );
} 