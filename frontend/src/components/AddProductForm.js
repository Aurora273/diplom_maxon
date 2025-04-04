// src/components/AddProductForm.js
import React, { useState, useRef } from 'react';
import './AddProductForm.css';

function AddProductForm({ categoryId, onClose, onProductAdded }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  // Массив объектов { file, preview } для отображения превью выбранных изображений
  const [images, setImages] = useState([]);
  // Массив имен успешно загруженных изображений, которые будут отправлены на сервер
  const [uploadedImages, setUploadedImages] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Открыть диалог выбора файла
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Обработка выбора файла
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Пожалуйста, выберите изображение.');
        return;
      }
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await fetch('/api/upload_image', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        const result = await res.json();
        if (result.success) {
          // После успешной загрузки файла просто сохраняем имя файла в uploadedImages
          setUploadedImages(prev => [...prev, result.filename]);
          // И сохраняем объект превью для отображения в форме
          setImages(prev => [...prev, { file, preview: URL.createObjectURL(file) }]);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError('Ошибка связи с сервером при загрузке изображения');
      }
    }
  };

  // Отправка формы создания товара
  const handleSubmit = async () => {
    if (!name.trim() || !description.trim() || !price.trim() || !categoryId) {
      setError('Заполните все обязательные поля');
      return;
    }
  
    const payload = {
      name,
      description,
      price,
      category_id: categoryId,
      images: uploadedImages, // Передаем массив имен файлов
    };
  
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Ошибка при добавлении товара');
      } else {
        onProductAdded(data);
        onClose();
      }
    } catch (err) {
      setError('Ошибка связи с сервером');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-window">
        <h3>Добавить товар</h3>
        <input
          type="text"
          placeholder="Название товара"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          placeholder="Описание товара"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>
        <input
          type="number"
          placeholder="Цена товара"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <div className="image-uploader">
          <div className="image-list">
            {images.map((img, index) => (
              <div key={index} className="image-card">
                <img src={img.preview} alt={`uploaded ${index}`} />
              </div>
            ))}
            <div className="image-card add-card" onClick={triggerFileInput}>
              <i className="fas fa-plus"></i>
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
        {error && <p className="error">{error}</p>}
        <div className="modal-actions">
          <button className="ok-btn" onClick={handleSubmit}>OK</button>
          <button className="cancel-btn" onClick={onClose}>Отмена</button>
        </div>
      </div>
    </div>
  );
}

export default AddProductForm;
