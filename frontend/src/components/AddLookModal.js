import React, { useState, useEffect } from 'react';
import './AddLookModal.css';

function AddLookModal({ show, look, onSave, onCancel }) {
  const [lookName, setLookName] = useState(look ? look.name : '');
  // Храним выбранные товары как массив объектов
  const [selectedProducts, setSelectedProducts] = useState(
    look && look.products ? look.products : []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');

  // Функция для поиска товаров через API
  const searchProducts = (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    fetch(`/api/products/search?query=${encodeURIComponent(query)}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        console.log(data);
        setSearchResults(data); // data – массив до 5 товаров
      })
      .catch(err => {
        console.error('Ошибка поиска товаров:', err);
      });
  };

  // Обработчик ввода в строку поиска
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchProducts(query);
  };

  // Добавление товара из результатов поиска
  const handleSelectProduct = (product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  // Функция удаления товара из выбранных
  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(product => product.id !== productId));
  };

  // При нажатии на кнопку "Сохранить" отправляем данные на сервер
  const handleSave = () => {
    if (!lookName.trim()) {
      setError("Введите название лука");
      return;
    }
    if (selectedProducts.length === 0) {
      setError("Выберите хотя бы один товар");
      return;
    }
    const payload = {
      name: lookName,
      product_ids: selectedProducts.map(product => product.id)
    };
    let method = 'POST';
    let url = '/api/looks';
    if (look) {
      method = 'PUT';
      url = `/api/looks/${look.id}`;
    }
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          onSave();
        } else {
          setError(data.message || 'Ошибка сохранения');
        }
      })
      .catch(err => {
        console.error(err);
        setError('Ошибка связи с сервером');
      });
  };

  // Если редактирование, установить lookName и выбранные товары.
  // Если look.products не переданы, но есть look.product_ids – загрузить данные по каждому ID.
  useEffect(() => {
    if (look) {
      setLookName(look.name);
      if (look.products) {
        setSelectedProducts(look.products);
      } else if (look.product_ids) {
        Promise.all(
          look.product_ids.map(id =>
            fetch(`/api/products/${id}`, { credentials: 'include' })
              .then(res => res.json())
          )
        )
          .then(results => {
            // Предполагаем, что endpoint /api/products/<id> возвращает объект товара в формате product_to_dict
            setSelectedProducts(results);
          })
          .catch(err => console.error(err));
      } else {
        setSelectedProducts([]);
      }
    }
  }, [look]);

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-window">
        <h3>{look ? 'Редактирование лука' : 'Добавление лука'}</h3>
        {error && <p className="error">{error}</p>}
        <div className="form-group">
          <label>Название лука</label>
          <input
            type="text"
            value={lookName}
            onChange={(e) => setLookName(e.target.value)}
          />
        </div>
        <div className="products-search">
          <label>Поиск товара для лука</label>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Введите название товара..."
          />
          {searchResults.length > 0 && (
            <ul className="search-results">
              {searchResults.map(product => (
                <li key={product.id} onClick={() => handleSelectProduct(product)}>
                  <img
                    src={'/images/' + (product.images && product.images.length > 0 ? product.images[0].url : 'placeholder.jpg')}
                    alt={product.name}
                    className="product-thumb"
                  />
                  <span>{product.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Отображение выбранных товаров с возможностью удаления */}
        <div className="selected-products">
          {selectedProducts.map(product => (
            <div key={product.id} className="selected-product">
              <img
                src={'/images/' + (product.images && product.images.length > 0 ? product.images[0].url : 'placeholder.jpg')}
                alt={product.name}
                className="selected-thumb"
              />
              <button className="remove-product-btn" onClick={() => handleRemoveProduct(product.id)}>×</button>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="submit-button" onClick={handleSave}>Сохранить</button>
          <button className="submit-button" onClick={onCancel}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

export default AddLookModal;
