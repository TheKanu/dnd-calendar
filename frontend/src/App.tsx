import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import CalendarWithSessions from './components/CalendarWithSessions';
import LoginModal from './components/LoginModal';
import apiConfig from './config/environment';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      // Check if token is still valid
      fetch(`${apiConfig.API_BASE_URL}/api/calendar/config`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('auth-token');
        }
      })
      .catch(() => {
        localStorage.removeItem('auth-token');
      })
      .finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = async (password: string) => {
    setLoginLoading(true);
    setLoginError(null);

    try {
      const response = await fetch(`${apiConfig.API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('auth-token', data.token);
        setIsAuthenticated(true);
      } else {
        setLoginError(data.error || 'Login fehlgeschlagen');
      }
    } catch (error) {
      setLoginError('Verbindungsfehler - bitte erneut versuchen');
    } finally {
      setLoginLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <h2>🌙 Aetherial Calendar ✨</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="App">
          {isAuthenticated ? (
            <CalendarWithSessions />
          ) : (
            <LoginModal 
              onLogin={handleLogin}
              isLoading={loginLoading}
              error={loginError}
            />
          )}
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
