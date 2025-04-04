// src/components/ProductCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductCard.css';

function ProductCard({ product }) {
  const navigate = useNavigate();

  const handleOpenDetail = () => {
    navigate(`/admin/product/${product.id}`);
  };

  const mainImageUrl =
    product.images && product.images.length > 0
      ? '/images/' + product.images[0].url
      : '/placeholder.jpg';

  return (
    <div className="product-card" onClick={handleOpenDetail}>
      <div className="image-container">
        <img
          src={mainImageUrl}
          alt={product.name}
          className="product-image"
        />
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">{product.price} руб.</p>
      </div>
    </div>
  );
}

export default ProductCard;
