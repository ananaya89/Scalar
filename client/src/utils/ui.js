export function getAccentStyles(color = '#3cb8a9') {
  return {
    '--board-accent': color,
    '--board-accent-soft': `${color}18`,
    '--board-accent-mid': `${color}30`,
    '--board-accent-strong': `${color}80`,
  };
}

const STORAGE_KEYS = {
  favorites: 'scalar-lab.favorite-boards',
  recentBoards: 'scalar-lab.recent-boards',
};

function readStorage(key, fallback) {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage issues and keep the UI responsive.
  }
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function formatShortDate(dateStr) {
  if (!dateStr) return '';

  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function formatLongDate(dateStr) {
  if (!dateStr) return '';

  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getDueDateStatus(dateStr) {
  if (!dateStr) return null;

  const due = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const diff = (due - now) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'overdue';
  if (diff <= 3) return 'due-soon';
  return 'normal';
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const absMinutes = Math.abs(diffMinutes);

  if (absMinutes < 60) {
    const value = Math.max(absMinutes, 1);
    return diffMinutes >= 0 ? `in ${value}m` : `${value}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  const absHours = Math.abs(diffHours);
  if (absHours < 24) {
    return diffHours >= 0 ? `in ${absHours}h` : `${absHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  const absDays = Math.abs(diffDays);
  if (absDays < 7) {
    return diffDays >= 0 ? `in ${absDays}d` : `${absDays}d ago`;
  }

  return formatShortDate(dateStr);
}

export function getFavoriteBoardIds() {
  const ids = readStorage(STORAGE_KEYS.favorites, []);
  return Array.isArray(ids) ? ids : [];
}

export function toggleFavoriteBoardId(boardId) {
  const ids = getFavoriteBoardIds();
  const nextIds = ids.includes(boardId)
    ? ids.filter(id => id !== boardId)
    : [boardId, ...ids];

  writeStorage(STORAGE_KEYS.favorites, nextIds);
  return nextIds;
}

export function getRecentBoards() {
  const boards = readStorage(STORAGE_KEYS.recentBoards, []);
  return Array.isArray(boards) ? boards : [];
}

export function rememberRecentBoard(board) {
  if (!board?.id) return getRecentBoards();

  const boards = getRecentBoards()
    .filter(item => item.id !== board.id)
    .slice(0, 11);

  const nextBoards = [
    {
      id: board.id,
      title: board.title,
      background: board.background,
      viewedAt: new Date().toISOString(),
      listCount: board.list_count ?? board.lists?.length ?? 0,
      cardCount: board.card_count ?? board.lists?.reduce((sum, list) => sum + (list.cards?.length || 0), 0) ?? 0,
    },
    ...boards,
  ].slice(0, 12);

  writeStorage(STORAGE_KEYS.recentBoards, nextBoards);
  return nextBoards;
}
