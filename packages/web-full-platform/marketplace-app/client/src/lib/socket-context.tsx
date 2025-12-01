import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';
import { useSettings } from './settings-context';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const currentRoomIdRef = useRef<string | null>(null);
  const isManualConnectRef = useRef<boolean>(false);
  const { user } = useAuth();
  const userRef = useRef<any>(null);
  
  // Keep userRef fresh - updates whenever user changes
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  
  // Helper function to get current user identity (always uses fresh data from ref)
  const getUserIdentity = (socketId: string) => {
    const currentUser = userRef.current;
    const userId = currentUser 
      ? ((currentUser as any)._id || (currentUser as any).id || currentUser.id) 
      : `guest_${socketId}`;
    const userName = currentUser 
      ? ((currentUser as any).userName || currentUser.firstName || currentUser.email) 
      : `Guest_${socketId.slice(0, 6)}`;
    return { userId, userName };
  };

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
          autoConnect: false, // Don't connect automatically - only connect when needed
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: Infinity  // ✅ Never give up - keep trying
        });

        // Debug: Log ALL incoming socket events to discover what the server actually emits
        socketInstance.onAny((eventName, ...args) => {
          console.log('📨 [Socket Event Received]:', eventName, args);
        });

        socketInstance.on('connect', () => {
          console.log('✅ Socket.IO connected to external API:', EXTERNAL_API_URL);
          console.log('Socket ID:', socketInstance.id);
          setIsConnected(true);
          
          // Automatically rejoin the room if we were in one before disconnect
          // BUT skip if this is a manual connection (joinRoom will handle the emit)
          if (currentRoomIdRef.current && !isManualConnectRef.current) {
            console.log('🔄 Reconnected! Auto-rejoining room:', currentRoomIdRef.current);
            const socketId = socketInstance.id || `temp_${Math.random().toString(36).substr(2, 9)}`;
            const { userId, userName } = getUserIdentity(socketId);
            
            console.log('🔑 Auto-rejoin with user:', { userId, userName });
            socketInstance.emit('join-room', {
              roomId: currentRoomIdRef.current,
              userId,
              userName
            });
          }
          
          // Reset manual connect flag after handling
          isManualConnectRef.current = false;
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

  const connect = () => {
    if (!socket) {
      console.warn('⚠️ Cannot connect: socket not initialized');
      return;
    }
    
    if (!socket.connected) {
      console.log('🔌 Manually connecting socket...');
      socket.connect();
    } else {
      console.log('✅ Socket already connected');
    }
  };

  const disconnect = () => {
    if (!socket) {
      console.warn('⚠️ Cannot disconnect: socket not initialized');
      return;
    }
    
    if (socket.connected) {
      console.log('🔌 Manually disconnecting socket...');
      socket.disconnect();
    }
  };

  const joinRoom = (roomId: string) => {
    if (!socket) {
      console.warn('⚠️ Cannot join room: socket not initialized');
      return;
    }
    
    if (!socket.connected) {
      console.warn('⚠️ Cannot join room: socket not connected yet');
      return;
    }
    
    // Store the room ID for auto-rejoin on reconnect
    currentRoomIdRef.current = roomId;
    
    // Get current user identity using fresh data
    const socketId = socket.id || `temp_${Math.random().toString(36).substr(2, 9)}`;
    const { userId, userName } = getUserIdentity(socketId);
    
    console.log('📤 Emitting join-room event:', { roomId, userId, userName });
    socket.emit('join-room', {
      roomId,
      userId,
      userName
    });
  };

  const leaveRoom = (roomId: string) => {
    if (!socket) {
      console.warn('⚠️ Cannot leave room: socket not initialized');
      return;
    }
    
    // DON'T clear currentRoomIdRef here! 
    // We need it for auto-rejoin after reconnection
    // Only clear it when joining a different room
    
    // Get current user identity using fresh data
    const socketId = socket.id || `temp_${Math.random().toString(36).substr(2, 9)}`;
    const { userId, userName } = getUserIdentity(socketId);
    
    console.log('📤 Emitting leave-room event:', { roomId, userId, userName });
    socket.emit('leave-room', {
      roomId,
      userId,
      userName
    });
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, connect, disconnect, joinRoom, leaveRoom }}>
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
