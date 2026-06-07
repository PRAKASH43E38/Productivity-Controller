const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://sprakax001_db-PXOS:MLLVXCa9v1qDd7W5@productivexos.cx54iti.mongodb.net/ProductiveXOS?retryWrites=true&w=majority';

console.log('Connecting to MongoDB...');
mongoose.connect(mongoURI)
  .then(() => console.log('Successfully connected to MongoDB!'))
  .catch(err => console.error('MongoDB connection error:', err));

// Storage Schema
const StorageSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true, minimize: false });

const StorageModel = mongoose.model('Storage', StorageSchema);

// REST API Endpoints
// Get all stored data keys
app.get('/api/data', async (req, res) => {
  try {
    const items = await StorageModel.find({});
    const responseData = {};
    items.forEach(item => {
      responseData[item.key] = item.value;
    });
    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upsert a data key
app.post('/api/data', async (req, res) => {
  const { key, value } = req.body;
  if (!key) {
    return res.status(400).json({ success: false, error: 'Key is required' });
  }
  try {
    const updatedItem = await StorageModel.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, data: updatedItem });
  } catch (error) {
    console.error(`Error saving data for ${key}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset database collection
app.post('/api/reset', async (req, res) => {
  try {
    await StorageModel.deleteMany({});
    res.json({ success: true, message: 'All storage collection data deleted' });
  } catch (error) {
    console.error('Error resetting collection:', error);
    res.status(500).json({ success: false, error: error.message });
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
