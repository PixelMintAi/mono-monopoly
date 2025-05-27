import { GameState } from "@/app/game/types";
import { Player } from "@/types/game";
import React from "react";
import { Button } from "../ui/button";
import { clearAllStorage } from "@/app/game/persistence";

const AllPlayersInfo = ({
  players,
  currentPlayer,
  gameStarted,
  gameState,
  playerUUID,
  setCurrentPageState,
  kickPlayer
}: {
  players: Player[];
  currentPlayer: any;
  gameStarted: boolean;
  gameState: GameState;
  playerUUID: string;
  setCurrentPageState: any;
  kickPlayer:(playerId:string)=>void
}) => {
  return (
    <div className="flex flex-col p-4 ml-2">
      <div>All Players</div>
      <div className="bg-amber-700 p-2 rounded flex flex-col gap-2">
        {players
          .map((player: Player, index: number) => (
            <div
              className={`
                        p-3 rounded-lg flex justify-between w-full
                        ${
                          index === gameState.currentPlayerIndex
                            ? " border border-gray-200"
                            : ""
                        }
                      `}
              key={index}
            >
              <div className="flex gap-2 items-center">
                <div
                  className={`h-4 w-4 rounded-4xl`}
                  style={{ backgroundColor: player.color }}
                ></div>
                <div>
                  {player.name} {player.isLeader && "👑"}
                </div>
              </div>
              {currentPlayer?.isLeader && player.id!==currentPlayer.id &&
              <Button
                size="sm"
                className="cursor-pointer"
                onClick={() => {
                  kickPlayer(player.id)
                }}
              >
                Kick
              </Button>

              }
              {playerUUID ===player.uuid && !gameState.gameStarted &&<Button
                size="sm"
                className="cursor-pointer bg-red-600  hover:bg-red-800"
                onClick={() => {
                  clearAllStorage();
                  setCurrentPageState("menu");
                }}
              >
                Exit
              </Button>}
              {gameStarted && (
                <div className="flex gap-[0.5rem] items-center cursor-pointer p-1 rounded">
                  ${player.money}
                                {playerUUID ===player.uuid &&<Button
                size="sm"
                className="cursor-pointer bg-red-600  hover:bg-red-800"
                onClick={() => {
                  clearAllStorage();
                  setCurrentPageState("menu");
                }}
              >
                Exit
              </Button>}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
};

export default AllPlayersInfo;
