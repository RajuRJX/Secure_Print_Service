const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Proxy endpoint for fetching documents
app.get('/proxy', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    const response = await axios.get(url, {
      responseType: 'stream'
    });

    // Forward the content type
    res.setHeader('Content-Type', response.headers['content-type']);
    
    // Pipe the response stream to our response
    response.data.pipe(res);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 