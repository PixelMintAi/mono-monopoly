'use client';
import { useEffect, useState } from 'react';
import { RoomClient } from './RoomClient';
import Navbar from '@/components/Navbar';
import RoomDashboard from '@/components/RoomDashboard';

interface RoomPageProps {
  params: {
    id: string;
  };
  searchParams: { username?: string };
}

export default function RoomPage({ params, searchParams }: RoomPageProps) {
   const { id } = params;
  const [username, setusername] = useState<string>("");
  useEffect(()=>{
    const initialName=localStorage.getItem('usernickname')
    if(initialName){
        setusername(initialName)
    }
  },[])

  return (
    <div>
      <Navbar/>
      <RoomDashboard roomId={id}/>
    </div>
  )

  // return <RoomClient roomId={id} username={username} />;
} 