import React, { useState } from "react";
import { Button } from "../ui/button";
import { MdOutlineCurrencyExchange } from "react-icons/md";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Player, Space } from "@/interfaces/interface";
import { Slider } from "../ui/slider";

interface Trade {
  fromPlayerId: number;
  toPlayerId: number;
  moneyOffered: number;
  moneyRequested: number;
  propertiesOffered: Space[];
  propertiesRequested: Space[];
}

const TradeDashboard = ({
  players,
  selfUserId,
  setPlayers,
}: {
  players: Player[];
  selfUserId: string | number;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
}) => {
  const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
  const [tradeUserSelected, setTradeUserSelected] = useState<number | null>(null);
  const [selfTradeMoney, setSelfTradeMoney] = useState(0);
  const [tradeUserMoney, setTradeUserMoney] = useState(0);
  const [selfSelectedProperties, setSelfSelectedProperties] = useState<Space[]>([]);
  const [tradeUserSelectedProperties, setTradeUserSelectedProperties] = useState<Space[]>([]);

  const findPlayerById = (id: number) => players.find((player) => player.id === id);

  const handleCreateTrade = () => {
    if (tradeUserSelected !== null) {
      const newTrade: Trade = {
        fromPlayerId: Number(selfUserId),
        toPlayerId: tradeUserSelected,
        moneyOffered: selfTradeMoney,
        moneyRequested: tradeUserMoney,
        propertiesOffered: selfSelectedProperties,
        propertiesRequested: tradeUserSelectedProperties,
      };
      setActiveTrades((prev) => [...prev, newTrade]);
      resetTradeForm();
    }
  };

  const resetTradeForm = () => {
    setTradeUserSelected(null);
    setSelfTradeMoney(0);
    setTradeUserMoney(0);
    setSelfSelectedProperties([]);
    setTradeUserSelectedProperties([]);
  };

  const handleDeleteTrade = (index: number) => {
    setActiveTrades((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAcceptTrade = (trade: Trade, index: number) => {
    setPlayers((prevPlayers) => {
      const updatedPlayers = [...prevPlayers];
      const fromPlayer = updatedPlayers.find((p) => p.id === trade.fromPlayerId);
      const toPlayer = updatedPlayers.find((p) => p.id === trade.toPlayerId);
      if (!fromPlayer || !toPlayer) return prevPlayers;

      // Transfer money
      fromPlayer.money -= trade.moneyOffered;
      toPlayer.money += trade.moneyOffered;

      toPlayer.money -= trade.moneyRequested;
      fromPlayer.money += trade.moneyRequested;

      // Transfer properties
      trade.propertiesOffered.forEach((property) => {
        fromPlayer.properties = fromPlayer.properties.filter((p) => p.id !== property.id);
        toPlayer.properties.push(property);
      });

      trade.propertiesRequested.forEach((property) => {
        toPlayer.properties = toPlayer.properties.filter((p) => p.id !== property.id);
        fromPlayer.properties.push(property);
      });

      return updatedPlayers;
    });

    // Remove the trade after acceptance
    setActiveTrades((prev) => prev.filter((_, idx) => idx !== index));
  };

  const togglePropertySelection = (
    property: Space,
    selectedProperties: Space[],
    setSelectedProperties: React.Dispatch<React.SetStateAction<Space[]>>
  ) => {
    if (selectedProperties.find((p) => p.id === property.id)) {
      setSelectedProperties(selectedProperties.filter((p) => p.id !== property.id));
    } else {
      setSelectedProperties([...selectedProperties, property]);
    }
  };

  return (
    <div className="flex flex-col ml-6 mr-4 p-2 mb-4 bg-fuchsia-950 rounded">
      <div className="w-full text-center font-bold text-lg">Trades</div>
      <div className="flex justify-between items-center mt-2">
        <div className="flex gap-2 items-center">
          <MdOutlineCurrencyExchange />
          Create A Trade With Another Player
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-[120px] cursor-pointer">
              Create Trade
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create a trade</AlertDialogTitle>
              {!tradeUserSelected ? (
                <div className="flex flex-col gap-4 mt-4">
                  {players.filter((player) => player.id != selfUserId).map((player, idx) => (
                    <div
                      key={idx}
                      className="border w-fit p-2 rounded cursor-pointer hover:bg-fuchsia-900"
                      onClick={() => setTradeUserSelected(player.id)}
                    >
                      {player.name}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-between mt-4 gap-8">
                  {/* Self User */}
                  <div className="flex flex-col gap-4 items-center">
                    <div className="flex gap-2 items-center">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: findPlayerById(Number(selfUserId))?.color }}></div>
                      {findPlayerById(Number(selfUserId))?.name}
                    </div>
                    <div className="w-40">
                      <Slider
                        value={[selfTradeMoney]}
                        min={0}
                        max={findPlayerById(Number(selfUserId))?.money || 1500}
                        step={1}
                        onValueChange={(value) => setSelfTradeMoney(value[0])}
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span>0</span>
                        <span>{findPlayerById(Number(selfUserId))?.money}</span>
                      </div>
                      <input
                        type="number"
                        value={selfTradeMoney > 0 ? selfTradeMoney : ""}
                        min={0}
                        max={findPlayerById(Number(selfUserId))?.money || 1500}
                        onChange={(e) => setSelfTradeMoney(Number(e.target.value))}
                        className="mt-2 w-full text-center border rounded p-1 bg-transparent"
                        placeholder="Enter Amount"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      {findPlayerById(Number(selfUserId))?.properties.map((property) => (
                        <div
                          key={property.id}
                          className={`border p-2 rounded w-[150px] cursor-pointer ${
                            selfSelectedProperties.find((p) => p.id === property.id) ? "bg-fuchsia-700" : ""
                          }`}
                          onClick={() => togglePropertySelection(property, selfSelectedProperties, setSelfSelectedProperties)}
                        >
                          {property.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trade User */}
                  <div className="flex flex-col gap-4 items-center">
                    <div className="flex gap-2 items-center">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: findPlayerById(tradeUserSelected)?.color }}></div>
                      {findPlayerById(tradeUserSelected)?.name}
                    </div>
                    <div className="w-40">
                      <Slider
                        value={[tradeUserMoney]}
                        min={0}
                        max={findPlayerById(tradeUserSelected)?.money || 1500}
                        step={1}
                        onValueChange={(value) => setTradeUserMoney(value[0])}
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span>0</span>
                        <span>{findPlayerById(tradeUserSelected)?.money}</span>
                      </div>
                      <input
                        type="number"
                        value={tradeUserMoney > 0 ? tradeUserMoney : ""}
                        min={0}
                        max={findPlayerById(tradeUserSelected)?.money || 1500}
                        onChange={(e) => setTradeUserMoney(Number(e.target.value))}
                        className="mt-2 w-full text-center border rounded p-1 bg-transparent"
                        placeholder="Enter Amount"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      {findPlayerById(tradeUserSelected)?.properties.map((property) => (
                        <div
                          key={property.id}
                          className={`border p-2 rounded w-[150px] cursor-pointer ${
                            tradeUserSelectedProperties.find((p) => p.id === property.id) ? "bg-fuchsia-700" : ""
                          }`}
                          onClick={() => togglePropertySelection(property, tradeUserSelectedProperties, setTradeUserSelectedProperties)}
                        >
                          {property.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel onClick={resetTradeForm}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCreateTrade}>Create</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Active Trades */}
      <div className="flex flex-col mt-6">
        <div className="w-full text-center font-bold mb-2">Active Trades</div>
        {activeTrades.length === 0 && (
          <div className="text-center text-sm text-gray-400">No active trades</div>
        )}
        {activeTrades.map((trade, indexTrade) => (
          <div key={indexTrade} className="flex flex-col border p-2 rounded mb-2">
            <div className="text-sm">
              {findPlayerById(trade.fromPlayerId)?.name} offers {trade.moneyOffered}$ + {trade.propertiesOffered.length} properties
              to {findPlayerById(trade.toPlayerId)?.name} for {trade.moneyRequested}$ + {trade.propertiesRequested.length} properties
            </div>
            {(trade.fromPlayerId === Number(selfUserId) || trade.toPlayerId === Number(selfUserId)) && (
              <div className="flex gap-4 mt-2">
                <Button onClick={() => handleAcceptTrade(trade, indexTrade)} className="bg-green-600">
                  Accept
                </Button>
                <Button onClick={() => handleDeleteTrade(indexTrade)} className="bg-red-600">
                  Delete
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TradeDashboard;
