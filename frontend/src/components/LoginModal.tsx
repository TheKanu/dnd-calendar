import React, { useState } from 'react';
import './LoginModal.css';

interface LoginModalProps {
  onLogin: (password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin, isLoading, error }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      await onLogin(password);
    }
  };

  return (
    <div className="login-modal-overlay">
      <div className="login-modal">
        <div className="login-header">
          <h2>🌙 Aetherial Calendar ✨</h2>
          <p>Zugang erforderlich</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="password-field">
            <label htmlFor="password">Master Passwort</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort eingeben..."
                disabled={isLoading}
                autoFocus
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}
          
          <button 
            type="submit" 
            className="login-button" 
            disabled={isLoading || !password.trim()}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Authentifizierung...
              </>
            ) : (
              'Einloggen'
            )}
          </button>
        </form>
        
        <div className="login-footer">
          <small>🔐 Sicherer Zugang zum D&D Kalender</small>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;