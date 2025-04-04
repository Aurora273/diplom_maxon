// src/components/CategoriesSidebar.js
import React, { useState } from 'react';
import './CategoriesSidebar.css';

function CategoriesSidebar({ categories, onCategorySelect, onClose }) {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (catId) => {
    setExpanded((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const renderCategories = (parentId = null, level = 0) => {
    return categories
      .filter((cat) => cat.parent_id === parentId)
      .map((cat) => {
        const children = categories.filter((child) => child.parent_id === cat.id);
        const isExpanded = expanded[cat.id];
        return (
          <div key={cat.id} className="category-item" style={{ marginLeft: `${level * 20}px` }}>
            <div className="category-row">
              {children.length > 0 && (
                <button className="toggle-btn" onClick={() => toggleExpand(cat.id)} title="Раскрыть/Свернуть">
                  <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'}`}></i>
                </button>
              )}
              <span className="category-name" onClick={() => onCategorySelect(cat.id, cat.name)}>
                {cat.name}
              </span>
            </div>
            {children.length > 0 && isExpanded && renderCategories(cat.id, level + 1)}
          </div>
        );
      });
  };

  return (
    <div className="categories-sidebar">
      <button className="close-btn-left" onClick={onClose}>&times;</button>
      <div className="sidebar-header">Категории</div>
      <div className="categories-tree">
        {renderCategories()}
      </div>
    </div>
  );
}

export default CategoriesSidebar;
