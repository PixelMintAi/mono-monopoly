import { CreateRoomClient } from './CreateRoomClient';

interface CreateRoomPageProps {
  searchParams: { username?: string };
}

export default function CreateRoomPage({ searchParams }: CreateRoomPageProps) {
  const username = searchParams.username;

  if (!username) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Username Required</h1>
          <p className="text-gray-400">Please enter a username to create a room</p>
        </div>
      </div>
    );
  }

  return <CreateRoomClient username={username} />;
} 