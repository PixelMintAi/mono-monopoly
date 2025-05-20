import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import BoardSpace from "./BoardSpace";
import Dice from "./Dice";
import PlayerPiece from "./Playerpiece";
import {
  Space,
} from "@/interfaces/interface";
import {
  BOARD_SPACES,
  surpriseCards,
  treasureCards,
} from "@/constants/constants";
import { Button } from "../ui/button";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import { handleCard } from "../../functions/cardHandler"
import { useWriteContract } from "wagmi";
import { Player } from "@/types/game";

interface GameBoardProps {
  players: Player[];
  currentPlayerIndex: number;
  onRollDice: () => void;
  onEndTurn: () => void;
  gameStarted: boolean;
  setgameStarted: Dispatch<SetStateAction<boolean>>;
  setPlayers: any;
  attemptJoinRoom:any,
  refreshGameState:any
  currentPlayer:Player | null,
  startGame:any
}

const GameBoard = ({
  players,
  currentPlayerIndex,
  onRollDice,
  onEndTurn,
  gameStarted,
  setgameStarted,
  setPlayers,
  attemptJoinRoom,
  refreshGameState,
  currentPlayer,
  startGame
}: GameBoardProps) => {
  const [diceValues, setDiceValues] = useState<number[]>([1, 1]);
  const [gameMessage, setGameMessage] = useState<string>("");
  const [hasRolled, setHasRolled] = useState(false);
  const [boardSpaces, setBoardSpaces] = useState<Space[]>(() =>
    BOARD_SPACES.map((space) => ({
      ...space,
      ownedBy: null, // Add default field
    }))
  );
  const isRolling=""
  const {writeContractAsync}=useWriteContract()

  const containerRef = useRef(null);
  const availableColors = [
    "#c6ff00",
    "#ffca28",
    "#ff6d00",
    "#d84315",
    "#42a5f5",
    "#4dd0e1",
    "#00897b",
    "#76ff03",
    "#8d6e63",
    "#f06292",
    "#f8bbd0",
    "#9575cd",
  ];
  const usedColors = players.map((player) => player.color);
  const filteredColors = availableColors.filter(
    (color) => !usedColors.includes(color)
  );
  const [selectedColor, setSelectedColor] = useState<null | string>(null);
  const [hasJoined, setHasJoined] = useState(false);

  // Reset the hasRolled state when the player changes
  useEffect(() => {
    // setHasRolled(false);
    setGameMessage(`${players[currentPlayerIndex]?.name}'s turn`);
  }, [currentPlayerIndex, players]);

  const handleRollDice = () => {
    if (isRolling || hasRolled) return;

    setIsRolling(true);
    setGameMessage("Rolling dice...");

    const rollInterval = setInterval(() => {
      setDiceValues([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]);
    }, 100);

    setTimeout(() => {
      clearInterval(rollInterval);

      const finalDice = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ];
      const total = finalDice[0] + finalDice[1];
      const isDouble = finalDice[0] === finalDice[1];

      setDiceValues(finalDice);
      setIsRolling(false);
      setHasRolled(true);

      const updatedPlayers = [...players];
      const player = { ...players[currentPlayerIndex] };
      const boardLength = boardSpaces.length;

      const movePlayer = (steps: number) =>
        (player.position + steps) % boardLength;
      const updatedSpaces = [...boardSpaces];
      // Jail Logic
      if (player.inJail) {
        if (isDouble || player.jailTurns >= 2) {
          player.inJail = false;
          player.jailTurns = 0;
          player.position = movePlayer(total);
          setGameMessage(
            `${player.name} rolled ${finalDice.join(
              "+"
            )} and got out of jail! Moved to space ${player.position}`
          );
        } else {
          player.jailTurns += 1;
          updatedPlayers[currentPlayerIndex] = player;
          setPlayers(updatedPlayers);
          setGameMessage(
            `${player.name} rolled ${finalDice.join(
              "+"
            )} but is still in jail (${player.jailTurns}/3 tries)`
          );
          return;
        }
      } else {
        const passedStart = player.position + total >= boardLength;
        player.position = movePlayer(total);
        if (passedStart) player.money += 200;
        if (player.position === 0) player.money += 300;

        const currentSpace = boardSpaces[player.position];

        if (player.position === 30) {
          player.position = 10;
          player.inJail = true;
          player.jailTurns = 0;
          setGameMessage(
            `${player.name} landed on Go To Jail! Sent to jail at space 10.`
          );
        } else if (currentSpace.type === "surprise") {
          const card =
            surpriseCards[Math.floor(Math.random() * surpriseCards.length)];
          handleCard(card, player, boardLength);
        } else if (currentSpace.type === "treasure") {
          const card =
            treasureCards[Math.floor(Math.random() * treasureCards.length)];
          handleCard(card, player, boardLength);
        } else if (currentSpace.id === "vacation") {
          player.money += currentSpace.price;
        } else if (currentSpace.type === "tax") {
          player.money -= currentSpace.price;
          updatedSpaces[20] = {
            ...boardSpaces[20],
            price: boardSpaces[20].price + currentSpace.price,
          };
        } else {
          setGameMessage(
            `${player.name} rolled ${finalDice.join(
              "+"
            )}=${total} and moved to space ${player.position}`
          );
        }
      }

      updatedPlayers[currentPlayerIndex] = player;
      setPlayers(updatedPlayers);
      setBoardSpaces(updatedSpaces);
    }, 1000);
  };

  const handleEndTurn = () => {
    setHasRolled(false);
    onEndTurn();
  };

  const handleBuy = () => {
    const currentPlayer = players[currentPlayerIndex];
    const currentSpace = boardSpaces[currentPlayer.position];
    const updatedPlayers = [...players];
    const updatedSpaces = [...boardSpaces];
    const property = boardSpaces[currentPlayer.position];
    const UpdatedMoney = currentPlayer.money - property.price;
    if (UpdatedMoney >= 0) {
      updatedPlayers[currentPlayerIndex] = {
        ...currentPlayer,
        money: UpdatedMoney,
        properties: [...(currentPlayer.properties || []), property],
      };
      updatedSpaces[currentPlayer.position] = {
        ...currentSpace,
        ownedBy: currentPlayer,
      };
      setBoardSpaces(updatedSpaces);
      setPlayers(updatedPlayers);
    }
  };

  const doesPlayerOwnProperty = (player: Player, propertyId: String) => {
    return (player.properties || []).some((p) => p.id === propertyId);
  };

  const router = useRouter();

  return (
    <div
      className="relative w-2/3 aspect-square bg-gray-900 rounded-lg overflow-hidden max-h-[85vh]"
      ref={containerRef}
    >
      {/* Game board */}
      <div className="absolute inset-0 grid grid-cols-11 grid-rows-11 gap-1 p-4">
        {/* Corner spaces */}
        <div className="col-start-1 col-span-1 row-start-11 row-span-1">
          <BoardSpace space={boardSpaces[30]} /> {/* GO TO PRISON */}
        </div>
        <div className="col-start-11 col-span-1 row-start-11 row-span-1">
          <BoardSpace space={boardSpaces[20]} /> {/* VACATION */}
        </div>
        <div className="col-start-11 col-span-1 row-start-1 row-span-1">
          <BoardSpace space={boardSpaces[10]} /> {/* IN PRISON */}
        </div>
        <div className="col-start-1 col-span-1 row-start-1 row-span-1">
          <BoardSpace space={boardSpaces[0]} /> {/* Start */}
        </div>

        {boardSpaces
          .slice(1, 10)
          .reverse()
          .map((space, index) => (
            <div
              key={space.id}
              className="row-start-1 col-span-1 bg-blue-900 rounded-lg flex items-center justify-center"
              style={{ gridColumn: `${9 - index + 1}` }}
            >
              <BoardSpace space={space} />
            </div>
          ))}

        {/* Right column */}
        {boardSpaces
          .slice(11, 20)
          .reverse()
          .map((space, index) => (
            <div
              key={space.id}
              className="col-start-11 row-span-1 bg-blue-900 rounded-lg flex items-center justify-center"
              style={{ gridRow: `${10 - index}` }}
            >
              <BoardSpace space={space} />
            </div>
          ))}

        {/* Top row */}
        {boardSpaces
          .slice(21, 30)
          .reverse()
          .map((space, index) => (
            <div
              key={space.id}
              className="row-start-11 col-span-1 bg-blue-900 rounded-lg flex items-center justify-center"
              style={{ gridColumn: `${index + 2}` }}
            >
              <BoardSpace space={space} />
            </div>
          ))}

        {/* Left column */}
        {boardSpaces
          .slice(31, 40)
          .reverse()
          .map((space, index) => (
            <div
              key={space.id}
              className="col-start-1 row-span-1 bg-blue-900 rounded-lg flex items-center justify-center"
              style={{ gridRow: `${index + 2}` }}
            >
              <BoardSpace space={space} />
            </div>
          ))}

        {/* Center area with dice and game info */}
        <div className="col-start-3 col-span-7 row-start-3 row-span-7 rounded-lg flex flex-col items-center justify-center">
          {/* Game logo */}
          <h1 className="text-4xl font-bold text-yellow-400 mb-8">
            TRAVEL MONOPOLY
          </h1>

          {/* Dice */}
          <div className="flex space-x-4 mb-8">
            <Dice value={diceValues[0]} isRolling={isRolling} />
            <Dice value={diceValues[1]} isRolling={isRolling} />
          </div>

          {/* Game message */}
          {!gameStarted &&currentPlayer?.isLeader===true && (
            <Button
              className="cursor-pointer"
              disabled={players.length<2}
              onClick={() => {
                startGame()
                refreshGameState()
                // setgameStarted(true);
              }}
            >
              Start Game
            </Button>
          )}
          {gameStarted && (
            <div className="text-white text-xl mb-6">{gameMessage}</div>
          )}

          {/* Current player info */}
          {gameStarted && (
            <div className="text-white mb-6">
              {players[currentPlayerIndex] && (
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-2"
                    style={{
                      backgroundColor: players[currentPlayerIndex].color,
                    }}
                  ></div>
                  <span>{players[currentPlayerIndex].name}&apos;s turn</span>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          {gameStarted && (
            <div className="flex space-x-4">
              {!currentPlayer?.hasRolled&& (
                <button
                  onClick={()=>{
                    onRollDice()
                    refreshGameState()

                  }}
                  disabled={isRolling}
                  className="px-6 py-2 bg-green-600 text-white cursor-pointer rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Roll Dice
                </button>
              )}
              {currentPlayer?.hasRolled && (
                <div className="flex gap-2">
                  <Button
                    onClick={()=>{
                      onEndTurn()
                      refreshGameState()
                    }}
                    className="px-6 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    End Turn
                  </Button>
                  {(boardSpaces[players[currentPlayerIndex].position].type ===
                    "airport" ||
                    boardSpaces[players[currentPlayerIndex].position].type ===
                      "city" ||
                    boardSpaces[players[currentPlayerIndex].position].type ===
                      "utility") &&
                    !doesPlayerOwnProperty(
                      players[currentPlayerIndex],
                      boardSpaces[players[currentPlayerIndex].position].id
                    ) &&
                    players[currentPlayerIndex].money >=
                      boardSpaces[players[currentPlayerIndex].position].price &&
                    boardSpaces[players[currentPlayerIndex].position]
                      .ownedBy === null && (
                      <Button
                        className="cursor-pointer"
                        onClick={() => {
                          handleBuy();
                        }}
                      >
                        Buy for $
                        {
                          boardSpaces[players[currentPlayerIndex].position]
                            .price
                        }
                      </Button>
                    )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Player pieces */}
      {players.map((player) => (
        <PlayerPiece
          key={player.id}
          player={player}
          spaces={boardSpaces}
          isCurrentPlayer={false}
          hasRolled={false}
          containerRef={containerRef}
          onEndTurn={function (): void {
            throw new Error("Function not implemented.");
          }}
        />
      ))}
      {/* Overlay when game is full */}

      {!currentPlayer && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-500 flex items-center justify-center">
          <div className="bg-[#1c1c2e] text-white rounded-2xl p-8 shadow-lg max-w-sm w-[90%] text-center">
            <h2 className="text-xl font-semibold mb-6">
              Select your player appearance:
            </h2>

            <div className="grid grid-cols-4 gap-4 justify-items-center mb-6">
              {filteredColors.map((color, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedColor(color)}
                  className={`w-12 h-12 rounded-full cursor-pointer flex items-center justify-center border-4 transition-all duration-200 ${
                    selectedColor === color
                      ? "border-white scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && (
                    <div className="text-white text-lg font-bold">👀</div>
                  )}
                </div>
              ))}
            </div>

            <Button
              // onClick={handleJoinGame}
              disabled={selectedColor === null}
              onClick={() => {
                if (!selectedColor) return;
                attemptJoinRoom()
                refreshGameState()

                // const newPlayer = {
                //   id: uuidv4(), // Unique UUID instead of index-based ID
                //   name: `Player ${players.length + 1}`,
                //   color: selectedColor,
                //   position: 0,
                //   money: 1500,
                //   properties: [],
                //   inJail: false,
                //   jailTurns: 0,
                //   cards: [],
                // };

                // setPlayers([...players, newPlayer]);
                // setHasJoined(true);
                // Optionally hide the modal or trigger navigation
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-lg transition cursor-pointer"
            >
              Join game
            </Button>

            <div className="mt-4">
              <button
                className="text-sm text-purple-300 hover:underline cursor-pointer"
                onClick={() => {
                  router.push("/store");
                }}
              >
                🛍️ Get more appearances
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
