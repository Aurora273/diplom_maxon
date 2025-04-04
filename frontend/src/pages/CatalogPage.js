// src/pages/CatalogPage.js
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import UserProductCard from '../components/UserProductCard';
import CategoriesSidebar from '../components/CategoriesSidebar';
import './CatalogPage.css';

function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [error, setError] = useState('');

  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

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

  // Загрузка товаров
  const loadProducts = (catId = null) => {
    let url = '/api/products';
    if (queryParam) {
      url += `?q=${encodeURIComponent(queryParam)}`;
    } else if (catId) {
      const descendantIds = getDescendantCategoryIds(catId);
      url += `?category_ids=${descendantIds.join(',')}`;
    }
    fetch(url, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Ошибка загрузки товаров:', err);
        setError('Ошибка загрузки товаров');
        setLoading(false);
      });
  };

  useEffect(() => {
    // Если есть поисковый запрос, игнорируем выбранную категорию
    if (queryParam) {
      loadProducts(null);
    } else {
      loadProducts(selectedCategoryId);
    }
  }, [selectedCategoryId, categories, queryParam]);

  const handleCategorySelect = (catId, catName) => {
    setSelectedCategoryId(catId);
    setSelectedCategoryName(catName);
    setShowSidebar(false);
  };

  // Функция для переключения избранного (осталась без изменений)
  const toggleFavorite = async (productId) => {
    console.log('toggleFavorite called for product id:', productId);
    try {
      const res = await fetch(`/api/favorites/${productId}`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      console.log('toggleFavorite response:', data);
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
    <div className="catalog-page">
      <h1>Каталог товаров</h1>
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
      ) : (
        <div className="product-grid">
          {products.map(product => (
            <UserProductCard key={product.id} product={product} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      )}
    </div>
  );
}

export default CatalogPage;
