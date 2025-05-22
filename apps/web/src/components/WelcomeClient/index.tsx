'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navbar from '../Navbar';
import HomeDashboard from '../HomeDashboard';

export function WelcomeClient() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinRoom = () => {
    if (!username.trim() || !roomId.trim()) {
      setError('Please enter both username and room ID');
      return;
    }
    setIsLoading(true);
    const searchParams = new URLSearchParams({ username: username.trim() });
    router.push(`/room/${roomId.trim()}?${searchParams.toString()}`);
  };

  const handleCreateRoom = () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    setIsLoading(true);
    const searchParams = new URLSearchParams({ username: username.trim() });
    router.push(`/create-room?${searchParams.toString()}`);
  };

  return (
    <div>
      <Navbar/>
      <HomeDashboard/>
    </div>
  );
} 