import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from "lucide-react";
import { Lock } from "lucide-react";
import { Switch } from "../ui/switch";
import { MapPin } from "lucide-react";
import { Wallet } from "lucide-react";
import { Player } from "@/types/game";
import { Coins } from "lucide-react";
import { DollarSign } from "lucide-react";
import { Input } from "../ui/input";

const GameSettings = ({
  leader,
  players,
  setPlayers,
  playersCount,
  setplayersCount,
}: {
  leader: string;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  playersCount: string;
  setplayersCount: (value: string) => void;
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
    useState<boolean>(false);

  useEffect(() => {
    const updatePlayerMoney = () => {
      setPlayers((prevPlayers) =>
        prevPlayers.map((player) => ({
          ...player,
          money: Number(startingCash),
        }))
      );
    };
    updatePlayerMoney();
  }, [startingCash]);

  return (
    <div className="flex flex-col ml-6 mr-4 p-2 bg-fuchsia-950 rounded">
      <text className="w-full text-center">Game Settings</text>
      <div className="flex flex-col gap-4 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <div>
              <Users className="w-4 h-4" />
            </div>
            <text>Max Players</text>
          </div>
          <div>
            <Select
              value={playersCount}
              onValueChange={(value: string) => {
                setplayersCount(value);
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
              <Lock className="w-4 h-4" />
            </div>
            <text>Private Room</text>
          </div>
          <div className="flex gap-2 mr-2">
            <Switch
              color="#fff"
              checked={privateRoom}
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
              <MapPin className="w-4 h-4" />
            </div>
            <text>Map</text>
          </div>
          <div className="flex gap-2 mr-2">Classic</div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2 items-center">
            <div>
              <Wallet className="w-4 h-4" />
            </div>
            <text>Starting Cash</text>
          </div>
          <div>
            <Select
              value={startingCash}
              onValueChange={(value: string) => {
                setstartingCash(value);
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
            <Coins className="w-4 h-4" />
            Enable Crypto Pool
          </div>
          <Switch
            color="#fff"
            checked={cryptoPoolActivated}
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
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Enter Pool Amount ETH
          </div>
          <div className="flex">
            
          </div>
          <Input type="number" placeholder="Enter Amount in Eth" value={poolAmountEntered} onChange={(e)=>{
            setpoolAmountEntered(Number(e.target.value))
          }} />
        </div>
      </div>
    </div>
  );
};

export default GameSettings;
