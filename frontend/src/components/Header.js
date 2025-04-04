// src/components/Header.js
import React, { useState } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import AccountSidebar from './AccountSidebar';
import './Header.css';

function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [accountSidebarOpen, setAccountSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSearch = () => setSearchOpen(prev => !prev);
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Переход на страницу каталога с передачей запроса через URL-параметр "q"
      navigate(`/catalog?q=${encodeURIComponent(searchTerm)}`);
      setSearchTerm('');
      setSearchOpen(false);
    }
  };

  const toggleAccountSidebar = () => setAccountSidebarOpen(prev => !prev);

  return (
    <>
      <header className="header">
        <div className="header-left">
         <Link to="/" className="logo">Название</Link>
        </div>
        <div className="header-center">
          <nav>
            <ul className="nav-list center-nav">
              <li>
                <NavLink to="/catalog" className="nav-link">Каталог</NavLink>
              </li>
              <li>
                <NavLink to="/about" className="nav-link">О бренде</NavLink>
              </li>
              <li>
                <NavLink to="/contacts" className="nav-link">Контакты</NavLink>
              </li>
            </ul>
          </nav>
        </div>
        <div className="header-right">
          <nav>
            <ul className="nav-list right-nav">
              <li>
                <NavLink to="/looks" className="nav-link">Луки</NavLink>
              </li>
              <li>
                <NavLink to="/favorites" className="nav-link">Избранное</NavLink>
              </li>
              <li>
                <NavLink to="/cart" className="nav-link">Корзина</NavLink>
              </li>
              <li className="search-container">
                <button type="button" className="search-button" onClick={toggleSearch}>
                  <i className="fas fa-search"></i>
                </button>
                <form
                  className={`search-form ${searchOpen ? 'open' : ''}`}
                  onSubmit={handleSearchSubmit}
                >
                  <input
                    type="text"
                    placeholder="Поиск..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </form>
              </li>
              <li>
                <button type="button" className="account-button" onClick={toggleAccountSidebar}>
                  <i className="fas fa-user"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      {accountSidebarOpen && <AccountSidebar onClose={toggleAccountSidebar} />}
    </>
  );
}

export default Header;
