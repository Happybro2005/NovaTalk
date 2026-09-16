// Global javascript file for NovaTalk static site

const NOVATALK_USER_KEY = 'novatalk-user';

function normalizeUsername(value = '') {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '@user';
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem(NOVATALK_USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user && typeof user === 'object' ? user : null;
  } catch (error) {
    return null;
  }
}

function getDisplayProfile() {
  const fallback = {
    name: 'Your Name',
    username: '@username',
    bio: 'Exploring ideas, people, and new conversations across the galaxy.',
  };

  const user = getStoredUser() || {};
  return {
    name: user.name || fallback.name,
    username: normalizeUsername(user.username || fallback.username),
    bio: user.bio || fallback.bio,
  };
}

function getInitials(name = 'User') {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'U';
}

function applyUserProfile() {
  const profile = getDisplayProfile();

  document.querySelectorAll('[data-user-name]').forEach((element) => {
    element.textContent = profile.name;
  });

  document.querySelectorAll('[data-user-username]').forEach((element) => {
    element.textContent = profile.username;
  });

  document.querySelectorAll('[data-user-bio]').forEach((element) => {
    element.textContent = profile.bio;
  });

  document.querySelectorAll('[data-user-initials]').forEach((element) => {
    element.textContent = getInitials(profile.name);
  });

  const greeting = document.querySelector('[data-user-greeting]');
  if (greeting) {
    const firstName = profile.name.split(/\s+/).filter(Boolean)[0] || 'Friend';
    greeting.textContent = `Welcome back, ${firstName}`;
  }

  const displayNameField = document.querySelector('[data-user-display-name]');
  if (displayNameField) {
    displayNameField.value = profile.name;
  }

  const usernameField = document.querySelector('[data-user-display-username]');
  if (usernameField) {
    usernameField.value = profile.username;
  }

  const bioField = document.querySelector('[data-user-bio-field]');
  if (bioField) {
    bioField.value = profile.bio;
  }
}

function injectGlobalMenu() {
  if (document.querySelector('[data-global-menu]')) return;

  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
  const authPages = ['/login', '/login.html', '/register', '/register.html', '/forgot-password', '/forgot-password.html', '/profile', '/profile.html'];

  if (authPages.includes(currentPath)) return;

  const hasExistingSidebar = Array.from(document.querySelectorAll('aside')).some((aside) =>
    aside.innerHTML.includes('dashboard.html') || aside.innerHTML.includes('stranger-chat.html')
  );

  if (hasExistingSidebar) return;

  const menu = document.createElement('div');
  menu.setAttribute('data-global-menu', 'true');
  menu.innerHTML = `
    <div class="fixed left-4 top-4 z-50 w-[220px] rounded-2xl border border-white/10 bg-[#050816]/80 p-4 shadow-[0_0_40px_rgba(79,140,255,0.15)] backdrop-blur-xl">
      <div class="mb-4 flex items-center gap-2">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
          <i data-lucide="sparkles" class="h-5 w-5 text-white"></i>
        </div>
        <span class="text-xl font-bold tracking-tight text-white font-display">NovaTalk</span>
      </div>
      <nav class="space-y-1 text-sm text-[#CBD5E1]">
        <a href="dashboard.html" class="block rounded-xl px-3 py-2 hover:bg-white/[0.05] hover:text-white">Dashboard</a>
        <a href="stranger-chat.html" class="block rounded-xl px-3 py-2 hover:bg-white/[0.05] hover:text-white">Stranger Chat</a>
        <a href="friends.html" class="block rounded-xl px-3 py-2 hover:bg-white/[0.05] hover:text-white">Friends</a>
        <a href="friend-requests.html" class="block rounded-xl px-3 py-2 hover:bg-white/[0.05] hover:text-white">Requests</a>
        <a href="communities.html" class="block rounded-xl px-3 py-2 hover:bg-white/[0.05] hover:text-white">Communities</a>
        <a href="notifications.html" class="block rounded-xl px-3 py-2 hover:bg-white/[0.05] hover:text-white">Notifications</a>
        <a href="settings.html" class="block rounded-xl px-3 py-2 hover:bg-white/[0.05] hover:text-white">Settings</a>
        <a href="support.html" class="block rounded-xl px-3 py-2 hover:bg-white/[0.05] hover:text-white">Support</a>
      </nav>
    </div>
  `;

  document.body.appendChild(menu);

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// 1. Initialize Lucide Icons
document.addEventListener('DOMContentLoaded', () => {
  injectGlobalMenu();
  applyUserProfile();

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // Initialize Constellation Canvas if present
  initConstellation();
});

// 2. Constellation Field Logic
function initConstellation() {
  const canvas = document.getElementById('constellation-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let raf = 0;

  const density = parseInt(canvas.getAttribute('data-density')) || 90;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const resize = () => {
    width = canvas.parentElement.clientWidth;
    height = canvas.parentElement.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  };

  resize();
  window.addEventListener('resize', resize);

  const count = Math.min(density, Math.floor((width * height) / 9000));
  const points = Array.from({ length: count }).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.15,
    vy: (Math.random() - 0.5) * 0.15,
    r: Math.random() * 1.3 + 0.4,
    twinkle: Math.random() * Math.PI * 2,
  }));

  const linkDist = Math.max(width, height) * 0.09;

  const draw = () => {
    ctx.clearRect(0, 0, width, height);

    for (const p of points) {
      if (!prefersReducedMotion) {
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += 0.02;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }
    }

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i];
        const b = points[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < linkDist) {
          const opacity = (1 - dist / linkDist) * 0.35;
          ctx.strokeStyle = `rgba(124, 158, 255, ${opacity})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const p of points) {
      const twinkleOpacity = 0.5 + Math.sin(p.twinkle) * 0.4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${twinkleOpacity})`;
      ctx.fill();
    }

    raf = requestAnimationFrame(draw);
  };

  draw();
}
