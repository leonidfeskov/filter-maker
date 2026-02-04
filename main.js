(function(){
    // Получаем все элементы фильтров
    const urlInput = document.getElementById('url');
    const dateStart = document.getElementById('date-start');
    const dateEnd = document.getElementById('date-end');
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const openReportButton = document.getElementById('open-report');
    const clearButton = document.getElementById('clear-button');
    const notification = document.getElementById('copy-notification');

    /**
     * Собирает все активные фильтры и формирует query string
     * Использует encodeURIComponent для кодирования пробелов как %20
     * Чекбоксы с одинаковым именем объединяются через запятую
     * @returns {string} Query string без знака вопроса
     */
    function buildQueryString() {
        const params = [];

        // Добавляем дату начала
        if (dateStart.value) {
            params.push(`${encodeURIComponent(dateStart.name)}=${encodeURIComponent(dateStart.value)}`);
        }

        // Добавляем дату окончания
        if (dateEnd.value) {
            params.push(`${encodeURIComponent(dateEnd.name)}=${encodeURIComponent(dateEnd.value)}`);
        }

        // Добавляем выбранную радиокнопку
        const selectedRadio = document.querySelector('input[type="radio"]:checked');
        if (selectedRadio) {
            params.push(`${encodeURIComponent(selectedRadio.name)}=${encodeURIComponent(selectedRadio.value)}`);
        }

        // Добавляем отмеченные чекбоксы, группируя по имени
        const checkedBoxes = document.querySelectorAll('input[type="checkbox"]:checked');
        const checkboxGroups = {};

        checkedBoxes.forEach(checkbox => {
            if (!checkboxGroups[checkbox.name]) {
                checkboxGroups[checkbox.name] = [];
            }
            checkboxGroups[checkbox.name].push(checkbox.value);
        });

        // Формируем параметры для чекбоксов с объединением через запятую
        Object.keys(checkboxGroups).forEach(name => {
            const values = checkboxGroups[name].join(',');
            params.push(`${encodeURIComponent(name)}=${encodeURIComponent(values)}`);
        });

        return params.join('&');
    }

    /**
     * Сохраняет текущие значения фильтров в localStorage
     */
    function saveToLocalStorage() {
        const filterData = {
            url: urlInput.value,
            dateStart: dateStart.value,
            dateEnd: dateEnd.value,
            radio: null,
            checkboxes: {}
        };

        // Сохраняем выбранную радиокнопку
        const selectedRadio = document.querySelector('input[type="radio"]:checked');
        if (selectedRadio) {
            filterData.radio = {
                name: selectedRadio.name,
                value: selectedRadio.value
            };
        }

        // Сохраняем отмеченные чекбоксы по группам
        const checkedBoxes = document.querySelectorAll('input[type="checkbox"]:checked');
        checkedBoxes.forEach(checkbox => {
            if (!filterData.checkboxes[checkbox.name]) {
                filterData.checkboxes[checkbox.name] = [];
            }
            filterData.checkboxes[checkbox.name].push(checkbox.value);
        });

        localStorage.setItem('filterSettings', JSON.stringify(filterData));
    }

    /**
     * Восстанавливает значения фильтров из localStorage
     */
    function restoreFromLocalStorage() {
        const savedData = localStorage.getItem('filterSettings');
        if (!savedData) return;

        try {
            const filterData = JSON.parse(savedData);

            // Восстанавливаем URL
            if (filterData.url) {
                urlInput.value = filterData.url;
            }

            // Восстанавливаем даты
            if (filterData.dateStart) {
                dateStart.value = filterData.dateStart;
            }
            if (filterData.dateEnd) {
                dateEnd.value = filterData.dateEnd;
            }

            // Восстанавливаем радиокнопку
            if (filterData.radio) {
                radioButtons.forEach(radio => {
                    if (radio.name === filterData.radio.name && radio.value === filterData.radio.value) {
                        radio.checked = true;
                    }
                });
            }

            // Восстанавливаем чекбоксы
            if (filterData.checkboxes) {
                checkboxes.forEach(checkbox => {
                    const values = filterData.checkboxes[checkbox.name];
                    if (values && values.includes(checkbox.value)) {
                        checkbox.checked = true;
                    }
                });
            }
        } catch (e) {
            console.error('Ошибка при восстановлении фильтров из localStorage:', e);
        }
    }

    /**
     * Обновляет URL в адресной строке без перезагрузки страницы
     * и сохраняет значения в localStorage
     */
    function updateURL() {
        const queryString = buildQueryString();
        const newURL = queryString ? `?${queryString}` : window.location.pathname;
        history.replaceState(null, '', newURL);
        saveToLocalStorage();
    }

    /**
     * Восстанавливает значения фильтров из URL при загрузке страницы
     */
    function restoreFiltersFromURL() {
        const params = new URLSearchParams(window.location.search);

        // Восстанавливаем дату начала
        const dateStartValue = params.get(dateStart.name);
        if (dateStartValue) {
            dateStart.value = dateStartValue;
        }

        // Восстанавливаем дату окончания
        const dateEndValue = params.get(dateEnd.name);
        if (dateEndValue) {
            dateEnd.value = dateEndValue;
        }

        // Восстанавливаем радиокнопку
        radioButtons.forEach(radio => {
            const paramValue = params.get(radio.name);
            if (paramValue === radio.value) {
                radio.checked = true;
            }
        });

        // Восстанавливаем чекбоксы
        checkboxes.forEach(checkbox => {
            const paramValue = params.get(checkbox.name);
            if (paramValue) {
                // Разбиваем значение по запятой
                const values = paramValue.split(',');
                if (values.includes(checkbox.value)) {
                    checkbox.checked = true;
                }
            }
        });
    }

    /**
     * Формирует полный URL с фильтрами
     * @returns {string|null} Готовый URL или null, если невозможно сформировать
     */
    function buildFullUrl() {
        const queryString = buildQueryString();
        const baseUrl = urlInput.value.trim();

        if (!baseUrl) {
            return null;
        }

        // Проверяем, есть ли уже параметры в базовом URL
        const hasParams = baseUrl.includes('?');

        if (queryString) {
            // Добавляем фильтры к базовому URL
            return hasParams
                ? `${baseUrl}&${queryString}`
                : `${baseUrl}?${queryString}`;
        } else {
            // Если нет фильтров, возвращаем просто базовый URL
            return baseUrl;
        }
    }

    /**
     * Открывает отчет с фильтрами в новом окне
     */
    function openReport() {
        const fullUrl = buildFullUrl();

        if (!fullUrl) {
            showNotification('Укажите ссылку на отчет');
            return;
        }

        // Открываем URL в новой вкладке
        window.open(fullUrl, '_blank');
        showNotification('Отчет открыт');
    }

    /**
     * Очищает все фильтры
     */
    function clearFilters() {
        // Очищаем URL
        urlInput.value = '';

        // Очищаем поля дат
        dateStart.value = '';
        dateEnd.value = '';

        // Снимаем выбор со всех радиокнопок
        radioButtons.forEach(radio => {
            radio.checked = false;
        });

        // Снимаем выбор со всех чекбоксов
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        // Обновляем placeholder'ы в выпадающих списках
        const dropdowns = document.querySelectorAll('.checkbox-dropdown');
        dropdowns.forEach(dropdown => {
            const placeholder = dropdown.querySelector('.checkbox-dropdown-placeholder');
            // Восстанавливаем дефолтный текст placeholder'а
            const defaultTexts = {
                'Тип задач': 'Выберите типы задач',
                'Команда': 'Выберите команды',
                'Статус задачи': 'Выберите статусы',
                'Тип задачи': 'Выберите типы',
                'Наличие Story внутри': 'Выберите опции',
                'Продукт/налог': 'Выберите категорию',
                'Исключить по лейблу': 'Выберите лейблы'
            };

            const filterLabel = dropdown.closest('.filter-group').querySelector('.filter-label').textContent;
            placeholder.textContent = defaultTexts[filterLabel] || 'Выберите значения';
        });

        // Очищаем localStorage
        localStorage.removeItem('filterSettings');

        // Очищаем URL
        history.replaceState(null, '', window.location.pathname);

        // Показываем уведомление
        showNotification('Фильтры очищены');
    }

    /**
     * Показывает уведомление на несколько секунд
     * @param {string} message - Текст уведомления
     */
    function showNotification(message) {
        notification.textContent = message;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }

    // Добавляем обработчики событий на все элементы фильтров
    urlInput.addEventListener('input', saveToLocalStorage);
    urlInput.addEventListener('change', saveToLocalStorage);
    dateStart.addEventListener('change', updateURL);
    dateEnd.addEventListener('change', updateURL);

    radioButtons.forEach(radio => {
        radio.addEventListener('change', updateURL);
    });

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateURL);
    });

    // Обработчики кнопок
    openReportButton.addEventListener('click', openReport);
    clearButton.addEventListener('click', clearFilters);

    /**
     * Инициализирует выпадающие списки чекбоксов
     */
    function initCheckboxDropdowns() {
        const dropdowns = document.querySelectorAll('.checkbox-dropdown');

        dropdowns.forEach(dropdown => {
            const header = dropdown.querySelector('.checkbox-dropdown-header');
            const placeholder = dropdown.querySelector('.checkbox-dropdown-placeholder');
            const checkboxesInDropdown = dropdown.querySelectorAll('input[type="checkbox"]');
            const defaultPlaceholder = placeholder.textContent;

            // Функция обновления текста заголовка
            function updatePlaceholder() {
                const checked = Array.from(checkboxesInDropdown).filter(cb => cb.checked);

                if (checked.length === 0) {
                    placeholder.textContent = defaultPlaceholder;
                } else {
                    placeholder.textContent = checked.map(cb => cb.value).join(', ');
                }
            }

            // Клик по заголовку - открыть/закрыть список
            header.addEventListener('click', (e) => {
                e.stopPropagation();

                // Закрываем все другие выпадающие списки
                dropdowns.forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) {
                        otherDropdown.classList.remove('active');
                    }
                });

                // Переключаем текущий список
                dropdown.classList.toggle('active');
            });

            // Обновляем текст при изменении чекбоксов
            checkboxesInDropdown.forEach(checkbox => {
                checkbox.addEventListener('change', updatePlaceholder);
            });

            // Инициализируем текст при загрузке
            updatePlaceholder();
        });

        // Закрываем выпадающие списки при клике вне их
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.checkbox-dropdown')) {
                dropdowns.forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });
    }

    // Восстанавливаем фильтры при загрузке страницы
    // Приоритет: URL имеет приоритет над localStorage
    if (window.location.search) {
        // Если есть параметры в URL, восстанавливаем из URL
        restoreFiltersFromURL();

        // Восстанавливаем поле URL из localStorage
        const savedData = localStorage.getItem('filterSettings');
        if (savedData) {
            try {
                const filterData = JSON.parse(savedData);
                if (filterData.url) {
                    urlInput.value = filterData.url;
                }
            } catch (e) {
                console.error('Ошибка при восстановлении URL из localStorage:', e);
            }
        }

        // И сохраняем в localStorage для последующих загрузок
        saveToLocalStorage();
    } else {
        // Если URL пустой, восстанавливаем из localStorage
        restoreFromLocalStorage();
        // И обновляем URL на основе сохраненных значений
        const queryString = buildQueryString();
        if (queryString) {
            history.replaceState(null, '', `?${queryString}`);
        }
    }

    // Инициализируем выпадающие списки
    initCheckboxDropdowns();
})();