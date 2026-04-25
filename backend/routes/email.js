// filepath: backend/routes/email.js
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// POST /api/send-email
router.post('/', async (req, res) => {
  const { to, customerName, bookingId, station, date, slot, charger, amount, payMethod } = req.body;

  if (!to) return res.status(400).json({ success: false, error: 'Recipient email is required' });

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0a0f; color: #f0f0f5; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 30px auto; background: #16161f; border-radius: 18px; overflow: hidden; border: 1px solid rgba(0,245,160,0.15); }
    .header { background: linear-gradient(135deg, #00f5a0, #00d4ff); padding: 32px 28px; text-align: center; }
    .header h1 { margin: 0; font-size: 26px; color: #0a0a0f; font-weight: 800; letter-spacing: 2px; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #0a0a0f; opacity: 0.75; }
    .icon-row { text-align: center; margin: -28px 0 20px; }
    .icon-circle { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: #0a0a0f; border-radius: 50%; border: 3px solid #00f5a0; font-size: 24px; }
    .body { padding: 24px 28px; }
    .greeting { font-size: 16px; margin-bottom: 18px; }
    .booking-id { display: inline-block; background: rgba(0,245,160,0.12); border: 1px solid rgba(0,245,160,0.25); border-radius: 8px; padding: 8px 16px; font-size: 18px; font-weight: 700; color: #00f5a0; letter-spacing: 2px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13px; }
    td:first-child { color: #9090a8; width: 45%; }
    td:last-child { color: #f0f0f5; font-weight: 500; }
    .status-badge { display: inline-block; background: rgba(0,245,160,0.15); color: #00f5a0; border-radius: 20px; padding: 3px 12px; font-size: 12px; font-weight: 600; }
    .footer { text-align: center; padding: 18px 28px; background: #111118; color: #5a5a72; font-size: 11px; border-top: 1px solid rgba(255,255,255,0.05); }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ SMARTEVCHARGE</h1>
      <p>Booking Confirmation</p>
    </div>
    <div class="body">
      <p class="greeting">Hi <strong>${customerName || 'there'}</strong>,</p>
      <p style="color:#9090a8;font-size:13px;margin-bottom:16px;">Your EV charging slot has been confirmed! Here are your booking details:</p>
      <div style="text-align:center;margin-bottom:20px;">
        <div class="booking-id">🎫 ${bookingId}</div>
      </div>
      <table>
        <tr><td>📍 Station</td><td>${station || '—'}</td></tr>
        <tr><td>📅 Date</td><td>${date || '—'}</td></tr>
        <tr><td>⏰ Time Slot</td><td>${slot || '—'}</td></tr>
        <tr><td>🔌 Charger Type</td><td>${charger || '—'}</td></tr>
        <tr><td>⏱ Duration</td><td>1 Hour</td></tr>
        <tr><td>💳 Payment</td><td>${payMethod || '—'}</td></tr>
        <tr><td>💰 Amount Paid</td><td style="color:#00f5a0;font-weight:700;">${amount || '₹0'}</td></tr>
        <tr><td>✅ Status</td><td><span class="status-badge">Confirmed</span></td></tr>
      </table>
      <p style="font-size:12px;color:#5a5a72;">Please arrive 5 minutes before your slot. Bring your booking ID for verification.</p>
    </div>
    <div class="footer">© ${new Date().getFullYear()} SmartEVCharge · Drive electric, drive green 🌿</div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"SmartEVCharge" <${process.env.GMAIL_USER}>`,
      to,
      subject: `⚡ Booking Confirmed — ${bookingId} | SmartEVCharge`,
      html,
    });

    res.json({ success: true, message: 'Email sent successfully' });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
