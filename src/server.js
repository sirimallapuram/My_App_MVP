  // src/server.js
  require("dotenv").config();
  const express = require("express");
  const mongoose = require("mongoose");
  const http = require("http");
  const socketIo = require("socket.io");
  const cors = require("cors");
  const multer = require("multer");
  const axios = require("axios"); // ✅ For calling Python API

  // Load route handlers
  const authRoutes = require("./routes/auth");
  const channelRoutes = require("./routes/channels");
  const messageRoutes = require("./routes/messages");
  const meetingRoutes = require("./routes/meetings");
  const { translateText } = require('./python-integration');

  const app = express();
  const server = http.createServer(app);
  


  // ✅ Socket.IO setup
  const io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // ✅ Middleware
  app.use(cors());
  app.use(express.json());

  // ✅ File upload (optional, for chat attachments)
  const upload = multer({ dest: "uploads/" });
  app.post("/api/upload", upload.single("file"), (req, res) => {
    res.json({ file: req.file });
  });

  // ✅ API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/channels", channelRoutes);
  app.use("/api/messages", messageRoutes);
  app.use("/api/meetings", meetingRoutes);
 

  // ✅ Health check
  app.get("/", (req, res) => {
    res.send("✅ Server is running!");
  });


  // PYTHON AI INTEGRATION ROUTES

  const PYTHON_API = process.env.PYTHON_API || "http://127.0.0.1:8000";

  // Fetch available languages from Python API
  app.get("/api/languages", async (req, res) => {
    try {
      const response = await axios.get(`${PYTHON_API}/languages`);
      res.json(response.data);
    } catch (error) {
      console.error("❌ Error fetching languages:", error.message);
      res.status(500).json({ error: "Failed to fetch languages" });
    }
  });

  // Translate text using Python API
 app.post("/api/translate", async (req, res) => {
  const { text, target_lang } = req.body;
  const result = await translateText(text, target_lang);
  res.json(result);
});


  // ✅ MongoDB connection
  mongoose
    .connect(process.env.MONGO_URI || "mongodb://localhost:27017/chatapp", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB error:", err));

  // ✅ Socket.IO events
  io.on("connection", (socket) => {
    console.log("🔌 New client connected:", socket.id);

    // Join a channel/room
    socket.on("joinChannel", (channelId) => {
      socket.join(channelId);
      console.log(`📌 User ${socket.id} joined channel ${channelId}`);
    });

    // Handle chat messages
    socket.on("sendMessage", ({ channelId, message }) => {
      io.to(channelId).emit("receiveMessage", { message, sender: socket.id });
    });

    // Handle WebRTC signaling
    socket.on("webrtcOffer", (data) => {
      socket.to(data.to).emit("webrtcOffer", {
        sdp: data.sdp,
        from: socket.id,
      });
    });

    socket.on("webrtcAnswer", (data) => {
      socket.to(data.to).emit("webrtcAnswer", {
        sdp: data.sdp,
        from: socket.id,
      });
    });

    socket.on("iceCandidate", (data) => {
      socket.to(data.to).emit("iceCandidate", {
        candidate: data.candidate,
        from: socket.id,
      });
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });

  // ✅ Start server
  const PORT = process.env.PORT || 4000;
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Backend server with Socket.IO for presence and channels
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
app.use('/uploads', express.static(uploadDir));

// In-memory storage (in production, use Redis or database)
const connectedUsers = new Map(); // userId -> { socketId, user, channels }
const channels = new Map(); // channelId -> channel data
const channelMembers = new Map(); // channelId -> Set of userIds
const messages = new Map(); // channelId -> Array of messages
const meetings = new Map(); // meetingId -> meeting data
const typingUsers = new Map(); // channelId -> Set of userIds
const meetingChats = new Map(); // meetingId -> Array of in-meeting messages
const meetingTypingUsers = new Map(); // meetingId -> Set of userIds
const calendarEvents = new Map(); // eventId -> meeting event data

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// File upload configuration
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp3|mp4|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('File type not supported'));
    }
  }
});

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

  // Chat message handlers
  socket.on('message:send', (data) => {
    try {
      const { channelId, content, type } = data;
      const channel = channels.get(channelId);
      
      if (!channel) {
        socket.emit('error', { message: 'Channel not found', code: 'CHANNEL_NOT_FOUND' });
        return;
      }

      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        channelId,
        userId: socket.userId,
        username: socket.user.name,
        content,
        type: type || 'text',
        timestamp: new Date(),
        isEdited: false
      };

      // Store message
      if (!messages.has(channelId)) {
        messages.set(channelId, []);
      }
      messages.get(channelId).push(message);

      // Broadcast to channel members
      const members = channelMembers.get(channelId) || new Set();
      members.forEach(memberId => {
        const member = connectedUsers.get(memberId);
        if (member) {
          io.to(member.socketId).emit('message:new', message);
        }
      });

      console.log(`Message sent in channel ${channel.name} by ${socket.user.name}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to send message', code: 'MESSAGE_SEND_ERROR' });
    }
  });

  socket.on('message:edit', (data) => {
    try {
      const { messageId, content } = data;
      const channelId = data.channelId;
      
      if (!messages.has(channelId)) {
        socket.emit('error', { message: 'Channel not found', code: 'CHANNEL_NOT_FOUND' });
        return;
      }

      const channelMessages = messages.get(channelId);
      const messageIndex = channelMessages.findIndex(msg => msg.id === messageId);
      
      if (messageIndex === -1) {
        socket.emit('error', { message: 'Message not found', code: 'MESSAGE_NOT_FOUND' });
        return;
      }

      const message = channelMessages[messageIndex];
      if (message.userId !== socket.userId) {
        socket.emit('error', { message: 'Unauthorized to edit message', code: 'UNAUTHORIZED' });
        return;
      }

      // Update message
      message.content = content;
      message.isEdited = true;
      message.editedAt = new Date();
      channelMessages[messageIndex] = message;

      // Broadcast update
      const members = channelMembers.get(channelId) || new Set();
      members.forEach(memberId => {
        const member = connectedUsers.get(memberId);
        if (member) {
          io.to(member.socketId).emit('message:edit', message);
        }
      });

      console.log(`Message edited by ${socket.user.name}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to edit message', code: 'MESSAGE_EDIT_ERROR' });
    }
  });

  socket.on('message:delete', (messageId) => {
    try {
      // Find message in all channels
      let found = false;
      for (const [channelId, channelMessages] of messages.entries()) {
        const messageIndex = channelMessages.findIndex(msg => msg.id === messageId);
        if (messageIndex !== -1) {
          const message = channelMessages[messageIndex];
          if (message.userId !== socket.userId) {
            socket.emit('error', { message: 'Unauthorized to delete message', code: 'UNAUTHORIZED' });
            return;
          }

          // Remove message
          channelMessages.splice(messageIndex, 1);
          found = true;

          // Broadcast deletion
          const members = channelMembers.get(channelId) || new Set();
          members.forEach(memberId => {
            const member = connectedUsers.get(memberId);
            if (member) {
              io.to(member.socketId).emit('message:delete', messageId);
            }
          });

          console.log(`Message deleted by ${socket.user.name}`);
          break;
        }
      }

      if (!found) {
        socket.emit('error', { message: 'Message not found', code: 'MESSAGE_NOT_FOUND' });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to delete message', code: 'MESSAGE_DELETE_ERROR' });
    }
  });

  socket.on('messages:fetch', (channelId) => {
    try {
      const channelMessages = messages.get(channelId) || [];
      socket.emit('messages:history', channelMessages);
    } catch (error) {
      socket.emit('error', { message: 'Failed to fetch messages', code: 'MESSAGES_FETCH_ERROR' });
    }
  });

  // Typing indicators
  socket.on('typing:start', (data) => {
    const { channelId } = data;
    if (!typingUsers.has(channelId)) {
      typingUsers.set(channelId, new Set());
    }
    typingUsers.get(channelId).add(socket.userId);

    // Broadcast to other channel members
    const members = channelMembers.get(channelId) || new Set();
    members.forEach(memberId => {
      if (memberId !== socket.userId) {
        const member = connectedUsers.get(memberId);
        if (member) {
          io.to(member.socketId).emit('typing:start', {
            userId: socket.userId,
            username: socket.user.name,
            channelId
          });
        }
      }
    });
  });

  socket.on('typing:stop', (data) => {
    const { channelId } = data;
    if (typingUsers.has(channelId)) {
      typingUsers.get(channelId).delete(socket.userId);
    }

    // Broadcast to other channel members
    const members = channelMembers.get(channelId) || new Set();
    members.forEach(memberId => {
      if (memberId !== socket.userId) {
        const member = connectedUsers.get(memberId);
        if (member) {
          io.to(member.socketId).emit('typing:stop', {
            userId: socket.userId,
            channelId
          });
        }
      }
    });
  });

  // File upload handler
  socket.on('file:upload', (data) => {
    try {
      const { channelId, file, content } = data;
      const channel = channels.get(channelId);
      
      if (!channel) {
        socket.emit('error', { message: 'Channel not found', code: 'CHANNEL_NOT_FOUND' });
        return;
      }

      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        channelId,
        userId: socket.userId,
        username: socket.user.name,
        content,
        type: 'file',
        fileData: file,
        timestamp: new Date(),
        isEdited: false
      };

      // Store message
      if (!messages.has(channelId)) {
        messages.set(channelId, []);
      }
      messages.get(channelId).push(message);

      // Broadcast to channel members
      const members = channelMembers.get(channelId) || new Set();
      members.forEach(memberId => {
        const member = connectedUsers.get(memberId);
        if (member) {
          io.to(member.socketId).emit('file:uploaded', message);
        }
      });

      console.log(`File uploaded in channel ${channel.name} by ${socket.user.name}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to upload file', code: 'FILE_UPLOAD_ERROR' });
    }
  });

  // Audio meeting handlers
  socket.on('meeting:join', (data) => {
    try {
      const { channelId, meetingId } = data;
      const channel = channels.get(channelId);
      
      if (!channel) {
        socket.emit('error', { message: 'Channel not found', code: 'CHANNEL_NOT_FOUND' });
        return;
      }

      const actualMeetingId = meetingId || `meeting_${channelId}_${Date.now()}`;
      
      if (!meetings.has(actualMeetingId)) {
        meetings.set(actualMeetingId, {
          id: actualMeetingId,
          channelId,
          participants: new Map(),
          createdAt: new Date()
        });
      }

      const meeting = meetings.get(actualMeetingId);
      const participant = {
        id: socket.userId,
        username: socket.user.name,
        isMuted: false,
        isSpeaking: false,
        joinedAt: new Date()
      };

      meeting.participants.set(socket.userId, participant);

      // Join socket to meeting room
      socket.join(actualMeetingId);

      // Broadcast to meeting participants
      socket.to(actualMeetingId).emit('meeting:join', {
        meetingId: actualMeetingId,
        participant
      });

      // Send current participants to the joining user
      const participants = Array.from(meeting.participants.values());
      socket.emit('meeting:participants', {
        meetingId: actualMeetingId,
        participants
      });

      console.log(`${socket.user.name} joined meeting ${actualMeetingId}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to join meeting', code: 'MEETING_JOIN_ERROR' });
    }
  });

  socket.on('meeting:leave', (meetingId) => {
    try {
      const meeting = meetings.get(meetingId);
      if (meeting) {
        meeting.participants.delete(socket.userId);
        
        // Leave socket room
        socket.leave(meetingId);

        // Broadcast to other participants
        socket.to(meetingId).emit('meeting:leave', {
          meetingId,
          userId: socket.userId
        });

        // Clean up empty meetings
        if (meeting.participants.size === 0) {
          meetings.delete(meetingId);
        }

        console.log(`${socket.user.name} left meeting ${meetingId}`);
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to leave meeting', code: 'MEETING_LEAVE_ERROR' });
    }
  });

  socket.on('meeting:mute', (data) => {
    try {
      const { meetingId, isMuted } = data;
      const meeting = meetings.get(meetingId);
      
      if (meeting && meeting.participants.has(socket.userId)) {
        const participant = meeting.participants.get(socket.userId);
        participant.isMuted = isMuted;
        meeting.participants.set(socket.userId, participant);

        // Broadcast to other participants
        socket.to(meetingId).emit('meeting:mute', {
          meetingId,
          userId: socket.userId,
          isMuted
        });

        console.log(`${socket.user.name} ${isMuted ? 'muted' : 'unmuted'} in meeting ${meetingId}`);
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to toggle mute', code: 'MEETING_MUTE_ERROR' });
    }
  });

  socket.on('meeting:speaking', (data) => {
    try {
      const { meetingId, isSpeaking } = data;
      const meeting = meetings.get(meetingId);
      
      if (meeting && meeting.participants.has(socket.userId)) {
        const participant = meeting.participants.get(socket.userId);
        participant.isSpeaking = isSpeaking;
        meeting.participants.set(socket.userId, participant);

        // Broadcast to other participants
        socket.to(meetingId).emit('meeting:speaking', {
          meetingId,
          userId: socket.userId,
          isSpeaking
        });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to update speaking status', code: 'MEETING_SPEAKING_ERROR' });
    }
  });

  // In-meeting chat handlers
  socket.on('meeting:chat:send', (data) => {
    try {
      const { meetingId, content, type } = data;
      const meeting = meetings.get(meetingId);
      
      if (!meeting) {
        socket.emit('error', { message: 'Meeting not found', code: 'MEETING_NOT_FOUND' });
        return;
      }

      const message = {
        id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        meetingId,
        userId: socket.userId,
        userName: socket.user.name,
        content,
        type: type || 'text',
        timestamp: new Date(),
        isEdited: false
      };

      // Store message
      if (!meetingChats.has(meetingId)) {
        meetingChats.set(meetingId, []);
      }
      meetingChats.get(meetingId).push(message);

      // Broadcast to meeting participants
      socket.to(meetingId).emit('meeting:chat:message', message);

      console.log(`In-meeting chat message sent in meeting ${meetingId} by ${socket.user.name}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to send chat message', code: 'MEETING_CHAT_SEND_ERROR' });
    }
  });

  socket.on('meeting:chat:typing', (data) => {
    try {
      const { meetingId, isTyping } = data;
      const meeting = meetings.get(meetingId);
      
      if (!meeting) return;

      if (!meetingTypingUsers.has(meetingId)) {
        meetingTypingUsers.set(meetingId, new Set());
      }

      if (isTyping) {
        meetingTypingUsers.get(meetingId).add(socket.userId);
      } else {
        meetingTypingUsers.get(meetingId).delete(socket.userId);
      }

      // Broadcast to other participants
      socket.to(meetingId).emit('meeting:chat:typing', {
        meetingId,
        userId: socket.userId,
        userName: socket.user.name,
        isTyping
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to update typing status', code: 'MEETING_CHAT_TYPING_ERROR' });
    }
  });

  socket.on('meeting:chat:fetch', (meetingId) => {
    try {
      const messages = meetingChats.get(meetingId) || [];
      socket.emit('meeting:chat:history', messages);
    } catch (error) {
      socket.emit('error', { message: 'Failed to fetch chat history', code: 'MEETING_CHAT_FETCH_ERROR' });
    }
  });

  // Calendar event handlers
  socket.on('meeting:event:create', (data) => {
    try {
      const event = {
        id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      calendarEvents.set(event.id, event);

      // Notify all connected users
      io.emit('meeting:event:created', event);

      console.log(`Calendar event created: ${event.title} by ${socket.user.name}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to create event', code: 'EVENT_CREATE_ERROR' });
    }
  });

  socket.on('meeting:event:update', (data) => {
    try {
      const event = {
        ...data,
        updatedAt: new Date()
      };

      calendarEvents.set(event.id, event);

      // Notify all connected users
      io.emit('meeting:event:updated', event);

      console.log(`Calendar event updated: ${event.title} by ${socket.user.name}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to update event', code: 'EVENT_UPDATE_ERROR' });
    }
  });

  socket.on('meeting:event:delete', (eventId) => {
    try {
      calendarEvents.delete(eventId);

      // Notify all connected users
      io.emit('meeting:event:deleted', eventId);

      console.log(`Calendar event deleted: ${eventId} by ${socket.user.name}`);
    } catch (error) {
      socket.emit('error', { message: 'Failed to delete event', code: 'EVENT_DELETE_ERROR' });
    }
  });

  socket.on('meeting:event:fetch', (data) => {
    try {
      const { startDate, endDate } = data;
      const events = Array.from(calendarEvents.values()).filter(event => {
        const eventStart = new Date(event.startDate);
        const eventEnd = new Date(event.endDate);
        return (eventStart >= startDate && eventStart <= endDate) ||
               (eventEnd >= startDate && eventEnd <= endDate) ||
               (eventStart <= startDate && eventEnd >= endDate);
      });

      socket.emit('meeting:event:fetched', events);
    } catch (error) {
      socket.emit('error', { message: 'Failed to fetch events', code: 'EVENT_FETCH_ERROR' });
    }
  });

  socket.on('meeting:event:respond', (data) => {
    try {
      const { eventId, status } = data;
      const event = calendarEvents.get(eventId);
      
      if (event) {
        const participant = event.participants.find(p => p.id === socket.userId);
        if (participant) {
          participant.status = status;
          participant.responseDate = new Date();
          event.updatedAt = new Date();
          calendarEvents.set(eventId, event);

          // Notify all connected users
          io.emit('meeting:event:updated', event);

          console.log(`${socket.user.name} responded ${status} to event ${event.title}`);
        }
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to respond to event', code: 'EVENT_RESPOND_ERROR' });
    }
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

// File upload API routes
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileData = {
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      downloadUrl: `/uploads/${req.file.filename}`,
      uploadedAt: new Date()
    };

    res.json({ success: true, file: fileData });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

app.get('/api/files/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'File download failed' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connectedUsers: connectedUsers.size,
    channels: channels.size,
    messages: Array.from(messages.values()).reduce((total, msgs) => total + msgs.length, 0),
    meetings: meetings.size,
    meetingChats: Array.from(meetingChats.values()).reduce((total, msgs) => total + msgs.length, 0),
    calendarEvents: calendarEvents.size
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});

module.exports = { app, server, io };
 7cb9e86b58b71003739fa458087290e10e54c1ae
