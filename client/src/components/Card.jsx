import { Draggable } from '@hello-pangea/dnd';
import { formatShortDate, getDueDateStatus, getInitials } from '../utils/ui.js';
import { CheckSquareIcon, ClockIcon, MembersIcon } from './Icons.jsx';

export default function Card({ card, index, onClick }) {
  const dueStatus = getDueDateStatus(card.due_date);
  const descriptionPreview = card.description?.trim();

  return (
    <Draggable draggableId={`card-${card.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          className={`card ${snapshot.isDragging ? 'card--dragging' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          style={provided.draggableProps.style}
        >
          {card.labels?.length > 0 && (
            <div className="card__labels">
              {card.labels.map(label => (
                <span
                  key={label.id}
                  className="card__label"
                  style={{ background: label.color }}
                  title={label.name}
                />
              ))}
            </div>
          )}

          <div className="card__title">{card.title}</div>
          {descriptionPreview && <p className="card__description">{descriptionPreview}</p>}

          {(card.due_date || card.checklist_stats || card.members?.length > 0) && (
            <div className="card__meta">
              {card.due_date && (
                <span className={`card__badge ${
                  dueStatus === 'overdue' ? 'card__badge--overdue' :
                  dueStatus === 'due-soon' ? 'card__badge--due-soon' : ''
                }`}>
                  <ClockIcon size={13} />
                  Due {formatShortDate(card.due_date)}
                </span>
              )}

              {card.checklist_stats && (
                <span className={`card__badge ${
                  card.checklist_stats.completed === card.checklist_stats.total
                    ? 'card__badge--complete' : ''
                }`}>
                  <CheckSquareIcon size={13} />
                  {card.checklist_stats.completed}/{card.checklist_stats.total} done
                </span>
              )}

              {card.members?.length > 0 && (
                <div className="card__members">
                  <span className="card__member-count">
                    <MembersIcon size={13} />
                    {card.members.length}
                  </span>
                  {card.members.slice(0, 3).map(member => (
                    <div
                      key={member.id}
                      className="card__member-avatar"
                      style={{ background: member.avatar_color }}
                      title={member.name}
                    >
                      {getInitials(member.name)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
