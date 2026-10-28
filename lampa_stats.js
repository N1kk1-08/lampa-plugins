(function () {
    'use strict';

    if (window.lampa_ukrainian_stats && window.lampa_ukrainian_stats.initialized) return;
    window.lampa_ukrainian_stats = { initialized: true, version: '0.99.8' };

    var TRANSLATIONS = {
        uk: {
            menu_title: 'Статистика',
            page_title: 'Моя статистика переглядів',
            all_time: 'За весь час',
            month_period: 'Період переглядів',
            total_time: 'СУМАРНИЙ ЧАС',
            watched: 'ПЕРЕГЛЯНУТО',
            fav_genre: 'УЛЮБЛЕНИЙ ЖАНР',
            fav_actors: 'Актори, яких дивитеся найчастіше',
            records: 'За місяцями',
            by_years: 'Роки випуску',
            genre_share: 'Частка серед жанрів',
            legacy_months: 'Попередні дані без року',
            storage_error: 'Не вдалося зберегти статистику. Перевірте вільне місце у сховищі.',
            genres_dist: 'РОЗПОДІЛ ЖАНРІВ',
            level_label: 'РІВЕНЬ',
            level_max: 'Максимальний рівень',
            level_to: 'до',
            movies: 'фільмів',
            episodes: 'серій',
            hours: 'год.',
            minutes: 'хв.',
            days: 'дн.',
            day: 'день',
            empty_text: 'Тут поки що порожньо. Почніть дивитися фільми або серіали.',
            disabled_text: 'Збір статистики вимкнено в налаштуваннях.',
            collect_setting: 'Збирати статистику переглядів',
            menu_setting: 'Показувати статистику в головному меню',
            settings_title: 'Статистика переглядів',
            reset: 'Скинути статистику',
            reset_confirm: 'Скинути всю статистику переглядів?',
            reset_yes: 'Так, скинути',
            reset_no: 'Скасувати',
            reset_done: 'Статистику скинуто.',
            no_genre: '—',
            other_genre: 'Інше',
            no_actors: 'Актори з’являться після переглядів',
            films_short: 'фільмів',
            actor_works: 'Фільми та серіали',
            no_works: 'Поки немає записів',
            film: 'фільм',
            series_ep: 'серія',
            level_up: 'Новий рівень',
            watched_list_title: 'Усі перегляди',
            watched_empty: 'Ще немає завершених переглядів',
            watched_time: 'Час перегляду',
            open_watched: 'Відкрити список',
            movie_forms: ['фільм', 'фільми', 'фільмів'],
            episode_forms: ['серія', 'серії', 'серій'],
            level_names: ['Новачок', 'Глядач', 'Кіноман', 'Марафонець', 'Серіаломан', 'Експерт екрану', 'Критик', 'Колекціонер', 'Легенда кіно', 'Кінобог'],
            months: ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'],
            movie_initial: 'Ф',
            episode_initial: 'С',
            episode_badge: 'СЕР'
        },
        ru: {
            menu_title: 'Статистика',
            page_title: 'Моя статистика просмотров',
            all_time: 'За всё время',
            month_period: 'Период просмотров',
            total_time: 'ОБЩЕЕ ВРЕМЯ',
            watched: 'ПРОСМОТРЕНО',
            fav_genre: 'ЛЮБИМЫЙ ЖАНР',
            fav_actors: 'Актёры, которых смотрите чаще всего',
            records: 'По месяцам',
            by_years: 'Годы выпуска',
            genre_share: 'Доля среди жанров',
            legacy_months: 'Прежние данные без указания года',
            storage_error: 'Не удалось сохранить статистику. Проверьте свободное место в хранилище.',
            genres_dist: 'РАСПРЕДЕЛЕНИЕ ЖАНРОВ',
            level_label: 'УРОВЕНЬ',
            level_max: 'Максимальный уровень',
            level_to: 'до',
            movies: 'фильмов',
            episodes: 'серий',
            hours: 'ч.',
            minutes: 'мин.',
            days: 'дн.',
            day: 'день',
            empty_text: 'Здесь пока пусто. Начните смотреть фильмы или сериалы.',
            disabled_text: 'Сбор статистики отключён в настройках.',
            collect_setting: 'Собирать статистику просмотров',
            menu_setting: 'Показывать статистику в главном меню',
            settings_title: 'Статистика просмотров',
            reset: 'Сбросить статистику',
            reset_confirm: 'Сбросить всю статистику просмотров?',
            reset_yes: 'Да, сбросить',
            reset_no: 'Отмена',
            reset_done: 'Статистика сброшена.',
            no_genre: '—',
            other_genre: 'Другое',
            no_actors: 'Актёры появятся после просмотров',
            films_short: 'фильмов',
            actor_works: 'Фильмы и сериалы',
            no_works: 'Пока нет записей',
            film: 'фильм',
            series_ep: 'серия',
            level_up: 'Новый уровень',
            watched_list_title: 'Все просмотры',
            watched_empty: 'Пока нет завершённых просмотров',
            watched_time: 'Время просмотра',
            open_watched: 'Открыть список',
            movie_forms: ['фильм', 'фильма', 'фильмов'],
            episode_forms: ['серия', 'серии', 'серий'],
            level_names: ['Новичок', 'Зритель', 'Киноман', 'Марафонец', 'Сериаломан', 'Эксперт экрана', 'Критик', 'Коллекционер', 'Легенда кино', 'Кинобог'],
            months: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
            movie_initial: 'Ф',
            episode_initial: 'С',
            episode_badge: 'СЕР'
        },
        en: {
            menu_title: 'Statistics',
            page_title: 'My viewing statistics',
            all_time: 'All time',
            month_period: 'Viewing period',
            total_time: 'TOTAL TIME',
            watched: 'WATCHED',
            fav_genre: 'FAVORITE GENRE',
            fav_actors: 'Actors you watch most often',
            records: 'By month',
            by_years: 'Release years',
            genre_share: 'Share of viewing by genre',
            legacy_months: 'Earlier data without a recorded year',
            storage_error: 'Unable to save statistics. Check the available storage space.',
            genres_dist: 'GENRE DISTRIBUTION',
            level_label: 'LEVEL',
            level_max: 'Maximum level',
            level_to: 'to',
            movies: 'films',
            episodes: 'episodes',
            hours: 'hr',
            minutes: 'min',
            days: 'days',
            day: 'day',
            empty_text: 'Nothing here yet. Start watching films or TV shows.',
            disabled_text: 'Statistics collection is disabled in settings.',
            collect_setting: 'Collect viewing statistics',
            menu_setting: 'Show statistics in the main menu',
            settings_title: 'Viewing statistics',
            reset: 'Reset statistics',
            reset_confirm: 'Reset all viewing statistics?',
            reset_yes: 'Yes, reset',
            reset_no: 'Cancel',
            reset_done: 'Statistics have been reset.',
            no_genre: '—',
            other_genre: 'Other',
            no_actors: 'Actors will appear after you start watching',
            films_short: 'films',
            actor_works: 'Films and TV shows',
            no_works: 'No entries yet',
            film: 'film',
            series_ep: 'episode',
            level_up: 'Level up',
            watched_list_title: 'Viewing history',
            watched_empty: 'No completed views yet',
            watched_time: 'Viewing time',
            open_watched: 'Open list',
            movie_forms: ['film', 'films', 'films'],
            episode_forms: ['episode', 'episodes', 'episodes'],
            level_names: ['Newcomer', 'Viewer', 'Film buff', 'Marathoner', 'Series fan', 'Screen expert', 'Critic', 'Collector', 'Cinema legend', 'Movie god'],
            months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            movie_initial: 'F',
            episode_initial: 'S',
            episode_badge: 'EP'
        }
    };

    var I18n = {
        code: function () {
            var code = '';
            try {
                if (window.Lampa && Lampa.Storage) {
                    if (typeof Lampa.Storage.get === 'function') code = Lampa.Storage.get('language') || '';
                    if (!code && typeof Lampa.Storage.field === 'function') code = Lampa.Storage.field('language') || '';
                }
                if (!code && window.Lampa && Lampa.Lang && typeof Lampa.Lang.selected === 'function') {
                    ['uk', 'ru', 'en'].some(function (value) {
                        if (Lampa.Lang.selected([value])) { code = value; return true; }
                        return false;
                    });
                }
            } catch (e) {}
            if (!code && window.navigator) code = window.navigator.language || '';
            code = String(code || 'uk').trim().toLowerCase().replace(/_/g, '-').split('-')[0];
            if (code === 'ua') code = 'uk';
            return code === 'uk' || code === 'ru' || code === 'en' ? code : 'en';
        },
        noun: function (forms, count) {
            var n = Math.abs(Math.floor(Number(count) || 0));
            var index = n % 100 >= 11 && n % 100 <= 14 ? 2 : (n % 10 === 1 ? 0 : (n % 10 >= 2 && n % 10 <= 4 ? 1 : 2));
            if (this.code() === 'en') index = n === 1 ? 0 : 1;
            return forms[index];
        },
        levelName: function (level, fallback) { return LANG.level_names[level - 1] || fallback || ''; },
        monthName: function (index, fallback) { return LANG.months[index] || fallback || ''; },
        decade: function (year, fallback) {
            if (!year) return fallback || '';
            var short = String(year).slice(-2), code = this.code();
            return short + (code === 'en' ? 's' : (code === 'ru' ? '-е' : (year === 2000 ? '-ні' : '-ті')));
        },
        genreName: function (name) {
            var text = String(name || '').trim().toLowerCase();
            if (['інше', 'другое', 'прочее', 'other'].indexOf(text) >= 0) return LANG.other_genre;
            var keys = Object.keys(GENRE_MAP);
            for (var i = 0; i < keys.length; i++) {
                var id = keys[i];
                if ([GENRE_MAP[id], GENRE_TRANSLATIONS.ru[id], GENRE_TRANSLATIONS.en[id]].some(function (value) { return String(value || '').toLowerCase() === text; })) {
                    var code = this.code();
                    return code === 'uk' ? GENRE_MAP[id] : GENRE_TRANSLATIONS[code][id];
                }
            }
            return name || '';
        }
    };
    var LANG = {};
    Object.keys(TRANSLATIONS.uk).forEach(function (key) {
        Object.defineProperty(LANG, key, { enumerable: true, get: function () { return TRANSLATIONS[I18n.code()][key] || TRANSLATIONS.en[key] || TRANSLATIONS.uk[key]; } });
    });

    var CONFIG = {
        stats_storage: 'lampa_personal_stats_v9',
        session_storage: 'lampa_stats_session_v1',
        collect_storage: 'stats_collect',
        menu_storage: 'stats_menu_visible',
        menu_action: 'lampa_ukrainian_stats',
        activity: 'lampa_ukrainian_stats_view',
        activity_actor: 'lampa_ukrainian_stats_actor',
        activity_watched: 'lampa_ukrainian_stats_watched',
        completion: 0.82,
        interval: 1000,
        tmdb_img: 'https://image.tmdb.org/t/p/w185',
        tmdb_poster: 'https://image.tmdb.org/t/p/w92',
        max_actors_show: 15,
        max_posters_show: 12,
        completed_list_max: 100,
        completed_max: 500,
        meta_max: 400,
        meta_chars_max: 200000,
        stats_chars_max: 600000,
        actor_works_max: 50,
        watch_ids_max: 1500,
        xp_movie_bonus: 3600,
        xp_episode_bonus: 900
    };

    var LEVELS = [
        { level: 1,  name: 'Новачок',        xp: 0 },
        { level: 2,  name: 'Глядач',         xp: 7200 },
        { level: 3,  name: 'Кіноман',        xp: 36000 },
        { level: 4,  name: 'Марафонець',     xp: 108000 },
        { level: 5,  name: 'Серіаломан',     xp: 216000 },
        { level: 6,  name: 'Експерт екрану', xp: 360000 },
        { level: 7,  name: 'Критик',         xp: 540000 },
        { level: 8,  name: 'Колекціонер',    xp: 900000 },
        { level: 9,  name: 'Легенда кіно',   xp: 1440000 },
        { level: 10, name: 'Кінобог',        xp: 2160000 }
    ];

    var GENRE_MAP = {
        28: 'Бойовик', 12: 'Пригоди', 16: 'Мультфільм', 35: 'Комедія',
        80: 'Кримінал', 99: 'Документальний', 18: 'Драма', 10751: 'Сімейний',
        14: 'Фентезі', 36: 'Історичний', 27: 'Жахи', 10402: 'Музика',
        9648: 'Детектив', 10749: 'Мелодрама', 878: 'Фантастика',
        10770: 'Телефільм', 53: 'Трилер', 10752: 'Військовий', 37: 'Вестерн',
        10759: 'Бойовик і пригоди', 10762: 'Дитячий', 10763: 'Новини',
        10764: 'Реаліті', 10765: 'Фантастика і фентезі', 10766: 'Мильна опера',
        10767: 'Ток-шоу', 10768: 'Війна і політика'
    };

    var MONTHS = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];

    // Display labels only: keep GENRE_MAP and stored genre keys unchanged.
    var GENRE_TRANSLATIONS = {
        ru: {
            28: 'Боевик', 12: 'Приключения', 16: 'Мультфильм', 35: 'Комедия',
            80: 'Криминал', 99: 'Документальный', 18: 'Драма', 10751: 'Семейный',
            14: 'Фэнтези', 36: 'История', 27: 'Ужасы', 10402: 'Музыка',
            9648: 'Детектив', 10749: 'Мелодрама', 878: 'Фантастика',
            10770: 'Телевизионный фильм', 53: 'Триллер', 10752: 'Военный', 37: 'Вестерн',
            10759: 'Боевик и приключения', 10762: 'Детский', 10763: 'Новости',
            10764: 'Реалити-шоу', 10765: 'НФ и фэнтези', 10766: 'Мыльная опера',
            10767: 'Ток-шоу', 10768: 'Война и политика'
        },
        en: {
            28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
            80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
            14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
            9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
            10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
            10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News',
            10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
            10767: 'Talk', 10768: 'War & Politics'
        }
    };

    var DEFAULT_STATS = {
        seconds_watched: 0,
        movies_watched: 0,
        episodes_watched: 0,
        completed: {},
        watch_by_id: {},
        watch_updated: {},
        last_recorded: {},
        genres: {},
        actors: {},
        years: {},
        by_month: {},
        by_month_year: {},
        by_weekday: {},
        by_hour: {},
        last_level: 1
    };

    function isGarbageGenre(name) {
        if (!name || typeof name !== 'string') return true;
        var p = name.trim();
        if (!p) return true;
        if (/^\d{1,2}\s*\+$/.test(p)) return true;
        if (/^(США|USA|US|UK|Велика Британія|Великобритания|Україна|Украина|Росія|Россия|Франція|Франция|Німеччина|Германия|Канада|Китай|Японія|Япония|Італія|Италия|Іспанія|Испания|Корея|Індія|Индия)$/i.test(p)) return true;
        if (/^\d{1,2}:\d{2}$/.test(p)) return true;
        if (/\d/.test(p) && /(хв|год|min|сек|сезон|season|ep|runtime|серія|серії|серій|епізод)/i.test(p)) return true;
        if (/^\d{3,4}p$/i.test(p)) return true;
        if (/^(4k|uhd|hdr|dv|3d|cam|ts|hdrip|webrip|web-dl)$/i.test(p)) return true;
        if (/^\d+$/.test(p)) return true;
        if (/^(19|20)\d{2}$/.test(p)) return true;
        if (p.length < 2 || p.length > 48) return true;
        return false;
    }

    function posterUrl(path, size) {
        if (!path) return '';
        var s = String(path).trim();
        if (!s) return '';
        if (/(?:^|\/)img\/(?:img_load|poster|actor|img_broken)\./i.test(s)) return '';
        if (/^https?:\/\//i.test(s)) return s;
        if (/^\/\//.test(s)) return 'https:' + s;
        if (/^(data:|blob:|javascript:|\.\.?\/)/i.test(s) || /(?:^|\/)img\/(?:img_load|poster|actor|img_broken)\./i.test(s)) return '';
        if (!/^\/?[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i.test(s)) return '';
        if (s.charAt(0) !== '/') s = '/' + s;
        size = size || 'w92';
        // Простий CDN — без Lampa.TMDB.image (ламав прев’ю)
        var base = (size === 'w185' || size === 'w300') ? CONFIG.tmdb_img : CONFIG.tmdb_poster;
        if (size === 'w185') base = 'https://image.tmdb.org/t/p/w185';
        else if (size === 'w300') base = 'https://image.tmdb.org/t/p/w300';
        else base = 'https://image.tmdb.org/t/p/w92';
        return base + s;
    }

    function cssImage(url) {
        return 'url("' + String(url).replace(/[\\"\r\n\f]/g, function (c) { return '\\' + c.charCodeAt(0).toString(16) + ' '; }) + '")';
    }

    var StorageIO = {
        warned: false,
        write: function (key, value) {
            var failed = false;
            function failure(error) {
                failed = true;
                if (window.console && console.error) console.error('Lampa stats: storage write failed', key, error && error.name);
            }
            try { Lampa.Storage.set(key, value, false, failure); } catch (e) { failure(e); }
            return !failed;
        },
        warn: function () {
            if (this.warned) return;
            this.warned = true;
            try { if (Lampa.Noty) Lampa.Noty.show(LANG.storage_error); } catch (e) {}
        }
    };

    function openActorPage(a) {
        var id = a && a.id;
        if (id && /^\d+$/.test(String(id)) && Lampa.Component && typeof Lampa.Component.get === 'function') {
            var component = Lampa.Component.get('actor') ? 'actor' : (Lampa.Component.get('person') ? 'person' : '');
            if (component) {
            try {
                Lampa.Activity.push({
                    url: 'person/' + id,
                    title: a.name || '',
                    component: component,
                    id: id,
                    source: 'tmdb',
                    page: 1
                });
                return;
            } catch (e) {}
            }
        }
        Lampa.Activity.push({
            url: 'stats_actor',
            title: (a && a.name) || LANG.actor_works,
            component: CONFIG.activity_actor,
            actor_key: (a && (a._key || String(a.id || a.name))) || '',
            page: 1
        });
    }

    // ===================== CardCache =====================
    var CardCache = {
        map: {},
        loading: {},
        key: function (m) {
            if (!m) return '';
            return String(m.id || m.tmdb_id || m.imdb_id || '');
        },
        put: function (m) {
            var k = this.key(m);
            if (!k || !m) return;
            var prev = this.map[k] || {};
            var next = Object.assign({}, prev, m);
            var prevGenres = prev.genres && prev.genres.length ? prev.genres : null;
            var newGenres = m.genres && m.genres.length ? m.genres : null;
            next.genres = newGenres || prevGenres || m.genres || prev.genres;
            var prevIds = prev.genre_ids && prev.genre_ids.length ? prev.genre_ids : null;
            var newIds = m.genre_ids && m.genre_ids.length ? m.genre_ids : null;
            next.genre_ids = newIds || prevIds || m.genre_ids || prev.genre_ids;
            var prevCast = (prev.credits && prev.credits.cast && prev.credits.cast.length && prev.credits) ||
                (prev.persons && prev.persons.cast && prev.persons.cast.length && prev.persons) || null;
            var newCast = (m.credits && m.credits.cast && m.credits.cast.length && m.credits) ||
                (m.persons && m.persons.cast && m.persons.cast.length && m.persons) || null;
            if (newCast && newCast.cast) {
                next.credits = { cast: newCast.cast };
                if (m.persons && m.persons.cast) next.persons = { cast: m.persons.cast };
            } else if (prevCast && prevCast.cast) {
                next.credits = { cast: prevCast.cast };
                if (prev.persons && prev.persons.cast) next.persons = { cast: prev.persons.cast };
            }
            if (!next.release_date && prev.release_date) next.release_date = prev.release_date;
            if (!next.first_air_date && prev.first_air_date) next.first_air_date = prev.first_air_date;
            if (!next.poster_path && prev.poster_path) next.poster_path = prev.poster_path;
            if (!next.img && prev.img) next.img = prev.img;
            this.map[k] = next;
        },
        get: function (m) {
            if (!m) return null;
            var k = this.key(m);
            if (k && this.map[k]) return Media.mergeDetails(m, this.map[k]);
            return m;
        },
        hasRich: function (m) {
            if (!m) return false;
            var c = this.get(m);
            var hasGenre = (c.genres && c.genres.length) || (c.genre_ids && c.genre_ids.length);
            var hasCast = (c.credits && c.credits.cast && c.credits.cast.length) ||
                (c.cast && c.cast.length) ||
                (c.persons && c.persons.cast && c.persons.cast.length);
            return !!(hasGenre && hasCast);
        }
    };

    // ===================== Media =====================
    var Media = {
        mergeDetails: function (movie, details) {
            var merged = Object.assign({}, movie, details);
            // Metadata are shared by a series; playback identity belongs to its current file.
            ['timeline', 'season', 'season_number', 'episode', 'episode_number', '_stats_ep_key', '_stats_play_key'].forEach(function (key) {
                if (Object.prototype.hasOwnProperty.call(movie, key)) merged[key] = movie[key];
                else delete merged[key];
            });
            return merged;
        },
        lastCard: null,
        getId: function (movie) {
            if (!movie) return 'unknown';
            var id = movie.id || movie.tmdb_id || movie.kinopoisk_id || movie.imdb_id ||
                movie.original_title || movie.original_name || movie.title || movie.name || 'unknown';
            var season = movie.season_number || movie.season || 0;
            var episode = movie.episode_number || movie.episode || 0;
            // Online часто без S/E → серії склеювались в один id. Timeline.hash унікальний на епізод.
            if ((!season || !episode) && movie.timeline && movie.timeline.hash) {
                return String(id) + ':h:' + String(movie.timeline.hash);
            }
            if ((!season || !episode) && movie._stats_ep_key) {
                return String(id) + ':k:' + String(movie._stats_ep_key);
            }
            return String(id) + ':' + String(season) + ':' + String(episode);
        },
        getBaseId: function (movie) {
            if (!movie) return 'unknown';
            return String(movie.id || movie.tmdb_id || movie.kinopoisk_id || movie.imdb_id ||
                movie.original_title || movie.original_name || movie.title || movie.name || 'unknown');
        },
        isEpisode: function (movie) {
            if (!movie) return false;
            return !!(movie.episode || movie.episode_number ||
                ((movie.season_number || movie.season) && (movie.episode_number || movie.episode)));
        },
        yearOf: function (movie) {
            if (!movie) return 0;
            var d = movie.release_date || movie.first_air_date || movie.year || '';
            if (typeof d === 'number') return d;
            var m = String(d).match(/(\d{4})/);
            return m ? parseInt(m[1], 10) : 0;
        },
        genresOf: function (movie) {
            if (!movie) return [];
            var out = [];
            if (Array.isArray(movie.genres)) {
                movie.genres.forEach(function (g) {
                    var name = typeof g === 'string' ? g : (g && g.name);
                    if (!name || isGarbageGenre(name)) return;
                    out.push({ name: name, id: g && g.id });
                });
            }
            if (!out.length && Array.isArray(movie.genre_ids)) {
                movie.genre_ids.forEach(function (gid) {
                    if (GENRE_MAP[gid]) out.push({ name: GENRE_MAP[gid], id: gid });
                });
            }
            return out;
        },
        actorsOf: function (movie) {
            if (!movie) return [];
            var list = [];
            try {
                if (movie.credits && Array.isArray(movie.credits.cast)) list = movie.credits.cast;
                else if (Array.isArray(movie.cast)) list = movie.cast;
                else if (movie.persons && Array.isArray(movie.persons.cast)) list = movie.persons.cast;
            } catch (e) {}

            // Тільки актори
            list = list.filter(function (p) {
                if (!p || !(p.id || p.name)) return false;
                if (p.job && !p.character) return false;
                if (p.department && String(p.department).toLowerCase() !== 'acting') return false;
                return true;
            });

            // Сортування за order лише якщо значення реально різні (інакше порядок TMDB)
            var orderSet = {};
            list.forEach(function (p) {
                if (Number.isFinite(p.order)) orderSet[p.order] = true;
            });
            if (Object.keys(orderSet).length > 1) {
                list.sort(function (a, b) {
                    var orderA = Number.isFinite(a.order) ? a.order : 999;
                    var orderB = Number.isFinite(b.order) ? b.order : 999;
                    return orderA - orderB;
                });
            }

            return list.slice(0, 25).map(function (p) {
                return {
                    id: p.id || p.name,
                    name: p.name || '',
                    profile_path: p.profile_path || p.img || p.photo || '',
                    order: Number.isFinite(p.order) ? p.order : 999
                };
            });
        },
        posterOf: function (movie) {
            if (!movie) return '';
            var p = movie.poster_path || movie.img || movie.poster || movie.card_poster || '';
            if (!p && movie.still_path) p = movie.still_path;
            if (!p && movie.backdrop_path) p = movie.backdrop_path;
            if (!p && movie.season_poster) p = movie.season_poster;
            if (typeof p === 'object' && p) p = p.url || p.path || p.poster_path || '';
            return p && posterUrl(p) ? p : '';
        },
        titleOf: function (movie) {
            if (!movie) return '';
            return movie.title || movie.name || movie.original_title || movie.original_name || '';
        }
    };

    // ===================== MetaStore =====================
    var MetaStore = {
        prefix: 'stats_meta_',
        sizes: {},
        keyOf: function (movie) {
            if (!movie) return '';
            var id = movie.id || movie.tmdb_id || movie.imdb_id || movie.kinopoisk_id;
            if (id) return String(id);
            var title = movie.original_title || movie.original_name || movie.title || movie.name || '';
            return title ? ('t:' + title) : '';
        },
        save: function (movie) {
            var id = this.keyOf(movie);
            if (!id) return;
            try {
                var meta = {
                    id: id,
                    title: Media.titleOf(movie),
                    release_date: movie.release_date || '',
                    first_air_date: movie.first_air_date || '',
                    poster_path: Media.posterOf(movie),
                    genres: Media.genresOf(movie),
                    genre_ids: movie.genre_ids || [],
                    actors: Media.actorsOf(movie),
                    year: Media.yearOf(movie)
                };
                var old = this.load(id);
                if (old) {
                    if ((!meta.genres || !meta.genres.length) && old.genres && old.genres.length) meta.genres = old.genres;
                    if ((!meta.actors || !meta.actors.length) && old.actors && old.actors.length) meta.actors = old.actors;
                    if (!meta.year && old.year) meta.year = old.year;
                    if (!meta.release_date && old.release_date) meta.release_date = old.release_date;
                    if (!meta.first_air_date && old.first_air_date) meta.first_air_date = old.first_air_date;
                    if (!meta.poster_path && posterUrl(old.poster_path)) meta.poster_path = old.poster_path;
                    if ((!meta.genre_ids || !meta.genre_ids.length) && old.genre_ids && old.genre_ids.length) meta.genre_ids = old.genre_ids;
                }
                if ((meta.genres && meta.genres.length) || (meta.actors && meta.actors.length) || meta.year || meta.poster_path) {
                    this.sizes[id] = JSON.stringify(meta).length;
                    this.touchIndex(id);
                    this.prune();
                    if (!StorageIO.write(this.prefix + id, meta)) {
                        this.prune(true);
                        if (!StorageIO.write(this.prefix + id, meta)) StorageIO.warn();
                    }
                }
            } catch (e) {}
        },
        touchIndex: function (id) {
            try {
                var idx = Lampa.Storage.get('stats_meta_index');
                if (!Array.isArray(idx)) idx = [];
                idx = idx.filter(function (x) { return x && x !== id; });
                idx.unshift(id);
                Lampa.Storage.set('stats_meta_index', idx);
            } catch (e) {}
        },
        prune: function (aggressive) {
            try {
                var max = aggressive ? Math.floor(CONFIG.meta_max / 2) : CONFIG.meta_max;
                var budget = aggressive ? CONFIG.meta_chars_max / 2 : CONFIG.meta_chars_max;
                var idx = Lampa.Storage.get('stats_meta_index');
                if (!Array.isArray(idx)) return;
                var keep = [], drop = [], used = 0;
                var self = this;
                idx.forEach(function (id) {
                    if (!Object.prototype.hasOwnProperty.call(self.sizes, id)) self.sizes[id] = JSON.stringify(self.load(id) || {}).length;
                    var size = self.sizes[id];
                    if (keep.length < max && used + size <= budget) { keep.push(id); used += size; }
                    else drop.push(id);
                });
                if (!drop.length) return;
                drop.forEach(function (d) {
                    delete self.sizes[d];
                    try { Lampa.Storage.set(self.prefix + d, null); } catch (e1) {}
                    try { localStorage.removeItem(self.prefix + d); } catch (e2) {}
                    try { localStorage.removeItem('lampa_' + self.prefix + d); } catch (e3) {}
                });
                Lampa.Storage.set('stats_meta_index', keep);
            } catch (e) {}
        },
        load: function (idOrMovie) {
            var id = typeof idOrMovie === 'object' ? this.keyOf(idOrMovie) : idOrMovie;
            if (!id) return null;
            try {
                var m = Lampa.Storage.get(this.prefix + id);
                return m && typeof m === 'object' ? m : null;
            } catch (e) { return null; }
        },
        applyToMovie: function (movie) {
            if (!movie) return movie;
            var stored = this.load(movie);
            if (!stored) return movie;
            movie = Object.assign({}, movie);
            if (stored.genres && stored.genres.length && !(movie.genres && movie.genres.length)) movie.genres = stored.genres;
            if (stored.genre_ids && stored.genre_ids.length && !(movie.genre_ids && movie.genre_ids.length)) movie.genre_ids = stored.genre_ids;
            if (stored.actors && stored.actors.length) {
                if (!(movie.credits && movie.credits.cast && movie.credits.cast.length)) {
                    movie.credits = { cast: stored.actors };
                }
            }
            if (stored.release_date && !movie.release_date) movie.release_date = stored.release_date;
            if (stored.first_air_date && !movie.first_air_date) movie.first_air_date = stored.first_air_date;
            if (posterUrl(stored.poster_path) && !Media.posterOf(movie)) movie.poster_path = stored.poster_path;
            return movie;
        }
    };

    // ===================== DomMeta =====================
    var DomMeta = {
        scrape: function (movie) {
            var result = { genres: [], year: 0, actors: [], id: null, title: '', poster: '' };
            try {
                var act = Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active();
                var card = act && (act.card || act.movie || (act.object && (act.object.card || act.object.movie)));
                var id = card && (card.id || card.tmdb_id) || (act && act.id);
                var movieId = movie && (movie.id || movie.tmdb_id);
                if (!act || act.component !== 'full' || !id || !movieId || String(id) !== String(movieId)) return result;
                var body = act.activity && act.activity.body;
                var root = body && (body[0] || body);
                if (!root || !root.querySelector) return result;
                result.id = id;
                var y = root.querySelector('.tag--year');
                if (y) {
                    var ym = (y.textContent || '').match(/(19|20)\d{2}/);
                    if (ym) result.year = parseInt(ym[0], 10);
                }
                if (!result.year) {
                    var head = root.querySelector('.full-start-new__head, .full-start__head');
                    if (head) {
                        var hm = (head.textContent || '').match(/(19|20)\d{2}/);
                        if (hm) result.year = parseInt(hm[0], 10);
                    }
                }
                var titleEl = root.querySelector('.full-start-new__title, .full-start__title');
                if (titleEl) result.title = (titleEl.textContent || '').trim();
                var posterEl = root.querySelector('.full-start-new__poster img, .full-start__poster img, .full-start-new__poster');
                if (posterEl) {
                    result.poster = posterEl.getAttribute('src') || posterEl.getAttribute('data-src') ||
                        (posterEl.style && posterEl.style.backgroundImage
                            ? String(posterEl.style.backgroundImage).replace(/url\(["']?/, '').replace(/["']?\)/, '')
                            : '');
                    var poster = result.poster;
                    // DOM may contain loading icons or unrelated local images.
                    if (!/^(?:https?:)?\/\/image\.tmdb\.org\//i.test(poster) && !/^\/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png|webp)$/i.test(poster)) result.poster = '';
                }
                var details = root.querySelector('.full-start-new__details, .full-start__details');
                if (details) {
                    var text = (details.textContent || '').replace(/\s+/g, ' ').trim();
                    var parts = text.split(/●|•|·|\|/).map(function (s) { return s.trim(); });
                    parts.forEach(function (p) {
                        if (isGarbageGenre(p)) return;
                        var known = Object.keys(GENRE_MAP).some(function (key) { return GENRE_MAP[key].toLowerCase() === p.toLowerCase(); });
                        if (!known) return;
                        result.genres.push({ name: p });
                    });
                }
            } catch (e) {}
            return result;
        },
        mergeInto: function (movie) {
            if (!movie) movie = {};
            var d = this.scrape(movie);
            movie = Object.assign({}, movie);
            if (d.id && !movie.id) movie.id = d.id;
            if (d.title && !movie.title && !movie.name) movie.title = d.title;
            if (d.year && !Media.yearOf(movie)) movie.release_date = String(d.year) + '-01-01';
            if (d.genres.length && !(movie.genres && movie.genres.length)) movie.genres = d.genres;
            if (d.poster && !Media.posterOf(movie)) movie.poster_path = d.poster;
            return movie;
        }
    };

    Media.metaFrom = function (movie) {
        if (!movie) return null;
        movie = CardCache.get(movie) || movie;
        movie = MetaStore.applyToMovie(movie);
        return {
            isEpisode: Media.isEpisode(movie),
            year: Media.yearOf(movie),
            genres: Media.genresOf(movie),
            actors: Media.actorsOf(movie),
            poster: Media.posterOf(movie),
            title: Media.titleOf(movie),
            baseId: Media.getBaseId(movie),
            watchId: Media.getId(movie)
        };
    };

    Media.remember = function (movie) {
        if (!movie || typeof movie !== 'object') return;
        movie = DomMeta.mergeInto(movie);
        CardCache.put(movie);
        movie = CardCache.get(movie) || movie;
        movie = MetaStore.applyToMovie(movie);
        CardCache.put(movie);
        MetaStore.save(movie);
        this.lastCard = CardCache.get(movie) || movie;
    };

    // ===================== MetaLoader =====================
    var MetaLoader = {
        isTv: function (movie) {
            if (!movie) return false;
            if (movie.number_of_seasons || movie.first_air_date) return true;
            if (movie.name && !movie.title) return true;
            if (movie.season_number || movie.episode_number || movie.episode || movie.season) return true;
            if (movie.media_type === 'tv') return true;
            return false;
        },
        lang: function () {
            try {
                return Lampa.Storage.field('tmdb_lang') || Lampa.Storage.field('language') || 'uk-UA';
            } catch (e) { return 'uk-UA'; }
        },
        enrich: function (movie, done) {
            if (!movie) { if (done) done(null); return; }
            var enrichSerial = Tracker._sessionSerial;
            movie = MetaStore.applyToMovie(movie);
            var id = movie.id || movie.tmdb_id;
            if (!id) {
                Media.remember(movie);
                if (done) done(movie);
                return;
            }
            if (CardCache.hasRich(movie) || (Media.genresOf(movie).length && Media.actorsOf(movie).length)) {
                Media.remember(movie);
                if (done) done(CardCache.get(movie) || movie);
                return;
            }
            var key = String(id);
            if (CardCache.loading[key]) {
                if (done) done(CardCache.get(movie) || movie);
                return;
            }
            CardCache.loading[key] = true;
            var type = this.isTv(movie) ? 'tv' : 'movie';
            var self = this;
            var path = type + '/' + id + '?append_to_response=credits&language=' + encodeURIComponent(this.lang());

            function finish(data) {
                CardCache.loading[key] = false;
                if (!data) {
                    Media.remember(movie);
                    if (done) done(movie);
                    return;
                }
                var merged = Object.assign({}, movie, data);
                if (data.credits && data.credits.cast) merged.credits = { cast: data.credits.cast };
                if (data.genres) merged.genres = data.genres;
                if (data.genre_ids) merged.genre_ids = data.genre_ids;
                if (data.release_date) merged.release_date = data.release_date;
                if (data.first_air_date) merged.first_air_date = data.first_air_date;
                if (data.poster_path) merged.poster_path = data.poster_path;
                Media.remember(merged);
                if (Tracker._sessionSerial === enrichSerial && Tracker.currentMovie && CardCache.key(Tracker.currentMovie) === key) {
                    Tracker.currentMovie = Media.mergeDetails(Tracker.currentMovie, merged);
                }
                // Без backfill: enrichMetaOnly(last) накручував акторів при кожному відкритті картки
                if (done) done(CardCache.get(merged) || merged);
            }

            try {
                if (Lampa.TMDB && typeof Lampa.TMDB.api === 'function') {
                    var url = Lampa.TMDB.api(path);
                    if (Lampa.Reguest) {
                        var req = new Lampa.Reguest();
                        req.timeout(10000);
                        req.silent(url, function (data) { finish(data); }, function () {
                            self.tryNetwork(url, movie, type, id, finish);
                        });
                        return;
                    }
                }
            } catch (e) {}
            this.tryNetwork(null, movie, type, id, finish);
        },
        tryNetwork: function (url, movie, type, id, finish) {
            var self = this;
            try {
                if (!url && Lampa.TMDB && typeof Lampa.TMDB.api === 'function') {
                    url = Lampa.TMDB.api(type + '/' + id + '?append_to_response=credits&language=' + encodeURIComponent(this.lang()));
                }
                if (url && Lampa.Network && typeof Lampa.Network.silent === 'function') {
                    Lampa.Network.silent(url, function (data) { finish(data); }, function () {
                        self.tryApiFull(movie, type, id, finish);
                    });
                    return;
                }
            } catch (e) {}
            try {
                if (url && typeof fetch === 'function') {
                    fetch(url).then(function (r) { return r.json(); }).then(function (data) { finish(data); })
                        .catch(function () { self.tryApiFull(movie, type, id, finish); });
                    return;
                }
            } catch (e) {}
            this.tryApiFull(movie, type, id, finish);
        },
        tryApiFull: function (movie, type, id, finish) {
            try {
                if (Lampa.Api && typeof Lampa.Api.full === 'function') {
                    Lampa.Api.full(
                        { id: id, method: type === 'tv' ? 'tv' : 'movie', card: movie, source: 'tmdb' },
                        function (data) {
                            if (data && data.movie) {
                                var m = data.movie;
                                if (data.persons && data.persons.cast) {
                                    m = Object.assign({}, m, {
                                        credits: { cast: data.persons.cast },
                                        persons: { cast: data.persons.cast }
                                    });
                                }
                                finish(m);
                            } else finish(null);
                        },
                        function () { finish(null); }
                    );
                    return;
                }
            } catch (e) {}
            finish(null);
        }
    };

    // ===================== LevelSystem =====================
    var LevelSystem = {
        xp: function () {
            var s = StatsDB.data.seconds_watched || 0;
            var m = StatsDB.data.movies_watched || 0;
            var e = StatsDB.data.episodes_watched || 0;
            return Math.floor(s + m * CONFIG.xp_movie_bonus + e * CONFIG.xp_episode_bonus);
        },
        info: function () {
            var xp = this.xp();
            var cur = LEVELS[0];
            var next = null;
            for (var i = 0; i < LEVELS.length; i++) {
                if (xp >= LEVELS[i].xp) cur = LEVELS[i];
                else { next = LEVELS[i]; break; }
            }
            var progress = 1;
            var toNext = 0;
            if (next) {
                var span = next.xp - cur.xp;
                progress = span > 0 ? Math.min(1, (xp - cur.xp) / span) : 1;
                toNext = Math.max(0, next.xp - xp);
            }
            return {
                level: cur.level,
                name: I18n.levelName(cur.level, cur.name),
                xp: xp,
                progress: progress,
                toNext: toNext,
                nextName: next ? I18n.levelName(next.level, next.name) : null,
                max: !next
            };
        },
        checkLevelUp: function () {
            try {
                var info = this.info();
                var prev = StatsDB.data.last_level || 1;
                if (info.level > prev) {
                    StatsDB.data.last_level = info.level;
                    StatsDB.save();
                    if (Lampa.Noty) Lampa.Noty.show(LANG.level_up + ': ' + info.level + ' — ' + info.name);
                } else if (!StatsDB.data.last_level) {
                    StatsDB.data.last_level = info.level;
                    StatsDB.save();
                }
            } catch (e) {}
        }
    };

    // ===================== StatsDB =====================
    var StatsDB = {
        data: null,
        init: function () {
            var saved = null;
            try { saved = Lampa.Storage.get(CONFIG.stats_storage); } catch (e) {}
            if (!saved || typeof saved !== 'object') {
                this.data = JSON.parse(JSON.stringify(DEFAULT_STATS));
                this.save();
                return;
            }
            this.data = Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATS)), saved);
            ['completed', 'watch_by_id', 'watch_updated', 'last_recorded', 'genres', 'actors', 'years', 'by_month', 'by_month_year', 'by_weekday', 'by_hour'].forEach(function (k) {
                if (!StatsDB.data[k] || typeof StatsDB.data[k] !== 'object') StatsDB.data[k] = {};
            });
            if (!Number.isFinite(this.data.last_level)) this.data.last_level = 1;
            Object.keys(this.data.actors).forEach(function (k) {
                if (!StatsDB.data.actors[k].works) StatsDB.data.actors[k].works = {};
            });
            this.cleanupGenres();
            this.normalize();
        },
        cleanupGenres: function () {
            var changed = false;
            Object.keys(this.data.genres).forEach(function (name) {
                if (isGarbageGenre(name)) {
                    delete StatsDB.data.genres[name];
                    changed = true;
                }
            });
            if (changed) this.save();
        },
        normalize: function () {
            ['seconds_watched', 'movies_watched', 'episodes_watched'].forEach(function (k) {
                if (!Number.isFinite(StatsDB.data[k])) StatsDB.data[k] = 0;
                StatsDB.data[k] = Math.max(0, Math.floor(StatsDB.data[k]));
            });
        },
        save: function () {
            this.normalize();
            try { this.pruneStats(); } catch (eP) {}
            if (StorageIO.write(CONFIG.stats_storage, this.data)) return;
            this.pruneStats(true);
            MetaStore.prune(true);
            if (!StorageIO.write(CONFIG.stats_storage, this.data)) StorageIO.warn();
        },
        pruneStats: function (aggressive) {
            var actorsMax = aggressive ? Math.floor((CONFIG.actors_max || 800) / 2) : (CONFIG.actors_max || 800);
            var completedMax = aggressive ? Math.floor((CONFIG.completed_max || 500) / 2) : (CONFIG.completed_max || 500);
            var minSec = aggressive ? 600 : 120;

            try {
                var keys = Object.keys(this.data.actors || {});
                if (keys.length > actorsMax) {
                    keys.sort(function (a, b) {
                        return (StatsDB.data.actors[a].seconds || 0) - (StatsDB.data.actors[b].seconds || 0);
                    });
                    keys.slice(0, keys.length - actorsMax).forEach(function (k) {
                        delete StatsDB.data.actors[k];
                    });
                } else if (aggressive) {
                    keys.forEach(function (k) {
                        if ((StatsDB.data.actors[k].seconds || 0) < minSec) delete StatsDB.data.actors[k];
                    });
                }
            } catch (eA) {}

            try {
                var ckeys = Object.keys(this.data.completed || {});
                if (ckeys.length > completedMax) {
                    ckeys.sort(function (a, b) {
                        return (StatsDB.data.completed[b].date || 0) - (StatsDB.data.completed[a].date || 0);
                    });
                    ckeys.slice(completedMax).forEach(function (k) {
                        delete StatsDB.data.completed[k];
                    });
                }
            } catch (eC) {}

            try {
                var lkeys = Object.keys(this.data.last_recorded || {});
                var lmax = completedMax * 3;
                if (lkeys.length > lmax) {
                    lkeys.sort(function (a, b) {
                        return (StatsDB.data.last_recorded[a] || 0) - (StatsDB.data.last_recorded[b] || 0);
                    });
                    lkeys.slice(0, lkeys.length - lmax).forEach(function (k) {
                        if (!StatsDB.data.completed[k]) delete StatsDB.data.last_recorded[k];
                    });
                }
            } catch (eL) {}

            // Retain current playback and the displayed history; bound older per-file detail.
            var activeId = Tracker.sessionWatchId || '';
            var watch = this.data.watch_by_id, updated = this.data.watch_updated;
            var wkeys = Object.keys(watch);
            var wmax = aggressive ? Math.floor(CONFIG.watch_ids_max / 2) : CONFIG.watch_ids_max;
            wkeys.sort(function (a, b) {
                var ap = a === activeId || !!StatsDB.data.completed[a], bp = b === activeId || !!StatsDB.data.completed[b];
                return Number(bp) - Number(ap) || (updated[b] || StatsDB.data.last_recorded[b] || 0) - (updated[a] || StatsDB.data.last_recorded[a] || 0);
            });
            wkeys.slice(wmax).forEach(function (key) {
                if (key !== activeId && !StatsDB.data.completed[key]) { delete watch[key]; delete updated[key]; }
            });
            Object.keys(updated).forEach(function (key) { if (!Object.prototype.hasOwnProperty.call(watch, key)) delete updated[key]; });

            var works = [], worksMax = aggressive ? 20 : CONFIG.actor_works_max;
            Object.keys(this.data.actors).forEach(function (key) {
                var actor = StatsDB.data.actors[key];
                var ids = Object.keys(actor.works || {}).sort(function (a, b) { return (actor.works[b].date || 0) - (actor.works[a].date || 0); });
                ids.slice(worksMax).forEach(function (id) { delete actor.works[id]; });
                ids.slice(0, worksMax).forEach(function (id) { works.push({ actor: actor, id: id, date: actor.works[id].date || 0 }); });
                actor.count = Object.keys(actor.works || {}).length;
                delete actor._key;
            });
            // A byte budget also bounds a database with many actors and long titles.
            var size = JSON.stringify(this.data).length, budget = CONFIG.stats_chars_max;
            if (size > budget) {
                works.sort(function (a, b) { return a.date - b.date; });
                works.forEach(function (entry) {
                    if (size <= budget) return;
                    var actor = entry.actor;
                    size -= JSON.stringify(actor.works[entry.id]).length + entry.id.length + 4;
                    delete actor.works[entry.id];
                    actor.count = Object.keys(actor.works).length;
                });
            }
        },
        reset: function () {
            this.data = JSON.parse(JSON.stringify(DEFAULT_STATS));
            this.save();
        },
        getLast: function (id) {
            var v = this.data.last_recorded[id];
            return Number.isFinite(v) ? v : 0;
        },
        setLast: function (id, t) {
            this.data.last_recorded[id] = Math.max(0, Math.floor(t));
        },
        ensureActor: function (a) {
            if (!a || !(a.id || a.name)) return null;
            var key = String(a.id || a.name);
            if (!this.data.actors[key]) {
                this.data.actors[key] = {
                    id: a.id || a.name,
                    name: a.name || '',
                    profile_path: a.profile_path || '',
                    seconds: 0,
                    count: 0,
                    works: {}
                };
            }
            var row = this.data.actors[key];
            if (!row.works) row.works = {};
            if (a.name) row.name = a.name;
            if (a.profile_path) row.profile_path = a.profile_path;
            if (a.id && /^\d+$/.test(String(a.id))) row.id = a.id;
            return row;
        },
        touchActorWork: function (a, meta, sec, completed) {
            var row = this.ensureActor(a);
            if (!row || !meta) return;
            var wid = meta.baseId || meta.watchId || meta.title || 'unknown';
            if (!row.works[wid]) {
                row.works[wid] = {
                    title: meta.title || '',
                    poster: meta.poster || '',
                    isEpisode: !!meta.isEpisode,
                    seconds: 0,
                    completed: false,
                    date: Date.now()
                };
            }
            var w = row.works[wid];
            if (meta.title) w.title = meta.title;
            if (meta.poster) w.poster = meta.poster;
            w.isEpisode = !!meta.isEpisode;
            if (sec) w.seconds += sec;
            w.date = Date.now();
            if (completed) w.completed = true;
            row.count = Object.keys(row.works).length;
        },
        // addProgress removed — only addWatchSeconds (wall-clock / timeline)
        addWatchSeconds: function (sec, meta) {
            sec = Math.floor(Number(sec) || 0);
            if (sec <= 0) return 0;
            // захист від божевільних значень (макс 6 год за один commit)
            sec = Math.min(sec, 21600);
            this.data.seconds_watched += sec;
            try {
                if (!this.data.watch_by_id) this.data.watch_by_id = {};
                var wid = meta && (meta.watchId || meta.id) ? String(meta.watchId || meta.id) : '';
                if (wid) {
                    this.data.watch_by_id[wid] = (this.data.watch_by_id[wid] || 0) + sec;
                    this.data.watch_updated[wid] = Date.now();
                }
            } catch (eW) {}
            this.enrich(sec, meta);
            this.save();
            LevelSystem.checkLevelUp();
            return sec;
        },
        getWatchById: function (id) {
            if (!id || !this.data.watch_by_id) return 0;
            return Math.floor(Number(this.data.watch_by_id[id]) || 0);
        },
        enrich: function (sec, meta) {
            if (!sec) return;
            var now = new Date();
            var month = now.getFullYear() + '-' + ('0' + (now.getMonth() + 1)).slice(-2);
            this.data.by_month_year[month] = (this.data.by_month_year[month] || 0) + sec;
            this.data.by_weekday[now.getDay()] = (this.data.by_weekday[now.getDay()] || 0) + sec;
            this.data.by_hour[now.getHours()] = (this.data.by_hour[now.getHours()] || 0) + sec;
            if (!meta) return;
            this.enrichMetaOnly(sec, meta, true);
        },
        enrichMetaOnly: function (sec, meta, skipSave) {
            if (!sec || !meta) return;
            if (meta.year) {
                var y = String(meta.year);
                if (!this.data.years[y]) this.data.years[y] = { seconds: 0, count: 0 };
                this.data.years[y].seconds += sec;
            }
            if (meta.genres && meta.genres.length) {
                meta.genres.forEach(function (g) {
                    var name = typeof g === 'string' ? g : (g && g.name);
                    if (!name || isGarbageGenre(name)) return;
                    if (!StatsDB.data.genres[name]) StatsDB.data.genres[name] = { seconds: 0, count: 0 };
                    StatsDB.data.genres[name].seconds += sec;
                });
            }
            if (meta.actors && meta.actors.length) {
                meta.actors.slice(0, 20).forEach(function (a) {
                    var row = StatsDB.ensureActor(a);
                    if (!row) return;
                    row.seconds += sec;
                    StatsDB.touchActorWork(a, meta, sec, false);
                });
            }
            if (!skipSave) this.save();
        },
        markCompleted: function (id, meta, movie) {
            if (!id) return false;
            if (this.data.completed[id]) {
                this.data.completed[id].date = Date.now();
                if (meta && meta.title) this.data.completed[id].title = meta.title;
                if (meta && meta.poster) this.data.completed[id].poster = meta.poster;
                try {
                    var sUp = this.getWatchById(id) || 0;
                    if (sUp > (this.data.completed[id].seconds || 0)) {
                        this.data.completed[id].seconds = Math.floor(sUp);
                    }
                } catch (eU) {}
                this.save();
                return false;
            }
            // час перегляду = нараховані секунди, НЕ позиція timeline
            var secWatch = 0;
            try { secWatch = this.getWatchById(id) || 0; } catch (eS) {}
            var poster = (meta && meta.poster) || Media.posterOf(movie) || '';
            try {
                if (!poster) {
                    var st = MetaStore.load(movie || id);
                    if (st && st.poster_path) poster = st.poster_path;
                }
                if (!poster && movie && Media.lastCard && Media.getBaseId(Media.lastCard) === Media.getBaseId(movie)) poster = Media.posterOf(Media.lastCard);
                if (!poster && movie) {
                    var cached = CardCache.get(movie);
                    if (cached) poster = Media.posterOf(cached);
                }
            } catch (eP) {}
            var entry = {
                date: Date.now(),
                isEpisode: !!(meta && meta.isEpisode),
                title: (meta && meta.title) || Media.titleOf(movie) || '',
                poster: poster,
                tmdb_id: movie && (movie.id || movie.tmdb_id) || '',
                seconds: Math.max(0, Math.floor(secWatch))
            };
            if (!entry.poster && movie) {
                var st = MetaStore.load(movie);
                if (st && st.poster_path) entry.poster = st.poster_path;
            }
            if (!entry.poster && movie && Media.lastCard && Media.getBaseId(Media.lastCard) === Media.getBaseId(movie)) {
                entry.poster = Media.posterOf(Media.lastCard);
                if (!entry.title) entry.title = Media.titleOf(Media.lastCard);
            }
            this.data.completed[id] = entry;
            if (entry.isEpisode) this.data.episodes_watched++;
            else this.data.movies_watched++;
            if (meta && meta.genres) {
                meta.genres.forEach(function (g) {
                    var name = typeof g === 'string' ? g : (g && g.name);
                    if (!name || isGarbageGenre(name)) return;
                    if (!StatsDB.data.genres[name]) StatsDB.data.genres[name] = { seconds: 0, count: 0 };
                    StatsDB.data.genres[name].count += 1;
                });
            }
            if (meta && meta.actors) {
                meta.actors.slice(0, 20).forEach(function (a) {
                    StatsDB.touchActorWork(a, meta, 0, true);
                });
            }
            if (meta && meta.year) {
                var y = String(meta.year);
                if (!this.data.years[y]) this.data.years[y] = { seconds: 0, count: 0 };
                this.data.years[y].count += 1;
            }
            this.save();
            LevelSystem.checkLevelUp();
            return true;
        },
        recentCompleted: function (limit) {
            return this.allCompleted().slice(0, limit || CONFIG.max_posters_show);
        },
        allCompleted: function () {
            var max = CONFIG.completed_list_max || 100;
            var list = Object.keys(this.data.completed || {}).map(function (k) {
                var c = StatsDB.data.completed[k];
                var sec = StatsDB.getWatchById(k) || Number(c.seconds) || 0;
                return {
                    id: k,
                    date: c.date || 0,
                    isEpisode: !!c.isEpisode,
                    title: c.title || '',
                    poster: c.poster || '',
                    seconds: Math.floor(sec)
                };
            }).sort(function (a, b) {
                return (b.date || 0) - (a.date || 0);
            });
            if (list.length > max) list = list.slice(0, max);
            return list;
        },
        topActors: function (limit) {
            return Object.keys(this.data.actors)
                .map(function (k) {
                    var a = StatsDB.data.actors[k];
                    return Object.assign({}, a, { count: Object.keys(a.works || {}).length, _key: k });
                })
                .sort(function (a, b) {
                    var ds = (b.seconds || 0) - (a.seconds || 0);
                    if (ds !== 0) return ds;
                    return (b.count || 0) - (a.count || 0);
                })
                .slice(0, limit || CONFIG.max_actors_show);
        },
        actorWorks: function (key) {
            var a = this.data.actors[key];
            if (!a || !a.works) return [];
            return Object.keys(a.works).map(function (wid) {
                var w = a.works[wid];
                return {
                    id: wid,
                    title: w.title || wid,
                    poster: w.poster || '',
                    isEpisode: !!w.isEpisode,
                    seconds: w.seconds || 0,
                    completed: !!w.completed,
                    date: w.date || 0
                };
            }).sort(function (x, y) { return y.date - x.date; });
        },
        formatTime: function (sec) {
            sec = Math.max(0, Math.floor(sec || 0));
            var totalMin = Math.floor(sec / 60);
            var days = Math.floor(totalMin / 1440);
            var hours = Math.floor((totalMin % 1440) / 60);
            var minutes = totalMin % 60;
            if (days > 0) return days + ' ' + (days === 1 ? LANG.day : LANG.days) + ' ' + hours + ' ' + LANG.hours;
            if (hours > 0) return hours + ' ' + LANG.hours + ' ' + minutes + ' ' + LANG.minutes;
            return minutes + ' ' + LANG.minutes;
        },
        formatHoursOrMin: function (sec) {
            sec = Math.max(0, Math.floor(sec || 0));
            if (sec >= 3600) return Math.floor(sec / 3600) + ' ' + LANG.hours;
            return Math.floor(sec / 60) + ' ' + LANG.minutes;
        },
        topGenre: function () {
            var best = null, bestSec = -1, total = 0;
            Object.keys(this.data.genres).forEach(function (name) {
                if (isGarbageGenre(name)) return;
                var s = StatsDB.data.genres[name].seconds || 0;
                total += s;
                if (s > bestSec) { bestSec = s; best = name; }
            });
            if (!best || total <= 0) return { name: LANG.no_genre, percent: 0 };
            return { name: best, percent: Math.round((bestSec / total) * 100) };
        },
        genreList: function () {
            return Object.keys(this.data.genres)
                .filter(function (name) { return !isGarbageGenre(name); })
                .map(function (name) { return { name: name, seconds: StatsDB.data.genres[name].seconds || 0 }; })
                .sort(function (a, b) { return b.seconds - a.seconds; });
        },
        yearBuckets: function () {
            var buckets = {};
            Object.keys(this.data.years).forEach(function (y) {
                var year = parseInt(y, 10);
                if (!year) return;
                var decade = Math.floor(year / 10) * 10;
                if (!buckets[decade]) buckets[decade] = 0;
                buckets[decade] += (StatsDB.data.years[y].seconds || 0);
            });
            return Object.keys(buckets)
                .map(function (k) {
                    var decade = parseInt(k, 10);
                    // Короткі підписи, щоб не накладались на ТВ: 50-ті, 00-ні, 10-ті, 20-ті
                    var short = String(decade).slice(-2);
                    var suffix = (decade === 2000) ? '-ні' : '-ті';
                    return { label: short + suffix, seconds: buckets[k], decade: decade };
                })
                .sort(function (a, b) { return a.decade - b.decade; });
        },
        monthPeriods: function () {
            var years = {};
            Object.keys(this.data.by_month_year || {}).forEach(function (key) { if (/^\d{4}-\d{2}$/.test(key)) years[key.slice(0, 4)] = true; });
            var periods = Object.keys(years).sort().reverse();
            if (Object.keys(this.data.by_month || {}).some(function (key) { return StatsDB.data.by_month[key] > 0; })) periods.push('legacy');
            return periods;
        },
        monthList: function (period) {
            period = period || this.monthPeriods()[0] || 'legacy';
            var list = [];
            for (var i = 0; i < 12; i++) {
                var sec = period === 'legacy' ? (this.data.by_month[i] || 0) : (this.data.by_month_year[period + '-' + ('0' + (i + 1)).slice(-2)] || 0);
                if (sec > 0) {
                    list.push({
                        index: i,
                        label: MONTHS[i] || String(i + 1),
                        seconds: sec
                    });
                }
            }
            return list;
        }
    };

    // ===================== Settings =====================
    var Settings = {
        added: false,
        setup: function () {
            if (this.added || !Lampa.SettingsApi || !Lampa.SettingsApi.addParam) return;
            this.added = true;
            try {
                if (Lampa.Storage.get(CONFIG.collect_storage) == null) Lampa.Storage.set(CONFIG.collect_storage, true);
                if (Lampa.Storage.get(CONFIG.menu_storage) == null) Lampa.Storage.set(CONFIG.menu_storage, true);
            } catch (e) {}
            try {
                Lampa.SettingsApi.addParam({ component: 'interface', param: { type: 'title' }, field: { name: LANG.settings_title } });
                Lampa.SettingsApi.addParam({
                    component: 'interface',
                    param: { name: CONFIG.collect_storage, type: 'trigger', default: true },
                    field: { name: LANG.collect_setting }
                });
                Lampa.SettingsApi.addParam({
                    component: 'interface',
                    param: { name: CONFIG.menu_storage, type: 'trigger', default: true },
                    field: { name: LANG.menu_setting },
                    onChange: function () { setTimeout(function () { Menu.update(); }, 100); }
                });
            } catch (e) {}
        },
        collecting: function () {
            var v = Lampa.Storage.get(CONFIG.collect_storage, true);
            return v !== false && v !== 'false' && v !== 0 && v !== '0';
        },
        menuVisible: function () {
            var v = Lampa.Storage.get(CONFIG.menu_storage, true);
            return v !== false && v !== 'false' && v !== 0 && v !== '0';
        }
    };

    var Current = {
        getMovie: function () {
            if (Tracker.currentMovie) return MetaStore.applyToMovie(CardCache.get(Tracker.currentMovie) || Tracker.currentMovie);
            if (Media.lastCard) return MetaStore.applyToMovie(Media.lastCard);
            try {
                var a = Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active();
                if (a) {
                    if (a.movie) return MetaStore.applyToMovie(CardCache.get(a.movie) || a.movie);
                    if (a.card) return MetaStore.applyToMovie(CardCache.get(a.card) || a.card);
                    if (a.object && a.object.movie) return MetaStore.applyToMovie(CardCache.get(a.object.movie) || a.object.movie);
                }
            } catch (e) {}
            return null;
        },
        getVideoState: function () {
            try {
                var video = null;
                if (Lampa.PlayerVideo && typeof Lampa.PlayerVideo.video === 'function') video = Lampa.PlayerVideo.video();
                if (!video) video = document.querySelector('.player video') || document.querySelector('video');
                if (!video) return null;
                var time = Number(video.currentTime);
                var duration = Number(video.duration);
                if (!Number.isFinite(time) && Number.isFinite(video._currentTime)) time = Number(video._currentTime);
                if (!Number.isFinite(duration) && Number.isFinite(video._duration)) duration = Number(video._duration);
                if (!Number.isFinite(time) || !Number.isFinite(duration) || duration <= 0) return null;
                return { time: Math.max(0, time), duration: Math.max(0, duration) };
            } catch (e) { return null; }
        }
    };

    // ===================== Tracker =====================

    var Tracker = {
        timer: null,
        initialized: false,
        currentMovie: null,
        currentTimelineHash: null,

        // Wall-clock session
        sessionMovie: null,
        sessionRunning: false,
        sessionStartedAt: 0,   // last resume timestamp
        sessionAccumMs: 0,     // paused/accumulated ms
        sessionHadPlay: false,
        sessionSeedTime: 0,    // timeline position at session start
        sessionIsExternal: false,
        sessionIsInternal: false,
        sessionLastTl: 0,
        lastPartialFlushAt: 0,
        sessionAddedSec: 0,
        sessionWatchId: '',
        _sessionCommitted: false,
        _sessionSerial: 0,
        timelineContexts: [],
        timelineContext: null,
        _externalAway: false,
        _externalReturnAt: 0,
        _externalLaunched: false,
        _lastSessionSaveAt: 0,
        videoHooked: false,

        init: function () {
            if (this.initialized) return;
            this.initialized = true;
            var self = this;

            // ---- Player.play: картка + старт сесії (online + torrent) ----
            try {
                if (Lampa.Player && typeof Lampa.Player.play === 'function' && !Lampa.Player._stats_play_hooked) {
                    Lampa.Player._stats_play_hooked = true;
                    var _play = Lampa.Player.play.bind(Lampa.Player);
                    Lampa.Player.play = function (data) {
                        try {
                            var movie = self.resolveMovieFromPlay(data);
                            if (!movie) {
                                try { movie = Current.getMovie(); } catch (e0) {}
                            }
                            if (movie) {
                                Media.remember(movie);
                                movie = MetaStore.applyToMovie(CardCache.get(movie) || movie);
                                self.currentMovie = movie;
                                MetaLoader.enrich(movie);
                                self.beginSession(movie, true);
                            } else {
                                // online інколи віддає картку пізніше
                                setTimeout(function () {
                                    var m2 = self.resolveMovieFromPlay(data) || Current.getMovie();
                                    if (m2) {
                                        self.currentMovie = m2;
                                        self.beginSession(m2);
                                    }
                                }, 800);
                            }
                            // Android external player setting
                            try {
                                var ext = Lampa.Storage.get('player') || Lampa.Storage.field('player');
                                if (ext && String(ext).toLowerCase() !== 'inner' && String(ext).toLowerCase() !== 'lampa') {
                                    self.sessionIsExternal = true;
                                }
                            } catch (eP) {}
                        } catch (err) {}
                        return _play(data);
                    };
                }
            } catch (e) {}

            // ---- Online / Makhno / Bandera: VLC через Android.openPlayer (без Player.play) ----
            try {
                if (Lampa.Android && typeof Lampa.Android.openPlayer === 'function' && !Lampa.Android._stats_open_player_hooked) {
                    Lampa.Android._stats_open_player_hooked = true;
                    var _openPlayer = Lampa.Android.openPlayer.bind(Lampa.Android);
                    Lampa.Android.openPlayer = function (link, data) {
                        try {
                            self.onAndroidOpenPlayer(Object.assign({ url: link }, data || {}));
                        } catch (eA) {}
                        return _openPlayer(link, data);
                    };
                }
            } catch (e) {}

            try {
                if (Lampa.Android && typeof Lampa.Android.timeCall === 'function' && !Lampa.Android._stats_time_hooked) {
                    Lampa.Android._stats_time_hooked = true;
                    var _timeCall = Lampa.Android.timeCall.bind(Lampa.Android);
                    Lampa.Android.timeCall = function (timeline) {
                        var result = _timeCall(timeline);
                        try {
                            var context = self.timelineOwner(timeline && timeline.hash);
                            if (context) self.applyTimelineProgress(timeline, context);
                            // A late Android result may finish only the session that launched it.
                            if (context && context === self.timelineContext && !context.closedAt) {
                                self.queueReturn('android-time', [1200, 3500, 7000, 12000]);
                            }
                        } catch (eT) {}
                        return result;
                    };
                }
            } catch (e) {}

            // Player.callback is a single global UI callback (also used by torrents).
            // Observe lifecycle listeners without replacing the caller's callback.

            try {
                if (Lampa.Player && Lampa.Player.listener) {
                    Lampa.Player.listener.follow('start', function (e) {
                        self.onPlayerStart(e, true);
                    });
                    Lampa.Player.listener.follow('ready', function (e) {
                        self.onPlayerStart(e, true);
                        self.hookVideoElement();
                    });
                    Lampa.Player.listener.follow('external', function (e) {
                        self.sessionIsInternal = false;
                        self.sessionIsExternal = true;
                        self.onPlayerStart(e);
                        var m = self.currentMovie || self.resolveMovieFromPlay(e) || Current.getMovie();
                        if (m) self.beginSession(m);
                        // гарантія: external-сесія running (навіть якщо destroy прийде слідом)
                        self.sessionIsExternal = true;
                        if (!self.sessionRunning) {
                            self.sessionStartedAt = Date.now();
                            self.sessionRunning = true;
                            self.sessionHadPlay = true;
                        }
                    });
                    Lampa.Player.listener.follow('destroy', function () {
                        // Just+/VLC: destroy при старті і при зміні серії — не вбивати сесію
                        var ext = self.sessionIsExternal || self.isExternalPlayer();
                        if (ext) {
                            self.sessionIsExternal = true;
                            if (!self.sessionRunning && self.sessionHadPlay) {
                                self.sessionStartedAt = Date.now();
                                self.sessionRunning = true;
                            }
                            self.saveSession();
                            return;
                        }
                        var serial = self._sessionSerial;
                        [500, 2000, 5000].forEach(function (ms) {
                            setTimeout(function () {
                                if (self._sessionSerial === serial) self.endSession('destroy');
                            }, ms);
                        });
                    });
                    // pause / play якщо є
                    try {
                        Lampa.Player.listener.follow('pause', function () { self.pauseSession(); });
                        Lampa.Player.listener.follow('play', function () { self.resumeSession(); });
                    } catch (e2) {}
                }
            } catch (e) {}

            try {
                if (Lampa.PlayerVideo && Lampa.PlayerVideo.listener) {
                    Lampa.PlayerVideo.listener.follow('play', function () {
                        self.hookVideoElement();
                        var m = self.currentMovie || Current.getMovie() || Media.lastCard;
                        if (m && !self.sessionHadPlay) self.beginSession(m);
                        else self.resumeSession();
                    });
                    Lampa.PlayerVideo.listener.follow('pause', function () {
                        self.pauseSession();
                    });
                    Lampa.PlayerVideo.listener.follow('ended', function () {
                        self.endSession('ended');
                    });
                    Lampa.PlayerVideo.listener.follow('timeupdate', function () {
                        // лише для підчеплення video element, не для нарахування
                        self.hookVideoElement();
                    });
                }
            } catch (e) {}

            // Timeline update — Just+/VLC часто пишуть позицію саме тут після повернення
            try {
                if (Lampa.Timeline && Lampa.Timeline.listener) {
                    Lampa.Timeline.listener.follow('update', function (e) {
                        if (!e) return;
                        var data = e.data || e;
                        var road = data.road || data;
                        if (!road) return;
                        var time = Number(road.time);
                        if (!Number.isFinite(time) || time < 0) return;
                        road = Object.assign({}, road, { hash: data.hash || road.hash });
                        var context = self.timelineOwner(road.hash);
                        if (!context) return;
                        // лише completed/position — без addWatchSeconds
                        setTimeout(function () { self.applyTimelineProgress(road, context); }, 300);
                    });
                }
            } catch (e) {}

            try {
                Lampa.Listener.follow('activity', function (e) {
                    if (!e) return;
                    if (e.type === 'start' || e.type === 'archive' || e.type === 'resume') {
                        self.queueReturn('activity', [800, 2500, 5000, 9000]);
                        setTimeout(function () { self.recoverSession(); }, 1500);
                    }
                });
            } catch (e) {}

            // Повернення фокусу в WebView (Android TV після Just+)
            try {
                document.addEventListener('visibilitychange', function () {
                    if (document.visibilityState === 'visible') {
                        self.queueReturn('visible', [1000, 3000, 6000]);
                        setTimeout(function () { self.recoverSession(); }, 2000);
                    } else if (document.visibilityState === 'hidden') {
                        // НЕ стартуємо сесію тут: інакше wall тікає до відкриття Just+/VLC
                        // (30 хв серія → 60 хв у статистиці). Старт лише openPlayer/play.
                        if (self.sessionHadPlay) self.saveSession();
                        if (self.sessionIsExternal) { self._externalAway = true; self._externalReturnAt = 0; }
                    }
                });
            } catch (e) {}
            try {
                window.addEventListener('focus', function () {
                    self.queueReturn('focus', [1200, 4000, 8000]);
                });
                window.addEventListener('blur', function () {
                    if (self.sessionIsExternal) { self._externalAway = true; self._externalReturnAt = 0; }
                });
            } catch (e) {}
            try {
                document.addEventListener('pause', function () {
                    if (self.sessionHadPlay) self.saveSession();
                    if (self.sessionIsExternal) { self._externalAway = true; self._externalReturnAt = 0; }
                }, false);
                document.addEventListener('resume', function () {
                    self.queueReturn('app-resume', [1500, 4000, 8000]);
                }, false);
            } catch (e) {}

            try {
                Lampa.Listener.follow('full', function (e) {
                    if (!e || !e.data) return;
                    if (e.type !== 'complite' && e.type !== 'start' && e.type !== 'complete') return;
                    var movie = e.data.movie || (e.object && e.object.card) || null;
                    if (!movie && e.object) {
                        movie = { id: e.object.id, title: e.object.title, name: e.object.name, method: e.object.method };
                    }
                    if (!movie) return;
                    if (e.object && !movie.id && e.object.id) movie = Object.assign({}, movie, { id: e.object.id });
                    var cast = null;
                    if (e.data.persons && e.data.persons.cast) cast = e.data.persons.cast;
                    else if (e.data.credits && e.data.credits.cast) cast = e.data.credits.cast;
                    if (cast && cast.length) {
                        movie = Object.assign({}, movie, { credits: { cast: cast }, persons: { cast: cast } });
                    }
                    setTimeout(function () {
                        movie = DomMeta.mergeInto(movie);
                        Media.remember(movie);
                        MetaLoader.enrich(movie);
                    }, 400);
                });
            } catch (e) {}

            // Резервний тік: якщо video грає — сесія running; якщо на паузі — pause
            this.startWatchdog();
        },

        startWatchdog: function () {
            var self = this;
            if (this.timer) return;
            this.timer = setInterval(function () { self.watchdog(); }, 2000);
        },

        stopWatchdog: function () {
            if (this.timer) {
                try { clearInterval(this.timer); } catch (e) {}
                this.timer = null;
            }
        },

        resolveMovieFromPlay: function (data) {
            if (!data) data = {};
            var movie = data.card || data.movie || data.element || null;
            if (movie && movie.card) movie = movie.card;
            if (!movie) {
                try {
                    var act = Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active();
                    if (act) {
                        movie = act.movie || act.card || null;
                        if (!movie && act.object) movie = act.object.movie || act.object.card || act.object || null;
                        if (!movie && act.component === 'full' && act.card) movie = act.card;
                    }
                } catch (e) {}
            }
            // online балансир: інколи лише title/url у data, картка в Media.lastCard
            if (!movie && Media.lastCard) {
                movie = Media.lastCard;
            }
            if (!movie && (data.title || data.fname || data.original_title || data.name)) {
                movie = {
                    title: data.title || data.fname || data.original_title || data.name || '',
                    name: data.name || data.title || data.fname || '',
                    original_title: data.original_title || '',
                    id: data.id || data.tmdb_id || ''
                };
                try {
                    var act2 = Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active();
                    if (act2) {
                        if (act2.card) movie = Object.assign({}, act2.card, movie);
                        else if (act2.movie) movie = Object.assign({}, act2.movie, movie);
                        if (act2.id && !movie.id) movie.id = act2.id;
                    }
                } catch (e2) {}
            }
            if (!movie) {
                try { movie = Current.getMovie(); } catch (e3) {}
            }
            if (!movie) return null;
            movie = Object.assign({}, movie);
            if (data.season != null) {
                movie.season_number = data.season;
                movie.season = data.season;
            }
            if (data.episode != null) {
                movie.episode_number = data.episode;
                movie.episode = data.episode;
            }
            if (data.timeline) movie.timeline = data.timeline;
            if (data.url || data.path || data.link) movie._stats_play_key = String(data.url || data.path || data.link);
            return movie;
        },

        onPlayerStart: function (e, internal) {
            var movie = this.resolveMovieFromPlay(e) || this.currentMovie || Current.getMovie();
            if (!movie) return;
            Media.remember(movie);
            movie = MetaStore.applyToMovie(CardCache.get(movie) || movie);
            this.currentMovie = movie;
            this.beginSession(movie);
            // start/ready належать внутрішньому маршруту Lampa, навіть коли
            // metadata ще не готові або загальне налаштування обирає external.
            if (internal) {
                this.sessionIsInternal = true;
                this.sessionIsExternal = false;
            }
            var serial = this._sessionSerial;
            MetaLoader.enrich(movie, function (rich) {
                if (Tracker._sessionSerial !== serial || Tracker._sessionCommitted) return;
                if (rich) {
                    Tracker.currentMovie = Media.mergeDetails(Tracker.sessionMovie || movie, MetaStore.applyToMovie(CardCache.get(rich) || rich));
                    Media.remember(rich);
                    if (Tracker.sessionMovie) {
                        Tracker.sessionMovie = Tracker.currentMovie;
                    }
                }
            });
            this.hookVideoElement();
        },



        // VLC/MX з online-балансера (Makhno/Bandera): Lampa.Android.openPlayer
        onAndroidOpenPlayer: function (data) {
            data = data || {};
            var movie = this.resolveMovieFromPlay(data) || this.currentMovie || null;
            if (!movie) {
                try { movie = Current.getMovie(); } catch (e0) {}
            }
            if (!movie) movie = Media.lastCard;
            if (!movie) {
                try {
                    var act = Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active();
                    if (act) movie = act.movie || act.card || (act.object && (act.object.movie || act.object.card)) || null;
                } catch (e1) {}
            }
            if (!movie) return false;

            movie = Object.assign({}, movie);
            var timeline = data.timeline;
            var plItem = null;
            if (!timeline && Array.isArray(data.playlist)) {
                for (var i = 0; i < data.playlist.length; i++) {
                    if (data.playlist[i] && data.playlist[i].timeline) {
                        timeline = data.playlist[i].timeline;
                        plItem = data.playlist[i];
                        break;
                    }
                }
                // активний елемент плейлиста
                if (!plItem && data.playlist.length) {
                    var idx = Number(data.playlist_index != null ? data.playlist_index : data.index);
                    if (Number.isFinite(idx) && data.playlist[idx]) plItem = data.playlist[idx];
                }
            }
            if (timeline) movie.timeline = timeline;
            // Season/episode з data / playlist (online Makhno/LampaUA)
            var se = data.season != null ? data.season : (data.season_number != null ? data.season_number : null);
            var ep = data.episode != null ? data.episode : (data.episode_number != null ? data.episode_number : null);
            if (plItem) {
                if (se == null && plItem.season != null) se = plItem.season;
                if (ep == null && plItem.episode != null) ep = plItem.episode;
                if (se == null && plItem.season_number != null) se = plItem.season_number;
                if (ep == null && plItem.episode_number != null) ep = plItem.episode_number;
                if (!timeline && plItem.timeline) { timeline = plItem.timeline; movie.timeline = timeline; }
            }
            if (se != null) { movie.season_number = se; movie.season = se; }
            if (ep != null) { movie.episode_number = ep; movie.episode = ep; }
            // Парсинг S01E02 з title/url
            if (!(movie.season_number || movie.episode_number)) {
                var blob = [data.title, data.fname, data.url, data.path, movie.title, movie.name].join(' ');
                var mSE = String(blob).match(/[sS](\d{1,2})[eE](\d{1,3})/);
                if (mSE) {
                    movie.season_number = parseInt(mSE[1], 10);
                    movie.season = movie.season_number;
                    movie.episode_number = parseInt(mSE[2], 10);
                    movie.episode = movie.episode_number;
                }
            }
            if (timeline && timeline.hash) {
                movie.timeline = movie.timeline || timeline;
                movie._stats_ep_key = String(timeline.hash);
            } else if (data.url || data.path || data.link) {
                movie._stats_ep_key = String(data.url || data.path || data.link).slice(-120);
            }

            // Новий файл/серія — закрити попередню сесію ДО beginSession
            if (this.sessionHadPlay && this.sessionMovie) {
                var prevId = Media.getId(this.sessionMovie);
                var nextId = Media.getId(movie);
                if (prevId !== nextId) {
                    this.endSession('switch');
                } else if (this.currentTimelineHash && timeline && timeline.hash &&
                    String(this.currentTimelineHash) !== String(timeline.hash)) {
                    this.endSession('switch');
                }
            }

            this.sessionIsInternal = false;
            this.sessionIsExternal = true;
            Media.remember(movie);
            movie = MetaStore.applyToMovie(CardCache.get(movie) || movie);
            this.currentMovie = movie;
            this.beginSession(movie, this._externalLaunched);
            this.sessionIsExternal = true;
            this._externalLaunched = true;
            if (!this.sessionRunning) {
                this.sessionStartedAt = Date.now();
                this.sessionRunning = true;
                this.sessionHadPlay = true;
            }
            var serial = this._sessionSerial;
            MetaLoader.enrich(movie, function (rich) {
                if (Tracker._sessionSerial !== serial || Tracker._sessionCommitted) return;
                if (!rich) return;
                Tracker.currentMovie = Media.mergeDetails(Tracker.sessionMovie || movie, MetaStore.applyToMovie(CardCache.get(rich) || rich));
                if (Tracker.sessionMovie) Tracker.sessionMovie = Tracker.currentMovie;
                Media.remember(rich);
            });
            this.saveSession();
            return true;
        },

        saveSession: function (force) {
            try {
                if (!this.sessionHadPlay && !this.sessionRunning) return;
                var movie = this.sessionMovie || this.currentMovie;
                if (!movie) return;
                var now = Date.now();
                if (!force && now - this._lastSessionSaveAt < 10000) return;
                var accum = this.sessionAccumMs;
                if (this.sessionRunning && this.sessionStartedAt) {
                    accum += Math.max(0, now - this.sessionStartedAt);
                }
                var payload = {
                    id: this.sessionWatchId || Media.getId(movie),
                    baseId: Media.getBaseId(movie),
                    title: Media.titleOf(movie),
                    poster: Media.posterOf(movie),
                    isEpisode: Media.isEpisode(movie),
                    season: movie.season_number || movie.season || 0,
                    episode: movie.episode_number || movie.episode || 0,
                    tmdb_id: movie.id || movie.tmdb_id || '',
                    original_title: movie.original_title || movie.original_name || '',
                    seedTime: this.sessionSeedTime || 0,
                    lastTl: this.sessionLastTl || 0,
                    startedAt: this._sessionWallStart || this.sessionStartedAt || now,
                    accumMs: accum,
                    alreadyAccounted: this.sessionAddedSec || 0,
                    isExternal: !!this.sessionIsExternal,
                    timelineHash: this.currentTimelineHash || (movie.timeline && movie.timeline.hash) || '',
                    heartbeat: now,
                    runtimeSec: this.resolveRuntimeSec(movie) || 0
                };
                if (!StorageIO.write(CONFIG.session_storage, payload)) StorageIO.warn();
                this._lastSessionSaveAt = now;
            } catch (e) {}
        },

        clearSession: function () {
            try { Lampa.Storage.set(CONFIG.session_storage, null); } catch (e) {}
            try { localStorage.removeItem(CONFIG.session_storage); } catch (e2) {}
        },

        // ВАЖЛИВО: recover більше НЕ нараховує час.
        // Раніше після F5 wall-сесія з Storage знову плюсувалась (8→14→25 хв).
        // Лише прибираємо застарілий payload.
        recoverSession: function () {
            try {
                var payload = Lampa.Storage.get(CONFIG.session_storage);
                if (!payload) return;
                // якщо сесія старша за 2 хв без активної — просто очистити
                var hb = Number(payload.heartbeat) || 0;
                if (!hb || Date.now() - hb > 120000) {
                    this.clearSession();
                }
            } catch (e) {
                try { this.clearSession(); } catch (e2) {}
            }
        },

        isExternalPlayer: function () {
            if (this.sessionIsInternal) return false;
            try {
                var p = Lampa.Storage.get('player') || Lampa.Storage.field('player') || '';
                p = String(p).toLowerCase();
                if (!p || p === 'inner' || p === 'lampa' || p === 'html5') return false;
                return true;
            } catch (e) {}
            try {
                if (!Current.getVideoState() && this.sessionHadPlay) return true;
            } catch (e2) {}
            return !!this.sessionIsExternal;
        },

        queueReturn: function (reason, delays) {
            if (!this.sessionHadPlay || this._sessionCommitted) return;
            var self = this, serial = this._sessionSerial;
            var external = this.sessionIsExternal || this.isExternalPlayer();
            var at = Date.now(), lived = at - this._sessionWallStart;
            if (external) {
                // Launch can emit foreground/activity events before Android hides Lampa.
                if (reason === 'activity' && !this._externalAway && lived < 1000) return;
                if (!this._externalReturnAt) this._externalReturnAt = at;
                at = this._externalReturnAt;
                if ((reason === 'activity' || lived < 1000) && !this._externalAway && lived < 15000 && reason !== 'android-time') {
                    delays = [Math.max(1000, 15000 - lived)];
                }
            }
            delays.forEach(function (ms) {
                setTimeout(function () {
                    if (self._sessionSerial !== serial) return;
                    if (external && self._externalReturnAt !== at) return;
                    self.endSession(reason);
                }, ms);
            });
        },

        timelineOwner: function (hash) {
            if (hash == null || hash === '') return null;
            var now = Date.now();
            for (var i = this.timelineContexts.length - 1; i >= 0; i--) {
                var c = this.timelineContexts[i];
                if (!c.discarded && String(c.hash) === String(hash) && (!c.closedAt || now - c.closedAt <= 120000)) return c;
            }
            return null;
        },

        finishSession: function (discarded) {
            if (this.timelineContext) {
                this.timelineContext.closedAt = Date.now();
                this.timelineContext.discarded = !!discarded;
            }
            this._sessionCommitted = true;
            this.sessionRunning = false;
            this.sessionStartedAt = 0;
            this.sessionAccumMs = 0;
            this.sessionHadPlay = false;
            this.sessionMovie = null;
            this.sessionSeedTime = 0;
            this.sessionIsExternal = false;
            this.sessionIsInternal = false;
            this._sessionWallStart = 0;
            this.sessionLastTl = 0;
            this.sessionAddedSec = 0;
            this.sessionWatchId = '';
            this.currentTimelineHash = null;
            this._externalReturnAt = 0;
            this.clearSession();
        },

        // Головний шлях для Just+/VLC: час з дельти Timeline (кожна серія окремо)
        // Timeline НЕ нараховує час (лише completed + last position).
        // Час тільки з wall-clock: flushPartial / endSession.
        applyTimelineProgress: function (road, context) {
            if (!Settings.collecting()) return false;
            if (!road) return false;
            context = context || this.timelineOwner(road.hash);
            if (!context || context.discarded || String(context.hash) !== String(road.hash)) return false;
            if (context.closedAt && Date.now() - context.closedAt > 120000) return false;
            var time = Number(road.time);
            if (!Number.isFinite(time) || time < 0) return false;
            var duration = Number(road.duration) || 0;
            if (context === this.timelineContext && !context.closedAt) {
                if (duration > 0) this._lastTimelineDuration = duration;
                this.sessionLastTl = time;
            }

            var movie = context === this.timelineContext && !context.closedAt ? this.sessionMovie : context.movie;
            if (!movie) return false;
            var id = context.watchId;
            try { StatsDB.setLast(id, time); } catch (e) {}

            // Позначка «переглянуто» без нарахування хвилин
            // майже кінець: ≥80% або лишилось ≤3 хв
            var nearEnd = false;
            if (duration > 60 && time > 0) {
                if (time / duration >= 0.80) nearEnd = true;
                if ((duration - time) <= 180 && time / duration >= 0.50) nearEnd = true;
                if ((duration - time) <= 120 && time > 60) nearEnd = true;
            }
            if (nearEnd && !StatsDB.data.completed[id]) {
                var meta = Media.metaFrom(movie);
                if (meta) meta.watchId = id;
                StatsDB.markCompleted(id, meta, movie);
            }
            return false;
        },

        beginSession: function (movie, newLaunch) {
            if (!Settings.collecting()) return;
            movie = movie || this.currentMovie;
            if (!movie) return;
            if (newLaunch && this.sessionHadPlay) this.endSession('switch');

            var id = Media.getId(movie);
            // Новий файл/серія — закрити попередню сесію (в т.ч. online без S/E)
            if (this.sessionMovie && this.sessionHadPlay) {
                var prevId = Media.getId(this.sessionMovie);
                var prevHash = this.currentTimelineHash || '';
                var nextHash = (movie.timeline && movie.timeline.hash) ? String(movie.timeline.hash) : '';
                // Only a trusted play/start/ready payload for the same file may supply a missing hash.
                if (!prevHash && nextHash && Media.getBaseId(this.sessionMovie) === Media.getBaseId(movie)
                    && movie._stats_play_key && movie._stats_play_key === this.sessionMovie._stats_play_key) {
                    prevHash = nextHash;
                    this.currentTimelineHash = nextHash;
                    if (this.timelineContext) this.timelineContext.hash = nextHash;
                }
                if (prevId !== id && !(prevHash && nextHash && prevHash === nextHash && Media.getBaseId(this.sessionMovie) === Media.getBaseId(movie))) {
                    this.endSession('switch');
                } else if (prevHash && nextHash && prevHash !== nextHash) {
                    this.endSession('switch');
                }
            }

            var isNew = !this.sessionMovie || !this.sessionHadPlay;

            this.sessionMovie = movie;
            this.currentMovie = movie;
            this.sessionHadPlay = true;
            // Завжди скидаємо commit при новій серії/фільмі (2-га серія після 1-ї)
            if (isNew) {
                this._sessionSerial++;
                this._lastSessionSaveAt = 0;
                this._sessionCommitted = false;
                this._sessionWallStart = Date.now();
                this.sessionLastTl = 0;
                this.sessionAccumMs = 0;
                this.sessionAddedSec = 0;
                // Фіксуємо id на всю сесію — online міняє hash/S-E і робив 2 commit
                this.sessionWatchId = Media.getId(movie);
                this.currentTimelineHash = movie.timeline && movie.timeline.hash || null;
                this._lastTimelineDuration = Number(movie.timeline && movie.timeline.duration) || 0;
                this._externalAway = false;
                this._externalReturnAt = 0;
                this._externalLaunched = false;
                this.timelineContext = { serial: this._sessionSerial, hash: this.currentTimelineHash, watchId: this.sessionWatchId, movie: movie, closedAt: 0 };
                this.timelineContexts.push(this.timelineContext);
                this.timelineContexts = this.timelineContexts.filter(function (c) { return !c.closedAt || Date.now() - c.closedAt <= 120000; }).slice(-8);
            }
            // не скидаємо _sessionCommitted на «тому ж» id без isNew

            if (this.isExternalPlayer()) {
                this.sessionIsExternal = true;
            }

            if (isNew || this.sessionSeedTime === 0) {
                var seed = this.readTimelineTime(movie);
                this.sessionSeedTime = seed > 0 ? seed : 0;
                var selfSeed = this;
                // повторний seed через 2с (timeline hash інколи з’являється пізніше)
                var seedSerial = this._sessionSerial;
                setTimeout(function () {
                    if (selfSeed._sessionSerial !== seedSerial) return;
                    if (selfSeed._externalReturnAt) return;
                    if (selfSeed._sessionCommitted) return;
                    if (!selfSeed.sessionMovie) return;
                    var s2 = selfSeed.readTimelineTime(selfSeed.sessionMovie);
                    // оновлюємо seed лише якщо ще майже не дивились (сесія < 30с wall)
                    var lived = selfSeed.sessionAccumMs + (selfSeed.sessionRunning && selfSeed.sessionStartedAt ? (Date.now() - selfSeed.sessionStartedAt) : 0);
                    if (lived < 30000 && s2 >= 0) {
                        selfSeed.sessionSeedTime = s2;
                        selfSeed.saveSession();
                    }
                }, 2000);
            }

            if (!this.sessionRunning) {
                if (!this.sessionStartedAt && this.sessionAccumMs === 0) {
                    this.sessionAccumMs = 0;
                }
                this.sessionStartedAt = Date.now();
                this.sessionRunning = true;
            }

            if (!this.sessionWatchId) this.sessionWatchId = Media.getId(movie);

            this.saveSession();
        },

        pauseSession: function () {
            if (!this.sessionRunning || !this.sessionStartedAt) return;
            var dt = Date.now() - this.sessionStartedAt;
            if (dt > 0) this.sessionAccumMs += dt;
            this.sessionStartedAt = 0;
            this.sessionRunning = false;
            this.saveSession(true);
        },

        resumeSession: function () {
            if (!Settings.collecting()) return;
            if (this._sessionCommitted) return;
            if (!this.sessionMovie && this.currentMovie) this.sessionMovie = this.currentMovie;
            if (!this.sessionMovie) return;
            if (this.sessionRunning) return;
            this.sessionStartedAt = Date.now();
            this.sessionRunning = true;
            this.sessionHadPlay = true;
        },

        readTimelineTime: function (movie) {
            var time = 0, duration = 0;
            try {
                if (movie && movie.timeline && Number.isFinite(Number(movie.timeline.time))) {
                    time = Number(movie.timeline.time);
                    duration = Number(movie.timeline.duration) || 0;
                }
            } catch (e0) {}
            try {
                if (Lampa.Timeline && typeof Lampa.Timeline.view === 'function') {
                    var hashes = [];
                    var ownedHash = this.currentTimelineHash || (movie && movie.timeline && movie.timeline.hash);
                    if (ownedHash) hashes.push(ownedHash);
                    if (!ownedHash && movie && Lampa.Utils && typeof Lampa.Utils.hash === 'function') {
                        var ot = movie.original_title || movie.original_name || movie.title || movie.name || '';
                        var season = movie.season_number || movie.season;
                        var episode = movie.episode_number || movie.episode;
                        if (season != null && episode != null && ot) {
                            hashes.push(Lampa.Utils.hash([season, episode, ot].join('')));
                            hashes.push(Lampa.Utils.hash(String(season) + ':' + String(episode) + ':' + String(ot)));
                        }
                        if (ot) hashes.push(Lampa.Utils.hash(String(ot)));
                        var idk = String(movie.id || movie.tmdb_id || '');
                        if (idk) hashes.push(Lampa.Utils.hash(idk + ':' + String(ot)));
                    }
                    for (var hi = 0; hi < hashes.length; hi++) {
                        if (!hashes[hi]) continue;
                        var road = Lampa.Timeline.view(hashes[hi]);
                        if (road && Number.isFinite(Number(road.time)) && Number(road.time) > time) {
                            time = Number(road.time);
                            duration = Number(road.duration) || duration;
                        }
                    }
                }
            } catch (e2) {}
            try {
                if (Lampa.Storage) {
                    ['player_road_last', 'timeline_last'].forEach(function (k) {
                        var last = Lampa.Storage.get(k);
                        var expected = Tracker.currentTimelineHash || (movie && movie.timeline && movie.timeline.hash);
                        if (expected && last && String(last.hash) === String(expected) && Number.isFinite(Number(last.time)) && Number(last.time) > time) {
                            time = Number(last.time);
                            duration = Number(last.duration) || duration;
                        }
                    });
                    // Усі ключі file_view* (профіль CUB/Kinohub)
                    var storageKeys = [];
                    try {
                        for (var i = 0; i < localStorage.length; i++) {
                            var sk = localStorage.key(i);
                            if (sk && (sk === 'file_view' || sk.indexOf('file_view_') === 0 || sk === 'online_view')) {
                                storageKeys.push(sk);
                            }
                        }
                    } catch (eLs) {
                        storageKeys = ['file_view', 'online_view'];
                    }
                    var preferHash = this.currentTimelineHash;
                    storageKeys.forEach(function (fk) {
                        try {
                            var map = Lampa.Storage.get(fk.replace(/^lampa_/, ''));
                            // Storage.get may need raw key
                            if (!map || typeof map !== 'object') {
                                try { map = JSON.parse(localStorage.getItem(fk) || 'null'); } catch (eJ) { map = null; }
                            }
                            if (!map || typeof map !== 'object') return;
                            if (preferHash && map[preferHash] && Number.isFinite(Number(map[preferHash].time))) {
                                var pr = map[preferHash];
                                if (Number(pr.time) >= time) {
                                    time = Number(pr.time);
                                    duration = Number(pr.duration) || duration;
                                }
                            }
                        } catch (eFv) {}
                    });
                }
            } catch (e3) {}
            this._lastTimelineDuration = duration;
            return time;
        },

        // Тривалість з TMDB / картки (хв або сек → сек)
        resolveRuntimeSec: function (movie) {
            if (!movie) return 0;
            var r = 0;
            try {
                if (Number.isFinite(Number(movie.runtime)) && Number(movie.runtime) > 0) {
                    r = Number(movie.runtime);
                    // TMDB movie.runtime у хвилинах; якщо > 300 — вже секунди
                    if (r > 0 && r <= 400) r = r * 60;
                }
                if (!r && movie.episode_run_time) {
                    var ert = movie.episode_run_time;
                    if (Array.isArray(ert) && ert.length) r = Number(ert[0]) * 60;
                    else if (Number(ert) > 0) r = Number(ert) * 60;
                }
                if (!r && movie.last_episode_to_air && Number(movie.last_episode_to_air.runtime) > 0) {
                    r = Number(movie.last_episode_to_air.runtime) * 60;
                }
                // з кешу CardCache
                var c = CardCache.get(movie);
                if (c && c !== movie) {
                    if (!r && Number(c.runtime) > 0) {
                        r = Number(c.runtime);
                        if (r <= 400) r = r * 60;
                    }
                    if (!r && c.episode_run_time) {
                        var ert2 = c.episode_run_time;
                        if (Array.isArray(ert2) && ert2.length) r = Number(ert2[0]) * 60;
                        else if (Number(ert2) > 0) r = Number(ert2) * 60;
                    }
                }
            } catch (e) {}
            if (!r && this._lastTimelineDuration > 60) r = this._lastTimelineDuration;
            return Math.floor(r || 0);
        },

        // Внутрішній плеєр: періодично скидати час у статистику (не чекати закриття)
        flushPartial: function () {
            if (!Settings.collecting()) return;
            if (this.sessionIsExternal) return;
            if (this._sessionCommitted) return;
            if (!this.sessionHadPlay && !this.sessionRunning) return;

            if (this.sessionRunning && this.sessionStartedAt) {
                var dt = Date.now() - this.sessionStartedAt;
                if (dt > 0) this.sessionAccumMs += dt;
                this.sessionStartedAt = Date.now();
            }

            var sec = Math.floor((this.sessionAccumMs || 0) / 1000);
            if (sec < 30) return;

            var movie = this.sessionMovie || this.currentMovie || Current.getMovie() || Media.lastCard;
            if (!movie) return;

            var meta = Media.metaFrom(movie);
            if (meta) meta.watchId = this.sessionWatchId || Media.getId(movie);
            StatsDB.addWatchSeconds(sec, meta);
            this.sessionAccumMs = 0;
            this.sessionAddedSec = (this.sessionAddedSec || 0) + sec;
            this.lastPartialFlushAt = Date.now();
            // після partial — оновити wall start, щоб не накрутити
            if (this.sessionRunning) this.sessionStartedAt = Date.now();
            this.saveSession();
        },

        endSession: function (reason) {
            if (this._sessionCommitted) return;
            if (!this.sessionHadPlay && !this.sessionRunning && this.sessionAccumMs === 0) return;

            reason = reason || '';
            var ext = this.sessionIsExternal || this.isExternalPlayer();
            // Повернення фокусу/Activity не завершує внутрішній плеєр,
            // який досі відкритий (у тому числі на паузі).
            if (!ext && this.sessionIsInternal && (reason === 'activity' || reason === 'visible'
                || reason === 'focus' || reason === 'app-resume' || reason === 'android-time' || reason === 'timeline')) {
                try {
                    if (Lampa.Player && typeof Lampa.Player.opened === 'function' && Lampa.Player.opened()) return;
                } catch (eOpen) {}
            }
            // Поки користувач у Just+/VLC: не комітити на обриві потоку / destroy / callback
            // Фіксація лише після повернення в Lampa (activity / visible / focus)
            if (ext && reason && reason !== 'activity' && reason !== 'visible' && reason !== 'focus'
                && reason !== 'app-resume' && reason !== 'android-time'
                && reason !== 'switch' && reason !== 'timeline') {
                this.sessionIsExternal = true;
                if (!this.sessionRunning) {
                    this.sessionStartedAt = Date.now();
                    this.sessionRunning = true;
                    this.sessionHadPlay = true;
                }
                this.saveSession();
                return;
            }

            // зняти поточний відрізок у accum
            if (this.sessionRunning && this.sessionStartedAt) {
                var clockEnd = ext && this._externalReturnAt ? this._externalReturnAt : Date.now();
                var dt = clockEnd - this.sessionStartedAt;
                if (dt > 0) this.sessionAccumMs += dt;
            }
            this.sessionRunning = false;
            this.sessionStartedAt = 0;

            var ms = this.sessionAccumMs;
            var movie = this.sessionMovie || this.currentMovie || Media.lastCard;
            var seed = this.sessionSeedTime || 0;
            var wasExternal = this.sessionIsExternal;

            if (!Settings.collecting()) return;
            if (!movie) {
                // спроба відновити картку
                try { movie = Current.getMovie(); } catch (eM) {}
            }
            if (!movie) return;

            var wallSec = Math.floor(ms / 1000);
            // external: повний час від старту сесії (обрив TorrServe не ріже таймер)
            wasExternal = wasExternal || this.isExternalPlayer();
            var internalAddedSec = wasExternal ? 0 : Math.max(0, this.sessionAddedSec || 0);
            if (wasExternal && this._sessionWallStart) {
                var fullWall = Math.floor(((this._externalReturnAt || Date.now()) - this._sessionWallStart) / 1000);
                var accounted = this.sessionAddedSec || 0;
                var fromStart = Math.max(0, fullWall - accounted);
                // не роздувати wall «до відкриття плеєра» понад розумне
                if (fromStart > wallSec) {
                    // якщо accum майже порожній, а fullWall великий — підозра на ранній старт
                    if (wallSec >= 15 && fromStart > wallSec * 1.8) {
                        // лишаємо accum (реальніший)
                    } else {
                        wallSec = fromStart;
                    }
                }
            }

            // Єдине джерело часу — wall-clock. Timeline не додає хвилини.
            if (wallSec < 15 && !internalAddedSec) {
                // A confirmed short return is over; do not count idle time in Lampa.
                this.finishSession(true);
                return;
            }

            var tNow = this.readTimelineTime(movie);
            if (this.sessionLastTl > tNow) tNow = this.sessionLastTl;
            var tlDuration = this._lastTimelineDuration || 0;
            try {
                if ((!tlDuration || tlDuration < 30) && movie.timeline) {
                    tlDuration = Number(movie.timeline.duration) || tlDuration;
                }
            } catch (eD) {}

            var runtimeSec = this.resolveRuntimeSec(movie);
            var duration = tlDuration > 60 ? tlDuration : runtimeSec;
            var hardCap = 3 * 3600;
            if (duration > 60) hardCap = Math.floor(duration) + 60;
            if (runtimeSec >= 300) hardCap = Math.min(hardCap, runtimeSec + 60);

            // tlDelta не додає час — лише стеля для external
            var tlDelta = 0;
            if (tNow > seed + 5) tlDelta = Math.floor(tNow - seed);

            var sec = wallSec;
            if (this.sessionAddedSec > 0) {
                sec = Math.max(0, sec);
            }
            // Just+ skip intro: position стрибає вперед, wall лишається реальним —
            // якщо є tlDelta, не даємо wall роздутись вище прогресу+grace
            if (wasExternal && tlDelta >= 15) {
                sec = Math.min(sec, tlDelta + 90);
            }
            // Жорстка стеля: не більше тривалості серії/фільму
            if (runtimeSec >= 300) {
                sec = Math.min(sec, runtimeSec + 30);
            }
            if (duration > 60) {
                var remainCap = Math.floor(duration - Math.max(0, seed)) + 90;
                if (remainCap > 60) sec = Math.min(sec, remainCap);
            }
            // захист від подвійного commit (~2× runtime)
            if (runtimeSec >= 300 && sec > runtimeSec * 1.2) {
                sec = runtimeSec;
            }
            sec = Math.min(sec, hardCap);
            sec = Math.min(sec, 21600);

            if (sec < 15 && !internalAddedSec) { this.finishSession(true); return; }

            var meta = Media.metaFrom(movie);
            var watchId = this.sessionWatchId || Media.getId(movie);
            if (meta) meta.watchId = watchId;
            StatsDB.addWatchSeconds(sec, meta);
            this.finishSession(false);

            // Completed — online/Just+ часто без фінальної позиції timeline
            try {
                var done = false;
                var completedSec = sec + internalAddedSec;
                var isEp = Media.isEpisode(movie);
                // online-серіал інколи без episode_number — все одно серія
                if (!isEp && movie && (movie.original_name || movie.number_of_seasons || movie.first_air_date ||
                    (meta && meta.isEpisode))) isEp = true;
                var dur = duration > 60 ? duration : (tlDuration > 60 ? tlDuration : 0);
                if (dur > 60 && tNow > 0) {
                    if (tNow / dur >= 0.78) done = true;
                    if ((dur - tNow) <= 200 && tNow / dur >= 0.45) done = true;
                    if ((dur - tNow) <= 150 && tNow > 60) done = true;
                }
                if (!done && runtimeSec >= 240) {
                    if (completedSec >= runtimeSec * 0.70) done = true;
                    if (tNow > 0 && (runtimeSec - tNow) <= 200 && tNow >= runtimeSec * 0.45) done = true;
                }
                if (!done && tNow > 0 && tlDuration > 60) {
                    if (tNow / tlDuration >= 0.78) done = true;
                    if ((tlDuration - tNow) <= 200 && tNow > 60) done = true;
                }
                if (!done && wasExternal) {
                    var progressGuess = (seed > 0 ? seed : 0) + sec;
                    if (dur > 60 && progressGuess >= dur * 0.68) done = true;
                    if (runtimeSec >= 240 && progressGuess >= runtimeSec * 0.68) done = true;
                    if (dur > 60 && sec >= dur * 0.65) done = true;
                    if (runtimeSec >= 240 && sec >= runtimeSec * 0.65) done = true;
                    // серія ~18+ хв wall — у «Переглянуто» (timeline міг мовчати)
                    if (isEp && sec >= 18 * 60) done = true;
                    if (!isEp && sec >= 40 * 60) done = true;
                }
                if (!done && isEp && completedSec >= 22 * 60) done = true;
                try {
                    var pct = 0;
                    if (movie.timeline && Number.isFinite(Number(movie.timeline.percent))) {
                        pct = Number(movie.timeline.percent);
                    }
                    if (!pct && tNow > 0 && dur > 60) pct = (tNow / dur) * 100;
                    if (pct >= 75) done = true;
                } catch (ePct) {}
                if (done) {
                    var cid = (meta && meta.watchId) || Media.getId(movie);
                    if (meta && isEp) meta.isEpisode = true;
                    StatsDB.markCompleted(cid, meta, movie);
                }
            } catch (eC) {}
        },

        hookVideoElement: function () {
            var self = this;
            try {
                var video = null;
                if (Lampa.PlayerVideo && typeof Lampa.PlayerVideo.video === 'function') {
                    video = Lampa.PlayerVideo.video();
                }
                if (!video) video = document.querySelector('.player video') || document.querySelector('video');
                if (!video) return;
                video._stats_clock_serial = self._sessionSerial;
                if (video._stats_clock_hooked) return;
                video._stats_clock_hooked = true;
                function current() { return video._stats_clock_serial === self._sessionSerial && !self._sessionCommitted; }
                video.addEventListener('play', function () { if (current()) self.resumeSession(); });
                video.addEventListener('playing', function () { if (current()) self.resumeSession(); });
                video.addEventListener('pause', function () { if (current()) self.pauseSession(); });
                video.addEventListener('ended', function () { if (current()) self.endSession('video-ended'); });
                // якщо вже грає
                if (!video.paused && !video.ended) {
                    self.resumeSession();
                }
            } catch (e) {}
        },

        watchdog: function () {
            if (!Settings.collecting()) return;
            try {
                var video = null;
                if (Lampa.PlayerVideo && typeof Lampa.PlayerVideo.video === 'function') {
                    video = Lampa.PlayerVideo.video();
                }
                if (!video) video = document.querySelector('.player video') || document.querySelector('video');

                if (video && !video.paused && !video.ended) {
                    // внутрішній плеєр грає — гарантовано стартуємо сесію
                    if (!this.sessionIsExternal) {
                        var m = this.sessionMovie || this.currentMovie || Current.getMovie() || Media.lastCard;
                        if (m && !this.sessionHadPlay) {
                            this.beginSession(m);
                        } else if (m && !this.sessionRunning) {
                            this.resumeSession();
                        } else if (!m) {
                            // остання спроба з Activity
                            try {
                                var act = Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active();
                                if (act && (act.card || act.movie)) {
                                    this.beginSession(act.movie || act.card);
                                }
                            } catch (eA) {}
                        }
                    } else if (this.currentMovie || this.sessionMovie) {
                        if (!this.sessionRunning) this.resumeSession();
                    }
                    this.hookVideoElement();

                    // partial flush раз на ~60с для internal
                    if (!this.sessionIsExternal) {
                        var now = Date.now();
                        if (!this.lastPartialFlushAt) this.lastPartialFlushAt = now;
                        if (now - this.lastPartialFlushAt >= 60000) {
                            this.flushPartial();
                        }
                    }
                } else if (video && video.paused && this.sessionRunning && !this.sessionIsExternal) {
                    this.pauseSession();
                    this.flushPartial();
                }

                if (this.sessionHadPlay || this.sessionRunning) {
                    this.saveSession();
                }
            } catch (e) {}
        }
    };

    // ===================== Scroll =====================
    function makeScroll() {
        return new Lampa.Scroll({ mask: true, over: true, step: 150 });
    }

    function bindWheel(scroll) {
        try {
            var node = scroll.render();
            if (!node || node._stv_wheel) return;
            node._stv_wheel = true;
            var handler = function (e) {
                var dy = e.deltaY || (e.wheelDelta ? -e.wheelDelta : 0) || 0;
                if (!dy) return;
                e.preventDefault();
                e.stopPropagation();
                var step = dy > 0 ? 150 : -150;
                if (typeof scroll.wheel === 'function') scroll.wheel(step);
                else if (typeof scroll.move === 'function') scroll.move(step);
            };
            node.addEventListener('wheel', handler, { passive: false });
            node.addEventListener('mousewheel', handler, { passive: false });
        } catch (e) {}
    }

    function bindController(scroll) {
        try {
            Lampa.Controller.add('content', {
                toggle: function () {
                    Lampa.Controller.collectionSet(scroll.render());
                    Lampa.Controller.collectionFocus(false, scroll.render());
                },
                left: function () {
                    if (Navigator.canmove('left')) Navigator.move('left');
                    else Lampa.Controller.toggle('menu');
                },
                right: function () {
                    if (Navigator.canmove('right')) Navigator.move('right');
                },
                up: function () {
                    if (Navigator.canmove('up')) Navigator.move('up');
                    else Lampa.Controller.toggle('head');
                },
                down: function () {
                    if (Navigator.canmove('down')) Navigator.move('down');
                    else if (typeof scroll.wheel === 'function') scroll.wheel(200);
                    else if (typeof scroll.move === 'function') scroll.move(200);
                },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        } catch (e) {}
    }

    function bindFocusScroll(html, scroll) {
        html.find('.selector').on('hover:focus focus hover:enter', function () {
            try { scroll.update($(this), true); } catch (e) {}
        });
    }

    // ===================== UI =====================
    function StatsComponent() {
        var scroll = makeScroll();
        var html = $('<div class="stv-root"></div>');

        this.create = function () {
            renderAll(html);
            scroll.clear();
            scroll.append(html);
            bindFocusScroll(html, scroll);
            bindWheel(scroll);
            try { if (this.activity && this.activity.loader) this.activity.loader(false); } catch (e) {}
        };

        this.start = function () {
            try {
                if (typeof scroll.minus === 'function') scroll.minus();
            } catch (e) {}
            bindController(scroll);
            bindWheel(scroll);
        };

        this.pause = function () {};
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            try { scroll.destroy(); } catch (e) {}
            html.remove();
        };

        function renderAll(root) {
            root.empty();
            var heading = $('<div class="stv-heading"></div>');
            heading.append($('<div class="stv-title"></div>').text(LANG.page_title));
            heading.append($('<div class="stv-period"></div>').text(LANG.all_time));
            root.append(heading);

            if (!Settings.collecting()) root.append('<div class="stv-disabled">' + LANG.disabled_text + '</div>');

            var has = StatsDB.data.seconds_watched > 0 || StatsDB.data.movies_watched > 0 || StatsDB.data.episodes_watched > 0;
            if (!has) {
                root.append('<div class="stv-empty selector">' + LANG.empty_text + '</div>');
                root.append(resetBtn(root));
                return;
            }
            root.append(topCards());
            root.append(actorsBlock());
            root.append(bottomRow());
            root.append(resetBtn(root));
        }

        function topCards() {
            var row = $('<div class="stv-cards"></div>');
            row.append(totalTimeWithLevelCard());
            row.append(watchedCard());
            row.append(genreCard());
            return row;
        }

        function totalTimeWithLevelCard() {
            var info = LevelSystem.info();
            var c = $('<div class="stv-card selector stv-card-total"></div>');
            c.append('<div class="stv-card-label">' + LANG.total_time + '</div>');
            var body = $('<div class="stv-card-body stv-total-body"></div>');
            body.append('<div class="stv-card-val">' + StatsDB.formatTime(StatsDB.data.seconds_watched) + '</div>');
            var level = $('<div class="stv-level-inline"></div>');
            level.append($('<span class="stv-level-num-sm"></span>').text(String(info.level) + ' ·'));
            level.append($('<span class="stv-level-name-sm"></span>').text(info.name || ''));
            level.append($('<span class="stv-level-percent"></span>').text(Math.round(info.progress * 100) + '%'));
            body.append(level);
            body.append('<div class="stv-level-bar stv-level-bar-sm"><div class="stv-level-fill" style="width:' + Math.round(info.progress * 100) + '%"></div></div>');
            var sub = info.max ? LANG.level_max : (LANG.level_to + ' «' + info.nextName + '» — ' + StatsDB.formatTime(info.toNext));
            body.append('<div class="stv-level-sub">' + sub + '</div>');
            c.append(body);
            return c;
        }

        function watchedCard() {
            var c = $('<div class="stv-card selector stv-card-watched"></div>');
            c.append('<div class="stv-card-label">' + LANG.watched + '</div>');
            var body = $('<div class="stv-card-body stv-watched-body"></div>');
            body.append('<div class="stv-watched-counts"><div class="stv-count"><span class="stv-big">' + (StatsDB.data.movies_watched || 0) + '</span><span class="stv-sub">' + I18n.noun(LANG.movie_forms, StatsDB.data.movies_watched) + '</span></div><div class="stv-count"><span class="stv-big">' + (StatsDB.data.episodes_watched || 0) + '</span><span class="stv-sub">' + I18n.noun(LANG.episode_forms, StatsDB.data.episodes_watched) + '</span></div></div>');
            var posters = $('<div class="stv-posters"></div>');
            StatsDB.recentCompleted(CONFIG.max_posters_show).forEach(function (item) {
                var p = $('<div class="stv-poster"></div>').attr('title', item.title || '');
                var url = posterUrl(item.poster, 'w92');
                if (url) p.css('background-image', 'url("' + url.replace(/"/g, '') + '")');
                else {
                    p.addClass('stv-poster-empty');
                    p.text(item.isEpisode ? LANG.episode_initial : LANG.movie_initial);
                }
                if (item.isEpisode) p.append($('<span class="stv-poster-badge"></span>').text(LANG.episode_badge));
                posters.append(p);
            });
            body.append(posters);
            body.append($('<div class="stv-open-watched"></div>').text(LANG.open_watched + ' →'));
            c.append(body);
            c.on('hover:enter click', function () {
                try {
                    Lampa.Activity.push({
                        url: 'stats_watched',
                        title: LANG.watched_list_title,
                        component: CONFIG.activity_watched,
                        page: 1
                    });
                } catch (e) {}
            });
            return c;
        }

        function genreCard() {
            var g = StatsDB.topGenre();
            var c = $('<div class="stv-card selector stv-card-genre"></div>');
            c.append($('<div class="stv-card-label"></div>').text(LANG.fav_genre));
            var body = $('<div class="stv-card-body stv-genre-body"></div>');
            body.append($('<div class="stv-genre-name"></div>').text(I18n.genreName(g.name)));
            body.append($('<div class="stv-genre-pct"></div>').text(g.percent + '%'));
            body.append($('<div class="stv-genre-context"></div>').text(LANG.genre_share));
            c.append(body);
            return c;
        }

        function actorsBlock() {
            var wrap = $('<div class="stv-section"></div>');
            wrap.append($('<div class="stv-section-title"></div>').text(LANG.fav_actors));

            var scrollWrap = $('<div class="stv-actors-scroll"></div>');
            var row = $('<div class="stv-actors"></div>');
            var list = StatsDB.topActors(CONFIG.max_actors_show);

            if (!list.length) {
                row.append('<div class="stv-muted">' + LANG.no_actors + '</div>');
            } else {
                list.forEach(function (a) {
                    var item = $('<div class="stv-actor selector"></div>').attr('title', a.name || '');
                    var img = posterUrl(a.profile_path, 'w185');

                    if (img) item.append($('<div class="stv-actor-photo"></div>').css('background-image', cssImage(img)));
                    else item.append($('<div class="stv-actor-photo stv-actor-ph"></div>').text((a.name || '?').charAt(0)));

                    item.append($('<div class="stv-actor-name"></div>').text(a.name || ''));
                    item.append('<div class="stv-actor-meta">' + StatsDB.formatTime(a.seconds || 0) + '</div>');

                    // Горизонтальний скрол на ТВ
                    item.on('hover:focus focus', function () {
                        try {
                            var el = this;
                            var container = row[0];
                            if (!container) return;

                            var itemLeft = el.offsetLeft;
                            var itemWidth = el.offsetWidth;
                            var contWidth = container.clientWidth;
                            var scrollLeft = container.scrollLeft;

                            if (itemLeft < scrollLeft + 10) {
                                container.scrollLeft = Math.max(0, itemLeft - 20);
                            } else if (itemLeft + itemWidth > scrollLeft + contWidth - 10) {
                                container.scrollLeft = itemLeft + itemWidth - contWidth + 30;
                            }
                        } catch (e) {}
                    });

                    item.on('hover:enter click', function () { openActorPage(a); });
                    row.append(item);
                });
            }

            scrollWrap.append(row);
            wrap.append(scrollWrap);
            return wrap;
        }

        function bottomRow() {
            var row = $('<div class="stv-bottom"></div>');

            var months = $('<div class="stv-panel stv-panel-months selector"></div>');
            var periods = StatsDB.monthPeriods();
            var period = periods[0] || 'legacy';
            function renderMonths() {
                months.empty();
                months.append($('<div class="stv-section-title"></div>').text(LANG.records + (period !== 'legacy' ? ' · ' + period : '')));
                if (period === 'legacy') months.append($('<div class="stv-muted"></div>').text(LANG.legacy_months));
                months.append(monthBars(period));
            }
            renderMonths();
            months.on('hover:enter click', function () {
                if (periods.length < 2 || !Lampa.Select) return;
                function restore() { try { Lampa.Controller.toggle('content'); } catch (e) {} }
                Lampa.Select.show({ title: LANG.month_period, items: periods.map(function (p) {
                    return { title: p === 'legacy' ? LANG.legacy_months : p, period: p, selected: p === period };
                }), onSelect: function (item) { period = item.period; renderMonths(); restore(); }, onBack: restore });
            });
            row.append(months);

            var years = $('<div class="stv-panel stv-panel-years selector"></div>');
            years.append($('<div class="stv-section-title"></div>').text(LANG.by_years));
            years.append(yearBars());
            row.append(years);

            var genres = $('<div class="stv-panel selector"></div>');
            genres.append($('<div class="stv-section-title"></div>').text(LANG.genres_dist));
            genres.append(genreBars());
            row.append(genres);
            return row;
        }

        function monthBars(period) {
            var data = StatsDB.monthList(period);
            var box = $('<div class="stv-bars stv-bars--months"></div>');
            if (!data.length) {
                box.append('<div class="stv-muted">—</div>');
                return box;
            }
            var max = 1;
            data.forEach(function (d) { if (d.seconds > max) max = d.seconds; });

            data.forEach(function (d) {
                var h = Math.max(1, Math.round((d.seconds / max) * 100));
                var timeText = StatsDB.formatHoursOrMin(d.seconds);

                var col = $('<div class="stv-bar-col"></div>').css('--stv-bar-size', h + '%');
                var wrap = $('<div class="stv-bar-wrap"></div>');
                wrap.append($('<div class="stv-bar-time"></div>').text(timeText));
                wrap.append($('<div class="stv-bar"></div>').css('height', h + '%'));
                col.append(wrap);
                col.append($('<div class="stv-bar-label"></div>').text(I18n.monthName(d.index, d.label)));
                box.append(col);
            });
            return box;
        }

        function yearBars() {
            var data = StatsDB.yearBuckets();
            var box = $('<div class="stv-bars stv-bars--years"></div>');
            if (!data.length) { box.append('<div class="stv-muted">—</div>'); return box; }
            var max = 1;
            data.forEach(function (d) { if (d.seconds > max) max = d.seconds; });
            data.forEach(function (d) {
                var h = Math.max(1, Math.round((d.seconds / max) * 100));
                var col = $('<div class="stv-bar-col"></div>').css('--stv-bar-size', h + '%');
                var wrap = $('<div class="stv-bar-wrap"></div>');
                wrap.append($('<div class="stv-bar-time"></div>').text(StatsDB.formatHoursOrMin(d.seconds)));
                wrap.append($('<div class="stv-bar"></div>').css('height', h + '%'));
                col.append(wrap);
                col.append($('<div class="stv-bar-label"></div>').text(I18n.decade(d.decade, d.label)));
                box.append(col);
            });
            return box;
        }

        function genreBars() {
            var list = StatsDB.genreList().slice(0, 6);
            var box = $('<div class="stv-genres"></div>');
            if (!list.length) { box.append('<div class="stv-muted">—</div>'); return box; }
            var total = 0;
            list.forEach(function (g) { total += g.seconds; });
            if (total <= 0) total = 1;
            list.forEach(function (g, i) {
                var p = (g.seconds / total) * 100;
                var row = $('<div class="stv-genre-row"></div>');
                var label = $('<div class="stv-genre-row-label"></div>');
                label.append($('<span></span>').text(I18n.genreName(g.name)));
                label.append($('<span class="stv-genre-row-value"></span>').text(Math.round(p) + '%'));
                row.append(label);
                row.append($('<div class="stv-genre-track"></div>').append(
                    $('<div class="stv-genre-fill stv-genre-fill-' + i + '"></div>').css('width', p + '%')
                ));
                box.append(row);
            });
            return box;
        }

        function resetBtn(root) {
            var b = $('<div class="stv-reset selector">' + LANG.reset + '</div>');

            b.on('hover:enter click', function () {
                if (Lampa.Select && typeof Lampa.Select.show === 'function') {
                    Lampa.Select.show({
                        title: LANG.reset_confirm,
                        items: [
                            {
                                title: LANG.reset_yes,
                                confirm: true
                            },
                            {
                                title: LANG.reset_no
                            }
                        ],
                        onSelect: function (item) {
                            if (item && item.confirm) {
                                StatsDB.reset();
                                if (Lampa.Noty) Lampa.Noty.show(LANG.reset_done);

                                renderAll(root);
                                scroll.clear();
                                scroll.append(root);
                                bindFocusScroll(root, scroll);
                                bindWheel(scroll);

                                setTimeout(function () {
                                    try {
                                        if (typeof scroll.minus === 'function') scroll.minus();
                                        bindController(scroll);
                                        Lampa.Controller.toggle('content');
                                        Lampa.Controller.collectionSet(scroll.render());
                                        Lampa.Controller.collectionFocus(false, scroll.render());
                                    } catch (e) {
                                        console.log('reset controller restore', e);
                                    }
                                }, 150);
                            } else {
                                setTimeout(function () {
                                    try {
                                        Lampa.Controller.toggle('content');
                                        Lampa.Controller.collectionSet(scroll.render());
                                        Lampa.Controller.collectionFocus(false, scroll.render());
                                    } catch (e) {}
                                }, 100);
                            }
                        },
                        onBack: function () {
                            setTimeout(function () {
                                try {
                                    Lampa.Controller.toggle('content');
                                    Lampa.Controller.collectionSet(scroll.render());
                                    Lampa.Controller.collectionFocus(false, scroll.render());
                                } catch (e) {}
                            }, 100);
                        }
                    });
                } else {
                    if (window.confirm(LANG.reset_confirm)) {
                        StatsDB.reset();
                        if (Lampa.Noty) Lampa.Noty.show(LANG.reset_done);
                        renderAll(root);
                        scroll.clear();
                        scroll.append(root);
                        bindFocusScroll(root, scroll);
                        bindWheel(scroll);
                        setTimeout(function () {
                            bindController(scroll);
                            Lampa.Controller.toggle('content');
                        }, 100);
                    }
                }
            });

            return b;
        }
    }

    function ActorWorksComponent(object) {
        var scroll = makeScroll();
        var html = $('<div class="stv-root"></div>');
        var key = (object && object.actor_key) || '';

        this.create = function () {
            render();
            scroll.clear();
            scroll.append(html);
            bindFocusScroll(html, scroll);
            bindWheel(scroll);
            try { if (this.activity && this.activity.loader) this.activity.loader(false); } catch (e) {}
        };
        this.start = function () {
            try { if (typeof scroll.minus === 'function') scroll.minus(); } catch (e) {}
            bindController(scroll);
            bindWheel(scroll);
        };
        this.pause = function () {};
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            try { scroll.destroy(); } catch (e) {}
            html.remove();
        };

        function render() {
            html.empty();
            var actor = StatsDB.data.actors[key];
            var name = (actor && actor.name) || (object && object.title) || LANG.actor_works;
            html.append($('<div class="stv-title"></div>').text(name || ''));
            html.append('<div class="stv-section-title">' + LANG.actor_works + '</div>');
            var works = StatsDB.actorWorks(key);
            if (!works.length) {
                html.append('<div class="stv-empty selector">' + LANG.no_works + '</div>');
                return;
            }
            var list = $('<div class="stv-works"></div>');
            works.forEach(function (w) {
                var row = $('<div class="stv-work selector"></div>');
                var poster = $('<div class="stv-work-poster"></div>');
                var url = posterUrl(w.poster, 'w92');
                if (url) poster.css('background-image', 'url("' + url.replace(/"/g, '') + '")');
                else poster.addClass('stv-poster-empty').text(w.isEpisode ? LANG.episode_initial : LANG.movie_initial);
                var info = $('<div class="stv-work-info"></div>');
                info.append($('<div class="stv-work-title"></div>').text(w.title || ''));
                info.append('<div class="stv-work-meta">' + (w.isEpisode ? LANG.series_ep : LANG.film) + ' · ' + StatsDB.formatTime(w.seconds) + (w.completed ? ' · ✓' : '') + '</div>');
                row.append(poster);
                row.append(info);
                list.append(row);
            });
            html.append(list);
        }
    }


    function WatchedListComponent(object) {
        var scroll = makeScroll();
        var html = $('<div class="stv-root"></div>');

        this.create = function () {
            render();
            scroll.clear();
            scroll.append(html);
            bindFocusScroll(html, scroll);
            bindWheel(scroll);
            try { if (this.activity && this.activity.loader) this.activity.loader(false); } catch (e) {}
        };
        this.start = function () {
            try { if (typeof scroll.minus === 'function') scroll.minus(); } catch (e) {}
            bindController(scroll);
            bindWheel(scroll);
        };
        this.pause = function () {};
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            try { scroll.destroy(); } catch (e) {}
            html.remove();
        };

        function render() {
            html.empty();
            html.append('<div class="stv-title">' + LANG.watched_list_title + '</div>');
            var list = StatsDB.allCompleted();
            if (!list.length) {
                html.append('<div class="stv-empty selector">' + LANG.watched_empty + '</div>');
                return;
            }
            var box = $('<div class="stv-watched-list"></div>');
            list.forEach(function (w) {
                var row = $('<div class="stv-watched-row selector"></div>');
                var poster = $('<div class="stv-watched-poster"></div>');
                var url = posterUrl(w.poster, 'w185');
                if (url) poster.css('background-image', 'url("' + url.replace(/"/g, '') + '")');
                else poster.addClass('stv-poster-empty').text(w.isEpisode ? LANG.episode_initial : LANG.movie_initial);
                if (w.isEpisode) poster.append($('<span class="stv-poster-badge"></span>').text(LANG.episode_badge));
                var info = $('<div class="stv-watched-info"></div>');
                info.append($('<div class="stv-watched-title"></div>').text(w.title || ''));
                var kind = w.isEpisode ? LANG.series_ep : LANG.film;
                var timeStr = w.seconds > 0 ? StatsDB.formatTime(w.seconds) : '—';
                info.append('<div class="stv-watched-meta">' + kind + ' · ' + timeStr + '</div>');
                row.append(poster);
                row.append(info);
                box.append(row);
            });
            html.append(box);
        }
    }

    var Menu = {
        selector: '.menu .menu__list',
        createItem: function () {
            var item = $('<li class="menu__item selector" data-action="' + CONFIG.menu_action + '"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20V14"/></svg></div><div class="menu__text">' + LANG.menu_title + '</div></li>');
            item.on('hover:enter click', function () {
                try { $('body').removeClass('menu--open'); } catch (e) {}
                Lampa.Activity.push({ url: 'stats', title: LANG.menu_title, component: CONFIG.activity, page: 1 });
            });
            return item;
        },
        update: function () {
            var visible = Settings.menuVisible();
            var old = $('.menu__item[data-action="' + CONFIG.menu_action + '"]');
            if (!visible) { old.remove(); return; }
            if (old.length) return;
            var menu = $(this.selector).first();
            if (!menu.length) return;
            var item = this.createItem();
            var history = menu.find('.menu__item[data-action="history"]');
            if (history.length) history.after(item); else menu.append(item);
        },
        init: function () {
            var self = this;
            setTimeout(function () { self.update(); }, 500);
            var n = 0, t = setInterval(function () { self.update(); if (++n >= 30) clearInterval(t); }, 1000);
        }
    };

    var CSS = [
        "/* Embedded in lampa_stats.js; no stylesheet request is made by the plugin. */",
        ".stv-root{--stv-surface:rgba(255,255,255,.055);--stv-surface-focus:#2b3037;--stv-line:rgba(255,255,255,.12);--stv-muted:#b7c0cb;--stv-accent:#78a0ff;--stv-radius:14px;--stv-track:rgba(173,190,211,.16);--stv-blue:#68b7ff;--stv-cyan:#51d6cf;--stv-violet:#b59aff;--stv-purple:#8f72ed;--stv-amber:#f4c76c;--stv-coral:#fa9984;--stv-pink:#eaa1d3;padding:24px 28px 50px;box-sizing:border-box;color:inherit;font-size:16px;}",
        ".stv-root *{box-sizing:border-box;}",
        "body.mls-enabled .stv-root{--stv-surface:var(--mls-panel,rgba(255,255,255,.055));--stv-surface-focus:var(--mls-panel-solid,#2b3037);--stv-line:var(--mls-line,rgba(255,255,255,.12));--stv-accent:var(--mls-accent,#78a0ff);--stv-radius:var(--mls-radius,14px);}",
        ".stv-heading{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:24px;}",
        ".stv-title{font-size:28px;font-weight:700;line-height:1.25;margin-bottom:22px;overflow-wrap:break-word;}",
        ".stv-heading .stv-title{margin-bottom:0;}",
        ".stv-period{font-size:13px;color:var(--stv-muted);flex-shrink:0;}",
        ".stv-card,.stv-actor,.stv-panel,.stv-reset,.stv-work,.stv-watched-row,.stv-empty{border:2px solid var(--stv-line);transition:border-color .15s ease,background .15s ease,box-shadow .15s ease;}",
        ".stv-card:focus,.stv-actor:focus,.stv-panel:focus,.stv-reset:focus,.stv-work:focus,.stv-watched-row:focus,.stv-empty:focus,.stv-card.focus,.stv-actor.focus,.stv-panel.focus,.stv-reset.focus,.stv-work.focus,.stv-watched-row.focus,.stv-empty.focus,.stv-card.hover,.stv-actor.hover,.stv-panel.hover,.stv-reset.hover,.stv-work.hover,.stv-watched-row.hover{border-color:var(--stv-accent);background:var(--stv-surface-focus);box-shadow:0 0 0 1px var(--stv-accent);outline:none;}",
        ".stv-cards{display:grid;grid-template-columns:1.1fr 1.25fr .85fr;gap:16px;margin-bottom:28px;}",
        ".stv-card{min-width:0;padding:20px 22px;border-radius:var(--stv-radius);background:var(--stv-surface);}",
        ".stv-card-label{font-size:12px;line-height:1.4;color:var(--stv-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:16px;}",
        ".stv-card-body{display:flex;align-items:center;gap:12px;}",
        ".stv-card-val{font-size:32px;line-height:1.2;font-weight:700;font-variant-numeric:tabular-nums;}",
        ".stv-total-body,.stv-watched-body,.stv-genre-body{flex-direction:column;align-items:flex-start;gap:12px;}",
        ".stv-total-body{gap:10px;}",
        ".stv-level-inline{display:flex;align-items:baseline;gap:7px;width:100%;margin-top:7px;}",
        ".stv-level-num-sm,.stv-level-name-sm{font-size:15px;font-weight:600;}",
        ".stv-level-percent{font-size:12px;margin-left:auto;color:var(--stv-muted);font-variant-numeric:tabular-nums;}",
        ".stv-level-bar{height:6px;border-radius:4px;background:var(--stv-track);overflow:hidden;width:100%;}",
        ".stv-level-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--stv-accent),var(--stv-cyan));}",
        ".stv-level-sub{font-size:12px;color:var(--stv-muted);line-height:1.45;}",
        ".stv-watched-counts{display:flex;align-items:baseline;gap:28px;}",
        ".stv-count{display:flex;flex-direction:column;gap:5px;}",
        ".stv-big{font-size:32px;line-height:1.2;font-weight:700;font-variant-numeric:tabular-nums;}",
        ".stv-sub{font-size:13px;color:var(--stv-muted);}",
        ".stv-posters{display:flex;flex-wrap:wrap;gap:6px;}",
        ".stv-poster{width:32px;height:48px;border-radius:5px;background-size:cover;background-position:center;background-color:var(--stv-track);position:relative;flex-shrink:0;}",
        ".stv-poster-empty{display:flex;align-items:center;justify-content:center;font-size:13px;color:var(--stv-muted);}",
        ".stv-poster-badge{position:absolute;bottom:2px;right:2px;font-size:8px;color:#fff;background:rgba(0,0,0,.8);padding:1px 3px;border-radius:3px;}",
        ".stv-open-watched{font-size:13px;color:inherit;margin-top:1px;text-decoration:underline;text-decoration-color:var(--stv-accent);text-underline-offset:4px;}",
        ".stv-genre-name{font-size:23px;font-weight:600;line-height:1.25;overflow-wrap:break-word;}",
        ".stv-genre-pct{font-size:38px;line-height:1.1;font-weight:600;font-variant-numeric:tabular-nums;}",
        ".stv-genre-context{font-size:12px;line-height:1.4;color:var(--stv-muted);}",
        ".stv-section{margin-bottom:26px;}",
        ".stv-section-title{font-size:13px;line-height:1.5;font-weight:600;letter-spacing:.035em;margin-bottom:16px;}",
        ".stv-actors-scroll{width:100%;overflow:hidden;}",
        ".stv-actors{position:relative;display:flex;align-items:stretch;flex-wrap:nowrap;gap:6px;overflow-x:auto;overflow-y:hidden;padding:8px 4px 16px;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:var(--stv-line) transparent;}",
        ".stv-actor{display:flex;flex-direction:column;width:100px;min-width:100px;flex-shrink:0;text-align:center;padding:10px 4px;border-radius:var(--stv-radius);background:var(--stv-surface);border-color:var(--stv-line);}",
        ".stv-actor-photo{width:64px;height:64px;border-radius:50%;margin:0 auto 10px;background-size:cover;background-position:center;background-color:var(--stv-track);}",
        ".stv-actor-ph{display:flex;align-items:center;justify-content:center;font-size:23px;font-weight:600;color:var(--stv-accent);}",
        ".stv-actor-name{font-size:12px;font-weight:500;line-height:1.4;min-height:34px;margin-bottom:5px;overflow-wrap:break-word;}",
        ".stv-actor-meta{font-size:11px;line-height:1.4;color:var(--stv-muted);font-variant-numeric:tabular-nums;margin-top:auto;}",
        ".stv-bottom{display:grid;grid-template-columns:1.25fr .95fr 1fr;gap:16px;margin-bottom:26px;}",
        ".stv-panel{min-width:0;padding:20px;border-radius:var(--stv-radius);background:var(--stv-surface);}",
        ".stv-bars{display:flex;align-items:stretch;gap:7px;height:210px;padding:25px 0 0;}",
        ".stv-bar-col{flex:1 1 0;display:flex;flex-direction:column;align-items:center;min-width:0;position:relative;}",
        ".stv-bar-wrap{position:relative;flex:1 1 auto;width:100%;min-height:0;display:flex;align-items:flex-end;justify-content:center;}",
        ".stv-bar{width:64%;max-width:28px;background:linear-gradient(180deg,var(--stv-cyan),var(--stv-blue));border-radius:5px 5px 2px 2px;min-height:2px;}",
        ".stv-bars--years .stv-bar{background:linear-gradient(180deg,var(--stv-violet),var(--stv-purple));}",
        ".stv-bar-label{flex:0 0 auto;font-size:11px;line-height:1.4;color:var(--stv-muted);margin-top:10px;text-align:center;white-space:nowrap;}",
        ".stv-bar-time{position:absolute;bottom:calc(var(--stv-bar-size) + 6px);font-size:11px;line-height:1.3;color:var(--stv-muted);white-space:nowrap;text-align:center;font-variant-numeric:tabular-nums;}",
        ".stv-genres{display:flex;flex-direction:column;gap:14px;}",
        ".stv-genre-row-label{display:flex;justify-content:space-between;gap:12px;font-size:12px;line-height:1.4;margin-bottom:7px;}",
        ".stv-genre-row-label>span:first-child{min-width:0;overflow-wrap:break-word;}",
        ".stv-genre-row-value{flex-shrink:0;font-variant-numeric:tabular-nums;}",
        ".stv-genre-track{height:5px;border-radius:4px;background:var(--stv-track);overflow:hidden;}",
        ".stv-genre-fill{height:100%;border-radius:inherit;}",
        ".stv-genre-fill-0{background:linear-gradient(90deg,var(--stv-blue),var(--stv-cyan));}",
        ".stv-genre-fill-1{background:linear-gradient(90deg,var(--stv-purple),var(--stv-violet));}",
        ".stv-genre-fill-2{background:var(--stv-cyan);}",
        ".stv-genre-fill-3{background:var(--stv-amber);}",
        ".stv-genre-fill-4{background:var(--stv-coral);}",
        ".stv-genre-fill-5{background:var(--stv-pink);}",
        ".stv-works,.stv-watched-list{display:flex;flex-direction:column;gap:12px;}",
        ".stv-work,.stv-watched-row{display:flex;align-items:center;gap:16px;padding:12px 14px;border-radius:var(--stv-radius);background:var(--stv-surface);}",
        ".stv-work-poster,.stv-watched-poster{width:48px;height:72px;border-radius:5px;background-size:cover;background-position:center;background-color:var(--stv-track);flex-shrink:0;position:relative;}",
        ".stv-work-info,.stv-watched-info{min-width:0;}",
        ".stv-work-title,.stv-watched-title{font-size:16px;font-weight:600;line-height:1.4;margin-bottom:5px;overflow-wrap:break-word;}",
        ".stv-work-meta,.stv-watched-meta{font-size:12px;line-height:1.5;color:var(--stv-muted);}",
        ".stv-muted{color:var(--stv-muted);font-size:13px;}",
        ".stv-empty{padding:36px 22px;border-radius:var(--stv-radius);background:var(--stv-surface);text-align:center;color:var(--stv-muted);margin-bottom:18px;line-height:1.5;}",
        ".stv-disabled{padding:12px 16px;border:2px solid var(--stv-line);border-radius:8px;background:rgba(250,153,132,.12);color:#fac3b7;margin-bottom:18px;font-size:14px;line-height:1.5;}",
        ".stv-reset{display:inline-block;margin:4px 0 32px;padding:11px 16px;border-radius:var(--stv-radius);background:var(--stv-surface);font-size:13px;color:var(--stv-muted);}",
        "@media(min-width:1600px){.stv-card{padding:24px 26px;}.stv-card-val,.stv-big{font-size:36px;}.stv-genre-pct{font-size:42px;}.stv-bar-time,.stv-bar-label{font-size:12px;}.stv-actor-name{font-size:13px;min-height:37px;}.stv-actor-meta{font-size:12px;}}",
        "@media(max-width:1100px){.stv-bottom{grid-template-columns:1fr 1fr;}.stv-panel-months{grid-column:1/-1;}.stv-card{padding:18px;}.stv-card-val,.stv-big{font-size:28px;}.stv-genre-name{font-size:21px;}}",
        "@media(max-width:720px){.stv-root{padding:20px 18px 36px;}.stv-title{font-size:25px;}.stv-cards{grid-template-columns:1fr 1fr;gap:12px;}.stv-card-genre{grid-column:1/-1;}.stv-genre-body{flex-direction:row;align-items:center;flex-wrap:wrap;gap:12px 20px;}.stv-genre-name{flex:1;}.stv-genre-pct{font-size:30px;}.stv-genre-context{width:100%;}.stv-watched-counts{gap:22px;}}",
        "@media(max-width:520px){.stv-root{padding:18px 14px 30px;}.stv-heading{align-items:flex-start;flex-direction:column;gap:8px;margin-bottom:20px;}.stv-title{font-size:24px;}.stv-cards{grid-template-columns:1fr;}.stv-card-genre{grid-column:auto;}.stv-card{padding:18px;}.stv-card-val,.stv-big{font-size:30px;}.stv-bottom{grid-template-columns:1fr;gap:12px;}.stv-panel-months{grid-column:auto;}.stv-panel{padding:18px 16px;}.stv-bars{height:auto;padding:0;flex-direction:column;gap:10px;}.stv-bars .stv-bar-col{display:flex;flex-direction:row;padding:0 58px 0 35px;min-height:22px;flex:auto;}.stv-bars .stv-bar-label{position:absolute;left:0;width:29px;margin:0;text-align:left;}.stv-bars .stv-bar-wrap{height:8px;display:block;min-width:0;}.stv-bars .stv-bar{width:var(--stv-bar-size);height:8px!important;max-width:none;min-height:0;border-radius:4px;}.stv-bars .stv-bar-time{top:50%;bottom:auto;right:-58px;width:51px;transform:translateY(-50%);text-align:right;}.stv-actors{gap:4px;}.stv-actor{width:94px;min-width:94px;}.stv-actor-photo{width:62px;height:62px;}.stv-work,.stv-watched-row{gap:12px;padding:10px;}.stv-work-title,.stv-watched-title{font-size:15px;}}",
        "@media(prefers-reduced-motion:reduce){.stv-root *{transition:none!important;}}"
    ].join("\n");

    function installCSS() {
        var old = document.getElementById('lampa-stats-v0993-style');
        if (old) old.remove();
        ['lampa-stats-v0992-style','lampa-stats-v0991-style','lampa-stats-v099-style','lampa-stats-v098-style','lampa-stats-v097-style','lampa-stats-v096-style','lampa-stats-v095-style','lampa-stats-v094-style','lampa-stats-v093-style','lampa-stats-v092-style'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.remove();
        });
        var s = document.createElement('style');
        s.id = 'lampa-stats-v0993-style';
        s.innerHTML = CSS;
        document.head.appendChild(s);
    }

    function init() {
        try {
            if (!window.Lampa) return;
            StatsDB.init();
            installCSS();
            Settings.setup();
            if (Lampa.Component && Lampa.Component.add) {
                Lampa.Component.add(CONFIG.activity, StatsComponent);
                Lampa.Component.add(CONFIG.activity_actor, ActorWorksComponent);
                Lampa.Component.add(CONFIG.activity_watched, WatchedListComponent);
            }
            Tracker.init();
            Menu.init();
            setTimeout(function () { Tracker.recoverSession(); }, 1200);
            setTimeout(function () { Tracker.recoverSession(); }, 4000);
            console.log('Lampa stats v0.99.8 ready (Ukrainian, Russian and English interface)');
        } catch (e) {
            console.error('stats init', e);
        }
    }

    if (window.appready) setTimeout(init, 100);
    else if (window.Lampa && Lampa.Listener && Lampa.Listener.follow) {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') setTimeout(init, 100);
        });
    } else setTimeout(init, 1500);
})();
