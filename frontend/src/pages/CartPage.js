import React, { useState, useEffect } from 'react';
import CartItemCard from '../components/CartItemCard';
import './CartPage.css';

function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Для отслеживания, какие товары выбраны для оформления (по cart_id)
  const [selectedItems, setSelectedItems] = useState({});
  
  // Состояния для модальных окон оформления заказа и подтверждения
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const handleSizeChange = (cart_id, newSizeId) => {
    fetch(`/api/cart/${cart_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        size_id: newSizeId,
        quantity: 1
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          loadCartItems();
        } else {
          console.error('Ошибка обновления размера:', data.message);
        }
      })
      .catch(err => console.error('Ошибка при обновлении размера:', err));
  };

  const loadCartItems = () => {
    fetch('/api/cart_items', { credentials: 'include' })
      .then(res => {
        if (res.status === 401) {
          setError("Вы не авторизованы. Пожалуйста, войдите.");
          setLoading(false);
          return;
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          setCartItems(data);
          // По умолчанию отмечаем все товары
          const selected = {};
          data.forEach(item => selected[item.cart_id] = true);
          setSelectedItems(selected);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Ошибка загрузки корзины:', err);
        setError('Ошибка загрузки корзины');
        setLoading(false);
      });
  };

  const loadAddresses = () => {
    fetch('/api/user', { credentials: 'include' })
      .then(res => {
        if (res.status === 401) return;
        return res.json();
      })
      .then(data => {
        if (data && data.success) {
          setAddresses(data.addresses || []);
          if (data.addresses && data.addresses.length > 0) {
            setSelectedAddress(data.addresses[0].id);
          }
        }
      })
      .catch(err => console.error('Ошибка загрузки адресов:', err));
  };

  useEffect(() => {
    loadCartItems();
    loadAddresses();
  }, []);

  const handleIncrease = async (cartId, currentQuantity, available) => {
    if (currentQuantity >= available) return;
    try {
      const res = await fetch(`/api/cart/${cartId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity: currentQuantity + 1 })
      });
      const data = await res.json();
      if (data.success) {
        loadCartItems();
      } else {
        alert(data.message || 'Ошибка при обновлении количества');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка связи с сервером');
    }
  };

  const handleDecrease = async (cartId, currentQuantity) => {
    if (currentQuantity <= 1) {
      try {
        const res = await fetch(`/api/cart/${cartId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
          loadCartItems();
        } else {
          alert(data.message || 'Ошибка при удалении товара из корзины');
        }
      } catch (err) {
        console.error(err);
        alert('Ошибка связи с сервером');
      }
      return;
    }
    try {
      const res = await fetch(`/api/cart/${cartId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quantity: currentQuantity - 1 })
      });
      const data = await res.json();
      if (data.success) {
        loadCartItems();
      } else {
        alert(data.message || 'Ошибка при обновлении количества');
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка связи с сервером');
    }
  };

  const handleSelectItem = (cart_id) => {
    setSelectedItems(prev => ({ ...prev, [cart_id]: !prev[cart_id] }));
  };

  const handleCheckout = async () => {
    const itemsToCheckout = cartItems.filter(item => selectedItems[item.cart_id]);
    if (!selectedAddress) {
      alert("Пожалуйста, выберите адрес доставки");
      return;
    }
    // Проверяем, что для каждого товара выбран размер
    for (const item of itemsToCheckout) {
      if (!item.size_id) {
        alert(`У товара "${item.product_name}" не выбран размер`);
        return;
      }
    }
    try {
      // Для каждого товара оформляем удаление (симулируем оформление заказа)
      await Promise.all(
        itemsToCheckout.map(async (item) => {
          const res = await fetch(`/api/cart/${item.cart_id}`, {
            method: 'DELETE',
            credentials: 'include'
          });
          const data = await res.json();
          if (!data.success) {
            throw new Error(data.message || 'Ошибка удаления товара из корзины');
          }
        })
      );
      await loadCartItems();
      setShowCheckoutModal(false);
      setShowConfirmationModal(true);
    } catch (err) {
      console.error(err);
      alert("Ошибка оформления заказа: " + err.message);
    }
  };

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Моя корзина</h1>
        <div className="address-select">
          <label htmlFor="delivery-address">Доставка:</label>
          <select
            id="delivery-address"
            value={selectedAddress || ''}
            onChange={(e) => setSelectedAddress(e.target.value)}
          >
            {addresses.map(addr => (
              <option key={addr.id} value={addr.id}>
                {addr.country}, {addr.city}, {addr.street}, {addr.postal_code}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error ? (
        <p className="error">{error}</p>
      ) : cartItems.length === 0 ? (
        <p className="empty-cart">В корзине пока нет товаров</p>
      ) : (
        <div className="cart-items">
          {cartItems.map(item => (
            <div key={item.cart_id} className="cart-item-wrapper">
              <input
                type="checkbox"
                checked={selectedItems[item.cart_id] || false}
                onChange={() => handleSelectItem(item.cart_id)}
              />
              <CartItemCard 
                item={item}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
                onSizeChange={handleSizeChange}
              />
            </div>
          ))}
        </div>
      )}
      {cartItems.length > 0 && (
        <button className="checkout-btn" onClick={() => setShowCheckoutModal(true)}>
          Оформление заказа
        </button>
      )}

      {showCheckoutModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Оформление заказа</h2>
            <div className="modal-address">
              <label htmlFor="modal-delivery-address">Доставка:</label>
              <select
                id="modal-delivery-address"
                value={selectedAddress || ''}
                onChange={(e) => setSelectedAddress(e.target.value)}
              >
                {addresses.map(addr => (
                  <option key={addr.id} value={addr.id}>
                    {addr.country}, {addr.city}, {addr.street}, {addr.postal_code}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-cart-items">
              {cartItems.filter(item => selectedItems[item.cart_id]).map(item => (
                <CartItemCard 
                  key={item.cart_id}
                  item={item}
                  onIncrease={handleIncrease}
                  onDecrease={handleDecrease}
                  onSizeChange={handleSizeChange}
                />
              ))}
            </div>
            <div className="modal-actions">
              <button className="pay-btn" onClick={handleCheckout}>
                Оплатить
              </button>
              <button className="cancel-btn" onClick={() => setShowCheckoutModal(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmationModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Заказ оформлен</h2>
            <p>Товары будут отправлены после подтверждения оплаты</p>
            <button className="ok-btn" onClick={() => setShowConfirmationModal(false)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
