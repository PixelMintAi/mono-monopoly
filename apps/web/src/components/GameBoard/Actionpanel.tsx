import { Player } from '@/types/game';
import { Space } from '@/interfaces/interface';
import React from 'react';


interface ActionPanelProps {
  currentPlayer: Player;
  properties: Space[];
  onBuyProperty: () => void;
  onPayRent: () => void;
  onUseCard: () => void;
}

const ActionPanel: React.FC<ActionPanelProps> = ({
  currentPlayer,
  properties,
  onBuyProperty,
  onPayRent,
  onUseCard
}) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">Actions</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-white">Cash:</span>
          <span className="text-green-400">${currentPlayer.money}</span>
        </div>
        
        <div className="flex flex-col space-y-2">
          <button 
            onClick={onBuyProperty} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Buy Property
          </button>
          <button 
            onClick={onPayRent} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Pay Rent
          </button>
          <button 
            onClick={onUseCard} 
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Use Card
          </button>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Your Properties:</h3>
          <div className="max-h-40 overflow-y-auto">
            {currentPlayer.properties.length > 0 ? (
              <ul className="space-y-1">
                {currentPlayer.properties.map((propertyId) => {
                  const property = properties.find(p => p.id === propertyId);
                  return property ? (
                    <li key={property.id} className="text-white text-sm">
                      {property.name} - ${property.price}
                    </li>
                  ) : null;
                })}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm">No properties owned</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionPanel;