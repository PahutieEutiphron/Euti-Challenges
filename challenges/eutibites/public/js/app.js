// ============================================================
// EutiBites — Shared frontend utilities
// ============================================================

// Format cook time in human readable
function formatCookTime(minutes) {
  if (!minutes) return 'N/A';
  if (minutes < 60) return minutes + ' min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h + 'h' + (m ? ' ' + m + 'm' : '');
}

// Generate a recipe card HTML
function recipeCard(recipe) {
  const colors = {
    'Pasta': 'linear-gradient(135deg, #c0392b, #e67e22)',
    'BBQ': 'linear-gradient(135deg, #8e4400, #d35400)',
    'Curry': 'linear-gradient(135deg, #27ae60, #f39c12)',
    'Bread': 'linear-gradient(135deg, #b8860b, #daa520)',
    'Risotto': 'linear-gradient(135deg, #6b8e23, #9acd32)',
    'Dessert': 'linear-gradient(135deg, #e91e63, #ff6f00)',
    'Salad': 'linear-gradient(135deg, #2e7d32, #66bb6a)',
    'Other': 'linear-gradient(135deg, #546e7a, #90a4ae)'
  };

  const bg = colors[recipe.category] || colors['Other'];

  return `
    <div class="recipe-card" onclick="viewRecipe('${recipe.id}')">
      <div class="recipe-card-header" style="background: ${bg}">
        <span class="category-badge">${recipe.category || 'Other'}</span>
        <h3>${escapeHtml(recipe.title)}</h3>
      </div>
      <div class="recipe-card-body">
        <p>${escapeHtml(recipe.description)}</p>
        <div class="recipe-meta">
          <span class="rating">&#9733; ${recipe.rating || '—'} (${recipe.reviews || 0})</span>
          <span class="cook-time">${formatCookTime(recipe.cookTime)}</span>
          <span>by ${escapeHtml(recipe.authorName)}</span>
        </div>
      </div>
    </div>
  `;
}

// Navigate to recipe detail (simple alert for now)
function viewRecipe(id) {
  window.location.href = '/recipes#' + id;
}

// Escape HTML for safe rendering in recipe cards
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Update nav based on auth state
function updateNav() {
  const authContainer = document.getElementById('nav-auth-links');
  if (!authContainer) return;

  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (user) {
    authContainer.innerHTML = `
      <a href="/dashboard">Dashboard</a>
    `;
    authContainer.insertAdjacentHTML('afterend', `
      <li><a href="/profile">Profile</a></li>
      <li><a href="#" class="btn-nav" onclick="logout()">Sign Out</a></li>
    `);
  } else {
    authContainer.innerHTML = `
      <a href="/login">Sign In</a>
    `;
    authContainer.insertAdjacentHTML('afterend', `
      <li><a href="/register" class="btn-nav">Sign Up</a></li>
    `);
  }
}

// Logout helper
async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}
