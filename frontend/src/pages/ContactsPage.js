import React from 'react';
import './ContactsPage.css';

function ContactsPage() {
  return (
    <div className="contacts-page">
      <div className="contacts-header">
        <h1>Контакты</h1>
      </div>
      <div className="contacts-content">
        <p>
          Если у вас есть вопросы или предложения, свяжитесь с нами – мы всегда рады помочь!
        </p>
        <div className="contact-info">
          <div className="contact-item">
            <i className="fas fa-map-marker-alt"></i>
            <span>ул. Примерная, 123, Москва, Россия</span>
          </div>
          <div className="contact-item">
            <i className="fas fa-phone-alt"></i>
            <span>+7 (495) 123-45-67</span>
          </div>
          <div className="contact-item">
            <i className="fas fa-envelope"></i>
            <span>info@yourstore.ru</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactsPage;
