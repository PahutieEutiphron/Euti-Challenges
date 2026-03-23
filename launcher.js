/**
 * Euti-Challenges - Unified Security Challenge Launcher
 *
 * Serves a hub UI on port 9000 where students pick a challenge.
 * Each challenge runs in its own child process on a dedicated port.
 *
 * Usage: node launcher.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const HUB_PORT = 9000;

// Challenge definitions
const challenges = {
  eutiforge: {
    name: 'EutiForge',
    port: 3000,
    dir: path.join(__dirname, 'challenges', 'eutiforge'),
    entry: 'server.js',
    description: 'A creative services marketplace connecting clients with freelancers. Something is off with how it handles trust. Can you find your way to the top?',
    difficulty: 'Medium',
    type: 'Realistic Pentest',
    process: null,
    status: 'stopped'
  },
  eutimart: {
    name: 'EutiMart',
    port: 4000,
    dir: path.join(__dirname, 'challenges', 'eutimart'),
    entry: 'server.js',
    description: 'A premium tech gadgets e-commerce store. 4 flags are hidden throughout the application. Find them all.',
    difficulty: 'Medium-Hard',
    type: 'CTF - Capture The Flag',
    process: null,
    status: 'stopped'
  },
  eutibites: {
    name: 'EutiBites',
    port: 5000,
    dir: path.join(__dirname, 'challenges', 'eutibites'),
    entry: 'server.js',
    description: 'A recipe sharing community that went through a security audit. The vulnerabilities were documented but never fixed. How many can you find?',
    difficulty: 'Easy-Medium',
    type: 'Vulnerability Assessment',
    process: null,
    status: 'stopped'
  }
};

// MIME types for serving static files
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function startChallenge(id) {
  const ch = challenges[id];
  if (!ch) return { error: 'Unknown challenge' };
  if (ch.status === 'running') return { status: 'already_running', port: ch.port };

  return new Promise((resolve) => {
    const env = { ...process.env, PORT: String(ch.port) };
    const child = spawn('node', [ch.entry], {
      cwd: ch.dir,
      env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    ch.process = child;
    ch.status = 'starting';

    let started = false;

    const onData = (data) => {
      const output = data.toString();
      console.log(`  [${ch.name}] ${output.trim()}`);
      if (!started && (output.includes('localhost') || output.includes('running') || output.includes('Listening'))) {
        started = true;
        ch.status = 'running';
        resolve({ status: 'started', port: ch.port });
      }
    };

    child.stdout.on('data', onData);
    child.stderr.on('data', onData);

    child.on('error', (err) => {
      ch.status = 'error';
      ch.process = null;
      if (!started) resolve({ error: err.message });
    });

    child.on('exit', (code) => {
      ch.status = 'stopped';
      ch.process = null;
      console.log(`  [${ch.name}] Process exited with code ${code}`);
    });

    // Timeout - if it doesn't report started in 8 seconds, assume it's up
    setTimeout(() => {
      if (!started) {
        started = true;
        ch.status = 'running';
        resolve({ status: 'started', port: ch.port });
      }
    }, 8000);
  });
}

function stopChallenge(id) {
  const ch = challenges[id];
  if (!ch) return { error: 'Unknown challenge' };
  if (ch.status !== 'running' || !ch.process) return { status: 'not_running' };

  ch.process.kill('SIGTERM');
  ch.status = 'stopped';
  ch.process = null;
  return { status: 'stopped' };
}

function getStatus() {
  const result = {};
  for (const [id, ch] of Object.entries(challenges)) {
    result[id] = {
      name: ch.name,
      port: ch.port,
      status: ch.status,
      description: ch.description,
      difficulty: ch.difficulty,
      type: ch.type
    };
  }
  return result;
}

// Serve the hub
const server = http.createServer(async (req, res) => {
  // API routes
  if (req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(getStatus()));
  }

  if (req.url?.startsWith('/api/start/')) {
    const id = req.url.split('/api/start/')[1];
    const result = await startChallenge(id);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(result));
  }

  if (req.url?.startsWith('/api/stop/')) {
    const id = req.url.split('/api/stop/')[1];
    const result = stopChallenge(id);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(result));
  }

  // Static file serving from hub/
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, 'hub', filePath);

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(HUB_PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║                                              ║');
  console.log('  ║          E U T I - C H A L L E N G E S       ║');
  console.log('  ║        Security Training Platform            ║');
  console.log('  ║                                              ║');
  console.log('  ╠══════════════════════════════════════════════╣');
  console.log('  ║                                              ║');
  console.log(`  ║   Hub:  http://localhost:${HUB_PORT}                ║`);
  console.log('  ║                                              ║');
  console.log('  ║   Challenges:                                ║');
  console.log('  ║     EutiForge  → port 3000                  ║');
  console.log('  ║     EutiMart   → port 4000                  ║');
  console.log('  ║     EutiBites  → port 5000                  ║');
  console.log('  ║                                              ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n  Shutting down all challenges...');
  for (const ch of Object.values(challenges)) {
    if (ch.process) {
      ch.process.kill('SIGTERM');
    }
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  for (const ch of Object.values(challenges)) {
    if (ch.process) {
      ch.process.kill('SIGTERM');
    }
  }
  process.exit(0);
});
