const HERO_PATHS = {
  exclamation:
    'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  chat:
    'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
  bolt: 'M13 10V3L4 14h7v7l9-11h-7z',
  sparkles:
    'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  chartBar:
    'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  chartSquare:
    'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  trendingUp: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  users: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  colorSwatch:
    'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01',
  viewGrid:
    'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  shieldCheck:
    'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  checkCircle: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  arrowDown: 'M19 14l-7 7m0 0l-7-7m7 7V3',
  arrowUpNarrow: 'M8 7l4-4m0 0l4 4m-4-4v18',
  currencyDollar:
    'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  cash:
    'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
};

const PATHS = {
  'alert-triangle': `<path d="${HERO_PATHS.exclamation}"/>`,
  'message-circle': `<path d="${HERO_PATHS.chat}"/>`,
  zap: `<path d="${HERO_PATHS.bolt}"/>`,
  bot: `<path d="${HERO_PATHS.viewGrid}"/>`,
  brain: `<path d="${HERO_PATHS.sparkles}"/>`,
  sparkles: `<path d="${HERO_PATHS.sparkles}"/>`,
  'chart-bar': `<path d="${HERO_PATHS.chartBar}"/>`,
  'chart-line': `<path d="${HERO_PATHS.chartSquare}"/>`,
  target: `<path d="${HERO_PATHS.arrowUpNarrow}"/>`,
  handshake: `<path d="${HERO_PATHS.users}"/>`,
  rocket: `<path d="${HERO_PATHS.trendingUp}"/>`,
  clock: `<path d="${HERO_PATHS.clock}"/>`,
  users: `<path d="${HERO_PATHS.users}"/>`,
  palette: `<path d="${HERO_PATHS.colorSwatch}"/>`,
  'layout-grid': `<path d="${HERO_PATHS.viewGrid}"/>`,
  'shield-check': `<path d="${HERO_PATHS.shieldCheck}"/>`,
  'check-circle': `<path d="${HERO_PATHS.checkCircle}"/>`,
  'arrow-up-right': `<path d="${HERO_PATHS.trendingUp}"/>`,
  'arrow-down': `<path d="${HERO_PATHS.arrowDown}"/>`,
  wallet: `<path d="${HERO_PATHS.cash}"/>`
};

const SIZE_MAP = {
  sm: 18,
  md: 22,
  lg: 30,
  xl: 42
};

function resolveSize(size) {
  if (typeof size === 'number') return Math.max(14, Math.min(size, 64));
  return SIZE_MAP[size] || SIZE_MAP.md;
}

export function hasIcon(name) {
  return Boolean(PATHS[name]);
}

export function renderIcon(name, { size = 'md', className = '', label = '' } = {}) {
  const paths = PATHS[name] || PATHS.sparkles;
  const px = resolveSize(size);
  const ariaHidden = label ? 'false' : 'true';
  const ariaLabel = label ? ` aria-label="${label}" role="img"` : '';

  return `<span class="deck-icon ${className}" style="--icon-size:${px}px" aria-hidden="${ariaHidden}"${ariaLabel}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg></span>`;
}

export function iconByKeyword(keyword = '') {
  const k = String(keyword).toLowerCase();
  if (k.includes('price') || k.includes('cost') || k.includes('budget')) return 'wallet';
  if (k.includes('analytics') || k.includes('data') || k.includes('chart')) return 'chart-bar';
  if (k.includes('impact') || k.includes('conversion') || k.includes('growth')) return 'arrow-up-right';
  if (k.includes('support') || k.includes('chat') || k.includes('conversation')) return 'message-circle';
  if (k.includes('design') || k.includes('visual') || k.includes('animation')) return 'palette';
  if (k.includes('team') || k.includes('role')) return 'users';
  if (k.includes('timeline') || k.includes('phase') || k.includes('month')) return 'clock';
  if (k.includes('strategy') || k.includes('goal')) return 'target';
  if (k.includes('security') || k.includes('privacy')) return 'shield-check';
  return 'sparkles';
}
