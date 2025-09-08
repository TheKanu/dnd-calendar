import React, { useState } from 'react';
import { API } from '../utils/api';
import './SessionManager.css';

interface SessionManagerProps {
  onSessionSelect: (sessionId: string) => void;
}

const SessionManager: React.FC<SessionManagerProps> = ({ onSessionSelect }) => {
  const [mode, setMode] = useState<'select' | 'join' | 'create' | 'list'>('select');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSessions, setAvailableSessions] = useState<any[]>([]);
  
  // Join session state
  const [joinSessionId, setJoinSessionId] = useState('');
  
  // Delete session state
  const [deletePassword, setDeletePassword] = useState('');
  
  // Create session state
  const [createSessionId, setCreateSessionId] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [startYear, setStartYear] = useState(1048);
  const [startMonth, setStartMonth] = useState(0);

  const monthNames = ["Auro'ithil","Man'alasse","Thael'orne","Pel'anor","Drac'uial","Val'kaurn","Shad'morn","Ley'thurin","Nex'illien","Tun'giliath","Mor'galad","Cir'annen"];

  const joinSession = async () => {
    if (!joinSessionId.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Check if session exists before joining
      const response = await API.sessions.exists(joinSessionId.trim());
      
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          // Session exists, can join
          onSessionSelect(joinSessionId.trim());
        } else {
          // Session doesn't exist
          setError('Session nicht gefunden. Überprüfe die Session-ID oder erstelle eine neue Session.');
        }
      } else {
        // Session doesn't exist
        setError('Session nicht gefunden. Überprüfe die Session-ID oder erstelle eine neue Session.');
      }
    } catch (error) {
      console.error('Failed to join session:', error);
      setError('Session nicht gefunden. Überprüfe die Session-ID oder erstelle eine neue Session.');
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async () => {
    if (!createSessionId.trim() || !sessionName.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // First check if session already exists
      const checkResponse = await API.sessions.exists(createSessionId.trim());
      
      if (checkResponse.ok) {
        const data = await checkResponse.json();
        if (data.exists) {
          // Session already exists
          setError('Eine Session mit dieser ID existiert bereits. Wähle eine andere ID oder tritt der bestehenden Session bei.');
          setIsLoading(false);
          return;
        }
      }

      // Session doesn't exist, create it
      const response = await API.sessions.create({
        id: createSessionId.trim(),
        name: sessionName.trim(),
        description: sessionDescription.trim(),
        startYear: startYear,
        startMonth: startMonth
      });

      if (response.ok) {
        onSessionSelect(createSessionId.trim());
      } else {
        const data = await response.json();
        setError(data.error || 'Fehler beim Erstellen der Session');
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      setError('Verbindungsfehler beim Erstellen der Session');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableSessions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await API.sessions.getAll();
      if (response.ok) {
        const sessions = await response.json();
        setAvailableSessions(sessions);
      } else {
        setError('Fehler beim Laden der verfügbaren Sessions');
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      setError('Verbindungsfehler beim Laden der Sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!deletePassword.trim()) {
      setError('Passwort für Löschen ist erforderlich');
      return;
    }
    
    const confirmed = window.confirm(`Session "${sessionId}" wirklich löschen? Alle Daten gehen verloren!`);
    if (!confirmed) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await API.sessions.delete(sessionId, deletePassword.trim());
      
      if (response.ok) {
        setDeletePassword('');
        loadAvailableSessions(); // Refresh the list
        setError(null);
      } else {
        const data = await response.json();
        setError(data.error || 'Fehler beim Löschen der Session');
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
      setError('Verbindungsfehler beim Löschen der Session');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setJoinSessionId('');
    setCreateSessionId('');
    setSessionName('');
    setSessionDescription('');
    setStartYear(1048);
    setStartMonth(0);
    setDeletePassword('');
    setError(null);
  };

  const handleModeChange = (newMode: 'select' | 'join' | 'create' | 'list') => {
    setMode(newMode);
    resetForm();
    
    if (newMode === 'list') {
      loadAvailableSessions();
    }
  };

  if (mode === 'select') {
    return (
      <div className="session-manager">
        <div className="session-welcome">
          <h2>🌙 Session Management ✨</h2>
          <p>Wähle eine Option um mit dem D&D Kalender zu beginnen:</p>
        </div>
        
        <div className="session-mode-buttons">
          <button 
            className="mode-button join-button" 
            onClick={() => handleModeChange('join')}
          >
            <div className="button-icon">🚪</div>
            <div className="button-content">
              <h3>Session Beitreten</h3>
              <p>Trete einer bestehenden Session bei</p>
            </div>
          </button>
          
          <button 
            className="mode-button create-button" 
            onClick={() => handleModeChange('create')}
          >
            <div className="button-icon">➕</div>
            <div className="button-content">
              <h3>Session Erstellen</h3>
              <p>Erstelle eine neue D&D Session</p>
            </div>
          </button>
          
          <button 
            className="mode-button list-button" 
            onClick={() => handleModeChange('list')}
          >
            <div className="button-icon">📋</div>
            <div className="button-content">
              <h3>Sessions Durchsuchen</h3>
              <p>Alle verfügbaren Sessions anzeigen</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="session-manager">
        <div className="session-form-header">
          <button className="back-button" onClick={() => handleModeChange('select')}>
            ← Zurück
          </button>
          <h2>🚪 Session Beitreten</h2>
        </div>
        
        <div className="session-form">
          <div className="input-group">
            <label>Session ID</label>
            <input
              type="text"
              placeholder="z.B. 'die-ueberlebenden' oder 'dragons-campaign'"
              value={joinSessionId}
              onChange={(e) => setJoinSessionId(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            <small>Gib die Session-ID ein, die dir der GM gegeben hat</small>
          </div>

          {error && <div className="error-message">❌ {error}</div>}

          <div className="form-actions">
            <button 
              className="join-session-button" 
              onClick={joinSession} 
              disabled={!joinSessionId.trim() || isLoading}
            >
              {isLoading ? 'Beitreten...' : 'Session Beitreten'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="session-manager">
        <div className="session-form-header">
          <button className="back-button" onClick={() => handleModeChange('select')}>
            ← Zurück
          </button>
          <h2>➕ Neue Session Erstellen</h2>
        </div>
        
        <div className="session-form">
          <div className="input-group">
            <label>Session ID *</label>
            <input
              type="text"
              placeholder="z.B. 'die-ueberlebenden'"
              value={createSessionId}
              onChange={(e) => setCreateSessionId(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
            <small>Eindeutige ID für deine Session (keine Leerzeichen)</small>
          </div>
          
          <div className="input-group">
            <label>Session Name *</label>
            <input
              type="text"
              placeholder="z.B. 'Die Überlebenden von Aetheria'"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="input-group">
            <label>Beschreibung</label>
            <textarea
              placeholder="Kurze Beschreibung der Kampagne (optional)"
              value={sessionDescription}
              onChange={(e) => setSessionDescription(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="date-controls">
            <div className="input-group">
              <label>Startjahr</label>
              <input
                type="number"
                min="1"
                max="9999"
                value={startYear}
                onChange={(e) => setStartYear(parseInt(e.target.value) || 1048)}
                disabled={isLoading}
              />
            </div>
            
            <div className="input-group">
              <label>Startmonat</label>
              <select
                value={startMonth}
                onChange={(e) => setStartMonth(parseInt(e.target.value))}
                disabled={isLoading}
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="error-message">❌ {error}</div>}

          <div className="form-actions">
            <button 
              className="create-session-button" 
              onClick={createSession} 
              disabled={!createSessionId.trim() || !sessionName.trim() || isLoading}
            >
              {isLoading ? 'Erstelle Session...' : 'Session Erstellen'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'list') {
    return (
      <div className="session-manager">
        <div className="session-form-header">
          <button className="back-button" onClick={() => handleModeChange('select')}>
            ← Zurück
          </button>
          <h2>📋 Verfügbare Sessions</h2>
        </div>
        
        {isLoading && <div className="loading-message">Sessions werden geladen...</div>}
        
        {error && <div className="error-message">❌ {error}</div>}
        
        {!isLoading && !error && (
          <div className="session-list">
            {availableSessions.length === 0 ? (
              <div className="no-sessions">
                <p>Keine Sessions gefunden. Erstelle eine neue Session um zu beginnen!</p>
                <button 
                  className="create-session-button" 
                  onClick={() => handleModeChange('create')}
                >
                  ➕ Session Erstellen
                </button>
              </div>
            ) : (
              <>
                <div className="delete-controls">
                  <div className="input-group">
                    <label>Lösch-Passwort (zum Löschen von Sessions)</label>
                    <input
                      type="password"
                      placeholder="Passwort eingeben..."
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <small>Benötigt um Sessions zu löschen</small>
                  </div>
                </div>
                
                <div className="sessions-grid">
                  {availableSessions.map((session: any) => (
                    <div key={session.id} className="session-card">
                      <div className="session-header">
                        <h3>{session.name}</h3>
                        <small>ID: {session.id}</small>
                      </div>
                      {session.description && (
                        <p className="session-description">{session.description}</p>
                      )}
                      <div className="session-info">
                        <div className="session-date">
                          🗓️ Start: {monthNames[session.start_month]} {session.start_year}
                        </div>
                        <div className="session-created">
                          ⏰ Erstellt: {new Date(session.created_at).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                      <div className="session-actions">
                        <button 
                          className="join-session-button" 
                          onClick={() => onSessionSelect(session.id)}
                        >
                          🚪 Session Beitreten
                        </button>
                        <button 
                          className="delete-session-button" 
                          onClick={() => deleteSession(session.id)}
                          disabled={!deletePassword.trim() || isLoading}
                          title="Session löschen (Passwort erforderlich)"
                        >
                          🗑️ Löschen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default SessionManager;