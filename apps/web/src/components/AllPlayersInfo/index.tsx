import { Player } from "@/types/game";
import React from "react";

const AllPlayersInfo = ({
  players,
  leader,
  gameStarted
}: {
  players: Player[];
  leader: string;
  gameStarted:boolean
}) => {
  return (
    <div className="flex flex-col p-4 ml-2">
      <div>All Players</div>
      <div className="bg-amber-700 p-2 rounded flex flex-col gap-2">
        {[...players]
          .sort((a, b) =>
            String(a.id) === leader ? -1 : String(b.id) === leader ? 1 : 0
          )
          .map((player: Player, index: number) => (
            <div className="flex w-full justify-between p-2" key={index}>
              <div className="flex gap-2 items-center">
                <div className={`h-4 w-4 rounded-4xl`} style={{ backgroundColor: player.color }}></div>
                <div>{player.name}</div>
              </div>
              {leader === String(player.id) &&!gameStarted && (
                <div className="flex gap-1 items-center cursor-pointer border p-1 rounded">
               
                  Change Icon
                </div>
              )}
              {gameStarted &&
                <div className="flex gap-1 items-center cursor-pointer p-1 rounded">
                    ${player.money}
                </div>
              }
            </div>
          ))}
      </div>
    </div>
  );
};

export default AllPlayersInfo;
