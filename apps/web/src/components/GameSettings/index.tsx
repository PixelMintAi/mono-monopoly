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
import { Switch } from "../ui/switch";
import { TbBrandCashapp } from "react-icons/tb";

import { FaEthereum } from "react-icons/fa";
import { RiMoneyDollarCircleFill } from "react-icons/ri";
import { Input } from "../ui/input";
import { Player } from "@/types/game";
import type { GameSettings } from "@/types/game";

import { GameState } from "@/app/game/types";

const GameSettings = ({
  currentPlayer,
  updateSettings,
  setRoomSettings,
  roomSettings,
  gameState,
}: {
  currentPlayer: Player | null | undefined;
  updateSettings: any;
  gameState: GameState;
  setRoomSettings: any;
  roomSettings: any;
}) => {

  useEffect(()=>{
      console.log('update')
      updateSettings()
  },[roomSettings])

  return (
    <div className="flex flex-col  p-4 bg-fuchsia-950 rounded-lg">
      <text className="w-full text-center">Game Settings</text>
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <div>
              <FaPeopleGroup />
            </div>
            <text>Max Players</text>
          </div>
          <div>
            <Select
              disabled={!currentPlayer?.isLeader || gameState?.gameStarted}
              value={String(gameState.settings.maxPlayers)}
              onValueChange={(value) => {
                setRoomSettings((s: any) => ({
                  ...s,
                  maxPlayers: Number(value),
                }));
              }}
            >
              <SelectTrigger className="w-[80px] cursor-pointer">
                <SelectValue placeholder="Select Players" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {[2, 3, 4, 5, 6].map((num) => (
                    <SelectItem key={num} value={String(num)}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <div>
              <TbBrandCashapp />
            </div>
            <text>Starting Cash</text>
          </div>
          <div>
            <Select
              value={String(gameState.settings.startingAmount)}
              disabled={!currentPlayer?.isLeader || gameState?.gameStarted}
              onValueChange={(value) => {
                setRoomSettings((s: any) => ({
                  ...s,
                  startingAmount: Number(value),
                }));
              }}
            >
              <SelectTrigger className="w-[85px] cursor-pointer">
                <SelectValue placeholder="Select Starting Cash" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {[1000, 1500, 2000, 2500, 3000].map((amount) => (
                    <SelectItem key={amount} value={String(amount)}>
                      {amount}
                    </SelectItem>
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
              checked={gameState.settings.cryptoPoolActivated}
              disabled={!currentPlayer?.isLeader || gameState?.gameStarted}
              onCheckedChange={(checked) => {
                setRoomSettings((s: any) => ({
                  ...s,
                  cryptoPoolActivated: checked,
                }));
              }}
              className={
                roomSettings.cryptoPoolActivated
                  ? "bg-blue-500 data-[state=checked]:bg-blue-500 cursor-pointer"
                  : "bg-gray-300 cursor-pointer"
              }
            />
          </div>
        </div>

        {gameState.settings.cryptoPoolActivated && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <RiMoneyDollarCircleFill />
              Enter Pool Amount (ETH)
            </div>
            <Input
              disabled={!currentPlayer?.isLeader || gameState?.gameStarted}
              type="number"
              placeholder="Enter Amount in Eth"
              value={gameState.settings.poolAmountToEnter}
              onChange={(e) =>
                setRoomSettings((s: any) => ({
                  ...s,
                  poolAmountToEnter: +e.target.value,
                }))
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default GameSettings;
