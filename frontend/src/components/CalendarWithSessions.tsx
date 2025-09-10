import React, { useState, useEffect, useRef } from 'react';
import { CalendarConfig, CalendarEvent, MoonPhase } from '../types/Calendar';
import { PartyGroup } from '../types/Session';
import { CompletedDay } from '../types/CompletedDay';
import { getWeekGrid, getMoonPhases } from '../utils/calendarUtils';
import { useSocket } from '../hooks/useSocket';
import { useLanguage } from '../contexts/LanguageContext';
import PartyMarker from './PartyMarker';
import SessionManager from './SessionManager';
import DarkModeToggle from './DarkModeToggle';
import LanguageSelector from './LanguageSelector';
import DayModal from './DayModal';
import CategoryManager from './CategoryManager';
import SearchModal from './SearchModal';
import TimeTravelModal from './TimeTravelModal';
import { API } from '../utils/api';
import './Calendar.css';

const CalendarWithSessions: React.FC = () => {
  const [config, setConfig] = useState<CalendarConfig | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [partyGroups, setPartyGroups] = useState<PartyGroup[]>([]);
  const [completedDays, setCompletedDays] = useState<CompletedDay[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [currentYear, setCurrentYear] = useState(1048);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showTimeTravelModal, setShowTimeTravelModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [draggedGroup, setDraggedGroup] = useState<PartyGroup | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#ff6b6b');

  const { onEvent } = useSocket(currentSession);
  const { getWeekdays, isTransitioning } = useLanguage();
  const initialYearSet = useRef(false);

  useEffect(() => {
    API.calendar.getConfig()
      .then(res => res.json())
      .then(setConfig)
      .catch(console.error);
  }, []);

  const fetchEvents = React.useCallback(() => {
    if (!currentSession) return;
    
    API.events.getForMonth(currentSession, currentYear, currentMonth)
      .then(res => res.json())
      .then(setEvents)
      .catch(console.error);
  }, [currentYear, currentMonth, currentSession]);

  const fetchPartyGroups = React.useCallback(() => {
    if (!currentSession) return;
    
    API.groups.getForSession(currentSession)
      .then(res => res.json())
      .then(setPartyGroups)
      .catch(console.error);
  }, [currentSession]);

  const fetchCompletedDays = React.useCallback(() => {
    if (!currentSession) return;
    
    API.completed.getForMonth(currentSession, currentYear, currentMonth)
      .then(res => res.json())
      .then(setCompletedDays)
      .catch(console.error);
  }, [currentSession, currentYear, currentMonth]);

  const fetchCategories = React.useCallback(() => {
    if (!currentSession) return;
    
    fetch(`http://localhost:3002/api/sessions/${currentSession}/categories`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    })
      .then(res => res.json())
      .then(setCategories)
      .catch(console.error);
  }, [currentSession]);

  // Find and set the current month based on the last completed day
  const findCurrentMonth = React.useCallback(async () => {
    console.log('🔍 findCurrentMonth called for session:', currentSession);
    if (!currentSession) return;
    
    try {
      console.log('📡 Fetching all completed days...');
      const response = await API.completed.getAll(currentSession);
      const completedDays: CompletedDay[] = await response.json();
      
      console.log('✅ Received completed days:', completedDays);
      
      if (completedDays.length === 0) {
        console.log('⚠️ No completed days found, staying at default');
        return;
      }
      
      // Find the latest completed day (they're already sorted by year, month, day ASC)
      const lastCompletedDay = completedDays[completedDays.length - 1];
      
      console.log('🗓️ Found last completed day:', lastCompletedDay);
      console.log('🧭 Navigating to year:', lastCompletedDay.year, 'month:', lastCompletedDay.month);
      
      // Set the current month to the month of the last completed day
      setCurrentYear(lastCompletedDay.year);
      setCurrentMonth(lastCompletedDay.month);
      
      console.log('✨ Auto-navigation completed!');
      
    } catch (error) {
      console.error('💥 Error fetching completed days for current month detection:', error);
      // Fall back to default behavior if there's an error
    }
  }, [currentSession]);

  // Set initial year when config is first loaded and find current month based on completed days
  useEffect(() => {
    if (config && currentSession && !initialYearSet.current) {
      setCurrentYear(config.year);
      findCurrentMonth();
      initialYearSet.current = true;
    }
  }, [config, currentSession, findCurrentMonth]);

  // Fetch data when month, year, or session changes
  useEffect(() => {
    if (config && currentSession) {
      fetchEvents();
      fetchPartyGroups();
      fetchCompletedDays();
      fetchCategories();
    }
  }, [config, currentMonth, currentYear, currentSession, fetchEvents, fetchPartyGroups, fetchCompletedDays, fetchCategories]);

  // WebSocket event listeners
  useEffect(() => {
    if (!currentSession) return;

    const unsubscribeEvents = [
      onEvent('party-position-updated', (data: any) => {
        console.log('Party position updated:', data);
        fetchPartyGroups(); // Refresh party groups
      }),
      
      onEvent('event-added', (data: any) => {
        console.log('Event added:', data);
        if (data.event.month === currentMonth && data.event.year === currentYear) {
          fetchEvents(); // Refresh events for current month
        }
      }),
      
      onEvent('party-group-added', (data: any) => {
        console.log('Party group added:', data);
        fetchPartyGroups(); // Refresh party groups
      }),

      onEvent('day-completed', (data: any) => {
        console.log('Day completed:', data);
        fetchCompletedDays(); // Refresh completed days
        
        // Auto-navigate to the month of the newly completed day if it's newer than current
        if (data.year > currentYear || (data.year === currentYear && data.month > currentMonth)) {
          console.log('🗓️ Auto-navigating to newly completed month:', data.year, data.month);
          setCurrentYear(data.year);
          setCurrentMonth(data.month);
        }
      }),

      onEvent('day-uncompleted', (data: any) => {
        console.log('Day uncompleted:', data);
        fetchCompletedDays(); // Refresh completed days
      }),

      onEvent('party-group-deleted', (data: any) => {
        console.log('Party group deleted:', data);
        fetchPartyGroups(); // Refresh party groups
      }),

      onEvent('event-deleted', (data: any) => {
        console.log('Event deleted:', data);
        if (data.event && data.event.month === currentMonth && data.event.year === currentYear) {
          fetchEvents(); // Refresh events for current month
        }
      }),

      onEvent('event-confirmation-updated', (data: any) => {
        console.log('Event confirmation updated:', data);
        fetchEvents(); // Refresh events for current month
      }),

      onEvent('session-deleted', (data: any) => {
        console.log('Session deleted:', data);
        // If current session was deleted, return to session selection
        if (data.sessionId === currentSession) {
          setCurrentSession(null);
        }
      }),

      onEvent('category-added', (data: any) => {
        console.log('Category added:', data);
        fetchCategories(); // Refresh categories
      }),

      onEvent('category-deleted', (data: any) => {
        console.log('Category deleted:', data);
        fetchCategories(); // Refresh categories
      }),

      onEvent('event-moved', (data: any) => {
        console.log('Event moved:', data);
        fetchEvents(); // Refresh events for current month
        // Also refresh events for the old month if different
        if (data.oldDate.year !== currentYear || data.oldDate.month !== currentMonth) {
          // Event was moved from a different month, we might need to refresh that too
          // For now, just refresh current month
        }
      })
    ];

    return () => {
      unsubscribeEvents.forEach(unsubscribe => unsubscribe());
    };
  }, [currentSession, currentMonth, currentYear, onEvent, fetchEvents, fetchPartyGroups, fetchCompletedDays, fetchCategories]);

  const onSessionSelect = async (sessionId: string) => {
    // First validate that the session actually exists
    try {
      const validationResponse = await API.sessions.exists(sessionId);
      if (!validationResponse.ok) {
        console.error('Session validation failed');
        return;
      }
      
      const validationData = await validationResponse.json();
      if (!validationData.exists) {
        console.error('Session does not exist:', sessionId);
        return;
      }
    } catch (error) {
      console.error('Session validation error:', error);
      return;
    }
    
    // Session exists, proceed to join it
    setCurrentSession(sessionId);
    
    // Try to get session info to set start date (only if year hasn't been manually set)
    try {
      const response = await API.sessions.get(sessionId);
      if (response.ok) {
        const session = await response.json();
        if (session.start_year && !initialYearSet.current) {
          setCurrentYear(session.start_year);
          initialYearSet.current = true;
        }
        if (session.start_month !== undefined) setCurrentMonth(session.start_month);
      }
    } catch (error) {
      console.log('Could not load session info, using defaults');
    }
  };

  const toggleDayCompletion = (day: number) => {
    if (!currentSession) return;

    const isCompleted = completedDays.some(cd => cd.day === day);

    if (isCompleted) {
      // Uncomplete the day
      API.completed.unmarkDay(currentSession, currentYear, currentMonth, day)
        .catch(console.error);
    } else {
      // Complete the day
      API.completed.markDay(currentSession, {
        year: currentYear,
        month: currentMonth,
        day: day
      })
      .catch(console.error);
    }
  };

  const handleAddEvent = (title: string, description: string, recurringOptions?: any, categoryId?: number) => {
    if (!selectedDay || !title.trim() || !currentSession) return;

    const eventData = {
      session_id: currentSession,
      year: currentYear,
      month: currentMonth,
      day: selectedDay,
      title: title,
      description: description,
      ...(categoryId && { category_id: categoryId }),
      ...(recurringOptions?.isRecurring && {
        is_recurring: true,
        recurring_type: recurringOptions.type,
        recurring_interval: recurringOptions.interval,
        recurring_end_date: recurringOptions.endDate
      })
    };

    API.events.create(eventData)
    .then(() => {
      // Don't manually refresh - WebSocket will handle it
      setSelectedDay(null);
      setShowDayModal(false);
    })
    .catch(console.error);
  };

  const handleAddNote = (content: string) => {
    if (!selectedDay || !content.trim() || !currentSession) return;

    // Für jetzt fügen wir Notizen als Events mit einem speziellen Präfix hinzu
    // Später können wir eine separate Notes-API implementieren
    API.events.create({
      session_id: currentSession,
      year: currentYear,
      month: currentMonth,
      day: selectedDay,
      title: '📝 Notiz',
      description: content
    })
    .then(() => {
      // Don't manually refresh - WebSocket will handle it
      setSelectedDay(null);
      setShowDayModal(false);
    })
    .catch(console.error);
  };

  const addPartyGroup = () => {
    if (!newGroupName.trim() || !currentSession) return;

    API.groups.create(currentSession, {
      name: newGroupName,
      color: newGroupColor
    })
    .then(() => {
      // Don't manually refresh - WebSocket will handle it
      setNewGroupName('');
    })
    .catch(console.error);
  };

  const deletePartyGroup = (groupId: number) => {
    if (!currentSession) return;
    
    if (window.confirm('Möchtest du diese Party-Gruppe wirklich löschen?')) {
      API.groups.delete(groupId, currentSession)
        .catch(console.error);
    }
  };

  const deleteEvent = (eventId: number) => {
    if (!currentSession) return;
    
    if (window.confirm('Möchtest du diesen Eintrag wirklich löschen?')) {
      API.events.delete(eventId, currentSession)
        .catch(console.error);
    }
  };

  const confirmEvent = (eventId: number, confirmed: boolean) => {
    if (!currentSession) return;
    
    API.events.updateConfirmation(eventId, currentSession, confirmed)
      .catch(console.error);
  };

  const handleDragStart = (e: React.DragEvent, group: PartyGroup) => {
    setDraggedGroup(group);
    setDraggedEvent(null); // Clear any dragged event
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `party-${group.id}`);
  };

  const handleEventDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    setDraggedEvent(event);
    setDraggedGroup(null); // Clear any dragged group
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `event-${event.id}`);
    e.stopPropagation(); // Prevent day click when dragging event
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    if (day > 0) {
      setDragOverDay(day);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if we're actually leaving the day (not moving to a child element)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverDay(null);
    }
  };

  const handleDrop = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    
    if (day <= 0 || !currentSession) return;

    // Handle party group drop
    if (draggedGroup) {
      API.groups.updatePosition(draggedGroup.id, {
        sessionId: currentSession,
        year: currentYear,
        month: currentMonth,
        day: day
      })
      .then(() => {
        console.log('Party position updated via WebSocket');
      })
      .catch(console.error);
    }
    
    // Handle event drop
    if (draggedEvent) {
      // Don't drop on the same day
      if (draggedEvent.year === currentYear && 
          draggedEvent.month === currentMonth && 
          draggedEvent.day === day) {
        setDraggedEvent(null);
        return;
      }

      API.events.move(draggedEvent.id, currentSession, currentYear, currentMonth, day)
        .then(() => {
          console.log('Event moved via WebSocket');
        })
        .catch((error) => {
          console.error('Failed to move event:', error);
          alert('Failed to move event. Please try again.');
        });
    }
    
    // Clear dragged items and drag-over state
    setDraggedGroup(null);
    setDraggedEvent(null);
    setDragOverDay(null);
  };

  const getMoonPhasesForDay = (day: number): MoonPhase[] => {
    return config ? getMoonPhases(currentYear, currentMonth, day, config) : [];
  };

  const getEventsForDay = (day: number): CalendarEvent[] => {
    return Array.isArray(events) ? events.filter(event => event.day === day) : [];
  };

  const getEventTypesForDay = (day: number) => {
    const dayEvents = getEventsForDay(day);
    const hasNotes = dayEvents.some(event => event.title.startsWith('📝'));
    const hasEvents = dayEvents.some(event => !event.title.startsWith('📝'));
    return { hasNotes, hasEvents, totalCount: dayEvents.length };
  };

  const getPartyGroupsForDay = (day: number): PartyGroup[] => {
    return Array.isArray(partyGroups) ? partyGroups.filter(group => 
      group.current_year === currentYear &&
      group.current_month === currentMonth &&
      group.current_day === day
    ) : [];
  };

  const isDayCompleted = (day: number): boolean => {
    return Array.isArray(completedDays) ? completedDays.some(cd => cd.day === day) : false;
  };

  const handleNavigateToDate = (year: number, month: number, day?: number) => {
    setCurrentYear(year);
    setCurrentMonth(month);
    if (day) {
      setSelectedDay(day);
      setShowDayModal(true);
    }
    setShowSearchResults(false);
    initialYearSet.current = true; // Mark as manually changed
  };

  const performSearch = React.useCallback(async (query: string) => {
    if (!currentSession || query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await API.search.query(currentSession, query.trim());
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results);
        setShowSearchResults(data.results.length > 0);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  }, [currentSession]);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const handleSearchResultClick = (result: any) => {
    handleNavigateToDate(result.year, result.month, result.day);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const formatSearchDate = (year: number, month: number, day: number) => {
    const monthName = config?.months[month];
    return `${day}. ${monthName} ${year}`;
  };

  if (!currentSession) {
    return <SessionManager onSessionSelect={onSessionSelect} />;
  }

  if (!config) return <div className="loading">Loading D&D Calendar...</div>;

  const weekGrid = getWeekGrid(currentYear, currentMonth, config);
  const monthName = config.months[currentMonth];

  return (
    <div className="calendar">
      <DarkModeToggle />
      <div className="calendar-header">
        <div className="session-info">
          <small>Session: {currentSession}</small>
          <button onClick={() => setCurrentSession(null)}>Change Session</button>
          <LanguageSelector />
          <div className="search-container">
            <input
              type="text"
              placeholder="🔍 Search events & notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-field"
            />
            {isSearching && <div className="search-loading-indicator">⏳</div>}
            {showSearchResults && (
              <div className="search-dropdown">
                {searchResults.slice(0, 5).map((result) => (
                  <div
                    key={result.id}
                    className={`search-result-item ${result.type}`}
                    onClick={() => handleSearchResultClick(result)}
                  >
                    <div className="search-result-icon">
                      {result.type === 'note' ? '📝' : '📅'}
                    </div>
                    <div className="search-result-content">
                      <div className="search-result-title">{result.title}</div>
                      <div className="search-result-date">{formatSearchDate(result.year, result.month, result.day)}</div>
                    </div>
                  </div>
                ))}
                {searchResults.length > 5 && (
                  <div className="search-more-results" onClick={() => setShowSearchModal(true)}>
                    +{searchResults.length - 5} more results...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <h1>🌙 Aetherial Calender ✨</h1>
        <div className="calendar-nav">
          <button 
            onClick={() => {
              if (currentMonth === 0) {
                setCurrentMonth(11);
                setCurrentYear(prev => prev - 1);
                initialYearSet.current = true; // Mark as manually changed
              } else {
                setCurrentMonth(prev => prev - 1);
              }
            }}
          >
            ← Previous
          </button>
          <div className="nav-center">
            <h2>{monthName} {currentYear}</h2>
            <button 
              className="time-travel-btn"
              onClick={() => setShowTimeTravelModal(true)}
              title="Time Travel - Jump to any date"
            >
              🕰️
            </button>
          </div>
          <button 
            onClick={() => {
              if (currentMonth === 11) {
                setCurrentMonth(0);
                setCurrentYear(prev => prev + 1);
                initialYearSet.current = true; // Mark as manually changed
              } else {
                setCurrentMonth(prev => prev + 1);
              }
            }}
          >
            Next →
          </button>
        </div>
      </div>

      <div className="party-controls">
        <CategoryManager 
          currentSession={currentSession}
          categories={categories}
          onCategoryChange={fetchCategories}
        />
        <input
          type="text"
          placeholder="Party Group Name"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
        />
        <input
          type="color"
          value={newGroupColor}
          onChange={(e) => setNewGroupColor(e.target.value)}
        />
        <button onClick={addPartyGroup}>Add Party Group</button>
      </div>

      <div className="weekdays">
        {getWeekdays().map(day => (
          <div key={day} className={`weekday ${isTransitioning ? 'language-transitioning' : ''}`}>{day}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {weekGrid.map((week, weekIndex) => (
          <div key={weekIndex} className="calendar-week">
            {week.map((day, dayIndex) => {
              const dayEvents = day > 0 ? getEventsForDay(day) : [];
              const eventTypes = day > 0 ? getEventTypesForDay(day) : { hasNotes: false, hasEvents: false, totalCount: 0 };
              const moonPhases = day > 0 ? getMoonPhasesForDay(day) : [];
              const partyGroupsHere = day > 0 ? getPartyGroupsForDay(day) : [];
              const isCompleted = day > 0 ? isDayCompleted(day) : false;
              const isDragOver = dragOverDay === day;
              const isDraggingSameDay = draggedEvent && draggedEvent.year === currentYear && 
                                        draggedEvent.month === currentMonth && draggedEvent.day === day;
              
              return (
                <div
                  key={dayIndex}
                  className={`calendar-day ${day === 0 ? 'empty' : ''} ${selectedDay === day ? 'selected' : ''} ${isCompleted ? 'completed' : ''} ${isDragOver ? 'drag-over' : ''} ${isDraggingSameDay ? 'invalid-drop' : ''}`}
                  onClick={() => {
                    if (day > 0) {
                      setSelectedDay(day);
                      setShowDayModal(true);
                    }
                  }}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, day)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day)}
                >
                  {day > 0 && (
                    <>
                      <div className="day-header">
                        <div className="day-number">{day}</div>
                        <button 
                          className={`completion-toggle ${isCompleted ? 'completed' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDayCompletion(day);
                          }}
                          title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                        >
                          {isCompleted ? '✅' : '⭕'}
                        </button>
                      </div>
                      
                      {/* Event/Note indicators */}
                      {(eventTypes.hasEvents || eventTypes.hasNotes) && (
                        <div className="day-indicators">
                          {eventTypes.hasEvents && <div className="indicator event-indicator" title={`${dayEvents.filter(e => !e.title.startsWith('📝')).length} Event(s)`}>📅</div>}
                          {eventTypes.hasNotes && <div className="indicator note-indicator" title={`${dayEvents.filter(e => e.title.startsWith('📝')).length} Notiz(en)`}>📝</div>}
                          {eventTypes.totalCount > 2 && (
                            <div className="indicator count-indicator" title={`${eventTypes.totalCount} Einträge insgesamt`}>+{eventTypes.totalCount - 2}</div>
                          )}
                        </div>
                      )}
                      {dayEvents.length > 0 && (
                        <div className="events">
                          {dayEvents.map(event => {
                            const category = categories.find(c => c.id === event.category_id);
                            const isDraggedEvent = draggedEvent?.id === event.id;
                            return (
                              <div 
                                key={event.id} 
                                className={`event ${event.title.startsWith('📝') ? 'note' : ''} ${category ? 'has-category' : ''} ${isDraggedEvent ? 'dragging' : ''}`}
                                style={category ? { 
                                  borderLeft: `3px solid ${category.color}`,
                                  backgroundColor: `${category.color}10`
                                } : {}}
                                title={`${event.title}${event.description ? '\n' + event.description : ''}${category ? '\n🏷️ ' + category.name : ''}`}
                                draggable
                                onDragStart={(e) => handleEventDragStart(e, event)}
                              >
                                {category && <span className="event-category-emoji">{category.emoji}</span>}
                                {event.title}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {partyGroupsHere.length > 0 && (
                        <div className="party-groups-container">
                          {partyGroupsHere.map((group, index) => (
                            <PartyMarker
                              key={group.id}
                              group={group}
                              index={index}
                              total={partyGroupsHere.length}
                              onDragStart={handleDragStart}
                              onDelete={deletePartyGroup}
                            />
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

      {showDayModal && selectedDay && (
        <DayModal
          day={selectedDay}
          existingEvents={getEventsForDay(selectedDay)}
          categories={categories}
          onClose={() => {
            setShowDayModal(false);
            setSelectedDay(null);
          }}
          onAddEvent={handleAddEvent}
          onAddNote={handleAddNote}
          onDeleteEvent={deleteEvent}
          onConfirmEvent={confirmEvent}
        />
      )}

      {showSearchModal && (
        <SearchModal
          currentSession={currentSession}
          config={config}
          onClose={() => setShowSearchModal(false)}
          onNavigateToDate={handleNavigateToDate}
        />
      )}

      {showTimeTravelModal && (
        <TimeTravelModal
          isOpen={showTimeTravelModal}
          onClose={() => setShowTimeTravelModal(false)}
          config={config}
          currentYear={currentYear}
          currentMonth={currentMonth}
          onNavigateToDate={handleNavigateToDate}
        />
      )}
    </div>
  );
};

export default CalendarWithSessions;