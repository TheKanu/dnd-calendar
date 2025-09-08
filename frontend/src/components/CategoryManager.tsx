import React, { useState } from 'react';
import './CategoryManager.css';

interface Category {
  id: number;
  name: string;
  color: string;
  emoji: string;
}

interface CategoryManagerProps {
  currentSession: string;
  categories: Category[];
  onCategoryChange: () => void;
}

const PREDEFINED_DND_CATEGORIES = [
  { name: 'Quest', color: '#e74c3c', emoji: '⚔️' },
  { name: 'Festival', color: '#f39c12', emoji: '🎉' },
  { name: 'Battle', color: '#c0392b', emoji: '⚔️' },
  { name: 'Royal Event', color: '#9b59b6', emoji: '👑' },
  { name: 'Market Day', color: '#16a085', emoji: '🛒' },
  { name: 'Religious Ceremony', color: '#f1c40f', emoji: '⛪' },
  { name: 'Travel', color: '#34495e', emoji: '🗺️' },
  { name: 'Guild Meeting', color: '#27ae60', emoji: '🤝' },
  { name: 'Investigation', color: '#2980b9', emoji: '🔍' },
  { name: 'Dungeon', color: '#8e44ad', emoji: '🏰' },
  { name: 'Tavern Event', color: '#d35400', emoji: '🍻' },
  { name: 'Weather Event', color: '#7f8c8d', emoji: '🌩️' }
];

const CategoryManager: React.FC<CategoryManagerProps> = ({ 
  currentSession, 
  categories, 
  onCategoryChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3498db');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('📅');

  const createCategory = async (name: string, color: string, emoji: string) => {
    try {
      const response = await fetch(`/api/sessions/${currentSession}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ name, color, emoji })
      });

      if (response.ok) {
        onCategoryChange();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating category:', error);
      return false;
    }
  };

  const deleteCategory = async (categoryId: number) => {
    if (!window.confirm('Diese Kategorie löschen? Events mit dieser Kategorie behalten ihre Zuordnung.')) return;
    
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        onCategoryChange();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const addCustomCategory = async () => {
    if (!newCategoryName.trim()) return;

    const success = await createCategory(newCategoryName, newCategoryColor, newCategoryEmoji);
    if (success) {
      setNewCategoryName('');
      setNewCategoryColor('#3498db');
      setNewCategoryEmoji('📅');
    }
  };

  const addPredefinedCategory = async (category: typeof PREDEFINED_DND_CATEGORIES[0]) => {
    await createCategory(category.name, category.color, category.emoji);
  };

  const addAllPredefinedCategories = async () => {
    for (const category of PREDEFINED_DND_CATEGORIES) {
      // Check if category already exists
      const exists = categories.some(c => c.name.toLowerCase() === category.name.toLowerCase());
      if (!exists) {
        await createCategory(category.name, category.color, category.emoji);
      }
    }
  };

  if (!isOpen) {
    return (
      <button 
        className="category-manager-toggle"
        onClick={() => setIsOpen(true)}
        title="Event-Kategorien verwalten"
      >
        🏷️ Kategorien ({categories.length})
      </button>
    );
  }

  return (
    <div className="category-manager">
      <div className="category-manager-header">
        <h3>🏷️ Event-Kategorien</h3>
        <button 
          className="close-button"
          onClick={() => setIsOpen(false)}
        >
          ×
        </button>
      </div>

      <div className="category-manager-content">
        {/* Existing Categories */}
        <div className="existing-categories">
          <h4>Vorhandene Kategorien ({categories.length})</h4>
          {categories.length === 0 ? (
            <p className="no-categories">Noch keine Kategorien erstellt</p>
          ) : (
            <div className="category-list">
              {categories.map(category => (
                <div key={category.id} className="category-item">
                  <div className="category-info">
                    <span 
                      className="category-color" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="category-emoji">{category.emoji}</span>
                    <span className="category-name">{category.name}</span>
                  </div>
                  <button
                    className="delete-category-btn"
                    onClick={() => deleteCategory(category.id)}
                    title="Kategorie löschen"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Add D&D Categories */}
        <div className="predefined-categories">
          <h4>🐉 D&D Kategorien hinzufügen</h4>
          <button 
            className="add-all-btn"
            onClick={addAllPredefinedCategories}
          >
            Alle D&D Kategorien hinzufügen
          </button>
          
          <div className="predefined-grid">
            {PREDEFINED_DND_CATEGORIES
              .filter(predefined => !categories.some(c => c.name.toLowerCase() === predefined.name.toLowerCase()))
              .map((category, index) => (
                <button
                  key={index}
                  className="predefined-category-btn"
                  onClick={() => addPredefinedCategory(category)}
                  style={{ borderColor: category.color }}
                >
                  <span className="category-emoji">{category.emoji}</span>
                  <span className="category-name">{category.name}</span>
                </button>
              ))}
          </div>
        </div>

        {/* Custom Category Creation */}
        <div className="custom-category">
          <h4>➕ Eigene Kategorie erstellen</h4>
          <div className="create-form">
            <div className="form-row">
              <input
                type="text"
                placeholder="Kategorie Name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomCategory()}
              />
              <input
                type="text"
                placeholder="📅"
                value={newCategoryEmoji}
                onChange={(e) => setNewCategoryEmoji(e.target.value)}
                className="emoji-input"
                maxLength={2}
              />
              <input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="color-input"
              />
            </div>
            <button 
              className="create-category-btn"
              onClick={addCustomCategory}
              disabled={!newCategoryName.trim()}
            >
              Kategorie erstellen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;