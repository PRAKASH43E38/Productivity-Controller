const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3030;
const DB_FILE = path.join(__dirname, 'database.db');

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Initialize SQLite database connection
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Successfully connected to SQLite database: database.db');
  }
});

// Create table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS store (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating store table:', err.message);
    } else {
      console.log('Database store table verified/created.');
    }
  });
});

// REST API Endpoints
// Get all stored data keys
app.get('/api/data', (req, res) => {
  db.all(`SELECT key, value FROM store`, [], (err, rows) => {
    if (err) {
      console.error('Error loading data from SQL:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
    
    const responseData = {};
    rows.forEach(row => {
      try {
        responseData[row.key] = JSON.parse(row.value);
      } catch (e) {
        responseData[row.key] = row.value;
      }
    });
    
    res.json({ success: true, data: responseData });
  });
});

// Upsert a data key
app.post('/api/data', (req, res) => {
  const { key, value } = req.body;
  if (!key) {
    return res.status(400).json({ success: false, error: 'Key is required' });
  }
  
  const valueStr = JSON.stringify(value);
  
  db.run(
    `INSERT INTO store (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, valueStr],
    function(err) {
      if (err) {
        console.error(`Error saving data for key ${key}:`, err.message);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, message: 'Data saved successfully' });
    }
  );
});

// Reset database collection
app.post('/api/reset', (req, res) => {
  db.run(`DELETE FROM store`, [], function(err) {
    if (err) {
      console.error('Error resetting database table:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: 'All database data deleted' });
  });
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
