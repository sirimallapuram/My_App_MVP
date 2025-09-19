import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { usePresence } from '../contexts/PresenceContext';
import { useChat } from '../contexts/ChatContext';
import ChannelList from '../components/ChannelList';
import PresenceList from '../components/PresenceList';
import AudioMeeting from '../components/AudioMeeting';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { activeChannel, totalOnlineCount } = usePresence();
  const { joinMeeting, isInMeeting } = useChat();
  const navigate = useNavigate();
  const [showAudioMeeting, setShowAudioMeeting] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">CollabSpace</h1>
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
                  onClick={() => navigate('/chat')}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  💬 Chat
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

            {/* Main Content Area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-96">
                {activeChannel ? (
                  <div className="h-full flex flex-col">
                    {/* Channel Header */}
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
                        <div className="text-sm text-gray-500">
                          {activeChannel.memberCount} member{activeChannel.memberCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    {/* Channel Content */}
                    <div className="flex-1 p-6">
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Welcome to #{activeChannel.name}
                          </h3>
                          <p className="text-gray-600 mb-6">
                            This is the beginning of your conversation in this channel.
                          </p>
                          <div className="space-y-3">
                            <button 
                              onClick={() => navigate('/chat')}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium"
                            >
                              💬 Open Chat
                            </button>
                            <button 
                              onClick={() => navigate('/calendar')}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-md font-medium ml-4"
                            >
                              📅 View Calendar
                            </button>
                            <button 
                              onClick={() => setShowAudioMeeting(true)}
                              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium ml-4"
                            >
                              🎤 Start Meeting
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Select a Channel
                      </h3>
                      <p className="text-gray-600">
                        Choose a channel from the sidebar to start collaborating.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar - Online Users */}
            <div className="lg:col-span-1">
              <PresenceList />
            </div>
          </div>
        </div>
      </div>

      {/* Audio Meeting Modal */}
      {showAudioMeeting && (
        <AudioMeeting onClose={() => setShowAudioMeeting(false)} />
      )}
    </div>
  );
};

export default Dashboard;
