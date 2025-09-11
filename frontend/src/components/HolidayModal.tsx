import React, { useState, useEffect } from 'react';
import { CalendarConfig } from '../types/Calendar';
import { API } from '../utils/api';
import './HolidayModal.css';

interface Holiday {
  id: number;
  session_id: string;
  name: string;
  month: number;
  day: number;
  type: 'regional' | 'worldly' | 'magical';
  description: string;
  created_at: string;
}

interface HolidayModalProps {
  currentSession: string;
  config: CalendarConfig;
  onClose: () => void;
}

const PREDEFINED_HOLIDAYS = [
  { name: "Aurora's Dawn", month: 0, day: 1, type: 'worldly', description: 'Feier des neuen Jahres, benannt nach der ersten Göttin des Lichts. Städte werden mit bunten Lichtern geschmückt, Familien kommen zusammen.' },
  { name: "Manaflow Festival", month: 0, day: 15, type: 'magical', description: 'Feier der magischen Energie. Zauberer und Hexen zeigen ihre Künste, magische Gegenstände werden ausgestellt.' },
  { name: "Harvest of Light", month: 1, day: 10, type: 'regional', description: 'Erntedankfest der nördlichen Regionen, wo seltene Lichtfrüchte geerntet werden.' },
  { name: "Festival of Echoing Songs", month: 1, day: 28, type: 'worldly', description: 'Musikfestival, bei dem Barden aus aller Welt zusammenkommen. Lieder hallen durch die Städte.' },
  { name: "Day of the Fallen Heroes", month: 2, day: 7, type: 'worldly', description: 'Gedenktag für gefallene Helden. Statuen werden mit Blumen geschmückt, Geschichten werden erzählt.' },
  { name: "Stormcaller's Gathering", month: 2, day: 22, type: 'magical', description: 'Treffen der Sturm-Magier im Küstengebiet. Wettermagie-Wettkämpfe finden statt.' },
  { name: "Moonwell Ceremony", month: 3, day: 5, type: 'magical', description: 'Nächtliches Ritual an heiligen Mondquellen. Mondsteine werden aufgeladen und gesegnet.' },
  { name: "Spring Awakening", month: 3, day: 18, type: 'worldly', description: 'Frühlingsfest mit Blumenparaden. Naturgeister werden geehrt, neue Bäume gepflanzt.' },
  { name: "Dragonfire Night", month: 4, day: 3, type: 'regional', description: 'Drachenfest in den Bergregionen. Feuerwerk und Drachentänze, heiße Speisen werden serviert.' },
  { name: "Crystal Harmony Days", month: 4, day: 20, type: 'magical', description: 'Dreitägiges Kristallfest. Kristallzüchter zeigen ihre Werke, harmonische Klänge erfüllen die Luft.' },
  { name: "Sea's Blessing", month: 5, day: 12, type: 'regional', description: 'Segensfest der Küstenstädte. Schiffe werden gesegnet, Meeresfrüchte-Feste finden statt.' },
  { name: "Summer Solstice Gala", month: 5, day: 30, type: 'worldly', description: 'Große Sommersonnenwende-Feier. Luxuriöse Bälle, längster Tag des Jahres wird zelebriert.' },
  { name: "Forge Masters' Pride", month: 6, day: 14, type: 'regional', description: 'Handwerkerfest in den Schmiedestädten. Meisterwerke werden ausgestellt, Wettbewerbe abgehalten.' },
  { name: "Shadow's Embrace", month: 6, day: 31, type: 'magical', description: 'Schatten-Magie-Fest. Illusionisten und Schattenzauberer zeigen ihre düsteren Künste.' },
  { name: "Elemental Convergence", month: 7, day: 16, type: 'magical', description: 'Seltenes Fest, wenn alle Elemente in Harmonie stehen. Elementar-Magier vereinen ihre Kräfte.' },
  { name: "Autumn's Gold", month: 8, day: 2, type: 'worldly', description: 'Herbstfest der Händler. Goldene Blätter, Tauschgeschäfte, Handelsverträge werden geschlossen.' },
  { name: "Night of Whispers", month: 8, day: 25, type: 'magical', description: 'Mystische Nacht der Wahrsagung. Geister kommunizieren, Prophezeiungen werden gedeutet.' },
  { name: "Starfall Vigil", month: 9, day: 8, type: 'worldly', description: 'Sternschnuppen-Wache. Menschen schauen in den Himmel und wünschen sich etwas bei fallenden Sternen.' },
  { name: "Winter's First Kiss", month: 9, day: 29, type: 'worldly', description: 'Erster Winterfrost wird gefeiert. Warme Getränke, erste Schneeflocken, Gemütlichkeit.' },
  { name: "Festival of Grateful Hearts", month: 10, day: 15, type: 'worldly', description: 'Dankbarkeitsfest vor dem Winter. Familien teilen ihre Ernte, Geschenke werden ausgetauscht.' },
  { name: "Veil of Spirits", month: 10, day: 31, type: 'magical', description: 'Geisternacht, wo die Grenze zwischen Welten dünn ist. Geister werden geehrt, Séancen abgehalten.' },
  { name: "Frostfire Celebration", month: 11, day: 12, type: 'magical', description: 'Eis-und-Feuer-Magie-Fest. Gegensätzliche Elemente werden in Einklang gebracht.' },
  { name: "Year's End Reflection", month: 11, day: 44, type: 'worldly', description: 'Besinnlicher Jahresabschluss. Menschen blicken zurück auf das Jahr, bereiten sich auf das neue vor.' }
];

const HolidayModal: React.FC<HolidayModalProps> = ({ 
  currentSession, 
  config, 
  onClose
}) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    name: '',
    month: 0,
    day: 1,
    type: 'regional' as 'regional' | 'worldly' | 'magical',
    description: ''
  });

  useEffect(() => {
    loadHolidays();
  }, [currentSession]);

  const loadHolidays = async () => {
    try {
      setLoading(true);
      const response = await API.holidays.getAll(currentSession);
      if (response.ok) {
        const data = await response.json();
        setHolidays(data);
      } else {
        setError('Failed to load holidays');
      }
    } catch (err) {
      setError('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.name.trim()) {
      setError('Holiday name is required');
      return;
    }

    try {
      const response = await API.holidays.create(currentSession, newHoliday);
      if (response.ok) {
        const holiday = await response.json();
        setHolidays([...holidays, holiday]);
        setNewHoliday({ name: '', month: 0, day: 1, type: 'regional', description: '' });
        setShowAddForm(false);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add holiday');
      }
    } catch (err) {
      setError('Failed to add holiday');
    }
  };

  const handleDeleteHoliday = async (holidayId: number) => {
    try {
      const response = await API.holidays.delete(holidayId, currentSession);
      if (response.ok) {
        setHolidays(holidays.filter(h => h.id !== holidayId));
      } else {
        setError('Failed to delete holiday');
      }
    } catch (err) {
      setError('Failed to delete holiday');
    }
  };

  const handleAddPredefinedHoliday = async (predefined: typeof PREDEFINED_HOLIDAYS[0]) => {
    try {
      const response = await API.holidays.create(currentSession, predefined);
      if (response.ok) {
        const holiday = await response.json();
        setHolidays([...holidays, holiday]);
      } else {
        const errorData = await response.json();
        if (!errorData.error.includes('already exists')) {
          setError(errorData.error || 'Failed to add holiday');
        }
      }
    } catch (err) {
      setError('Failed to add holiday');
    }
  };

  const handleAddAllPredefined = async () => {
    for (const predefined of PREDEFINED_HOLIDAYS) {
      await handleAddPredefinedHoliday(predefined);
    }
  };

  const formatDate = (month: number, day: number) => {
    const monthName = config.months[month];
    return `${day}. ${monthName}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'worldly': return '🌍';
      case 'magical': return '✨';
      case 'regional': return '🏰';
      default: return '🎉';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'worldly': return '#2e7d32';
      case 'magical': return '#7b1fa2';
      case 'regional': return '#d32f2f';
      default: return '#1976d2';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="holiday-modal">
        <div className="holiday-modal-header">
          <h2>🎉 Holiday Management</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="holiday-controls">
          <button 
            className="add-holiday-btn"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : 'Add Holiday'}
          </button>
          
          <button 
            className="add-all-btn"
            onClick={handleAddAllPredefined}
          >
            Add All Aetherial Holidays
          </button>
        </div>

        {showAddForm && (
          <div className="add-holiday-form">
            <input
              type="text"
              placeholder="Holiday name"
              value={newHoliday.name}
              onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
              className="holiday-input"
            />
            
            <div className="form-row">
              <select 
                value={newHoliday.month} 
                onChange={(e) => setNewHoliday({ ...newHoliday, month: parseInt(e.target.value) })}
                className="form-select"
              >
                {config.months.map((month, index) => (
                  <option key={index} value={index}>{month}</option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                max={config.month_len[config.months[newHoliday.month]] || 44}
                value={newHoliday.day}
                onChange={(e) => setNewHoliday({ ...newHoliday, day: parseInt(e.target.value) })}
                className="day-input"
              />

              <select 
                value={newHoliday.type} 
                onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value as any })}
                className="form-select"
              >
                <option value="regional">🏰 Regional</option>
                <option value="worldly">🌍 Worldly</option>
                <option value="magical">✨ Magical</option>
              </select>
            </div>

            <textarea
              placeholder="Holiday description..."
              value={newHoliday.description}
              onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
              className="holiday-description"
              rows={3}
            />

            <button onClick={handleAddHoliday} className="save-holiday-btn">
              Add Holiday
            </button>
          </div>
        )}

        {error && (
          <div className="holiday-error">{error}</div>
        )}

        <div className="holiday-list">
          {loading ? (
            <div className="holiday-loading">Loading holidays...</div>
          ) : (
            <>
              <h3>Current Holidays ({holidays.length})</h3>
              {holidays.length === 0 ? (
                <div className="no-holidays">
                  No holidays set for this session. Add some holidays to get started!
                </div>
              ) : (
                <div className="holidays-grid">
                  {holidays.map((holiday) => (
                    <div key={holiday.id} className="holiday-card">
                      <div className="holiday-header">
                        <div className="holiday-icon-name">
                          <span className="holiday-type-icon">
                            {getTypeIcon(holiday.type)}
                          </span>
                          <span className="holiday-name">{holiday.name}</span>
                        </div>
                        <div className="holiday-actions">
                          <span className="holiday-date">
                            {formatDate(holiday.month, holiday.day)}
                          </span>
                          <button
                            className="delete-holiday-btn"
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            title="Delete Holiday"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      
                      <div 
                        className="holiday-type-badge"
                        style={{ backgroundColor: getTypeColor(holiday.type) }}
                      >
                        {holiday.type}
                      </div>
                      
                      {holiday.description && (
                        <div className="holiday-description-display">
                          {holiday.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="predefined-holidays-section">
          <h3>Predefined Aetherial Holidays</h3>
          <div className="predefined-holidays-grid">
            {PREDEFINED_HOLIDAYS.map((holiday, index) => (
              <div key={index} className="predefined-holiday-card">
                <div className="predefined-holiday-header">
                  <span className="holiday-type-icon">
                    {getTypeIcon(holiday.type)}
                  </span>
                  <span className="holiday-name">{holiday.name}</span>
                  <button
                    className="add-predefined-btn"
                    onClick={() => handleAddPredefinedHoliday(holiday)}
                    title="Add this holiday"
                  >
                    +
                  </button>
                </div>
                <div className="holiday-date">
                  {formatDate(holiday.month, holiday.day)}
                </div>
                <div className="holiday-description-small">
                  {holiday.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HolidayModal;