require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();


const allowedOrigins = [
  (process.env.FRONTEND_URL || '').replace(/\/$/, ''), 'https://queue-our-code.vercel.app',
  'http://localhost:3000', 'http://localhost:3001'
].filter(Boolean);

if (process.env.FRONTEND_URL_2) allowedOrigins.push(process.env.FRONTEND_URL_2.replace(/\/$/, ''));

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    console.error('Blocked CORS origin:', origin);
    return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
  },
  credentials: true, // set to true if you use cookies; otherwise false
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','Accept']
};

// for middleware
app.use(cors(corsOptions));
app.use(express.json());


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
app.use('/api/admin', require('./routes/adminProfile'));
app.use("/api/admin/auth", require("./routes/adminAuth"));




// server start 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});