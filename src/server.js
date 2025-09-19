// Backend server with Socket.IO for presence and channels
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (in production, use Redis or database)
const connectedUsers = new Map(); // userId -> { socketId, user, channels }
const channels = new Map(); // channelId -> channel data
const channelMembers = new Map(); // channelId -> Set of userIds

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to authenticate socket connections
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket connection handling
io.on('connection', (socket) => {
  console.log(`User ${socket.user.name} connected with socket ${socket.id}`);

  // Add user to connected users
  connectedUsers.set(socket.userId, {
    socketId: socket.id,
    user: socket.user,
    channels: new Set()
  });

  // Broadcast user online status
  socket.broadcast.emit('user:online', socket.user);
  
  // Send current online users to the new connection
  const onlineUsers = Array.from(connectedUsers.values()).map(u => u.user);
  socket.emit('presence:update', {
    onlineUsers,
    totalOnlineCount: onlineUsers.length
  });

  // Send available channels
  const channelsList = Array.from(channels.values());
  socket.emit('channels:list', channelsList);

  // Handle presence events
  socket.on('presence:join', (userData) => {
    // User is already added above, just confirm
    socket.emit('presence:joined', { success: true });
  });

  socket.on('presence:leave', () => {
    // This will be handled in the disconnect event
  });

  // Handle channel events
  socket.on('channel:create', (channelData) => {
    try {
      const channelId = generateChannelId();
      const channel = {
        id: channelId,
        name: channelData.name,
        description: channelData.description,
        isPrivate: channelData.isPrivate,
        createdBy: socket.userId,
        createdAt: new Date(),
        memberCount: 1
      };

      // Store channel
      channels.set(channelId, channel);
      channelMembers.set(channelId, new Set([socket.userId]));

      // Add user to channel
      const userData = connectedUsers.get(socket.userId);
      if (userData) {
        userData.channels.add(channelId);
      }

      // Broadcast channel creation
      io.emit('channel:created', channel);
      
      // Auto-join the creator
      socket.emit('channel:joined', channel);
      
      console.log(`Channel ${channel.name} created by ${socket.user.name}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to create channel', code: 'CHANNEL_CREATE_ERROR' });
    }
  });

  socket.on('channel:join', (channelId) => {
    try {
      const channel = channels.get(channelId);
      if (!channel) {
        socket.emit('error', { message: 'Channel not found', code: 'CHANNEL_NOT_FOUND' });
        return;
      }

      // Add user to channel
      const members = channelMembers.get(channelId) || new Set();
      members.add(socket.userId);
      channelMembers.set(channelId, members);

      // Update member count
      channel.memberCount = members.size;
      channels.set(channelId, channel);

      // Add channel to user's channels
      const userData = connectedUsers.get(socket.userId);
      if (userData) {
        userData.channels.add(channelId);
      }

      // Broadcast channel update
      io.emit('channel:updated', channel);
      socket.emit('channel:joined', channel);
      
      console.log(`${socket.user.name} joined channel ${channel.name}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to join channel', code: 'CHANNEL_JOIN_ERROR' });
    }
  });

  socket.on('channel:leave', (channelId) => {
    try {
      const channel = channels.get(channelId);
      if (!channel) {
        socket.emit('error', { message: 'Channel not found', code: 'CHANNEL_NOT_FOUND' });
        return;
      }

      // Remove user from channel
      const members = channelMembers.get(channelId);
      if (members) {
        members.delete(socket.userId);
        channelMembers.set(channelId, members);

        // Update member count
        channel.memberCount = members.size;
        channels.set(channelId, channel);

        // Remove channel from user's channels
        const userData = connectedUsers.get(socket.userId);
        if (userData) {
          userData.channels.delete(channelId);
        }

        // If no members left, delete the channel
        if (members.size === 0) {
          channels.delete(channelId);
          channelMembers.delete(channelId);
          io.emit('channel:deleted', channelId);
        } else {
          // Broadcast channel update
          io.emit('channel:updated', channel);
        }

        socket.emit('channel:left', channelId);
        console.log(`${socket.user.name} left channel ${channel.name}`);
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to leave channel', code: 'CHANNEL_LEAVE_ERROR' });
    }
  });

  socket.on('channels:fetch', () => {
    const channelsList = Array.from(channels.values());
    socket.emit('channels:list', channelsList);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User ${socket.user.name} disconnected`);
    
    // Remove user from all channels
    const userData = connectedUsers.get(socket.userId);
    if (userData) {
      userData.channels.forEach(channelId => {
        const channel = channels.get(channelId);
        if (channel) {
          const members = channelMembers.get(channelId);
          if (members) {
            members.delete(socket.userId);
            channel.memberCount = members.size;
            channels.set(channelId, channel);
            
            if (members.size === 0) {
              channels.delete(channelId);
              channelMembers.delete(channelId);
              io.emit('channel:deleted', channelId);
            } else {
              io.emit('channel:updated', channel);
            }
          }
        }
      });
    }

    // Remove user from connected users
    connectedUsers.delete(socket.userId);
    
    // Broadcast user offline status
    socket.broadcast.emit('user:offline', socket.userId);
  });
});

// Utility function to generate channel ID
function generateChannelId() {
  return 'channel_' + Math.random().toString(36).substr(2, 9);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connectedUsers: connectedUsers.size,
    channels: channels.size 
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});

module.exports = { app, server, io };