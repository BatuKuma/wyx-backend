let notificationStore = {}; // In-Memory-Speicher

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