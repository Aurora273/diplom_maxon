import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import '@fortawesome/fontawesome-free/css/all.min.css';
import CatalogPage from './pages/CatalogPage';
import AboutPage from './pages/AboutPage';
import ContactsPage from './pages/ContactsPage';
import FavoritesPage from './pages/FavoritesPage';
import CartPage from './pages/CartPage';
import AccountPage from './pages/AccountPage';
import AdminCatalog from './components/AdminCatalog';
import ProductDetailPage from './pages/ProductDetailPage';
import AdminProductDetailPage from './pages/AdminProductDetailPage'
import AdminRoute from './components/AdminRoute';
import LooksPage from './pages/LooksPage';
import HomePage from './pages/HomePage';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contacts" element={<ContactsPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/looks" element={<LooksPage />} />
        {/* Админские маршруты защищены */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminCatalog />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/product/:productId"
          element={
            <AdminRoute>
              <AdminProductDetailPage />
            </AdminRoute>
          }
        />
        <Route path="/product/:productId" element={<ProductDetailPage />} />
        {/* Можно добавить главную страницу "/" или перенаправить на "/catalog" */}
      </Routes>
    </Router>
  );
}

export default App;
