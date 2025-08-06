import express from 'express';

const app = express();
const port = process.env.PORT || 8080;

// Basic health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Test server is running',
    timestamp: new Date().toISOString(),
    port: port
  });
});

// Simple HTML page
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>MailoReply AI - Test Page</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        h1 { font-size: 3em; margin-bottom: 20px; }
        p { font-size: 1.2em; margin-bottom: 30px; }
        .status { 
            background: rgba(0,255,0,0.2); 
            padding: 15px; 
            border-radius: 10px;
            margin: 20px 0;
        }
        .info {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: left;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 MailoReply AI</h1>
        <p>AI-Powered Email Generation Platform</p>
        
        <div class="status">
            ✅ Server is running successfully on port ${port}!
        </div>
        
        <div class="info">
            <h3>🔧 System Status:</h3>
            <ul>
                <li>✅ Express Server: Running</li>
                <li>✅ Port: ${port}</li>
                <li>✅ Timestamp: ${new Date().toISOString()}</li>
                <li>✅ External Access: Configured</li>
            </ul>
        </div>
        
        <div class="info">
            <h3>🌐 Endpoints:</h3>
            <ul>
                <li><a href="/health" style="color: #ffffff;">Health Check: /health</a></li>
                <li><a href="/api/demo" style="color: #ffffff;">API Demo: /api/demo</a></li>
            </ul>
        </div>
        
        <p><strong>🎉 Your Emergent preview is working!</strong></p>
    </div>
    
    <script>
        console.log('🚀 MailoReply AI Test Page Loaded');
        console.log('✅ JavaScript is working');
        
        // Test API connectivity
        fetch('/api/demo')
            .then(response => response.json())
            .then(data => {
                console.log('✅ API Test Success:', data);
            })
            .catch(error => {
                console.log('❌ API Test Failed:', error);
            });
    </script>
</body>
</html>
  `);
});

// API demo endpoint
app.get('/api/demo', (req, res) => {
  res.json({
    message: 'MailoReply AI API is working!',
    timestamp: new Date().toISOString(),
    port: port,
    status: 'success'
  });
});

// Catch-all for other routes
app.get('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 MailoReply AI Test Server`);
  console.log(`📍 Running on: http://0.0.0.0:${port}`);  
  console.log(`🌐 External URL: Ready for Emergent preview`);
  console.log(`✅ Health Check: http://0.0.0.0:${port}/health`);
  console.log(`🔧 API Demo: http://0.0.0.0:${port}/api/demo`);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down gracefully');
  process.exit(0);
});