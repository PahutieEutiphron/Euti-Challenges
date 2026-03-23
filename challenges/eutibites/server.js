const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// JWT secret (HS256 — intentionally simple)
const JWT_SECRET = 'eutibites-secret-key-2026';

// ============================================================
// VULN 8: Server Version Disclosure via HTTP Headers
// Deliberately leaking server tech stack info in every response
// ============================================================
app.use((req, res, next) => {
  // Express default X-Powered-By is already on, but let's add more
  res.setHeader('Server', 'EutiBites/1.0 (Node.js/18.17.0; Express/4.18.2)');
  res.setHeader('X-Backend-Server', 'eutibites-app-node-01');
  res.setHeader('X-Runtime', 'Node.js');
  res.setHeader('X-Framework-Version', 'Express 4.18.2');
  next();
});

// ============================================================
// VULN 7: Missing Security Headers
// Deliberately NOT setting: CSP, X-Content-Type-Options,
// X-Frame-Options, Strict-Transport-Security, X-XSS-Protection,
// Referrer-Policy, Permissions-Policy
// ============================================================
// (Simply not adding them is the vulnerability)

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ============================================================
// In-Memory Database
// ============================================================
const db = {
  users: [],
  recipes: [],
  sessions: [], // tracks active sessions (for vuln 5 — no concurrent control)
  resetRequests: [], // tracks password reset requests
  loginAttempts: {} // tracks per-account failed login attempts (for vuln 3)
};

// Seed some users and recipes
function seedData() {
  const salt = bcrypt.genSaltSync(10);

  db.users.push(
    {
      id: uuidv4(),
      username: 'chef_maria',
      email: 'maria@eutibites.com',
      password: bcrypt.hashSync('Pasta1!aa', salt), // meets policy but still crackable (8 chars)
      displayName: 'Chef Maria',
      bio: 'Italian cuisine enthusiast. Nonna taught me everything.',
      joinedAt: '2025-11-15T10:00:00Z'
    },
    {
      id: uuidv4(),
      username: 'bbq_bob',
      email: 'bob@eutibites.com',
      password: bcrypt.hashSync('Grill1!bb', salt), // meets policy but still crackable (8 chars)
      displayName: 'BBQ Bob',
      bio: 'Low and slow is the way to go. Texas pitmaster.',
      joinedAt: '2025-12-01T08:30:00Z'
    },
    {
      id: uuidv4(),
      username: 'vegan_val',
      email: 'val@eutibites.com',
      password: bcrypt.hashSync('Tofu22!cc', salt), // meets policy but still crackable (8 chars)
      displayName: 'Vegan Val',
      bio: 'Plant-based cooking that actually tastes amazing.',
      joinedAt: '2026-01-10T14:00:00Z'
    }
  );

  db.recipes.push(
    {
      id: uuidv4(),
      title: 'Classic Carbonara',
      description: 'Authentic Roman carbonara with guanciale and pecorino. No cream allowed!',
      ingredients: ['400g spaghetti', '200g guanciale', '4 egg yolks', '100g pecorino romano', 'Black pepper'],
      instructions: '1. Cook pasta al dente. 2. Crisp guanciale in pan. 3. Mix yolks with pecorino. 4. Toss hot pasta with guanciale, then egg mixture off heat. 5. Season with pepper.',
      cookTime: 25,
      servings: 4,
      category: 'Pasta',
      authorId: db.users[0].id,
      authorName: 'Chef Maria',
      rating: 4.8,
      reviews: 42,
      createdAt: '2026-01-20T12:00:00Z'
    },
    {
      id: uuidv4(),
      title: 'Texas Brisket',
      description: 'A 14-hour smoked beef brisket with simple salt and pepper rub.',
      ingredients: ['1 whole packer brisket (12-14 lbs)', 'Coarse black pepper', 'Kosher salt', 'Oak wood'],
      instructions: '1. Trim brisket. 2. Apply 50/50 salt and pepper rub. 3. Smoke at 250°F for 12-14 hours. 4. Wrap at stall. 5. Rest 1 hour minimum.',
      cookTime: 840,
      servings: 20,
      category: 'BBQ',
      authorId: db.users[1].id,
      authorName: 'BBQ Bob',
      rating: 4.9,
      reviews: 67,
      createdAt: '2026-02-05T09:00:00Z'
    },
    {
      id: uuidv4(),
      title: 'Thai Green Curry (Vegan)',
      description: 'Creamy coconut green curry loaded with fresh vegetables and tofu.',
      ingredients: ['400ml coconut milk', '3 tbsp green curry paste', '200g firm tofu', 'Thai basil', 'Bamboo shoots', 'Bell peppers', 'Jasmine rice'],
      instructions: '1. Fry curry paste in coconut cream. 2. Add coconut milk and bring to simmer. 3. Add tofu and vegetables. 4. Cook 15 min. 5. Garnish with Thai basil.',
      cookTime: 30,
      servings: 4,
      category: 'Curry',
      authorId: db.users[2].id,
      authorName: 'Vegan Val',
      rating: 4.6,
      reviews: 31,
      createdAt: '2026-02-18T16:00:00Z'
    },
    {
      id: uuidv4(),
      title: 'Homemade Focaccia',
      description: 'Fluffy olive oil focaccia with rosemary and flaky sea salt.',
      ingredients: ['500g bread flour', '10g salt', '7g instant yeast', '400ml warm water', 'Olive oil', 'Rosemary', 'Flaky sea salt'],
      instructions: '1. Mix flour, salt, yeast, water. 2. Fold dough every 30 min for 2 hours. 3. Transfer to oiled pan. 4. Dimple with fingers. 5. Top with oil, rosemary, salt. 6. Bake at 450°F for 20 min.',
      cookTime: 160,
      servings: 8,
      category: 'Bread',
      authorId: db.users[0].id,
      authorName: 'Chef Maria',
      rating: 4.7,
      reviews: 55,
      createdAt: '2026-03-01T11:00:00Z'
    },
    {
      id: uuidv4(),
      title: 'Pulled Pork Tacos',
      description: 'Slow-smoked pulled pork with pickled onions and cilantro lime slaw.',
      ingredients: ['4 lb pork shoulder', 'BBQ rub', 'Corn tortillas', 'Red onion', 'Lime', 'Cilantro', 'Apple cider vinegar'],
      instructions: '1. Rub pork shoulder generously. 2. Smoke at 225°F for 8-10 hours. 3. Pull pork. 4. Quick-pickle onions. 5. Make cilantro lime slaw. 6. Assemble tacos.',
      cookTime: 600,
      servings: 12,
      category: 'BBQ',
      authorId: db.users[1].id,
      authorName: 'BBQ Bob',
      rating: 4.8,
      reviews: 38,
      createdAt: '2026-03-10T10:00:00Z'
    },
    {
      id: uuidv4(),
      title: 'Mushroom Risotto',
      description: 'Rich and creamy risotto with mixed wild mushrooms and parmesan.',
      ingredients: ['300g arborio rice', '500g mixed mushrooms', '1L vegetable stock', 'White wine', 'Parmesan', 'Shallots', 'Butter'],
      instructions: '1. Sauté shallots. 2. Toast rice. 3. Deglaze with wine. 4. Ladle stock gradually, stirring. 5. Fold in sautéed mushrooms. 6. Finish with butter and parmesan.',
      cookTime: 45,
      servings: 4,
      category: 'Risotto',
      authorId: db.users[0].id,
      authorName: 'Chef Maria',
      rating: 4.5,
      reviews: 29,
      createdAt: '2026-03-15T13:00:00Z'
    }
  );
}

seedData();

// ============================================================
// Serve static files
// ============================================================
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// VULN 9: Publicly Accessible Sitemap
// ============================================================
app.get('/sitemap.xml', (req, res) => {
  res.set('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<!-- EutiBites Sitemap - Generated by internal CMS v3.2.1 -->
<!-- Last updated: 2026-03-19 by admin@eutibites.com -->
<!-- Internal routes mapped from /src/routes/index.js -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Public pages -->
  <url><loc>https://eutibites.com/</loc><priority>1.0</priority></url>
  <url><loc>https://eutibites.com/recipes</loc><priority>0.9</priority></url>
  <url><loc>https://eutibites.com/login</loc><priority>0.5</priority></url>
  <url><loc>https://eutibites.com/register</loc><priority>0.5</priority></url>

  <!-- Authenticated user pages -->
  <url><loc>https://eutibites.com/dashboard</loc><priority>0.8</priority></url>
  <url><loc>https://eutibites.com/profile</loc><priority>0.7</priority></url>
  <url><loc>https://eutibites.com/my-recipes</loc><priority>0.7</priority></url>
  <url><loc>https://eutibites.com/account/settings</loc><priority>0.6</priority></url>
  <url><loc>https://eutibites.com/account/change-password</loc><priority>0.5</priority></url>
  <url><loc>https://eutibites.com/account/notifications</loc><priority>0.4</priority></url>
  <url><loc>https://eutibites.com/account/saved-recipes</loc><priority>0.4</priority></url>
  <url><loc>https://eutibites.com/account/meal-planner</loc><priority>0.4</priority></url>

  <!-- API endpoints (internal reference) -->
  <!-- TODO: remove before production - mapped from /src/api/v1/ -->
  <url><loc>https://eutibites.com/api/auth/login</loc><priority>0.3</priority></url>
  <url><loc>https://eutibites.com/api/auth/register</loc><priority>0.3</priority></url>
  <url><loc>https://eutibites.com/api/auth/forgot-password</loc><priority>0.3</priority></url>
  <url><loc>https://eutibites.com/api/recipes</loc><priority>0.3</priority></url>
  <url><loc>https://eutibites.com/api/users/profile</loc><priority>0.3</priority></url>

  <!-- Admin panel (restricted) -->
  <!-- Internal: admin credentials rotated monthly, see /docs/admin-access.md -->
  <url><loc>https://eutibites.com/admin</loc><priority>0.2</priority></url>
  <url><loc>https://eutibites.com/admin/users</loc><priority>0.2</priority></url>
  <url><loc>https://eutibites.com/admin/recipes</loc><priority>0.2</priority></url>
  <url><loc>https://eutibites.com/admin/analytics</loc><priority>0.2</priority></url>
</urlset>`);
});

// ============================================================
// AUTH MIDDLEWARE
// ============================================================
function authenticateToken(req, res, next) {
  // Check cookie first, then Authorization header
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ============================================================
// AUTH ROUTES
// ============================================================

// VULN 1: Username Enumeration
// Different error messages reveal whether an email exists
// VULN 3: Insufficient Rate Limiting on Login
// Per-account lockout after 50 attempts (15 min), but NO IP-based rate limiting.
// Attacker can cycle through accounts doing up to 50 attempts each without global throttle.
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.users.find(u => u.email === email);

  // VULN 1: Different error for non-existent user vs wrong password
  if (!user) {
    return res.status(401).json({
      error: 'No account found with this email address',
      field: 'email'
    });
  }

  // VULN 3: Per-account lockout (50 failed attempts → 15 min lockout)
  // but NO IP-based limiting — attacker can just switch to another account
  const accountKey = email.toLowerCase();
  const attempts = db.loginAttempts[accountKey] || { count: 0, lockedUntil: null };

  if (attempts.lockedUntil && new Date() < new Date(attempts.lockedUntil)) {
    const remaining = Math.ceil((new Date(attempts.lockedUntil) - new Date()) / 60000);
    return res.status(429).json({
      error: `Account temporarily locked due to too many failed attempts. Try again in ${remaining} minute(s).`,
      field: 'email'
    });
  }

  // Reset if lockout has expired
  if (attempts.lockedUntil && new Date() >= new Date(attempts.lockedUntil)) {
    db.loginAttempts[accountKey] = { count: 0, lockedUntil: null };
  }

  if (!bcrypt.compareSync(password, user.password)) {
    // Increment per-account failure counter
    const current = db.loginAttempts[accountKey] || { count: 0, lockedUntil: null };
    current.count += 1;
    if (current.count >= 50) {
      current.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      current.count = 0;
    }
    db.loginAttempts[accountKey] = current;

    return res.status(401).json({
      error: 'Incorrect password',
      field: 'password'
    });
  }

  // Successful login — reset attempts
  db.loginAttempts[accountKey] = { count: 0, lockedUntil: null };

  // VULN 5: No concurrent session control
  // We create a new session without invalidating existing ones
  const sessionId = uuidv4();
  const token = jwt.sign(
    { userId: user.id, email: user.email, username: user.username, sessionId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  db.sessions.push({
    sessionId,
    userId: user.id,
    createdAt: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  });

  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email
    },
    token
  });
});

// VULN 6: Weak Password Policy
// Requires 8 chars with upper, lower, number, special — but 8 is still too short
// and easily crackable. Industry standard is 12+ chars.
app.post('/api/auth/register', (req, res) => {
  const { username, email, password, displayName } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  // VULN 6: Weak password policy — 8 chars with complexity, but 8 is too short
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
  }
  if (!/[a-z]/.test(password)) {
    return res.status(400).json({ error: 'Password must contain at least one lowercase letter' });
  }
  if (!/[0-9]/.test(password)) {
    return res.status(400).json({ error: 'Password must contain at least one number' });
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return res.status(400).json({ error: 'Password must contain at least one special character' });
  }

  if (db.users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  if (db.users.find(u => u.username === username)) {
    return res.status(409).json({ error: 'This username is already taken' });
  }

  const salt = bcrypt.genSaltSync(10);
  const newUser = {
    id: uuidv4(),
    username,
    email,
    password: bcrypt.hashSync(password, salt),
    displayName: displayName || username,
    bio: '',
    joinedAt: new Date().toISOString()
  };

  db.users.push(newUser);

  const sessionId = uuidv4();
  const token = jwt.sign(
    { userId: newUser.id, email: newUser.email, username: newUser.username, sessionId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  db.sessions.push({
    sessionId,
    userId: newUser.id,
    createdAt: new Date().toISOString(),
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.cookie('token', token, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  });

  res.status(201).json({
    message: 'Account created successfully',
    user: {
      id: newUser.id,
      username: newUser.username,
      displayName: newUser.displayName,
      email: newUser.email
    },
    token
  });
});

// VULN 4: No Rate Limiting on Password Reset
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = db.users.find(u => u.email === email);

  // Store the reset request regardless (for tracking abuse)
  db.resetRequests.push({
    id: uuidv4(),
    email,
    ip: req.ip,
    requestedAt: new Date().toISOString(),
    userExists: !!user
  });

  // VULN 1: Username enumeration — different responses for existing vs non-existing email
  if (!user) {
    return res.status(404).json({
      error: 'No account found with this email address'
    });
  }

  res.json({
    message: 'A password reset link has been sent to your email.'
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// ============================================================
// RECIPE ROUTES
// ============================================================

// Public: list all recipes
app.get('/api/recipes', (req, res) => {
  const { category, search, sort } = req.query;
  let recipes = [...db.recipes];

  if (category) {
    recipes = recipes.filter(r => r.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    recipes = recipes.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );
  }

  if (sort === 'rating') {
    recipes.sort((a, b) => b.rating - a.rating);
  } else if (sort === 'newest') {
    recipes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  res.json(recipes.map(r => ({
    id: r.id,
    title: r.title,
    description: r.description,
    cookTime: r.cookTime,
    servings: r.servings,
    category: r.category,
    authorName: r.authorName,
    rating: r.rating,
    reviews: r.reviews,
    createdAt: r.createdAt
  })));
});

// Public: get single recipe
app.get('/api/recipes/:id', (req, res) => {
  const recipe = db.recipes.find(r => r.id === req.params.id);
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  res.json(recipe);
});

// Authenticated: create recipe
app.post('/api/recipes', authenticateToken, (req, res) => {
  const { title, description, ingredients, instructions, cookTime, servings, category } = req.body;

  if (!title || !description || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Title, description, ingredients, and instructions are required' });
  }

  const user = db.users.find(u => u.id === req.user.userId);
  const newRecipe = {
    id: uuidv4(),
    title,
    description,
    ingredients: ingredients || [],
    instructions,
    cookTime: cookTime || 0,
    servings: servings || 1,
    category: category || 'Other',
    authorId: req.user.userId,
    authorName: user ? user.displayName : 'Unknown',
    rating: 0,
    reviews: 0,
    createdAt: new Date().toISOString()
  };

  db.recipes.push(newRecipe);
  res.status(201).json(newRecipe);
});

// ============================================================
// USER ROUTES
// ============================================================

// Get current user profile
app.get('/api/users/profile', authenticateToken, (req, res) => {
  const user = db.users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const userRecipes = db.recipes.filter(r => r.authorId === user.id);
  const activeSessions = db.sessions.filter(s => s.userId === user.id);

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    bio: user.bio,
    joinedAt: user.joinedAt,
    recipeCount: userRecipes.length,
    activeSessions: activeSessions.length // exposes session count
  });
});

// Update profile
app.put('/api/users/profile', authenticateToken, (req, res) => {
  const user = db.users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { displayName, bio } = req.body;
  if (displayName) user.displayName = displayName;
  if (bio !== undefined) user.bio = bio;

  res.json({
    message: 'Profile updated',
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      bio: user.bio
    }
  });
});

// Get user's own recipes
app.get('/api/users/my-recipes', authenticateToken, (req, res) => {
  const recipes = db.recipes.filter(r => r.authorId === req.user.userId);
  res.json(recipes);
});

// ============================================================
// VULN 2: Reflected Content Injection via Error Parameter
// The login page reads ?error= from URL and the server also
// provides an endpoint that renders it directly
// ============================================================
app.get('/login', (req, res) => {
  // Serve login.html — the frontend JS will read ?error= and inject it into DOM
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Page routes — serve HTML files
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/recipes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'recipes.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Catch-all for SPA-style navigation
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
// Start server
// ============================================================
app.listen(PORT, () => {
  console.log(`\n  EutiBites server running on http://localhost:${PORT}`);
  console.log(`  Seeded ${db.users.length} users and ${db.recipes.length} recipes\n`);
});
