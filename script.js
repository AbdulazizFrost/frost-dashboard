/**
 * AAA Premium Browser Dashboard Controller
 * 120FPS GPU Accelerated, Parallax, Dynamic Lighting
 */

// Disable browser's automatic scroll restoration to prevent "flying into the sky" on F5
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

class DashboardController {
    constructor() {
        this.initTimeWidget();
        this.initWeatherWidget();
        this.initSearch();
        this.initShortcuts();
        this.initSidebar();
        this.initParallax();
        this.initDynamicLighting();
        this.initUserName();
        
        setInterval(() => this.updateTime(), 1000);
    }

    // ==========================================
    // 0. MOUSE PARALLAX & DYNAMIC LIGHTING (OPTIMIZED)
    // ==========================================
    initParallax() {
        this.wrapper = document.getElementById('parallax-wrapper');
        if (!this.wrapper) return;

        let w = window.innerWidth;
        let h = window.innerHeight;
        window.addEventListener('resize', () => { w = window.innerWidth; h = window.innerHeight; });

        let ticking = false;
        document.addEventListener('mousemove', (e) => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const x = (e.clientX / w - 0.5) * 15;
                    const y = (e.clientY / h - 0.5) * 15;
                    this.wrapper.style.transform = `translate(${-x}px, ${-y}px)`;
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    initDynamicLighting() {
        let cards = [];
        const updateCards = () => {
            cards = document.querySelectorAll('.shortcut-card.premium-glass, .widget-glass.premium-glass, .search-bar.premium-glass');
        };
        
        // Initial load
        updateCards();
        
        // Listen for new shortcuts being added
        const observer = new MutationObserver(updateCards);
        const grid = document.getElementById('shortcuts-grid');
        if (grid) observer.observe(grid, { childList: true });

        let ticking = false;
        document.addEventListener('mousemove', (e) => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    cards.forEach(card => {
                        const rect = card.getBoundingClientRect();
                        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
                        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
                    });
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // ==========================================
    // 1. SIDEBAR & SYSTEM LINKS
    // ==========================================
    initSidebar() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const url = item.getAttribute('data-url');
                if (!url) return;
                
                // Эффект Ripple при клике
                item.style.transform = 'scale(0.95)';
                setTimeout(() => item.style.transform = '', 150);

                if (url.startsWith('chrome://')) {
                    chrome.tabs.create({ url: url });
                } else {
                    window.location.href = url;
                }
            });
        });
    }

    // ==========================================
    // 2. TIME & DATE & USER NAME
    // ==========================================
    initUserName() {
        const savedName = localStorage.getItem('frost_user_name') || 'User';
        const nameElems = document.querySelectorAll('.editable-name');
        
        const updateNames = (newName) => {
            const cleanName = newName.trim() || 'User';
            nameElems.forEach(el => {
                if (el.textContent !== cleanName) el.textContent = cleanName;
            });
            localStorage.setItem('frost_user_name', cleanName);
        };

        // Устанавливаем при загрузке
        updateNames(savedName);

        // Вешаем слушатели на редактирование
        nameElems.forEach(el => {
            el.addEventListener('blur', (e) => updateNames(e.target.textContent));
            el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    el.blur();
                }
            });
        });
    }

    initTimeWidget() {
        this.timeElem = document.getElementById('time');
        this.dateElem = document.getElementById('date');
        this.greetingTimeElem = document.getElementById('greeting-time');
        this.updateTime();
    }

    updateTime() {
        const now = new Date();
        
        if (this.timeElem) {
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            this.timeElem.textContent = `${hours}:${minutes}`;
        }
        
        if (this.dateElem) {
            const options = { weekday: 'long', day: 'numeric', month: 'long' };
            let dateStr = now.toLocaleDateString('en-US', options); 
            this.dateElem.textContent = dateStr;
        }

        if (this.greetingTimeElem) {
            const h = now.getHours();
            let text = 'Good night, ';
            if (h >= 5 && h < 12) text = 'Good morning, ';
            else if (h >= 12 && h < 18) text = 'Good afternoon, ';
            else if (h >= 18 && h < 23) text = 'Good evening, ';
            
            if (this.greetingTimeElem.textContent !== text) {
                this.greetingTimeElem.textContent = text;
            }
        }
    }

    // ==========================================
    // 3. WEATHER
    // ==========================================
    async initWeatherWidget() {
        const tempElem = document.getElementById('weather-temp');
        const descElem = document.getElementById('weather-desc');
        if (!tempElem || !descElem) return;

        try {
            const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=55.7512&longitude=37.6184&current_weather=true');
            if (!res.ok) throw new Error("Network error");
            const data = await res.json();
            
            const temp = Math.round(data.current_weather.temperature);
            const code = data.current_weather.weathercode;
            
            tempElem.textContent = `${temp > 0 ? '+' : ''}${temp}°C`;
            
            let desc = 'Cloudy';
            if (code === 0) desc = 'Clear Sky';
            else if (code >= 1 && code <= 3) desc = 'Partly Cloudy';
            else if (code >= 51 && code <= 67) desc = 'Rain';
            else if (code >= 71 && code <= 82) desc = 'Snow';
            else if (code >= 95) desc = 'Thunderstorm';
            
            descElem.textContent = desc;
        } catch (e) {
            console.error("Weather error:", e);
            tempElem.textContent = '--°C';
            descElem.textContent = 'Offline';
        }
    }

    // ==========================================
    // 4. SEARCH & AUTOCOMPLETE WITH HISTORY
    // ==========================================
    initSearch() {
        this.input = document.getElementById('search-input');
        this.suggestionsBox = document.getElementById('suggestions');
        this.form = document.getElementById('search-form');
        
        if (!this.input || !this.suggestionsBox || !this.form) return;

        this.currentFocus = -1;

        // Показываем историю только при явном клике мышкой, чтобы autofocus при старте не перекрывал шорткаты
        this.input.addEventListener('click', () => {
            if (!this.input.value.trim()) {
                this.showSearchHistory();
            }
        });

        this.input.addEventListener('input', (e) => this.handleSearchInput(e.target.value.trim()));
        this.input.addEventListener('keydown', (e) => this.handleKeyboardNav(e));

        // Сохраняем запрос в историю при сабмите
        this.form.addEventListener('submit', (e) => {
            const query = this.input.value.trim();
            if (query) {
                this.saveSearchQuery(query);
            }
        });

        // Закрываем подсказки при клике вне формы
        document.addEventListener('click', (e) => {
            if (!this.form.contains(e.target)) {
                this.suggestionsBox.classList.remove('active');
            }
        });

        // Надежное закрытие списка, если поле ввода теряет фокус
        this.input.addEventListener('blur', () => {
            setTimeout(() => {
                this.suggestionsBox.classList.remove('active');
                window.scrollTo(0, 0); // Надежно сбрасываем любой системный скролл страницы
            }, 200);
        });

        // =====================================
        // ФУНКЦИОНАЛ НОВЫХ КНОПОК ПОИСКА
        // =====================================
        
        // 1. Голосовой поиск (Web Speech API)
        const micBtn = document.getElementById('mic-btn');
        if (micBtn) {
            micBtn.addEventListener('click', () => {
                try {
                    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                    if (!SpeechRecognition) throw new Error("Not supported");
                    
                    const recognition = new SpeechRecognition();
                    recognition.lang = 'ru-RU'; // Можно поставить 'en-US' или оставить авто
                    
                    // Визуальный отклик (Красный цвет при записи)
                    micBtn.style.background = 'rgba(255, 68, 68, 0.2)';
                    micBtn.querySelector('svg').style.fill = '#ff4444';
                    this.input.placeholder = "Говорите...";
                    
                    recognition.onresult = (event) => {
                        this.input.value = event.results[0][0].transcript;
                        this.form.submit();
                    };
                    
                    recognition.onend = () => {
                        micBtn.style.background = '';
                        micBtn.querySelector('svg').style.fill = '';
                        this.input.placeholder = "Search the web or type a URL...";
                    };
                    
                    recognition.start();
                } catch(e) {
                    alert('Голосовой поиск не поддерживается или заблокирован в этой вкладке.');
                }
            });
        }

        // 2. Google Lens (Поиск по картинке)
        const lensBtn = document.getElementById('lens-btn');
        const lensModal = document.getElementById('lens-modal');
        const lensClose = document.getElementById('lens-close');
        
        if (lensBtn && lensModal) {
            lensBtn.addEventListener('click', () => {
                lensModal.classList.add('active');
            });
            
            lensClose.addEventListener('click', () => {
                lensModal.classList.remove('active');
            });
            
            // Закрытие при клике вне модалки
            lensModal.addEventListener('click', (e) => {
                if (e.target === lensModal) lensModal.classList.remove('active');
            });

            // Поиск по URL картинки
            const urlForm = document.getElementById('lens-url-form');
            const urlInput = document.getElementById('lens-url-input');
            if (urlForm) {
                urlForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const url = encodeURIComponent(urlInput.value.trim());
                    if (url) {
                        window.location.href = `https://lens.google.com/uploadbyurl?url=${url}`;
                    }
                });
            }

            // Поиск через загрузку файла
            const fileInput = document.getElementById('lens-file');
            const dragArea = document.getElementById('drag-drop-area');
            
            const handleFileUpload = (file) => {
                if (!file || !file.type.startsWith('image/')) {
                    alert('Пожалуйста, выберите изображение.');
                    return;
                }
                
                // Создаем невидимую форму для отправки файла в Google Lens
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = 'https://lens.google.com/v3/upload';
                form.enctype = 'multipart/form-data';
                form.style.display = 'none';
                
                const input = document.createElement('input');
                input.type = 'file';
                input.name = 'encoded_image';
                
                const dt = new DataTransfer();
                dt.items.add(file);
                input.files = dt.files;
                
                form.appendChild(input);
                document.body.appendChild(form);
                form.submit();
            };

            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                    }
                });
            }

            if (dragArea) {
                dragArea.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    dragArea.classList.add('dragover');
                });
                dragArea.addEventListener('dragleave', () => {
                    dragArea.classList.remove('dragover');
                });
                dragArea.addEventListener('drop', (e) => {
                    e.preventDefault();
                    dragArea.classList.remove('dragover');
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileUpload(e.dataTransfer.files[0]);
                    }
                });
            }
        }

        // 3. Режим ИИ (Переход в Gemini или ChatGPT)
        const aiBtn = document.getElementById('ai-mode-btn');
        if (aiBtn) {
            aiBtn.addEventListener('click', () => {
                // Идеально для режима ИИ - открывать Google Gemini
                window.location.href = 'https://gemini.google.com/';
            });
        }
    }

    saveSearchQuery(query) {
        let history = JSON.parse(localStorage.getItem('search_history_v1') || '[]');
        history = history.filter(q => q !== query); // Убираем дубликаты
        history.unshift(query); // Добавляем в начало
        if (history.length > 6) history.pop(); // Храним только 6 последних
        localStorage.setItem('search_history_v1', JSON.stringify(history));
    }

    showSearchHistory() {
        let history = JSON.parse(localStorage.getItem('search_history_v1') || '[]');
        
        // Если истории нет, показываем фейковые тренды для красоты (как в Google)
        if (history.length === 0) {
            history = ['chatgpt 4', 'github', 'переводчик', 'email'];
        }

        this.renderSuggestions(history, true);
    }

    handleSearchInput(query) {
        if (!query) {
            this.showSearchHistory();
            return;
        }

        chrome.runtime.sendMessage({ action: "fetchSuggestions", query: query }, (response) => {
            if (chrome.runtime.lastError) return;
            if (response && response.suggestions && response.suggestions.length > 0) {
                this.renderSuggestions(response.suggestions.slice(0, 6), false);
            } else {
                this.suggestionsBox.classList.remove('active');
            }
        });
    }

    renderSuggestions(suggestions, isHistory = false) {
        this.suggestionsBox.innerHTML = '';
        suggestions.forEach(sugg => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            
            // Иконка истории (часы) или иконка поиска (лупа)
            const iconSvg = isHistory 
                ? '<svg viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>'
                : '<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>';

            const labelType = isHistory ? 'History' : 'Google Search';

            item.innerHTML = `
                <div class="sugg-icon">${iconSvg}</div>
                <div class="sugg-text">
                    <span class="sugg-title">${sugg}</span>
                    <span class="sugg-type">${labelType}</span>
                </div>
                <div class="sugg-action">
                    <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
                </div>
            `;
            item.addEventListener('click', () => {
                this.input.value = sugg;
                this.form.submit();
            });
            this.suggestionsBox.appendChild(item);
        });
        
        this.suggestionsBox.classList.add('active');
        this.currentFocus = -1;
    }

    handleKeyboardNav(e) {
        const items = this.suggestionsBox.querySelectorAll('.suggestion-item');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.currentFocus++;
            this.setActiveSuggestion(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.currentFocus--;
            this.setActiveSuggestion(items);
        } else if (e.key === 'Enter') {
            if (this.currentFocus > -1 && items.length > 0) {
                e.preventDefault();
                items[this.currentFocus].click();
            }
        }
    }

    setActiveSuggestion(items) {
        if (!items || items.length === 0) return;
        items.forEach(item => item.classList.remove('focused'));
        if (this.currentFocus >= items.length) this.currentFocus = 0;
        if (this.currentFocus < 0) this.currentFocus = items.length - 1;
        items[this.currentFocus].classList.add('focused');
        this.input.value = items[this.currentFocus].innerText.trim();
    }

    // ==========================================
    // 5. PREMIUM SHORTCUTS
    // ==========================================
    initShortcuts() {
        this.grid = document.getElementById('shortcuts-grid');
        if (!this.grid) return;

        const defaultShortcuts = [
            { title: 'Web Store', url: 'https://chrome.google.com/webstore' },
            { title: 'YouTube', url: 'https://youtube.com' },
            { title: 'Kitforge', url: 'https://kitforge.com' },
            { title: 'Render', url: 'https://render.com' },
            { title: 'Fiverr', url: 'https://fiverr.com' }
        ];

        this.shortcuts = JSON.parse(localStorage.getItem('premiumShortcuts_v4'));
        if (!this.shortcuts) {
            this.shortcuts = defaultShortcuts;
            this.saveShortcuts();
        }

        this.renderShortcuts();
    }

    saveShortcuts() {
        localStorage.setItem('premiumShortcuts_v4', JSON.stringify(this.shortcuts));
    }

    renderShortcuts() {
        this.grid.innerHTML = '';

        this.shortcuts.forEach((item, index) => {
            const card = document.createElement('a');
            card.href = item.url;
            card.className = 'shortcut-card premium-glass';
            
            const iconUrl = `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(item.url)}`;
            
            card.innerHTML = `
                <div class="shortcut-icon">
                    <img src="${iconUrl}" alt="${item.title}" loading="lazy">
                </div>
                <span class="shortcut-title">${item.title}</span>
            `;

            // Плавное удаление
            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (confirm(`Remove shortcut "${item.title}"?`)) {
                    card.style.transform = 'scale(0.8)';
                    card.style.opacity = '0';
                    setTimeout(() => {
                        this.shortcuts.splice(index, 1);
                        this.saveShortcuts();
                        this.renderShortcuts();
                    }, 250);
                }
            });

            this.grid.appendChild(card);
        });

        const addBtn = document.createElement('div');
        addBtn.className = 'shortcut-card add-btn premium-glass';
        addBtn.innerHTML = `
            <div class="shortcut-icon">
                <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
            </div>
            <span class="shortcut-title">Add New</span>
        `;
        
        addBtn.onclick = () => {
            const url = prompt('Enter URL (e.g., github.com):');
            if (url) {
                const title = prompt('Enter Name:');
                if (title) {
                    let finalUrl = url.startsWith('http') ? url : 'https://' + url;
                    this.shortcuts.push({ title, url: finalUrl });
                    this.saveShortcuts();
                    this.renderShortcuts();
                }
            }
        };

        this.grid.appendChild(addBtn);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.Dashboard = new DashboardController();
    
    // Force reset scroll on load in case browser cached it
    const dash = document.querySelector('.dashboard');
    if (dash) {
        dash.scrollTop = 0;
    }
});
