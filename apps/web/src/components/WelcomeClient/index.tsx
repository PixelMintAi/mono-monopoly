'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Welcome to Monopoly</CardTitle>
          <CardDescription className="text-center">
            Join an existing game or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="join" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="join" className="flex items-center gap-2">
                Join Room
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                Create Room
              </TabsTrigger>
            </TabsList>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}

            <TabsContent value="join" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                />
                <Input
                  type="text"
                  placeholder="Enter room ID"
                  value={roomId}
                  onChange={(e) => {
                    setRoomId(e.target.value);
                    setError(null);
                  }}
                />
              </div>
              <Button
                onClick={handleJoinRoom}
                disabled={!username.trim() || !roomId.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? 'Joining...' : 'Join Room'}
              </Button>
            </TabsContent>

            <TabsContent value="create" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                />
              </div>
              <Button
                onClick={handleCreateRoom}
                disabled={!username.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? 'Creating...' : 'Create New Room'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 