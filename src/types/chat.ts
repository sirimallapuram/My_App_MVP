// Types for chat and audio meeting functionality

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'image';
  fileData?: FileData;
  isEdited?: boolean;
  editedAt?: Date;
}

export interface FileData {
  id: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
  uploadedAt: Date;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  isTyping: boolean;
  typingUsers: string[];
}

export interface AudioMeetingState {
  isInMeeting: boolean;
  isMuted: boolean;
  participants: MeetingParticipant[];
  meetingId: string | null;
}

export interface MeetingParticipant {
  id: string;
  username: string;
  isMuted: boolean;
  isSpeaking: boolean;
  joinedAt: Date;
}

export interface ChatSocketEvents {
  // Message events
  'message:new': (message: Message) => void;
  'message:edit': (message: Message) => void;
  'message:delete': (messageId: string) => void;
  'messages:history': (messages: Message[]) => void;
  
  // Typing events
  'typing:start': (data: { userId: string; username: string; channelId: string }) => void;
  'typing:stop': (data: { userId: string; channelId: string }) => void;
  
  // File events
  'file:uploaded': (message: Message) => void;
  'file:download': (fileId: string) => void;
  
  // Audio meeting events
  'meeting:join': (data: { meetingId: string; participant: MeetingParticipant }) => void;
  'meeting:leave': (data: { meetingId: string; userId: string }) => void;
  'meeting:mute': (data: { meetingId: string; userId: string; isMuted: boolean }) => void;
  'meeting:participants': (data: { meetingId: string; participants: MeetingParticipant[] }) => void;
  'meeting:speaking': (data: { meetingId: string; userId: string; isSpeaking: boolean }) => void;
}

export interface ChatSocketEmits {
  // Message emits
  'message:send': (data: { channelId: string; content: string; type: 'text' }) => void;
  'message:edit': (data: { messageId: string; content: string }) => void;
  'message:delete': (messageId: string) => void;
  'messages:fetch': (channelId: string) => void;
  
  // Typing emits
  'typing:start': (data: { channelId: string }) => void;
  'typing:stop': (data: { channelId: string }) => void;
  
  // File emits
  'file:upload': (data: { channelId: string; file: FileData; content: string }) => void;
  'file:download': (fileId: string) => void;
  
  // Audio meeting emits
  'meeting:join': (data: { channelId: string; meetingId?: string }) => void;
  'meeting:leave': (meetingId: string) => void;
  'meeting:mute': (data: { meetingId: string; isMuted: boolean }) => void;
  'meeting:speaking': (data: { meetingId: string; isSpeaking: boolean }) => void;
}
