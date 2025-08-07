const http = require('http');

console.log('🚀 Starting MailoReply AI Server...');

const server = http.createServer((req, res) => {
  // Log all requests
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'MailoReply AI is running!'
    }));
    return;
  }
  
  // Main page
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MailoReply AI - Working!</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            text-align: center;
            background: rgba(255,255,255,0.1);
            padding: 50px 30px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            max-width: 500px;
            width: 100%;
        }
        h1 { font-size: 3rem; margin-bottom: 20px; }
        .status { 
            font-size: 1.5rem; 
            color: #4ade80; 
            margin: 20px 0; 
            font-weight: bold;
        }
        .info { 
            font-size: 1.1rem; 
            margin: 15px 0; 
            opacity: 0.9;
        }
        .button {
            display: inline-block;
            background: #4ade80;
            color: #1a1a2e;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            margin: 10px;
            transition: background 0.3s;
        }
        .button:hover { background: #22c55e; }
        .timestamp { 
            font-size: 0.9rem; 
            opacity: 0.7; 
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 MailoReply AI</h1>
        <div class="status">✅ PREVIEW IS WORKING!</div>
        <div class="info">AI-Powered Email Generation Platform</div>
        <div class="info">Server running on port 8080</div>
        <div class="info">
            <a href="/health" class="button">Health Check</a>
        </div>
        <div class="timestamp">
            ${new Date().toISOString()}
        </div>
    </div>
    <script>
        console.log('✅ MailoReply AI loaded successfully');
        
        // Test API
        fetch('/health')
            .then(r => r.json())
            .then(data => {
                console.log('✅ API working:', data);
            })
            .catch(err => {
                console.error('❌ API error:', err);
            });
    </script>
</body>
</html>`);
});

const PORT = 8080;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log('✅ MailoReply AI Server Started!');
  console.log(`📍 Listening on: http://${HOST}:${PORT}`);
  console.log('🌐 Emergent Preview: Ready');
  console.log('='.repeat(50));
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});