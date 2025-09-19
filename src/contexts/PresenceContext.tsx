// Context for managing presence and channels state
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, Channel, PresenceState, ChannelState } from '../types/presence';
import { socketService } from '../services/socket';
import { useAuth } from './AuthContext';

// Action types for presence reducer
type PresenceAction =
  | { type: 'SET_ONLINE_USERS'; payload: User[] }
  | { type: 'USER_ONLINE'; payload: User }
  | { type: 'USER_OFFLINE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };

// Action types for channels reducer
type ChannelAction =
  | { type: 'SET_CHANNELS'; payload: Channel[] }
  | { type: 'ADD_CHANNEL'; payload: Channel }
  | { type: 'UPDATE_CHANNEL'; payload: Channel }
  | { type: 'REMOVE_CHANNEL'; payload: string }
  | { type: 'SET_ACTIVE_CHANNEL'; payload: Channel | null }
  | { type: 'SET_LOADING'; payload: boolean };

// Reducers
const presenceReducer = (state: PresenceState, action: PresenceAction): PresenceState => {
  switch (action.type) {
    case 'SET_ONLINE_USERS':
      return {
        ...state,
        onlineUsers: action.payload,
        totalOnlineCount: action.payload.length
      };
    case 'USER_ONLINE':
      const userExists = state.onlineUsers.find(user => user.id === action.payload.id);
      if (!userExists) {
        return {
          ...state,
          onlineUsers: [...state.onlineUsers, action.payload],
          totalOnlineCount: state.onlineUsers.length + 1
        };
      }
      return state;
    case 'USER_OFFLINE':
      return {
        ...state,
        onlineUsers: state.onlineUsers.filter(user => user.id !== action.payload),
        totalOnlineCount: state.onlineUsers.length - 1
      };
    case 'SET_LOADING':
      return { ...state };
    default:
      return state;
  }
};

const channelReducer = (state: ChannelState, action: ChannelAction): ChannelState => {
  switch (action.type) {
    case 'SET_CHANNELS':
      return {
        ...state,
        channels: action.payload,
        isLoading: false
      };
    case 'ADD_CHANNEL':
      return {
        ...state,
        channels: [...state.channels, action.payload]
      };
    case 'UPDATE_CHANNEL':
      return {
        ...state,
        channels: state.channels.map(channel =>
          channel.id === action.payload.id ? action.payload : channel
        )
      };
    case 'REMOVE_CHANNEL':
      return {
        ...state,
        channels: state.channels.filter(channel => channel.id !== action.payload),
        activeChannel: state.activeChannel?.id === action.payload ? null : state.activeChannel
      };
    case 'SET_ACTIVE_CHANNEL':
      return {
        ...state,
        activeChannel: action.payload
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    default:
      return state;
  }
};

// Context types
interface PresenceContextType {
  // Presence state
  onlineUsers: User[];
  totalOnlineCount: number;
  
  // Channel state
  channels: Channel[];
  activeChannel: Channel | null;
  isLoading: boolean;
  
  // Actions
  createChannel: (channelData: Omit<Channel, 'id' | 'createdAt' | 'memberCount'>) => void;
  joinChannel: (channelId: string) => void;
  leaveChannel: (channelId: string) => void;
  setActiveChannel: (channel: Channel | null) => void;
  fetchChannels: () => void;
}

// Create contexts
const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

// Initial states
const initialPresenceState: PresenceState = {
  onlineUsers: [],
  totalOnlineCount: 0
};

const initialChannelState: ChannelState = {
  channels: [],
  activeChannel: null,
  isLoading: false
};

// Provider component
export const PresenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [presenceState, presenceDispatch] = useReducer(presenceReducer, initialPresenceState);
  const [channelState, channelDispatch] = useReducer(channelReducer, initialChannelState);
  const { user, token } = useAuth();

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (user && token) {
      socketService.connect(token).then(() => {
        console.log('Socket connected for presence and channels');
        
        // Join presence system
        socketService.emit('presence:join', user);
        
        // Fetch initial channels
        fetchChannels();
      }).catch(error => {
        console.error('Failed to connect socket:', error);
      });
    }

    return () => {
      if (socketService.isConnected()) {
        socketService.emit('presence:leave', undefined);
        socketService.disconnect();
      }
    };
  }, [user, token]);

  // Socket event listeners
  useEffect(() => {
    if (!socketService.isConnected()) return;

    // Presence events
    socketService.on('user:online', (user: User) => {
      presenceDispatch({ type: 'USER_ONLINE', payload: user });
    });

    socketService.on('user:offline', (userId: string) => {
      presenceDispatch({ type: 'USER_OFFLINE', payload: userId });
    });

    socketService.on('presence:update', (presence: PresenceState) => {
      presenceDispatch({ type: 'SET_ONLINE_USERS', payload: presence.onlineUsers });
    });

    // Channel events
    socketService.on('channel:created', (channel: Channel) => {
      channelDispatch({ type: 'ADD_CHANNEL', payload: channel });
    });

    socketService.on('channel:updated', (channel: Channel) => {
      channelDispatch({ type: 'UPDATE_CHANNEL', payload: channel });
    });

    socketService.on('channel:deleted', (channelId: string) => {
      channelDispatch({ type: 'REMOVE_CHANNEL', payload: channelId });
    });

    socketService.on('channels:list', (channels: Channel[]) => {
      channelDispatch({ type: 'SET_CHANNELS', payload: channels });
    });

    socketService.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Cleanup listeners on unmount
    return () => {
      socketService.off('user:online');
      socketService.off('user:offline');
      socketService.off('presence:update');
      socketService.off('channel:created');
      socketService.off('channel:updated');
      socketService.off('channel:deleted');
      socketService.off('channels:list');
      socketService.off('error');
    };
  }, []);

  // Action functions
  const createChannel = (channelData: Omit<Channel, 'id' | 'createdAt' | 'memberCount'>) => {
    if (socketService.isConnected()) {
      socketService.emit('channel:create', channelData);
    }
  };

  const joinChannel = (channelId: string) => {
    if (socketService.isConnected()) {
      socketService.emit('channel:join', channelId);
    }
  };

  const leaveChannel = (channelId: string) => {
    if (socketService.isConnected()) {
      socketService.emit('channel:leave', channelId);
    }
  };

  const setActiveChannel = (channel: Channel | null) => {
    channelDispatch({ type: 'SET_ACTIVE_CHANNEL', payload: channel });
  };

  const fetchChannels = () => {
    if (socketService.isConnected()) {
      channelDispatch({ type: 'SET_LOADING', payload: true });
      socketService.emit('channels:fetch', undefined);
    }
  };

  const contextValue: PresenceContextType = {
    // Presence state
    onlineUsers: presenceState.onlineUsers,
    totalOnlineCount: presenceState.totalOnlineCount,
    
    // Channel state
    channels: channelState.channels,
    activeChannel: channelState.activeChannel,
    isLoading: channelState.isLoading,
    
    // Actions
    createChannel,
    joinChannel,
    leaveChannel,
    setActiveChannel,
    fetchChannels
  };

  return (
    <PresenceContext.Provider value={contextValue}>
      {children}
    </PresenceContext.Provider>
  );
};

// Custom hook to use presence context
export const usePresence = (): PresenceContextType => {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
};
