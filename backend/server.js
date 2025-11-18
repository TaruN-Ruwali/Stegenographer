const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const steganoRoutes = require('./routes/stegano');
const cryptoRoutes = require('./routes/crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/stegano', steganoRoutes);
app.use('/api/crypto', cryptoRoutes);

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend: http://localhost:${PORT}`);
});