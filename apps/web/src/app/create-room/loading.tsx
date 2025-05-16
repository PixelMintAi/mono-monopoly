export default function CreateRoomLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Loading...</h1>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-48 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-32 mx-auto"></div>
        </div>
      </div>
    </div>
  );
} 