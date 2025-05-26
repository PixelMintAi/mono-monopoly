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
  currentPlayer: Player | null;
  updateSettings: any;
  refreshGameState: any;
  gameState: GameState;
}) => {
  const [startingCash, setStartingCash] = useState<string>("1500");
  const [poolAmountEntered, setPoolAmountEntered] = useState(0.001);
  const [cryptoPoolActivated, setCryptoPoolActivated] = useState<boolean>(true);

  // Subscribe to specific parts of the game state
  const gameSettings = useGameStore(state => state.gameState?.settings);

  // Update local state when game settings change
  useEffect(() => {
    if (gameSettings) {
      setStartingCash(String(gameSettings.startingAmount));
      setplayersCount(String(gameSettings.maxPlayers));
      setCryptoPoolActivated(gameSettings.cryptoPoolActivated);
      setPoolAmountEntered(gameSettings.poolAmountToEnter);
    }
  }, [gameSettings, setplayersCount]);

  // Handle settings changes directly
  const handleSettingsChange = useCallback((newSettings: Partial<GameSettings>) => {
    if (!currentPlayer?.isLeader || gameState?.gameStarted) return;

    const updatedSettings: GameSettings = {
      map: "Classic",
      maxPlayers: Number(playersCount),
      startingAmount: Number(startingCash),
      cryptoPoolActivated,
      poolAmountToEnter: poolAmountEntered,
      ...newSettings
    };

    // Only update if settings actually changed
    if (JSON.stringify(updatedSettings) !== JSON.stringify(gameSettings)) {
      updateSettings(updatedSettings);
      refreshGameState();
    }
  }, [currentPlayer?.isLeader, gameState?.gameStarted, playersCount, startingCash, cryptoPoolActivated, poolAmountEntered, gameSettings, updateSettings, refreshGameState]);

  return (
    <div className="flex flex-col ml-6 mr-4 p-2 bg-fuchsia-950 rounded">
      <text className="w-full text-center">Game Settings</text>
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <div><FaPeopleGroup /></div>
            <text>Max Players</text>
          </div>
          <div>
            <Select
              disabled={!currentPlayer?.isLeader || gameState?.gameStarted}
              value={playersCount}
              onValueChange={(value) => {
                setplayersCount(value);
                handleSettingsChange({ maxPlayers: Number(value) });
              }}
            >
              <SelectTrigger className="w-[80px] cursor-pointer">
                <SelectValue placeholder="Select Players" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {[2, 3, 4, 5, 6].map((num) => (
                    <SelectItem key={num} value={String(num)}>{num}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <div><TbBrandCashapp /></div>
            <text>Starting Cash</text>
          </div>
          <div>
            <Select
              value={startingCash}
              disabled={!currentPlayer?.isLeader || gameState?.gameStarted}
              onValueChange={(value) => {
                setStartingCash(value);
                handleSettingsChange({ startingAmount: Number(value) });
              }}
            >
              <SelectTrigger className="w-[85px] cursor-pointer">
                <SelectValue placeholder="Select Starting Cash" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {[1000, 1500, 2000, 2500, 3000].map((amount) => (
                    <SelectItem key={amount} value={String(amount)}>{amount}</SelectItem>
                  ))}
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
              disabled={!currentPlayer?.isLeader || gameState?.gameStarted}
              onCheckedChange={(checked) => {
                setCryptoPoolActivated(checked);
                handleSettingsChange({ cryptoPoolActivated: checked });
              }}
              className={cryptoPoolActivated ? "bg-blue-500 data-[state=checked]:bg-blue-500 cursor-pointer" : "bg-gray-300 cursor-pointer"}
            />
          </div>
        </div>

        {cryptoPoolActivated && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <RiMoneyDollarCircleFill />
              Enter Pool Amount (ETH)
            </div>
            <Input
              disabled={!currentPlayer?.isLeader || gameState?.gameStarted}
              type="number"
              placeholder="Enter Amount in Eth"
              value={poolAmountEntered}
              onChange={(e) => {
                const value = Number(e.target.value);
                setPoolAmountEntered(value);
                handleSettingsChange({ poolAmountToEnter: value });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GameSettings;
