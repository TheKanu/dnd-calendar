import React, { useState, useEffect } from 'react';
import { CalendarConfig } from '../types/Calendar';
import './TimeTravelModal.css';

interface TimeTravelModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CalendarConfig;
  currentYear: number;
  currentMonth: number;
  onNavigateToDate: (year: number, month: number, day?: number) => void;
}

const TimeTravelModal: React.FC<TimeTravelModalProps> = ({
  isOpen,
  onClose,
  config,
  currentYear,
  currentMonth,
  onNavigateToDate
}) => {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedDay, setSelectedDay] = useState<number | ''>('');

  useEffect(() => {
    setSelectedYear(currentYear);
    setSelectedMonth(currentMonth);
    setSelectedDay('');
  }, [currentYear, currentMonth, isOpen]);

  if (!isOpen) return null;

  const handleJumpToDate = () => {
    const monthName = config.months[selectedMonth];
    const daysInMonth = config.month_len[monthName];
    
    if (selectedDay && selectedDay >= 1 && selectedDay <= daysInMonth) {
      onNavigateToDate(selectedYear, selectedMonth, selectedDay);
    } else {
      onNavigateToDate(selectedYear, selectedMonth);
    }
    onClose();
  };

  const handleQuickJump = (yearOffset: number, monthOffset: number = 0) => {
    let newYear = currentYear + yearOffset;
    let newMonth = currentMonth + monthOffset;
    
    if (newMonth > 11) {
      newYear += Math.floor(newMonth / 12);
      newMonth = newMonth % 12;
    } else if (newMonth < 0) {
      newYear += Math.floor(newMonth / 12);
      newMonth = 12 + (newMonth % 12);
    }
    
    onNavigateToDate(newYear, newMonth);
    onClose();
  };

  const monthName = config.months[selectedMonth];
  const maxDay = config.month_len[monthName];

  return (
    <div className="time-travel-overlay" onClick={onClose}>
      <div className="time-travel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="time-travel-header">
          <h3>🕰️ Time Travel</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="time-travel-content">
          <div className="current-date-info">
            <p>Currently viewing: <strong>{config.months[currentMonth]} {currentYear}</strong></p>
          </div>

          <div className="quick-jumps">
            <h4>Quick Jumps</h4>
            <div className="quick-jump-buttons">
              <button onClick={() => handleQuickJump(-10)}>-10 Years</button>
              <button onClick={() => handleQuickJump(-1)}>-1 Year</button>
              <button onClick={() => handleQuickJump(0, -6)}>-6 Months</button>
              <button onClick={() => handleQuickJump(0, -1)}>-1 Month</button>
              <button onClick={() => handleQuickJump(0, 1)}>+1 Month</button>
              <button onClick={() => handleQuickJump(0, 6)}>+6 Months</button>
              <button onClick={() => handleQuickJump(1)}>+1 Year</button>
              <button onClick={() => handleQuickJump(10)}>+10 Years</button>
            </div>
          </div>

          <div className="custom-date-selector">
            <h4>Jump to Specific Date</h4>
            
            <div className="date-inputs">
              <div className="input-group">
                <label>Year:</label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value) || config.year)}
                  min="1"
                  max="9999"
                />
              </div>

              <div className="input-group">
                <label>Month:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                >
                  {config.months.map((month, index) => (
                    <option key={index} value={index}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Day (optional):</label>
                <input
                  type="number"
                  value={selectedDay}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      setSelectedDay('');
                    } else {
                      const day = parseInt(value);
                      if (day >= 1 && day <= maxDay) {
                        setSelectedDay(day);
                      }
                    }
                  }}
                  min="1"
                  max={maxDay}
                  placeholder={`1-${maxDay}`}
                />
              </div>
            </div>

            <div className="selected-date-preview">
              {selectedDay ? (
                <p>Jump to: <strong>{selectedDay}. {monthName} {selectedYear}</strong></p>
              ) : (
                <p>Jump to: <strong>{monthName} {selectedYear}</strong></p>
              )}
            </div>
          </div>

          <div className="time-travel-actions">
            <button className="cancel-btn" onClick={onClose}>Cancel</button>
            <button className="jump-btn" onClick={handleJumpToDate}>
              🚀 Jump to Date
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeTravelModal;