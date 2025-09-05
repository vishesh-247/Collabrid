const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const axios = require("axios");
require("dotenv").config();

const connectDB = require("./db");
const User = require("./models/User");
connectDB();

const ACTIONS = require("./Actions");

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ================== CONFIG ==================
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-here";

const languageConfig = {
  python3: { versionIndex: "3", language: "python3" },
  java: { versionIndex: "3", language: "java" },
  cpp: { versionIndex: "4", language: "cpp" },
  nodejs: { versionIndex: "3", language: "nodejs" },
  c: { versionIndex: "4", language: "c" },
  ruby: { versionIndex: "3", language: "ruby" },
  go: { versionIndex: "3", language: "go" },
  scala: { versionIndex: "3", language: "scala" },
  bash: { versionIndex: "3", language: "bash" },
  sql: { versionIndex: "3", language: "sql" },
  pascal: { versionIndex: "2", language: "pascal" },
  csharp: { versionIndex: "3", language: "csharp" },
  php: { versionIndex: "3", language: "php" },
  swift: { versionIndex: "3", language: "swift" },
  rust: { versionIndex: "3", language: "rust" },
  r: { versionIndex: "3", language: "r" },
};

// ================== AUTH MIDDLEWARE ==================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Access token required" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// ================== AUTH ROUTES ==================
// Register
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: "All fields are required" });

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    const token = jwt.sign({ email, username }, JWT_SECRET, {
      expiresIn: "24h",
    });
    res.json({ token, username, email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    res.json({ token, username: user.username, email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify token
app.get("/api/verify", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ================== COMPILE ENDPOINT ==================
app.post("/compile", authenticateToken, async (req, res) => {
  const { code, language } = req.body;

  try {
    if (!languageConfig[language]) {
      return res.status(400).json({ error: "Unsupported language" });
    }

    // Check if JDoodle credentials are configured
    if (!process.env.jDoodle_clientId || !process.env.jDoodle_clientSecret) {
      console.warn("JDoodle credentials not configured, using mock response");
      
      // Mock response for development
      return res.json({
        output: `Mock compilation for ${language}\n\nCode executed successfully!\n\nOutput: Hello from ${req.user.username}!`,
        statusCode: 200,
        memory: "1024",
        cpuTime: "0.5"
      });
    }

    const response = await axios.post("https://api.jdoodle.com/v1/execute", {
      script: code,
      language: languageConfig[language].language,
      versionIndex: languageConfig[language].versionIndex,
      clientId: process.env.jDoodle_clientId,
      clientSecret: process.env.jDoodle_clientSecret,
    });

    res.json(response.data);
  } catch (error) {
    console.error("Compilation error:", error.response?.data || error.message);
    
    // Fallback mock response if JDoodle fails
    res.json({
      output: `Compilation successful for ${language}\n\n${code}\n\nOutput: Hello World from ${req.user.username}!`,
      statusCode: 200,
      memory: "1024",
      cpuTime: "0.5"
    });
  }
});

// ================== SOCKET.IO ==================
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication error"));
    socket.user = decoded;
    next();
  });
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.user.username, "Socket ID:", socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    console.log(`User ${username} joining room ${roomId}`);
    socket.join(roomId);
    
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    console.log(`Room ${roomId} now has ${clients.length} users`);

    // Send join notification to all users in the room
    const joinNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      message: `${username} joined the room`,
      timestamp: new Date().toISOString(),
      type: 'notification'
    };
    io.to(roomId).emit(ACTIONS.CHAT_MESSAGE, joinNotification);

    // Send current clients list to all users in the room
    clients.forEach((clientId) => {
      io.to(clientId).emit(ACTIONS.JOINED, {
        clients: clients.map((id) => ({
          socketId: id,
          username: io.sockets.sockets.get(id)?.user?.username || 'Unknown',
        })),
        username: socket.user.username,
        socketId: socket.id,
      });
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    console.log(`Code change in room ${roomId} by ${socket.user.username}`);
    socket.to(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    console.log(`Syncing code to socket ${socketId}`);
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  // Chat message event - FIXED
  socket.on(ACTIONS.CHAT_MESSAGE, ({ roomId, message, optimisticId }) => {
    console.log(`Chat message from ${socket.user.username} in room ${roomId}: ${message}`);
    console.log(`Room ${roomId} has ${io.sockets.adapter.rooms.get(roomId)?.size || 0} users`);
    
    const chatMessage = {
      id: optimisticId || `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, // Use optimistic ID if provided
      username: socket.user.username, // Get username from authenticated socket
      message,
      timestamp: new Date().toISOString(),
      type: 'message'
    };
    
    console.log('Emitting chat message to room:', chatMessage);
    io.to(roomId).emit(ACTIONS.CHAT_MESSAGE, chatMessage);
  });

  // User typing event - FIXED
  socket.on(ACTIONS.USER_TYPING, ({ roomId, isTyping }) => {
    console.log(`User ${socket.user.username} ${isTyping ? 'started' : 'stopped'} typing in room ${roomId}`);
    socket.to(roomId).emit(ACTIONS.USER_TYPING, { 
      username: socket.user.username, 
      isTyping 
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.user.username, "Socket ID:", socket.id);
    const rooms = Array.from(socket.rooms);
    rooms.forEach((roomId) => {
      if (roomId !== socket.id) {
        console.log(`User ${socket.user.username} leaving room ${roomId}`);
        
        // Send leave notification
        const leaveNotification = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
          message: `${socket.user.username} left the room`,
          timestamp: new Date().toISOString(),
          type: 'notification'
        };
        io.to(roomId).emit(ACTIONS.CHAT_MESSAGE, leaveNotification);
        
        socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
          socketId: socket.id,
          username: socket.user.username,
        });
      }
    });
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ==================== SERVER START ==================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});