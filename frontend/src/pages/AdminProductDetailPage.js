// src/pages/AdminProductDetailPage.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AdminProductDetailPage.css';

function AdminProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Редактируемые поля товара
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  // Состояния для изображений (массив объектов { id, url })
  const [images, setImages] = useState([]);

  // Секция размеров
  const [sizes, setSizes] = useState([]);
  const [editingSizeId, setEditingSizeId] = useState(null);
  const [newSizeQuantity, setNewSizeQuantity] = useState('');
  const [showAddSizeModal, setShowAddSizeModal] = useState(false);
  const [newSizeName, setNewSizeName] = useState('');
  const [newSizeQuantityForAdd, setNewSizeQuantityForAdd] = useState('');
  const [sizeError, setSizeError] = useState('');

  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/products/${productId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setProduct(data);
          setName(data.name || '');
          setPrice(data.price || '');
          setDescription(data.description || '');
          setImages(data.images || []);
          setSizes(data.sizes ? data.sizes.sort((a, b) => a.name.localeCompare(b.name)) : []);
          setLoading(false);
        } else {
          setProduct(null);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Ошибка при загрузке товара:', err);
        setLoading(false);
      });
  }, [productId]);

  const handleGoBack = () => {
    navigate('/admin');
  };

  // Слайдер изображений
  const handlePrevImage = () => {
    if (!images || images.length === 0) return;
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    if (!images || images.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  // Функция удаления изображения
  const handleDeleteImage = (imageId) => {
    fetch(`/api/images/${imageId}`, {
      method: 'DELETE',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setImages(prev => prev.filter(img => img.id !== imageId));
          setCurrentImageIndex(0);
        } else {
          alert(data.message || 'Ошибка при удалении изображения');
        }
      })
      .catch(() => alert('Ошибка связи с сервером при удалении изображения'));
  };
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Пожалуйста, выберите изображение.');
        return;
      }
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await fetch('/api/upload_image', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        const result = await res.json();
        if (result.success) {
          // После загрузки файла вызываем новый эндпоинт для добавления записи в БД
          const addRes = await fetch(`/api/products/${productId}/images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ filename: result.filename })
          });
          const addResult = await addRes.json();
          if (addResult.success) {
            setImages(prev => [...prev, { id: addResult.id, url: result.filename }]);
          } else {
            setError(addResult.message);
          }
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Ошибка связи с сервером при загрузке изображения');
      }
    }
  };
  // Изменение полей товара
  const handleSaveChanges = () => {
    if (!name.trim() || !price.trim()) {
      setError('Название и цена обязательны');
      return;
    }
    const payload = { name, price, description };
    fetch(`/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          setError(data.message || 'Ошибка при сохранении товара');
        } else {
          alert('Изменения сохранены');
          setError('');
        }
      })
      .catch(() => setError('Ошибка связи с сервером'));
  };

  // Редактирование количества для размера
  const handleEditSize = (sizeId, currentQuantity) => {
    setEditingSizeId(sizeId);
    setNewSizeQuantity(currentQuantity);
  };

  const handleSaveSize = (sizeId) => {
    fetch(`/api/sizes/${sizeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ quantity: parseInt(newSizeQuantity, 10) }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSizes(prev => prev.map(s => s.id === sizeId ? { ...s, quantity: parseInt(newSizeQuantity, 10) } : s));
          setEditingSizeId(null);
        } else {
          alert(data.message || 'Ошибка при обновлении размера');
        }
      })
      .catch(() => alert('Ошибка связи с сервером при обновлении размера'));
  };

  // Добавление нового размера (через выпадающий список)
  const handleOpenAddSizeModal = () => {
    setShowAddSizeModal(true);
    setNewSizeName('');
    setNewSizeQuantityForAdd('');
    setSizeError('');
  };

  const handleAddSize = () => {
    if (!newSizeName || newSizeQuantityForAdd === '') {
      setSizeError('Выберите размер и введите количество');
      return;
    }
    const payload = {
      name: newSizeName,
      quantity: parseInt(newSizeQuantityForAdd, 10)
    };
    fetch(`/api/products/${productId}/sizes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSizes(prev => [...prev, { id: data.id, name: data.name, quantity: data.quantity }]);
          setShowAddSizeModal(false);
        } else {
          setSizeError(data.message || 'Ошибка при добавлении размера');
        }
      })
      .catch(() => setSizeError('Ошибка связи с сервером при добавлении размера'));
  };

  if (loading) {
    return <p className="loading">Загрузка...</p>;
  }
  if (!product) {
    return (
      <div className="detail-page">
        <p>Товар не найден</p>
        <button onClick={handleGoBack}>Назад</button>
      </div>
    );
  }

  let currentImageUrl = '/placeholder.jpg';
  if (images && images.length > 0) {
    currentImageUrl = '/images/' + images[currentImageIndex].url;
  }

  return (
    <div className="detail-page">
      <button className="back-btn" onClick={handleGoBack}>Назад</button>
      <div className="product-detail-container">
        <div className="image-carousel">
          <div className="image-frame">
            <img src={currentImageUrl} alt={product.name} />
          </div>
          <div className="carousel-controls">
            <button onClick={handlePrevImage} className="arrow-btn">«</button>
            <button onClick={handleNextImage} className="arrow-btn">»</button>
          </div>
          <div className="image-thumbnails">
            {images.map((img, index) => (
              <div
                key={index}
                className={`thumbnail ${index === currentImageIndex ? 'active-thumbnail' : ''}`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <img src={'/images/' + img.url} alt={`thumb ${index}`} />
              </div>
            ))}
            <div className="thumbnail add-thumbnail" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
              <i className="fas fa-plus"></i>
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
          {/* Кнопка удаления изображения расположенная ниже слайдера */}
          {images.length > 0 && (
            <div className="delete-image-container">
              <button className="delete-img-btn" onClick={(e) => { e.stopPropagation(); handleDeleteImage(images[currentImageIndex].id); }}>
                Удалить
              </button>
            </div>
          )}
        </div>

        <div className="product-edit-form">
          <div className="field">
            <label>Название:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-field"
            />
          </div>
          <div className="field">
            <label>Цена (руб.):</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="text-field"
            />
          </div>
          <div className="field">
            <label>Описание:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-field"
            ></textarea>
          </div>

          <div className="sizes-section">
            <h3>Размеры</h3>
            <div className="sizes-row">
              {sizes.sort((a, b) => a.name.localeCompare(b.name)).map(size => (
                <div key={size.id} className="size-box">
                  <span
                    className="size-name"
                    onClick={() => handleEditSize(size.id, size.quantity)}
                  >
                    {size.name}
                  </span>
                  <span className="size-quantity">{size.quantity}</span>
                  {editingSizeId === size.id && (
                    <div className="size-edit">
                      <input
                        type="number"
                        value={newSizeQuantity}
                        onChange={(e) => setNewSizeQuantity(e.target.value)}
                      />
                      <button onClick={() => handleSaveSize(size.id)} className="save-size-btn">
                        Сохранить
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <div className="size-box add-size-box" onClick={handleOpenAddSizeModal}>
                <i className="fas fa-plus"></i>
              </div>
            </div>
          </div>

          {error && <p className="error">{error}</p>}
          <button className="save-btn" onClick={handleSaveChanges}>
            Сохранить изменения
          </button>
        </div>
      </div>

      {showAddSizeModal && (
        <div className="modal-overlay">
          <div className="modal-window">
            <h3>Добавить новый размер</h3>
            <select
              value={newSizeName}
              onChange={(e) => setNewSizeName(e.target.value)}
            >
              <option value="">Выберите размер</option>
              <option value="XXS">XXS</option>
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
              <option value="XXXL">XXXL</option>
            </select>
            <input
              type="number"
              placeholder="Количество"
              value={newSizeQuantityForAdd}
              onChange={(e) => setNewSizeQuantityForAdd(e.target.value)}
            />
            {sizeError && <p className="error">{sizeError}</p>}
            <div className="modal-actions">
              <button className="ok-btn" onClick={handleAddSize}>OK</button>
              <button className="cancel-btn" onClick={() => setShowAddSizeModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminProductDetailPage;
