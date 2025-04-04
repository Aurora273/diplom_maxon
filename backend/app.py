# app.py
from flask import Flask, request, session, jsonify
import pyotp, qrcode, io, base64
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from functools import wraps
import os
from db import db, User, Product, Category, Image, Size, ProductInCartOrFavorite, Address, Look, ProductInLook  # импорт необходимых моделей
import decimal
from werkzeug.utils import secure_filename
from flask import send_from_directory
from flask_login import current_user, login_required, LoginManager, login_user, logout_user


app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Замените на надёжное значение
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost/diplom_makson'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'images')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
CORS(app, supports_credentials=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

db.init_app(app)
with app.app_context():
    db.create_all()

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'  # или ваш маршрут авторизации

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Новый обработчик неавторизованных запросов
@login_manager.unauthorized_handler
def unauthorized_callback():
    return jsonify({"success": False, "message": "Unauthorized"}), 401

# Декоратор для проверки, что пользователь - админ
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({"success": False, "message": "Unauthorized"}), 401
        if current_user.role != 'admin':
            return jsonify({"success": False, "message": "Access denied"}), 403
        return f(*args, **kwargs)
    return decorated_function

# Вспомогательные функции для сериализации
def product_to_dict(product):
    is_fav = False
    from flask_login import current_user
    if current_user.is_authenticated:
        fav = ProductInCartOrFavorite.query.filter_by(
            user_id=current_user.id, product_id=product.id, flag='favorite'
        ).first()
        is_fav = True if fav else False

    return {
        "id": product.id,
        "category_id": product.category_id,
        "name": product.name,
        "description": product.description,
        "price": str(product.price),
        "images": [{"id": img.id, "url": img.url} for img in product.images],
        "sizes": sorted(
            [{"id": s.id, "name": s.name, "quantity": s.quantity} for s in product.sizes],
            key=lambda s: s["name"].lower()
        ),
        "isFavorite": is_fav,
    }

def category_to_dict(category):
    return {
        "id": category.id,
        "name": category.name,
        "parent_id": category.parent_id
    }

# Эндпоинт для получения информации аккаунта (общий)
@app.route('/account', methods=['GET'])
def account():
    if not current_user.is_authenticated:
        return jsonify({"message": "Unauthorized"}), 401
    return jsonify(current_user.to_dict())



@app.route('/api/user', methods=['GET'])
@login_required
def get_user():
    """
    Возвращает данные о пользователе и список его адресов
    """
    # user = current_user
    user_data = current_user.to_dict()  # содержит name, surname, email, phone, two_factor_enabled
    # Загружаем адреса
    addresses = Address.query.filter_by(user_id=current_user.id).all()
    address_list = []
    for addr in addresses:
        address_list.append({
            "id": addr.id,
            "country": addr.country,
            "city": addr.city,
            "street": addr.street,
            "postal_code": addr.postal_code
        })
    return jsonify({"success": True, "user": user_data, "addresses": address_list}), 200

@app.route('/api/user', methods=['PUT'])
@login_required
def update_user():
    """
    Обновляет поля пользователя (name, surname, email, phone, password).
    Пустое поле password означает, что пароль не меняется.
    """
    data = request.get_json()
    name = data.get('name')
    surname = data.get('surname')
    email = data.get('email')
    phone = data.get('phone')

    user = current_user
    if name: user.name = name
    if surname: user.surname = surname
    if email: user.email = email
    if phone: user.phone = phone
    if new_password.strip():
        user.password = generate_password_hash(new_password.strip())

    db.session.commit()
    return jsonify({"success": True, "user": user.to_dict()}), 200


@app.route('/api/user/addresses', methods=['POST'])
@login_required
def add_address():
    """
    Добавляет новый адрес для текущего пользователя
    """
    data = request.get_json()
    country = data.get('country')
    city = data.get('city')
    street = data.get('street')
    postal_code = data.get('postal_code')

    addr = Address(
        user_id=current_user.id,
        country=country,
        city=city,
        street=street,
        postal_code=postal_code
    )
    db.session.add(addr)
    db.session.commit()
    return jsonify({"success": True, "id": addr.id}), 201

@app.route('/api/user/addresses/<int:address_id>', methods=['PUT'])
@login_required
def update_address(address_id):
    """
    Редактирует существующий адрес
    """
    addr = Address.query.filter_by(id=address_id, user_id=current_user.id).first()
    if not addr:
        return jsonify({"success": False, "message": "Адрес не найден"}), 404

    data = request.get_json()
    addr.country = data.get('country', addr.country)
    addr.city = data.get('city', addr.city)
    addr.street = data.get('street', addr.street)
    addr.postal_code = data.get('postal_code', addr.postal_code)
    db.session.commit()
    return jsonify({"success": True}), 200

@app.route('/api/user/addresses/<int:address_id>', methods=['DELETE'])
@login_required
def delete_address(address_id):
    """
    Удаляет адрес
    """
    addr = Address.query.filter_by(id=address_id, user_id=current_user.id).first()
    if not addr:
        return jsonify({"success": False, "message": "Адрес не найден"}), 404

    db.session.delete(addr)
    db.session.commit()
    return jsonify({"success": True}), 200


# Эндпоинт для логина
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({"success": False, "message": "Email и пароль обязательны"}), 400

    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password, password):
        if user.two_factor_enabled:
            # Если 2FA включена, сохраняем id в сессии и возвращаем флаг для подтверждения OTP
            session['pending_user_id'] = user.id
            return jsonify({"success": True, "two_factor_required": True}), 200
        else:
            login_user(user)
            session.pop('pending_user_id', None)
            return jsonify({"success": True, "user": user.to_dict()}), 200
    else:
        return jsonify({"success": False, "message": "Неверный email или пароль"}), 401

# Эндпоинт для регистрации
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    if not email or not password or not name:
        return jsonify({"success": False, "message": "Все поля обязательны"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "message": "Пользователь с таким email уже существует"}), 409

    hashed_password = generate_password_hash(password)
    new_user = User(name=name, email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()
    session['user_id'] = new_user.id
    return jsonify({"success": True, "user": new_user.to_dict()}), 201

# Эндпоинт для выхода из аккаунта
@app.route('/logout', methods=['POST'])
def logout():
    logout_user()        # завершает авторизацию в Flask-Login
    session.clear()      # на всякий случай очистим Flask session
    return jsonify({"success": True}), 200



# Получение списка товаров
@app.route('/api/products', methods=['GET'])
def get_products():
    q = request.args.get('q', '').strip()
    category_ids_param = request.args.get('category_ids')
    
    if q:
        # Фильтрация по названию или описанию (регистр-независимо)
        products = Product.query.filter(
            (Product.name.ilike(f"%{q}%")) | (Product.description.ilike(f"%{q}%"))
        ).all()
    elif category_ids_param:
        try:
            # Преобразуем строку вида "1,3,5" в список целых чисел
            category_ids = [int(x) for x in category_ids_param.split(',') if x.strip() != '']
        except ValueError:
            return jsonify({"success": False, "message": "Неверный формат параметра category_ids"}), 400
        products = Product.query.filter(Product.category_id.in_(category_ids)).all()
    else:
        products = Product.query.all()

    response = []
    for product in products:
        response.append(product_to_dict(product))
    return jsonify(response), 200
# Добавление нового товара

# -------------------- Админские эндпоинты --------------------
@app.route('/api/products', methods=['POST'])
@admin_required
def add_product():
    data = request.get_json()
    name = data.get('name')
    description = data.get('description')
    price = data.get('price')
    category_id = data.get('category_id')
    images = data.get('images', [])  # Ожидается массив имен файлов

    if not name or not description or not price or not category_id:
        return jsonify({"success": False, "message": "Заполните все обязательные поля"}), 400

    try:
        product = Product(
            name=name,
            description=description,
            price=price,
            category_id=category_id
        )
        db.session.add(product)
        db.session.commit()
        # Для каждого файла из массива images создаём запись в таблице Image
        for filename in images:
            img = Image(product_id=product.id, url=filename)
            db.session.add(img)
        db.session.commit()

        # Собираем список изображений для ответа
        product_images = [{"id": img.id, "url": img.url} for img in product.images]
        product_data = {
            "success": True,
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": str(product.price),
            "category_id": product.category_id,
            "images": product_images
        }
        return jsonify(product_data), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/upload_image', methods=['POST'])
@admin_required  # Если требуется, или можно временно удалить для тестирования
def upload_image():
    if 'image' not in request.files:
        return jsonify({"success": False, "message": "Изображение не найдено"}), 400
    file = request.files['image']
    if file.filename == '':
        return jsonify({"success": False, "message": "Файл не выбран"}), 400
    if not allowed_file(file.filename):
        return jsonify({"success": False, "message": "Недопустимый формат файла"}), 400

    filename = secure_filename(file.filename)
    # Создаем папку, если её нет
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
    return jsonify({"success": True, "filename": filename}), 201


@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product_by_id(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"success": False, "message": "Товар не найден"}), 404
    return jsonify(product_to_dict(product)), 200


@app.route('/api/products/<int:product_id>', methods=['PUT'])
@admin_required
def update_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"success": False, "message": "Товар не найден"}), 404

    data = request.get_json()
    name = data.get('name')
    price = data.get('price')
    description = data.get('description')
    # Размеры редактировать отдельно

    if not name or not price:
        return jsonify({"success": False, "message": "Название и цена обязательны"}), 400

    try:
        product.name = name
        product.price = price
        product.description = description
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

# Удаление товара
@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@admin_required
def delete_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"success": False, "message": "Product not found"}), 404
    db.session.delete(product)
    db.session.commit()
    return jsonify({"success": True, "message": "Product deleted"})



@app.route('/api/products/<int:product_id>/sizes', methods=['POST'])
@admin_required
def add_size(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"success": False, "message": "Товар не найден"}), 404

    data = request.get_json()
    name = data.get('name')
    quantity = data.get('quantity', 0)
    if not name:
        return jsonify({"success": False, "message": "Название размера обязательно"}), 400

    try:
        size = Size(name=name, quantity=quantity, product_id=product_id)
        db.session.add(size)
        db.session.commit()
        return jsonify({
            "success": True,
            "id": size.id,
            "name": size.name,
            "quantity": size.quantity,
            "product_id": size.product_id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500



@app.route('/api/sizes/<int:size_id>', methods=['PUT'])
@admin_required
def update_size(size_id):
    size = Size.query.get(size_id)
    if not size:
        return jsonify({"success": False, "message": "Размер не найден"}), 404

    data = request.get_json()
    quantity = data.get('quantity')
    if quantity is None:
        return jsonify({"success": False, "message": "Количество обязательно"}), 400

    try:
        size.quantity = quantity
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


# Получение списка категорий
@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    # Преобразуем каждую категорию в словарь
    categories_list = [
        {
            "id": cat.id,
            "name": cat.name,
            "parent_id": cat.parent_id
        }
        for cat in categories
    ]
    return jsonify(categories_list)

@app.route('/api/categories/<int:category_id>', methods=['PUT'])
@admin_required
def update_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return jsonify({"success": False, "message": "Категория не найдена"}), 404

    data = request.get_json()
    new_name = data.get('name')
    if not new_name:
        return jsonify({"success": False, "message": "Новое название обязательно"}), 400

    try:
        category.name = new_name
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/images/<path:filename>')
def serve_image(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/images/<int:image_id>', methods=['DELETE'])
@admin_required
def delete_image(image_id):
    image = Image.query.get(image_id)
    if not image:
        return jsonify({"success": False, "message": "Изображение не найдено"}), 404
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], image.url)
        if os.path.exists(file_path):
            os.remove(file_path)
        db.session.delete(image)
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/products/<int:product_id>/images', methods=['POST'])
@admin_required
def add_product_image(product_id):
    # Проверяем, что товар существует
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"success": False, "message": "Товар не найден"}), 404

    data = request.get_json()
    filename = data.get('filename')
    if not filename:
        return jsonify({"success": False, "message": "Имя файла не передано"}), 400

    try:
        image = Image(product_id=product_id, url=filename)
        db.session.add(image)
        db.session.commit()
        return jsonify({"success": True, "id": image.id, "filename": filename}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

# Добавление новой категории (с возможностью создания подкатегории)
@app.route('/api/categories', methods=['POST'])
@admin_required  # Предполагается, что декоратор проверяет роль admin
def add_category():
    data = request.get_json()
    name = data.get('name')
    parent_id = data.get('parent_id')  # Если None, то категория верхнего уровня
    if not name:
        return jsonify({"success": False, "message": "Название категории обязательно"}), 400
    try:
        category = Category(name=name, parent_id=parent_id)
        db.session.add(category)
        db.session.commit()
        return jsonify({
            "success": True,
            "id": category.id,
            "name": category.name,
            "parent_id": category.parent_id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/favorites/<int:product_id>', methods=['POST'])
@login_required
def toggle_favorite(product_id):
    user_id = current_user.id
    fav = ProductInCartOrFavorite.query.filter_by(
        user_id=user_id, product_id=product_id, flag='favorite'
    ).first()
    if fav:
        db.session.delete(fav)
        db.session.commit()
        return jsonify({"success": True, "isFavorite": False}), 200
    else:
        new_fav = ProductInCartOrFavorite(
            user_id=user_id,
            product_id=product_id,
            flag='favorite',
            quantity=1  # для избранного количество неважно, можно хранить 1
        )
        db.session.add(new_fav)
        db.session.commit()
        return jsonify({"success": True, "isFavorite": True}), 201



@app.route('/api/favorites_products', methods=['GET'])
@login_required
def get_favorite_products():
    favorites = ProductInCartOrFavorite.query.filter_by(
        user_id=current_user.id, flag='favorite'
    ).all()
    favorite_product_ids = [fav.product_id for fav in favorites]
    
    category_ids_param = request.args.get('category_ids')
    query = Product.query.filter(Product.id.in_(favorite_product_ids))
    if category_ids_param:
        try:
            category_ids = [int(x) for x in category_ids_param.split(',') if x.strip() != '']
            query = query.filter(Product.category_id.in_(category_ids))
        except ValueError:
            return jsonify({"success": False, "message": "Неверный формат параметра category_ids"}), 400

    products = query.all()
    response = [product_to_dict(prod) for prod in products]
    return jsonify(response), 200





@app.route('/api/cart', methods=['GET'])
@login_required
def get_cart_entry():
    product_id = request.args.get('product_id')
    size_id = request.args.get('size')
    if not product_id or not size_id:
        return jsonify({"success": False, "message": "Не переданы параметры"}), 400
    cart_entry = ProductInCartOrFavorite.query.filter_by(
        user_id=current_user.id, size_id=size_id, flag='cart'
    ).first()
    if cart_entry:
        return jsonify({"success": True, "id": cart_entry.id, "quantity": cart_entry.quantity}), 200
    else:
        return jsonify({}), 200





@app.route('/api/cart', methods=['POST'])
@login_required
def add_to_cart():
    data = request.get_json()
    product_id = data.get('product_id')
    size_id = data.get('size_id')  # Может быть None, если размер не выбран
    quantity = data.get('quantity', 1)
    
    if not product_id:
        return jsonify({"success": False, "message": "Не указан товар"}), 400

    # Проверяем, существует ли уже запись в корзине для данного товара.
    # Если size_id указан, то ищем по комбинации product_id и size_id.
    # Если size_id не указан, то ищем по product_id (любая запись по этому товару считается дубликатом).
    query = ProductInCartOrFavorite.query.filter(
        ProductInCartOrFavorite.user_id == current_user.id,
        ProductInCartOrFavorite.product_id == product_id,
        ProductInCartOrFavorite.flag == 'cart'
    )
    if size_id is not None:
        query = query.filter(ProductInCartOrFavorite.size_id == size_id)
    
    existing = query.first()
    if existing:
        return jsonify({"success": False, "message": "Товар уже в корзине"}), 400

    try:
        cart_entry = ProductInCartOrFavorite(
            user_id=current_user.id,
            product_id=product_id,
            size_id=size_id,
            quantity=quantity,
            flag='cart'
        )
        db.session.add(cart_entry)
        db.session.commit()
        return jsonify({
            "success": True,
            "id": cart_entry.id,
            "quantity": cart_entry.quantity,
            "size_id": cart_entry.size_id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500





@app.route('/api/cart/<int:cart_id>', methods=['PUT'])
@login_required
def update_cart(cart_id):
    cart_entry = ProductInCartOrFavorite.query.filter_by(id=cart_id, flag='cart').first()
    if not cart_entry:
        return jsonify({"success": False, "message": "Запись в корзине не найдена"}), 404

    data = request.get_json()
    quantity = data.get('quantity')
    size_id = data.get('size_id')  # новый параметр для обновления размера

    if quantity is None:
        return jsonify({"success": False, "message": "Количество обязательно"}), 400

    try:
        cart_entry.quantity = quantity
        if size_id is not None:
            cart_entry.size_id = size_id
        db.session.commit()
        return jsonify({
            "success": True,
            "quantity": cart_entry.quantity,
            "size_id": cart_entry.size_id
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/cart/<int:cart_id>', methods=['DELETE'])
@login_required
def delete_cart_entry(cart_id):
    cart_entry = ProductInCartOrFavorite.query.filter_by(id=cart_id, flag='cart').first()
    if not cart_entry:
        return jsonify({"success": False, "message": "Запись в корзине не найдена"}), 404
    try:
        db.session.delete(cart_entry)
        db.session.commit()
        return jsonify({"success": True}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500



@app.route('/api/cart_items', methods=['GET'])
@login_required
def get_all_cart_items():
    from sqlalchemy.orm import joinedload
    cart_entries = ProductInCartOrFavorite.query.options(
        joinedload(ProductInCartOrFavorite.product).joinedload(Product.images),
        joinedload(ProductInCartOrFavorite.product).joinedload(Product.sizes),
        joinedload(ProductInCartOrFavorite.size)
    ).filter_by(user_id=current_user.id, flag='cart').all()
    response = []
    for entry in cart_entries:
        product = entry.product  # получаем товар напрямую через связь
        # Формируем список всех доступных размеров для товара
        available_sizes = sorted(
            [{"id": s.id, "name": s.name, "quantity": s.quantity} for s in product.sizes],
            key=lambda s: s["name"].lower()
        ) if product.sizes else []
        # Если размер выбран, берем его данные, иначе оставляем None
        if entry.size:
            size_id = entry.size.id
            size_name = entry.size.name
            available_quantity = entry.size.quantity
        else:
            size_id = None
            size_name = None
            available_quantity = None

        response.append({
            "cart_id": entry.id,
            "quantity": entry.quantity,
            "size_id": size_id,
            "size_name": size_name,
            "available": available_quantity,
            "product_id": product.id,
            "product_name": product.name,
            "price": str(product.price),
            "image_url": product.images[0].url if product.images else None,
            "sizes": available_sizes  # список доступных размеров для товара
        })
    return jsonify(response), 200




# -------------------- Луки эндпоинты --------------------


@app.route('/api/looks', methods=['GET'])
@login_required
def get_looks():
    looks = Look.query.filter_by(user_id=current_user.id).all()
    result = []
    for look in looks:
        result.append({
            "id": look.id,
            "name": look.name,
            "product_ids": [pi.product_id for pi in look.products_in_looks]
        })
    return jsonify({"success": True, "looks": result}), 200


@app.route('/api/looks', methods=['POST'])
@login_required
def add_look():
    data = request.get_json()
    name = data.get("name")
    product_ids = data.get("product_ids", [])
    if not name:
        return jsonify({"success": False, "message": "Название лука обязательно"}), 400
    new_look = Look(user_id=current_user.id, name=name)
    db.session.add(new_look)
    db.session.commit()  # Чтобы получить новый ID
    for pid in product_ids:
        pi = ProductInLook(look_id=new_look.id, product_id=pid)
        db.session.add(pi)
    db.session.commit()
    return jsonify({"success": True, "look": {"id": new_look.id, "name": new_look.name, "product_ids": product_ids}}), 201


@app.route('/api/looks/<int:look_id>', methods=['PUT'])
@login_required
def update_look(look_id):
    look = Look.query.filter_by(id=look_id, user_id=current_user.id).first()
    if not look:
        return jsonify({"success": False, "message": "Лук не найден"}), 404

    data = request.get_json()
    name = data.get("name", "").strip()
    product_ids = data.get("product_ids", [])

    try:
        if name:
            look.name = name

        # Удаляем старые записи товаров, входящих в лук
        ProductInLook.query.filter_by(look_id=look.id).delete()

        # Добавляем новые записи для каждого указанного товара
        for pid in product_ids:
            new_entry = ProductInLook(look_id=look.id, product_id=pid)
            db.session.add(new_entry)

        db.session.commit()
        return jsonify({
            "success": True,
            "look": {"id": look.id, "name": look.name, "product_ids": product_ids}
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500




@app.route('/api/looks/<int:look_id>', methods=['DELETE'])
@login_required
def delete_look(look_id):
    look = Look.query.filter_by(id=look_id, user_id=current_user.id).first()
    if not look:
        return jsonify({"success": False, "message": "Лук не найден"}), 404
    db.session.delete(look)
    db.session.commit()
    return jsonify({"success": True, "message": "Лук удалён"}), 200

@app.route('/api/looks/<int:look_id>/products', methods=['GET'])
def get_products_for_look(look_id):
    look = Look.query.get(look_id)
    if not look:
        return jsonify(success=False, message="Look not found"), 404

    # Получаем записи из products_in_looks для данного лука
    products_in_look = ProductInLook.query.filter_by(look_id=look_id).all()
    product_ids = [p.product_id for p in products_in_look]
    
    # Получаем продукты по списку product_ids
    products = Product.query.filter(Product.id.in_(product_ids)).all()

    # Преобразуем данные продукта в словарь (предполагается, что у модели Product есть метод to_dict)
    products_data = [product_to_dict(product) for product in products]

    return jsonify(success=True, products=products_data)



@app.route('/api/products/search', methods=['GET'])
def search_products():
    query = request.args.get('query', '').strip()
    if not query:
        return jsonify([]), 200
    products = Product.query.filter(Product.name.ilike(f"%{query}%")).limit(5).all()
    result = [product_to_dict(product) for product in products]
    return jsonify(result), 200


# -------------------- Двухфакторная авторизация эндпоинты --------------------
@app.route('/api/two_factor/enable', methods=['POST'])
@login_required
def enable_two_factor():
    # Генерируем новый секрет
    secret = pyotp.random_base32()
    current_user.two_factor_secret = secret
    current_user.two_factor_enabled = True
    db.session.commit()
    # Генерируем URI для TOTP
    otp_uri = pyotp.totp.TOTP(secret).provisioning_uri(name=current_user.email, issuer_name="YourAppName")
    # Генерируем QR-код
    qr = qrcode.make(otp_uri)
    buffered = io.BytesIO()
    qr.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return jsonify({"success": True, "qr_code": f"data:image/png;base64,{img_str}"}), 200



@app.route('/api/two_factor/confirm', methods=['POST'])
def confirm_two_factor():
    data = request.get_json()
    code = data.get('code')
    if not code:
        return jsonify({"success": False, "message": "Код обязателен"}), 400

    pending_user_id = session.get('pending_user_id')
    if not pending_user_id:
        return jsonify({"success": False, "message": "Нет запроса на подтверждение"}), 400

    user = User.query.get(int(pending_user_id))
    if not user or not user.two_factor_secret:
        return jsonify({"success": False, "message": "Пользователь не настроен для 2FA"}), 400

    totp = pyotp.TOTP(user.two_factor_secret)
    if totp.verify(str(code)):
        login_user(user)
        session.pop('pending_user_id', None)
        return jsonify({"success": True, "user": user.to_dict()}), 200
    else:
        return jsonify({"success": False, "message": "Неверный код"}), 401

@app.route('/api/two_factor/disable', methods=['POST'])
@login_required
def disable_two_factor():
    current_user.two_factor_enabled = False
    current_user.two_factor_secret = None
    db.session.commit()
    return jsonify({"success": True}), 200


@app.route('/api/verify_otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    code = data.get('code')
    if not code:
        return jsonify({"success": False, "message": "Код обязателен"}), 400

    pending_user_id = session.get('pending_user_id')
    if not pending_user_id:
        return jsonify({"success": False, "message": "Нет запроса на подтверждение"}), 400

    user = User.query.get(int(pending_user_id))
    if not user or not user.two_factor_secret:
        return jsonify({"success": False, "message": "Пользователь не настроен для 2FA"}), 400

    totp = pyotp.TOTP(user.two_factor_secret)
    if totp.verify(str(code)):
        login_user(user)
        session.pop('pending_user_id', None)
        return jsonify({"success": True, "user": user.to_dict()}), 200
    else:
        return jsonify({"success": False, "message": "Неверный код"}), 401


if __name__ == '__main__':
    app.run(debug=True)
