(function () {
    'use strict';

    /*
     * LAMPA — СТАТИСТИКА ПЕРЕГЛЯДІВ
     * Версія 8.1
     *
     * Можливості:
     * - пункт «Статистика» у головному меню;
     * - підрахунок часу перегляду;
     * - підрахунок переглянутих фільмів;
     * - підрахунок переглянутих серій;
     * - збереження статистики після перезапуску Lampa;
     * - можливість вимкнути збір статистики;
     * - можливість приховати пункт меню.
     */

    if (window.lampa_ukrainian_stats_v81) return;
    window.lampa_ukrainian_stats_v81 = true;


    /* ============================================================
     * ЛОКАЛІЗАЦІЯ — УКРАЇНСЬКА
     * ============================================================ */

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

        collect_setting:
            'Збирати статистику переглядів',

        menu_setting:
            'Показувати статистику в головному меню',

        settings_title:
            'Статистика переглядів',

        reset:
            'Скинути статистику',

        reset_confirm:
            'Ви впевнені, що хочете скинути всю статистику переглядів?',

        reset_done:
            'Статистику переглядів скинуто.'
    };


    /* ============================================================
     * НАЛАШТУВАННЯ
     * ============================================================ */

    const CONFIG = {

        stats_storage:
            'lampa_personal_stats',

        collect_storage:
            'stats_collect',

        menu_storage:
            'stats_menu_visible',

        menu_action:
            'lampa_ukrainian_stats',

        activity:
            'lampa_ukrainian_stats_view',

        completion:
            0.85,

        interval:
            1000
    };


    /* ============================================================
     * БАЗА СТАТИСТИКИ
     * ============================================================ */

    const DEFAULT_STATS = {

        seconds_watched: 0,

        movies_watched: 0,

        episodes_watched: 0,

        completed: {}
    };


    const StatsDB = {

        data: null,


        init() {

            let saved = null;

            try {
                saved = Lampa.Storage.get(
                    CONFIG.stats_storage
                );
            } catch (e) {
                saved = null;
            }


            if (
                !saved ||
                typeof saved !== 'object'
            ) {

                this.data =
                    JSON.parse(
                        JSON.stringify(DEFAULT_STATS)
                    );

                this.save();

                return;
            }


            this.data = Object.assign(
                JSON.parse(
                    JSON.stringify(DEFAULT_STATS)
                ),
                saved
            );


            if (
                !this.data.completed ||
                typeof this.data.completed !== 'object'
            ) {

                this.data.completed = {};
            }


            this.normalize();
        },


        normalize() {

            if (
                !Number.isFinite(
                    this.data.seconds_watched
                )
            ) {

                this.data.seconds_watched = 0;
            }


            if (
                !Number.isFinite(
                    this.data.movies_watched
                )
            ) {

                this.data.movies_watched = 0;
            }


            if (
                !Number.isFinite(
                    this.data.episodes_watched
                )
            ) {

                this.data.episodes_watched = 0;
            }


            this.data.seconds_watched =
                Math.max(
                    0,
                    Math.floor(
                        this.data.seconds_watched
                    )
                );


            this.data.movies_watched =
                Math.max(
                    0,
                    Math.floor(
                        this.data.movies_watched
                    )
                );


            this.data.episodes_watched =
                Math.max(
                    0,
                    Math.floor(
                        this.data.episodes_watched
                    )
                );
        },


        save() {

            this.normalize();

            try {

                Lampa.Storage.set(
                    CONFIG.stats_storage,
                    this.data
                );

            } catch (e) {

                console.error(
                    'Статистика Lampa: помилка збереження',
                    e
                );
            }
        },


        reset() {

            this.data =
                JSON.parse(
                    JSON.stringify(DEFAULT_STATS)
                );

            this.save();
        },


        getFormattedTime() {

            const seconds =
                Math.max(
                    0,
                    Math.floor(
                        this.data.seconds_watched || 0
                    )
                );


            const totalMinutes =
                Math.floor(seconds / 60);


            const days =
                Math.floor(
                    totalMinutes / 1440
                );


            const hours =
                Math.floor(
                    (totalMinutes % 1440) / 60
                );


            const minutes =
                totalMinutes % 60;


            return {
                days,
                hours,
                minutes
            };
        },


        getTimeString() {

            const time =
                this.getFormattedTime();


            if (time.days > 0) {

                return (
                    time.days +
                    ' ' +
                    LANG.days +
                    ' ' +
                    time.hours +
                    ' ' +
                    LANG.hours +
                    ' ' +
                    time.minutes +
                    ' ' +
                    LANG.minutes
                );
            }


            if (time.hours > 0) {

                return (
                    time.hours +
                    ' ' +
                    LANG.hours +
                    ' ' +
                    time.minutes +
                    ' ' +
                    LANG.minutes
                );
            }


            return (
                time.minutes +
                ' ' +
                LANG.minutes
            );
        }
    };


    /* ============================================================
     * НАЛАШТУВАННЯ ПЛАГІНА
     * ============================================================ */

    const Settings = {

        added: false,


        setup() {

            if (
                this.added ||
                !Lampa.SettingsApi ||
                !Lampa.SettingsApi.addParam
            ) {

                return;
            }


            this.added = true;


            if (
                Lampa.Storage.get(
                    CONFIG.collect_storage
                ) === null
            ) {

                Lampa.Storage.set(
                    CONFIG.collect_storage,
                    true
                );
            }


            if (
                Lampa.Storage.get(
                    CONFIG.menu_storage
                ) === null
            ) {

                Lampa.Storage.set(
                    CONFIG.menu_storage,
                    true
                );
            }


            try {

                Lampa.SettingsApi.addParam({

                    component: 'interface',

                    param: {
                        type: 'title'
                    },

                    field: {
                        name:
                            LANG.settings_title
                    }
                });


                Lampa.SettingsApi.addParam({

                    component: 'interface',

                    param: {
                        name:
                            CONFIG.collect_storage,

                        type: 'trigger',

                        default: true
                    },

                    field: {
                        name:
                            LANG.collect_setting
                    }
                });


                Lampa.SettingsApi.addParam({

                    component: 'interface',

                    param: {
                        name:
                            CONFIG.menu_storage,

                        type: 'trigger',

                        default: true
                    },

                    field: {
                        name:
                            LANG.menu_setting
                    },

                    onChange: function () {

                        setTimeout(
                            function () {

                                Menu.update();

                            },
                            100
                        );
                    }
                });

            } catch (e) {

                console.error(
                    'Статистика Lampa: помилка налаштувань',
                    e
                );
            }
        },


        collecting() {

            return (
                Lampa.Storage.get(
                    CONFIG.collect_storage,
                    true
                ) !== false
            );
        },


        menuVisible() {

            return (
                Lampa.Storage.get(
                    CONFIG.menu_storage,
                    true
                ) !== false
            );
        }
    };


    /* ============================================================
     * ВИЗНАЧЕННЯ ПОТОЧНОГО ВІДЕО
     * ============================================================ */

    const Current = {

        getActivity() {

            try {

                if (
                    Lampa.Activity &&
                    typeof Lampa.Activity.active ===
                        'function'
                ) {

                    return Lampa.Activity.active();
                }

            } catch (e) {}

            return null;
        },


        getMovie() {

            const activity =
                this.getActivity();


            if (!activity) return null;


            if (
                activity.movie &&
                typeof activity.movie === 'object'
            ) {

                return activity.movie;
            }


            if (
                activity.object &&
                activity.object.movie
            ) {

                return activity.object.movie;
            }


            return null;
        },


        getPlayer() {

            try {

                if (Lampa.Player) {

                    return Lampa.Player;
                }

            } catch (e) {}

            return null;
        },


        getVideoState() {

            const player =
                this.getPlayer();


            if (!player) return null;


            let time = null;
            let duration = null;


            try {

                if (
                    typeof player.time ===
                    'function'
                ) {

                    time =
                        Number(
                            player.time()
                        );
                }

            } catch (e) {}


            try {

                if (
                    typeof player.duration ===
                    'function'
                ) {

                    duration =
                        Number(
                            player.duration()
                        );
                }

            } catch (e) {}


            if (
                !Number.isFinite(time) &&
                Number.isFinite(player.time)
            ) {

                time =
                    Number(player.time);
            }


            if (
                !Number.isFinite(duration) &&
                Number.isFinite(player.duration)
            ) {

                duration =
                    Number(player.duration);
            }


            try {

                if (
                    player.video &&
                    typeof player.video.currentTime ===
                    'number'
                ) {

                    time =
                        player.video.currentTime;
                }


                if (
                    player.video &&
                    typeof player.video.duration ===
                    'number'
                ) {

                    duration =
                        player.video.duration;
                }

            } catch (e) {}


            if (
                !Number.isFinite(time) ||
                !Number.isFinite(duration) ||
                duration <= 0
            ) {

                return null;
            }


            return {

                time:
                    Math.max(
                        0,
                        time
                    ),

                duration:
                    Math.max(
                        0,
                        duration
                    )
            };
        }
    };


    /* ============================================================
     * ІНФОРМАЦІЯ ПРО ФІЛЬМ / СЕРІЮ
     * ============================================================ */

    const Media = {

        getId(movie) {

            if (!movie) {
                return 'unknown';
            }


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


            const season =
                movie.season_number ||
                movie.season ||
                0;


            const episode =
                movie.episode_number ||
                movie.episode ||
                0;


            return [
                String(id),
                String(season),
                String(episode)
            ].join(':');
        },


        isEpisode(movie) {

            if (!movie) {
                return false;
            }


            return !!(
                movie.episode ||
                movie.episode_number
            );
        }
    };


    /* ============================================================
     * ТРЕКЕР ПЕРЕГЛЯДУ
     * ============================================================ */

    const Tracker = {

        timer: null,

        initialized: false,

        state: {

            id: '',

            time: 0,

            duration: 0,

            timestamp: 0
        },


        init() {

            if (this.initialized) {
                return;
            }


            this.initialized = true;


            this.timer =
                setInterval(
                    () => {

                        this.tick();

                    },
                    CONFIG.interval
                );
        },


        resetState() {

            this.state = {

                id: '',

                time: 0,

                duration: 0,

                timestamp: 0
            };
        },


        tick() {

            if (!Settings.collecting()) {

                return;
            }


            const movie =
                Current.getMovie();


            if (!movie) {

                this.resetState();

                return;
            }


            const video =
                Current.getVideoState();


            if (!video) {

                return;
            }


            const id =
                Media.getId(movie);


            const now =
                Date.now();


            /*
             * Початок нового перегляду.
             */

            if (
                this.state.id !== id
            ) {

                this.state = {

                    id,

                    time:
                        video.time,

                    duration:
                        video.duration,

                    timestamp:
                        now
                };

                return;
            }


            /*
             * Перемотування назад.
             */

            if (
                video.time <
                this.state.time - 5
            ) {

                this.state.time =
                    video.time;

                this.state.timestamp =
                    now;

                return;
            }


            const realDelta =
                Math.max(
                    0,
                    (now -
                        this.state.timestamp) /
                    1000
                );


            const videoDelta =
                Math.max(
                    0,
                    video.time -
                    this.state.time
                );


            /*
             * Не дозволяємо перемотуванню
             * штучно збільшувати час перегляду.
             */

            let watchedDelta =
                Math.min(
                    videoDelta,
                    realDelta + 10
                );


            if (
                watchedDelta <= 0 &&
                realDelta > 0 &&
                realDelta <= 5
            ) {

                watchedDelta =
                    realDelta;
            }


            if (watchedDelta > 0) {

                StatsDB.data.seconds_watched +=
                    Math.floor(
                        watchedDelta
                    );
            }


            /*
             * Перевіряємо, чи завершено фільм/серію.
             */

            const percent =
                video.time /
                video.duration;


            if (
                percent >=
                CONFIG.completion
            ) {

                this.markCompleted(
                    movie,
                    id
                );
            }


            StatsDB.save();


            this.state.time =
                video.time;

            this.state.duration =
                video.duration;

            this.state.timestamp =
                now;
        },


        markCompleted(movie, id) {

            /*
             * Не рахуємо один і той самий
             * фільм/епізод повторно.
             */

            if (
                StatsDB.data.completed[id]
            ) {

                return;
            }


            StatsDB.data.completed[id] = {
                date: Date.now()
            };


            if (
                Media.isEpisode(movie)
            ) {

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

            const render =
                $('<div class="lampa-stats-view"></div>');


            this.dom = render;


            render.append(
                '<div class="lampa-stats-title">' +
                LANG.page_title +
                '</div>'
            );


            if (
                !Settings.collecting()
            ) {

                render.append(
                    '<div class="lampa-stats-disabled">' +
                    LANG.disabled_text +
                    '</div>'
                );
            }


            const hasData =
                (
                    StatsDB.data.seconds_watched > 0 ||
                    StatsDB.data.movies_watched > 0 ||
                    StatsDB.data.episodes_watched > 0
                );


            if (!hasData) {

                render.append(
                    this.renderEmptyState()
                );

            } else {

                render.append(
                    this.renderSummary()
                );

                render.append(
                    this.renderResetButton()
                );
            }


            return render;
        },


        renderEmptyState() {

            return $(
                '<div class="lampa-stats-empty selector">' +
                LANG.empty_text +
                '</div>'
            );
        },


        renderSummary() {

            const summary =
                $('<div class="lampa-stats-summary"></div>');


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


        renderCard(
            label,
            value,
            icon
        ) {

            const card =
                $('<div class="lampa-stats-card selector"></div>');


            card.append(
                '<div class="lampa-stats-card-icon">' +
                icon +
                '</div>'
            );


            const content =
                $('<div class="lampa-stats-card-content"></div>');


            content.append(
                '<div class="lampa-stats-card-label">' +
                label +
                '</div>'
            );


            content.append(
                '<div class="lampa-stats-card-value">' +
                value +
                '</div>'
            );


            card.append(content);


            return card;
        },


        renderResetButton() {

            const button =
                $(
                    '<div class="lampa-stats-reset selector">' +
                    LANG.reset +
                    '</div>'
                );


            button.on(
                'hover:enter click',
                function () {

                    if (
                        confirm(
                            LANG.reset_confirm
                        )
                    ) {

                        StatsDB.reset();


                        Lampa.Noty.show(
                            LANG.reset_done
                        );


                        if (
                            this.dom
                        ) {

                            this.start();
                        }
                    }
                }.bind(this)
            );


            return button;
        },


        onfocus() {

            if (!this.dom) {
                return;
            }


            try {

                Lampa.Focus.set({
                    element:
                        this.dom.find(
                            '.selector'
                        )
                });

            } catch (e) {}
        },


        destroy() {

            if (this.dom) {

                this.dom
                    .empty()
                    .remove();

                this.dom = null;
            }
        }
    };


    /* ============================================================
     * МЕНЮ
     * ============================================================ */

    const Menu = {

        selector:
            '.menu .menu__list',


        createItem() {

            const item =
                $(`
                    <li
                        class="menu__item selector"
                        data-action="${CONFIG.menu_action}"
                    >

                        <div class="menu__ico">

                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >

                                <path d="M18 20V10"></path>

                                <path d="M12 20V4"></path>

                                <path d="M6 20V14"></path>

                            </svg>

                        </div>

                        <div class="menu__text">
                            ${LANG.menu_title}
                        </div>

                    </li>
                `);


            item.on(
                'hover:enter click',
                function () {

                    try {

                        $('body')
                            .removeClass(
                                'menu--open'
                            );

                    } catch (e) {}


                    Lampa.Activity.push({

                        url:
                            'stats',

                        title:
                            LANG.menu_title,

                        component:
                            CONFIG.activity,

                        page: 1
                    });
                }
            );


            return item;
        },


        update() {

            const visible =
                Settings.menuVisible();


            const old =
                $(
                    '.menu__item[data-action="' +
                    CONFIG.menu_action +
                    '"]'
                );


            if (!visible) {

                old.remove();

                return;
            }


            if (old.length) {

                return;
            }


            const menu =
                $(this.selector).first();


            if (!menu.length) {

                return;
            }


            const item =
                this.createItem();


            /*
             * Намагання поставити пункт
             * поруч з історією.
             */

            const history =
                menu.find(
                    '.menu__item[data-action="history"]'
                );


            if (history.length) {

                history.after(item);

            } else {

                menu.append(item);
            }
        },


        init() {

            const self = this;


            /*
             * Перша спроба після завантаження Lampa.
             */

            setTimeout(
                function () {

                    self.update();

                },
                500
            );


            /*
             * Декілька додаткових перевірок,
             * оскільки Lampa може перерисувати меню.
             */

            let attempts = 0;


            const timer =
                setInterval(
                    function () {

                        self.update();

                        attempts++;


                        if (
                            attempts >= 30
                        ) {

                            clearInterval(timer);
                        }

                    },
                    1000
                );
        }
    };


    /* ============================================================
     * CSS
     * ============================================================ */

    const CSS = `

        .lampa-stats-view {
            padding: 25px;
            color: #fff;
            box-sizing: border-box;
        }


        .lampa-stats-title {
            font-size: 26px;
            font-weight: 700;
            margin-bottom: 25px;
            color: #fff;
        }


        .lampa-stats-summary {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-bottom: 25px;
        }


        .lampa-stats-card {
            display: flex;
            align-items: center;

            min-width: 230px;

            padding: 18px;

            border-radius: 10px;

            background:
                rgba(
                    255,
                    255,
                    255,
                    0.06
                );

            border:
                2px solid transparent;

            box-sizing: border-box;
        }


        .lampa-stats-card:focus {
            outline: none;

            border-color:
                rgba(
                    255,
                    255,
                    255,
                    0.5
                );

            background:
                rgba(
                    255,
                    255,
                    255,
                    0.12
                );
        }


        .lampa-stats-card-icon {
            width: 45px;
            min-width: 45px;

            font-size: 25px;

            opacity: 0.8;
        }


        .lampa-stats-card-content {
            padding-left: 12px;
        }


        .lampa-stats-card-label {
            font-size: 12px;

            opacity: 0.55;

            text-transform: uppercase;
        }


        .lampa-stats-card-value {
            margin-top: 5px;

            font-size: 21px;

            font-weight: 700;
        }


        .lampa-stats-empty {
            max-width: 700px;

            padding: 40px 25px;

            border-radius: 10px;

            background:
                rgba(
                    255,
                    255,
                    255,
                    0.04
                );

            color:
                rgba(
                    255,
                    255,
                    255,
                    0.55
                );

            text-align: center;

            border:
                2px solid transparent;
        }


        .lampa-stats-empty:focus {
            outline: none;

            border-color:
                rgba(
                    255,
                    255,
                    255,
                    0.5
                );
        }


        .lampa-stats-disabled {
            max-width: 700px;

            padding: 15px 20px;

            margin-bottom: 20px;

            border-radius: 8px;

            background:
                rgba(
                    255,
                    80,
                    80,
                    0.10
                );

            color:
                rgba(
                    255,
                    140,
                    140,
                    1
                );
        }


        .lampa-stats-reset {
            display: inline-block;

            padding: 14px 20px;

            border-radius: 8px;

            background:
                rgba(
                    255,
                    255,
                    255,
                    0.06
                );

            color:
                rgba(
                    255,
                    255,
                    255,
                    0.65
                );

            border:
                2px solid transparent;
        }


        .lampa-stats-reset:focus {
            outline: none;

            border-color:
                rgba(
                    255,
                    255,
                    255,
                    0.5
                );

            background:
                rgba(
                    255,
                    255,
                    255,
                    0.12
                );
        }

    `;


    /* ============================================================
     * ПІДКЛЮЧЕННЯ CSS
     * ============================================================ */

    function installCSS() {

        if (
            document.getElementById(
                'lampa-ukrainian-stats-style'
            )
        ) {

            return;
        }


        const style =
            document.createElement(
                'style'
            );


        style.id =
            'lampa-ukrainian-stats-style';


        style.innerHTML =
            CSS;


        document.head.appendChild(
            style
        );
    }


    /* ============================================================
     * ЗАПУСК ПЛАГІНА
     * ============================================================ */

    function init() {

        try {

            if (!window.Lampa) {

                console.error(
                    'Статистика Lampa: Lampa API недоступний.'
                );

                return;
            }


            StatsDB.init();


            installCSS();


            Settings.setup();


            if (
                Lampa.Activity &&
                Lampa.Activity.define
            ) {

                Lampa.Activity.define(
                    CONFIG.activity,
                    StatsActivity
                );
            }


            Tracker.init();


            Menu.init();


            console.log(
                'Lampa — Статистика переглядів: плагін запущено.'
            );

        } catch (error) {

            console.error(
                'Lampa — Статистика переглядів: помилка запуску',
                error
            );
        }
    }


    /* ============================================================
     * ОЧІКУВАННЯ ГОТОВНОСТІ LAMPA
     * ============================================================ */

    if (window.appready) {

        setTimeout(
            init,
            100
        );

    } else if (
        Lampa.Listener &&
        Lampa.Listener.follow
    ) {

        Lampa.Listener.follow(
            'app',
            function (event) {

                if (
                    event.type === 'ready'
                ) {

                    setTimeout(
                        init,
                        100
                    );
                }
            }
        );

    } else {

        setTimeout(
            init,
            1500
        );
    }

})();
