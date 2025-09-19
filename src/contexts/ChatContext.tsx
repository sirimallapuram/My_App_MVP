// Context for managing chat and audio meeting state
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Message, ChatState, AudioMeetingState, MeetingParticipant } from '../types/chat';
import { socketService } from '../services/socket';
import { useAuth } from './AuthContext';
import { usePresence } from './PresenceContext';

// Action types for chat reducer
type ChatAction =
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: Message }
  | { type: 'REMOVE_MESSAGE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TYPING'; payload: { isTyping: boolean; users: string[] } };

// Action types for audio meeting reducer
type AudioMeetingAction =
  | { type: 'JOIN_MEETING'; payload: { meetingId: string; participants: MeetingParticipant[] } }
  | { type: 'LEAVE_MEETING' }
  | { type: 'UPDATE_PARTICIPANT'; payload: MeetingParticipant }
  | { type: 'SET_MUTE_STATUS'; payload: { userId: string; isMuted: boolean } }
  | { type: 'SET_SPEAKING_STATUS'; payload: { userId: string; isSpeaking: boolean } };

// Reducers
const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload,
        isLoading: false
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload]
      };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id ? action.payload : msg
        )
      };
    case 'REMOVE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload)
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    case 'SET_TYPING':
      return {
        ...state,
        isTyping: action.payload.isTyping,
        typingUsers: action.payload.users
      };
    default:
      return state;
  }
};

const audioMeetingReducer = (state: AudioMeetingState, action: AudioMeetingAction): AudioMeetingState => {
  switch (action.type) {
    case 'JOIN_MEETING':
      return {
        ...state,
        isInMeeting: true,
        meetingId: action.payload.meetingId,
        participants: action.payload.participants
      };
    case 'LEAVE_MEETING':
      return {
        ...state,
        isInMeeting: false,
        meetingId: null,
        participants: []
      };
    case 'UPDATE_PARTICIPANT':
      return {
        ...state,
        participants: state.participants.map(p =>
          p.id === action.payload.id ? action.payload : p
        )
      };
    case 'SET_MUTE_STATUS':
      return {
        ...state,
        participants: state.participants.map(p =>
          p.id === action.payload.userId
            ? { ...p, isMuted: action.payload.isMuted }
            : p
        )
      };
    case 'SET_SPEAKING_STATUS':
      return {
        ...state,
        participants: state.participants.map(p =>
          p.id === action.payload.userId
            ? { ...p, isSpeaking: action.payload.isSpeaking }
            : p
        )
      };
    default:
      return state;
  }
};

// Context types
interface ChatContextType {
  // Chat state
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
  typingUsers: string[];
  
  // Audio meeting state
  isInMeeting: boolean;
  isMuted: boolean;
  participants: MeetingParticipant[];
  meetingId: string | null;
  
  // Chat actions
  sendMessage: (channelId: string, content: string) => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  fetchMessages: (channelId: string) => void;
  startTyping: (channelId: string) => void;
  stopTyping: (channelId: string) => void;
  uploadFile: (channelId: string, file: File, content: string) => Promise<void>;
  
  // Audio meeting actions
  joinMeeting: (channelId: string, meetingId?: string) => void;
  leaveMeeting: () => void;
  toggleMute: () => void;
  setSpeaking: (isSpeaking: boolean) => void;
}

// Create contexts
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Initial states
const initialChatState: ChatState = {
  messages: [],
  isLoading: false,
  isTyping: false,
  typingUsers: []
};

const initialAudioMeetingState: AudioMeetingState = {
  isInMeeting: false,
  isMuted: false,
  participants: [],
  meetingId: null
};

// Provider component
export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [chatState, chatDispatch] = useReducer(chatReducer, initialChatState);
  const [audioMeetingState, audioMeetingDispatch] = useReducer(audioMeetingReducer, initialAudioMeetingState);
  const { user, token } = useAuth();
  const { activeChannel } = usePresence();

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (user && token && socketService.isConnected()) {
      // Set up chat event listeners
      setupChatListeners();
    }

    return () => {
      // Cleanup listeners
      cleanupChatListeners();
    };
  }, [user, token]);

  // Set up socket event listeners
  const setupChatListeners = () => {
    if (!socketService.isConnected()) return;

    // Message events
    socketService.on('message:new', (message: Message) => {
      chatDispatch({ type: 'ADD_MESSAGE', payload: message });
    });

    socketService.on('message:edit', (message: Message) => {
      chatDispatch({ type: 'UPDATE_MESSAGE', payload: message });
    });

    socketService.on('message:delete', (messageId: string) => {
      chatDispatch({ type: 'REMOVE_MESSAGE', payload: messageId });
    });

    socketService.on('messages:history', (messages: Message[]) => {
      chatDispatch({ type: 'SET_MESSAGES', payload: messages });
    });

    // Typing events
    socketService.on('typing:start', (data: { userId: string; username: string; channelId: string }) => {
      if (data.channelId === activeChannel?.id) {
        chatDispatch({
          type: 'SET_TYPING',
          payload: {
            isTyping: true,
            users: [...chatState.typingUsers.filter(id => id !== data.userId), data.userId]
          }
        });
      }
    });

    socketService.on('typing:stop', (data: { userId: string; channelId: string }) => {
      if (data.channelId === activeChannel?.id) {
        chatDispatch({
          type: 'SET_TYPING',
          payload: {
            isTyping: chatState.typingUsers.length > 1,
            users: chatState.typingUsers.filter(id => id !== data.userId)
          }
        });
      }
    });

    // File events
    socketService.on('file:uploaded', (message: Message) => {
      chatDispatch({ type: 'ADD_MESSAGE', payload: message });
    });

    // Audio meeting events
    socketService.on('meeting:join', (data: { meetingId: string; participant: MeetingParticipant }) => {
      audioMeetingDispatch({
        type: 'JOIN_MEETING',
        payload: { meetingId: data.meetingId, participants: [data.participant] }
      });
    });

    socketService.on('meeting:leave', (data: { meetingId: string; userId: string }) => {
      if (data.meetingId === audioMeetingState.meetingId) {
        audioMeetingDispatch({
          type: 'LEAVE_MEETING'
        });
      }
    });

    socketService.on('meeting:mute', (data: { meetingId: string; userId: string; isMuted: boolean }) => {
      if (data.meetingId === audioMeetingState.meetingId) {
        audioMeetingDispatch({
          type: 'SET_MUTE_STATUS',
          payload: { userId: data.userId, isMuted: data.isMuted }
        });
      }
    });

    socketService.on('meeting:participants', (data: { meetingId: string; participants: MeetingParticipant[] }) => {
      if (data.meetingId === audioMeetingState.meetingId) {
        audioMeetingDispatch({
          type: 'JOIN_MEETING',
          payload: { meetingId: data.meetingId, participants: data.participants }
        });
      }
    });

    socketService.on('meeting:speaking', (data: { meetingId: string; userId: string; isSpeaking: boolean }) => {
      if (data.meetingId === audioMeetingState.meetingId) {
        audioMeetingDispatch({
          type: 'SET_SPEAKING_STATUS',
          payload: { userId: data.userId, isSpeaking: data.isSpeaking }
        });
      }
    });
  };

  // Cleanup socket listeners
  const cleanupChatListeners = () => {
    socketService.off('message:new');
    socketService.off('message:edit');
    socketService.off('message:delete');
    socketService.off('messages:history');
    socketService.off('typing:start');
    socketService.off('typing:stop');
    socketService.off('file:uploaded');
    socketService.off('meeting:join');
    socketService.off('meeting:leave');
    socketService.off('meeting:mute');
    socketService.off('meeting:participants');
    socketService.off('meeting:speaking');
  };

  // Chat action functions
  const sendMessage = (channelId: string, content: string) => {
    if (socketService.isConnected()) {
      socketService.emit('message:send', { channelId, content, type: 'text' });
    }
  };

  const editMessage = (messageId: string, content: string) => {
    if (socketService.isConnected()) {
      socketService.emit('message:edit', { messageId, content });
    }
  };

  const deleteMessage = (messageId: string) => {
    if (socketService.isConnected()) {
      socketService.emit('message:delete', messageId);
    }
  };

  const fetchMessages = (channelId: string) => {
    if (socketService.isConnected()) {
      chatDispatch({ type: 'SET_LOADING', payload: true });
      socketService.emit('messages:fetch', channelId);
    }
  };

  const startTyping = (channelId: string) => {
    if (socketService.isConnected()) {
      socketService.emit('typing:start', { channelId });
    }
  };

  const stopTyping = (channelId: string) => {
    if (socketService.isConnected()) {
      socketService.emit('typing:stop', { channelId });
    }
  };

  const uploadFile = async (channelId: string, file: File, content: string): Promise<void> => {
    // This would typically upload to a file service
    // For now, we'll simulate the upload
    const fileData = {
      id: `file_${Date.now()}`,
      originalName: file.name,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      downloadUrl: URL.createObjectURL(file),
      uploadedAt: new Date()
    };

    if (socketService.isConnected()) {
      socketService.emit('file:upload' as any, { channelId, file: fileData, content });
    }
  };

  // Audio meeting action functions
  const joinMeeting = (channelId: string, meetingId?: string) => {
    if (socketService.isConnected()) {
      socketService.emit('meeting:join' as any, { channelId, meetingId });
    }
  };

  const leaveMeeting = () => {
    if (socketService.isConnected() && audioMeetingState.meetingId) {
      socketService.emit('meeting:leave' as any, audioMeetingState.meetingId);
      audioMeetingDispatch({ type: 'LEAVE_MEETING' });
    }
  };

  const toggleMute = () => {
    if (socketService.isConnected() && audioMeetingState.meetingId) {
      const newMuteStatus = !audioMeetingState.isMuted;
      audioMeetingDispatch({
        type: 'SET_MUTE_STATUS',
        payload: { userId: user?.id || '', isMuted: newMuteStatus }
      });
      socketService.emit('meeting:mute' as any, {
        meetingId: audioMeetingState.meetingId,
        isMuted: newMuteStatus
      });
    }
  };

  const setSpeaking = (isSpeaking: boolean) => {
    if (socketService.isConnected() && audioMeetingState.meetingId) {
      socketService.emit('meeting:speaking' as any, {
        meetingId: audioMeetingState.meetingId,
        isSpeaking
      });
    }
  };

  const contextValue: ChatContextType = {
    // Chat state
    messages: chatState.messages,
    isLoading: chatState.isLoading,
    isTyping: chatState.isTyping,
    typingUsers: chatState.typingUsers,
    
    // Audio meeting state
    isInMeeting: audioMeetingState.isInMeeting,
    isMuted: audioMeetingState.isMuted,
    participants: audioMeetingState.participants,
    meetingId: audioMeetingState.meetingId,
    
    // Chat actions
    sendMessage,
    editMessage,
    deleteMessage,
    fetchMessages,
    startTyping,
    stopTyping,
    uploadFile,
    
    // Audio meeting actions
    joinMeeting,
    leaveMeeting,
    toggleMute,
    setSpeaking
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use chat context
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
