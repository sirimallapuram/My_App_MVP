// In-meeting chat component for real-time messaging during meetings
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { InMeetingMessage } from '../types/meeting';
import { socketService } from '../services/socket';

interface InMeetingChatProps {
  meetingId: string;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

const InMeetingChat: React.FC<InMeetingChatProps> = ({
  meetingId,
  isOpen,
  onToggle,
  className = ''
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<InMeetingMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up socket listeners for in-meeting chat
  useEffect(() => {
    if (!socketService.isConnected() || !meetingId) return;

    const handleNewMessage = (message: InMeetingMessage) => {
      if (message.meetingId === meetingId) {
        setMessages(prev => [...prev, message]);
      }
    };

    const handleTyping = (data: { meetingId: string; userId: string; userName: string; isTyping: boolean }) => {
      if (data.meetingId === meetingId) {
        if (data.isTyping) {
          setTypingUsers(prev => [...prev.filter(id => id !== data.userId), data.userId]);
        } else {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }
      }
    };

    const handleChatHistory = (chatMessages: InMeetingMessage[]) => {
      setMessages(chatMessages);
      setIsLoading(false);
    };

    // Set up listeners
    socketService.on('meeting:chat:message', handleNewMessage);
    socketService.on('meeting:chat:typing', handleTyping);
    socketService.on('meeting:chat:history', handleChatHistory);

    // Fetch chat history
    setIsLoading(true);
    socketService.emit('meeting:chat:fetch' as any, meetingId);

    return () => {
      socketService.off('meeting:chat:message', handleNewMessage);
      socketService.off('meeting:chat:typing', handleTyping);
      socketService.off('meeting:chat:history', handleChatHistory);
    };
  }, [meetingId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !socketService.isConnected()) return;

    const message: InMeetingMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      meetingId,
      userId: user?.id || '',
      userName: user?.name || 'Unknown',
      content: messageInput.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    socketService.emit('meeting:chat:send' as any, {
      meetingId,
      content: messageInput.trim(),
      type: 'text'
    });

    setMessageInput('');
    stopTyping();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    if (socketService.isConnected()) {
      startTyping();

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 1000);
    }
  };

  const startTyping = () => {
    if (socketService.isConnected()) {
      socketService.emit('meeting:chat:typing' as any, {
        meetingId,
        isTyping: true
      });
    }
  };

  const stopTyping = () => {
    if (socketService.isConnected()) {
      socketService.emit('meeting:chat:typing' as any, {
        meetingId,
        isTyping: false
      });
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: InMeetingMessage) => {
    const isOwnMessage = message.userId === user?.id;
    
    return (
      <div
        key={message.id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}
      >
        <div
          className={`max-w-xs px-3 py-2 rounded-lg ${
            isOwnMessage
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          {!isOwnMessage && (
            <div className="text-xs font-medium text-gray-600 mb-1">
              {message.userName}
            </div>
          )}
          <div className="text-sm">{message.content}</div>
          <div className={`text-xs mt-1 ${
            isOwnMessage ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className={`fixed right-4 top-1/2 transform -translate-y-1/2 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors ${className}`}
        title="Open chat"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {messages.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {messages.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className={`fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-50 flex flex-col ${className}`}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <h3 className="font-medium text-gray-900">Meeting Chat</h3>
        </div>
        <button
          onClick={onToggle}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No messages yet
              </h3>
              <p className="text-gray-600 text-sm">
                Start the conversation!
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span>
              {typingUsers.length === 1 ? 'Someone is typing...' : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={messageInput}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default InMeetingChat;
