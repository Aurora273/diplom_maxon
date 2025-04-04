import React from 'react';
import { Link } from 'react-router-dom';
import './CartItemCard.css';

function CartItemCard({ item, onIncrease, onDecrease, onSizeChange = () => {} }) {
  const handleSizeChange = (e) => {
    const newSizeId = e.target.value;
    // Вызываем обработчик, который должен обновить размер для товара в корзине
    // и сбросить количество к 1 (запрос к БД)
    onSizeChange(item.cart_id, newSizeId);
  };

  return (
    <div className="cart-item-card">
      <button
        className="remove-btn"
        onClick={() => onDecrease(item.cart_id, item.quantity)}
      >
        &times;
      </button>
      <div className="cart-item-content">
        <div className="cart-item-image">
          {item.image_url ? (
            <Link to={`/product/${item.product_id}`}>
              <img src={'/images/' + item.image_url} alt={item.product_name} />
            </Link>
          ) : (
            <img src="/placeholder.jpg" alt="placeholder" />
          )}
        </div>
        <div className="cart-item-info">
          <h3 className="product-name">{item.product_name}</h3>
          <p className="product-price">{item.price} руб.</p>
          <p className="size-info">
            Размер:&nbsp;
            <select
              className="size-select"
              value={item.size_id || ''}
              onChange={handleSizeChange}
            >
              <option value="">Размер не выбран</option>
              {item.sizes &&
                item.sizes.map((size) => (
                  <option key={size.id} value={size.id}>
                    {size.name} (в наличии: {size.quantity})
                  </option>
                ))}
            </select>
          </p>
        </div>
        <div className="cart-item-quantity-controls">
          <button
            className="quantity-btn"
            onClick={() => onDecrease(item.cart_id, item.quantity)}
          >
            <i className="fas fa-minus"></i>
          </button>
          <span className="quantity-value">{item.quantity}</span>
          <button
            className="quantity-btn"
            onClick={() => onIncrease(item.cart_id, item.quantity, item.available)}
            disabled={item.quantity >= item.available}
            title={item.quantity >= item.available ? "Нет в наличии" : ""}
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartItemCard;
