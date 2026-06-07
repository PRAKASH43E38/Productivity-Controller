const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3030;
const DB_FILE = path.join(__dirname, 'db.json');

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Helper function to read DB
function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(raw || '{}');
    }
  } catch (e) {
    console.error('Error reading JSON DB file:', e);
  }
  return {};
}

// Helper function to write DB
function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Error writing to JSON DB file:', e);
    return false;
  }
}

// REST API Endpoints
// Get all stored data keys
app.get('/api/data', (req, res) => {
  const data = readDb();
  res.json({ success: true, data });
});

// Upsert a data key
app.post('/api/data', (req, res) => {
  const { key, value } = req.body;
  if (!key) {
    return res.status(400).json({ success: false, error: 'Key is required' });
  }
  
  const data = readDb();
  data[key] = value;
  
  if (writeDb(data)) {
    res.json({ success: true, message: 'Data saved successfully' });
  } else {
    res.status(500).json({ success: false, error: 'Failed to write to JSON file database' });
  }
});

// Reset database collection
app.post('/api/reset', (req, res) => {
  if (writeDb({})) {
    res.json({ success: true, message: 'All JSON file data deleted' });
  } else {
    res.status(500).json({ success: false, error: 'Failed to reset JSON file database' });
  }
});

// Serve static frontend files from the root directory
app.use(express.static(path.join(__dirname)));

// Route wildcard fallback (catch-all middleware)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'), (err) => {
    if (err) {
      console.error('Error sending index.html:', err);
      res.status(500).send('Error loading page: ' + err.message);
    }
  });
});

// Export the app for Vercel serverless deployment, but run app.listen locally
if (process.env.VERCEL) {
  module.exports = app;
} else {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}
