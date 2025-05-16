'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function CreateRoomError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Something went wrong!</h1>
        <p className="text-gray-400 mb-4">{error.message}</p>
        <Button
          onClick={reset}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Try again
        </Button>
      </div>
    </div>
  );
} 