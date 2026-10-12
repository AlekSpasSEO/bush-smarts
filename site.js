const guides = [
  { title: 'Leaf blowers that actually pick up the leaves', category: 'Yard & garden', keywords: 'leaf blower vacuum bag mulch leaves cleanup', url: 'guides/leaf-blowers-with-bags.html' },
  { title: 'Robot mowers for a yard with some acreage', category: 'Big yards', keywords: 'robot mower large lawn acreage slope wire free', url: 'guides/robot-mowers-big-yards.html' }
];

const pathPrefix = location.pathname.includes('/guides/') ? '../' : '';
const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
if (menuButton && mobileNav) {
  menuButton.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!expanded));
    menuButton.setAttribute('aria-label', expanded ? 'Open menu' : 'Close menu');
    mobileNav.hidden = expanded;
  });
  mobileNav.addEventListener('click', event => {
    if (event.target.closest('a')) {
      mobileNav.hidden = true;
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open menu');
    }
  });
}

const dialog = document.querySelector('.search-dialog');
const searchInput = document.querySelector('#site-search');
const searchResults = document.querySelector('.search-results');
function renderSearch(query = '') {
  if (!searchResults) return;
  const q = query.trim().toLowerCase();
  const matches = guides.filter(guide => !q || `${guide.title} ${guide.category} ${guide.keywords}`.toLowerCase().includes(q));
  searchResults.replaceChildren();
  if (!matches.length) {
    const empty = document.createElement('p');
    empty.className = 'search-empty';
    empty.textContent = 'No guide yet. Try “leaves” or “mower”.';
    searchResults.append(empty);
    return;
  }
  matches.forEach(guide => {
    const link = document.createElement('a');
    link.href = `${pathPrefix}${guide.url}`;
    const category = document.createElement('span');
    category.textContent = guide.category;
    const title = document.createElement('strong');
    title.textContent = guide.title;
    const arrow = document.createElement('span');
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');
    link.append(category, title, arrow);
    searchResults.append(link);
  });
}
document.querySelectorAll('.search-open').forEach(button => button.addEventListener('click', () => {
  renderSearch();
  dialog.showModal();
  searchInput.focus();
}));
document.querySelectorAll('.search-close').forEach(button => button.addEventListener('click', () => dialog.close()));
if (dialog) dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
if (searchInput) searchInput.addEventListener('input', () => renderSearch(searchInput.value));
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
