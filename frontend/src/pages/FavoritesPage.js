// src/pages/FavoritesPage.js
import React, { useState, useEffect } from 'react';
import UserProductCard from '../components/UserProductCard';
import CategoriesSidebar from '../components/CategoriesSidebar';
import './FavoritesPage.css';

function FavoritesPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [error, setError] = useState('');

  // Загрузка категорий
  useEffect(() => {
    fetch('/api/categories', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error('Ошибка загрузки категорий:', err));
  }, []);

  // Функция для получения ID выбранной категории и её потомков
  const getDescendantCategoryIds = (parentId) => {
    let ids = [parentId];
    const children = categories.filter(cat => cat.parent_id === parentId);
    children.forEach(child => {
      ids = ids.concat(getDescendantCategoryIds(child.id));
    });
    return ids;
  };

  // Загрузка избранных товаров
  const loadProducts = (catId = null) => {
    let url = '/api/favorites_products';
    if (catId) {
      const descendantIds = getDescendantCategoryIds(catId);
      url += `?category_ids=${descendantIds.join(',')}`;
    }
    fetch(url, { credentials: 'include' })
      .then(res => {
        if (res.status === 401) {
          setError("Вы не авторизованы. Пожалуйста, войдите.");
          setLoading(false);
          return;
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          setProducts(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Ошибка загрузки товаров:', err);
        setError('Ошибка загрузки товаров');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadProducts(selectedCategoryId);
  }, [selectedCategoryId, categories]);

  const handleCategorySelect = (catId, catName) => {
    setSelectedCategoryId(catId);
    setSelectedCategoryName(catName);
    setShowSidebar(false);
  };

  // Функция переключения избранного
  const toggleFavorite = async (productId) => {
    try {
      const res = await fetch(`/api/favorites/${productId}`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev =>
          prev.map(p =>
            p.id === productId ? { ...p, isFavorite: data.isFavorite } : p
          )
        );
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="favorites-page">
      <h1>Избранное</h1>
      <button
        className="open-sidebar-btn"
        onClick={() => setShowSidebar(prev => !prev)}
      >
        <i className="fas fa-list"></i>
      </button>
      {showSidebar && (
        <CategoriesSidebar
          categories={categories}
          onCategorySelect={handleCategorySelect}
          onClose={() => setShowSidebar(false)}
        />
      )}
      {loading ? (
        <p>Загрузка...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : products.length === 0 ? (
        <p className="empty-message">Избранных товаров пока нет</p>
      ) : (
        <div className="favorites-grid">
          {products.map(product => (
            <UserProductCard
              key={product.id}
              product={product}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default FavoritesPage;
