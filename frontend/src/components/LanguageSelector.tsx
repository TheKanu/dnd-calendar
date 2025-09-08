import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSelector: React.FC = () => {
  const { currentLanguage, setLanguage, getAllLanguages, isTransitioning, setIsTransitioning } = useLanguage();
  const languages = getAllLanguages();

  const handleLanguageChange = (newLanguage: string) => {
    setIsTransitioning(true);
    
    // Add a brief delay for the transition effect
    setTimeout(() => {
      setLanguage(newLanguage as any);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 150);
  };

  return (
    <div className={`language-selector ${isTransitioning ? 'transitioning' : ''}`}>
      <label htmlFor="language-select">Language:</label>
      <select 
        id="language-select"
        value={currentLanguage} 
        onChange={(e) => handleLanguageChange(e.target.value)}
        title={languages[currentLanguage].description}
      >
        {Object.entries(languages).map(([key, data]) => (
          <option key={key} value={key} title={data.description}>
            {data.emoji} {data.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;