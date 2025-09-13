// server.js
// Run: npm install express mongoose cors dotenv

require('dotenv').config(); // load MONGO_URI from .env
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MongoDB Atlas Connection =====
const uri = process.env.MONGO_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ===== Schema & Model =====
const locationSchema = new mongoose.Schema({
  token: { type: String },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  accuracy: { type: Number },
  timestamp: { type: Date, default: Date.now }
});

const Location = mongoose.model("Location", locationSchema);

// ===== Middleware =====
app.use(cors()); // allow cross-origin requests
app.use(express.json()); // parse JSON
app.use(express.static(path.join(__dirname, 'public')));

// ===== API Routes =====

// Save location
app.post('/api/receive-location', async (req, res) => {
  try {
    const { token, latitude, longitude, accuracy, timestamp } = req.body;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ ok: false, error: 'invalid lat/lon' });
    }

    const record = new Location({
      token,
      latitude,
      longitude,
      accuracy,
      timestamp: timestamp ? new Date(timestamp) : Date.now()
    });

    await record.save();
    console.log("📌 Saved location:", record);

    res.json({ ok: true, id: record._id });
  } catch (err) {
    console.error("❌ Error saving location:", err);
    res.status(500).json({ ok: false, error: "server error" });
  }
});

// Get locations
app.get('/api/locations', async (req, res) => {
  try {
    const token = req.query.token;
    let locations;
    if (token) {
      locations = await Location.find({ token });
    } else {
      locations = await Location.find();
    }
    res.json(locations);
  } catch (err) {
    res.status(500).json({ ok: false, error: "server error" });
  }
});

// Clear all locations
app.post('/api/clear', async (req, res) => {
  try {
    await Location.deleteMany({});
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: "server error" });
  }
});

// ===== Start Server =====
app.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));
