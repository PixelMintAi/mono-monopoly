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

const HomeDashboard = () => {
  const router = useRouter();
  const [allRoomsSelected, setallRoomsSelected] = useState<boolean>(false);
  const [username, setusername] = useState<string>("");
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
          }}
        />
      </div>
      <div className="flex gap-2">
        <Button className="cursor-pointer" onClick={()=>{
            setallRoomsSelected(true)
        }}>
          <IoIosPeople />
          All Rooms
        </Button>
        <Button
          className="cursor-pointer"
          onClick={() => {
            router.push(`room/${generateRandomCombo()}`);
          }}
        >
          <IoGameControllerOutline />
          Create A Room
        </Button>
      </div>
    </div>
  );
};

export default HomeDashboard;
