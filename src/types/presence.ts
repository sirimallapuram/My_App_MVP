// Types for presence and channels system

export interface User {
  id: string;
  name: string;
  email: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  createdBy: string;
  createdAt: Date;
  memberCount: number;
  isActive?: boolean; // For UI highlighting
}

export interface PresenceState {
  onlineUsers: User[];
  totalOnlineCount: number;
}

export interface ChannelState {
  channels: Channel[];
  activeChannel: Channel | null;
  isLoading: boolean;
}

export interface SocketEvents {
  // Presence events
  'user:online': (user: User) => void;
  'user:offline': (userId: string) => void;
  'presence:update': (presence: PresenceState) => void;
  
  // Channel events
  'channel:created': (channel: Channel) => void;
  'channel:updated': (channel: Channel) => void;
  'channel:deleted': (channelId: string) => void;
  'channel:joined': (channel: Channel) => void;
  'channel:left': (channelId: string) => void;
  'channels:list': (channels: Channel[]) => void;
  
  // Error events
  'error': (error: { message: string; code?: string }) => void;
}

export interface SocketEmits {
  // Presence emits
  'presence:join': (user: User) => void;
  'presence:leave': (data?: undefined) => void;
  
  // Channel emits
  'channel:create': (channelData: Omit<Channel, 'id' | 'createdAt' | 'memberCount'>) => void;
  'channel:join': (channelId: string) => void;
  'channel:leave': (channelId: string) => void;
  'channels:fetch': (data?: undefined) => void;
}
