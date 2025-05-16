import { RoomClient } from './RoomClient';

interface RoomPageProps {
  params: {
    id: string;
  };
  searchParams: { username?: string };
}

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  const { id } = await params;
  const { username } = searchParams;

  if (!username) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Username Required</h1>
          <p className="text-gray-400">Please enter a username to join the room</p>
        </div>
      </div>
    );
  }

  return <RoomClient roomId={id} username={username} />;
} 