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

interface ArtifactOptions {
  artifactName: string;
  chargeType: 'lumenis' | 'umbrath' | 'manith' | 'custom';
  customCycle?: number;
  description?: string;
}

interface CountdownOptions {
  eventName: string;
  targetDate: { year: number; month: number; day: number };
  description?: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

interface DayModalProps {
  day: number;
  existingEvents: Array<{id: number; title: string; description?: string; confirmed?: boolean; is_recurring?: boolean; category_id?: number; recurring_parent_id?: number}>;
  onClose: () => void;
  onAddEvent: (title: string, description: string, recurringOptions?: RecurringEventOptions, categoryId?: number) => void;
  onAddNote: (content: string) => void;
  onAddArtifact?: (artifactOptions: ArtifactOptions) => void;
  onAddCountdown?: (countdownOptions: CountdownOptions) => void;
  onDeleteEvent?: (eventId: number, deleteSeries?: boolean) => void;
  onConfirmEvent?: (eventId: number, confirmed: boolean) => void;
  categories?: Category[];
  currentRole?: 'DM' | 'Player';
  currentYear?: number;
  currentMonth?: number;
}

const DayModal: React.FC<DayModalProps> = ({ day, existingEvents, onClose, onAddEvent, onAddNote, onAddArtifact, onAddCountdown, onDeleteEvent, onConfirmEvent, categories = [], currentRole = 'Player', currentYear = 1048, currentMonth = 0 }) => {
  const [selectedType, setSelectedType] = useState<'event' | 'note' | 'artifact' | 'countdown' | null>(null);
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

  // Artifact states
  const [artifactName, setArtifactName] = useState('');
  const [chargeType, setChargeType] = useState<'lumenis' | 'umbrath' | 'manith' | 'custom'>('lumenis');
  const [customCycle, setCustomCycle] = useState(7);
  const [artifactDescription, setArtifactDescription] = useState('');

  // Countdown states
  const [countdownEventName, setCountdownEventName] = useState('');
  const [targetYear, setTargetYear] = useState(currentYear);
  const [targetMonth, setTargetMonth] = useState(currentMonth);
  const [targetDay, setTargetDay] = useState(1);
  const [countdownDescription, setCountdownDescription] = useState('');
  const [importance, setImportance] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

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
    } else if (selectedType === 'artifact' && artifactName.trim() && onAddArtifact) {
      const artifactOptions: ArtifactOptions = {
        artifactName,
        chargeType,
        customCycle: chargeType === 'custom' ? customCycle : undefined,
        description: artifactDescription
      };
      onAddArtifact(artifactOptions);
      onClose();
    } else if (selectedType === 'countdown' && countdownEventName.trim() && onAddCountdown) {
      const countdownOptions: CountdownOptions = {
        eventName: countdownEventName,
        targetDate: { year: targetYear, month: targetMonth, day: targetDay },
        description: countdownDescription,
        importance
      };
      onAddCountdown(countdownOptions);
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
    setArtifactName('');
    setChargeType('lumenis');
    setCustomCycle(7);
    setArtifactDescription('');
    setCountdownEventName('');
    setTargetYear(currentYear);
    setTargetMonth(currentMonth);
    setTargetDay(1);
    setCountdownDescription('');
    setImportance('medium');
  };

  const handleTypeSelect = (type: 'event' | 'note' | 'artifact' | 'countdown') => {
    setSelectedType(type);
    resetForm();
  };

  const getCycleName = (type: 'lumenis' | 'umbrath' | 'manith' | 'custom') => {
    switch (type) {
      case 'lumenis': return 'Lumenis (12 Tage)';
      case 'umbrath': return 'Umbrath (6 Tage)';
      case 'manith': return 'Manith (48 Tage)';
      case 'custom': return 'Benutzerdefiniert';
    }
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
                  <p>⚔️ Als Spieler kannst du Notizen und Artefakte erstellen.</p>
                  <p>👑 Events können nur vom Dungeon Master erstellt werden.</p>
                </div>
              )}
              <div className="type-buttons">
                {currentRole === 'DM' && (
                  <>
                    <button 
                      className="type-button event-button" 
                      onClick={() => handleTypeSelect('event')}
                    >
                      📅 Event
                      <small>Einmalige oder wiederkehrende Termine</small>
                    </button>
                    <button 
                      className="type-button countdown-button" 
                      onClick={() => handleTypeSelect('countdown')}
                    >
                      ⏰ Countdown
                      <small>Besondere Ereignisse mit Countdown</small>
                    </button>
                  </>
                )}
                <button 
                  className="type-button note-button" 
                  onClick={() => handleTypeSelect('note')}
                >
                  📝 Notiz
                  <small>Allgemeine Notizen und Beschreibungen</small>
                </button>
                <button 
                  className="type-button artifact-button" 
                  onClick={() => handleTypeSelect('artifact')}
                >
                  🔮 Artefakt
                  <small>Magische Items mit Aufladungszyklen</small>
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
                {selectedType === 'event' ? '📅 Event hinzufügen' : 
                 selectedType === 'note' ? '📝 Notiz hinzufügen' : 
                 selectedType === 'artifact' ? '🔮 Artefakt hinzufügen' : 
                 '⏰ Countdown hinzufügen'}
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
            ) : selectedType === 'note' ? (
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
            ) : selectedType === 'artifact' ? (
              <div className="artifact-form">
                <input
                  type="text"
                  placeholder="Artefakt Name (z.B. Stab der Macht)"
                  value={artifactName}
                  onChange={(e) => setArtifactName(e.target.value)}
                  autoFocus
                />
                
                <div className="charge-cycle-selection">
                  <label>
                    Aufladungszyklus:
                    <select
                      value={chargeType}
                      onChange={(e) => setChargeType(e.target.value as 'lumenis' | 'umbrath' | 'manith' | 'custom')}
                    >
                      <option value="lumenis">🌕 Lumenis - Großer Weißer Mond (12 Tage)</option>
                      <option value="umbrath">🌑 Umbrath - Schattenmond (6 Tage)</option>
                      <option value="manith">🔮 Manith - Kleiner Arkaner Mond (48 Tage)</option>
                      <option value="custom">⚙️ Benutzerdefiniert</option>
                    </select>
                  </label>
                </div>

                {chargeType === 'custom' && (
                  <div className="custom-cycle">
                    <label>
                      Aufladung alle:
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={customCycle}
                        onChange={(e) => setCustomCycle(parseInt(e.target.value) || 1)}
                      />
                      Tage
                    </label>
                  </div>
                )}

                <textarea
                  placeholder="Beschreibung des Artefakts (optional)"
                  value={artifactDescription}
                  onChange={(e) => setArtifactDescription(e.target.value)}
                  rows={3}
                />

                <div className="cycle-info">
                  <p><strong>ℹ️ Aufladungssystem:</strong></p>
                  <p>Das Artefakt lädt sich automatisch alle {chargeType === 'custom' ? customCycle : 
                    chargeType === 'lumenis' ? '12' : 
                    chargeType === 'umbrath' ? '6' : '48'} Tage auf.</p>
                  <p>Die nächsten Aufladungen werden automatisch im Kalender angezeigt.</p>
                </div>
                
                {/* Artifact Form Actions */}
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
                    disabled={!artifactName.trim()}
                  >
                    Artefakt erstellen
                  </button>
                </div>
              </div>
            ) : (
              <div className="countdown-form">
                <input
                  type="text"
                  placeholder="Event Name (z.B. Schlacht um Drachenfels)"
                  value={countdownEventName}
                  onChange={(e) => setCountdownEventName(e.target.value)}
                  autoFocus
                />

                <div className="target-date-selection">
                  <label>
                    Zieldatum:
                    <div className="date-inputs">
                      <input
                        type="number"
                        placeholder="Jahr"
                        min={currentYear}
                        max={currentYear + 10}
                        value={targetYear}
                        onChange={(e) => setTargetYear(parseInt(e.target.value) || currentYear)}
                      />
                      <select
                        value={targetMonth}
                        onChange={(e) => setTargetMonth(parseInt(e.target.value))}
                      >
                        {Array.from({length: 12}, (_, i) => (
                          <option key={i} value={i}>
                            {['Auro\'ithil', 'Man\'alasse', 'Thael\'orne', 'Pel\'anor', 'Drac\'uial', 'Val\'kaurn', 'Shad\'morn', 'Ley\'thurin', 'Nex\'illien', 'Tun\'giliath', 'Mor\'galad', 'Cir\'annen'][i]}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Tag"
                        min={1}
                        max={44}
                        value={targetDay}
                        onChange={(e) => setTargetDay(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </label>
                </div>

                <div className="importance-selection">
                  <label>
                    Wichtigkeit:
                    <select
                      value={importance}
                      onChange={(e) => setImportance(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
                    >
                      <option value="low">🟢 Niedrig - Normale Ereignisse</option>
                      <option value="medium">🟡 Mittel - Wichtige Termine</option>
                      <option value="high">🟠 Hoch - Kritische Events</option>
                      <option value="critical">🔴 Kritisch - Weltverändernde Ereignisse</option>
                    </select>
                  </label>
                </div>

                <textarea
                  placeholder="Beschreibung des Ereignisses (optional)"
                  value={countdownDescription}
                  onChange={(e) => setCountdownDescription(e.target.value)}
                  rows={3}
                />

                <div className="countdown-info">
                  <p><strong>⏰ Countdown-System:</strong></p>
                  <p>Das System zeigt automatisch die verbleibenden Tage bis zum Event an.</p>
                  <p>Alle Spieler können den Countdown sehen, aber nur DMs können ihn erstellen.</p>
                  <p>Wichtigkeitsstufe bestimmt die Farbe und Priorität der Anzeige.</p>
                </div>
                
                {/* Countdown Form Actions */}
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
                    disabled={!countdownEventName.trim()}
                  >
                    Countdown erstellen
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