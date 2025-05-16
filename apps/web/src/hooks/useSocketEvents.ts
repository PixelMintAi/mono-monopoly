import { useEffect } from 'react';
import { Socket } from 'socket.io-client';

type EventHandler = (...args: any[]) => void;
type EventMap = Record<string, EventHandler>;

export function useSocketEvents(
  socket: Socket | null,
  events: EventMap,
  dependencies: any[] = []
) {
  useEffect(() => {
    if (!socket) return;

    // Register all event handlers
    Object.entries(events).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    // Cleanup all event handlers
    return () => {
      Object.keys(events).forEach((event) => {
        socket.off(event);
      });
    };
  }, [socket, ...dependencies]);
}

// Helper function to create a safe event handler with error handling
export function createSafeEventHandler(
  socket: Socket | null,
  handler: EventHandler,
  errorMessage: string
): EventHandler {
  return (...args: any[]) => {
    try {
      handler(...args);
    } catch (error) {
      console.error(`Error in ${errorMessage}:`, error);
      socket?.emit('error', `Failed to ${errorMessage}`);
    }
  };
} 