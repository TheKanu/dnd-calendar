import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './WeatherSelector.css';

interface WeatherSelectorProps {
  currentWeather?: string;
  onWeatherSelect: (weatherType: string) => void;
  onWeatherClear: () => void;
}

const WEATHER_TYPES = [
  { type: 'thunderstorm', emoji: '⛈️', label: 'Gewitter' },
  { type: 'rain', emoji: '🌧️', label: 'Regen' },
  { type: 'snow', emoji: '❄️', label: 'Schnee' },
  { type: 'cloudy', emoji: '☁️', label: 'Bewölkt' },
  { type: 'partly_cloudy', emoji: '⛅', label: 'Sonnig bewölkt' },
  { type: 'sunny', emoji: '☀️', label: 'Sonne' },
  { type: 'fog', emoji: '🌫️', label: 'Nebel' },
  { type: 'wind', emoji: '💨', label: 'Windig' }
];

const WeatherSelector: React.FC<WeatherSelectorProps> = ({ 
  currentWeather, 
  onWeatherSelect, 
  onWeatherClear 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const calculateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 250;
      const dropdownWidth = 200;
      const screenCenter = window.innerWidth / 2;
      const iconCenter = rect.left + (rect.width / 2);
      
      // Position vertically (below or above)
      let top = rect.bottom + 4;
      if (top + dropdownHeight > window.innerHeight - 10) {
        top = rect.top - dropdownHeight - 4;
      }
      
      let left;
      
      // Smart horizontal positioning based on icon position relative to screen center
      if (iconCenter < screenCenter) {
        // Icon is on the left side - anchor dropdown's LEFT edge to the icon
        left = rect.left;
        console.log('Left side positioning - anchoring left edge to icon');
      } else {
        // Icon is on the right side - anchor dropdown's RIGHT edge to the icon  
        left = rect.right - dropdownWidth;
        console.log('Right side positioning - anchoring right edge to icon');
      }
      
      // Ensure dropdown stays within viewport bounds
      if (left < 10) {
        left = 10;
      } else if (left + dropdownWidth > window.innerWidth - 10) {
        left = window.innerWidth - dropdownWidth - 10;
      }
      
      console.log('Dropdown position calculated:', { 
        top, left, 
        iconCenter, screenCenter, 
        side: iconCenter < screenCenter ? 'left' : 'right',
        buttonRect: rect 
      });
      setDropdownPosition({ top, left });
    }
  };

  const handleToggleDropdown = () => {
    if (!isOpen) {
      // First calculate position, then show dropdown
      calculateDropdownPosition();
      setIsOpen(true);
      // Small delay to ensure position is set before making visible
      setTimeout(() => setIsVisible(true), 0);
    } else {
      // Close dropdown with fade out
      setIsVisible(false);
      setTimeout(() => setIsOpen(false), 150); // Match CSS transition duration
    }
  };

  // Update position when dropdown is visible and on scroll/resize
  useEffect(() => {
    if (isOpen && isVisible && buttonRef.current) {
      const updatePosition = () => calculateDropdownPosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, isVisible]);

  const handleWeatherSelect = (weatherType: string) => {
    console.log('Weather selected:', weatherType);
    onWeatherSelect(weatherType);
    // Animate close
    setIsVisible(false);
    setTimeout(() => setIsOpen(false), 150);
  };

  const handleWeatherClear = () => {
    onWeatherClear();
    // Animate close
    setIsVisible(false);
    setTimeout(() => setIsOpen(false), 150);
  };

  const getCurrentWeatherEmoji = () => {
    const weather = WEATHER_TYPES.find(w => w.type === currentWeather);
    return weather?.emoji || '🌤️';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking on the button
      if (buttonRef.current && buttonRef.current.contains(target)) {
        return;
      }
      
      // Don't close if clicking inside the dropdown
      const dropdown = document.querySelector('.weather-dropdown-portal');
      if (dropdown && dropdown.contains(target)) {
        return;
      }
      
      // Otherwise, close the dropdown with animation
      setIsVisible(false);
      setTimeout(() => setIsOpen(false), 150);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const dropdownContent = isOpen ? (
    <div 
      className={`weather-dropdown weather-dropdown-portal ${isVisible ? 'visible' : ''}`}
      style={{
        position: 'fixed',
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        zIndex: 1900
      }}
    >
      <div className="weather-header">Wetter setzen:</div>
      <div className="weather-options">
        {WEATHER_TYPES.map((weather) => (
          <button
            key={weather.type}
            className={`weather-option ${currentWeather === weather.type ? 'selected' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleWeatherSelect(weather.type);
            }}
            title={weather.label}
          >
            {weather.emoji} {weather.label}
          </button>
        ))}
      </div>
      {currentWeather && (
        <button 
          className="weather-clear" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleWeatherClear();
          }}
          title="Wetter entfernen"
        >
          ❌ Entfernen
        </button>
      )}
    </div>
  ) : null;

  return (
    <>
      <div className="weather-selector">
        <button 
          ref={buttonRef}
          className={`weather-button ${currentWeather ? 'has-weather' : ''}`}
          onClick={handleToggleDropdown}
          title="Wetter setzen (nur DM)"
        >
          {getCurrentWeatherEmoji()}
        </button>
      </div>
      
      {isOpen && createPortal(
        dropdownContent,
        document.body
      )}
    </>
  );
};

export default WeatherSelector;