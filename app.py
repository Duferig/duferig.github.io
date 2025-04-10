from flask import Flask, render_template, request, redirect, url_for, abort, flash
import datetime

app = Flask(__name__)
app.secret_key = 'supersecretkey' 


hotels_data = {
    '1': {
        'id': '1',
        'name': 'Отель "Лазурный Бриз"',
        'location': 'Сочи, Россия',
        'price_range': 'от 5000₽/ночь',
        'rating': 4.8,
        'short_desc': 'Роскошный отель на берегу Черного моря с панорамными видами.',
     
        'image_url_path': 'images/lazurniy_briz_exterior.jpg', 
        'long_desc': 'Насладитесь непревзойденным комфортом и сервисом мирового класса в отеле "Лазурный Бриз". К вашим услугам частный пляж, спа-центр, несколько ресторанов и бассейны.',
        'rooms': [
            {'name': 'Стандартный номер', 'price': 5000, 'features': 'Кондиционер, Wi-Fi, ТВ, мини-бар'},
            {'name': 'Полулюкс', 'price': 8000, 'features': 'Улучшенный вид, зона отдыха, халаты'},
            {'name': 'Люкс "Президентский"', 'price': 15000, 'features': 'Панорамный вид на море, джакузи, гостиная'}
        ],
        'services': ['Частный пляж', 'Спа-центр', 'Бассейн', 'Ресторан', 'Фитнес-центр', 'Конференц-зал', 'Wi-Fi'],
        'image_paths': [
            'images/lazurniy_briz_exterior.jpg',
            # 'images/lazurniy_briz_room.jpg', 
            # 'images/lazurniy_briz_pool.jpg',
        ],
        'reviews': [
            {'author': 'Иван Петров', 'rating': 5, 'text': 'Прекрасный отель, отличный сервис! Вернемся снова.'},
            {'author': 'Мария Сидорова', 'rating': 4, 'text': 'Хорошее расположение, но завтраки могли бы быть разнообразнее.'}
        ]
    },
    '2': {
        'id': '2',
        'name': 'Гостиница "Горный Эдельвейс"',
        'location': 'Красная Поляна, Россия',
        'price_range': 'от 7000₽/ночь',
        'rating': 4.9,
        'short_desc': 'Уютный шале-отель в горах с доступом к горнолыжным трассам.',
         # --- ИЗМЕНЕНО ---
        'image_url_path': 'images/edelweiss_exterior.jpg',
        'long_desc': '"Горный Эдельвейс" предлагает идеальное сочетание домашнего уюта и современного комфорта. Расположенный у подножия гор, он станет вашей отправной точкой для активного отдыха.',
        'rooms': [
            {'name': 'Стандарт "Шале"', 'price': 7000, 'features': 'Вид на горы, Wi-Fi, ТВ'},
            {'name': 'Люкс "Панорама"', 'price': 12000, 'features': 'Балкон, камин, мини-кухня'}
        ],
        'services': ['Ресторан', 'Сауна', 'Прокат снаряжения', 'Парковка', 'Трансфер', 'Wi-Fi'],
         # --- ИЗМЕНЕНО ---
        'image_paths': [
             'images/edelweiss_exterior.jpg',
             # 'images/edelweiss_room.jpg',
             # 'images/edelweiss_mountain_view.jpg',
        ],
        'reviews': [
            {'author': 'Алексей Смирнов', 'rating': 5, 'text': 'Идеальное место для лыжников! Очень уютно.'},
            {'author': 'Елена Кузнецова', 'rating': 5, 'text': 'Потрясающие виды, вкусная еда. Рекомендую!'}
        ]
    },
     '3': {
        'id': '3',
        'name': 'Бутик-отель "Столичный Шик"',
        'location': 'Москва, Россия',
        'price_range': 'от 10000₽/ночь',
        'rating': 4.7,
        'short_desc': 'Элегантный бутик-отель в историческом центре Москвы.',
        
        'image_url_path': 'images/stolichniy_shik_facade.jpg',
        'long_desc': 'Отель "Столичный Шик" сочетает в себе исторический шарм и современные удобства. Расположен в тихом переулке, но в шаговой доступности от главных достопримечательностей.',
        'rooms': [
            {'name': 'Делюкс', 'price': 10000, 'features': 'Дизайнерский интерьер, Wi-Fi, ТВ, сейф'},
            {'name': 'Представительский люкс', 'price': 18000, 'features': 'Просторная комната, вид на город, кофемашина'}
        ],
        'services': ['Лобби-бар', 'Консьерж-сервис', 'Прачечная', 'Wi-Fi', 'Парковка (ограниченно)'],
        
        'image_paths': [
             'images/stolichniy_shik_facade.jpg',
             # 'images/stolichniy_shik_room.jpg',
             # 'images/stolichniy_shik_lobby_bar.jpg',
        ],
        'reviews': [
            {'author': 'Константин Новиков', 'rating': 5, 'text': 'Стильно, чисто, прекрасное расположение.'},
            {'author': 'Анна Морозова', 'rating': 4, 'text': 'Очень красивый отель, но немного шумно от улицы.'}
        ]
    }
}

# --- Контекстный процессор для передачи now() в шаблоны ---
@app.context_processor
def inject_now():
    return {'now': datetime.datetime.utcnow}

# --- Маршруты (Routes) --- Остаются без изменений ---

@app.route('/')
def index():
    """Главная страница - список отелей."""
    # Передаем hotels в шаблон как и раньше
    return render_template('index.html', hotels=list(hotels_data.values()))

@app.route('/hotel/<hotel_id>')
def hotel_detail(hotel_id):
    """Страница детальной информации об отеле."""
    hotel = hotels_data.get(hotel_id)
    if not hotel:
        abort(404) # Отель не найден
     
    return render_template('hotel_detail.html', hotel=hotel)

# --- Остальные маршруты и запуск приложения остаются без изменений ---
@app.route('/book/<hotel_id>', methods=['GET'])
def booking_form(hotel_id):
    """Страница с формой бронирования."""
    hotel = hotels_data.get(hotel_id)
    if not hotel:
        abort(404)
        
    today = datetime.date.today()
    
    # Дата заезда по умолчанию - завтра
    default_check_in = (today + datetime.timedelta(days=1)).strftime('%Y-%m-%d')
    
    # Позволим бронировать начиная с завтрашнего дня
    min_date_allowed = (today + datetime.timedelta(days=1)).strftime('%Y-%m-%d')

    # Передаем hotel, дату по умолчанию И минимальную дату в шаблон
    return render_template('booking_form.html', 
                           hotel=hotel, 
                           default_check_in=default_check_in,
                           min_date_allowed=min_date_allowed) 


@app.route('/confirm', methods=['POST'])
def confirm_booking():
    hotel_id = request.form.get('hotel_id')
    guest_name = request.form.get('guest_name')
    guest_email = request.form.get('guest_email')
    check_in_date_str = request.form.get('check_in_date')
    nights = request.form.get('nights')
    hotel = hotels_data.get(hotel_id)
    if not hotel: abort(404)
    if not all([guest_name, guest_email, check_in_date_str, nights]):
        flash('Пожалуйста, заполните все поля формы.', 'warning')
        return redirect(url_for('booking_form', hotel_id=hotel_id))
    try:
        nights_int = int(nights)
        if nights_int <= 0: raise ValueError()
        check_in_date = datetime.datetime.strptime(check_in_date_str, '%Y-%m-%d').date()
        check_out_date = check_in_date + datetime.timedelta(days=nights_int)
    except (ValueError, TypeError):
        flash('Пожалуйста, введите корректные данные (количество ночей должно быть > 0).', 'warning')
        return redirect(url_for('booking_form', hotel_id=hotel_id))
    booking_details = {
        'hotel_name': hotel['name'], 'guest_name': guest_name, 'guest_email': guest_email,
        'check_in': check_in_date.strftime('%d.%m.%Y'), 'check_out': check_out_date.strftime('%d.%m.%Y'),
        'nights': nights_int, 'booking_id': f"MOCK-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
    }
    return render_template('confirmation.html', booking=booking_details)

@app.route('/cancel_booking')
def cancel_booking():
    flash('Ваше бронирование было успешно отменено (симуляция).', 'info')
    return redirect(url_for('index'))

@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404

if __name__ == '__main__':
    app.run(debug=True, port=5001)