const bcrypt = require('bcryptjs');

// --- In-memory database ---
const store = {
  users: [],
  requests: [],
  pendingInvites: [],
  _nextRequestId: 7
};

function initDatabase() {
  if (store.users.length > 0) return;

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  store.users = [
    { id: 1000, email: 'admin@eutiforge.io',           password: hash('Sf@dm1n2024!'),     name: 'System Administrator', address: '100 EutiForge HQ, San Francisco, CA 94102', phone: '+1-415-555-0100', role: 'admin',   created_at: '2026-01-15T08:00:00.000Z' },
    { id: 1001, email: 'elena.vasquez@protonmail.com',   password: hash('Cr3ative!Spark22'),  name: 'Elena Vasquez',        address: '42 Artisan Way, Austin, TX 73301',           phone: '+1-512-555-0142', role: 'creator', created_at: '2026-01-20T10:30:00.000Z' },
    { id: 1002, email: 'marcus.chen@gmail.com',          password: hash('D3sign&Build!99'),   name: 'Marcus Chen',          address: '88 Innovation Dr, Seattle, WA 98101',        phone: '+1-206-555-0188', role: 'creator', created_at: '2026-01-25T14:15:00.000Z' },
    { id: 1003, email: 'sofia.andersson@outlook.com',    password: hash('Cr@ft3r$2024'),      name: 'Sofia Andersson',      address: '15 Nordic Lane, Portland, OR 97201',         phone: '+1-503-555-0115', role: 'creator', created_at: '2026-02-01T09:45:00.000Z' },
    { id: 1004, email: 'james.okafor@yahoo.com',         password: hash('PixelPerfect#7'),    name: 'James Okafor',         address: '231 Creative Blvd, Denver, CO 80201',        phone: '+1-303-555-0231', role: 'creator', created_at: '2026-02-05T16:00:00.000Z' },
    { id: 1005, email: 'priya.sharma@gmail.com',         password: hash('BrowseN$hop1'),      name: 'Priya Sharma',         address: '67 Maple Street, Chicago, IL 60601',         phone: '+1-312-555-0167', role: 'user',    created_at: '2026-02-10T11:20:00.000Z' },
    { id: 1006, email: 'lucas.martin@hotmail.com',       password: hash('MyP@ssw0rd22'),      name: 'Lucas Martin',         address: '904 Oak Avenue, Miami, FL 33101',            phone: '+1-305-555-0904', role: 'user',    created_at: '2026-02-12T08:45:00.000Z' },
    { id: 1007, email: 'amara.johnson@outlook.com',      password: hash('SecureL0gin!3'),     name: 'Amara Johnson',        address: '312 Pine Road, Boston, MA 02101',            phone: '+1-617-555-0312', role: 'user',    created_at: '2026-02-15T13:30:00.000Z' },
    { id: 1008, email: 'david.kim@protonmail.com',       password: hash('K1mD@vid2024'),      name: 'David Kim',            address: '556 Cedar Court, New York, NY 10001',        phone: '+1-212-555-0556', role: 'user',    created_at: '2026-02-18T15:00:00.000Z' },
  ];

  store.requests = [
    { id: 1, user_id: 1005, creator_id: 1001, title: 'Company Logo Design',        description: 'Need a modern minimalist logo for my tech startup. Should work on both light and dark backgrounds.',        budget: '$500',   status: 'accepted', created_at: '2026-02-20T10:00:00.000Z' },
    { id: 2, user_id: 1006, creator_id: 1002, title: 'E-commerce Website Redesign', description: 'Looking to redesign our online store. Current site feels outdated. Need modern UI/UX.',                      budget: '$2,500', status: 'pending',  created_at: '2026-02-21T14:30:00.000Z' },
    { id: 3, user_id: 1007, creator_id: 1003, title: 'Brand Identity Package',      description: 'Complete brand identity including logo, business cards, letterhead, and social media assets.',                budget: '$1,800', status: 'accepted', created_at: '2026-02-22T09:15:00.000Z' },
    { id: 4, user_id: 1008, creator_id: 1004, title: 'Mobile App UI Design',        description: 'Need UI mockups for a fitness tracking app. 12 screens including onboarding flow.',                        budget: '$3,000', status: 'pending',  created_at: '2026-02-23T16:45:00.000Z' },
    { id: 5, user_id: 1005, creator_id: 1003, title: 'Wedding Invitation Suite',    description: 'Elegant wedding invitation design with RSVP cards and save-the-dates. Floral theme preferred.',              budget: '$400',   status: 'declined', created_at: '2026-02-25T11:00:00.000Z' },
    { id: 6, user_id: 1006, creator_id: 1001, title: 'YouTube Channel Branding',    description: 'Need channel art, intro animation template, and thumbnail designs for a cooking channel.',                  budget: '$750',   status: 'accepted', created_at: '2026-02-27T13:30:00.000Z' },
  ];

  store.pendingInvites = [];

  console.log('[+] Database initialized with seed data');
}

// --- Query helpers ---

const db = {
  users: {
    findByEmail(email) {
      return store.users.find(u => u.email === email) || null;
    },
    findById(id) {
      return store.users.find(u => u.id === id) || null;
    },
    getAll() {
      return store.users.map(u => ({ ...u }));
    },
    getCreators() {
      return store.users.filter(u => u.role === 'creator').map(u => ({ id: u.id, name: u.name, email: u.email }));
    },
    searchCreators(query) {
      const q = query.toLowerCase();
      return store.users
        .filter(u => u.role === 'creator' && (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)))
        .map(u => ({ id: u.id, name: u.name, email: u.email }));
    },
    insert(user) {
      store.users.push({ ...user, created_at: new Date().toISOString() });
      return user;
    },
    getNextId() {
      return Math.max(...store.users.map(u => u.id)) + 1;
    },
    updatePassword(id, hashedPassword) {
      const user = store.users.find(u => u.id === id);
      if (user) user.password = hashedPassword;
    },
    count() { return store.users.length; },
    countByRole(role) { return store.users.filter(u => u.role === role).length; }
  },

  requests: {
    findById(id) {
      return store.requests.find(r => r.id === id) || null;
    },
    findByUserId(userId) {
      return store.requests.filter(r => r.user_id === userId);
    },
    findByCreatorId(creatorId) {
      return store.requests.filter(r => r.creator_id === creatorId);
    },
    insert(request) {
      const id = store._nextRequestId++;
      const full = { ...request, id, status: 'pending', created_at: new Date().toISOString() };
      store.requests.push(full);
      return full;
    },
    updateStatus(id, creatorId, status) {
      const req = store.requests.find(r => r.id === id && r.creator_id === creatorId);
      if (req) { req.status = status; return true; }
      return false;
    },
    count() { return store.requests.length; },
    countByStatus(status) { return store.requests.filter(r => r.status === status).length; }
  },

  invites: {
    findByEmail(email) {
      return store.pendingInvites.find(i => i.email === email) || null;
    },
    insert(invite) {
      store.pendingInvites.push({ ...invite, created_at: new Date().toISOString() });
    },
    deleteByEmail(email) {
      store.pendingInvites = store.pendingInvites.filter(i => i.email !== email);
    }
  }
};

module.exports = { initDatabase, db };
