// src/components/ProductDetailModal.js
import React from 'react';
import './ProductDetailModal.css';

function ProductDetailModal({ product, quantity, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="product-detail-modal">
        <button className="close-detail-btn" onClick={onClose}>&times;</button>
        <h2>{product.name}</h2>
        <div className="product-images">
          {product.photos && product.photos.length > 0 ? (
            product.photos.map((photo, index) => (
              <img key={index} src={photo} alt={`${product.name} ${index + 1}`} />
            ))
          ) : (
            <img src={'/images/' + product.image_url} alt={product.name} />
          )}
        </div>
        <p className="product-description">{product.description}</p>
        <p className="product-price">Цена: {product.price} руб.</p>
        <div className="detail-quantity">
          <span>Количество: {quantity}</span>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailModal;
