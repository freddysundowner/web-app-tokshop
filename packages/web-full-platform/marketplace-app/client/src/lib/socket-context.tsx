import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';
import { useSettings } from './settings-context';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const currentRoomIdRef = useRef<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Fetch external API URL from backend config, then connect to Socket.IO
    const initializeSocket = async () => {
      try {
        // Get the external API URL from backend configuration
        const response = await fetch('/api/config');
        const config = await response.json();
        
        if (!config.success || !config.data?.externalApiUrl) {
          throw new Error('Failed to fetch external API URL from config');
        }
        
        const EXTERNAL_API_URL = config.data.externalApiUrl;
        console.log('🔌 Connecting to Socket.IO server at external API:', EXTERNAL_API_URL);
        
        const socketInstance = io(EXTERNAL_API_URL, {
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5
        });

        socketInstance.on('connect', () => {
          console.log('✅ Socket.IO connected to external API:', EXTERNAL_API_URL);
          console.log('Socket ID:', socketInstance.id);
          setIsConnected(true);
          
          // Automatically rejoin the room if we were in one before disconnect
          if (currentRoomIdRef.current) {
            console.log('🔄 Reconnected! Auto-rejoining room:', currentRoomIdRef.current);
            const socketId = socketInstance.id || `temp_${Math.random().toString(36).substr(2, 9)}`;
            const userId = user ? ((user as any)._id || (user as any).id || user.id) : `guest_${socketId}`;
            const userName = user ? ((user as any).userName || user.firstName || user.email) : `Guest_${socketId.slice(0, 6)}`;
            
            socketInstance.emit('join-room', {
              roomId: currentRoomIdRef.current,
              userId,
              userName
            });
          }
        });

        socketInstance.on('disconnect', () => {
          console.log('Socket.IO disconnected');
          setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error);
        });

        setSocket(socketInstance);
      } catch (error) {
        console.error('Failed to initialize Socket.IO:', error);
      }
    };

    initializeSocket();

    return () => {
      // Cleanup socket connection on unmount
      if (socket) {
        console.log('🔌 Disconnecting socket on unmount');
        socket.disconnect();
      }
    };
  }, []);

  const joinRoom = (roomId: string) => {
    if (!socket) {
      console.warn('⚠️ Cannot join room: socket not connected');
      return;
    }
    
    // Store the room ID for auto-rejoin on reconnect
    currentRoomIdRef.current = roomId;
    
    // Allow guest viewers by generating temporary ID
    const socketId = socket.id || `temp_${Math.random().toString(36).substr(2, 9)}`;
    const userId = user ? ((user as any)._id || (user as any).id || user.id) : `guest_${socketId}`;
    const userName = user ? ((user as any).userName || user.firstName || user.email) : `Guest_${socketId.slice(0, 6)}`;
    
    console.log('📤 Emitting join-room event:', { roomId, userId, userName });
    socket.emit('join-room', {
      roomId,
      userId,
      userName
    });
  };

  const leaveRoom = (roomId: string) => {
    if (!socket) {
      console.warn('⚠️ Cannot leave room: socket not connected');
      return;
    }
    
    // Clear the current room ID
    currentRoomIdRef.current = null;
    
    // Allow guest viewers by generating temporary ID
    const socketId = socket.id || `temp_${Math.random().toString(36).substr(2, 9)}`;
    const userId = user ? ((user as any)._id || (user as any).id || user.id) : `guest_${socketId}`;
    const userName = user ? ((user as any).userName || user.firstName || user.email) : `Guest_${socketId.slice(0, 6)}`;
    
    console.log('📤 Emitting leave-room event:', { roomId, userId, userName });
    socket.emit('leave-room', {
      roomId,
      userId,
      userName
    });
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinRoom, leaveRoom }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
