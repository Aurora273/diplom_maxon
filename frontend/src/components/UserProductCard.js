// src/components/UserProductCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProductCard.css';

function UserProductCard({ product, onToggleFavorite = () => {} }) {
  const navigate = useNavigate();

  const handleOpenDetail = () => {
    navigate(`/product/${product.id}`);
  };

  // Используем первое изображение из массива images
  const mainImageUrl =
    product.images && product.images.length > 0
      ? '/images/' + product.images[0].url
      : '/placeholder.jpg';

  return (
    <div className="user-product-card" onClick={handleOpenDetail}>
      <div className="card-image-container">
        <img src={mainImageUrl} alt={product.name} className="card-image" />
      </div>
      <div className="card-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">{product.price} руб.</p>
      </div>
      <button
        className="favorite-btn"
        onClick={(e) => {
          e.stopPropagation();
          console.log('Favorite button clicked, product id:', product.id);
          onToggleFavorite(product.id);
        }}
        title="В избранное"
      >
        <i className={`fas fa-heart ${product.isFavorite ? 'favorite' : ''}`}></i>
      </button>

    </div>
  );
}

export default UserProductCard;
