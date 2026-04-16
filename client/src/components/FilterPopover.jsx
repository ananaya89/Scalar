import { useEffect, useRef } from 'react';
import { getInitials } from '../utils/ui.js';

export default function FilterPopover({ labels, members, filters, onFiltersChange, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose();
      }
    };

    setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const toggleLabel = (id) => {
    onFiltersChange(prev => ({
      ...prev,
      labelIds: prev.labelIds.includes(id)
        ? prev.labelIds.filter(value => value !== id)
        : [...prev.labelIds, id],
    }));
  };

  const toggleMember = (id) => {
    onFiltersChange(prev => ({
      ...prev,
      memberIds: prev.memberIds.includes(id)
        ? prev.memberIds.filter(value => value !== id)
        : [...prev.memberIds, id],
    }));
  };

  const setDue = (value) => {
    onFiltersChange(prev => ({
      ...prev,
      due: prev.due === value ? null : value,
    }));
  };

  const clearFilters = () => {
    onFiltersChange({ labelIds: [], memberIds: [], due: null });
  };

  const hasFilters = filters.labelIds.length > 0 || filters.memberIds.length > 0 || filters.due !== null;

  return (
    <div className="filter-popover glass" ref={ref}>
      <div className="filter-popover__header">
        <div>
          <div className="filter-popover__title">Refine board view</div>
          <div className="filter-popover__subtitle">Stack filters by label, owner, or due date.</div>
        </div>
        {hasFilters && (
          <button type="button" className="filter-popover__clear" onClick={clearFilters}>
            Reset
          </button>
        )}
      </div>

      <div className="filter-section">
        <div className="filter-section__label">Labels</div>
        {labels.map(label => (
          <button
            key={label.id}
            type="button"
            className={`filter-option ${filters.labelIds.includes(label.id) ? 'filter-option--selected' : ''}`}
            onClick={() => toggleLabel(label.id)}
          >
            <div className="filter-option__checkbox">
              {filters.labelIds.includes(label.id) && 'Selected'}
            </div>
            <span className="filter-option__swatch" style={{ background: label.color }} />
            <span>{label.name || label.color}</span>
          </button>
        ))}
      </div>

      <div className="filter-section">
        <div className="filter-section__label">Members</div>
        {members.map(member => (
          <button
            key={member.id}
            type="button"
            className={`filter-option ${filters.memberIds.includes(member.id) ? 'filter-option--selected' : ''}`}
            onClick={() => toggleMember(member.id)}
          >
            <div className="filter-option__checkbox">
              {filters.memberIds.includes(member.id) && 'Selected'}
            </div>
            <span className="filter-option__avatar" style={{ background: member.avatar_color }}>
              {getInitials(member.name)}
            </span>
            <span>{member.name}</span>
          </button>
        ))}
      </div>

      <div className="filter-section">
        <div className="filter-section__label">Due Date</div>
        {[
          { value: 'overdue', label: 'Overdue' },
          { value: 'soon', label: 'Due in next 7 days' },
          { value: 'none', label: 'No due date' },
        ].map(option => (
          <button
            key={option.value}
            type="button"
            className={`filter-option ${filters.due === option.value ? 'filter-option--selected' : ''}`}
            onClick={() => setDue(option.value)}
          >
            <div className="filter-option__checkbox">
              {filters.due === option.value && 'Selected'}
            </div>
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      {hasFilters && (
        <button type="button" className="btn btn--secondary btn--full filter-clear-btn" onClick={clearFilters}>
          Clear all filters
        </button>
      )}
    </div>
  );
}
