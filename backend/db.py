from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.mysql import ENUM, DECIMAL
from sqlalchemy.sql import func
from flask_login import UserMixin

db = SQLAlchemy()

# Модель таблицы "users"
class User(UserMixin, db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))
    role = db.Column(ENUM('admin', 'user'), nullable=False, default='user')
    registration_date = db.Column(db.DateTime, server_default=func.current_timestamp())
    two_factor_enabled = db.Column(db.Boolean, default=False)
    two_factor_secret = db.Column(db.String(255))
    fcm_token = db.Column(db.String(255))

    
    addresses = db.relationship('Address', backref='user', cascade='all, delete-orphan')
    cart_fav_entries = db.relationship('ProductInCartOrFavorite', backref='user', cascade='all, delete-orphan')
    looks = db.relationship('Look', backref='user', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "registration_date": self.registration_date.isoformat() if self.registration_date else None,
            "two_factor_enabled": self.two_factor_enabled
        }

# Модель таблицы "addresses"
class Address(db.Model):
    __tablename__ = 'addresses'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    country = db.Column(db.String(100))
    city = db.Column(db.String(100))
    street = db.Column(db.String(255))
    postal_code = db.Column(db.String(20))

# Модель таблицы "categories"
class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(255), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='SET NULL', onupdate='CASCADE'), nullable=True)
    
    parent = db.relationship('Category', remote_side=[id], backref=db.backref('subcategories', cascade='all, delete-orphan'))
    products = db.relationship('Product', backref='category', cascade='all, delete-orphan')

# Модель таблицы "products"
class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id', ondelete='RESTRICT', onupdate='CASCADE'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(DECIMAL(10,2), nullable=False)
    images = db.relationship('Image', backref='product', cascade='all, delete-orphan')
    sizes = db.relationship('Size', backref='product', cascade='all, delete-orphan')
    # Удаляем старую связь с избранным
    
# Модель таблицы "images"
class Image(db.Model):
    __tablename__ = 'images'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    url = db.Column(db.String(255), nullable=False)

# Новая модель для товаров в корзине или избранном
class ProductInCartOrFavorite(db.Model):
    __tablename__ = 'product_in_cart_or_favorite'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    size_id = db.Column(db.Integer, db.ForeignKey('sizes.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=True)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    flag = db.Column(db.String(20), nullable=False)  # 'cart' или 'favorite'

    # Связи
    size = db.relationship('Size', backref='cart_or_fav_entries')
    product = db.relationship('Product', backref='cart_or_fav_entries')

# Модель таблицы "looks"
class Look(db.Model):
    __tablename__ = 'looks'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    products_in_looks = db.relationship('ProductInLook', backref='look', cascade='all, delete-orphan')

# Модель таблицы "products_in_looks"
class ProductInLook(db.Model):
    __tablename__ = 'products_in_looks'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    look_id = db.Column(db.Integer, db.ForeignKey('looks.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)

# Модель таблицы "sizes"
class Size(db.Model):
    __tablename__ = 'sizes'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
