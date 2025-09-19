// Main chat page with real-time messaging
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePresence } from '../contexts/PresenceContext';
import { useChat } from '../contexts/ChatContext';
import ChannelList from '../components/ChannelList';
import PresenceList from '../components/PresenceList';
import FileUpload from '../components/FileUpload';
import AudioMeeting from '../components/AudioMeeting';
import { Message } from '../types/chat';

const ChatPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { activeChannel, totalOnlineCount } = usePresence();
  const {
    messages,
    isLoading,
    isTyping,
    typingUsers,
    sendMessage,
    fetchMessages,
    startTyping,
    stopTyping,
    uploadFile,
    editMessage,
    deleteMessage,
    joinMeeting,
    isInMeeting
  } = useChat();
  const navigate = useNavigate();

  const [messageInput, setMessageInput] = useState('');
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAudioMeeting, setShowAudioMeeting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch messages when channel changes
  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel.id);
    }
  }, [activeChannel, fetchMessages]);

  // Handle typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    if (activeChannel) {
      startTyping(activeChannel.id);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(activeChannel.id);
      }, 1000);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || !activeChannel) return;

    if (editingMessage) {
      editMessage(editingMessage.id, messageInput.trim());
      setEditingMessage(null);
    } else {
      sendMessage(activeChannel.id, messageInput.trim());
    }

    setMessageInput('');
    stopTyping(activeChannel.id);
  };

  const handleFileUpload = async (file: File, content: string) => {
    if (!activeChannel) return;

    setIsUploading(true);
    try {
      await uploadFile(activeChannel.id, file, content);
      setShowFileUpload(false);
    } catch (error) {
      console.error('File upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setMessageInput(message.content);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setMessageInput('');
  };

  const formatTimestamp = (timestamp: Date): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderMessage = (message: Message) => {
    const isFileMessage = message.type === 'file' || message.type === 'image';
    
    return (
      <div key={message.id} className="message-item group hover:bg-gray-50 p-2 rounded-lg">
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-gray-700">
              {message.username.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-900">
                {message.username}
              </span>
              <span className="text-xs text-gray-500">
                {formatTimestamp(message.timestamp)}
              </span>
              {message.isEdited && (
                <span className="text-xs text-gray-400">(edited)</span>
              )}
            </div>

            {/* Message Body */}
            <div className="mt-1">
              {isFileMessage && message.fileData ? (
                <div className="bg-gray-100 rounded-lg p-3 max-w-md">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {message.fileData.mimeType.startsWith('image/') ? '🖼️' : '📎'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {message.fileData.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(message.fileData.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <a
                      href={message.fileData.downloadUrl}
                      download={message.fileData.originalName}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Download
                    </a>
                  </div>
                  {message.content && (
                    <p className="mt-2 text-sm text-gray-700">{message.content}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {message.content}
                </p>
              )}
            </div>
          </div>

          {/* Message Actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleEditMessage(message)}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => deleteMessage(message.id)}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">CollabSpace Chat</h1>
              {activeChannel && (
                <div className="ml-4 flex items-center">
                  <span className="text-gray-400">#</span>
                  <span className="ml-1 text-gray-700 font-medium">
                    {activeChannel.name}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  {totalOnlineCount} online
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => navigate('/calendar')}
                  className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  📅 Calendar
                </button>
                <button
                  onClick={() => setShowAudioMeeting(true)}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  🎤 Meeting
                </button>
              </div>
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Channels */}
            <div className="lg:col-span-1">
              <ChannelList />
            </div>

            {/* Main Chat Area */}
            <div className="lg:col-span-2">
              {!activeChannel ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Select a Channel
                    </h3>
                    <p className="text-gray-600">
                      Choose a channel from the sidebar to start chatting.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96 flex flex-col">
                  {/* Chat Header */}
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                          #{activeChannel.name}
                        </h2>
                        {activeChannel.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {activeChannel.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {messages.length} messages
                        </span>
                      </div>
                    </div>
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
                          <p className="text-gray-600">
                            Start the conversation by sending a message below.
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
                    {isTyping && typingUsers.length > 0 && (
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
                  <div className="px-6 py-4 border-t border-gray-200">
                    <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                      <div className="flex-1">
                        <div className="relative">
                          <input
                            type="text"
                            value={messageInput}
                            onChange={handleInputChange}
                            placeholder={`Message #${activeChannel.name}`}
                            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isUploading}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => setShowFileUpload(true)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              disabled={isUploading}
                              title="Upload file"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={!messageInput.trim() || isUploading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {editingMessage ? 'Update' : 'Send'}
                      </button>
                      {editingMessage && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-4 py-3 text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      )}
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar - Online Users */}
            <div className="lg:col-span-1">
              <PresenceList />
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Modal */}
      {showFileUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Upload File</h3>
              <button
                onClick={() => setShowFileUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <FileUpload
              onFileSelect={() => {}}
              onUpload={handleFileUpload}
              isUploading={isUploading}
            />
          </div>
        </div>
      )}

      {/* Audio Meeting Modal */}
      {showAudioMeeting && (
        <AudioMeeting onClose={() => setShowAudioMeeting(false)} />
      )}
    </div>
  );
};

export default ChatPage;
