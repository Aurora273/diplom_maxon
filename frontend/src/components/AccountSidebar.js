// src/components/AccountSidebar.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from './AuthForm';
import ProfileForm from './ProfileForm';
import AddressList from './AddressList';
import AddressModal from './AddressModal';
import TwoFactorSection from './TwoFactorSection';
import './AccountSidebar.css';

export default function AccountSidebar({ onClose, onUserUpdate }) {
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  
  // 2FA состояния
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FAConfirmModal, setShow2FAConfirmModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  
  // Адреса
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({ country: 'РФ', city: '', street: '', postal_code: '' });
  
  const navigate = useNavigate();
  
  // Загрузка данных пользователя и адресов
  useEffect(() => {
    fetch('/api/user', { credentials: 'include' })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Unauthorized');
      })
      .then(data => {
        if (data.success) {
          setUser(data.user);
          setTwoFactorEnabled(data.user.two_factor_enabled);
          setAddresses(data.addresses || []);
        } else {
          setShowAuthForm(true);
        }
      })
      .catch(err => setShowAuthForm(true));
  }, []);
  
  // Функция сохранения профиля (вызывается из ProfileForm)
  const handleSaveUserData = async (updatedUser) => {
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updatedUser)
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        if (onUserUpdate) onUserUpdate(data.user);
        setError('');
      } else {
        setError(data.message || 'Ошибка при обновлении профиля');
      }
    } catch (err) {
      console.error(err);
      setError('Ошибка связи с сервером при обновлении профиля');
    }
  };
  
  // Обработчик выхода
  const handleLogout = () => {
    fetch('/logout', {
      method: 'POST',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(null);
          setAddresses([]);
          setShowAuthForm(true);
          setTwoFactorEnabled(false);
          setQrCodeData('');
        } else {
          setError('Ошибка выхода');
        }
      })
      .catch(err => setError('Ошибка связи с сервером при выходе'));
  };
  
  const goToAdminPanel = () => {
    onClose();
    navigate('/admin');
  };
  
  // Обработчик подтверждения OTP при входе
  const handleConfirmOTP = () => {
    fetch('/api/verify_otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code: otpCode })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
          setTwoFactorEnabled(data.user.two_factor_enabled);
          setShowAuthForm(false);
          setShow2FAConfirmModal(false);
          if (onUserUpdate) onUserUpdate(data.user);
        } else {
          setError(data.message || 'Неверный код');
        }
      })
      .catch(err => setError('Ошибка связи с сервером при подтверждении 2FA'));
  };
  
  const toggleAuthMode = () => {
    setError('');
    setIsLogin(!isLogin);
  };
  
  // Обработчик 2FA: включение/отключение
  const handleTwoFactorSwitch = async () => {
    const newValue = !twoFactorEnabled;
    try {
      if (newValue) {
        const res = await fetch('/api/two_factor/enable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
          setQrCodeData(data.qr_code);
          setTwoFactorEnabled(true);
          setShow2FAModal(true);
        } else {
          setError(data.message || 'Ошибка при включении 2FA');
        }
      } else {
        const res = await fetch('/api/two_factor/disable', {
          method: 'POST',
          credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
          setTwoFactorEnabled(false);
          setQrCodeData('');
        } else {
          setError(data.message || 'Ошибка при отключении 2FA');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Ошибка связи с сервером при обновлении 2FA');
    }
  };
  
  // Адреса: открытие модального окна для добавления/редактирования адреса
  const openAddressModal = (addr = null) => {
    if (addr) {
      setEditingAddress(addr);
      setAddressForm({
        country: addr.country || 'РФ',
        city: addr.city || '',
        street: addr.street || '',
        postal_code: addr.postal_code || ''
      });
    } else {
      setEditingAddress(null);
      setAddressForm({ country: 'РФ', city: '', street: '', postal_code: '' });
    }
    setShowAddressModal(true);
  };
  
  const handleSaveAddress = async () => {
    try {
      if (!editingAddress) {
        const res = await fetch('/api/user/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(addressForm)
        });
        const data = await res.json();
        if (data.success) {
          setAddresses([...addresses, { id: data.id, ...addressForm }]);
        } else {
          setError(data.message || 'Ошибка при добавлении адреса');
        }
      } else {
        const res = await fetch(`/api/user/addresses/${editingAddress.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(addressForm)
        });
        const data = await res.json();
        if (data.success) {
          const updated = addresses.map(a => (a.id === editingAddress.id ? { ...a, ...addressForm } : a));
          setAddresses(updated);
        } else {
          setError(data.message || 'Ошибка при редактировании адреса');
        }
      }
      setShowAddressModal(false);
    } catch (err) {
      console.error(err);
      setError('Ошибка связи с сервером при сохранении адреса');
    }
  };
  
  const handleDeleteAddress = async (addressId) => {
    try {
      const res = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setAddresses(addresses.filter(a => a.id !== addressId));
      } else {
        setError(data.message || 'Ошибка при удалении адреса');
      }
    } catch (err) {
      console.error(err);
      setError('Ошибка связи с сервером при удалении адреса');
    }
  };
  
  return (
    <div className="account-sidebar">
      <button className="close-btn" onClick={onClose}>&times;</button>
      {user ? (
        <div className="account-info">
          <h2>Ваш профиль</h2>
          {error && <p className="error">{error}</p>}
          <ProfileForm user={user} onSave={handleSaveUserData} />
          <AddressList
            addresses={addresses}
            onEdit={openAddressModal}
            onDelete={handleDeleteAddress}
            onAdd={openAddressModal}
          />
          <TwoFactorSection
            twoFactorEnabled={twoFactorEnabled}
            onSwitch={handleTwoFactorSwitch}
            qrCodeData={qrCodeData}
            showQRModal={show2FAModal}
            closeQRModal={() => setShow2FAModal(false)}
          />
          {user.role === 'admin' && (
            <button className="admin-panel-btn" onClick={goToAdminPanel}>
              Админ панель
            </button>
          )}
          <button className="logout-button" onClick={handleLogout}>Выйти</button>
        </div>
      ) : (
        <AuthForm
          onAuthSuccess={(data) => {
            if (data.two_factor_required) {
              setShow2FAConfirmModal(true);
            } else if (data.user) {
              setUser(data.user);
              setTwoFactorEnabled(data.user.two_factor_enabled);
              setShowAuthForm(false);
              if (onUserUpdate) onUserUpdate(data.user);
            }
          }}
          toggleAuthMode={toggleAuthMode}
          isLogin={isLogin}
          setError={setError}
        />
      )}
      
      {/* Модалка для подтверждения OTP при входе */}
      {show2FAConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-window">
            <h3>Введите код из Google Authenticator</h3>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="6-значный код"
              className="otp-input"
            />
            <button className="submit-button" onClick={handleConfirmOTP}>Подтвердить</button>
          </div>
        </div>
      )}
      
      {/* Модалка для добавления/редактирования адреса */}
      <AddressModal
        show={showAddressModal}
        addressForm={addressForm}
        onChange={setAddressForm}
        onSave={handleSaveAddress}
        onCancel={() => setShowAddressModal(false)}
      />
    </div>
  );
}
