import React from 'react';
import { Link } from 'react-router-dom';
import './LookCard.css';

function LookCard({ look, onEdit, onDelete, onAddToCart }) {
  // Функция для добавления всех товаров лука в корзину с size = null и quantity = 1
  const handleAddToCart = () => {
    if (look.products && look.products.length > 0) {
      const cartItems = look.products.map(product => ({
        product,
        size: null,       // Размер не выбран
        quantity: 1       // Количество по умолчанию 1
      }));
      onAddToCart(cartItems);
    }
  };

  return (
    <div className="look-card">
      <div className="look-header">
        <h3 className="look-name">{look.name}</h3>
        <div className="look-actions">
          <button className="edit-look-btn" onClick={onEdit}>
            <i className="fas fa-edit"></i>
          </button>
          <button className="delete-look-btn" onClick={onDelete}>
            <i className="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
      <div className="look-images">
        {look.products && look.products.length > 0 ? (
          look.products.map((product, index) => (
            <Link key={index} to={`/product/${product.id}`}>
              <img
                src={'/images/' + product.images[0].url}
                alt={product.name}
                className="look-image"
              />
            </Link>
          ))
        ) : (
          <p>Нет изображений</p>
        )}
      </div>
      {/* Кнопка добавления лука в корзину */}
      <button className="add-look-to-cart-btn" onClick={handleAddToCart}>
        <i className="fas fa-shopping-cart"></i>
      </button>
    </div>
  );
}

export default LookCard;
