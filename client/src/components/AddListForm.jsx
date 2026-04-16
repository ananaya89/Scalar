import { useState, useRef, useEffect } from 'react';
import { PlusIcon } from './Icons.jsx';

export default function AddListForm({ onAdd }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    await onAdd(title.trim());
    setTitle('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button type="button" className="add-list-btn" onClick={() => setIsOpen(true)}>
        <span className="add-list-btn__icon">
          <PlusIcon size={18} />
        </span>
        <span className="add-list-btn__copy">
          <strong>Add another list</strong>
          <span>Create a new lane on the board.</span>
        </span>
      </button>
    );
  }

  return (
    <div className="add-list-form">
      <input
        ref={inputRef}
        type="text"
        placeholder="Enter list title..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleSubmit();
          if (e.key === 'Escape') {
            setIsOpen(false);
            setTitle('');
          }
        }}
      />
      <div className="add-list-form__actions">
        <button type="button" className="btn btn--primary" onClick={handleSubmit}>
          Add list
        </button>
        <button
          type="button"
          className="add-card-form__close"
          onClick={() => {
            setIsOpen(false);
            setTitle('');
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
