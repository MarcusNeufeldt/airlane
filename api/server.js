require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const consolidatedHandler = require('./consolidated');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Signavio Process Pipeline Creator API',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      'GET /health',
      'GET /debug',
      'POST /generate-process',
      'POST /analyze-process', 
      'POST /chat',
      'GET /diagrams',
      'POST /diagrams',
      'GET /diagram?id=...',
      'PUT /diagram?id=...',
      'DELETE /diagram?id=...',
      'GET /diagram-chat?id=...',
      'POST /diagram-chat?id=...',
      'DELETE /diagram-chat?id=...'
    ]
  });
});

// Route all API requests through the consolidated handler
app.use('/', async (req, res) => {
  try {
    await consolidatedHandler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Signavio Process Pipeline Creator API server running on port ${PORT}`);
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🐛 Debug info: http://localhost:${PORT}/debug`);
});