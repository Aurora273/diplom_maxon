// src/components/AddressList.js
import React from 'react';
import './Address.css';

function AddressList({ addresses, onEdit, onDelete, onAdd }) {
  return (
    <div className="addresses-section">
      <h3>Мои адреса</h3>
      <button onClick={() => onAdd(null)}>Добавить адрес</button>
      {addresses.map(addr => (
        <div key={addr.id} className="address-item">
          <p>{addr.country}, {addr.city}, {addr.street}, {addr.postal_code}</p>
          <div>
            <button onClick={() => onEdit(addr)}>Редактировать</button>
            <button onClick={() => onDelete(addr.id)}>Удалить</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AddressList;
