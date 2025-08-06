const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'MailoReply AI Simple Server',
    timestamp: new Date().toISOString(),
    port: port
  });
});

// API demo endpoint
app.get('/api/demo', (req, res) => {
  res.json({ 
    message: 'Hello from MailoReply AI API!',
    timestamp: new Date().toISOString(),
    port: port
  });
});

// Serve static files from dist/spa
const distPath = path.join(__dirname, 'dist', 'spa');
app.use(express.static(distPath));

// Handle React Router routes - serve index.html for non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return res.status(404).json({ error: 'Route not found' });
  }
  
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server on all interfaces
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 MailoReply AI Simple Server running on port ${port}`);
  console.log(`📱 Frontend: http://0.0.0.0:${port}`);
  console.log(`🔧 API: http://0.0.0.0:${port}/api`);
  console.log(`🌐 Ready for Emergent preview access`);
  console.log(`✅ Health Check: http://0.0.0.0:${port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully'); 
  process.exit(0);
});