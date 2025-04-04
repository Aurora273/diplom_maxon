import React from 'react';
import './HomePage.css';

function HomePage() {
  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-overlay">
          <h1 className="hero-title">Добро пожаловать в наш магазин!</h1>
          <p className="hero-subtitle">
            Откройте для себя лучшие коллекции одежды, созданные с любовью и вниманием к деталям.
          </p>
          <a href="/catalog" className="hero-btn">Начать покупки</a>
        </div>
      </div>
      <div className="home-content">
        <h2>Наша миссия</h2>
        <p>
          Мы стремимся предложить нашим клиентам не только стильную одежду, но и комфорт, качество и индивидуальный подход.
        </p>
        <p>
          Наш магазин объединяет коллекции известных брендов и эксклюзивные модели от начинающих дизайнеров. Каждая вещь проходит строгий контроль качества.
        </p>
      </div>
    </div>
  );
}

export default HomePage;
