import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/index.js';
import { formatLongDate, getDueDateStatus, getInitials } from '../utils/ui.js';
import { CloseIcon } from './Icons.jsx';

export default function CardDetailModal({ cardId, listName, boardLabels, members, onClose, onUpdate, onDelete }) {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [titleValue, setTitleValue] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState('');
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateValue, setDateValue] = useState('');
  const [showChecklistForm, setShowChecklistForm] = useState(false);
  const [checklistTitle, setChecklistTitle] = useState('Checklist');
  const [addingItemTo, setAddingItemTo] = useState(null);
  const [newItemText, setNewItemText] = useState('');

  const loadCard = useCallback(async () => {
    try {
      const data = await api.getCard(cardId);
      setCard(data);
      setTitleValue(data.title);
      setDescValue(data.description || '');
      setDateValue(data.due_date || '');
    } catch (err) {
      console.error('Failed to load card:', err);
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    loadCard();
  }, [loadCard]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleTitleBlur = async () => {
    if (titleValue.trim() && titleValue.trim() !== card.title) {
      await api.updateCard(cardId, { title: titleValue.trim() });
      onUpdate();
    }
  };

  const handleDescSave = async () => {
    await api.updateCard(cardId, { description: descValue });
    setCard(prev => ({ ...prev, description: descValue }));
    setEditingDesc(false);
    onUpdate();
  };

  const handleToggleLabel = async (labelId) => {
    const hasLabel = card.labels.some(label => label.id === labelId);
    if (hasLabel) {
      const labels = await api.removeCardLabel(cardId, labelId);
      setCard(prev => ({ ...prev, labels }));
    } else {
      const labels = await api.addCardLabel(cardId, labelId);
      setCard(prev => ({ ...prev, labels }));
    }
    onUpdate();
  };

  const handleToggleMember = async (memberId) => {
    const hasMember = card.members.some(member => member.id === memberId);
    if (hasMember) {
      const updatedMembers = await api.removeCardMember(cardId, memberId);
      setCard(prev => ({ ...prev, members: updatedMembers }));
    } else {
      const updatedMembers = await api.addCardMember(cardId, memberId);
      setCard(prev => ({ ...prev, members: updatedMembers }));
    }
    onUpdate();
  };

  const handleDateSave = async () => {
    await api.updateCard(cardId, { due_date: dateValue || null });
    setCard(prev => ({ ...prev, due_date: dateValue || null }));
    setShowDatePicker(false);
    onUpdate();
  };

  const handleRemoveDate = async () => {
    await api.updateCard(cardId, { due_date: null });
    setCard(prev => ({ ...prev, due_date: null }));
    setDateValue('');
    setShowDatePicker(false);
    onUpdate();
  };

  const handleCreateChecklist = async () => {
    const checklist = await api.createChecklist(cardId, checklistTitle || 'Checklist');
    setCard(prev => ({ ...prev, checklists: [...(prev.checklists || []), checklist] }));
    setShowChecklistForm(false);
    setChecklistTitle('Checklist');
    onUpdate();
  };

  const handleDeleteChecklist = async (checklistId) => {
    await api.deleteChecklist(checklistId);
    setCard(prev => ({
      ...prev,
      checklists: prev.checklists.filter(checklist => checklist.id !== checklistId),
    }));
    onUpdate();
  };

  const handleAddItem = async (checklistId) => {
    if (!newItemText.trim()) return;
    const item = await api.addChecklistItem(checklistId, newItemText.trim());
    setCard(prev => ({
      ...prev,
      checklists: prev.checklists.map(checklist =>
        checklist.id === checklistId
          ? { ...checklist, items: [...checklist.items, item] }
          : checklist
      ),
    }));
    setNewItemText('');
    onUpdate();
  };

  const handleToggleItem = async (itemId, completed) => {
    await api.updateChecklistItem(itemId, { completed: completed ? 0 : 1 });
    setCard(prev => ({
      ...prev,
      checklists: prev.checklists.map(checklist => ({
        ...checklist,
        items: checklist.items.map(item =>
          item.id === itemId ? { ...item, completed: completed ? 0 : 1 } : item
        ),
      })),
    }));
    onUpdate();
  };

  const handleDeleteItem = async (itemId, checklistId) => {
    await api.deleteChecklistItem(itemId);
    setCard(prev => ({
      ...prev,
      checklists: prev.checklists.map(checklist =>
        checklist.id === checklistId
          ? { ...checklist, items: checklist.items.filter(item => item.id !== itemId) }
          : checklist
      ),
    }));
    onUpdate();
  };

  const handleArchive = async () => {
    onDelete(cardId);
    onClose();
  };

  if (loading || !card) {
    return (
      <div className="card-detail-overlay" onClick={onClose}>
        <div className="card-detail" onClick={event => event.stopPropagation()}>
          <div className="loading-shell">
            <div className="loading-spinner">Loading card details...</div>
          </div>
        </div>
      </div>
    );
  }

  const dueStatus = getDueDateStatus(card.due_date);
  const currentListName = listName || card.list_title || 'Current list';
  const checklistList = card.checklists || [];
  const selectedLabels = card.labels || [];
  const selectedMembers = card.members || [];

  return (
    <div className="card-detail-overlay" onClick={onClose}>
      <div className="card-detail" onClick={event => event.stopPropagation()}>
        <button type="button" className="card-detail__close" onClick={onClose}>
          <CloseIcon size={16} />
          Close
        </button>

        <div className="card-detail__hero">
          <span className="card-detail__eyebrow">Card details</span>
          <input
            className="card-detail__title"
            value={titleValue}
            onChange={e => setTitleValue(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={e => e.key === 'Enter' && e.target.blur()}
          />
          <div className="card-detail__list-name">
            Currently in <strong>{currentListName}</strong>
          </div>

          <div className="card-detail__top-grid">
            <div className="detail-group">
              <div className="detail-group__label">Labels</div>
              <div className="detail-group__content">
                {selectedLabels.length > 0 ? (
                  <>
                    {selectedLabels.map(label => (
                      <button
                        key={label.id}
                        type="button"
                        className="detail-label"
                        style={{ background: label.color }}
                        onClick={() => setShowLabelPicker(true)}
                      >
                        {label.name || 'Label'}
                      </button>
                    ))}
                    <button type="button" className="detail-chip" onClick={() => setShowLabelPicker(true)}>
                      Manage
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="detail-chip detail-chip--empty"
                    onClick={() => setShowLabelPicker(true)}
                  >
                    Add labels
                  </button>
                )}
              </div>
            </div>

            <div className="detail-group">
              <div className="detail-group__label">Members</div>
              <div className="detail-group__content">
                {selectedMembers.length > 0 ? (
                  <>
                    {selectedMembers.map(member => (
                      <button
                        key={member.id}
                        type="button"
                        className="member-avatar"
                        style={{ background: member.avatar_color }}
                        onClick={() => setShowMemberPicker(true)}
                        title={member.name}
                      >
                        {getInitials(member.name)}
                      </button>
                    ))}
                    <button type="button" className="detail-chip" onClick={() => setShowMemberPicker(true)}>
                      Manage
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="detail-chip detail-chip--empty"
                    onClick={() => setShowMemberPicker(true)}
                  >
                    Assign people
                  </button>
                )}
              </div>
            </div>

            <div className="detail-group">
              <div className="detail-group__label">Due date</div>
              <div className="detail-group__content">
                {card.due_date ? (
                  <>
                    <span className={`due-date-badge ${
                      dueStatus === 'overdue' ? 'due-date-badge--overdue' :
                      dueStatus === 'due-soon' ? 'due-date-badge--soon' : ''
                    }`}>
                      {formatLongDate(card.due_date)}
                      {dueStatus === 'overdue' ? ' - overdue' : ''}
                      {dueStatus === 'due-soon' ? ' - due soon' : ''}
                    </span>
                    <button type="button" className="detail-chip" onClick={() => setShowDatePicker(true)}>
                      Edit
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="detail-chip detail-chip--empty"
                    onClick={() => setShowDatePicker(true)}
                  >
                    Set due date
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card-detail__body">
          <div className="card-detail__main">
            <div className="card-detail__section">
              <div className="card-detail__section-header">
                <h3 className="card-detail__section-title">Description</h3>
                {card.description && !editingDesc && (
                  <button type="button" className="btn btn--secondary" onClick={() => setEditingDesc(true)}>
                    Edit
                  </button>
                )}
              </div>
              <div className="card-detail__section-content">
                {editingDesc ? (
                  <div className="description-editor">
                    <textarea
                      value={descValue}
                      onChange={e => setDescValue(e.target.value)}
                      placeholder="Add a more detailed description..."
                      autoFocus
                    />
                    <div className="description-editor__actions">
                      <button type="button" className="btn btn--primary" onClick={handleDescSave}>
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => {
                          setEditingDesc(false);
                          setDescValue(card.description || '');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : card.description ? (
                  <div className="description-text" onClick={() => setEditingDesc(true)}>
                    {card.description}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="description-editor__placeholder glass"
                    onClick={() => setEditingDesc(true)}
                  >
                    Add a more detailed description...
                  </button>
                )}
              </div>
            </div>

            {checklistList.map(checklist => {
              const total = checklist.items?.length || 0;
              const completed = checklist.items?.filter(item => item.completed).length || 0;
              const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

              return (
                <div key={checklist.id} className="checklist">
                  <div className="checklist__header">
                    <div>
                      <h3 className="checklist__title">{checklist.title}</h3>
                      <div className="checklist__meta">{completed} of {total} items complete</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn--secondary checklist__delete"
                      onClick={() => handleDeleteChecklist(checklist.id)}
                    >
                      Delete
                    </button>
                  </div>

                  {total > 0 && (
                    <div className="checklist__progress">
                      <div className="checklist__progress-text">{pct}%</div>
                      <div className="checklist__progress-bar">
                        <div
                          className={`checklist__progress-fill ${pct === 100 ? 'checklist__progress-fill--complete' : ''}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="checklist__items">
                    {(checklist.items || []).map(item => (
                      <div key={item.id} className="checklist-item">
                        <button
                          type="button"
                          className={`checklist-item__checkbox ${item.completed ? 'checklist-item__checkbox--checked' : ''}`}
                          onClick={() => handleToggleItem(item.id, item.completed)}
                        >
                          {item.completed ? 'Done' : 'Open'}
                        </button>
                        <span className={`checklist-item__text ${item.completed ? 'checklist-item__text--checked' : ''}`}>
                          {item.text}
                        </span>
                        <button
                          type="button"
                          className="checklist-item__delete"
                          onClick={() => handleDeleteItem(item.id, checklist.id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {addingItemTo === checklist.id ? (
                    <div className="checklist__add-form">
                      <input
                        type="text"
                        placeholder="Add an item..."
                        value={newItemText}
                        onChange={e => setNewItemText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            handleAddItem(checklist.id);
                          }
                          if (e.key === 'Escape') {
                            setAddingItemTo(null);
                            setNewItemText('');
                          }
                        }}
                        autoFocus
                      />
                      <div className="checklist__add-actions">
                        <button type="button" className="btn btn--primary" onClick={() => handleAddItem(checklist.id)}>
                          Add
                        </button>
                        <button
                          type="button"
                          className="btn btn--secondary"
                          onClick={() => {
                            setAddingItemTo(null);
                            setNewItemText('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="checklist__add-item">
                      <button
                        type="button"
                        className="checklist__add-btn"
                        onClick={() => setAddingItemTo(checklist.id)}
                      >
                        Add an item
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {checklistList.length === 0 && (
              <div className="empty-panel">
                No checklists yet. Use the controls on the right to break this card into sub-tasks.
              </div>
            )}
          </div>

          <div className="card-detail__sidebar">
            <div className="sidebar-section">
              <div className="sidebar-section__title">Add to card</div>
              <button type="button" className="sidebar-btn" onClick={() => setShowMemberPicker(!showMemberPicker)}>
                Members
              </button>
              <button type="button" className="sidebar-btn" onClick={() => setShowLabelPicker(!showLabelPicker)}>
                Labels
              </button>
              <button type="button" className="sidebar-btn" onClick={() => setShowChecklistForm(!showChecklistForm)}>
                Checklist
              </button>
              <button type="button" className="sidebar-btn" onClick={() => setShowDatePicker(!showDatePicker)}>
                Due date
              </button>
            </div>

            {showChecklistForm && (
              <div className="picker-panel">
                <div className="picker-panel__title">Create checklist</div>
                <div className="form-field">
                  <label>Checklist Title</label>
                  <input
                    type="text"
                    value={checklistTitle}
                    onChange={e => setChecklistTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreateChecklist()}
                    autoFocus
                  />
                </div>
                <div className="picker-panel__actions">
                  <button type="button" className="btn btn--primary" onClick={handleCreateChecklist}>Add</button>
                  <button type="button" className="btn btn--secondary" onClick={() => setShowChecklistForm(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {showDatePicker && (
              <div className="picker-panel">
                <div className="picker-panel__title">Set due date</div>
                <div className="form-field">
                  <label>Due Date</label>
                  <input
                    type="date"
                    className="date-picker-input"
                    value={dateValue}
                    onChange={e => setDateValue(e.target.value)}
                  />
                </div>
                <div className="picker-panel__actions picker-panel__actions--wrap">
                  <button type="button" className="btn btn--primary" onClick={handleDateSave}>Save</button>
                  {card.due_date && (
                    <button type="button" className="btn btn--danger" onClick={handleRemoveDate}>Remove</button>
                  )}
                  <button type="button" className="btn btn--secondary" onClick={() => setShowDatePicker(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {showLabelPicker && (
              <div className="picker-panel">
                <div className="picker-panel__title">Labels</div>
                {boardLabels.map(label => {
                  const isSelected = selectedLabels.some(item => item.id === label.id);
                  return (
                    <div key={label.id} className="label-picker__item">
                      <button
                        type="button"
                        className="label-picker__color"
                        style={{ background: label.color }}
                        onClick={() => handleToggleLabel(label.id)}
                      >
                        {label.name || 'Label'}
                        {isSelected && <span className="label-picker__check">Selected</span>}
                      </button>
                    </div>
                  );
                })}
                <button type="button" className="btn btn--secondary btn--full" onClick={() => setShowLabelPicker(false)}>
                  Close
                </button>
              </div>
            )}

            {showMemberPicker && (
              <div className="picker-panel">
                <div className="picker-panel__title">Members</div>
                {members.map(member => {
                  const isSelected = selectedMembers.some(item => item.id === member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      className="member-picker__item"
                      onClick={() => handleToggleMember(member.id)}
                    >
                      <span className="member-picker__avatar" style={{ background: member.avatar_color }}>
                        {getInitials(member.name)}
                      </span>
                      <span className="member-picker__name">{member.name}</span>
                      {isSelected && <span className="member-picker__check">Selected</span>}
                    </button>
                  );
                })}
                <button type="button" className="btn btn--secondary btn--full" onClick={() => setShowMemberPicker(false)}>
                  Close
                </button>
              </div>
            )}

            <div className="sidebar-section">
              <div className="sidebar-section__title">Actions</div>
              <button type="button" className="sidebar-btn sidebar-btn--danger" onClick={handleArchive}>
                Delete card
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
