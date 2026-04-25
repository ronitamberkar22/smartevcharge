// filepath: backend/server.js
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

// Load env vars
require('dotenv').config({ path: __dirname + '/.env' });

// Connect to database
connectDB();

// Initialize Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Strip .html from any URL and redirect to clean route ──
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    const cleanPath = req.path.slice(0, -5); // remove .html
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    return res.redirect(301, cleanPath + qs);
  }
  next();
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stations', require('./routes/stations'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/slots', require('./routes/slots'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/send-email', require('./routes/email'));

// OpenChargeMap proxy
app.get('/api/ocm/stations', async (req, res) => {
  try {
    const { lat = 19.076, lng = 72.877, distance = 30, maxresults = 200 } = req.query;
    const OCM_KEY = process.env.OCM_API_KEY;

    const url = `https://api.openchargemap.io/v3/poi/?output=json&countrycode=IN&latitude=${lat}&longitude=${lng}&distance=${distance}&distanceunit=KM&maxresults=${maxresults}&compact=true&verbose=false&key=${OCM_KEY}`;

    const fetch = require('node-fetch');
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });

    if (!resp.ok) throw new Error('OCM API error: ' + resp.status);

    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('OCM proxy error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// OpenStreetMap Overpass proxy
app.get('/api/osm/stations', async (req, res) => {
  try {
    const { lat = 19.076, lng = 72.877, distance = 30 } = req.query;
    const radiusM = Math.min(parseFloat(distance) * 1000, 80000);

    const query = `[out:json][timeout:25];node["amenity"="charging_station"](around:${radiusM},${lat},${lng});out body;`;

    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
    ];

    const fetch = require('node-fetch');
    let lastErr;

    for (const ep of endpoints) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 22000);

        const resp = await fetch(`${ep}?data=${encodeURIComponent(query)}`, {
          headers: { 'Accept': 'application/json' },
          signal: ctrl.signal
        });

        clearTimeout(timer);

        if (!resp.ok) throw new Error('HTTP ' + resp.status);

        const data = await resp.json();
        return res.json(data.elements || []);
      } catch (e) {
        lastErr = e;
        console.warn('Overpass failed:', ep, e.message);
      }
    }

    throw lastErr || new Error('All Overpass mirrors failed');
  } catch (err) {
    console.error('OSM proxy error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SmartEVCharge API is running' });
});


// ── User Routes ──────────────────────────────────────
app.get('/', (req, res) => res.redirect('/login'));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../frontend/user/login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, '../frontend/user/dashboard.html')));
app.get('/stations', (req, res) => res.sendFile(path.join(__dirname, '../frontend/user/stations.html')));
app.get('/booking', (req, res) => res.sendFile(path.join(__dirname, '../frontend/user/booking.html')));
app.get('/payment', (req, res) => res.sendFile(path.join(__dirname, '../frontend/user/payment.html')));
app.get('/confirmation', (req, res) => res.sendFile(path.join(__dirname, '../frontend/user/confirmation.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, '../frontend/user/profile.html')));
app.get('/station-detail', (req, res) => res.sendFile(path.join(__dirname, '../frontend/user/station-detail.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, '../frontend/user/about.html')));

// ── Admin Routes ─────────────────────────────────────
app.get('/admin', (req, res) => res.redirect('/admin/dashboard'));
app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, '../frontend/admin/login.html')));
app.get('/admin/dashboard', (req, res) => res.sendFile(path.join(__dirname, '../frontend/admin/dashboard.html')));
app.get('/admin/bookings', (req, res) => res.sendFile(path.join(__dirname, '../frontend/admin/bookings.html')));
app.get('/admin/stations', (req, res) => res.sendFile(path.join(__dirname, '../frontend/admin/stations.html')));
app.get('/admin/users', (req, res) => res.sendFile(path.join(__dirname, '../frontend/admin/users.html')));
app.get('/admin/revenue', (req, res) => res.sendFile(path.join(__dirname, '../frontend/admin/revenue.html')));
app.get('/admin/reports', (req, res) => res.sendFile(path.join(__dirname, '../frontend/admin/reports.html')));
app.get('/admin/settings', (req, res) => res.sendFile(path.join(__dirname, '../frontend/admin/settings.html')));


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// 404 handler (MUST BE LAST)
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('');
  console.log('  ⚡ SmartEVCharge Server Ready!');
  console.log(`  👉 Open in browser: http://localhost:${PORT}`);
  console.log('');
});

module.exports = app;