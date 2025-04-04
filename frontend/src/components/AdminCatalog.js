// src/pages/AdminCatalog.js
import React, { useState, useEffect } from 'react';
import AddProductForm from '../components/AddProductForm';
import ProductCard from '../components/ProductCard';
import './AdminCatalog.css';

function AdminCatalog() {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);

  // Состояния для модального окна добавления новой категории
  const [showAddModal, setShowAddModal] = useState(false);
  const [parentForNewCategory, setParentForNewCategory] = useState(null);
  const [parentForNewCategoryName, setParentForNewCategoryName] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [catError, setCatError] = useState('');

  // Состояния для редактирования названия категории
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Состояние для управления раскрытием дерева категорий
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadProducts(selectedCategoryId);
    } else {
      setProducts([]);
    }
  }, [selectedCategoryId, categories]);

  const loadCategories = () => {
    fetch('/api/categories', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error('Ошибка при загрузке категорий:', err));
  };

  const loadProducts = (catId) => {
    // Получаем товары для выбранной категории и её потомков
    const descendantIds = getDescendantCategoryIds(catId);
    const query = descendantIds.join(',');
    fetch(`/api/products?category_ids=${query}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error('Ошибка при загрузке товаров:', err));
  };

  // Рекурсивная функция для получения ID выбранной категории и всех её потомков
  const getDescendantCategoryIds = (parentId) => {
    let ids = [parentId];
    const children = categories.filter(cat => cat.parent_id === parentId);
    children.forEach(child => {
      ids = ids.concat(getDescendantCategoryIds(child.id));
    });
    return ids;
  };

  const handleSelectCategory = (catId, catName) => {
    setSelectedCategoryId(catId);
    setSelectedCategoryName(catName);
  };

  const toggleExpand = (catId) => {
    setExpanded(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Модальное окно для добавления категории (подкатегории или верхнего уровня)
  const openAddCategoryModal = (parentId = null, parentName = '') => {
    setParentForNewCategory(parentId);
    setParentForNewCategoryName(parentName);
    setNewCatName('');
    setCatError('');
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setParentForNewCategory(null);
    setParentForNewCategoryName('');
    setNewCatName('');
    setCatError('');
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) {
      setCatError('Введите название категории');
      return;
    }
    const payload = {
      name: newCatName,
      parent_id: parentForNewCategory,
    };

    fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setCatError(data.message || 'Ошибка при добавлении категории');
        } else {
          loadCategories();
          closeModal();
        }
      })
      .catch(() => setCatError('Ошибка связи с сервером'));
  };

  // Редактирование названия категории
  const openEditCategoryModal = (catId, currentName) => {
    setEditingCategoryId(catId);
    setNewCategoryName(currentName);
    setShowEditCategoryModal(true);
  };

  const closeEditModal = () => {
    setShowEditCategoryModal(false);
    setEditingCategoryId(null);
    setNewCategoryName('');
  };

  const handleEditCategory = () => {
    if (!newCategoryName.trim()) {
      alert('Введите новое название категории');
      return;
    }
    fetch(`/api/categories/${editingCategoryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: newCategoryName })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          loadCategories();
          closeEditModal();
        } else {
          alert(data.message || 'Ошибка при обновлении категории');
        }
      })
      .catch(() => alert('Ошибка связи с сервером при обновлении категории'));
  };

  // Рекурсивное отображение дерева категорий
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
              <span
                className={`category-name ${selectedCategoryId === cat.id ? 'active-category' : ''}`}
                onClick={() => handleSelectCategory(cat.id, cat.name)}
              >
                {cat.name}
              </span>
              <button
                className="edit-btn"
                onClick={() => openEditCategoryModal(cat.id, cat.name)}
                title="Редактировать название"
              >
                <i className="fas fa-edit"></i>
              </button>
              <button
                className="plus-btn"
                onClick={() => openAddCategoryModal(cat.id, cat.name)}
                title="Добавить подкатегорию"
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
            {children.length > 0 && isExpanded && renderCategories(cat.id, level + 1)}
          </div>
        );
      });
  };

  return (
    <div className="admin-catalog">
      <div className="left-panel">
        <h2>Дерево категорий</h2>
        <div className="category-tree">{renderCategories()}</div>
        <button className="add-top-category-btn" onClick={() => openAddCategoryModal(null, '')}>
          <i className="fas fa-plus"></i> Добавить категорию верхнего уровня
        </button>
      </div>

      <div className="right-panel">
        <h2>Товары в категории</h2>
        {selectedCategoryId ? (
          <div>
            <p>
              Выбрана категория: <strong>{selectedCategoryName}</strong>
            </p>
            {products.length > 0 ? (
              <div className="product-grid">
                {products.map(prod => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            ) : (
              <p>В этой категории пока нет товаров.</p>
            )}
            <button className="add-product-btn" onClick={() => setShowProductModal(true)}>
              <i className="fas fa-plus"></i> Добавить товар
            </button>
          </div>
        ) : (
          <p>Выберите категорию слева, чтобы увидеть товары.</p>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-window">
            <h3>{parentForNewCategory ? 'Добавить подкатегорию' : 'Добавить категорию верхнего уровня'}</h3>
            {parentForNewCategoryName && (
              <p className="modal-info">Родительская категория: {parentForNewCategoryName}</p>
            )}
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Введите название категории"
            />
            {catError && <p className="error">{catError}</p>}
            <div className="modal-actions">
              <button className="ok-btn" onClick={handleAddCategory}>OK</button>
              <button className="cancel-btn" onClick={closeModal}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {showEditCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-window">
            <h3>Редактировать название категории</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Новое название"
            />
            <div className="modal-actions">
              <button className="ok-btn" onClick={handleEditCategory}>Сохранить</button>
              <button className="cancel-btn" onClick={closeEditModal}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {showProductModal && (
        <AddProductForm
          categoryId={selectedCategoryId}
          onClose={() => setShowProductModal(false)}
          onProductAdded={(newProduct) => setProducts(prev => [...prev, newProduct])}
        />
      )}
    </div>
  );
}

export default AdminCatalog;
