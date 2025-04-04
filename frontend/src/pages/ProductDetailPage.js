// src/pages/ProductDetailPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetailPage.css';

function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [error, setError] = useState('');
  
  // Для работы с корзиной
  const [cartEntryId, setCartEntryId] = useState(null);
  const [cartQuantity, setCartQuantity] = useState(0);
  
  // Загружаем детали товара
  useEffect(() => {
    fetch(`/api/products/${productId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setProduct(data);
          setLoading(false);
        } else {
          setProduct(null);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Ошибка при загрузке товара:', err);
        setError('Ошибка загрузки товара');
        setLoading(false);
      });
  }, [productId]);
  
  // Функция для загрузки записи корзины по выбранному размеру
  const loadCartEntry = useCallback(() => {
    if (!selectedSize) {
      setCartEntryId(null);
      setCartQuantity(0);
      return;
    }
    fetch(`/api/cart?product_id=${productId}&size=${selectedSize}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          setCartEntryId(data.id);
          setCartQuantity(data.quantity);
        } else {
          setCartEntryId(null);
          setCartQuantity(0);
        }
      })
      .catch(err => console.error('Ошибка загрузки корзины:', err));
  }, [productId, selectedSize]);
  
  useEffect(() => {
    loadCartEntry();
  }, [selectedSize, loadCartEntry]);
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  const handlePrevImage = () => {
    if (!product || !product.images || product.images.length === 0) return;
    setCurrentImageIndex(prev => (prev === 0 ? product.images.length - 1 : prev - 1));
  };
  
  const handleNextImage = () => {
    if (!product || !product.images || product.images.length === 0) return;
    setCurrentImageIndex(prev => (prev + 1) % product.images.length);
  };
  // Добавление товара в корзину (если запись не существует)
  const handleAddToCart = async () => {
    if (!selectedSize) {
      alert('Выберите размер');
      return;
    }
    // Если уже есть запись в корзине, не вызываем POST
    if (cartEntryId) return;
    const sizeData = product.sizes.find(s => s.id === parseInt(selectedSize, 10));
    if (!sizeData || sizeData.quantity < 1) {
      alert('Выбранный размер недоступен');
      return;
    }
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          product_id: product.id,
          size_id: parseInt(selectedSize, 10),
          quantity: 1
        })
      });
      const data = await res.json();
      if (data.success) {
        setCartEntryId(data.id);
        setCartQuantity(1);
      } else {
        alert(data.message || 'Ошибка при добавлении в корзину');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка связи с сервером при добавлении в корзину');
    }
  };
  
  const handleIncreaseCart = async () => {
    const sizeData = product.sizes.find(s => s.id === parseInt(selectedSize, 10));
    if (!sizeData) return;
    if (cartQuantity + 1 > sizeData.quantity) {
      alert('Недостаточно товара на складе');
      return;
    }
    try {
      const res = await fetch(`/api/cart/${cartEntryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity: cartQuantity + 1 })
      });
      const data = await res.json();
      if (data.success) {
        setCartQuantity(cartQuantity + 1);
      } else {
        alert(data.message || 'Ошибка при обновлении корзины');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка связи с сервером при обновлении корзины');
    }
  };
  
  const handleDecreaseCart = async () => {
    if (cartQuantity === 1) {
      // Если количество равно 1, удаляем запись из корзины
      try {
        const res = await fetch(`/api/cart/${cartEntryId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
          setCartEntryId(null);
          setCartQuantity(0);
        } else {
          alert(data.message || 'Ошибка при удалении записи из корзины');
        }
      } catch (err) {
        console.error(err);
        alert('Ошибка связи с сервером при удалении записи');
      }
      return;
    }
    // Если количество больше 1, обновляем запись
    try {
      const res = await fetch(`/api/cart/${cartEntryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity: cartQuantity - 1 })
      });
      const data = await res.json();
      if (data.success) {
        setCartQuantity(cartQuantity - 1);
      } else {
        alert(data.message || 'Ошибка при обновлении корзины');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка связи с сервером при обновлении корзины');
    }
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
  
  const currentImageUrl =
    product.images && product.images.length > 0
      ? '/images/' + product.images[currentImageIndex].url
      : '/placeholder.jpg';
  
  const availableSizes = product.sizes ? product.sizes.filter(s => s.quantity > 0) : [];
  // Если выбран размер, находим его данные:
  const selectedSizeData = selectedSize
    ? product.sizes.find(s => s.id === parseInt(selectedSize, 10))
    : null;
  const stockAvailable = selectedSizeData ? selectedSizeData.quantity : 0;
  
  return (
    <div className="detail-page">
      <button className="back-btn" onClick={handleGoBack}>Назад</button>
      <div className="detail-container">
        <div className="image-slider">
          <div className="image-frame">
            <img src={currentImageUrl} alt={product.name} />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="carousel-controls-user">
              <button className="arrow-btn" onClick={handlePrevImage}>«</button>
              <button className="arrow-btn" onClick={handleNextImage}>»</button>
            </div>
          )}
        </div>
        <div className="detail-info">
          <h1 className="detail-name">{product.name}</h1>
          <p className="detail-price">{product.price} руб.</p>
          <p className="detail-description">{product.description}</p>
          <div className="size-selector">
            <label htmlFor="size-select">Размер:</label>
            <select
              id="size-select"
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
            >
              <option value="">Выберите размер</option>
              {availableSizes.map(size => (
                <option key={size.id} value={size.id}>
                  {size.name} (Осталось: {size.quantity})
                </option>
              ))}
            </select>
          </div>
          {cartEntryId ? (
            <div className="cart-controls">
              <button className="decrease-btn" onClick={handleDecreaseCart}>
                <i className="fas fa-minus"></i>
              </button>
              <span className="cart-quantity">{cartQuantity}</span>
              <button
                className="increase-btn"
                onClick={handleIncreaseCart}
                disabled={cartQuantity >= stockAvailable}
                title={cartQuantity >= stockAvailable ? "Недостаточно товара" : ""}
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
          ) : (
            <button
              className="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={stockAvailable === 0}
              title={stockAvailable === 0 ? "Товара нет в наличии" : ""}
            >
              <i className="fas fa-shopping-cart"></i> Добавить в корзину
            </button>
          )}
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
