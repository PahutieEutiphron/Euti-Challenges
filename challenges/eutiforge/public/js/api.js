const API_BASE = '/api/v1';

async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('ef_token');

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'same-origin'
  });

  return response;
}

function getUser() {
  const raw = localStorage.getItem('ef_user');
  return raw ? JSON.parse(raw) : null;
}

function getToken() {
  return localStorage.getItem('ef_token');
}

function saveSession(token, user) {
  localStorage.setItem('ef_token', token);
  localStorage.setItem('ef_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('ef_token');
  localStorage.removeItem('ef_user');
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

function logout() {
  clearSession();
  window.location.href = '/';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
