import React, { useEffect, useState, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FaPeopleGroup } from "react-icons/fa6";
import { RiChatPrivateLine } from "react-icons/ri";
import { Switch } from "../ui/switch";
import { FaMapMarkedAlt } from "react-icons/fa";
import { TbBrandCashapp } from "react-icons/tb";

import { FaEthereum } from "react-icons/fa";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { Input } from "../ui/input";
import { Player } from "@/types/game";
import type { GameSettings } from "@/types/game";
import { GameState } from "@/store/gameStore";
import { useGameStore } from "@/store/gameStore";
import { useDebounce } from "@/hooks/useDebounce";

const GameSettings = ({
  leader,
  players,
  setPlayers,
  playersCount,
  setplayersCount,
  currentPlayer,
  updateSettings,
  refreshGameState,
  gameState
}: {
  leader: string;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  playersCount: string;
  setplayersCount: any;
  currentPlayer:Player | null;
  updateSettings:any
  refreshGameState:any;
  gameState:GameState
}) => {
  
  const [startingCash, setstartingCash] = useState<string>("1500");
  const [privateRoom, setprivateRoom] = useState<boolean>(true);
  const settingsMenu = [
    {
      id: "max-players",
      name: "Maximum Players",
      desc: "How many players can join the game",
    },
    {
      id: "room-type",
      name: "Private Room",
      desc: "How many players can join the game",
    },
  ];
  const [poolAmountEntered, setpoolAmountEntered] = useState(0.001)
  const [cryptoPoolActivated, setcryptoPoolActivated] =
    useState<boolean>(true);

  // Subscribe to specific parts of the game state
  const gameSettings = useGameStore(state => state.gameState?.settings);

  // Update local state when game settings change
  useEffect(() => {
    if (gameSettings) {
      setstartingCash(String(gameSettings.startingAmount));
      setplayersCount(String(gameSettings.maxPlayers));
      setcryptoPoolActivated(gameSettings.cryptoPoolActivated);
      setpoolAmountEntered(gameSettings.poolAmountToEnter);
    }
  }, [gameSettings, setplayersCount]);

  // Replace lodash debounce with our custom hook
  const debouncedUpdateSettings = useDebounce((settings: GameSettings) => {
    updateSettings(settings);
    refreshGameState();
  }, 500);

  // Update settings when local state changes
  useEffect(() => {
    const newSettings: GameSettings = {
      map: "Classic",
      maxPlayers: Number(playersCount),
      startingAmount: Number(startingCash),
      cryptoPoolActivated,
      poolAmountToEnter: poolAmountEntered
    };

    // Only update if we have a complete settings object
    if (currentPlayer?.isLeader && !gameState?.gameStarted) {
      debouncedUpdateSettings(newSettings);
    }
  }, [startingCash, privateRoom, cryptoPoolActivated, poolAmountEntered, playersCount, debouncedUpdateSettings, currentPlayer?.isLeader, gameState?.gameStarted]);

  return (
    <div className="flex flex-col ml-6 mr-4 p-2 bg-fuchsia-950 rounded">
      <text className="w-full text-center">Game Settings</text>
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <div>
              <FaPeopleGroup />
            </div>
            <text>Max Players</text>
            {/* <text>How many players can join the game</text> */}
          </div>
          <div>
            <Select
            disabled={!currentPlayer?.isLeader ||gameState?.gameStarted}
              value={playersCount}
              onValueChange={(e) => {
                setplayersCount(e);
              }}
            >
              <SelectTrigger className="w-[80px] cursor-pointer">
                <SelectValue placeholder="Select Players" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <div>
              <RiChatPrivateLine />
            </div>
            <text>Private Room</text>
            {/* <text>How many players can join the game</text> */}
          </div>
          <div className="flex gap-2 mr-2">
            <Switch
              color="#fff"
              checked={privateRoom}
              disabled={!currentPlayer?.isLeader ||gameState?.gameStarted}
              onCheckedChange={(checked) => {
                setprivateRoom(checked);
              }}
              className={
                privateRoom
                  ? "bg-blue-500 data-[state=checked]:bg-blue-500 cursor-pointer"
                  : "bg-gray-300 cursor-pointer"
              }
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <div>
              <FaMapMarkedAlt />
            </div>
            <text>Map</text>
            {/* <text>How many players can join the game</text> */}
          </div>
          <div className="flex gap-2 mr-2">Classic</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <div>
              <TbBrandCashapp />
            </div>
            <text>Starting Cash</text>
            {/* <text>How many players can join the game</text> */}
          </div>
          <div>
            <Select
              value={startingCash}
              disabled={!currentPlayer?.isLeader ||gameState?.gameStarted}
              onValueChange={(e) => {
                setstartingCash(e);
              }}
            >
              <SelectTrigger className="w-[85px] cursor-pointer">
                <SelectValue placeholder="Select Starting Cash" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="1000">1000</SelectItem>
                  <SelectItem value="1500">1500</SelectItem>
                  <SelectItem value="2000">2000</SelectItem>
                  <SelectItem value="2500">2500</SelectItem>
                  <SelectItem value="3000">3000</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-between">
          <div className="flex gap-2 items-center">
            <FaEthereum />
            Crypto Pool
          </div>
          <div className="flex gap-2 mr-2">
            <Switch
              color="#fff"
              checked={cryptoPoolActivated}
              disabled={!currentPlayer?.isLeader ||gameState?.gameStarted}
              onCheckedChange={(checked) => {
                setcryptoPoolActivated(checked);
              }}
              className={
                cryptoPoolActivated
                  ? "bg-blue-500 data-[state=checked]:bg-blue-500 cursor-pointer"
                  : "bg-gray-300 cursor-pointer"
              }
            />
          </div>
        </div>
        {cryptoPoolActivated &&<div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
          <RiMoneyDollarCircleFill />
            Enter Pool Amount (ETH)
          </div>
          <Input disabled={!currentPlayer?.isLeader ||gameState?.gameStarted} type="number" placeholder="Enter Amount in Eth" value={poolAmountEntered} onChange={(e)=>{
            setpoolAmountEntered(Number(e.target.value))
          }} />
        </div>}
      </div>
    </div>
  );
};

export default GameSettings;
