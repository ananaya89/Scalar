import { useCallback, useEffect, useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Link, useParams } from 'react-router-dom';
import * as api from '../api/index.js';
import AddListForm from '../components/AddListForm.jsx';
import CardDetailModal from '../components/CardDetailModal.jsx';
import FilterPopover from '../components/FilterPopover.jsx';
import List from '../components/List.jsx';
import {
  ArrowLeftIcon,
  BellIcon,
  BoardLogoIcon,
  BoardsIcon,
  CheckSquareIcon,
  ClockIcon,
  FilterIcon,
  InfoIcon,
  MegaphoneIcon,
  MembersIcon,
  SearchIcon,
  StarIcon,
  WorkspaceGridIcon,
} from '../components/Icons.jsx';
import {
  formatShortDate,
  getAccentStyles,
  getDueDateStatus,
  getFavoriteBoardIds,
  getInitials,
  rememberRecentBoard,
  toggleFavoriteBoardId,
} from '../utils/ui.js';

export default function BoardPage() {
  const { boardId } = useParams();
  const [board, setBoard] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ labelIds: [], memberIds: [], due: null });
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [favoriteBoardIds, setFavoriteBoardIds] = useState(() => getFavoriteBoardIds());

  const loadBoard = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    try {
      const boardData = await api.getBoard(boardId);
      setBoard(boardData);
      setTitleValue(boardData.title);

      try {
        const membersData = await api.getMembers();
        setMembers(membersData);
      } catch (err) {
        console.error('Failed to load members:', err);
        setMembers([]);
      }
    } catch (err) {
      console.error('Failed to load board:', err);
      setBoard(null);
      setMembers([]);
      setLoadError(
        err?.status === 404
          ? 'Board not found.'
          : err?.message || 'Unable to load this board right now.'
      );
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const allCards = board ? board.lists.flatMap(list => list.cards.map(card => ({ ...card, listTitle: list.title }))) : [];

  useEffect(() => {
    if (!board) return;

    rememberRecentBoard({
      ...board,
      list_count: board.lists.length,
      card_count: allCards.length,
    });
  }, [board, allCards.length]);

  const handleDragEnd = useCallback(async (result) => {
    const { destination, source, type } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    if (!board) return;

    if (type === 'list') {
      const newLists = Array.from(board.lists);
      const [removed] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, removed);
      setBoard(prev => ({ ...prev, lists: newLists }));
      await api.reorderLists(board.id, newLists.map(list => list.id));
      return;
    }

    const sourceList = board.lists.find(list => list.id.toString() === source.droppableId);
    const destList = board.lists.find(list => list.id.toString() === destination.droppableId);
    if (!sourceList || !destList) return;

    if (sourceList.id === destList.id) {
      const newCards = Array.from(sourceList.cards);
      const [removed] = newCards.splice(source.index, 1);
      newCards.splice(destination.index, 0, removed);
      setBoard(prev => ({
        ...prev,
        lists: prev.lists.map(list =>
          list.id === sourceList.id ? { ...list, cards: newCards } : list
        ),
      }));
      await api.reorderCards(
        sourceList.id,
        destList.id,
        newCards.map(card => card.id),
        newCards.map(card => card.id)
      );
      return;
    }

    const sourceCards = Array.from(sourceList.cards);
    const [removed] = sourceCards.splice(source.index, 1);
    const destCards = Array.from(destList.cards);
    destCards.splice(destination.index, 0, removed);
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.map(list => {
        if (list.id === sourceList.id) return { ...list, cards: sourceCards };
        if (list.id === destList.id) return { ...list, cards: destCards };
        return list;
      }),
    }));
    await api.reorderCards(
      sourceList.id,
      destList.id,
      sourceCards.map(card => card.id),
      destCards.map(card => card.id)
    );
  }, [board]);

  const handleAddList = async (title) => {
    const list = await api.createList(board.id, title);
    setBoard(prev => ({ ...prev, lists: [...prev.lists, list] }));
  };

  const handleUpdateList = async (listId, title) => {
    await api.updateList(listId, title);
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.map(list => (list.id === listId ? { ...list, title } : list)),
    }));
  };

  const handleDeleteList = async (listId) => {
    await api.deleteList(listId);
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.filter(list => list.id !== listId),
    }));
  };

  const handleAddCard = async (listId, title) => {
    const card = await api.createCard(listId, title);
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.map(list =>
        list.id === listId ? { ...list, cards: [...list.cards, card] } : list
      ),
    }));
  };

  const handleDeleteCard = async (cardId, listId) => {
    await api.deleteCard(cardId);
    setBoard(prev => ({
      ...prev,
      lists: prev.lists.map(list =>
        list.id === listId
          ? { ...list, cards: list.cards.filter(card => card.id !== cardId) }
          : list
      ),
    }));
    setSelectedCardId(null);
  };

  const handleBoardTitleSave = async () => {
    if (titleValue.trim() && titleValue.trim() !== board.title) {
      await api.updateBoard(board.id, { title: titleValue.trim() });
      setBoard(prev => ({ ...prev, title: titleValue.trim() }));
    }
    setEditingTitle(false);
  };

  const handleCardUpdate = () => {
    loadBoard();
  };

  const toggleFavorite = () => {
    setFavoriteBoardIds(toggleFavoriteBoardId(board.id));
  };

  const hasActiveFilters = filters.labelIds.length > 0 || filters.memberIds.length > 0 || filters.due !== null;
  const activeFilterCount = filters.labelIds.length + filters.memberIds.length + (filters.due ? 1 : 0);
  const searchLower = searchQuery.toLowerCase();

  const filterCards = (cards) => cards.filter(card => {
    if (searchQuery && !card.title.toLowerCase().includes(searchLower)) return false;
    if (filters.labelIds.length > 0 && !card.labels?.some(label => filters.labelIds.includes(label.id))) return false;
    if (filters.memberIds.length > 0 && !card.members?.some(member => filters.memberIds.includes(member.id))) return false;
    if (filters.due === 'overdue' && (!card.due_date || new Date(card.due_date) >= new Date())) return false;
    if (filters.due === 'soon') {
      if (!card.due_date) return false;
      const dueDate = new Date(card.due_date);
      const now = new Date();
      const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (dueDate < now || dueDate > weekAhead) return false;
    }
    if (filters.due === 'none' && card.due_date) return false;
    return true;
  });

  const dueSoonCount = allCards.filter(card => getDueDateStatus(card.due_date) === 'due-soon').length;
  const overdueCount = allCards.filter(card => getDueDateStatus(card.due_date) === 'overdue').length;
  const assignedCount = allCards.filter(card => card.members?.length > 0).length;
  const checklistTotals = allCards.reduce(
    (acc, card) => {
      if (card.checklist_stats) {
        acc.completed += card.checklist_stats.completed || 0;
        acc.total += card.checklist_stats.total || 0;
      }
      return acc;
    },
    { completed: 0, total: 0 }
  );
  const checklistProgress = checklistTotals.total
    ? Math.round((checklistTotals.completed / checklistTotals.total) * 100)
    : 0;

  const attentionCards = [...allCards]
    .filter(card => {
      const dueStatus = getDueDateStatus(card.due_date);
      return dueStatus === 'overdue' || dueStatus === 'due-soon' || (card.members?.length || 0) === 0;
    })
    .sort((left, right) => {
      const score = (item) => {
        const dueStatus = getDueDateStatus(item.due_date);
        let total = 0;
        if (dueStatus === 'overdue') total += 4;
        if (dueStatus === 'due-soon') total += 2;
        if ((item.members?.length || 0) === 0) total += 1;
        return total;
      };

      return score(right) - score(left);
    })
    .slice(0, 4);

  const labelUsage = (board?.labels || [])
    .map(label => ({
      ...label,
      total: allCards.filter(card => card.labels?.some(item => item.id === label.id)).length,
    }))
    .filter(label => label.total > 0)
    .sort((left, right) => right.total - left.total)
    .slice(0, 4);
  const boardMembers = members.filter(member =>
    allCards.some(card => card.members?.some(item => item.id === member.id))
  );

  const selectedCardList = selectedCardId
    ? board?.lists.find(list => list.cards.some(card => card.id === selectedCardId))
    : null;

  if (loading) {
    return (
      <div className="board-shell">
        <header className="workspace-topbar workspace-topbar--board">
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
        </header>
        <div className="loading-shell">
          <div className="loading-spinner">Loading board...</div>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="board-shell">
        <header className="workspace-topbar workspace-topbar--board">
          <div className="workspace-topbar__left">
            <Link to="/" className="workspace-brand">
              <span className="workspace-brand__mark">
                <BoardLogoIcon size={28} />
              </span>
              <span className="workspace-brand__name">Scalar Boards</span>
            </Link>
          </div>
        </header>
        <div className="loading-shell">
          <div className="loading-spinner">{loadError || 'Board not found.'}</div>
        </div>
      </div>
    );
  }

  const isFavorite = favoriteBoardIds.includes(board.id);

  return (
    <div className="board-shell" style={getAccentStyles(board.background)}>
      <header className="workspace-topbar workspace-topbar--board">
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

        <div className="workspace-topbar__search workspace-topbar__search--board">
          <SearchIcon size={17} />
          <input
            type="text"
            placeholder="Search cards in this board"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
          />
        </div>

        <div className="workspace-topbar__right">
          <Link to="/" className="btn btn--secondary">
            <ArrowLeftIcon size={16} />
            All boards
          </Link>
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

      <main className="board-page">
        <section className="board-hero">
          <div className="board-hero__main">
            <Link to="/" className="board-hero__crumb">
              <ArrowLeftIcon size={15} />
              Workspace
            </Link>

            {editingTitle ? (
              <input
                className="board-hero__title board-hero__title--editing"
                value={titleValue}
                onChange={event => setTitleValue(event.target.value)}
                onBlur={handleBoardTitleSave}
                onKeyDown={event => event.key === 'Enter' && handleBoardTitleSave()}
                autoFocus
              />
            ) : (
              <button type="button" className="board-hero__title" onClick={() => setEditingTitle(true)}>
                {board.title}
              </button>
            )}

            <p className="board-hero__copy">
              A Trello-style board canvas with extra summaries for attention tracking, favorites,
              and quick workspace return paths.
            </p>

            <div className="board-hero__chips">
              <span className="board-chip">
                <BoardsIcon size={15} />
                {board.lists.length} lists
              </span>
              <span className="board-chip">
                <MembersIcon size={15} />
                {assignedCount} assigned
              </span>
              <span className="board-chip">
                <ClockIcon size={15} />
                {dueSoonCount} due soon
              </span>
              <span className="board-chip">
                <CheckSquareIcon size={15} />
                {checklistProgress}% checklist progress
              </span>
            </div>
          </div>

          <div className="board-hero__side">
            <div className="board-hero__actions">
              <button
                type="button"
                className={`icon-btn icon-btn--large ${isFavorite ? 'icon-btn--active' : ''}`}
                onClick={toggleFavorite}
                aria-label="Toggle favorite board"
              >
                <StarIcon size={18} filled={isFavorite} />
              </button>

              <div className="board-toolbar__popover">
                <button
                  type="button"
                  className={`btn ${hasActiveFilters ? 'btn--primary' : 'btn--secondary'}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FilterIcon size={15} />
                  Filters {hasActiveFilters ? `(${activeFilterCount})` : ''}
                </button>
                {showFilters && (
                  <FilterPopover
                    labels={board.labels || []}
                    members={members}
                    filters={filters}
                    onFiltersChange={setFilters}
                    onClose={() => setShowFilters(false)}
                  />
                )}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setFilters({ labelIds: [], memberIds: [], due: null })}
                >
                  Clear
                </button>
              )}
            </div>

            <div className="board-hero__people">
              {(boardMembers.length > 0 ? boardMembers : members).slice(0, 4).map(member => (
                <span
                  key={member.id}
                  className="board-hero__person"
                  style={{ background: member.avatar_color }}
                  title={member.name}
                >
                  {getInitials(member.name)}
                </span>
              ))}
            </div>

            <div className="board-hero__stamp">Created {formatShortDate(board.created_at)}</div>
          </div>
        </section>

        <section className="board-insights">
          <article className="board-insight-card">
            <span>Cards in play</span>
            <strong>{allCards.length}</strong>
            <p>Live tasks distributed across the current board.</p>
          </article>

          <article className="board-insight-card">
            <span>Overdue</span>
            <strong>{overdueCount}</strong>
            <p>Cards that need attention before the next pass.</p>
          </article>

          <article className="board-insight-card">
            <span>Assigned work</span>
            <strong>{assignedCount}</strong>
            <p>Cards that already have at least one owner.</p>
          </article>

          <article className="board-insight-card board-insight-card--wide">
            <div className="board-insight-card__header">
              <div>
                <span>Needs attention</span>
                <strong>Priority queue</strong>
              </div>
            </div>

            <div className="board-focus-list">
              {attentionCards.length > 0 ? attentionCards.map(card => {
                const dueStatus = getDueDateStatus(card.due_date);
                const attentionLabel = dueStatus === 'overdue'
                  ? 'Overdue'
                  : dueStatus === 'due-soon'
                    ? 'Due soon'
                    : 'Unassigned';

                return (
                  <button
                    key={card.id}
                    type="button"
                    className="board-focus-list__item"
                    onClick={() => setSelectedCardId(card.id)}
                  >
                    <div>
                      <strong>{card.title}</strong>
                      <span>{card.listTitle}</span>
                    </div>
                    <small>{attentionLabel}</small>
                  </button>
                );
              }) : (
                <div className="workspace-empty-copy">No urgent cards right now.</div>
              )}
            </div>
          </article>

          <article className="board-insight-card board-insight-card--wide">
            <span>Top labels</span>
            <strong>Board activity markers</strong>
            <div className="board-label-summary">
              {labelUsage.length > 0 ? labelUsage.map(label => (
                <div key={label.id} className="board-label-summary__item">
                  <span className="board-label-summary__swatch" style={{ background: label.color }} />
                  <span>{label.name || 'Untitled label'}</span>
                  <strong>{label.total}</strong>
                </div>
              )) : (
                <div className="workspace-empty-copy">Add labels to cards to get a summary here.</div>
              )}
            </div>
          </article>
        </section>

        <section className="board-content">
          <div className="board-content__header">
            <div>
              <span className="workspace-section__eyebrow">Board lanes</span>
              <h2>Move work the same way Trello does, with cleaner structure.</h2>
            </div>
            <p>
              Drag lists or cards to reorder the board. Search and filters update every lane in
              real time without changing the underlying backend.
            </p>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="board" direction="horizontal" type="list">
              {(provided) => (
                <div className="board-lists-shell">
                  <div
                    className="board-lists"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {board.lists.map((list, index) => (
                      <List
                        key={list.id}
                        list={{ ...list, cards: filterCards(list.cards) }}
                        index={index}
                        onUpdateTitle={(title) => handleUpdateList(list.id, title)}
                        onDelete={() => handleDeleteList(list.id)}
                        onAddCard={(title) => handleAddCard(list.id, title)}
                        onCardClick={(cardId) => setSelectedCardId(cardId)}
                      />
                    ))}
                    {provided.placeholder}
                    <AddListForm onAdd={handleAddList} />
                  </div>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </section>
      </main>

      {selectedCardId && (
        <CardDetailModal
          cardId={selectedCardId}
          listName={selectedCardList?.title}
          boardLabels={board.labels || []}
          members={members}
          onClose={() => setSelectedCardId(null)}
          onUpdate={handleCardUpdate}
          onDelete={(cardId) => {
            const list = board.lists.find(item => item.cards.some(card => card.id === cardId));
            if (list) handleDeleteCard(cardId, list.id);
          }}
        />
      )}
    </div>
  );
}
