import React, { useEffect, useState } from 'react';
import './Auth.css';

function AccountPage() {
  const [user, setUser] = useState(null);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');

  // При загрузке компонента проверяем, авторизован ли пользователь
  useEffect(() => {
    fetch('/account', { credentials: 'include' })
      .then(res => {
        if (res.status === 200) {
          return res.json();
        }
        throw new Error('Unauthorized');
      })
      .then(data => {
        setUser(data);
      })
      .catch(err => {
        setShowAuthForm(true);
      });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/login' : '/register';
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // для передачи cookie сессии
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
          setShowAuthForm(false);
        } else {
          setError(data.message);
        }
      })
      .catch(err => {
        setError('Ошибка связи с сервером');
      });
  };

  const toggleAuthMode = () => {
    setError('');
    setIsLogin(!isLogin);
  };

  // Если пользователь не авторизован – показываем форму авторизации/регистрации
  if (!user && showAuthForm) {
    return (
      <div className="auth-container">
        <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label>Имя:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Пароль:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
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

  if (!user) {
    return <p>Загрузка...</p>;
  }

  // Если пользователь авторизован – показываем данные аккаунта
  return (
    <div className="account-page">
      <h2>Добро пожаловать, {user.name}</h2>
      <p>Email: {user.email}</p>
      {/* Можно добавить дополнительную информацию о пользователе */}
    </div>
  );
}

export default AccountPage;
