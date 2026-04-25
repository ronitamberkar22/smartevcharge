/**
 * SmartEVCharge — Backend Server v2.0
 * Node.js + Express + Nodemailer
 *
 * Run:  npm install  →  node server.js
 * URL:  http://localhost:3001
 */

require('dotenv').config(); // ← loads .env file automatically

const express    = require('express');
const cors       = require('cors');
const fetch      = require('node-fetch');
const nodemailer = require('nodemailer');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

const OCM_API_KEY = process.env.OCM_API_KEY || '772e5038-1cf9-4e26-ac45-3371dc1fe163';
const OCM_BASE    = 'https://api.openchargemap.io/v3/poi/';
const GMAIL_USER  = process.env.GMAIL_USER || 'smartev4321@gmail.com';
const GMAIL_PASS  = process.env.GMAIL_PASS || '';

app.use(cors({ origin: function(o,cb){ cb(null,true); }, methods:['GET','POST','OPTIONS'], allowedHeaders:['Content-Type'] }));
app.use(express.json());
app.options('*', cors());
app.use(express.static(path.join(__dirname, '..')));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: GMAIL_USER, pass: GMAIL_PASS },
});

app.get('/api/health', (req, res) => {
  res.json({ status:'ok', service:'SmartEVCharge Backend v2.0', email: GMAIL_PASS ? 'configured' : 'not configured' });
});

app.post('/api/send-email', async (req, res) => {
  const { to, customerName, bookingId, station, area, date, slot, charger, amount, payMethod } = req.body;
  if (!to) return res.status(400).json({ error: 'Recipient email required' });
  if (!GMAIL_PASS) return res.status(503).json({ error:'Email not configured', hint:'Add GMAIL_PASS to .env and restart server' });

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:32px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#16161f;border-radius:16px;border:1px solid rgba(0,245,160,0.15);overflow:hidden;max-width:600px;width:100%;">
<tr><td style="background:linear-gradient(135deg,#0d1f14,#0a1520);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(0,245,160,0.15);">
  <p style="margin:0;font-size:28px;font-weight:900;color:#00f5a0;letter-spacing:3px;">⚡ SMARTEVCHARGE</p>
  <p style="margin:4px 0 0;font-size:11px;color:#5a5a72;letter-spacing:3px;text-transform:uppercase;">Smart EV Charging Network</p>
</td></tr>
<tr><td style="padding:32px 40px 24px;text-align:center;">
  <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f0f0f5;">Booking Confirmed! ⚡</p>
  <p style="margin:0 0 16px;color:#9090a8;font-size:14px;">Your EV charging slot is reserved. See you there!</p>
  <div style="display:inline-block;background:rgba(0,245,160,0.1);border:1px solid rgba(0,245,160,0.25);border-radius:10px;padding:8px 20px;">
    <span style="font-size:12px;color:#9090a8;">Booking ID: </span>
    <span style="font-size:15px;font-weight:700;color:#00f5a0;font-family:monospace;">${bookingId||'—'}</span>
  </div>
</td></tr>
<tr><td style="padding:0 40px 32px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#111118;border-radius:12px;border:1px solid rgba(255,255,255,0.06);overflow:hidden;">
    <tr><td colspan="2" style="padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:11px;font-weight:700;color:#00f5a0;letter-spacing:1.5px;text-transform:uppercase;">Booking Details</td></tr>
    <tr style="border-bottom:1px solid rgba(255,255,255,0.04);"><td style="padding:11px 20px;font-size:13px;color:#9090a8;width:130px;">👤 Customer</td><td style="padding:11px 20px;font-size:13px;color:#f0f0f5;font-weight:500;">${customerName||'—'}</td></tr>
    <tr style="border-bottom:1px solid rgba(255,255,255,0.04);"><td style="padding:11px 20px;font-size:13px;color:#9090a8;">📍 Station</td><td style="padding:11px 20px;font-size:13px;color:#f0f0f5;font-weight:500;">${station||'—'}</td></tr>
    <tr style="border-bottom:1px solid rgba(255,255,255,0.04);"><td style="padding:11px 20px;font-size:13px;color:#9090a8;">🗺 Location</td><td style="padding:11px 20px;font-size:13px;color:#f0f0f5;">${area||'—'}</td></tr>
    <tr style="border-bottom:1px solid rgba(255,255,255,0.04);"><td style="padding:11px 20px;font-size:13px;color:#9090a8;">📅 Date</td><td style="padding:11px 20px;font-size:13px;color:#f0f0f5;">${date||'—'}</td></tr>
    <tr style="border-bottom:1px solid rgba(255,255,255,0.04);"><td style="padding:11px 20px;font-size:13px;color:#9090a8;">⏰ Time Slot</td><td style="padding:11px 20px;font-size:13px;color:#f0f0f5;">${slot||'—'}</td></tr>
    <tr style="border-bottom:1px solid rgba(255,255,255,0.04);"><td style="padding:11px 20px;font-size:13px;color:#9090a8;">⚡ Charger</td><td style="padding:11px 20px;font-size:13px;color:#f0f0f5;">${charger||'—'}</td></tr>
    <tr style="border-bottom:1px solid rgba(255,255,255,0.04);"><td style="padding:11px 20px;font-size:13px;color:#9090a8;">💳 Payment</td><td style="padding:11px 20px;font-size:13px;color:#f0f0f5;">${payMethod||'—'}</td></tr>
    <tr style="border-bottom:1px solid rgba(255,255,255,0.04);"><td style="padding:11px 20px;font-size:13px;color:#9090a8;">💰 Amount</td><td style="padding:11px 20px;font-size:14px;font-weight:700;color:#00f5a0;">${amount||'—'}</td></tr>
    <tr><td style="padding:11px 20px;font-size:13px;color:#9090a8;">✅ Status</td><td style="padding:11px 20px;"><span style="background:rgba(0,245,160,0.15);color:#00f5a0;font-size:11px;font-weight:700;padding:3px 10px;border-radius:8px;">CONFIRMED</span></td></tr>
  </table>
</td></tr>
<tr><td style="padding:0 40px 32px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(0,212,255,0.06);border:1px solid rgba(0,212,255,0.15);border-radius:12px;"><tr><td style="padding:16px 20px;">
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#00d4ff;">📋 What to bring</p>
    <p style="margin:0;color:#9090a8;font-size:13px;line-height:1.8;">• This email or your Booking ID<br>• Your EV vehicle &amp; charging cable<br>• Arrive 5 minutes before your slot</p>
  </td></tr></table>
</td></tr>
<tr><td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
  <p style="margin:0 0 6px;font-size:12px;color:#5a5a72;">Questions? Contact us at</p>
  <a href="mailto:${GMAIL_USER}" style="color:#00f5a0;font-size:13px;text-decoration:none;">${GMAIL_USER}</a>
  <p style="margin:10px 0 0;font-size:11px;color:#3a3a52;">© ${new Date().getFullYear()} SmartEVCharge · Drive electric, drive green 🌿</p>
</td></tr>
</table></td></tr></table>
</body></html>`;

  try {
    const info = await transporter.sendMail({
      from: `"SmartEVCharge ⚡" <${GMAIL_USER}>`,
      to,
      subject: `⚡ Booking Confirmed — ${bookingId||'SmartEVCharge'}`,
      text: `SmartEVCharge — Booking Confirmed!\nID: ${bookingId}\nStation: ${station}\nDate: ${date} ${slot}\nAmount: ${amount}\nStatus: CONFIRMED`,
      html,
    });
    console.log(`[EMAIL] ✅ Sent to ${to} — ${info.messageId}`);
    return res.json({ success:true, messageId:info.messageId });
  } catch (err) {
    console.error('[EMAIL] ❌ Error:', err.message);
    const hint = err.message.includes('535') ? 'Wrong App Password' :
                 err.message.includes('534') ? 'Enable 2-Step Verification first' : '';
    return res.status(500).json({ error:'Email failed', message:err.message, hint });
  }
});

app.get('/api/stations', async (req, res) => {
  const { lat=19.076, lng=72.877, distance=10, maxresults=40, countrycode='IN' } = req.query;
  const u = new URL(OCM_BASE);
  Object.entries({ output:'json', latitude:lat, longitude:lng, distance, distanceunit:'km', maxresults, countrycode, compact:'true', verbose:'false', key:OCM_API_KEY }).forEach(([k,v]) => u.searchParams.set(k,v));
  try {
    const r = await fetch(u.toString(), { headers:{'User-Agent':'SmartEVCharge/2.0'}, timeout:10000 });
    if (!r.ok) return res.status(502).json({ error:'OCM error', status:r.status });
    const stations = await r.json();
    return res.json({ success:true, count:stations.length, stations });
  } catch(e) { return res.status(500).json({ error:e.message }); }
});

app.listen(PORT, () => {
  console.log('\n  ⚡ SmartEVCharge Backend v2.0  →  http://localhost:' + PORT);
  console.log('  📧  Email API  →  POST http://localhost:' + PORT + '/api/send-email');
  console.log('  🗺  Stations   →  GET  http://localhost:' + PORT + '/api/stations');
  console.log(GMAIL_PASS ? '  ✅  Email ready — sending from ' + GMAIL_USER : '  ⚠️  Add GMAIL_PASS to .env to enable emails\n');
});


// ─── ADMIN AUTH & PROTECTED ROUTES ─────────────────────────────────────────

const ADMIN_CREDENTIALS = [
  { email: 'admin@smartevcharge.in',   pass: 'Admin@123',  role: 'superadmin', name: 'Super Admin' },
  { email: 'manager@smartevcharge.in', pass: 'Mgr@123',    role: 'manager',    name: 'Station Manager' },
];

// Simple in-memory token store (use Redis/JWT in production)
const adminSessions = new Map();

function generateToken() {
  return 'adm_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Middleware: verify admin token
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || !adminSessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized — admin token required' });
  }
  req.adminUser = adminSessions.get(token);
  next();
}

// Middleware: superadmin only
function requireSuperAdmin(req, res, next) {
  requireAdmin(req, res, () => {
    if (req.adminUser.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden — superadmin access required' });
    }
    next();
  });
}

// POST /api/admin/login
app.post('/api/admin/login', (req, res) => {
  const { email, pass } = req.body;
  const admin = ADMIN_CREDENTIALS.find(a => a.email === email && a.pass === -);
  if (!admin) {
    console.log('[ADMIN] Failed login attempt:', email);
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  const token = generateToken();
  adminSessions.set(token, { email: admin.email, role: admin.role, name: admin.name });
  console.log('[ADMIN] Login:', admin.email, '(' + admin.role + ')');
  return res.json({ success: true, token, role: admin.role, name: admin.name });
});

// POST /api/admin/logout
app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const token = req.headers['x-admin-token'];
  adminSessions.delete(token);
  console.log('[ADMIN] Logout:', req.adminUser.email);
  return res.json({ success: true });
});

// GET /api/admin/stats — dashboard stats
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  return res.json({
    success: true,
    stats: {
      totalUsers:    0,   // wire to DB in production
      totalBookings: 0,
      totalRevenue:  0,
      activeStations:7,
      activeSessions:2,
    },
    admin: req.adminUser,
  });
});

// GET /api/admin/bookings — all bookings (protected)
app.get('/api/admin/bookings', requireAdmin, (req, res) => {
  const { status, date } = req.query;
  console.log('[ADMIN] /bookings requested by', req.adminUser.email);
  return res.json({ success: true, message: 'Connect to MongoDB for live data', status, date });
});

// POST /api/admin/bookings/:id/approve — approve booking
app.post('/api/admin/bookings/:id/approve', requireAdmin, (req, res) => {
  const { id } = req.params;
  console.log('[ADMIN] Booking approved:', id, 'by', req.adminUser.email);
  return res.json({ success: true, message: 'Booking ' + id + ' approved', id });
});

// POST /api/admin/bookings/:id/cancel — cancel booking
app.post('/api/admin/bookings/:id/cancel', requireAdmin, (req, res) => {
  const { id } = req.params;
  console.log('[ADMIN] Booking cancelled:', id, 'by', req.adminUser.email);
  return res.json({ success: true, message: 'Booking ' + id + ' cancelled', id });
});

// DELETE /api/admin/bookings/:id — delete booking (superadmin only)
app.delete('/api/admin/bookings/:id', requireSuperAdmin, (req, res) => {
  const { id } = req.params;
  console.log('[ADMIN] Booking deleted:', id, 'by', req.adminUser.email);
  return res.json({ success: true, message: 'Booking ' + id + ' deleted', id });
});

// GET /api/admin/users — all users
app.get('/api/admin/users', requireAdmin, (req, res) => {
  console.log('[ADMIN] /users requested by', req.adminUser.email);
  return res.json({ success: true, message: 'Connect to MongoDB for live user data' });
});

// POST /api/admin/users — add user
app.post('/api/admin/users', requireAdmin, (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  console.log('[ADMIN] User added:', email, 'by', req.adminUser.email);
  return res.json({ success: true, message: 'User created', user: { name, email, role } });
});

// PUT /api/admin/users/:id — update user
app.put('/api/admin/users/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  console.log('[ADMIN] User updated:', id, 'by', req.adminUser.email);
  return res.json({ success: true, message: 'User ' + id + ' updated' });
});

// DELETE /api/admin/users/:id — delete user (superadmin only)
app.delete('/api/admin/users/:id', requireSuperAdmin, (req, res) => {
  const { id } = req.params;
  console.log('[ADMIN] User deleted:', id, 'by', req.adminUser.email);
  return res.json({ success: true, message: 'User ' + id + ' deleted' });
});

// GET /api/admin/stations — all stations
app.get('/api/admin/stations', requireAdmin, (req, res) => {
  return res.json({ success: true, message: 'Connect to MongoDB for live station data' });
});

// POST /api/admin/stations — add station
app.post('/api/admin/stations', requireAdmin, (req, res) => {
  const { name, area, ac, dc } = req.body;
  if (!name) return res.status(400).json({ error: 'Station name required' });
  console.log('[ADMIN] Station added:', name, 'by', req.adminUser.email);
  return res.json({ success: true, message: 'Station created', station: { name, area, ac, dc } });
});

// PUT /api/admin/stations/:id — update station
app.put('/api/admin/stations/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  console.log('[ADMIN] Station updated:', id, 'by', req.adminUser.email);
  return res.json({ success: true, message: 'Station ' + id + ' updated' });
});

// DELETE /api/admin/stations/:id — delete station (superadmin only)
app.delete('/api/admin/stations/:id', requireSuperAdmin, (req, res) => {
  const { id } = req.params;
  console.log('[ADMIN] Station deleted:', id, 'by', req.adminUser.email);
  return res.json({ success: true, message: 'Station ' + id + ' deleted' });
});

console.log('  🛡️  Admin API routes registered (protected)');
