/**
 * SmartEVCharge — Shared API Utility
 * Used by all frontend pages
 */

const API_URL = 'http://localhost:3000/api';

// ── API helper ──────────────────────────────────────
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    }
  });
  const data = await res.json();
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
}

// ── Auth guards ─────────────────────────────────────
function requireUserAuth() {
  const token = localStorage.getItem('token');
  if (!token) { window.location.href = '/login'; return false; }
  return true;
}

function requireAdminAuth() {
  const token = localStorage.getItem('adminToken');
  const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
  if (!token || user.role !== 'admin') {
    window.location.href = '/admin/login';
    return false;
  }
  return true;
}

// ── Get stored user ──────────────────────────────────
function getUser() {
  return JSON.parse(localStorage.getItem('user') || '{}');
}

function getAdminUser() {
  return JSON.parse(localStorage.getItem('adminUser') || '{}');
}

// ── Toast notification ───────────────────────────────
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;
  const icon = el.querySelector('i');
  const span = document.getElementById('toast-msg');
  if (span) span.textContent = msg;
  if (icon) {
    icon.className = type === 'success' ? 'fas fa-circle-check'
      : type === 'error' ? 'fas fa-circle-xmark'
      : 'fas fa-triangle-exclamation';
    icon.style.color = type === 'success' ? 'var(--neon-green, #00f5a0)'
      : type === 'error' ? '#ff4d6d'
      : '#ffd166';
  }
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 3200);
}

// ── Format helpers ───────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Status pill ──────────────────────────────────────
function pillHtml(status) {
  const map = {
    pending: 'warning', confirmed: 'info', 'in-progress': 'purple',
    completed: 'success', cancelled: 'danger', active: 'success',
    inactive: 'danger', online: 'success', offline: 'danger', maintenance: 'warning'
  };
  return `<span class="pill ${map[status] || ''}">${status}</span>`;
}
