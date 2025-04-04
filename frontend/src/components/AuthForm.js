// src/components/AuthForm.js
import React, { useState } from 'react';
import './AuthForm.css';

function AuthForm({ onAuthSuccess, toggleAuthMode, isLogin, setError }) {
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/login' : '/register';
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.two_factor_required) {
            onAuthSuccess({ two_factor_required: true });
          } else if (data.user) {
            onAuthSuccess({ user: data.user });
          }
        } else {
          setError(data.message);
        }
      })
      .catch(err => setError('Ошибка связи с сервером'));
  };
  
  return (
    <div className="auth-container">
      <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        {!isLogin && (
          <div className="form-group">
            <label>Имя:</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>
        )}
        <div className="form-group">
          <label>Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Пароль:</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>
        <button type="submit" className="submit-button">
          {isLogin ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>
      <button onClick={toggleAuthMode} className="toggle-button">
        {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войти'}
      </button>
    </div>
  );
}

export default AuthForm;
