require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const { connectDB, disconnectDB } = require('./db');
const seedData = require('./seed');
const authRoutes = require('./routes/auth');
const toolRoutes = require('./routes/tools');
const bookingRoutes = require('./routes/bookings');
const statsRoutes = require('./routes/stats');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/stats', statsRoutes);

app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));

// Serve the built React app in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join(', ');
    return res.status(400).json({ message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate value: ' + Object.keys(err.keyValue).join(', ') });
  }
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5001;

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('JWT_SECRET must be set in production. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
    process.exit(1);
  }
  process.env.JWT_SECRET = 'dev-secret-change-me';
  console.warn('JWT_SECRET not set, using an insecure development secret.');
}

async function start() {
  const { memory } = await connectDB();
  if (memory) await seedData(); // temporary DB starts with demo data

  const server = app.listen(PORT, () => console.log(`ToolShare API running on http://localhost:${PORT}`));
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Close the other app or set PORT in server/.env (and update client/vite.config.js proxy).`);
    } else {
      console.error(e.message);
    }
    process.exit(1);
  });

  const shutdown = async () => {
    server.close();
    await disconnectDB().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (require.main === module) {
  start().catch((err) => {
    console.error('\nStartup failed:\n' + err.message + '\n');
    process.exit(1);
  });
}

module.exports = app;
