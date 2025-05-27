
import { Space } from '@/app/game/types';
import React from 'react';



interface BoardSpaceProps {
  space: Space;
}

const BoardSpace: React.FC<BoardSpaceProps> = ({ space }) => {
  // Map countries to their flag emoji codes
  const countryFlags: Record<string, string> = {
    'usa': '🇺🇸',
    'uk': '🇬🇧',
    'france': '🇫🇷',
    'germany': '🇩🇪',
    'china': '🇨🇳',
    'israel': '🇮🇱',
    'brazil': '🇧🇷',
    'hungary': '🇭🇺',
  };

  // Render different space types
  const renderSpaceContent = () => {
    switch (space.type) {
      case 'city':
        return (
          <div className="flex flex-col items-center cursor-pointer">
            <div className="text-sm font-bold">{space.name}</div>
            {/* {space.country && (
              <div className="text-xl">{countryFlags[space.country]}</div>
            )} */}
            <div className="text-xs mt-1">${space.price}</div>
          </div>
        );
      case 'airport':
        return (
          <div className="flex flex-col items-center cursor-pointer">
            <div className="text-sm font-bold">{space.name}</div>
            <div className="text-xl">✈️</div>
            <div className="text-xs mt-1">${space.price}</div>
          </div>
        );
      case 'surprise':
        return (
          <div className="flex flex-col items-center">
            <div className="text-sm font-bold">Surprise</div>
            <div className="text-xl">❓</div>
          </div>
        );
      case 'treasure':
        return (
          <div className="flex flex-col items-center">
            <div className="text-sm font-bold">Treasure</div>
            <div className="text-xl">🎁</div>
          </div>
        );
      case 'tax':
        return (
          <div className="flex flex-col items-center">
            <div className="text-sm font-bold">{space.name}</div>
            <div className="text-xl">💰</div>
            <div className="text-xs mt-1">Pay ${space.price}</div>
          </div>
        );
      case 'utility':
        return (
          <div className="flex flex-col items-center cursor-pointer">
            <div className="text-sm font-bold">{space.name}</div>
            <div className="text-xl">{space.name.includes('Water') ? '💧' : '⚡'}</div>
            <div className="text-xs mt-1">${space.price}</div>
          </div>
        );
      case 'special':
        return (
          <div className="flex flex-col items-center">
            <div className="text-sm font-bold">{space.name}</div>
            {space.name === 'START' && <div className="text-xl">▶️</div>}
            {space.name === 'In Prison' && <div className="text-xl">🔒</div>}
            {space.name === 'Go to Prison' && <div className="text-xl">⚓</div>}
            {space.name === 'Vacation' && <div className="flex text-sm">🏝️ ${space.price}</div>}
          </div>
        );
      default:
        return <div>{space.name}</div>;
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-1 text-white">
      {renderSpaceContent()}
    </div>
  );
};

export default BoardSpace;