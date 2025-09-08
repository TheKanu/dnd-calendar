import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'infernal' | 'dwarven' | 'common' | 'elvish';

interface LanguageData {
  name: string;
  emoji: string;
  description: string;
  weekdays: string[];
}

const LANGUAGES: Record<Language, LanguageData> = {
  infernal: {
    name: "Infernal",
    emoji: "🔥",
    description: "The harsh tongue of devils and demons, spoken in the Nine Hells. Each day bears the mark of torment and power.",
    weekdays: [
      "Ish'qel", // The Prime
      "Vorr'ek", // The Scar
      "Keth'ar", // The Cleaver
      "Byn'dak", // The Binding
      "Ash'nihr", // The Ember
      "Hul'azor", // The Hollow
      "Ve'lith", // The Veil
      "Ner'oth" // The End
    ],
  },
  dwarven: {
    name: 'Dwarven',
    emoji: '⛏️',
    description: "The ancient language of the mountain clans, forged in stone and tempered by fire. Each day echoes with the sound of hammer on anvil.",
    weekdays: [
      'Aurgrim',
      'Soldrak',
      'Wisdrom',
      'Mangar',
      'Draktor',
      'Umkil',
      'Leybrun',
      'Nexdorn'
    ]
  },
  common: {
    name: 'Common',
    emoji: '🌍',
    description: "The trade tongue spoken by most folk across the realms. Simple, practical names for the days of common folk.",
    weekdays: [
      'Auronday',
      'Sonday',
      'Wisday',
      'Mansday',
      'Darkday',
      'Umday',
      'Leyday',
      'Nextday'
    ]
  },
  elvish: {
    name: 'Elvish',
    emoji: '🧝',
    description: "The melodic language of the fey folk, flowing like wind through ancient forests. Each day name carries the grace of ages.",
    weekdays: [
      'Auro\'dae',
      'Sol\'dae',
      'Wis\'dae',
      'Man\'dae',
      'Drak\'dae',
      'Um\'dae',
      'Ley\'dae',
      'Nex\'dae'
    ]
  }
};


interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  getWeekdays: () => string[];
  getLanguageData: () => LanguageData;
  getAllLanguages: () => Record<Language, LanguageData>;
  isTransitioning: boolean;
  setIsTransitioning: (transitioning: boolean) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('common');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('calendar-language', language);
  };

  const getWeekdays = () => LANGUAGES[currentLanguage].weekdays;
  
  const getLanguageData = () => LANGUAGES[currentLanguage];
  
  const getAllLanguages = () => LANGUAGES;

  React.useEffect(() => {
    const savedLanguage = localStorage.getItem('calendar-language') as Language;
    if (savedLanguage && LANGUAGES[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      setLanguage,
      getWeekdays,
      getLanguageData,
      getAllLanguages,
      isTransitioning,
      setIsTransitioning
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};