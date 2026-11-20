import { PROJECTS } from './project-data.js';

const root = document.documentElement;
const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  }
}, { threshold: 0.08 }) : null;
if (revealObserver) {
  root.classList.add('js-ready');
  document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
}
const themeButton = document.querySelector('[aria-label="Toggle color mode"]');

function syncThemeButton() {
  const isLight = root.dataset.theme === 'light';
  themeButton?.setAttribute('aria-pressed', String(isLight));
}
syncThemeButton();
themeButton?.addEventListener('click', () => {
  const theme = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.dataset.theme = theme;
  try { localStorage.setItem('noor-theme', theme); } catch { /* Storage is optional. */ }
  syncThemeButton();
});

const menuButton = document.querySelector('.mobile-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
function closeMenu() {
  mobileMenu?.classList.add('hidden');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Open navigation');
}
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  mobileMenu?.classList.toggle('hidden', !open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
mobileMenu?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (event.target instanceof Element && !event.target.closest('header')) closeMenu();
});
matchMedia('(min-width:768px)').addEventListener('change', closeMenu);

const navLinks = [...document.querySelectorAll('header a[data-path]')];
function updateActiveNavigation() {
  let current = 'home';
  for (const section of document.querySelectorAll('main section[id]')) {
    if (section.getBoundingClientRect().top <= 150) current = section.id;
  }
  for (const link of navLinks) {
    if (link.dataset.path === current) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
    link.classList.toggle('is-active', link.dataset.path === current);
  }
}
let scrollFrame = 0;
window.addEventListener('scroll', () => {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => { updateActiveNavigation(); scrollFrame = 0; });
}, { passive: true });
updateActiveNavigation();

const email = 'nooringyby@gmail.com';
const copyButton = document.querySelector('#copy-email-btn');
const copyText = document.querySelector('#copy-text');
const copyIcon = document.querySelector('#copy-icon');
const copyStatus = document.querySelector('#copy-status');
let copyTimer;
copyButton?.addEventListener('click', async () => {
  clearTimeout(copyTimer);
  try {
    await navigator.clipboard.writeText(email);
    copyText.textContent = 'Email copied';
    copyIcon.textContent = '\u2713';
    copyStatus.textContent = 'Email address copied to clipboard.';
  } catch {
    copyText.textContent = 'Copy email';
    copyStatus.textContent = `You can email me at ${email}.`;
  }
  copyTimer = setTimeout(() => {
    copyText.textContent = 'Copy email';
    copyIcon.textContent = '\u29c9';
  }, 2500);
});

function safeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value, location.origin);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

function renderPublishedProjects(rows) {
  const grid = document.querySelector('#projectsGrid');
  const template = grid?.querySelector('article');
  if (!grid || !template) return;
  const fragment = document.createDocumentFragment();
  const normalize = value => safeUrl(value)?.replace(/\/$/, '');
  for (const [index, row] of rows.entries()) {
    const known = PROJECTS.find(project => normalize(project.live_url) === normalize(row.live_url));
    const card = template.cloneNode(true);
    card.classList.toggle('featured', index === 0);
    card.classList.add('in-view');
    card.dataset.project = known?.id || row.id;
    card.querySelector('h3').textContent = row.title;
    card.querySelector('.project-description').textContent = row.description;
    card.querySelector('.project-category').textContent = known?.category || 'Project';
    card.querySelector('.project-overline').textContent = known?.id === 's2-turbo' ? 'Interactive web experience' : known?.id === 'bikhtisar' ? 'Web & mobile' : known?.id === 'wajehti' ? 'Everyday utility' : 'Selected project';
    const image = card.querySelector('img');
    const fallback = known?.image_url || 'assets/project-placeholder.svg';
    image.src = safeUrl(row.image_url) || fallback;
    image.alt = `${row.title} project screenshot`;
    image.addEventListener('error', () => { image.src = fallback; }, { once: true });
    const technologies = card.querySelector('.project-tech');
    const chip = technologies.firstElementChild?.cloneNode();
    technologies.replaceChildren();
    for (const technology of known?.technologies || []) {
      const element = chip?.cloneNode() || document.createElement('span');
      element.textContent = technology;
      technologies.append(element);
    }
    const links = card.querySelector('.project-links');
    const viewLink = links.querySelector('a').cloneNode(true);
    links.replaceChildren();
    const liveUrl = safeUrl(row.live_url);
    if (liveUrl) { viewLink.href = liveUrl; links.append(viewLink); }
    if (known?.github_url) {
      const github = viewLink.cloneNode();
      github.textContent = 'GitHub';
      github.href = known.github_url;
      github.className = 'project-github';
      links.append(github);
    }
    fragment.append(card);
  }
  for (const oldCard of grid.querySelectorAll('article,[data-projects-empty]')) {
    revealObserver?.unobserve(oldCard);
    oldCard.remove();
  }
  if (!rows.length) {
    const empty = document.createElement('p');
    empty.dataset.projectsEmpty = '';
    empty.className = 'projects-empty';
    empty.textContent = 'New work is on the way.';
    fragment.append(empty);
  }
  grid.insertBefore(fragment, grid.querySelector('.resume-card'));
}

// The committed CV-matching projects render immediately. Supabase powers the
// owner's existing publishing dashboard; a service outage retains this snapshot.
async function loadPublishedProjects() {
  try {
    const { supabase, ensureSupabase } = await import('./supabase-client.js');
    ensureSupabase();
    const { data, error } = await supabase.from('projects')
      .select('id,title,description,image_url,live_url,is_published,is_featured,display_order,created_at')
      .eq('is_published', true)
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .abortSignal(AbortSignal.timeout(6000));
    if (error) throw error;
    renderPublishedProjects(data || []);
    root.dataset.projectsSource = 'supabase';
  } catch {
    root.dataset.projectsSource = 'cv';
  }
}
loadPublishedProjects();
