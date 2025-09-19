// Component for displaying online users with presence indicators
import React from 'react';
import { usePresence } from '../contexts/PresenceContext';

interface PresenceListProps {
  className?: string;
  showCount?: boolean;
  maxDisplay?: number; // Maximum number of users to display before showing count
}

const PresenceList: React.FC<PresenceListProps> = ({ 
  className = '', 
  showCount = true, 
  maxDisplay = 5 
}) => {
  const { onlineUsers, totalOnlineCount } = usePresence();

  // Get users to display (limited by maxDisplay)
  const displayUsers = onlineUsers.slice(0, maxDisplay);
  const remainingCount = Math.max(0, totalOnlineCount - maxDisplay);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">
            Online Users
          </h3>
          {showCount && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {totalOnlineCount} online
            </span>
          )}
        </div>
      </div>

      {/* Users List */}
      <div className="p-4">
        {onlineUsers.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-gray-400 text-sm">No users online</div>
          </div>
        ) : (
          <div className="space-y-3">
            {displayUsers.map((user) => (
              <UserPresenceItem key={user.id} user={user} />
            ))}
            
            {/* Show remaining count if there are more users */}
            {remainingCount > 0 && (
              <div className="text-center pt-2">
                <span className="text-sm text-gray-500">
                  +{remainingCount} more user{remainingCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Individual user presence item component
interface UserPresenceItemProps {
  user: {
    id: string;
    name: string;
    email: string;
    isOnline?: boolean;
  };
}

const UserPresenceItem: React.FC<UserPresenceItemProps> = ({ user }) => {
  return (
    <div className="flex items-center space-x-3">
      {/* Avatar with online indicator */}
      <div className="relative">
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-gray-700">
            {user.name.charAt(0).toUpperCase()}
          </span>
        </div>
        {/* Online indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {user.name}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {user.email}
        </p>
      </div>

      {/* Online status */}
      <div className="flex items-center">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
      </div>
    </div>
  );
};

export default PresenceList;
