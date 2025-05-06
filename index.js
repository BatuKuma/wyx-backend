const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('./models/User');
const Post = require('./models/Post');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB-Verbindung herstellen
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB verbunden"))
.catch((err) => console.error("❌ MongoDB Fehler:", err));

const JWT_SECRET = process.env.JWT_SECRET;
const upload = multer({ dest: 'uploads/' });

let notificationStore = {}; // In-Memory-Speicher

// Middleware zur Authentifizierung
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Wyx-Status starten oder beenden
app.post('/api/users/wyx', verifyToken, async (req, res) => {
  const user = await User.findById(req.user.id).populate('friends');
  const active = req.body.active;
  const message = active ? `${user.username} ist grad am Wyxen hihi` : `${user.username} kam sah und siegte`;

  // Benachrichtigung an Freunde speichern
  user.friends.forEach(friend => {
    if (!notificationStore[friend._id]) {
      notificationStore[friend._id] = [];
    }
    notificationStore[friend._id].push(message);
  });

  user.isWyxing = active;
  await user.save();

  res.json({ status: active ? 'started' : 'stopped' });
});

// Benutzerbenachrichtigungen abholen
app.get('/api/users/notifications', verifyToken, async (req, res) => {
  const notifications = notificationStore[req.user.id] || [];
  notificationStore[req.user.id] = []; // nach dem Abruf leeren
  res.json(notifications);
});

// Server starten
app.listen(5000, () => {
  console.log('✅ Wyx Backend läuft auf Port 5000');
});
