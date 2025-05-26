import React, { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { IoIosPeople } from "react-icons/io";
import { useRouter } from "next/navigation";
import { generateRandomCombo } from "@/functions/randomLetter";
import { IoGameControllerOutline } from "react-icons/io5";
import { IoMdArrowRoundBack } from "react-icons/io";
import { IoReloadSharp } from "react-icons/io5";
import { FaPlus } from "react-icons/fa6";
import { room } from "@/interfaces/interface";
import { useGameStore } from "@/store/gameStore";
import { useGameSync } from "@/hooks/useGameSync";
import { getOrCreatePlayerUUID } from "@/utils/initPlayerId";

const HomeDashboard = () => {
  const router = useRouter();
  const [allRoomsSelected, setallRoomsSelected] = useState<boolean>(false);
  const [username, setusername] = useState<string>("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allRooms, setallRooms] = useState<room[]>([
    {
        roomId:'1',
        map:'Classic',
        players:4,
        startingAmount:3,
        activePlayers:3
    },
    {
        roomId:'1',
        map:'Classic',
        players:4,
        startingAmount:3,
        activePlayers:3
    },
    {
        roomId:'1',
        map:'Classic',
        players:4,
        startingAmount:3,
        activePlayers:3
    },
    {
        roomId:'1',
        map:'Classic',
        players:4,
        startingAmount:3,
        activePlayers:3
    },
    {
        roomId:'1',
        map:'Classic',
        players:4,
        startingAmount:3,
        activePlayers:3
    }
  ])
  const [localRoomId, setLocalRoomId] = useState<string>('');
  const { socket, createRoom } = useGameStore();

  const initializeRoom = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    try {
      setIsCreatingRoom(true);
      setError(null);
      
      const playerUUID = getOrCreatePlayerUUID();
      if (playerUUID) {
        localStorage.setItem('playerUUID', playerUUID);
      }

      const settings = {
        map: 'Classic' as const,
        maxPlayers: 4,
        startingAmount: 1500,
        cryptoPoolActivated: false,
        poolAmountToEnter: 0.001
      };

      // Wait for room creation to complete
      const roomId = await createRoom(settings, username, playerUUID);
      
      // Only navigate after successful room creation
      if (roomId) {
        router.push(`/room/${roomId}`);
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      setError(error instanceof Error ? error.message : 'Failed to create room');
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const { isConnected, error: gameSyncError, gameState } = useGameSync(localRoomId);

  useEffect(()=>{
    if(username!==""){
        localStorage.setItem('usernickname',username)
    }
  },[username])

  useEffect(()=>{
    const initialName=localStorage.getItem('usernickname')
    if(initialName){
        setusername(initialName)
    }
  },[])

  return allRoomsSelected ? (
    <div className="flex flex-col gap-8 justify-center items-center min-h-[100vh]">
        <div className="flex flex-col gap-8 rounded bg-gray-800 p-4 w-[25rem]">
            <text>
                All Rooms
            </text>
            <div className="flex items-center justify-between">
                <div className="flex gap-1 cursor-pointer bg-amber-800 p-2 rounded items-center" onClick={()=>{
                    setallRoomsSelected(false)
                }}>
                <IoMdArrowRoundBack />
                    Back
                </div>
                <div className="flex gap-4">
                    <div className="bg-amber-800 p-2 rounded flex gap-2 items-center cursor-pointer">
                        <IoReloadSharp />
                        Refresh
                    </div>
                    <div className="flex gap-1 bg-amber-800 p-2 rounded items-center cursor-pointer" onClick={()=>{
                         router.push(`room/${generateRandomCombo()}`);
                    }}>
                    <FaPlus />
                        New Room
                    </div>
                </div>

            </div>
            <div className="flex flex-col max-h-[20rem] overflow-auto custom-scrollbar pl-2 pr-2">
                <div className="w-full text-center">
                    Select the room you want to join:
                </div>
                {allRooms.map((room:room,index:number)=>(
                    <div key={index} className="flex flex-col bg-indigo-600 p-2 rounded mt-3 cursor-pointer" onClick={()=>{
                        router.push(`room/${room.roomId as string}`)
                    }}>
                        <div className="flex w-full justify-between">
                            <div className="flex flex-col">
                                <text>
                                    {room.roomId}
                                </text>
                                <div className="flex">
                                    {room.players}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                Classic
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  ) : (
    <div className="flex flex-col gap-8 justify-center items-center min-h-[100vh]">
      <div className="flex flex-col">
        <Input
          type="text"
          placeholder="username"
          width={50}
          value={username}
          onChange={(e) => {
            setusername(e.target.value);
            setError(null);
          }}
        />
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button 
          className="cursor-pointer" 
          onClick={() => setallRoomsSelected(true)}
        >
          <IoIosPeople />
          All Rooms
        </Button>
        <Button
          className="cursor-pointer"
          onClick={initializeRoom}
          disabled={isCreatingRoom || !username.trim()}
        >
          {isCreatingRoom ? (
            <>
              <IoReloadSharp className="animate-spin mr-2" />
              Creating Room...
            </>
          ) : (
            <>
              <IoGameControllerOutline />
              Create A Room
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default HomeDashboard;
