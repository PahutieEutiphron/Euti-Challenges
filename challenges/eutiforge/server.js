const express = require('express');
const crypto = require('crypto');
const path = require('path');
const { generateKeys } = require('./utils/keys');
const { initDatabase } = require('./db/database');

// Generate RSA keys on first run
generateKeys();

// Initialize database and seed data
initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(express.json());

// Realistic response headers
app.use((req, res, next) => {
  res.set({
    'X-Powered-By': 'EutiForge/2.1.3',
    'X-Request-Id': crypto.randomUUID(),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Cache-Control': 'no-store'
  });
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// --- API Routes ---
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/creators', require('./routes/creators'));
app.use('/api/v1/requests', require('./routes/requests'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/profile', require('./routes/profile'));

// SPA-style fallback for HTML pages
app.get('/:page.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', `${req.params.page}.html`));
});

app.listen(PORT, () => {
  console.log(`\n  EutiForge v2.1.3`);
  console.log(`  Running on http://localhost:${PORT}\n`);
});
