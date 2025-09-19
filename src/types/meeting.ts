// Types for in-meeting chat and calendar functionality

export interface MeetingEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  creatorId: string;
  creatorName: string;
  participants: MeetingParticipant[];
  meetingId?: string; // Optional: if it's an active meeting
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingParticipant {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
  responseDate?: Date;
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every X days/weeks/months/years
  endDate?: Date;
  count?: number; // Number of occurrences
  daysOfWeek?: number[]; // For weekly recurrence (0=Sunday, 1=Monday, etc.)
}

export interface InMeetingMessage {
  id: string;
  meetingId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'emoji' | 'system';
  isEdited?: boolean;
  editedAt?: Date;
}

export interface CalendarView {
  type: 'month' | 'week' | 'day' | 'agenda';
  date: Date;
}

export interface CalendarState {
  events: MeetingEvent[];
  selectedEvent: MeetingEvent | null;
  view: CalendarView;
  isLoading: boolean;
  error: string | null;
}

export interface InMeetingChatState {
  messages: InMeetingMessage[];
  isOpen: boolean;
  isTyping: boolean;
  typingUsers: string[];
  isLoading: boolean;
}

export interface MeetingChatSocketEvents {
  // In-meeting chat events
  'meeting:chat:message': (message: InMeetingMessage) => void;
  'meeting:chat:typing': (data: { meetingId: string; userId: string; userName: string; isTyping: boolean }) => void;
  'meeting:chat:history': (messages: InMeetingMessage[]) => void;
  
  // Meeting events
  'meeting:event:created': (event: MeetingEvent) => void;
  'meeting:event:updated': (event: MeetingEvent) => void;
  'meeting:event:deleted': (eventId: string) => void;
  'meeting:event:reminder': (event: MeetingEvent) => void;
}

export interface MeetingChatSocketEmits {
  // In-meeting chat emits
  'meeting:chat:send': (data: { meetingId: string; content: string; type: 'text' | 'emoji' }) => void;
  'meeting:chat:typing': (data: { meetingId: string; isTyping: boolean }) => void;
  'meeting:chat:fetch': (meetingId: string) => void;
  
  // Meeting event emits
  'meeting:event:create': (event: Omit<MeetingEvent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  'meeting:event:update': (event: MeetingEvent) => void;
  'meeting:event:delete': (eventId: string) => void;
  'meeting:event:fetch': (data: { startDate: Date; endDate: Date }) => void;
  'meeting:event:respond': (data: { eventId: string; status: 'accepted' | 'declined' | 'tentative' }) => void;
}

export interface CalendarFilters {
  participants?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: ('pending' | 'accepted' | 'declined' | 'tentative')[];
}

export interface MeetingReminder {
  id: string;
  eventId: string;
  userId: string;
  reminderTime: Date;
  type: 'email' | 'push' | 'in-app';
  isSent: boolean;
  sentAt?: Date;
}
