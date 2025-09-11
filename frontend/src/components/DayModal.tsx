import React, { useState } from 'react';
import './DayModal.css';

interface RecurringEventOptions {
  isRecurring: boolean;
  type?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  endDate?: string;
}

interface Category {
  id: number;
  name: string;
  color: string;
  emoji: string;
}

interface DayModalProps {
  day: number;
  existingEvents: Array<{id: number; title: string; description?: string; confirmed?: boolean; is_recurring?: boolean; category_id?: number; recurring_parent_id?: number}>;
  onClose: () => void;
  onAddEvent: (title: string, description: string, recurringOptions?: RecurringEventOptions, categoryId?: number) => void;
  onAddNote: (content: string) => void;
  onDeleteEvent?: (eventId: number, deleteSeries?: boolean) => void;
  onConfirmEvent?: (eventId: number, confirmed: boolean) => void;
  categories?: Category[];
  currentRole?: 'DM' | 'Player';
}

const DayModal: React.FC<DayModalProps> = ({ day, existingEvents, onClose, onAddEvent, onAddNote, onDeleteEvent, onConfirmEvent, categories = [], currentRole = 'Player' }) => {
  const [selectedType, setSelectedType] = useState<'event' | 'note' | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [noteContent, setNoteContent] = useState('');
  
  // Recurring event states
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [recurringInterval, setRecurringInterval] = useState(1);
  const [recurringEndDate, setRecurringEndDate] = useState('');
  
  // Category state
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{id: number; title: string; is_recurring?: boolean; recurring_parent_id?: number} | null>(null);

  const handleSubmit = () => {
    if (selectedType === 'event' && title.trim()) {
      const recurringOptions: RecurringEventOptions = {
        isRecurring,
        type: isRecurring ? recurringType : undefined,
        interval: isRecurring ? recurringInterval : undefined,
        endDate: isRecurring && recurringEndDate ? recurringEndDate : undefined
      };
      onAddEvent(title, description, recurringOptions, selectedCategoryId);
      onClose();
    } else if (selectedType === 'note' && noteContent.trim()) {
      onAddNote(noteContent);
      onClose();
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setNoteContent('');
    setIsRecurring(false);
    setRecurringType('weekly');
    setRecurringInterval(1);
    setRecurringEndDate('');
    setSelectedCategoryId(undefined);
  };

  const handleTypeSelect = (type: 'event' | 'note') => {
    setSelectedType(type);
    resetForm();
  };

  const existingNotes = existingEvents.filter(event => event.title.startsWith('📝'));
  const existingRegularEvents = existingEvents.filter(event => !event.title.startsWith('📝'));
  
  const getCategoryForEvent = (event: any) => {
    return categories?.find?.(cat => cat.id === event.category_id);
  };

  const handleDeleteClick = (event: any) => {
    setEventToDelete(event);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = (deleteSeries: boolean = false) => {
    if (eventToDelete && onDeleteEvent) {
      onDeleteEvent(eventToDelete.id, deleteSeries);
      setShowDeleteModal(false);
      setEventToDelete(null);
    }
  };

  const isPartOfSeries = (event: any) => {
    return event.is_recurring || event.recurring_parent_id;
  };

  return (
    <div className="day-modal-overlay" onClick={onClose}>
      <div className="day-modal" onClick={(e) => e.stopPropagation()}>
        <div className="day-modal-header">
          <h3>Tag {day}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        
        {!selectedType ? (
          <div className="modal-content">
            {/* Existing Events and Notes */}
            {existingEvents.length > 0 && (
              <div className="existing-items">
                <h4>Vorhandene Einträge</h4>
                
                {existingRegularEvents.length > 0 && (
                  <div className="existing-section">
                    <h5>📅 Events</h5>
                    {existingRegularEvents.map(event => {
                      const category = getCategoryForEvent(event);
                      return (
                        <div key={event.id} className={`existing-item event-item ${event.confirmed ? 'confirmed' : 'unconfirmed'}`}>
                          <div className="item-content">
                            <strong>
                              {event.confirmed ? '✅' : '⏳'} {event.is_recurring ? '🔄' : ''} 
                              {category && <span style={{color: category.color}}>{category.emoji} </span>}
                              {event.title}
                            </strong>
                            {event.description && <p>{event.description}</p>}
                            {event.is_recurring && (
                              <small className="recurring-indicator">Wiederkehrendes Event</small>
                            )}
                            {category && (
                              <small className="category-indicator" style={{color: category.color}}>
                                {category.name}
                              </small>
                            )}
                          </div>
                        <div className="item-actions">
                          {onConfirmEvent && (
                            <button 
                              className={`confirm-btn ${event.confirmed ? 'confirmed' : ''}`}
                              onClick={() => onConfirmEvent(event.id, !event.confirmed)}
                              title={event.confirmed ? 'Event als offen markieren' : 'Event bestätigen'}
                            >
                              {event.confirmed ? '↺' : '✓'}
                            </button>
                          )}
                          {onDeleteEvent && (
                            <button 
                              className="delete-item-btn"
                              onClick={() => handleDeleteClick(event)}
                              title="Event löschen"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}

                {existingNotes.length > 0 && (
                  <div className="existing-section">
                    <h5>📝 Notizen</h5>
                    {existingNotes.map(note => (
                      <div key={note.id} className="existing-item note-item">
                        <div className="item-content">
                          <p>{note.description || ''}</p>
                        </div>
                        <div className="item-actions">
                          {onDeleteEvent && (
                            <button 
                              className="delete-item-btn"
                              onClick={() => handleDeleteClick(note)}
                              title="Notiz löschen"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <hr className="section-divider" />
              </div>
            )}
            
            {/* Add New Section */}
            <div className="type-selection">
              <h4>{existingEvents.length > 0 ? 'Neuen Eintrag hinzufügen' : 'Was möchtest du hinzufügen?'}</h4>
              {currentRole !== 'DM' && (
                <div className="permission-notice">
                  <p>⚔️ Als Spieler kannst du nur Notizen erstellen.</p>
                  <p>👑 Events können nur vom Dungeon Master erstellt werden.</p>
                </div>
              )}
              <div className="type-buttons">
                {currentRole === 'DM' && (
                  <button 
                    className="type-button event-button" 
                    onClick={() => handleTypeSelect('event')}
                  >
                    📅 Event
                    <small>Einmalige oder wiederkehrende Termine</small>
                  </button>
                )}
                <button 
                  className="type-button note-button" 
                  onClick={() => handleTypeSelect('note')}
                >
                  📝 Notiz
                  <small>Allgemeine Notizen und Beschreibungen</small>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="content-form">
            <div className="form-header">
              <button 
                className="back-button" 
                onClick={() => setSelectedType(null)}
              >
                ← Zurück
              </button>
              <h4>
                {selectedType === 'event' ? '📅 Event hinzufügen' : '📝 Notiz hinzufügen'}
              </h4>
            </div>
            
            {selectedType === 'event' ? (
              <div className="event-form">

                <input
                  type="text"
                  placeholder="Event Titel"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
                <textarea
                  placeholder="Event Beschreibung (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
                
                {/* Category Selection */}
                {categories.length > 0 && (
                  <div className="category-selection">
                    <label>
                      Kategorie (optional):
                      <select
                        value={selectedCategoryId || ''}
                        onChange={(e) => setSelectedCategoryId(e.target.value ? parseInt(e.target.value) : undefined)}
                      >
                        <option value="">Keine Kategorie</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.emoji} {category.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
                
                {/* Recurring Event Options */}
                <div className="recurring-options">
                  <div className="recurring-checkbox">
                    <input
                      type="checkbox"
                      id="recurring-checkbox"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                    />
                    <label htmlFor="recurring-checkbox">Wiederkehrend</label>
                  </div>
                  
                  {isRecurring && (
                    <div className="recurring-settings">
                      <div className="form-row">
                        <label>
                          Wiederholen:
                          <select
                            value={recurringType}
                            onChange={(e) => setRecurringType(e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')}
                          >
                            <option value="daily">Täglich</option>
                            <option value="weekly">Wöchentlich</option>
                            <option value="monthly">Monatlich</option>
                            <option value="yearly">Jährlich</option>
                          </select>
                        </label>
                        
                        <label>
                          Alle:
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={recurringInterval}
                            onChange={(e) => setRecurringInterval(parseInt(e.target.value) || 1)}
                          />
                          {recurringType === 'daily' && ' Tag(e)'}
                          {recurringType === 'weekly' && ' Woche(n)'}
                          {recurringType === 'monthly' && ' Monat(e)'}
                          {recurringType === 'yearly' && ' Jahr(e)'}
                        </label>
                      </div>
                      
                      <label>
                        Ende (optional):
                        <input
                          type="date"
                          value={recurringEndDate}
                          onChange={(e) => setRecurringEndDate(e.target.value)}
                        />
                      </label>
                      
                      <small className="recurring-help">
                        Ohne Enddatum werden die nächsten 20 Events erstellt
                      </small>
                    </div>
                  )}
                </div>
                
                {/* Event Form Actions */}
                <div className="form-actions">
                  <button 
                    className="cancel-button" 
                    onClick={onClose}
                  >
                    Abbrechen
                  </button>
                  <button 
                    className="submit-button" 
                    onClick={handleSubmit}
                    disabled={!title.trim()}
                  >
                    {isRecurring ? 'Wiederkehrende Events erstellen' : 'Event hinzufügen'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="note-form">
                <textarea
                  placeholder="Notiz schreiben..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={6}
                  autoFocus
                />
                
                {/* Note Form Actions */}
                <div className="form-actions">
                  <button 
                    className="cancel-button" 
                    onClick={onClose}
                  >
                    Abbrechen
                  </button>
                  <button 
                    className="submit-button" 
                    onClick={handleSubmit}
                    disabled={!noteContent.trim()}
                  >
                    Notiz speichern
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && eventToDelete && (
          <div className="delete-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="delete-modal-header">
                <h4>Event löschen</h4>
                <button className="close-button" onClick={() => setShowDeleteModal(false)}>×</button>
              </div>
              
              <div className="delete-modal-content">
                <p>
                  <strong>{eventToDelete.title}</strong>
                  {isPartOfSeries(eventToDelete) && (
                    <span className="series-indicator"> (Teil einer Serie)</span>
                  )}
                </p>
                
                {isPartOfSeries(eventToDelete) ? (
                  <div className="delete-options">
                    <p>Was möchtest du löschen?</p>
                    <div className="delete-option-buttons">
                      <button 
                        className="delete-option-btn single-event"
                        onClick={() => handleDeleteConfirm(false)}
                      >
                        📅 Nur dieses Event
                        <small>Löscht nur diesen einen Termin</small>
                      </button>
                      <button 
                        className="delete-option-btn event-series"
                        onClick={() => handleDeleteConfirm(true)}
                      >
                        🔄 Ganze Serie
                        <small>Löscht alle wiederkehrenden Termine</small>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="delete-single">
                    <p>Dieses Event wirklich löschen?</p>
                    <div className="delete-actions">
                      <button 
                        className="cancel-button"
                        onClick={() => setShowDeleteModal(false)}
                      >
                        Abbrechen
                      </button>
                      <button 
                        className="delete-confirm-btn"
                        onClick={() => handleDeleteConfirm(false)}
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayModal;