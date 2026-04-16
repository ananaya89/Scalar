import { useEffect, useMemo, useState } from 'react';
import * as api from '../api/index.js';
import { CloseIcon, SparklesIcon } from './Icons.jsx';

const BOARD_COLORS = [
  '#0c66e4',
  '#14b8a6',
  '#f59e0b',
  '#ec4899',
  '#16a34a',
  '#334155',
];

export default function BoardSettingsModal({ board, onClose, onSaved, onDeleted }) {
  const [title, setTitle] = useState(board.title);
  const [background, setBackground] = useState(board.background || BOARD_COLORS[0]);
  const [labels, setLabels] = useState(() =>
    (board.labels || []).map((label) => ({ ...label }))
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const hasChanges = useMemo(() => {
    if (title !== board.title || background !== board.background) {
      return true;
    }

    return labels.some((label, index) => {
      const original = board.labels?.[index];
      return !original || label.name !== original.name || label.color !== original.color;
    });
  }, [background, board.background, board.labels, board.title, labels, title]);

  const handleLabelChange = (labelId, field, value) => {
    setLabels((current) =>
      current.map((label) => (
        label.id === labelId ? { ...label, [field]: value } : label
      ))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      if (title !== board.title || background !== board.background) {
        await api.updateBoard(board.id, { title: title.trim() || board.title, background });
      }

      const labelUpdates = labels.filter((label, index) => {
        const original = board.labels?.[index];
        return original && (label.name !== original.name || label.color !== original.color);
      });

      await Promise.all(
        labelUpdates.map((label) =>
          api.updateLabel(board.id, label.id, { name: label.name, color: label.color })
        )
      );

      await onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save board settings:', err);
      setError('Unable to save board settings right now.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Delete "${board.title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      await api.deleteBoard(board.id);
      await onDeleted();
    } catch (err) {
      console.error('Failed to delete board:', err);
      setError('Unable to delete this board right now.');
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content board-settings-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="card-detail__close" onClick={onClose}>
          <CloseIcon size={16} />
          Close
        </button>

        <div className="board-settings-modal__hero">
          <span className="workspace-section__eyebrow">
            <SparklesIcon size={15} />
            Board settings
          </span>
          <h2>Refine the board identity and label system.</h2>
          <p>
            Update the board title, change the accent color, and give every label a clearer name.
          </p>
        </div>

        <div className="board-settings-modal__body">
          <section className="board-settings-panel">
            <h3>Board identity</h3>
            <div className="form-field">
              <label>Board title</label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Board title"
              />
            </div>

            <div className="form-field">
              <label>Board color</label>
              <div className="theme-grid">
                {BOARD_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`theme-swatch ${background === color ? 'theme-swatch--selected' : ''}`}
                    onClick={() => setBackground(color)}
                  >
                    <span className="theme-swatch__chip" style={{ background: color }} />
                    <span>{color}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="board-settings-preview" style={{ '--settings-accent': background }}>
              <div className="board-settings-preview__cover" />
              <strong>{title || board.title}</strong>
              <span>{labels.length} labels configured</span>
            </div>
          </section>

          <section className="board-settings-panel">
            <h3>Label system</h3>
            <div className="board-label-editor">
              {labels.map((label) => (
                <div key={label.id} className="board-label-editor__row">
                  <input
                    type="text"
                    value={label.name}
                    onChange={(event) => handleLabelChange(label.id, 'name', event.target.value)}
                    placeholder="Label name"
                  />
                  <input
                    type="color"
                    className="board-label-editor__color"
                    value={label.color}
                    onChange={(event) => handleLabelChange(label.id, 'color', event.target.value)}
                    aria-label="Choose label color"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {error && <div className="board-settings-modal__error">{error}</div>}

        <div className="modal-actions board-settings-modal__actions">
          <button type="button" className="btn btn--danger" onClick={handleDelete} disabled={saving || deleting}>
            {deleting ? 'Deleting...' : 'Delete board'}
          </button>
          <div className="board-settings-modal__action-group">
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={saving || deleting}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleSave}
              disabled={!hasChanges || saving || deleting || !title.trim()}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
