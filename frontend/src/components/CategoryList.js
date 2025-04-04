// src/components/CategoryList.js
import React, { useState, useEffect } from 'react';
import './CategoryList.css';

function CategoryList({ onSelectParent }) {
  const [categories, setCategories] = useState([]);

  // Загружаем список категорий с сервера (эндпоинт /api/categories должен возвращать массив категорий)
  useEffect(() => {
    fetch('/api/categories', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error(err));
  }, []);

  // Рекурсивная функция для отображения дерева категорий
  const renderTree = (parentId = null, level = 0) => {
    return categories
      .filter((cat) => cat.parent_id === parentId)
      .map((cat) => (
        <div key={cat.id} className="category-item" style={{ marginLeft: `${level * 20}px` }}>
          <span>{cat.name}</span>
          {/* Иконка плюсика для выбора данной категории как родительской для новой */}
          <button className="plus-icon" onClick={() => onSelectParent(cat.id)} title="Добавить подкатегорию">
            +
          </button>
          {renderTree(cat.id, level + 1)}
        </div>
      ));
  };

  return (
    <div className="category-list">
      {renderTree()}
      <button className="add-top-category-btn" onClick={() => onSelectParent(null)}>
        Добавить категорию верхнего уровня
      </button>
    </div>
  );
}

export default CategoryList;
