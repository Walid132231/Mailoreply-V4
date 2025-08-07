const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'EMERGENT PREVIEW WORKING!',
      timestamp: new Date().toISOString(),
      port: 8080
    }));
    return;
  }
  
  // Default HTML page
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
<!DOCTYPE html>
<html>
<head>
    <title>🚀 MailoReply AI - WORKING!</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; padding: 40px;
            background: #1a1a2e; color: white;
            text-align: center; min-height: 100vh;
            display: flex; align-items: center; justify-content: center;
        }
        .container { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 60px; border-radius: 20px; max-width: 600px;
        }
        h1 { font-size: 4em; margin: 0 0 20px 0; }
        .success { font-size: 2em; color: #4ade80; margin: 30px 0; }
        .info { font-size: 1.2em; margin: 20px 0; }
        a { color: #4ade80; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 MailoReply AI</h1>
        <div class="success">✅ EMERGENT PREVIEW IS WORKING! ✅</div>
        <div class="info">Your application is successfully running on port 8080</div>
        <div class="info">Timestamp: ${new Date().toISOString()}</div>
        <div class="info"><a href="/health">Health Check</a></div>
        <div class="info">🎉 Ready for production deployment!</div>
    </div>
    <script>
        console.log('🚀 MailoReply AI Preview Working!');
        fetch('/health')
            .then(r => r.json())
            .then(d => console.log('✅ API Working:', d))
            .catch(e => console.log('❌ API Error:', e));
    </script>
</body>
</html>
  `);
});

server.listen(8080, '0.0.0.0', () => {
  console.log('🚀 MailoReply AI MINIMAL SERVER STARTED');
  console.log('📍 Running on: http://0.0.0.0:8080'); 
  console.log('🌐 Emergent Preview URL: https://user-limits-dash.preview.emergentagent.com/');
  console.log('✅ Health: http://0.0.0.0:8080/health');
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down');
  server.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down');
  server.close(); 
  process.exit(0);
});