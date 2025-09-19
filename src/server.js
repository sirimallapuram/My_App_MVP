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
