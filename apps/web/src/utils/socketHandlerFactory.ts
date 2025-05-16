import { Socket } from 'socket.io';
import { Server as SocketIOServer } from 'socket.io';

type SocketHandler = (socket: Socket, io: SocketIOServer, data: any) => Promise<void> | void;

export function createSocketHandler(handler: SocketHandler, errorMessage: string) {
  return async (socket: Socket, io: SocketIOServer, data: any) => {
    try {
      await handler(socket, io, data);
    } catch (error) {
      console.error(`Error in ${errorMessage}:`, error);
      socket.emit('error', `Failed to ${errorMessage}`);
    }
  };
}

export function registerSocketHandlers(
  socket: Socket,
  io: SocketIOServer,
  handlers: Record<string, SocketHandler>
) {
  Object.entries(handlers).forEach(([event, handler]) => {
    socket.on(event, (data) => createSocketHandler(handler, event)(socket, io, data));
  });
} 