// src/components/ProfileForm.js
import React, { useState, useEffect } from 'react';
import './ProfileForm.css';

function ProfileForm({ user, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [localUser, setLocalUser] = useState({ ...user });

  useEffect(() => {
    setLocalUser({ ...user });
  }, [user]);

  const handleChange = (e) => {
    setLocalUser({ ...localUser, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onSave(localUser);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalUser({ ...user });
    setIsEditing(false);
  };

  return (
    <div className="profile-form">
      <div className="profile-header">
        <h3>Данные профиля</h3>
        <button className="edit-btn" onClick={() => setIsEditing(true)}>
          &#9998;
        </button>
      </div>
      {isEditing ? (
        <div className="profile-fields">
          <label>Имя</label>
          <input type="text" name="name" value={localUser.name || ''} onChange={handleChange} />
          <label>Фамилия</label>
          <input type="text" name="surname" value={localUser.surname || ''} onChange={handleChange} />
          <label>Email</label>
          <input type="email" name="email" value={localUser.email || ''} onChange={handleChange} />
          <label>Телефон</label>
          <input type="text" name="phone" value={localUser.phone || ''} onChange={handleChange} />
          {/* Поле пароля убрано */}
          <div className="profile-buttons">
            <button className="save-profile-btn" onClick={handleSave}>Сохранить</button>
            <button className="submit-button" onClick={handleCancel}>Отмена</button>
          </div>
        </div>
      ) : (
        <div className="profile-display">
          <p><strong>Имя:</strong> {localUser.name}</p>
          <p><strong>Фамилия:</strong> {localUser.surname}</p>
          <p><strong>Email:</strong> {localUser.email}</p>
          <p><strong>Телефон:</strong> {localUser.phone}</p>
        </div>
      )}
    </div>
  );
}

export default ProfileForm;
