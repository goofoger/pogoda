document.addEventListener('DOMContentLoaded', () => {
    // ЗАМІНІТЬ 'YOUR_API_KEY' НА ВАШ РЕАЛЬНИЙ КЛЮЧ WEATHERAPI.COM
    const apiKey = '899db8ac577741a1a3e133426253005';
    const apiUrlBase = 'https://api.weatherapi.com/v1/forecast.json';

    // Елементи DOM для оновлення погоди
    const locationSearchInput = document.getElementById('location-search');
    const currentLocationElem = document.getElementById('current-location');
    const currentTimeElem = document.getElementById('current-time');
    const currentTempElem = document.getElementById('current-temp');
    const currentWeatherIcon = document.getElementById('current-weather-icon');
    const currentConditionElem = document.getElementById('current-condition');
    const currentFeelsLikeElem = document.getElementById('current-feels-like');
    const currentPressureElem = document.getElementById('current-pressure');
    const currentWindElem = document.getElementById('current-wind');
    const currentVisibilityElem = document.getElementById('current-visibility');
    const currentDewPointElem = document.getElementById('current-dew-point');
    const currentHumidityElem = document.getElementById('current-humidity');
    const forecastCardsContainer = document.getElementById('forecast-cards-container');
    const dateInfoElem = document.querySelector('.date-info h2');
    const dayOfWeekElem = document.querySelector('.date-info span');

    // Елементи для гамбургер-меню
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const body = document.body;

    // Елемент для перемикача теми
    const themeToggle = document.getElementById('theme-toggle');

    // Елементи для статусу авторизації
    const logoutBtn = document.getElementById('logout-btn');
    const loginLinkContainer = document.getElementById('login-link-container');
    const logoutButtonLi = document.getElementById('logout-button-li');
    const welcomeMessage = document.getElementById('welcome-message');

    // Елементи для перемикання секцій
    const dashboardNavLink = document.getElementById('dashboard-nav-link');
    const mapNavLink = document.getElementById('map-nav-link');
    const dashboardSection = document.getElementById('dashboard-section');
    const mapSection = document.getElementById('map-section');

    // Елементи для карти
    const osmMapIframe = document.getElementById('osm-map-iframe');
    const osmMapLink = document.getElementById('osm-map-link');

    // Нові елементи DOM для збережених місць
    const saveLocationBtn = document.getElementById('save-location-btn');
    const savedLocationsList = document.getElementById('saved-locations-list');
    const savedLocationsNavLink = document.getElementById('saved-locations-nav-link');
    const savedLocationsSection = document.getElementById('saved-locations-section');

    // Змінні для зберігання останніх отриманих координат
    let lastFetchedLat;
    let lastFetchedLon;

    // Функція для отримання погоди
    async function fetchWeatherData(location) {
        try {
            const response = await fetch(`${apiUrlBase}?key=${apiKey}&q=${location}&days=5&aqi=no&alerts=no`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`HTTP error! Status: ${response.status}. Code: ${errorData.error.code}, Message: ${errorData.error.message}`);
            }
            const data = await response.json();
            // console.log(data); // Для налагодження

            // Зберігаємо координати
            lastFetchedLat = data.location.lat;
            lastFetchedLon = data.location.lon;

            updateCurrentWeather(data);
            updateForecast(data.forecast.forecastday);
            updateDateInfo(data.location.localtime_epoch);
            updateMapLocation(data.location.lat, data.location.lon); // Виклик функції оновлення карти

        } catch (error) {
            console.error('Помилка отримання даних про погоду:', error);
            // Можна додати повідомлення користувачу про помилку
        }
    }

    // Допоміжна функція для коректного URL іконки
    function getCorrectIconUrl(iconPath) {
        if (iconPath.startsWith('//')) {
            return `https:${iconPath}`;
        }
        return iconPath;
    }

    // Функція для оновлення поточної погоди
    function updateCurrentWeather(data) {
        const current = data.current;
        const location = data.location;

        currentLocationElem.textContent = location.name + (location.region ? `, ${location.region}` : '');

        const date = new Date(location.localtime_epoch * 1000);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'pm' : 'am';
        const formattedHours = hours % 12 || 12;
        const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
        currentTimeElem.textContent = `${formattedHours}:${formattedMinutes} ${ampm}`;

        currentTempElem.textContent = `${Math.round(current.temp_c)}°c`;
        currentWeatherIcon.src = getCorrectIconUrl(current.condition.icon);
        currentWeatherIcon.alt = current.condition.text;
        currentConditionElem.textContent = current.condition.text;
        currentFeelsLikeElem.textContent = `Feels like ${Math.round(current.feelslike_c)}°Celcius`;

        currentPressureElem.textContent = `${current.pressure_mb} mb`;
        currentWindElem.textContent = `${current.wind_kph} km/hr`;
        currentVisibilityElem.textContent = `${current.vis_km}km`;
        currentDewPointElem.textContent = 'N/A';
        currentHumidityElem.textContent = `${current.humidity}%`;
    }

    // Функція для оновлення прогнозу на наступні дні
    function updateForecast(forecastday) {
        forecastCardsContainer.innerHTML = '';

        const daysToShow = forecastday.slice(0, 5);

        daysToShow.forEach(day => {
            const date = new Date(day.date_epoch * 1000);
            const dayOfMonth = date.getDate();
            const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
            const monthAbbr = monthNames[date.getMonth()];

            const forecastCard = document.createElement('div');
            forecastCard.classList.add('forecast-card');

            forecastCard.innerHTML = `
                <span class="date">${dayOfMonth} ${monthAbbr}</span>
                <span class="temp">${Math.round(day.day.avgtemp_c)}°c</span>
                <img src="${getCorrectIconUrl(day.day.condition.icon)}" alt="${day.day.condition.text}">
                <span class="condition">${day.day.condition.text}</span>
                <span class="feels-like">Max: ${Math.round(day.day.maxtemp_c)}°C / Min: ${Math.round(day.day.mintemp_c)}°C</span>
            `;

            forecastCardsContainer.appendChild(forecastCard);
        });
    }

    // Функція для оновлення інформації про дату в заголовку
    function updateDateInfo(timestamp) {
        const date = new Date(timestamp * 1000);
        const monthNames = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
        const dayNames = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота'];

        const currentMonth = monthNames[date.getMonth()];
        const currentDayOfMonth = date.getDate();
        const currentDayOfWeek = dayNames[date.getDay()];

        dateInfoElem.textContent = `${currentMonth} ${date.getFullYear()}`;
        dayOfWeekElem.textContent = `${currentDayOfWeek}, ${currentDayOfMonth}`;
    }

    // Функція для оновлення карти
    function updateMapLocation(lat, lon, zoom = 12) {
        if (osmMapIframe && osmMapLink) {
            const newMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.05}%2C${lat - 0.05}%2C${lon + 0.05}%2C${lat + 0.05}&amp;layer=mapnik&amp;marker=${lat}%2C${lon}`;
            osmMapIframe.src = newMapUrl;
            osmMapLink.href = `https://www.openstreetmap.org/#map=${zoom}/${lat}/${lon}`;
        }
    }

    // --- ФУНКЦІЇ ДЛЯ ЗБЕРЕЖЕННЯ МІСЦЬ ---

    // Функція для збереження місця в localStorage
    function saveLocation(locationName, lat, lon) {
        let savedLocations = JSON.parse(localStorage.getItem('savedLocations')) || [];

        // Перевіряємо, чи місце вже збережено за назвою
        const alreadySaved = savedLocations.find(loc => loc.name.toLowerCase() === locationName.toLowerCase());
        if (!alreadySaved) {
            savedLocations.push({ name: locationName, lat: lat, lon: lon });
            localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
            displaySavedLocations(); // Оновлюємо список збережених місць у вкладці
            alert(`Місце "${locationName}" збережено!`);
        } else {
            alert(`Місце "${locationName}" вже збережено.`);
        }
    }

    // Нова допоміжна функція для отримання поточної погоди для конкретного місця
    async function fetchCurrentWeatherForLocation(locationName) {
        try {
            const response = await fetch(`${apiUrlBase}?key=${apiKey}&q=${locationName}&days=1&aqi=no&alerts=no`);
            if (!response.ok) {
                const errorData = await response.json();
                // Логуємо деталі помилки API, якщо вони є
                console.error(`API Error for ${locationName}: Code: ${errorData.error.code}, Message: ${errorData.error.message}`);
                throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorData.error.message || 'Unknown error'}`);
            }
            const data = await response.json();
            return {
                temp_c: data.current.temp_c,
                condition_text: data.current.condition.text,
                condition_icon: getCorrectIconUrl(data.current.condition.icon)
            };
        } catch (error) {
            console.error(`Помилка отримання поточної погоди для "${locationName}":`, error);
            return null; // Повертаємо null у випадку помилки
        }
    }

    // Функція для відображення збережених місць (оновлена версія)
    function displaySavedLocations() {
        savedLocationsList.innerHTML = ''; // Очищаємо список перед оновленням
        const savedLocations = JSON.parse(localStorage.getItem('savedLocations')) || [];

        if (savedLocations.length === 0) {
            const noLocationsItem = document.createElement('div');
            noLocationsItem.classList.add('saved-location-card', 'no-locations');
            noLocationsItem.textContent = 'Збережених місць поки немає.';
            savedLocationsList.appendChild(noLocationsItem);
        } else {
            savedLocations.forEach(async location => { // Додаємо 'async' тут
                const locationCard = document.createElement('div');
                locationCard.classList.add('saved-location-card');

                // Початковий вміст картки з індикаторами завантаження
                locationCard.innerHTML = `
                    <div class="card-header-saved">
                        <span class="location-name">${location.name}</span>
                        <button class="delete-location-btn" data-location-name="${location.name}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                    <div class="location-coords">
                        <span>Lat: ${location.lat.toFixed(2)}</span>
                        <span>Lon: ${location.lon.toFixed(2)}</span>
                    </div>
                    <div class="current-weather-details-saved">
                        <span class="temp-saved">Завантаження...</span>
                        <img class="icon-saved" src="https://via.placeholder.com/25x25/e0e0e0/ffffff?text=?" alt="Loading weather icon">
                        <span class="condition-saved"></span>
                    </div>
                `;

                // Додаємо картку до списку негайно, щоб користувач бачив "Завантаження..."
                savedLocationsList.appendChild(locationCard);

                // Завантажуємо поточну погоду для цього місця
                const weatherData = await fetchCurrentWeatherForLocation(location.name);

                // Оновлюємо картку завантаженими даними
                if (weatherData) {
                    locationCard.querySelector('.temp-saved').textContent = `${Math.round(weatherData.temp_c)}°c`;
                    locationCard.querySelector('.icon-saved').src = weatherData.condition_icon;
                    locationCard.querySelector('.icon-saved').alt = weatherData.condition_text;
                    locationCard.querySelector('.condition-saved').textContent = weatherData.condition_text;
                } else {
                    // Обробка помилки завантаження погоди для конкретної картки
                    locationCard.querySelector('.temp-saved').textContent = 'Н/Д';
                    locationCard.querySelector('.icon-saved').src = 'https://via.placeholder.com/25x25/ff6347/ffffff?text=!ERR'; // Червона іконка помилки
                    locationCard.querySelector('.icon-saved').alt = 'Помилка завантаження погоди';
                    locationCard.querySelector('.condition-saved').textContent = 'Помилка завантаження';
                }

                locationCard.addEventListener('click', (event) => {
                    // Запобігаємо спрацьовуванню кліку по картці при кліку на кнопку видалення
                    if (event.target.closest('.delete-location-btn')) {
                        return;
                    }
                    fetchWeatherData(location.name); // Завантажуємо погоду для вибраного місця
                    showSection('dashboard'); // Перемикаємось на Dashboard
                });

                // Обробник для кнопки видалення
                const deleteBtn = locationCard.querySelector('.delete-location-btn');
                deleteBtn.addEventListener('click', (event) => {
                    event.stopPropagation(); // Зупиняємо розповсюдження події, щоб не спрацьовував клік на картці
                    deleteLocation(location.name);
                });
            });
        }
    }

    // Нова функція для видалення місця
    function deleteLocation(locationName) {
        let savedLocations = JSON.parse(localStorage.getItem('savedLocations')) || [];
        savedLocations = savedLocations.filter(loc => loc.name !== locationName);
        localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
        displaySavedLocations(); // Оновлюємо список після видалення
        alert(`Місце "${locationName}" видалено.`);
    }

    // --- КІНЕЦЬ ФУНКЦІЙ ДЛЯ ЗБЕРЕЖЕННЯ МІСЦЬ ---

    // Обробник подій для пошуку місця
    saveLocationBtn.addEventListener('click', () => { // Додано обробник для кнопки збереження
        if (lastFetchedLat && lastFetchedLon && currentLocationElem.textContent) {
            saveLocation(currentLocationElem.textContent.split(',')[0].trim(), lastFetchedLat, lastFetchedLon);
        } else {
            alert('Будь ласка, спочатку виконайте пошук місця, щоб його зберегти.');
        }
    });

    locationSearchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            const location = locationSearchInput.value.trim();
            if (location) {
                fetchWeatherData(location);
            }
        }
    });

    // ************ ЛОГІКА ГАМБУРГЕР-МЕНЮ ************
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        if (sidebar.classList.contains('active')) {
            body.style.overflow = 'hidden';
            const overlay = document.createElement('div');
            overlay.classList.add('overlay');
            body.appendChild(overlay);
            overlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                body.style.overflow = '';
                const existingOverlay = document.querySelector('.overlay');
                if (existingOverlay) {
                    existingOverlay.remove();
                }
            });
        } else {
            body.style.overflow = '';
            const existingOverlay = document.querySelector('.overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }
        }
    });

    const navLinks = document.querySelectorAll('.sidebar .navigation a, .sidebar .navigation .button-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                body.style.overflow = '';
                const existingOverlay = document.querySelector('.overlay');
                if (existingOverlay) {
                    existingOverlay.remove();
                }
            }
        });
    });

    // ************ ЛОГІКА ПЕРЕМИКАННЯ ТЕМИ ************
    function applyTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark-theme');
            themeToggle.querySelector('i').classList.remove('fa-moon');
            themeToggle.querySelector('i').classList.add('fa-sun');
        } else {
            body.classList.remove('dark-theme');
            themeToggle.querySelector('i').classList.remove('fa-sun');
            themeToggle.querySelector('i').classList.add('fa-moon');
        }
        localStorage.setItem('theme', theme);
    }
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);
    themeToggle.addEventListener('click', () => {
        const currentTheme = body.classList.contains('dark-theme') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    // ************ ЛОГІКА АВТОРИЗАЦІЇ ************
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/user');
            const data = await response.json();

            if (data.loggedIn) {
                welcomeMessage.textContent = `Привіт, ${data.username}!`;
                logoutButtonLi.style.display = 'block';
                loginLinkContainer.style.display = 'none';
            } else {
                welcomeMessage.textContent = '';
                logoutButtonLi.style.display = 'none';
                loginLinkContainer.style.display = 'block';
            }
        } catch (error) {
            console.error('Помилка перевірки статусу авторизації:', error);
            welcomeMessage.textContent = '';
            logoutButtonLi.style.display = 'none';
            loginLinkContainer.style.display = 'block';
        }
    }

    // Обробник для кнопки виходу
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const response = await fetch('/logout', {
                    method: 'POST'
                });
                if (response.ok) {
                    console.log('Вихід успішний. Перенаправляємо на сторінку входу...');
                    window.location.href = '/login.html';
                } else {
                    const errorData = await response.json();
                    console.error('Помилка виходу (відповідь не OK):', errorData.message);
                    alert(`Помилка виходу: ${errorData.message}`);
                }
            } catch (error) {
                console.error('Помилка мережі при виході:', error);
                alert('Помилка з\'єднання з сервером. Спробуйте пізніше.');
            }
        });
    } else {
        console.error('script.js: Кнопка #logout-btn НЕ ЗНАЙДЕНА при завантаженні DOM. Обробник подій не прив\'язаний.');
    }

    // ************ ЛОГІКА ПЕРЕМИКАННЯ СЕКЦІЙ ************
    function showSection(sectionId) {
        dashboardSection.style.display = 'none';
        mapSection.style.display = 'none';
        savedLocationsSection.style.display = 'none'; // Приховуємо секцію "Saved Location"

        if (sectionId === 'dashboard') {
            dashboardSection.style.display = 'block';
        } else if (sectionId === 'map') {
            mapSection.style.display = 'block';
        } else if (sectionId === 'saved-locations') { // Новий блок для збережених місць
            savedLocationsSection.style.display = 'block';
            displaySavedLocations(); // Завантажуємо та відображаємо список
        }

        document.querySelectorAll('.sidebar .navigation ul li').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.sidebar .navigation a[data-section="${sectionId}"]`).parentElement.classList.add('active');
    }

    // Обробники кліків для навігаційних посилань
    if (dashboardNavLink) {
        dashboardNavLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('dashboard');
        });
    }
    if (mapNavLink) {
        mapNavLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('map');
        });
    }
    if (savedLocationsNavLink) { // Обробник для посилання "Saved Location"
        savedLocationsNavLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('saved-locations');
        });
    }

    // Початкові дії при завантаженні сторінки
    checkAuthStatus();
    fetchWeatherData('Kyiv'); // Завантажуємо погоду та оновлюємо карту для Києва при старті
    showSection('dashboard'); // Переконайтесь, що Dashboard показано при першому завантаженні
    // displaySavedLocations(); // Цей виклик вже є всередині showSection('saved-locations'), тому тут не потрібен
});