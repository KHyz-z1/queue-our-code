require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();



// for middleware
app.use(express.json());
app.use(cors());

const allowed = [
  'http://localhost:3000',
  'https://your-vercel-domain.vercel.app',
  // optionally add your Render domain if you host any client there
];

app.use(cors({
  origin: function(origin, cb) {
    // allow requests with no origin (like mobile apps, Postman)
    if (!origin) return cb(null, true);
    if (allowed.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return cb(new Error(msg), false);
    }
    return cb(null, true);
  },
  credentials: true
}));


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
const queueRoutes = require('./routes/queue');
const printRoutes = require('./routes/print');
const path = require('path');
const staffRoutes = require('./routes/staff');
const rideRoutes = require('./routes/rides');



app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/queue', queueRoutes); 
app.use('/api/print', printRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/staff', staffRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/admin/reports', require('./routes/adminReports'));


// server start 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
