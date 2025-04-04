// src/components/AddressModal.js
import React from 'react';
import './AccountSidebar.css';

function AddressModal({ show, addressForm, onChange, onSave, onCancel }) {
  if (!show) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-window">
        <h3>{addressForm.id ? 'Редактирование адреса' : 'Добавление адреса'}</h3>
        <div className="form-group">
          <label>Страна</label>
          <input
            type="text"
            value={addressForm.country}
            onChange={(e) => onChange({ ...addressForm, country: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Город</label>
          <input
            type="text"
            value={addressForm.city}
            onChange={(e) => onChange({ ...addressForm, city: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Улица</label>
          <input
            type="text"
            value={addressForm.street}
            onChange={(e) => onChange({ ...addressForm, street: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Почтовый индекс</label>
          <input
            type="text"
            value={addressForm.postal_code}
            onChange={(e) => onChange({ ...addressForm, postal_code: e.target.value })}
          />
        </div>
        <button className="submit-button" onClick={onSave}>Сохранить</button>
        <button className="submit-button" onClick={onCancel}>Отмена</button>
      </div>
    </div>
  );
}

export default AddressModal;
