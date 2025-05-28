import React, { useState, useEffect } from "react";
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

import { Slider } from "../ui/slider";
import { Player } from "@monopoly/shared";

interface Trade {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  moneyOffered: number;
  moneyRequested: number;
  propertiesOffered: string[];
  propertiesRequested: string[];
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

const TradeDashboard = ({
  players,
  selfUserId,
  socket,
  roomId
}: {
  players: Player[];
  selfUserId: string;
  socket: any; // Add socket prop
  roomId: string; // Add roomId prop
}) => {
  const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
  const [tradeUserSelected, setTradeUserSelected] = useState<string | null>(null);
  const [selfTradeMoney, setSelfTradeMoney] = useState(0);
  const [tradeUserMoney, setTradeUserMoney] = useState(0);
  const [selfSelectedProperties, setSelfSelectedProperties] = useState<string[]>([]);
  const [tradeUserSelectedProperties, setTradeUserSelectedProperties] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const findPlayerById = (id: string) => players.find((player) => player.id === id);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Request trades when component mounts
    socket.emit("requestTrades", { roomId });

    // Listen for trade updates
    socket.on("tradesUpdated", ({ trades }: { trades: Trade[] }) => {
      setActiveTrades(trades);
    });

    socket.on("tradeCreated", ({ trade, fromPlayerName, toPlayerName }: {
      trade: Trade;
      fromPlayerName: string;
      toPlayerName: string;
    }) => {
      console.log(`New trade created: ${fromPlayerName} -> ${toPlayerName}`);
    });

    socket.on("tradeAccepted", ({ tradeId, fromPlayerName, toPlayerName, message }: {
      tradeId: string;
      fromPlayerName: string;
      toPlayerName: string;
      message: string;
    }) => {
      console.log(message);
      // Show success notification if needed
    });

    socket.on("tradeRejected", ({ tradeId, fromPlayerName, toPlayerName, message }: {
      tradeId: string;
      fromPlayerName: string;
      toPlayerName: string;
      message: string;
    }) => {
      console.log(message);
      // Show notification if needed
    });

    // Cleanup listeners
    return () => {
      socket.off("tradesUpdated");
      socket.off("tradeCreated");
      socket.off("tradeAccepted");
      socket.off("tradeRejected");
    };
  }, [socket, roomId]);

  const handleCreateTrade = () => {
    if (tradeUserSelected && socket) {
      // Emit trade creation to server
      socket.emit("createTrade", {
        roomId,
        toPlayerId: tradeUserSelected,
        moneyOffered: selfTradeMoney,
        moneyRequested: tradeUserMoney,
        propertiesOffered: selfSelectedProperties,
        propertiesRequested: tradeUserSelectedProperties,
      });

      resetTradeForm();
      setIsDialogOpen(false);
    }
  };

  const resetTradeForm = () => {
    setTradeUserSelected(null);
    setSelfTradeMoney(0);
    setTradeUserMoney(0);
    setSelfSelectedProperties([]);
    setTradeUserSelectedProperties([]);
  };

  const handleAcceptTrade = (tradeId: string) => {
    if (socket) {
      socket.emit("acceptTrade", { roomId, tradeId });
    }
  };

  const handleRejectTrade = (tradeId: string) => {
    if (socket) {
      socket.emit("rejectTrade", { roomId, tradeId });
    }
  };

  const togglePropertySelection = (
    propertyId: string,
    selectedProperties: string[],
    setSelectedProperties: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (selectedProperties.includes(propertyId)) {
      setSelectedProperties(selectedProperties.filter((id) => id !== propertyId));
    } else {
      setSelectedProperties([...selectedProperties, propertyId]);
    }
  };

  const getPropertyById = (propertyId: string, playerId: string) => {
    const player = findPlayerById(playerId);
    return player?.properties.find((p: { id: string; }) => p.id === propertyId);
  };

  const formatTradeDescription = (trade: Trade) => {
    const fromPlayer = findPlayerById(trade.fromPlayerId);
    const toPlayer = findPlayerById(trade.toPlayerId);
    
    const offeredProps = trade.propertiesOffered.map(id => 
      getPropertyById(id, trade.fromPlayerId)?.name || 'Unknown Property'
    );
    const requestedProps = trade.propertiesRequested.map(id => 
      getPropertyById(id, trade.toPlayerId)?.name || 'Unknown Property'
    );

    return {
      fromPlayerName: fromPlayer?.name || 'Unknown',
      toPlayerName: toPlayer?.name || 'Unknown',
      offering: `$${trade.moneyOffered}${offeredProps.length > 0 ? ` + ${offeredProps.join(', ')}` : ''}`,
      requesting: `$${trade.moneyRequested}${requestedProps.length > 0 ? ` + ${requestedProps.join(', ')}` : ''}`
    };
  };

  const currentPlayerProperties = findPlayerById(selfUserId)?.properties || [];
  const selectedTradeUserProperties = tradeUserSelected ? findPlayerById(tradeUserSelected)?.properties || [] : [];

  return (
    <div className="flex flex-col ml-6 mr-4 p-2 mb-4 bg-fuchsia-950 rounded">
      <div className="w-full text-center font-bold text-lg">Trades</div>
      <div className="flex justify-between items-center mt-2">
        <div className="flex gap-2 items-center">
          <MdOutlineCurrencyExchange />
          Create A Trade With Another Player
        </div>
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-[120px] cursor-pointer">
              Create Trade
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>Create a trade</AlertDialogTitle>
              {!tradeUserSelected ? (
                <div className="flex flex-col gap-4 mt-4">
                  <AlertDialogDescription>
                    Select a player to trade with:
                  </AlertDialogDescription>
                  {players.filter((player) => player.id !== selfUserId).map((player, idx) => (
                    <div
                      key={idx}
                      className="border w-fit p-3 rounded cursor-pointer hover:bg-fuchsia-900 flex items-center gap-2"
                      onClick={() => setTradeUserSelected(player.id)}
                    >
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: player.color }}></div>
                      <span>{player.name}</span>
                      <span className="text-sm text-gray-400">(${player.money})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-between mt-4 gap-8">
                  {/* Self User */}
                  <div className="flex flex-col gap-4 items-center flex-1">
                    <div className="flex gap-2 items-center font-semibold">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: findPlayerById(selfUserId)?.color }}></div>
                      {findPlayerById(selfUserId)?.name} (You)
                    </div>
                    
                    {/* Money Slider */}
                    <div className="w-full max-w-xs">
                      <label className="text-sm font-medium">Money to Offer:</label>
                      <Slider
                        value={[selfTradeMoney]}
                        min={0}
                        max={findPlayerById(selfUserId)?.money || 1500}
                        step={10}
                        onValueChange={(value) => setSelfTradeMoney(value[0])}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span>$0</span>
                        <span>${findPlayerById(selfUserId)?.money}</span>
                      </div>
                      <input
                        type="number"
                        value={selfTradeMoney > 0 ? selfTradeMoney : ""}
                        min={0}
                        max={findPlayerById(selfUserId)?.money || 1500}
                        onChange={(e) => setSelfTradeMoney(Number(e.target.value) || 0)}
                        className="mt-2 w-full text-center border rounded p-2 bg-transparent"
                        placeholder="Enter Amount"
                      />
                    </div>

                    {/* Properties */}
                    <div className="w-full">
                      <label className="text-sm font-medium">Properties to Offer:</label>
                      <div className="flex flex-col gap-2 mt-2 max-h-48 overflow-y-auto">
                        {currentPlayerProperties.length === 0 ? (
                          <div className="text-sm text-gray-400 text-center p-4">No properties owned</div>
                        ) : (
                          currentPlayerProperties.map((property: any) => (
                            <div
                              key={property.id}
                              className={`border p-2 rounded cursor-pointer text-sm ${
                                selfSelectedProperties.includes(property.id) ? "bg-fuchsia-700" : "hover:bg-fuchsia-800"
                              }`}
                              onClick={() => togglePropertySelection(property.id, selfSelectedProperties, setSelfSelectedProperties)}
                            >
                              {property.name} ${property.price}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Trade Arrow */}
                  <div className="flex items-center justify-center">
                    <div className="text-2xl">⇄</div>
                  </div>

                  {/* Trade User */}
                  <div className="flex flex-col gap-4 items-center flex-1">
                    <div className="flex gap-2 items-center font-semibold">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: findPlayerById(tradeUserSelected)?.color }}></div>
                      {findPlayerById(tradeUserSelected)?.name}
                    </div>
                    
                    {/* Money Slider */}
                    <div className="w-full max-w-xs">
                      <label className="text-sm font-medium">Money to Request:</label>
                      <Slider
                        value={[tradeUserMoney]}
                        min={0}
                        max={findPlayerById(tradeUserSelected)?.money || 1500}
                        step={10}
                        onValueChange={(value) => setTradeUserMoney(value[0])}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span>$0</span>
                        <span>${findPlayerById(tradeUserSelected)?.money}</span>
                      </div>
                      <input
                        type="number"
                        value={tradeUserMoney > 0 ? tradeUserMoney : ""}
                        min={0}
                        max={findPlayerById(tradeUserSelected)?.money || 1500}
                        onChange={(e) => setTradeUserMoney(Number(e.target.value) || 0)}
                        className="mt-2 w-full text-center border rounded p-2 bg-transparent"
                        placeholder="Enter Amount"
                      />
                    </div>

                    {/* Properties */}
                    <div className="w-full">
                      <label className="text-sm font-medium">Properties to Request:</label>
                      <div className="flex flex-col gap-2 mt-2 max-h-48 overflow-y-auto">
                        {selectedTradeUserProperties.length === 0 ? (
                          <div className="text-sm text-gray-400 text-center p-4">No properties owned</div>
                        ) : (
                          selectedTradeUserProperties.map((property: any) => (
                            <div
                              key={property.id}
                              className={`border p-2 rounded cursor-pointer text-sm ${
                                tradeUserSelectedProperties.includes(property.id) ? "bg-fuchsia-700" : "hover:bg-fuchsia-800"
                              }`}
                              onClick={() => togglePropertySelection(property.id, tradeUserSelectedProperties, setTradeUserSelectedProperties)}
                            >
                              {property.name} ${property.price}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogCancel onClick={() => { resetTradeForm(); setIsDialogOpen(false); }}>
                Cancel
              </AlertDialogCancel>
              {tradeUserSelected && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => setTradeUserSelected(null)}
                  >
                    Back
                  </Button>
                  <AlertDialogAction 
                    onClick={handleCreateTrade}
                    disabled={selfTradeMoney === 0 && tradeUserMoney === 0 && selfSelectedProperties.length === 0 && tradeUserSelectedProperties.length === 0}
                  >
                    Create Trade
                  </AlertDialogAction>
                </>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Active Trades */}
      <div className="flex flex-col mt-6">
        <div className="w-full text-center font-bold mb-2">Active Trades</div>
        {activeTrades.length === 0 && (
          <div className="text-center text-sm text-gray-400 p-4">No active trades</div>
        )}
        {activeTrades.map((trade) => {
          const tradeInfo = formatTradeDescription(trade);
          const isParticipant = trade.fromPlayerId === selfUserId || trade.toPlayerId === selfUserId;
          const canAccept = trade.toPlayerId === selfUserId;
          const canReject = isParticipant;

          return (
            <div key={trade.id} className="border border-gray-600 p-4 rounded-lg mb-3 bg-fuchsia-900/30">
              <div className="text-sm mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: findPlayerById(trade.fromPlayerId)?.color }}></div>
                  <strong>{tradeInfo.fromPlayerName}</strong>
                  <span>offers</span>
                  <span className="font-semibold text-green-400">{tradeInfo.offering}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: findPlayerById(trade.toPlayerId)?.color }}></div>
                  <strong>{tradeInfo.toPlayerName}</strong>
                  <span>requests</span>
                  <span className="font-semibold text-blue-400">{tradeInfo.requesting}</span>
                </div>
              </div>
              
              {isParticipant && (
                <div className="flex gap-2 mt-3">
                  {canAccept && (
                    <Button 
                      onClick={() => handleAcceptTrade(trade.id)} 
                      className="bg-green-600 hover:bg-green-700 text-sm px-3 py-1"
                    >
                      Accept
                    </Button>
                  )}
                  {canReject && (
                    <Button 
                      onClick={() => handleRejectTrade(trade.id)} 
                      className="bg-red-600 hover:bg-red-700 text-sm px-3 py-1"
                    >
                      {trade.fromPlayerId === selfUserId ? "Cancel" : "Reject"}
                    </Button>
                  )}
                </div>
              )}
              
              {!isParticipant && (
                <div className="text-xs text-gray-400 mt-2">
                  Trade between other players
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TradeDashboard;