// src/pages/LooksPage.js
import React, { useState, useEffect } from 'react';
import LookCard from '../components/LookCard';
import AddLookModal from '../components/AddLookModal';
import './LooksPage.css';

function LooksPage() {
  const [looks, setLooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLook, setEditingLook] = useState(null);

  const loadLooks = () => {
    fetch('/api/looks', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const looks = data.looks;
          // Для каждого лука получаем его товары через отдельный запрос
          Promise.all(
            looks.map(look =>
              fetch(`/api/looks/${look.id}/products`, { credentials: 'include' })
                .then(res => res.json())
                .then(prodData => {
                  if (prodData.success) {
                    return { ...look, products: prodData.products };
                  } else {
                    console.error(`Ошибка загрузки товаров для лука ${look.id}:`, prodData.message);
                    return { ...look, products: [] };
                  }
                })
                .catch(error => {
                  console.error(`Ошибка загрузки товаров для лука ${look.id}:`, error);
                  return { ...look, products: [] };
                })
            )
          ).then(looksWithProducts => {
            setLooks(looksWithProducts);
            setLoading(false);
          });
        } else {
          setError(data.message || 'Ошибка загрузки луков');
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Ошибка загрузки луков:', err);
        setError('Ошибка загрузки луков');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadLooks();
  }, []);

  const handleAddLook = () => {
    setEditingLook(null);
    setShowModal(true);
  };

  const handleEditLook = (look) => {
    setEditingLook(look);
    setShowModal(true);
  };

  const handleDeleteLook = (lookId) => {
    if (window.confirm("Удалить лук?")) {
      fetch(`/api/looks/${lookId}`, { method: 'DELETE', credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            loadLooks();
          } else {
            alert(data.message || 'Ошибка удаления');
          }
        })
        .catch(err => {
          console.error(err);
          alert('Ошибка связи с сервером');
        });
    }
  };

  // Функция для добавления товаров лука в корзину
  const handleAddLookToCart = (cartItems) => {
    // Для каждого товара в луке отправляем запрос на добавление в корзину.
    // Предполагается, что на бекенде реализован POST /api/cart для добавления нового товара в корзину.
    Promise.all(
      cartItems.map(cartItem => {
        return fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            product_id: cartItem.product.id,
            quantity: cartItem.quantity, // обычно 1
            size_id: null              // Размер изначально не выбран
          })
        })
          .then(res => res.json());
      })
    )
      .then(results => {
        console.log("Товары из лука успешно добавлены в корзину", results);
        // Можно, например, вывести уведомление об успешном добавлении
      })
      .catch(err => {
        console.error("Ошибка добавления в корзину", err);
      });
  };

  const handleModalSave = () => {
    setShowModal(false);
    loadLooks();
  };

  const handleModalCancel = () => {
    setShowModal(false);
  };

  return (
    <div className="looks-page">
      <h1>Луки</h1>
      <button className="add-look-btn" onClick={handleAddLook}>
        <i className="fas fa-plus"></i> Добавить лук
      </button>
      {loading ? (
        <p>Загрузка...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : looks.length === 0 ? (
        <p className="empty-message">Луков пока нет</p>
      ) : (
        <div className="looks-list">
          {looks.map(look => (
            <LookCard
              key={look.id}
              look={look}
              onEdit={() => handleEditLook(look)}
              onDelete={() => handleDeleteLook(look.id)}
              onAddToCart={handleAddLookToCart}  // Передаём функцию добавления в корзину
            />
          ))}
        </div>
      )}
      {showModal && (
        <AddLookModal
          show={showModal}
          look={editingLook}
          onSave={handleModalSave}
          onCancel={handleModalCancel}
        />
      )}
    </div>
  );
}

export default LooksPage;
