// Main component for displaying and managing channels
import React, { useState } from 'react';
import { usePresence } from '../contexts/PresenceContext';
import ChannelItem from './ChannelItem';
import CreateChannelModal from './CreateChannelModal';

interface ChannelListProps {
  className?: string;
}

const ChannelList: React.FC<ChannelListProps> = ({ className = '' }) => {
  const { 
    channels, 
    activeChannel, 
    isLoading, 
    joinChannel, 
    leaveChannel, 
    setActiveChannel,
    fetchChannels 
  } = usePresence();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter channels based on search query
  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (channel.description && channel.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group channels by type
  const publicChannels = filteredChannels.filter(channel => !channel.isPrivate);
  const privateChannels = filteredChannels.filter(channel => channel.isPrivate);

  const handleChannelSelect = (channel: any) => {
    setActiveChannel(channel);
  };

  const handleJoinChannel = (channelId: string) => {
    joinChannel(channelId);
  };

  const handleLeaveChannel = (channelId: string) => {
    leaveChannel(channelId);
  };

  const handleRefresh = () => {
    fetchChannels();
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">
            Channels
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh channels"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Create new channel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Channels List */}
      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading channels...</p>
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-sm">
              {searchQuery ? 'No channels found' : 'No channels available'}
            </div>
            {!searchQuery && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Create your first channel
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Public Channels */}
            {publicChannels.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Public Channels ({publicChannels.length})
                </h4>
                <div className="space-y-1">
                  {publicChannels.map((channel) => (
                    <ChannelItem
                      key={channel.id}
                      channel={channel}
                      isActive={activeChannel?.id === channel.id}
                      onSelect={handleChannelSelect}
                      onJoin={handleJoinChannel}
                      onLeave={handleLeaveChannel}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Private Channels */}
            {privateChannels.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Private Channels ({privateChannels.length})
                </h4>
                <div className="space-y-1">
                  {privateChannels.map((channel) => (
                    <ChannelItem
                      key={channel.id}
                      channel={channel}
                      isActive={activeChannel?.id === channel.id}
                      onSelect={handleChannelSelect}
                      onJoin={handleJoinChannel}
                      onLeave={handleLeaveChannel}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Channel Modal */}
      <CreateChannelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default ChannelList;
