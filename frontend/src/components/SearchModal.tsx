import React, { useState, useEffect } from 'react';
import { CalendarConfig } from '../types/Calendar';
import { API } from '../utils/api';
import './SearchModal.css';

interface SearchResult {
  id: number;
  session_id: string;
  year: number;
  month: number;
  day: number;
  title: string;
  description?: string;
  confirmed?: boolean;
  is_recurring?: boolean;
  category_id?: number;
  category?: {
    name: string;
    color: string;
    emoji: string;
  };
  created_at: string;
  type: 'note' | 'event';
}

interface SearchModalProps {
  currentSession: string;
  config: CalendarConfig;
  onClose: () => void;
  onNavigateToDate: (year: number, month: number, day: number) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ 
  currentSession, 
  config, 
  onClose, 
  onNavigateToDate 
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);
  const [monthFilter, setMonthFilter] = useState<number | undefined>(undefined);

  const performSearch = async () => {
    if (query.trim().length < 2) {
      setError('Search query must be at least 2 characters long');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const filters: { year?: number; month?: number } = {};
      if (yearFilter) filters.year = yearFilter;
      if (monthFilter !== undefined) filters.month = monthFilter;

      const response = await API.search.query(currentSession, query.trim(), filters);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results);
      setTotalResults(data.total);
    } catch (err) {
      setError('Failed to search. Please try again.');
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch();
      } else {
        setResults([]);
        setTotalResults(0);
        setError(null);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, yearFilter, monthFilter]);

  const formatDate = (year: number, month: number, day: number) => {
    const monthName = config.months[month];
    return `${day}. ${monthName} ${year}`;
  };

  const handleResultClick = (result: SearchResult) => {
    onNavigateToDate(result.year, result.month, result.day);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="search-modal">
        <div className="search-modal-header">
          <h2>🔍 Search Events & Notes</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="search-controls">
          <input
            type="text"
            placeholder="Search for events or notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
            autoFocus
          />
          
          <div className="search-filters">
            <select 
              value={yearFilter || ''} 
              onChange={(e) => setYearFilter(e.target.value ? parseInt(e.target.value) : undefined)}
              className="filter-select"
            >
              <option value="">All Years</option>
              {Array.from({length: 10}, (_, i) => config.year - 5 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            <select 
              value={monthFilter !== undefined ? monthFilter : ''} 
              onChange={(e) => setMonthFilter(e.target.value !== '' ? parseInt(e.target.value) : undefined)}
              className="filter-select"
            >
              <option value="">All Months</option>
              {config.months.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="search-results">
          {isSearching && (
            <div className="search-loading">Searching...</div>
          )}

          {error && (
            <div className="search-error">{error}</div>
          )}

          {!isSearching && !error && query.trim().length >= 2 && (
            <div className="search-summary">
              Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
            </div>
          )}

          {!isSearching && results.length > 0 && (
            <div className="results-list">
              {results.map((result) => (
                <div 
                  key={result.id} 
                  className={`search-result-item ${result.type}`}
                  onClick={() => handleResultClick(result)}
                >
                  <div className="result-header">
                    <div className="result-type-icon">
                      {result.type === 'note' ? '📝' : '📅'}
                    </div>
                    <div className="result-title">
                      {result.title}
                      {result.category && (
                        <span 
                          className="result-category"
                          style={{ color: result.category.color }}
                        >
                          {result.category.emoji} {result.category.name}
                        </span>
                      )}
                    </div>
                    <div className="result-date">
                      {formatDate(result.year, result.month, result.day)}
                    </div>
                  </div>
                  
                  {result.description && (
                    <div className="result-description">
                      {result.description}
                    </div>
                  )}
                  
                  <div className="result-meta">
                    {result.confirmed && <span className="confirmed-badge">✅ Confirmed</span>}
                    {result.is_recurring && <span className="recurring-badge">🔄 Recurring</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isSearching && !error && query.trim().length >= 2 && results.length === 0 && (
            <div className="no-results">
              No events or notes found matching "{query}"
              {(yearFilter || monthFilter !== undefined) && (
                <div className="filter-note">
                  Try removing filters to expand your search
                </div>
              )}
            </div>
          )}

          {query.trim().length < 2 && !isSearching && (
            <div className="search-hint">
              Enter at least 2 characters to start searching...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;