// src/components/TwoFactorSection.js
import React from 'react';
import './TwoFactor.css';

function TwoFactorSection({ twoFactorEnabled, onSwitch, qrCodeData, showQRModal, closeQRModal }) {
  return (
    <div className="twofa-toggle-container">
      <span className="twofa-label">Двухфакторная аутентификация</span>
      <label className="switch">
        <input type="checkbox" checked={twoFactorEnabled} onChange={onSwitch} />
        <span className="slider round"></span>
      </label>
      {showQRModal && (
        <div className="modal-overlay">
          <div className="modal-window">
            <h3>Сканируйте QR-код</h3>
            {qrCodeData ? (
              <img src={qrCodeData} alt="QR-код" className="qr-code" />
            ) : (
              <p>Загрузка QR-кода...</p>
            )}
            <button className="submit-button" onClick={closeQRModal}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TwoFactorSection;
