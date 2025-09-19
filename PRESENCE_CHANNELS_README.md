# Presence and Channels Feature

This document describes the implementation of the Presence and Channels feature for the CollabSpace Zoom-like collaboration app.

## Features Implemented

### 1. Presence System
- **Real-time online users list**: Shows who's currently online
- **Live status updates**: Green dot for online, gray for offline
- **User count display**: Shows total number of online users
- **Automatic updates**: Updates when users connect/disconnect via Socket.IO

### 2. Channel System
- **Channel list sidebar**: Displays available channels
- **Create new channels**: Users can create public/private channels
- **Join/Leave channels**: Users can join or leave channels
- **Active channel highlighting**: Shows currently selected channel
- **Channel search**: Search through available channels
- **Channel metadata**: Shows member count, privacy status, descriptions

## File Structure

### Frontend Components
```
src/
├── types/
│   └── presence.ts              # TypeScript types for presence and channels
├── services/
│   └── socket.ts                # Socket.IO service for real-time communication
├── contexts/
│   └── PresenceContext.tsx      # React context for presence and channels state
├── components/
│   ├── PresenceList.tsx         # Component for displaying online users
│   ├── ChannelList.tsx          # Main channels sidebar component
│   ├── ChannelItem.tsx          # Individual channel item component
│   └── CreateChannelModal.tsx   # Modal for creating new channels
└── pages/
    └── Dashboard.tsx            # Updated dashboard with presence and channels
```

### Backend
```
src/
└── server.js                    # Express + Socket.IO server
backend-package.json             # Backend dependencies
```

## Setup Instructions

### 1. Frontend Setup
The frontend dependencies are already installed. The main packages added are:
- `socket.io-client`: For real-time communication
- `@types/socket.io-client`: TypeScript types

### 2. Backend Setup
To set up the backend server:

1. Create a new directory for the backend:
```bash
mkdir backend
cd backend
```

2. Copy the backend files:
```bash
cp ../backend-package.json package.json
cp ../src/server.js .
```

3. Install backend dependencies:
```bash
npm install
```

4. Create a `.env` file:
```env
PORT=5001
JWT_SECRET=your-secret-key-here
CLIENT_URL=http://localhost:3000
```

5. Start the backend server:
```bash
npm run dev
```

### 3. Frontend Environment
Add to your `.env` file in the root directory:
```env
REACT_APP_SOCKET_URL=http://localhost:5001
```

## How It Works

### 1. Authentication Flow
1. User logs in and receives JWT token
2. Frontend connects to Socket.IO server with JWT token
3. Backend validates token and establishes connection
4. User is added to online users list

### 2. Presence Updates
1. When user connects: `user:online` event is broadcast
2. When user disconnects: `user:offline` event is broadcast
3. All connected clients receive real-time updates
4. UI automatically updates to show current online users

### 3. Channel Management
1. Users can create channels via the modal
2. Channel creation is broadcast to all users
3. Users can join/leave channels
4. Channel membership is tracked in real-time
5. Active channel is highlighted in the UI

### 4. Real-time Communication
- **Socket.IO events** handle all real-time updates
- **Context API** manages state across components
- **TypeScript** ensures type safety
- **Tailwind CSS** provides responsive, modern UI

## Key Features

### PresenceList Component
- Shows online users with avatars and status indicators
- Displays total online count
- Responsive design with user limit display
- Real-time updates when users come online/offline

### ChannelList Component
- Search functionality for channels
- Separate sections for public/private channels
- Create new channel button
- Refresh channels functionality
- Real-time channel updates

### ChannelItem Component
- Individual channel display with metadata
- Join/Leave action buttons
- Active channel highlighting
- Privacy indicators (public/private)

### CreateChannelModal Component
- Form for creating new channels
- Public/Private channel options
- Description field
- Form validation

## Socket.IO Events

### Client to Server
- `presence:join` - Join presence system
- `presence:leave` - Leave presence system
- `channel:create` - Create new channel
- `channel:join` - Join a channel
- `channel:leave` - Leave a channel
- `channels:fetch` - Get all channels

### Server to Client
- `user:online` - User came online
- `user:offline` - User went offline
- `presence:update` - Updated presence list
- `channel:created` - New channel created
- `channel:updated` - Channel updated
- `channel:deleted` - Channel deleted
- `channel:joined` - Successfully joined channel
- `channel:left` - Successfully left channel
- `channels:list` - List of all channels
- `error` - Error occurred

## Production Considerations

1. **Database Integration**: Replace in-memory storage with Redis or database
2. **Authentication**: Implement proper JWT validation
3. **Error Handling**: Add comprehensive error handling
4. **Scalability**: Consider horizontal scaling with Redis adapter
5. **Security**: Add rate limiting and input validation
6. **Monitoring**: Add logging and monitoring

## Testing

To test the features:

1. Start both frontend and backend servers
2. Open multiple browser tabs/windows
3. Log in with different users
4. Create channels and join them
5. Observe real-time updates across all clients

The system provides a solid foundation for a Zoom-like collaboration app with real-time presence and channel management.
