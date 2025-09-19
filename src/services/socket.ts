// Socket.IO service for real-time communication
import io from 'socket.io-client';
import { SocketEvents, SocketEmits } from '../types/presence';
import { ChatSocketEvents, ChatSocketEmits } from '../types/chat';
import { MeetingChatSocketEvents, MeetingChatSocketEmits } from '../types/meeting';

class SocketService {
  private socket: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  /**
   * Initialize socket connection with authentication
   */
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Connect to the backend socket server
        this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001', {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling']
        });

        // Connection successful
        this.socket.on('connect', () => {
          console.log('Connected to socket server');
          this.reconnectAttempts = 0;
          resolve();
        });

        // Connection error
        this.socket.on('connect_error', (error: Error) => {
          console.error('Socket connection error:', error);
          reject(error);
        });

        // Handle disconnection
        this.socket.on('disconnect', (reason: string) => {
          console.log('Socket disconnected:', reason);
          this.handleReconnect();
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle reconnection logic with exponential backoff
   */
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Disconnect from socket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Emit events to server
   */
  emit<K extends keyof (SocketEmits & ChatSocketEmits & MeetingChatSocketEmits)>(event: K, data: Parameters<(SocketEmits & ChatSocketEmits & MeetingChatSocketEmits)[K]>[0]) {
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected. Cannot emit event:', event);
    }
  }

  /**
   * Listen to server events
   */
  on<K extends keyof (SocketEvents & ChatSocketEvents & MeetingChatSocketEvents)>(event: K, callback: (SocketEvents & ChatSocketEvents & MeetingChatSocketEvents)[K]) {
    if (this.socket) {
      this.socket.on(event, callback);
    } else {
      console.warn('Socket not connected. Cannot listen to event:', event);
    }
  }

  /**
   * Remove event listener
   */
  off<K extends keyof (SocketEvents & ChatSocketEvents & MeetingChatSocketEvents)>(event: K, callback?: (SocketEvents & ChatSocketEvents & MeetingChatSocketEvents)[K]) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket instance (for advanced usage)
   */
  getSocket(): any {
    return this.socket;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
