(function () {
    'use strict';

    if (window.lampa_stats_plugin_v5) return;
    window.lampa_stats_plugin_v5 = true;

    // --- Локалізація (Українська) ---
    const LANG = {
        menu_title: 'Статистика',
        page_title: 'МОЯ СТАТИСТИКА ПЕРЕГЛЯДІВ',
        total_time: 'СУМАРНИЙ ЧАС',
        days_hours: '{days} дн. {hours} год. {minutes} хв.',
        watched: 'ПЕРЕГЛЯНУТО',
        movies_episodes: '{movies} фільмів / {episodes} серій',
        empty_text: 'Тут поки що порожньо. Почніть дивитися фільми або серіали!',
        fav_genre: 'УЛЮБЛЕНИЙ ЖАНР',
        actors_title: 'ВАШІ УЛЮБЛЕНІ АКТОРИ (Демо)',
        chart_genre_title: 'РОЗПОДІЛ ЖАНРІВ (Демо)',
        records_title: 'РЕКОРДИ (Демо)',
        records_oct: 'Жовтень (120 год.)',
        records_sat: 'Субота, 21:00'
    };

    // --- Локальна База Даних Плагіна ---
    const DEFAULT_STATS = {
        seconds_watched: 0,
        movies_watched: 0,
        episodes_watched: 0
    };

    const StatsDB = {
        data: Lampa.Storage.get('lampa_personal_stats', DEFAULT_STATS),

        save() {
            for (const key in DEFAULT_STATS) {
                if (typeof this.data[key] !== 'number' || this.data[key] < 0) {
                    this.data[key] = DEFAULT_STATS[key];
                }
            }
            Lampa.Storage.set('lampa_personal_stats', this.data);
        },

        getFormattedTime() {
            const totalMins = Math.floor((this.data.seconds_watched || 0) / 60);
            const days = Math.floor(totalMins / (24 * 60));
            const hours = Math.floor((totalMins % (24 * 60)) / 60);
            const mins = totalMins % 60;
            return { days, hours, mins };
        }
    };

    // --- Універсальний Трекер ---
    const Tracker = {
        view_cache: {},
        initialized: false,

        init() {
            if (this.initialized) return;
            this.initialized = true;

            const initialViews = Lampa.Storage.get('file_view', {});
            const now = Date.now();
            for (const hash in initialViews) {
                this.view_cache[hash] = {
                    time: initialViews[hash].time || 0,
                    ts: now
                };
            }

            const origSet = Lampa.Storage.set;
            // ФИКС: Используем классическую функцию для сохранения контекста 'this'
            Lampa.Storage.set = function (name, value) {
                if (name === 'file_view' && Lampa.Storage.get('stats_collect', true)) {
                    Tracker.processFileViewUpdate(value);
                }
                // Обязательно передаем контекст дальше
                return origSet.apply(this, arguments);
            };
        },

        processFileViewUpdate(newViews) {
            const now = Date.now();
            for (const hash in newViews) {
                const curr = newViews[hash];
                const cached = this.view_cache[hash];

                if (!cached) {
                    this.view_cache[hash] = { time: curr.time || 0, ts: now };
                    continue;
                }

                if (curr.time === cached.time) continue;

                const videoDelta = (curr.time || 0) - cached.time;
                const realDelta = Math.floor((now - cached.ts) / 1000);

                if (videoDelta <= 0) {
                    this.view_cache[hash] = { time: curr.time || 0, ts: now };
                    continue;
                }

                const actualWatched = Math.min(videoDelta, realDelta + 15);
                if (actualWatched <= 0) {
                    this.view_cache[hash] = { time: curr.time || 0, ts: now };
                    continue;
                }

                StatsDB.data.seconds_watched = (StatsDB.data.seconds_watched || 0) + actualWatched;

                const duration = curr.duration || 1;
                const percentNow = (curr.time || 0) / duration;
                const percentBefore = cached.time / duration;

                if (percentNow >= 0.85 && percentBefore < 0.85) {
                    const isTv = this.isTvShow();
                    if (isTv) {
                        StatsDB.data.episodes_watched = (StatsDB.data.episodes_watched || 0) + 1;
                    } else {
                        StatsDB.data.movies_watched = (StatsDB.data.movies_watched || 0) + 1;
                    }
                }

                StatsDB.save();
                this.view_cache[hash] = { time: curr.time || 0, ts: now };
            }
        },

        isTvShow() {
            const active = Lampa.Activity.active();
            return !!(active && active.movie && active.movie.name);
        }
    };

    // --- Налаштування плагіна ---
    const Settings = {
        added: false,

        setup() {
            if (!Lampa.SettingsApi || !Lampa.SettingsApi.addParam) return;
            if (this.added) return;
            this.added = true;

            const targetComponent = 'interface';
            if (Lampa.Storage.get('stats_collect') === null) Lampa.Storage.set('stats_collect', true);
            if (Lampa.Storage.get('stats_menu_visible') === null) Lampa.Storage.set('stats_menu_visible', true);

            Lampa.SettingsApi.addParam({
                component: targetComponent,
                param: { type: 'title' },
                field: { name: 'Статистика (Stats Plugin)' }
            });

            Lampa.SettingsApi.addParam({
                component: targetComponent,
                param: { name: 'stats_collect', type: 'trigger', default: true },
                field: { name: 'Збирати статистику переглядів' }
            });

            Lampa.SettingsApi.addParam({
                component: targetComponent,
                param: { name: 'stats_menu_visible', type: 'trigger', default: true },
                field: { name: 'Відображати розділ у головному меню' },
                onChange: () => Menu.updateVisibility()
            });
        }
    };

    // --- Логіка відображення меню ---
    const Menu = {
        intervalId: null,

        startPolling() {
            if (this.intervalId) return;
            // ФИКС: Возвращаем setInterval. Делать DOM-запросы 60 раз в секунду не нужно.
            this.intervalId = setInterval(() => {
                this.updateVisibility();
            }, 1000);
        },

        stopPolling() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
        },

        updateVisibility() {
            const isVisible = Lampa.Storage.get('stats_menu_visible', true);
            const existingItem = $('.menu__item[data-action="lampa_stats"]');
            
            if (!isVisible) {
                existingItem.remove();
                return;
            }
            if (existingItem.length) return;
            if ($('.menu__list').length === 0) return;

            const menuItem = $(`<li class="menu__item selector" data-action="lampa_stats">
                <div class="menu__ico">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 20V10"></path>
                        <path d="M12 20V4"></path>
                        <path d="M6 20V14"></path>
                    </svg>
                </div>
                <div class="menu__text">${LANG.menu_title}</div>
            </li>`);

            menuItem.on('hover:enter click', () => {
                if ($('body').hasClass('menu--open')) {
                    $('body').removeClass('menu--open');
                }
                Lampa.Activity.push({
                    url: 'stats.view',
                    title: LANG.menu_title,
                    component: 'lampa_stats_view',
                    page: 1
                });
            });

            const historyItem = $('.menu__item[data-action="history"]');
            if (historyItem.length) {
                historyItem.after(menuItem);
            } else {
                $('.menu__list').append(menuItem);
            }
        }
    };

    // --- Визначення екрану Activity ---
    const StatsActivity = {
        start() {
            const render = Lampa.Template.get('activity_lampa_stats_view', {});
            this.dom = render;

            render.append(`<div class="lampa-stats-title">${LANG.page_title}</div>`);

            if (!Lampa.Storage.get('stats_collect', true)) {
                render.append('<div style="color:#F56565; margin-bottom:20px;">Збір статистики наразі вимкнено в налаштуваннях Інтерфейсу.</div>');
            }

            if ((StatsDB.data.seconds_watched || 0) === 0) {
                render.append(this.renderEmptyState());
            } else {
                render.append(this.renderSummary());
                render.append(this.renderDemoNotice());
            }

            render.addClass('lampa-stats-view');
            render.onfocus = this.onfocus.bind(this);
        },

        renderEmptyState() {
            return $(`<div class="lampa-stats-empty selector" tabindex="0">${LANG.empty_text}</div>`);
        },

        renderSummary() {
            const timeData = StatsDB.getFormattedTime();
            const timeString = LANG.days_hours
                .replace('{days}', timeData.days)
                .replace('{hours}', timeData.hours)
                .replace('{minutes}', timeData.mins);

            const watchedString = LANG.movies_episodes
                .replace('{movies}', StatsDB.data.movies_watched || 0)
                .replace('{episodes}', StatsDB.data.episodes_watched || 0);

            const summary = $('<div class="lampa-stats-summary"></div>');
            summary.append(this.renderSummaryCard(LANG.total_time, timeString, '<i class="fa fa-clock-o"></i>'));
            summary.append(this.renderSummaryCard(LANG.watched, watchedString, '<i class="fa fa-film"></i>'));
            return summary;
        },

        renderSummaryCard(label, value, iconHtml) {
            const card = $('<div class="lampa-stats-card selector" tabindex="0"></div>');
            card.append(`<div class="lampa-stats-card-icon">${iconHtml}</div>`);
            const content = $('<div class="lampa-stats-card-content"></div>');
            content.append(`<div class="lampa-stats-card-label">${label}</div>`);
            content.append(`<div class="lampa-stats-card-value">${value}</div>`);
            card.append(content);
            return card;
        },

        renderDemoNotice() {
            return $('<div style="color:#a0aec0; margin-top:20px; font-size:14px; text-align:center;">* Графіки нижче використовують демонстраційні дані для тестування дизайну *</div>');
        },

        onfocus() {
            const render = this.dom;
            Lampa.Focus.set({ element: render.find('.selector') });
        },

        destroy() {
            if (this.dom) {
                this.dom.empty().remove();
            }
        }
    };

    // --- CSS Стилі ---
    const CSS_STYLES = `
        :root {
            --stats-bg: rgba(255,255,255,0.05);
            --stats-bg-empty: rgba(255,255,255,0.02);
            --stats-border-focus: #3182CE;
            --stats-shadow-focus: rgba(49,130,206,0.5);
            --stats-text: #fff;
            --stats-text-secondary: #a0aec0;
            --stats-error: #F56565;
        }

        .lampa-stats-view { padding: 20px; color: var(--stats-text); font-family: sans-serif; }
        .lampa-stats-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: var(--stats-text); }
        .lampa-stats-summary { display: flex; gap: 15px; margin-bottom: 25px; }
        .lampa-stats-card { background: var(--stats-bg); padding: 15px; border-radius: 8px; flex: 1; display: flex; align-items: center; gap: 10px; border: 2px solid transparent; transition: border-color 0.2s, box-shadow 0.2s; }
        .lampa-stats-card:focus { border-color: var(--stats-border-focus); box-shadow: 0 0 10px var(--stats-shadow-focus); outline: none; background: rgba(255,255,255,0.1); }
        .lampa-stats-card-icon { font-size: 24px; color: var(--stats-border-focus); }
        .lampa-stats-card-content { flex-grow: 1; }
        .lampa-stats-card-label { font-size: 12px; color: var(--stats-text-secondary); text-transform: uppercase; }
        .lampa-stats-card-value { font-size: 18px; font-weight: bold; margin-top: 2px; color: var(--stats-text); }
        .lampa-stats-empty { background: var(--stats-bg-empty); border-radius: 8px; padding: 40px; text-align: center; color: var(--stats-text-secondary); font-size: 16px; margin-bottom: 20px; border: 2px solid transparent; }
        .lampa-stats-empty:focus { border-color: var(--stats-border-focus); outline: none; }
    `;

    // --- Запуск ---
    function init() {
        try {
            if (!Lampa.Template || !Lampa.SettingsApi || !Lampa.Activity) {
                console.warn('Lampa Stats Plugin: Required APIs not available');
                return;
            }

            if (!document.getElementById('lampa-stats-style')) {
                Lampa.Template.add('stats_plugin_styles', `<style id="lampa-stats-style">${CSS_STYLES}</style>`);
                $('body').append(Lampa.Template.get('stats_plugin_styles'));
            }

            Settings.setup();
            Tracker.init();
            Lampa.Activity.define('lampa_stats_view', StatsActivity);

            const waitForMenu = () => {
                if ($('.menu__list').length > 0) {
                    Menu.startPolling();
                } else {
                    setTimeout(waitForMenu, 100);
                }
            };
            waitForMenu();

        } catch (err) {
            console.error('Lampa Stats Plugin init error:', err);
        }
    }

    if (window.appready) {
        init();
    } else if (Lampa.Listener && Lampa.Listener.follow) {
        Lampa.Listener.follow('app', (e) => {
            if (e.type === 'ready') init();
        });
    } else {
        setTimeout(init, 1500);
    }

})();
