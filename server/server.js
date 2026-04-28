const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');
const messageRoutes = require('./routes/messages');
const staffRoutes = require('./routes/staff');
const alertRoutes = require('./routes/alerts');

app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/alerts', alertRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'CrisisCore API is operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const clientBuild = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientBuild));
  // SPA fallback — all non-API routes serve index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/crisiscore');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    await seedInitialData();
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.log('⚠️  Running in demo mode (without MongoDB)');
  }
};

// Seed initial staff data
const seedInitialData = async () => {
  const User = require('./models/User');
  const count = await User.countDocuments();
  if (count === 0) {
    const bcrypt = require('bcryptjs');
    const staff = [
      { staffId: 'MGR001', name: 'Sarah Chen', role: 'manager', email: 'sarah.chen@grandhorizon.com', password: await bcrypt.hash('crisis2024', 10), department: 'Management', phone: '+1-555-0101', status: 'available' },
      { staffId: 'SEC001', name: 'James Okafor', role: 'security', email: 'j.okafor@grandhorizon.com', password: await bcrypt.hash('crisis2024', 10), department: 'Security', phone: '+1-555-0102', status: 'available' },
      { staffId: 'SEC002', name: 'Maria Santos', role: 'security', email: 'm.santos@grandhorizon.com', password: await bcrypt.hash('crisis2024', 10), department: 'Security', phone: '+1-555-0103', status: 'available' },
      { staffId: 'MED001', name: 'Dr. Ahmed Hassan', role: 'medical', email: 'a.hassan@grandhorizon.com', password: await bcrypt.hash('crisis2024', 10), department: 'Medical', phone: '+1-555-0104', status: 'available' },
      { staffId: 'FD001', name: 'Lisa Park', role: 'frontdesk', email: 'l.park@grandhorizon.com', password: await bcrypt.hash('crisis2024', 10), department: 'Front Desk', phone: '+1-555-0105', status: 'available' },
      { staffId: 'FD002', name: 'Carlos Rivera', role: 'frontdesk', email: 'c.rivera@grandhorizon.com', password: await bcrypt.hash('crisis2024', 10), department: 'Front Desk', phone: '+1-555-0106', status: 'available' },
      { staffId: 'HK001', name: 'Priya Patel', role: 'housekeeping', email: 'p.patel@grandhorizon.com', password: await bcrypt.hash('crisis2024', 10), department: 'Housekeeping', phone: '+1-555-0107', status: 'available' },
      { staffId: 'ENG001', name: 'Robert Kim', role: 'engineering', email: 'r.kim@grandhorizon.com', password: await bcrypt.hash('crisis2024', 10), department: 'Engineering', phone: '+1-555-0108', status: 'available' },
    ];
    await User.insertMany(staff);
    console.log('✅ Initial staff data seeded');
  }
};

// =================== SOCKET.IO ===================
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join', ({ userId, role, name }) => {
    connectedUsers.set(socket.id, { userId, role, name, socketId: socket.id });
    socket.join('staff');
    if (role === 'manager') socket.join('management');
    if (role === 'security') socket.join('security');
    if (role === 'medical') socket.join('medical');
    socket.emit('joined', { message: 'Connected to CrisisCore network', onlineCount: connectedUsers.size });
    io.emit('staffOnline', { count: connectedUsers.size, users: Array.from(connectedUsers.values()) });
  });

  socket.on('joinGuest', ({ roomNumber }) => {
    connectedUsers.set(socket.id, { role: 'guest', roomNumber, socketId: socket.id });
    socket.join('guests');
    socket.emit('joined', { message: 'Connected to guest portal' });
  });

  socket.on('newMessage', (data) => {
    io.to(data.channel || 'staff').emit('message', data);
  });

  socket.on('incidentUpdate', (data) => {
    io.emit('incidentUpdated', data);
  });

  socket.on('distressSignal', (data) => {
    io.to('staff').emit('guestDistress', data);
  });

  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
    io.emit('staffOnline', { count: connectedUsers.size, users: Array.from(connectedUsers.values()) });
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🚀 CrisisCore Server running on port ${PORT}`);
    console.log(`📡 Socket.IO ready`);
    console.log(`🌐 API: http://localhost:${PORT}/api`);
    console.log(`❤️  Health: http://localhost:${PORT}/api/health\n`);
  });
});

module.exports = { app, io };
