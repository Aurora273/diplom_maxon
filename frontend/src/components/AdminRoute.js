// src/components/AdminRoute.js
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Запрашиваем данные о текущем пользователе с сервера
    fetch('/api/user', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user && data.user.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Ошибка получения данных пользователя:', err);
        setLoading(false);
        setIsAdmin(false);
      });
  }, []);

  if (loading) return <div>Загрузка...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

export default AdminRoute;
