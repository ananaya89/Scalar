import { useState, useRef, useEffect } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import Card from './Card.jsx';
import { MoreIcon, PlusIcon } from './Icons.jsx';

export default function List({ list, index, onUpdateTitle, onDelete, onAddCard, onCardClick }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(list.title);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const titleRef = useRef(null);
  const cardInputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (editingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (showAddCard && cardInputRef.current) {
      cardInputRef.current.focus();
    }
  }, [showAddCard]);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleTitleBlur = () => {
    if (titleValue.trim() && titleValue.trim() !== list.title) {
      onUpdateTitle(titleValue.trim());
    } else {
      setTitleValue(list.title);
    }
    setEditingTitle(false);
  };

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return;
    await onAddCard(newCardTitle.trim());
    setNewCardTitle('');
    setShowAddCard(false);
  };

  return (
    <Draggable draggableId={`list-${list.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          className={`list ${snapshot.isDragging ? 'list--dragging' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div className="list__header" {...provided.dragHandleProps}>
            <div className="list__title-wrap">
              {editingTitle ? (
                <input
                  ref={titleRef}
                  className="list__title"
                  value={titleValue}
                  onChange={e => setTitleValue(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleTitleBlur();
                    if (e.key === 'Escape') {
                      setTitleValue(list.title);
                      setEditingTitle(false);
                    }
                  }}
                />
              ) : (
                <button type="button" className="list__title" onClick={() => setEditingTitle(true)}>
                  {list.title}
                </button>
              )}
              <span className="list__count">{list.cards.length}</span>
            </div>

            <div className="list__actions">
              <button type="button" className="list__menu-btn" onClick={() => setShowMenu(!showMenu)}>
                <MoreIcon size={16} />
              </button>
              {showMenu && (
                <div className="list-menu" ref={menuRef}>
                  <button
                    type="button"
                    className="list-menu__item"
                    onClick={() => {
                      setShowAddCard(true);
                      setShowMenu(false);
                    }}
                  >
                    + Add card
                  </button>
                  <button
                    type="button"
                    className="list-menu__item list-menu__item--danger"
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                  >
                    Delete list
                  </button>
                </div>
              )}
            </div>
          </div>

          <Droppable droppableId={list.id.toString()} type="card">
            {(dropProvided, dropSnapshot) => (
              <div
                className={`list__cards ${dropSnapshot.isDraggingOver ? 'list__cards--active' : ''}`}
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
              >
                {list.cards.map((card, cardIndex) => (
                  <Card
                    key={card.id}
                    card={card}
                    index={cardIndex}
                    onClick={() => onCardClick(card.id)}
                  />
                ))}
                {dropProvided.placeholder}

                {list.cards.length === 0 && !showAddCard && (
                  <div className="list__empty">
                    No cards yet. Add the first task in this lane.
                  </div>
                )}

                {showAddCard && (
                  <div className="add-card-form">
                    <textarea
                      ref={cardInputRef}
                      placeholder="Enter a title for this card..."
                      value={newCardTitle}
                      onChange={e => setNewCardTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddCard();
                        }
                        if (e.key === 'Escape') {
                          setShowAddCard(false);
                          setNewCardTitle('');
                        }
                      }}
                    />
                    <div className="add-card-form__actions">
                      <button type="button" className="btn btn--primary" onClick={handleAddCard}>
                        Add card
                      </button>
                      <button
                        type="button"
                        className="add-card-form__close"
                        onClick={() => {
                          setShowAddCard(false);
                          setNewCardTitle('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Droppable>

          <div className="list__footer">
            {!showAddCard && (
              <button type="button" className="add-card-btn" onClick={() => setShowAddCard(true)}>
                <PlusIcon size={15} />
                Add a card
              </button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
