const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Для парсингу JSON-запитів
app.use(express.urlencoded({ extended: true })); // Для парсингу URL-кодованих даних
app.use(cookieParser()); // Для парсингу куків

// Налаштування сесій
app.use(session({
    secret: 'your_secret_key_very_secret_and_long', // !!! ОБОВ'ЯЗКОВО ЗМІНІТЬ ЦЕЙ РЯДОК В ПРОДАКШЕНІ !!!
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // Кука дійсна 24 години
        httpOnly: true,
        secure: false // ВАЖЛИВО: Для локальної розробки на HTTP повинно бути false.
                      // Для продакшену з HTTPS встановіть: process.env.NODE_ENV === 'production'
    }
}));

// База даних SQLite
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
    if (err) {
        console.error('Помилка відкриття бази даних:', err.message);
    } else {
        console.log('Підключено до бази даних SQLite.');
        // Створення таблиці users, якщо вона не існує
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )`, (createErr) => {
            if (createErr) {
                console.error('Помилка створення таблиці users:', createErr.message);
            } else {
                console.log('Таблиця users готова.');
            }
        });
    }
});

// Middleware для перевірки авторизації (приклад використання, не обов'язковий для всіх маршрутів)
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next(); // Користувач авторизований, продовжуємо
    } else {
        res.status(401).json({ message: 'Необхідна авторизація.' });
        // Або перенаправити на сторінку логіну: res.redirect('/login.html');
    }
}

// Обслуговування статичних файлів з папки 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Маршрут для реєстрації
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Будь ласка, заповніть всі поля.' });
    }

    try {
        // Хешування паролю
        const hashedPassword = await bcrypt.hash(password, 10); // 10 - кількість раундів солі

        db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(409).json({ message: 'Користувач з таким іменем або Email вже існує.' });
                    }
                    console.error('Помилка реєстрації:', err.message);
                    return res.status(500).json({ message: 'Помилка сервера під час реєстрації.' });
                }
                res.status(201).json({ message: 'Реєстрація успішна! Тепер ви можете увійти.' });
            }
        );
    } catch (error) {
        console.error('Помилка хешування пароля:', error);
        res.status(500).json({ message: 'Помилка сервера.' });
    }
});

// Маршрут для входу
app.post('/login', (req, res) => {
    const { username, password } = req.body; // username тут може бути і email

    if (!username || !password) {
        return res.status(400).json({ message: 'Будь ласка, введіть ім\'я користувача/Email та пароль.' });
    }

    // Шукаємо користувача за username або email
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], async (err, user) => {
        if (err) {
            console.error('Помилка запиту до БД при вході:', err.message);
            return res.status(500).json({ message: 'Помилка сервера.' });
        }

        if (!user) {
            return res.status(401).json({ message: 'Невірне ім\'я користувача або пароль.' });
        }

        // Порівняння хешованих паролів
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Невірне ім\'я користувача або пароль.' });
        }

        // Авторизація успішна, створюємо сесію
        req.session.userId = user.id;
        req.session.username = user.username; // Зберігаємо ім'я користувача в сесії
        res.status(200).json({ message: 'Вхід успішний!', username: user.username });
    });
});

// Маршрут для виходу
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Помилка виходу:', err);
            return res.status(500).json({ message: 'Помилка сервера під час виходу.' });
        }
        // Опції clearCookie повинні точно відповідати опціям session cookie
        res.clearCookie('connect.sid', {
            path: '/', // Завжди '/', якщо не вказано інше в session options
            httpOnly: true,
            secure: false // ВАЖЛИВО: Це має відповідати опції 'secure' з express-session!
        });
        res.status(200).json({ message: 'Вихід успішний.' });
    });
});

// Маршрут для перевірки стану авторизації та отримання даних користувача
app.get('/api/user', (req, res) => {
    if (req.session.userId) {
        res.status(200).json({
            loggedIn: true,
            username: req.session.username,
            userId: req.session.userId
        });
    } else {
        res.status(200).json({ loggedIn: false });
    }
});

// Захищений маршрут (приклад використання isAuthenticated middleware)
app.get('/protected-route', isAuthenticated, (req, res) => {
    res.status(200).json({ message: `Ви авторизовані, ${req.session.username}! Це захищений контент.` });
});


// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
});

// Закриття бази даних при завершенні роботи сервера (важливо для SQLite)
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('З\'єднання з базою даних SQLite закрито.');
        process.exit(0);
    });
});