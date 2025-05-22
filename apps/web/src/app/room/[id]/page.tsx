'use client';
import { useEffect, useState, use } from 'react';
import { RoomClient } from './RoomClient';
import Navbar from '@/components/Navbar';
import RoomDashboard from '@/components/RoomDashboard';

interface RoomPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: { username?: string };
}

export default function RoomPage({ params, searchParams }: RoomPageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const [username, setUsername] = useState<string>("");
  
  useEffect(() => {
    const initialName = localStorage?.getItem('usernickname');
    if (initialName) {
      setUsername(initialName);
    }
  }, []);

  return (
    <div>
      <Navbar/>
      <RoomDashboard roomId={id}/>
    </div>
  )

  // return <RoomClient roomId={id} username={username} />;
} 