import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as api from '../api/index.js';
import {
  formatRelativeTime,
  formatShortDate,
  getAccentStyles,
  getFavoriteBoardIds,
  getRecentBoards,
  rememberRecentBoard,
  toggleFavoriteBoardId,
} from '../utils/ui.js';
import {
  ArrowUpRightIcon,
  BellIcon,
  BoardLogoIcon,
  BoardsIcon,
  ChevronDownIcon,
  ClockIcon,
  HomeIcon,
  InfoIcon,
  MegaphoneIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  StarIcon,
  TemplateIcon,
  WorkspaceGridIcon,
} from '../components/Icons.jsx';

const BOARD_THEMES = [
  { name: 'Trello Blue', color: '#0c66e4' },
  { name: 'Wave Green', color: '#14b8a6' },
  { name: 'Amber Glow', color: '#f59e0b' },
  { name: 'Rose Bloom', color: '#ec4899' },
  { name: 'Emerald Pulse', color: '#16a34a' },
  { name: 'Slate Studio', color: '#334155' },
];

const NAV_ITEMS = [
  { id: 'boards', label: 'Boards', icon: BoardsIcon },
  { id: 'templates', label: 'Templates', icon: TemplateIcon },
  { id: 'home', label: 'Home', icon: HomeIcon },
];

const TEMPLATE_LIBRARY = [
  {
    id: 'project-management',
    name: 'Project Management',
    category: 'Operations',
    description: 'Track scope, milestones, signoffs, and releases in one delivery board.',
    accent: '#0c66e4',
    boardColor: '#0c66e4',
    lanes: [
      { title: 'Brief', cards: ['Scope review', 'Stakeholder alignment'] },
      { title: 'In Progress', cards: ['Create timeline', 'Review dependencies'] },
      { title: 'QA', cards: ['Risk check'] },
      { title: 'Done', cards: ['Launch notes'] },
    ],
  },
  {
    id: 'scrum',
    name: 'Scrum',
    category: 'Engineering',
    description: 'Run sprint planning, daily execution, and shipped work with a clean cadence.',
    accent: '#2563eb',
    boardColor: '#2563eb',
    lanes: [
      { title: 'Backlog', cards: ['Prioritize user stories', 'Refine sprint goal'] },
      { title: 'Ready', cards: ['Sprint kickoff'] },
      { title: 'Doing', cards: ['Build issue board', 'API handoff'] },
      { title: 'Review', cards: ['QA review'] },
      { title: 'Done', cards: ['Sprint retro notes'] },
    ],
  },
  {
    id: 'bug-tracking',
    name: 'Bug Tracking',
    category: 'Support',
    description: 'Capture incoming issues, triage severity, and close the loop faster.',
    accent: '#1d4ed8',
    boardColor: '#1d4ed8',
    lanes: [
      { title: 'Inbox', cards: ['New report from QA'] },
      { title: 'Triage', cards: ['Assign severity'] },
      { title: 'Fixing', cards: ['Patch regression'] },
      { title: 'Verify', cards: ['Confirm in staging'] },
      { title: 'Closed', cards: ['Notify reporter'] },
    ],
  },
  {
    id: 'web-design-process',
    name: 'Web Design Process',
    category: 'Design',
    description: 'Move from discovery to wireframes, polished UI, and final developer handoff.',
    accent: '#0f9adf',
    boardColor: '#0f9adf',
    lanes: [
      { title: 'Discovery', cards: ['Audit current pages', 'Collect references'] },
      { title: 'Concepts', cards: ['Hero layout options'] },
      { title: 'UI Design', cards: ['Build desktop frames', 'Prepare mobile states'] },
      { title: 'Handoff', cards: ['Export specs'] },
    ],
  },
];

const TEMPLATE_CATEGORIES = ['All', ...new Set(TEMPLATE_LIBRARY.map(template => template.category))];

export default function HomePage() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('boards');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBg, setNewBg] = useState(BOARD_THEMES[0].color);
  const [searchQuery, setSearchQuery] = useState('');
  const [templateCategory, setTemplateCategory] = useState('All');
  const [favoriteBoardIds, setFavoriteBoardIds] = useState(() => getFavoriteBoardIds());
  const [recentBoards, setRecentBoards] = useState(() => getRecentBoards());
  const [creatingTemplateId, setCreatingTemplateId] = useState(null);
  const [sortMode, setSortMode] = useState('activity');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    api.getBoards()
      .then(data => {
        setBoards(data);
        setRecentBoards(getRecentBoards());
      })
      .catch(err => {
        console.error('Failed to load boards:', err);
        setErrorMessage('Unable to load boards right now.');
      })
      .finally(() => setLoading(false));
  }, []);

  const favoriteSet = new Set(favoriteBoardIds);
  const searchValue = searchQuery.trim().toLowerCase();
  const filteredBoards = boards.filter(board => {
    if (!searchValue) return true;
    return board.title.toLowerCase().includes(searchValue);
  });

  const sortedBoards = [...filteredBoards].sort((left, right) => {
    const leftFavorite = favoriteSet.has(left.id) ? 1 : 0;
    const rightFavorite = favoriteSet.has(right.id) ? 1 : 0;
    if (leftFavorite !== rightFavorite) return rightFavorite - leftFavorite;

    if (sortMode === 'alphabetical') {
      return left.title.localeCompare(right.title);
    }

    const leftScore = (left.card_count || 0) * 2 + (left.list_count || 0);
    const rightScore = (right.card_count || 0) * 2 + (right.list_count || 0);
    if (leftScore !== rightScore) return rightScore - leftScore;

    return new Date(right.created_at || 0) - new Date(left.created_at || 0);
  });

  const favoriteBoards = sortedBoards.filter(board => favoriteSet.has(board.id));
  const mergedRecentBoards = recentBoards
    .map(recent => {
      const liveBoard = boards.find(board => board.id === recent.id);
      return liveBoard
        ? {
            ...recent,
            title: liveBoard.title,
            background: liveBoard.background,
            listCount: liveBoard.list_count || 0,
            cardCount: liveBoard.card_count || 0,
          }
        : recent;
    })
    .filter((item, index, all) => all.findIndex(board => board.id === item.id) === index)
    .slice(0, 4);

  const visibleTemplates = TEMPLATE_LIBRARY.filter(template => {
    const matchesCategory = templateCategory === 'All' || template.category === templateCategory;
    const matchesSearch = !searchValue ||
      template.name.toLowerCase().includes(searchValue) ||
      template.description.toLowerCase().includes(searchValue);
    return matchesCategory && matchesSearch;
  });

  const totalLists = boards.reduce((sum, board) => sum + (board.list_count || 0), 0);
  const totalCards = boards.reduce((sum, board) => sum + (board.card_count || 0), 0);
  const activeBoards = boards.filter(board => (board.card_count || 0) > 0).length;
  const biggestBoard = [...boards].sort((left, right) => (right.card_count || 0) - (left.card_count || 0))[0];

  const handleCreate = async () => {
    if (!newTitle.trim()) return;

    try {
      const board = await api.createBoard(newTitle.trim(), newBg);
      const nextBoards = [{ ...board, list_count: 0, card_count: 0 }, ...boards];
      setBoards(nextBoards);
      setRecentBoards(rememberRecentBoard({ ...board, list_count: 0, card_count: 0 }));
      setShowCreate(false);
      setNewTitle('');
      setNewBg(BOARD_THEMES[0].color);
      setErrorMessage('');
      navigate(`/board/${board.id}`);
    } catch (err) {
      console.error('Failed to create board:', err);
      setErrorMessage('Board creation failed. Try again.');
    }
  };

  const handleUseTemplate = async (template) => {
    setCreatingTemplateId(template.id);
    setErrorMessage('');

    try {
      const board = await api.createBoard(template.name, template.boardColor);

      for (const lane of template.lanes) {
        const list = await api.createList(board.id, lane.title);
        for (const cardTitle of lane.cards) {
          await api.createCard(list.id, cardTitle);
        }
      }

      setRecentBoards(rememberRecentBoard({ ...board, list_count: template.lanes.length }));
      navigate(`/board/${board.id}`);
    } catch (err) {
      console.error('Failed to use template:', err);
      setErrorMessage('Template setup failed. Try again.');
    } finally {
      setCreatingTemplateId(null);
    }
  };

  const toggleFavorite = (boardId) => {
    setFavoriteBoardIds(toggleFavoriteBoardId(boardId));
  };

  const boardHeading = activeView === 'templates'
    ? 'Boards created from templates'
    : activeView === 'home'
      ? 'Workspace boards'
      : 'Your boards';

  return (
    <>
      <div className="workspace-shell">
        <header className="workspace-topbar">
          <div className="workspace-topbar__left">
            <button type="button" className="icon-btn icon-btn--ghost">
              <WorkspaceGridIcon size={18} />
            </button>

            <Link to="/" className="workspace-brand">
              <span className="workspace-brand__mark">
                <BoardLogoIcon size={28} />
              </span>
              <span className="workspace-brand__name">Scalar Boards</span>
            </Link>
          </div>

          <div className="workspace-topbar__search">
            <SearchIcon size={17} />
            <input
              type="text"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Search boards, templates, and workspace items"
            />
          </div>

          <div className="workspace-topbar__right">
            <button type="button" className="btn btn--primary workspace-topbar__create" onClick={() => setShowCreate(true)}>
              <PlusIcon size={16} />
              Create
            </button>
            <button type="button" className="icon-btn">
              <MegaphoneIcon size={17} />
            </button>
            <button type="button" className="icon-btn">
              <BellIcon size={17} />
            </button>
            <button type="button" className="icon-btn">
              <InfoIcon size={17} />
            </button>
            <button type="button" className="workspace-avatar">SB</button>
          </div>
        </header>

        <div className="workspace-body">
          <aside className="workspace-sidebar">
            <nav className="workspace-nav">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`workspace-nav__item ${activeView === item.id ? 'workspace-nav__item--active' : ''}`}
                    onClick={() => setActiveView(item.id)}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="workspace-sidebar__section">
              <div className="workspace-sidebar__label">Workspaces</div>
              <button type="button" className="workspace-switcher">
                <span className="workspace-switcher__badge">S</span>
                <span className="workspace-switcher__copy">
                  <strong>Scalar Workspace</strong>
                  <span>Product, design, and delivery</span>
                </span>
                <ChevronDownIcon size={16} />
              </button>
            </div>

            <div className="workspace-sidebar__section">
              <div className="workspace-sidebar__label">Favorites</div>
              <div className="workspace-mini-list">
                {favoriteBoards.slice(0, 3).map(board => (
                  <Link key={board.id} to={`/board/${board.id}`} className="workspace-mini-list__item">
                    <span className="workspace-mini-list__swatch" style={{ background: board.background }} />
                    <span>{board.title}</span>
                  </Link>
                ))}
                {favoriteBoards.length === 0 && (
                  <div className="workspace-empty-copy">Star a board to pin it here.</div>
                )}
              </div>
            </div>

            <div className="workspace-promo">
              <div className="workspace-promo__icon">
                <SparklesIcon size={18} />
              </div>
              <strong>Template launchers</strong>
              <p>Seed boards instantly with ready-made list structures and starter cards.</p>
            </div>
          </aside>

          <main className="workspace-main">
            {activeView !== 'home' && (
              <section className="workspace-section workspace-section--templates">
                <div className="workspace-section__header">
                  <div>
                    <span className="workspace-section__eyebrow">
                      <SparklesIcon size={15} />
                      Most popular templates
                    </span>
                    <h1>Get going faster with a board starter that feels like Trello.</h1>
                    <p>
                      Start from a proven board setup, then keep the existing drag-and-drop,
                      members, labels, due dates, and checklists already built into the app.
                    </p>
                  </div>

                  <div className="workspace-section__controls">
                    <label className="select-shell">
                      <span>Choose a category</span>
                      <select
                        value={templateCategory}
                        onChange={event => setTemplateCategory(event.target.value)}
                      >
                        {TEMPLATE_CATEGORIES.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="template-grid">
                  {visibleTemplates.map(template => (
                    <article key={template.id} className="template-card" style={{ '--template-accent': template.accent }}>
                      <div className="template-card__media">
                        <span className="template-card__category">{template.category}</span>
                        <div className="template-card__mockup">
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>

                      <div className="template-card__body">
                        <div>
                          <h3>{template.name}</h3>
                          <p>{template.description}</p>
                        </div>

                        <button
                          type="button"
                          className="template-card__action"
                          onClick={() => handleUseTemplate(template)}
                          disabled={creatingTemplateId === template.id}
                        >
                          <span>{creatingTemplateId === template.id ? 'Creating...' : 'Use template'}</span>
                          <ArrowUpRightIcon size={15} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {activeView === 'home' && (
              <section className="workspace-home-hero">
                <div className="workspace-home-hero__panel">
                  <span className="workspace-section__eyebrow">
                    <HomeIcon size={15} />
                    Workspace overview
                  </span>
                  <h1>One dashboard for every board, template, and handoff.</h1>
                  <p>
                    This redesign pulls the workspace closer to Trello's structure while adding
                    stronger recents, favorites, and launch-ready templates.
                  </p>
                  <div className="workspace-stat-grid">
                    <div className="workspace-stat-card">
                      <span>Boards</span>
                      <strong>{boards.length}</strong>
                    </div>
                    <div className="workspace-stat-card">
                      <span>Lists</span>
                      <strong>{totalLists}</strong>
                    </div>
                    <div className="workspace-stat-card">
                      <span>Cards</span>
                      <strong>{totalCards}</strong>
                    </div>
                    <div className="workspace-stat-card">
                      <span>Active boards</span>
                      <strong>{activeBoards}</strong>
                    </div>
                  </div>
                </div>

                <div className="workspace-home-hero__panel workspace-home-hero__panel--accent">
                  <span className="workspace-sidebar__label">Board with the most work</span>
                  <strong>{biggestBoard?.title || 'No boards yet'}</strong>
                  <p>
                    {biggestBoard
                      ? `${biggestBoard.card_count || 0} cards across ${biggestBoard.list_count || 0} lists`
                      : 'Create a board to start building your workspace.'}
                  </p>
                  <button type="button" className="btn btn--secondary" onClick={() => setShowCreate(true)}>
                    <PlusIcon size={16} />
                    New board
                  </button>
                </div>
              </section>
            )}

            <section className="workspace-section">
              <div className="workspace-section__header">
                <div>
                  <span className="workspace-section__eyebrow">
                    <ClockIcon size={15} />
                    Recently viewed
                  </span>
                  <h2>Jump back into your recent work.</h2>
                </div>
              </div>

              <div className="recent-grid">
                {mergedRecentBoards.length > 0 ? mergedRecentBoards.map(board => (
                  <Link
                    key={board.id}
                    to={`/board/${board.id}`}
                    className="recent-card"
                    style={getAccentStyles(board.background || BOARD_THEMES[0].color)}
                  >
                    <div className="recent-card__swatch" />
                    <div className="recent-card__body">
                      <strong>{board.title}</strong>
                      <span>{board.cardCount || 0} cards - {board.listCount || 0} lists</span>
                    </div>
                    <small>{formatRelativeTime(board.viewedAt)}</small>
                  </Link>
                )) : (
                  <div className="workspace-empty-panel">
                    Open a board once and it will show up here for quick access.
                  </div>
                )}
              </div>
            </section>

            <section className="workspace-section">
              <div className="workspace-section__header">
                <div>
                  <span className="workspace-section__eyebrow">
                    <BoardsIcon size={15} />
                    {boardHeading}
                  </span>
                  <h2>Open, pin, and manage every project board.</h2>
                </div>

                <div className="workspace-chip-group">
                  <button
                    type="button"
                    className={`workspace-chip ${sortMode === 'activity' ? 'workspace-chip--active' : ''}`}
                    onClick={() => setSortMode('activity')}
                  >
                    Most active
                  </button>
                  <button
                    type="button"
                    className={`workspace-chip ${sortMode === 'alphabetical' ? 'workspace-chip--active' : ''}`}
                    onClick={() => setSortMode('alphabetical')}
                  >
                    Alphabetical
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="loading-shell">
                  <div className="loading-spinner">Loading boards...</div>
                </div>
              ) : sortedBoards.length > 0 ? (
                <div className="workspace-board-grid">
                  {sortedBoards.map(board => (
                    <article
                      key={board.id}
                      className="workspace-board-card"
                      style={getAccentStyles(board.background || BOARD_THEMES[0].color)}
                    >
                      <button
                        type="button"
                        className={`workspace-board-card__favorite ${favoriteSet.has(board.id) ? 'workspace-board-card__favorite--active' : ''}`}
                        onClick={() => toggleFavorite(board.id)}
                        aria-label="Toggle favorite board"
                      >
                        <StarIcon size={16} filled={favoriteSet.has(board.id)} />
                      </button>

                      <Link to={`/board/${board.id}`} className="workspace-board-card__link">
                        <div className="workspace-board-card__cover" />
                        <div className="workspace-board-card__content">
                          <div className="workspace-board-card__meta">
                            <span>Updated board</span>
                            <span>{formatShortDate(board.created_at)}</span>
                          </div>

                          <div className="workspace-board-card__title">{board.title}</div>
                          <p className="workspace-board-card__copy">
                            {(board.card_count || 0)} cards across {(board.list_count || 0)} lists.
                          </p>

                          <div className="workspace-board-card__stats">
                            <span>{board.list_count || 0} lists</span>
                            <span>{board.card_count || 0} cards</span>
                          </div>
                        </div>
                      </Link>
                    </article>
                  ))}

                  <button type="button" className="workspace-board-card workspace-board-card--create" onClick={() => setShowCreate(true)}>
                    <span className="workspace-board-card__create-icon">
                      <PlusIcon size={18} />
                    </span>
                    <strong>Create new board</strong>
                    <p>Launch a blank board with your own color theme and start organizing work.</p>
                  </button>
                </div>
              ) : (
                <div className="workspace-empty-panel">
                  No boards match the current search yet.
                </div>
              )}
            </section>
          </main>

          <aside className="workspace-rail">
            <div className="workspace-rail-card">
              <span className="workspace-sidebar__label">Workspace pulse</span>
              <strong>{totalCards}</strong>
              <p>Total cards currently tracked across the workspace.</p>
              <div className="workspace-rail-stats">
                <div>
                  <span>Boards</span>
                  <strong>{boards.length}</strong>
                </div>
                <div>
                  <span>Favorites</span>
                  <strong>{favoriteBoards.length}</strong>
                </div>
              </div>
            </div>

            <div className="workspace-rail-card">
              <span className="workspace-sidebar__label">Quick picks</span>
              <div className="workspace-rail-list">
                {favoriteBoards.slice(0, 3).map(board => (
                  <Link key={board.id} to={`/board/${board.id}`} className="workspace-rail-list__item">
                    <span className="workspace-rail-list__swatch" style={{ background: board.background }} />
                    <span>{board.title}</span>
                  </Link>
                ))}
                {favoriteBoards.length === 0 && (
                  <div className="workspace-empty-copy">Pin boards from the grid to keep them close.</div>
                )}
              </div>
            </div>

            <div className="workspace-rail-card workspace-rail-card--soft">
              <span className="workspace-sidebar__label">Extra touches</span>
              <ul className="workspace-note-list">
                <li>Favorite boards are saved locally for faster return visits.</li>
                <li>Recent boards are tracked automatically when you open a board.</li>
                <li>Templates now create real lists and starter cards, not just placeholders.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content create-board-modal" onClick={event => event.stopPropagation()}>
            <div className="create-board-modal__header">
              <span className="workspace-section__eyebrow">
                <PlusIcon size={15} />
                Create board
              </span>
              <h2>Start from scratch and keep the Trello-style layout.</h2>
            </div>

            <div className="create-board-modal__preview" style={getAccentStyles(newBg)}>
              <div className="create-board-modal__preview-surface" />
              <span className="create-board-modal__preview-label">Preview</span>
              <strong>{newTitle || 'Future board'}</strong>
              <p>The selected color becomes the board accent across the full experience.</p>
            </div>

            <div className="form-field">
              <label>Board title</label>
              <input
                type="text"
                value={newTitle}
                onChange={event => setNewTitle(event.target.value)}
                placeholder="Enter board title..."
                autoFocus
                onKeyDown={event => event.key === 'Enter' && handleCreate()}
              />
            </div>

            <div className="form-field">
              <label>Accent color</label>
              <div className="theme-grid">
                {BOARD_THEMES.map(theme => (
                  <button
                    key={theme.color}
                    type="button"
                    className={`theme-swatch ${newBg === theme.color ? 'theme-swatch--selected' : ''}`}
                    onClick={() => setNewBg(theme.color)}
                  >
                    <span className="theme-swatch__chip" style={{ background: theme.color }} />
                    <span>{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn--secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn--primary" onClick={handleCreate} disabled={!newTitle.trim()}>
                Create board
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="workspace-toast" role="status">
          {errorMessage}
        </div>
      )}
    </>
  );
}
