import { io, Socket } from 'socket.io-client';

const BASE_URL = process.env.BASE_URL || '';

class SocketListener {
  private socket: Socket | null = null;
  private monitoredRooms: Set<string> = new Set();

  async initialize() {
    if (this.socket) {
      console.log('✅ Socket listener already initialized');
      return;
    }

    try {
      console.log(`🔌 Connecting backend Socket.IO client to: ${BASE_URL}`);
      
      this.socket = io(BASE_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
      });

      // Connection event handlers
      this.socket.on('connect', () => {
        console.log('✅ Backend Socket.IO connected to external API');
        console.log('   Socket ID:', this.socket?.id);
      });

      this.socket.on('disconnect', () => {
        console.log('❌ Backend Socket.IO disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ Backend Socket.IO connection error:', error);
      });

      // Listen for room-ended events
      this.socket.on('room-ended', async (data: any) => {
        console.log('📧 ROOM-ENDED EVENT RECEIVED:', data);
        
        const roomId = data?.roomId || data?._id || data?.id || data;
        
        if (roomId && typeof roomId === 'string') {
          console.log(`📧 Show ended for room: ${roomId}`);
        } else {
          console.error('❌ No valid roomId in room-ended event:', data);
        }
      });

      // Debug: Log ALL incoming events
      this.socket.onAny((eventName, ...args) => {
        if (eventName === 'room-ended') {
          console.log('📨 [Backend Socket Event]:', eventName, args);
        }
      });

      console.log('✅ Backend Socket.IO listener initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize backend Socket.IO listener:', error);
    }
  }

  /**
   * Monitor a specific room for events
   * This can be called when a show starts to ensure we're listening
   */
  monitorRoom(roomId: string) {
    if (!this.socket || !this.socket.connected) {
      console.warn('⚠️ Socket not connected, cannot monitor room:', roomId);
      return;
    }

    if (this.monitoredRooms.has(roomId)) {
      console.log('ℹ️ Already monitoring room:', roomId);
      return;
    }

    console.log('👀 Starting to monitor room:', roomId);
    
    // Join the room to receive room-specific events
    this.socket.emit('join-room', {
      roomId,
      userId: 'backend-service',
      userName: 'Analytics Service'
    });
    
    this.monitoredRooms.add(roomId);
  }

  /**
   * Stop monitoring a specific room
   */
  stopMonitoringRoom(roomId: string) {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    if (!this.monitoredRooms.has(roomId)) {
      return;
    }

    console.log('🛑 Stopping monitoring of room:', roomId);
    
    this.socket.emit('leave-room', {
      roomId,
      userId: 'backend-service'
    });
    
    this.monitoredRooms.delete(roomId);
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting backend Socket.IO client...');
      this.socket.disconnect();
      this.socket = null;
      this.monitoredRooms.clear();
    }
  }
}

// Create singleton instance
export const socketListener = new SocketListener();
