import React from 'react';
import { PartyGroup } from '../types/Session';
import './PartyMarker.css';

interface PartyMarkerProps {
  group: PartyGroup;
  onDragStart: (e: React.DragEvent, group: PartyGroup) => void;
  onDelete?: (groupId: number) => void;
}

const PartyMarker: React.FC<PartyMarkerProps> = ({ group, onDragStart, onDelete }) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onDelete) {
      onDelete(group.id);
    }
  };

  return (
    <div
      className="party-marker"
      draggable
      onDragStart={(e) => onDragStart(e, group)}
      style={{ backgroundColor: group.color }}
      title={`${group.name}: ${group.current_day}.${group.current_month + 1}.${group.current_year}`}
    >
      <span className="party-name">{group.name}</span>
      {onDelete && (
        <button 
          className="party-delete-btn"
          onClick={handleDeleteClick}
          title="Gruppe löschen"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default PartyMarker;