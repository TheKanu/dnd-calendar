import React, { useState, useEffect } from 'react';
import { CalendarConfig, CalendarEvent, MoonPhase } from '../types/Calendar';
import { getWeekGrid, getMoonPhases } from '../utils/calendarUtils';
import apiConfig from '../config/environment';
import './Calendar.css';

const Calendar: React.FC = () => {
  const [config, setConfig] = useState<CalendarConfig | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [currentYear, setCurrentYear] = useState(1048);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');

  useEffect(() => {
    fetch(`${apiConfig.API_BASE_URL}/api/calendar/config`)
      .then(res => res.json())
      .then(setConfig)
      .catch(console.error);
  }, []);

  const fetchEvents = React.useCallback(() => {
    fetch(`${apiConfig.API_BASE_URL}/api/events/${currentYear}/${currentMonth}`)
      .then(res => res.json())
      .then(setEvents)
      .catch(console.error);
  }, [currentYear, currentMonth]);

  useEffect(() => {
    if (config) {
      setCurrentYear(config.year);
      fetchEvents();
    }
  }, [config, currentMonth, currentYear, fetchEvents]);


  const addEvent = () => {
    if (!selectedDay || !newEventTitle.trim()) return;

    fetch(`${apiConfig.API_BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year: currentYear,
        month: currentMonth,
        day: selectedDay,
        title: newEventTitle,
        description: newEventDescription
      })
    })
    .then(() => {
      fetchEvents();
      setNewEventTitle('');
      setNewEventDescription('');
      setSelectedDay(null);
    })
    .catch(console.error);
  };

  const getMoonPhasesForDay = (day: number): MoonPhase[] => {
    return config ? getMoonPhases(currentYear, currentMonth, day, config) : [];
  };

  const getEventsForDay = (day: number): CalendarEvent[] => {
    return events.filter(event => event.day === day);
  };

  if (!config) return <div className="loading">Loading D&D Calendar...</div>;

  const weekGrid = getWeekGrid(currentYear, currentMonth, config);
  const monthName = config.months[currentMonth];

  return (
    <div className="calendar">
      <div className="calendar-header">
        <h1>D&D Fantasy Calendar</h1>
        <div className="calendar-nav">
          <button 
            onClick={() => setCurrentMonth(prev => prev === 0 ? 11 : prev - 1)}
          >
            ← Previous
          </button>
          <h2>{monthName} {currentYear}</h2>
          <button 
            onClick={() => setCurrentMonth(prev => prev === 11 ? 0 : prev + 1)}
          >
            Next →
          </button>
        </div>
      </div>

      <div className="weekdays">
        {config.weekdays.map(day => (
          <div key={day} className="weekday">{day}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {weekGrid.map((week, weekIndex) => (
          <div key={weekIndex} className="calendar-week">
            {week.map((day, dayIndex) => {
              const dayEvents = day > 0 ? getEventsForDay(day) : [];
              const moonPhases = day > 0 ? getMoonPhasesForDay(day) : [];
              
              return (
                <div
                  key={dayIndex}
                  className={`calendar-day ${day === 0 ? 'empty' : ''} ${selectedDay === day ? 'selected' : ''}`}
                  onClick={() => day > 0 && setSelectedDay(day)}
                >
                  {day > 0 && (
                    <>
                      <div className="day-number">{day}</div>
                      {dayEvents.length > 0 && (
                        <div className="events">
                          {dayEvents.map(event => (
                            <div key={event.id} className="event" title={event.description}>
                              {event.title}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="moon-phases">
                        {moonPhases.map((moon, idx) => {
                          const phasePercent = (moon.phase / moon.cycle) * 100;
                          return (
                            <div 
                              key={idx} 
                              className="moon" 
                              title={`${moon.name}: ${moon.phase}/${moon.cycle}`}
                              style={{ 
                                background: `conic-gradient(#ffd700 0% ${phasePercent}%, #333 ${phasePercent}% 100%)` 
                              }}
                            />
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {selectedDay && (
        <div className="event-form">
          <h3>Add Event for Day {selectedDay}</h3>
          <input
            type="text"
            placeholder="Event title"
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
          />
          <textarea
            placeholder="Event description"
            value={newEventDescription}
            onChange={(e) => setNewEventDescription(e.target.value)}
          />
          <div className="form-buttons">
            <button onClick={addEvent}>Add Event</button>
            <button onClick={() => setSelectedDay(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;