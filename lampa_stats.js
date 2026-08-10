(function () {
    'use strict';
    /*
     * LAMPA — СТАТИСТИКА ПЕРЕГЛЯДІВ
     * Версія 8.3
     *
     * - вбудований плеєр: realtime (PlayerVideo + interval)
     * - зовнішній плеєр (VLC / Android): після повернення через Timeline
     * - без подвійного підрахунку (єдиний lastRecorded по id)
     */
    if (window.lampa_ukrainian_stats_v83) return;
    window.lampa_ukrainian_stats_v83 = true;

    const LANG = {
        menu_title: 'Статистика',
        page_title: 'МОЯ СТАТИСТИКА ПЕРЕГЛЯДІВ',
        total_time: 'ЗАГАЛЬНИЙ ЧАС ПЕРЕГЛЯДУ',
        watched: 'ПЕРЕГЛЯНУТО',
        movies: 'ФІЛЬМІВ',
        episodes: 'СЕРІЙ',
        hours: 'год.',
        minutes: 'хв.',
        days: 'дн.',
        empty_text:
            'Тут поки що порожньо. ' +
            'Почніть дивитися фільми або серіали.',
        disabled_text:
            'Збір статистики наразі вимкнено ' +
            'в налаштуваннях.',
        collect_setting: 'Збирати статистику переглядів',
        menu_setting: 'Показувати статистику в головному меню',
        settings_title: 'Статистика переглядів',
        reset: 'Скинути статистику',
        reset_confirm:
            'Ви впевнені, що хочете скинути всю статистику переглядів?',
        reset_done: 'Статистику переглядів скинуто.'
    };

    const CONFIG = {
        stats_storage: 'lampa_personal_stats',
        collect_storage: 'stats_collect',
        menu_storage: 'stats_menu_visible',
        menu_action: 'lampa_ukrainian_stats',
        activity: 'lampa_ukrainian_stats_view',
        completion: 0.85,
        interval: 1000
    };

    const DEFAULT_STATS = {
        seconds_watched: 0,
        movies_watched: 0,
        episodes_watched: 0,
        completed: {},
        last_recorded: {} // id -> last known playback time (sec)
    };

    /* ============================================================
     * БАЗА СТАТИСТИКИ
     * ============================================================ */
    const StatsDB = {
        data: null,

        init() {
            let saved = null;
            try {
                saved = Lampa.Storage.get(CONFIG.stats_storage);
            } catch (e) {
                saved = null;
            }

            if (!saved || typeof saved !== 'object') {
                this.data = JSON.parse(JSON.stringify(DEFAULT_STATS));
                this.save();
                return;
            }

            this.data = Object.assign(
                JSON.parse(JSON.stringify(DEFAULT_STATS)),
                saved
            );

            if (!this.data.completed || typeof this.data.completed !== 'object') {
                this.data.completed = {};
            }
            if (!this.data.last_recorded || typeof this.data.last_recorded !== 'object') {
                this.data.last_recorded = {};
            }

            this.normalize();
        },

        normalize() {
            if (!Number.isFinite(this.data.seconds_watched)) this.data.seconds_watched = 0;
            if (!Number.isFinite(this.data.movies_watched)) this.data.movies_watched = 0;
            if (!Number.isFinite(this.data.episodes_watched)) this.data.episodes_watched = 0;

            this.data.seconds_watched = Math.max(0, Math.floor(this.data.seconds_watched));
            this.data.movies_watched = Math.max(0, Math.floor(this.data.movies_watched));
            this.data.episodes_watched = Math.max(0, Math.floor(this.data.episodes_watched));
        },

        save() {
            this.normalize();
            try {
                Lampa.Storage.set(CONFIG.stats_storage, this.data);
            } catch (e) {
                console.error('Статистика Lampa: помилка збереження', e);
            }
        },

        reset() {
            this.data = JSON.parse(JSON.stringify(DEFAULT_STATS));
            this.save();
        },

        getLastRecorded(id) {
            const v = this.data.last_recorded[id];
            return Number.isFinite(v) ? v : 0;
        },

        setLastRecorded(id, time) {
            this.data.last_recorded[id] = Math.max(0, Math.floor(time));
        },

        /**
         * Додає лише приріст часу (без подвійного підрахунку).
         * Повертає додані секунди.
         */
        addWatchProgress(id, time, duration) {
            if (!id || !Number.isFinite(time) || time < 0) return 0;

            const prev = this.getLastRecorded(id);

            // перемотування назад — просто оновлюємо базу
            if (time < prev - 5) {
                this.setLastRecorded(id, time);
                this.save();
                return 0;
            }

            const delta = Math.max(0, time - prev);

            // захист від аномальних стрибків (наприклад, одразу кінець)
            const maxJump = Number.isFinite(duration) && duration > 0
                ? Math.min(duration, 6 * 3600)
                : 6 * 3600;

            const safeDelta = Math.min(delta, maxJump);

            if (safeDelta > 0) {
                this.data.seconds_watched += Math.floor(safeDelta);
            }

            this.setLastRecorded(id, time);
            this.save();
            return Math.floor(safeDelta);
        },

        getFormattedTime() {
            const seconds = Math.max(0, Math.floor(this.data.seconds_watched || 0));
            const totalMinutes = Math.floor(seconds / 60);
            const days = Math.floor(totalMinutes / 1440);
            const hours = Math.floor((totalMinutes % 1440) / 60);
            const minutes = totalMinutes % 60;
            return { days, hours, minutes };
        },

        getTimeString() {
            const time = this.getFormattedTime();
            if (time.days > 0) {
                return (
                    time.days + ' ' + LANG.days + ' ' +
                    time.hours + ' ' + LANG.hours + ' ' +
                    time.minutes + ' ' + LANG.minutes
                );
            }
            if (time.hours > 0) {
                return (
                    time.hours + ' ' + LANG.hours + ' ' +
                    time.minutes + ' ' + LANG.minutes
                );
            }
            return time.minutes + ' ' + LANG.minutes;
        }
    };

    /* ============================================================
     * НАЛАШТУВАННЯ
     * ============================================================ */
    const Settings = {
        added: false,

        setup() {
            if (this.added || !Lampa.SettingsApi || !Lampa.SettingsApi.addParam) return;
            this.added = true;

            if (Lampa.Storage.get(CONFIG.collect_storage) === null) {
                Lampa.Storage.set(CONFIG.collect_storage, true);
            }
            if (Lampa.Storage.get(CONFIG.menu_storage) === null) {
                Lampa.Storage.set(CONFIG.menu_storage, true);
            }

            try {
                Lampa.SettingsApi.addParam({
                    component: 'interface',
                    param: { type: 'title' },
                    field: { name: LANG.settings_title }
                });

                Lampa.SettingsApi.addParam({
                    component: 'interface',
                    param: {
                        name: CONFIG.collect_storage,
                        type: 'trigger',
                        default: true
                    },
                    field: { name: LANG.collect_setting }
                });

                Lampa.SettingsApi.addParam({
                    component: 'interface',
                    param: {
                        name: CONFIG.menu_storage,
                        type: 'trigger',
                        default: true
                    },
                    field: { name: LANG.menu_setting },
                    onChange: function () {
                        setTimeout(function () {
                            Menu.update();
                        }, 100);
                    }
                });
            } catch (e) {
                console.error('Статистика Lampa: помилка налаштувань', e);
            }
        },

        collecting() {
            return Lampa.Storage.get(CONFIG.collect_storage, true) !== false;
        },

        menuVisible() {
            return Lampa.Storage.get(CONFIG.menu_storage, true) !== false;
        }
    };

    /* ============================================================
     * ПОТОЧНЕ ВІДЕО / ACTIVITY
     * ============================================================ */
    const Current = {
        getActivity() {
            try {
                if (Lampa.Activity && typeof Lampa.Activity.active === 'function') {
                    return Lampa.Activity.active();
                }
            } catch (e) {}
            return null;
        },

        getMovie() {
            const activity = this.getActivity();
            if (!activity) return null;

            if (activity.movie && typeof activity.movie === 'object') return activity.movie;
            if (activity.object && activity.object.movie) return activity.object.movie;
            if (activity.card && typeof activity.card === 'object') return activity.card;
            return null;
        },

        getVideoState() {
            try {
                let video = null;

                if (Lampa.PlayerVideo && typeof Lampa.PlayerVideo.video === 'function') {
                    video = Lampa.PlayerVideo.video();
                }
                if (!video) {
                    video = document.querySelector('.player video') ||
                            document.querySelector('video');
                }
                if (!video) return null;

                let time = Number(video.currentTime);
                let duration = Number(video.duration);

                if (!Number.isFinite(time) && Number.isFinite(video._currentTime)) {
                    time = Number(video._currentTime);
                }
                if (!Number.isFinite(duration) && Number.isFinite(video._duration)) {
                    duration = Number(video._duration);
                }

                if (!Number.isFinite(time) || !Number.isFinite(duration) || duration <= 0) {
                    return null;
                }

                return {
                    time: Math.max(0, time),
                    duration: Math.max(0, duration)
                };
            } catch (e) {
                return null;
            }
        }
    };

    /* ============================================================
     * МЕДІА
     * ============================================================ */
    const Media = {
        getId(movie) {
            if (!movie) return 'unknown';

            const id =
                movie.id ||
                movie.tmdb_id ||
                movie.kinopoisk_id ||
                movie.imdb_id ||
                movie.original_title ||
                movie.original_name ||
                movie.title ||
                movie.name ||
                'unknown';

            const season = movie.season_number || movie.season || 0;
            const episode = movie.episode_number || movie.episode || 0;

            return [String(id), String(season), String(episode)].join(':');
        },

        isEpisode(movie) {
            if (!movie) return false;
            return !!(
                movie.episode ||
                movie.episode_number ||
                (movie.season_number && movie.episode_number) ||
                (movie.season && movie.episode)
            );
        },

        normalizeFromPlayerData(data) {
            if (!data) return null;

            let movie = data.card || data.movie || data;
            if (!movie || typeof movie !== 'object') return null;

            // не клонуємо весь об'єкт без потреби — лише якщо треба дописати s/e
            const season = data.season != null ? data.season : null;
            const episode = data.episode != null ? data.episode : null;

            if (
                (season != null && movie.season_number == null) ||
                (episode != null && movie.episode_number == null)
            ) {
                movie = Object.assign({}, movie);
                if (season != null) {
                    movie.season_number = season;
                    movie.season = season;
                }
                if (episode != null) {
                    movie.episode_number = episode;
                    movie.episode = episode;
                }
            }

            return movie;
        }
    };

    /* ============================================================
     * ТРЕКЕР
     * ============================================================ */
    const Tracker = {
        timer: null,
        initialized: false,
        currentMovie: null,
        sessionId: '',
        // для вбудованого: обмеження приросту wall-clock
        lastTickAt: 0,

        init() {
            if (this.initialized) return;
            this.initialized = true;

            // Старт / зовнішній плеєр
            try {
                if (Lampa.Player && Lampa.Player.listener) {
                    Lampa.Player.listener.follow('start', (e) => {
                        this.onPlayerStart(e);
                    });

                    // деякі збірки шлють 'external'
                    Lampa.Player.listener.follow('external', (e) => {
                        this.onPlayerStart(e);
                    });

                    Lampa.Player.listener.follow('destroy', () => {
                        // не очищуємо currentMovie одразу —
                        // Timeline може прийти трохи пізніше після VLC
                        setTimeout(() => {
                            this.currentMovie = null;
                            this.sessionId = '';
                        }, 3000);
                    });
                }
            } catch (e) {
                console.error('Статистика Lampa: Player listener', e);
            }

            // Timeline — головний канал для зовнішнього VLC
            try {
                if (Lampa.Timeline && Lampa.Timeline.listener) {
                    Lampa.Timeline.listener.follow('update', (e) => {
                        this.onTimelineUpdate(e);
                    });
                }
            } catch (e) {
                console.error('Статистика Lampa: Timeline listener', e);
            }

            // Після повернення з VLC WebView «прокидається»
            try {
                document.addEventListener('visibilitychange', () => {
                    if (!document.hidden) {
                        setTimeout(() => this.onAppResume(), 500);
                    }
                });
            } catch (e) {}

            try {
                window.addEventListener('focus', () => {
                    setTimeout(() => this.onAppResume(), 500);
                });
            } catch (e) {}

            // realtime лише для вбудованого
            this.timer = setInterval(() => this.tick(), CONFIG.interval);
        },

        onPlayerStart(e) {
            const movie = Media.normalizeFromPlayerData(e) || Current.getMovie();
            if (movie) {
                this.currentMovie = movie;
                this.sessionId = Media.getId(movie);
            }
        },

        onAppResume() {
            if (!Settings.collecting()) return;

            // спроба підхопити прогрес, якщо Timeline вже оновився
            const movie = this.currentMovie || Current.getMovie();
            if (!movie) return;

            // додатково: якщо є video — tick сам підхопить
            // якщо немає (зовнішній) — чекаємо Timeline.update
        },

        onTimelineUpdate(e) {
            if (!Settings.collecting()) return;
            if (!e || !e.data) return;

            const road = e.data.road || e.data;
            if (!road) return;

            const time = Number(road.time);
            const duration = Number(road.duration);
            const percent = Number(road.percent);

            if (!Number.isFinite(time) || time < 0) return;

            let movie = this.currentMovie || Current.getMovie();

            // якщо movie немає — пробуємо не оновлювати completed, але час
            // без id надійно не додамо; вимагаємо movie
            if (!movie) return;

            const id = Media.getId(movie);

            StatsDB.addWatchProgress(
                id,
                time,
                Number.isFinite(duration) ? duration : 0
            );

            const doneByPercent =
                Number.isFinite(percent) && percent / 100 >= CONFIG.completion;
            const doneByTime =
                Number.isFinite(duration) &&
                duration > 0 &&
                time / duration >= CONFIG.completion;

            if (doneByPercent || doneByTime) {
                this.markCompleted(movie, id);
            }
        },

        tick() {
            if (!Settings.collecting()) return;

            const movie = this.currentMovie || Current.getMovie();
            if (!movie) return;

            const video = Current.getVideoState();
            if (!video) return; // зовнішній плеєр — тут нічого немає, ок

            const id = Media.getId(movie);
            const now = Date.now();

            // обмеження приросту wall-clock (анти-чит перемотуванням + захист)
            const wallDelta = this.lastTickAt
                ? Math.max(0, (now - this.lastTickAt) / 1000)
                : CONFIG.interval / 1000;
            this.lastTickAt = now;

            const prev = StatsDB.getLastRecorded(id);
            let time = video.time;

            // якщо стрибок часу більший за wall-clock + запас — ріжемо
            if (time > prev) {
                const rawDelta = time - prev;
                const capped = Math.min(rawDelta, wallDelta + 2);
                time = prev + capped;
            }

            StatsDB.addWatchProgress(id, time, video.duration);

            if (video.time / video.duration >= CONFIG.completion) {
                this.markCompleted(movie, id);
            }
        },

        markCompleted(movie, id) {
            if (!id || StatsDB.data.completed[id]) return;

            StatsDB.data.completed[id] = { date: Date.now() };

            if (Media.isEpisode(movie)) {
                StatsDB.data.episodes_watched++;
            } else {
                StatsDB.data.movies_watched++;
            }

            StatsDB.save();
        }
    };

    /* ============================================================
     * ЕКРАН СТАТИСТИКИ
     * ============================================================ */
    const StatsActivity = {
        start() {
            const render = $('<div class="lampa-stats-view"></div>');
            this.dom = render;
            this.buildContent(render);
            return render;
        },

        buildContent(container) {
            container.empty();

            container.append(
                '<div class="lampa-stats-title">' + LANG.page_title + '</div>'
            );

            if (!Settings.collecting()) {
                container.append(
                    '<div class="lampa-stats-disabled">' +
                    LANG.disabled_text +
                    '</div>'
                );
            }

            const hasData =
                StatsDB.data.seconds_watched > 0 ||
                StatsDB.data.movies_watched > 0 ||
                StatsDB.data.episodes_watched > 0;

            if (!hasData) {
                container.append(this.renderEmptyState());
            } else {
                container.append(this.renderSummary());
                container.append(this.renderResetButton());
            }
        },

        refresh() {
            if (this.dom) {
                this.buildContent(this.dom);
                this.onfocus();
            }
        },

        renderEmptyState() {
            return $(
                '<div class="lampa-stats-empty selector">' +
                LANG.empty_text +
                '</div>'
            );
        },

        renderSummary() {
            const summary = $('<div class="lampa-stats-summary"></div>');

            summary.append(
                this.renderCard(
                    LANG.total_time,
                    StatsDB.getTimeString(),
                    '<i class="fa fa-clock-o"></i>'
                )
            );
            summary.append(
                this.renderCard(
                    LANG.movies,
                    StatsDB.data.movies_watched || 0,
                    '<i class="fa fa-film"></i>'
                )
            );
            summary.append(
                this.renderCard(
                    LANG.episodes,
                    StatsDB.data.episodes_watched || 0,
                    '<i class="fa fa-list"></i>'
                )
            );

            return summary;
        },

        renderCard(label, value, icon) {
            const card = $('<div class="lampa-stats-card selector"></div>');
            card.append('<div class="lampa-stats-card-icon">' + icon + '</div>');

            const content = $('<div class="lampa-stats-card-content"></div>');
            content.append(
                '<div class="lampa-stats-card-label">' + label + '</div>'
            );
            content.append(
                '<div class="lampa-stats-card-value">' + value + '</div>'
            );
            card.append(content);
            return card;
        },

        renderResetButton() {
            const button = $(
                '<div class="lampa-stats-reset selector">' + LANG.reset + '</div>'
            );

            button.on('hover:enter click', function () {
                if (confirm(LANG.reset_confirm)) {
                    StatsDB.reset();
                    Lampa.Noty.show(LANG.reset_done);
                    StatsActivity.refresh();
                }
            });

            return button;
        },

        onfocus() {
            if (!this.dom) return;
            try {
                Lampa.Controller.collectionSet(this.dom);
                Lampa.Controller.collectionFocus(false, this.dom);
            } catch (e) {
                try {
                    Lampa.Focus.set({ element: this.dom.find('.selector') });
                } catch (e2) {}
            }
        },

        destroy() {
            if (this.dom) {
                this.dom.empty().remove();
                this.dom = null;
            }
        }
    };

    /* ============================================================
     * МЕНЮ
     * ============================================================ */
    const Menu = {
        selector: '.menu .menu__list',

        createItem() {
            const item = $(`
                <li class="menu__item selector" data-action="${CONFIG.menu_action}">
                    <div class="menu__ico">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" stroke-width="2"
                             stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 20V10"></path>
                            <path d="M12 20V4"></path>
                            <path d="M6 20V14"></path>
                        </svg>
                    </div>
                    <div class="menu__text">${LANG.menu_title}</div>
                </li>
            `);

            item.on('hover:enter click', function () {
                try {
                    $('body').removeClass('menu--open');
                } catch (e) {}

                Lampa.Activity.push({
                    url: 'stats',
                    title: LANG.menu_title,
                    component: CONFIG.activity,
                    page: 1
                });
            });

            return item;
        },

        update() {
            const visible = Settings.menuVisible();
            const old = $(
                '.menu__item[data-action="' + CONFIG.menu_action + '"]'
            );

            if (!visible) {
                old.remove();
                return;
            }
            if (old.length) return;

            const menu = $(this.selector).first();
            if (!menu.length) return;

            const item = this.createItem();
            const history = menu.find('.menu__item[data-action="history"]');

            if (history.length) history.after(item);
            else menu.append(item);
        },

        init() {
            const self = this;
            setTimeout(function () { self.update(); }, 500);

            let attempts = 0;
            const timer = setInterval(function () {
                self.update();
                attempts++;
                if (attempts >= 30) clearInterval(timer);
            }, 1000);
        }
    };

    const CSS = `
        .lampa-stats-view { padding: 25px; color: #fff; box-sizing: border-box; }
        .lampa-stats-title { font-size: 26px; font-weight: 700; margin-bottom: 25px; color: #fff; }
        .lampa-stats-summary { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 25px; }
        .lampa-stats-card {
            display: flex; align-items: center; min-width: 230px; padding: 18px;
            border-radius: 10px; background: rgba(255,255,255,0.06);
            border: 2px solid transparent; box-sizing: border-box;
        }
        .lampa-stats-card:focus {
            outline: none; border-color: rgba(255,255,255,0.5);
            background: rgba(255,255,255,0.12);
        }
        .lampa-stats-card-icon { width: 45px; min-width: 45px; font-size: 25px; opacity: 0.8; }
        .lampa-stats-card-content { padding-left: 12px; }
        .lampa-stats-card-label { font-size: 12px; opacity: 0.55; text-transform: uppercase; }
        .lampa-stats-card-value { margin-top: 5px; font-size: 21px; font-weight: 700; }
        .lampa-stats-empty {
            max-width: 700px; padding: 40px 25px; border-radius: 10px;
            background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.55);
            text-align: center; border: 2px solid transparent;
        }
        .lampa-stats-empty:focus { outline: none; border-color: rgba(255,255,255,0.5); }
        .lampa-stats-disabled {
            max-width: 700px; padding: 15px 20px; margin-bottom: 20px; border-radius: 8px;
            background: rgba(255,80,80,0.10); color: rgba(255,140,140,1);
        }
        .lampa-stats-reset {
            display: inline-block; padding: 14px 20px; border-radius: 8px;
            background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.65);
            border: 2px solid transparent;
        }
        .lampa-stats-reset:focus {
            outline: none; border-color: rgba(255,255,255,0.5);
            background: rgba(255,255,255,0.12);
        }
    `;

    function installCSS() {
        if (document.getElementById('lampa-ukrainian-stats-style')) return;
        const style = document.createElement('style');
        style.id = 'lampa-ukrainian-stats-style';
        style.innerHTML = CSS;
        document.head.appendChild(style);
    }

    function init() {
        try {
            if (!window.Lampa) {
                console.error('Статистика Lampa: Lampa API недоступний.');
                return;
            }

            StatsDB.init();
            installCSS();
            Settings.setup();

            if (Lampa.Activity && Lampa.Activity.define) {
                Lampa.Activity.define(CONFIG.activity, StatsActivity);
            }

            Tracker.init();
            Menu.init();

            console.log('Lampa — Статистика переглядів v8.3 запущено (internal + external/VLC).');
        } catch (error) {
            console.error('Lampa — Статистика: помилка запуску', error);
        }
    }

    if (window.appready) {
        setTimeout(init, 100);
    } else if (window.Lampa && Lampa.Listener && Lampa.Listener.follow) {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') setTimeout(init, 100);
        });
    } else {
        setTimeout(init, 1500);
    }
})();
