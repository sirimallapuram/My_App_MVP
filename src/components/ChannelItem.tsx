// Individual channel item component
import React from 'react';
import { Channel } from '../types/presence';

interface ChannelItemProps {
  channel: Channel;
  isActive: boolean;
  onSelect: (channel: Channel) => void;
  onJoin?: (channelId: string) => void;
  onLeave?: (channelId: string) => void;
  showActions?: boolean;
}

const ChannelItem: React.FC<ChannelItemProps> = ({
  channel,
  isActive,
  onSelect,
  onJoin,
  onLeave,
  showActions = true
}) => {
  const handleClick = () => {
    onSelect(channel);
  };

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    onJoin?.(channel.id);
  };

  const handleLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLeave?.(channel.id);
  };

  return (
    <div
      className={`
        group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors
        ${isActive 
          ? 'bg-blue-50 border-blue-200 border' 
          : 'hover:bg-gray-50 border border-transparent'
        }
      `}
      onClick={handleClick}
    >
      {/* Channel info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          {/* Channel icon */}
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium
            ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
          `}>
            {channel.isPrivate ? '🔒' : '#'}
          </div>

          {/* Channel details */}
          <div className="flex-1 min-w-0">
            <h4 className={`
              text-sm font-medium truncate
              ${isActive ? 'text-blue-900' : 'text-gray-900'}
            `}>
              {channel.name}
            </h4>
            {channel.description && (
              <p className="text-xs text-gray-500 truncate">
                {channel.description}
              </p>
            )}
          </div>
        </div>

        {/* Channel metadata */}
        <div className="flex items-center space-x-3 mt-1">
          <span className="text-xs text-gray-500">
            {channel.memberCount} member{channel.memberCount !== 1 ? 's' : ''}
          </span>
          {channel.isPrivate && (
            <span className="text-xs text-gray-500">Private</span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onJoin && (
            <button
              onClick={handleJoin}
              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
              title="Join channel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          )}
          {onLeave && (
            <button
              onClick={handleLeave}
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
              title="Leave channel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Active indicator */}
      {isActive && (
        <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
      )}
    </div>
  );
};

export default ChannelItem;
