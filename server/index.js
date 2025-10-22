require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();



// for middleware
app.use(express.json());
app.use(cors());

// connect to MongoDB
const mongoUri = process.env.MONGO_URI || '';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch((err) => {
  console.error('MongoDB connection error:', err.message);
});

// basic route
app.get('/', (req, res) => res.send('Queue-our-code API running'));

const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
const usersRoutes = require('./routes/users'); 
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes); 

// server start 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
