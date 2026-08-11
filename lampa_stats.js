(function () {
    'use strict';

    if (window.lampa_ukrainian_stats_v051) return;
    window.lampa_ukrainian_stats_v051 = true;

    var LANG = {
        menu_title: 'Статистика',
        page_title: 'МОЯ СТАТИСТИКА ПЕРЕГЛЯДІВ',
        total_time: 'СУМАРНИЙ ЧАС',
        watched: 'ПЕРЕГЛЯНУТО',
        fav_genre: 'УЛЮБЛЕНИЙ ЖАНР',
        fav_actors: 'ВАШІ УЛЮБЛЕНІ АКТОРИ',
        records: 'РЕКОРДИ',
        by_years: 'ВПОДОБАННЯ ЗА РОКАМИ ВИПУСКУ',
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
        reset_done: 'Статистику скинуто.',
        no_genre: '—',
        no_actors: 'Актори з’являться після переглядів',
        films_short: 'фільмів',
        actor_works: 'Фільми та серіали',
        no_works: 'Поки немає записів',
        film: 'фільм',
        series_ep: 'серія',
        level_up: 'Новий рівень'
    };

    var CONFIG = {
        stats_storage: 'lampa_personal_stats_v9',
        collect_storage: 'stats_collect',
        menu_storage: 'stats_menu_visible',
        menu_action: 'lampa_ukrainian_stats',
        activity: 'lampa_ukrainian_stats_view',
        activity_actor: 'lampa_ukrainian_stats_actor',
        completion: 0.98,
        interval: 1000,
        tmdb_img: 'https://image.tmdb.org/t/p/w185',
        tmdb_poster: 'https://image.tmdb.org/t/p/w92',
        max_actors_show: 15,
        max_posters_show: 8,
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

    var WEEKDAYS = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П’ятниця', 'Субота'];
    var MONTHS = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];

    var DEFAULT_STATS = {
        seconds_watched: 0,
        movies_watched: 0,
        episodes_watched: 0,
        completed: {},
        last_recorded: {},
        genres: {},
        actors: {},
        years: {},
        by_month: {},
        by_weekday: {},
        by_hour: {},
        last_level: 1
    };

    function isGarbageGenre(name) {
        if (!name || typeof name !== 'string') return true;
        var p = name.trim();
        if (!p) return true;
        if (/^\d{1,2}:\d{2}$/.test(p)) return true;
        if (/\d/.test(p) && /(хв|год|min|сек|сезон|season|ep|runtime|серія|серії|серій|епізод)/i.test(p)) return true;
        if (/^\d{3,4}p$/i.test(p)) return true;
        if (/^(4k|uhd|hdr|dv|3d|cam|ts|hdrip|webrip|web-dl)$/i.test(p)) return true;
        if (/^\d+$/.test(p)) return true;
        if (/^(19|20)\d{2}$/.test(p)) return true;
        if (p.length < 2 || p.length > 48) return true;
        return false;
    }

    function posterUrl(path) {
        if (!path) return '';
        var s = String(path);
        if (s.indexOf('http') === 0) return s;
        return CONFIG.tmdb_poster + s;
    }

    function openActorPage(a) {
        var id = a && a.id;
        if (id && /^\d+$/.test(String(id))) {
            try {
                Lampa.Activity.push({
                    url: 'person/' + id,
                    title: a.name || '',
                    component: 'actor',
                    id: id,
                    source: 'tmdb',
                    page: 1
                });
                return;
            } catch (e) {}
            try {
                Lampa.Activity.push({
                    url: 'person/' + id,
                    title: a.name || '',
                    component: 'person',
                    id: id,
                    source: 'tmdb',
                    page: 1
                });
                return;
            } catch (e2) {}
        }
        Lampa.Activity.push({
            url: 'stats_actor',
            title: (a && a.name) || LANG.actor_works,
            component: CONFIG.activity_actor,
            actor_key: (a && (a._key || String(a.id || a.name))) || '',
            page: 1
        });
    }

    /* ===================== CardCache ===================== */
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

            var prevCast =
                (prev.credits && prev.credits.cast && prev.credits.cast.length && prev.credits) ||
                (prev.persons && prev.persons.cast && prev.persons.cast.length && prev.persons) ||
                null;
            var newCast =
                (m.credits && m.credits.cast && m.credits.cast.length && m.credits) ||
                (m.persons && m.persons.cast && m.persons.cast.length && m.persons) ||
                null;

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
            if (k && this.map[k]) return Object.assign({}, m, this.map[k]);
            return m;
        },

        hasRich: function (m) {
            if (!m) return false;
            var c = this.get(m);
            var hasGenre = (c.genres && c.genres.length) || (c.genre_ids && c.genre_ids.length);
            var hasCast =
                (c.credits && c.credits.cast && c.credits.cast.length) ||
                (c.cast && c.cast.length) ||
                (c.persons && c.persons.cast && c.persons.cast.length);
            return !!(hasGenre && hasCast);
        }
    };

    /* ===================== Media ===================== */
    var Media = {
        lastCard: null,

        getId: function (movie) {
            if (!movie) return 'unknown';
            var id = movie.id || movie.tmdb_id || movie.kinopoisk_id || movie.imdb_id ||
                movie.original_title || movie.original_name || movie.title || movie.name || 'unknown';
            var season = movie.season_number || movie.season || 0;
            var episode = movie.episode_number || movie.episode || 0;
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

            return list.filter(function (p) {
                if (!p || !(p.id || p.name)) return false;
                if (p.job && !p.character) return false;
                if (p.department && String(p.department).toLowerCase() !== 'acting') return false;
                return true;
            }).slice(0, 20).map(function (p) {
                return {
                    id: p.id || p.name,
                    name: p.name || '',
                    profile_path: p.profile_path || p.img || p.photo || ''
                };
            });
        },

        posterOf: function (movie) {
            if (!movie) return '';
            return movie.poster_path || movie.img || movie.poster || '';
        },

        titleOf: function (movie) {
            if (!movie) return '';
            return movie.title || movie.name || movie.original_title || movie.original_name || '';
        },

        normalize: function (data) {
            if (!data) return null;
            var movie = data.card || data.movie || null;
            if (!movie || typeof movie !== 'object') {
                if (data.id || data.title || data.name || data.original_title) movie = data;
                else return null;
            }
            var season = data.season != null ? data.season : null;
            var episode = data.episode != null ? data.episode : null;
            if (season != null || episode != null) {
                movie = Object.assign({}, movie);
                if (season != null) { movie.season_number = season; movie.season = season; }
                if (episode != null) { movie.episode_number = episode; movie.episode = episode; }
            }
            return movie;
        },

        labelOf: function (movie) {
            if (!movie) return '?';
            return movie.id || movie.tmdb_id || movie.title || movie.name || movie.original_title || movie.original_name || '?';
        }
    };

    /* ===================== MetaStore ===================== */
    var MetaStore = {
        prefix: 'stats_meta_',

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
                    if (!meta.poster_path && old.poster_path) meta.poster_path = old.poster_path;
                    if ((!meta.genre_ids || !meta.genre_ids.length) && old.genre_ids && old.genre_ids.length) {
                        meta.genre_ids = old.genre_ids;
                    }
                }
                if ((meta.genres && meta.genres.length) || (meta.actors && meta.actors.length) || meta.year || meta.poster_path) {
                    Lampa.Storage.set(this.prefix + id, meta);
                }
            } catch (e) {}
        },

        load: function (idOrMovie) {
            var id = typeof idOrMovie === 'object' ? this.keyOf(idOrMovie) : idOrMovie;
            if (!id) return null;
            try {
                var m = Lampa.Storage.get(this.prefix + id);
                return m && typeof m === 'object' ? m : null;
            } catch (e) {
                return null;
            }
        },

        applyToMovie: function (movie) {
            if (!movie) return movie;
            var stored = this.load(movie);
            if (!stored) return movie;

            movie = Object.assign({}, movie);
            if (stored.genres && stored.genres.length && !(movie.genres && movie.genres.length)) {
                movie.genres = stored.genres;
            }
            if (stored.genre_ids && stored.genre_ids.length && !(movie.genre_ids && movie.genre_ids.length)) {
                movie.genre_ids = stored.genre_ids;
            }
            if (stored.actors && stored.actors.length) {
                if (!(movie.credits && movie.credits.cast && movie.credits.cast.length)) {
                    movie.credits = { cast: stored.actors };
                }
            }
            if (stored.release_date && !movie.release_date) movie.release_date = stored.release_date;
            if (stored.first_air_date && !movie.first_air_date) movie.first_air_date = stored.first_air_date;
            if (stored.poster_path && !movie.poster_path) movie.poster_path = stored.poster_path;
            return movie;
        }
    };

    /* ===================== DomMeta ===================== */
    var DomMeta = {
        scrape: function () {
            var result = { genres: [], year: 0, actors: [], id: null, title: '', poster: '' };
            try {
                var y = document.querySelector('.tag--year');
                if (y) {
                    var ym = (y.textContent || '').match(/(19|20)\d{2}/);
                    if (ym) result.year = parseInt(ym[0], 10);
                }
                if (!result.year) {
                    var head = document.querySelector('.full-start-new__head, .full-start__head');
                    if (head) {
                        var hm = (head.textContent || '').match(/(19|20)\d{2}/);
                        if (hm) result.year = parseInt(hm[0], 10);
                    }
                }

                var titleEl = document.querySelector('.full-start-new__title, .full-start__title');
                if (titleEl) result.title = (titleEl.textContent || '').trim();

                var posterEl = document.querySelector('.full-start-new__poster img, .full-start__poster img, .full-start-new__poster, .card__img');
                if (posterEl) {
                    result.poster = posterEl.getAttribute('src') || posterEl.getAttribute('data-src') ||
                        (posterEl.style && posterEl.style.backgroundImage
                            ? String(posterEl.style.backgroundImage).replace(/url\(["']?/, '').replace(/["']?\)/, '')
                            : '');
                }

                var details = document.querySelector('.full-start-new__details, .full-start__details');
                if (details) {
                    var text = (details.textContent || '').replace(/\s+/g, ' ').trim();
                    var parts = text.split(/●|•|·|\|/).map(function (s) { return s.trim(); });
                    parts.forEach(function (p) {
                        if (isGarbageGenre(p)) return;
                        result.genres.push({ name: p });
                    });
                }

                try {
                    var act = Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active();
                    if (act) {
                        if (act.id) result.id = act.id;
                        if (act.card && act.card.id) result.id = act.card.id;
                        if (act.movie && act.movie.id) result.id = act.movie.id;
                        if (act.card && act.card.poster_path && !result.poster) result.poster = act.card.poster_path;
                        if (act.movie && act.movie.poster_path && !result.poster) result.poster = act.movie.poster_path;
                    }
                } catch (e) {}
            } catch (e) {}
            return result;
        },

        mergeInto: function (movie) {
            if (!movie) movie = {};
            var d = this.scrape();
            movie = Object.assign({}, movie);
            if (d.id && !movie.id) movie.id = d.id;
            if (d.title && !movie.title && !movie.name) movie.title = d.title;
            if (d.year && !Media.yearOf(movie)) movie.release_date = String(d.year) + '-01-01';
            if (d.genres.length && !(movie.genres && movie.genres.length)) movie.genres = d.genres;
            if (d.poster && !movie.poster_path && !movie.img) movie.poster_path = d.poster;
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

    /* ===================== MetaLoader ===================== */
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
            } catch (e) {
                return 'uk-UA';
            }
        },

        enrich: function (movie, done) {
            if (!movie) {
                if (done) done(null);
                return;
            }

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

                if (Tracker.currentMovie && CardCache.key(Tracker.currentMovie) === key) {
                    Tracker.currentMovie = CardCache.get(merged) || merged;
                }

                try {
                    var watchedId = Media.getId(merged);
                    var last = StatsDB.getLast(watchedId);
                    if (last > 0) {
                        var meta = Media.metaFrom(merged);
                        StatsDB.enrichMetaOnly(Math.min(last, 600), meta);
                    }
                } catch (e) {}

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
                    url = Lampa.TMDB.api(
                        type + '/' + id + '?append_to_response=credits&language=' + encodeURIComponent(this.lang())
                    );
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
                    fetch(url)
                        .then(function (r) { return r.json(); })
                        .then(function (data) { finish(data); })
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

    /* ===================== LevelSystem ===================== */
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
                else {
                    next = LEVELS[i];
                    break;
                }
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
                name: cur.name,
                xp: xp,
                progress: progress,
                toNext: toNext,
                nextName: next ? next.name : null,
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
                    if (Lampa.Noty) {
                        Lampa.Noty.show(LANG.level_up + ': ' + info.level + ' — ' + info.name);
                    }
                } else if (!StatsDB.data.last_level) {
                    StatsDB.data.last_level = info.level;
                    StatsDB.save();
                }
            } catch (e) {}
        }
    };

    /* ===================== StatsDB ===================== */
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
            ['completed', 'last_recorded', 'genres', 'actors', 'years', 'by_month', 'by_weekday', 'by_hour'].forEach(function (k) {
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
            try { Lampa.Storage.set(CONFIG.stats_storage, this.data); } catch (e) {}
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

        addProgress: function (id, time, duration, deltaSec, meta) {
            if (!id || !Number.isFinite(time) || time < 0) return 0;
            var prev = this.getLast(id);
            if (time < prev - 5) {
                this.setLast(id, time);
                this.save();
                return 0;
            }
            var raw = Math.max(0, time - prev);
            if (Number.isFinite(deltaSec) && deltaSec >= 0) raw = Math.min(raw, deltaSec + 1.5);
            var maxJump = Number.isFinite(duration) && duration > 0 ? Math.min(duration, 7200) : 600;
            if (prev === 0 && raw > 30) raw = Math.min(raw, 5);
            var safe = Math.min(raw, maxJump);
            if (safe > 0) {
                this.data.seconds_watched += Math.floor(safe);
                this.enrich(Math.floor(safe), meta);
            }
            this.setLast(id, time);
            this.save();
            LevelSystem.checkLevelUp();
            return Math.floor(safe);
        },

        enrich: function (sec, meta) {
            if (!sec) return;
            var now = new Date();
            this.data.by_month[now.getMonth()] = (this.data.by_month[now.getMonth()] || 0) + sec;
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
                meta.actors.slice(0, 15).forEach(function (a) {
                    var row = StatsDB.ensureActor(a);
                    if (!row) return;
                    row.seconds += sec;
                    StatsDB.touchActorWork(a, meta, sec, false);
                });
            }
            if (!skipSave) this.save();
        },

        markCompleted: function (id, meta, movie) {
            if (!id || this.data.completed[id]) return false;

            var entry = {
                date: Date.now(),
                isEpisode: !!(meta && meta.isEpisode),
                title: (meta && meta.title) || Media.titleOf(movie) || '',
                poster: (meta && meta.poster) || Media.posterOf(movie) || '',
                tmdb_id: movie && (movie.id || movie.tmdb_id) || ''
            };

            if (!entry.poster && movie) {
                var st = MetaStore.load(movie);
                if (st && st.poster_path) entry.poster = st.poster_path;
            }
            if (!entry.poster && Media.lastCard) {
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
                meta.actors.slice(0, 15).forEach(function (a) {
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
            var list = Object.keys(this.data.completed).map(function (k) {
                var c = StatsDB.data.completed[k];
                return {
                    id: k,
                    date: c.date || 0,
                    isEpisode: !!c.isEpisode,
                    title: c.title || '',
                    poster: c.poster || ''
                };
            }).sort(function (a, b) { return b.date - a.date; });
            return list.slice(0, limit || CONFIG.max_posters_show);
        },

        topActors: function (limit) {
            return Object.keys(this.data.actors)
                .map(function (k) {
                    var a = StatsDB.data.actors[k];
                    if (!a.works) a.works = {};
                    a.count = Object.keys(a.works).length;
                    a._key = k;
                    return a;
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
                var key = Math.floor(year / 10) * 10 + '-ті';
                buckets[key] = (buckets[key] || 0) + (StatsDB.data.years[y].seconds || 0);
            });
            return Object.keys(buckets)
                .map(function (k) { return { label: k, seconds: buckets[k] }; })
                .sort(function (a, b) { return a.label.localeCompare(b.label); });
        },

        bestMonth: function () {
            var best = -1, sec = -1;
            Object.keys(this.data.by_month).forEach(function (m) {
                var s = StatsDB.data.by_month[m] || 0;
                if (s > sec) { sec = s; best = parseInt(m, 10); }
            });
            if (best < 0) return null;
            return { label: MONTHS[best] || String(best), text: StatsDB.formatHoursOrMin(sec) };
        },

        bestWeekday: function () {
            var best = -1, sec = -1;
            Object.keys(this.data.by_weekday).forEach(function (d) {
                var s = StatsDB.data.by_weekday[d] || 0;
                if (s > sec) { sec = s; best = parseInt(d, 10); }
            });
            if (best < 0) return null;
            return WEEKDAYS[best] || '';
        },

        bestHour: function () {
            var best = -1, sec = -1;
            Object.keys(this.data.by_hour).forEach(function (h) {
                var s = StatsDB.data.by_hour[h] || 0;
                if (s > sec) { sec = s; best = parseInt(h, 10); }
            });
            if (best < 0) return null;
            return (best < 10 ? '0' : '') + best + ':00';
        }
    };

    /* ===================== Settings ===================== */
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
            } catch (e) {
                return null;
            }
        }
    };

    /* ===================== Tracker ===================== */
    var Tracker = {
        timer: null,
        initialized: false,
        currentMovie: null,
        lastTickAt: 0,

        init: function () {
            if (this.initialized) return;
            this.initialized = true;
            var self = this;

            try {
                if (Lampa.Player && typeof Lampa.Player.play === 'function' && !Lampa.Player._stats_play_hooked) {
                    Lampa.Player._stats_play_hooked = true;
                    var _play = Lampa.Player.play.bind(Lampa.Player);
                    Lampa.Player.play = function (data) {
                        try {
                            if (data) {
                                var movie = data.card || data.movie || null;
                                if (movie) {
                                    if (data.season != null) {
                                        movie = Object.assign({}, movie, {
                                            season_number: data.season,
                                            season: data.season
                                        });
                                    }
                                    if (data.episode != null) {
                                        movie = Object.assign({}, movie, {
                                            episode_number: data.episode,
                                            episode: data.episode
                                        });
                                    }
                                    Media.remember(movie);
                                    movie = MetaStore.applyToMovie(CardCache.get(movie) || movie);
                                    Tracker.currentMovie = movie;
                                    MetaLoader.enrich(movie);
                                }
                            }
                        } catch (err) {}
                        return _play(data);
                    };
                }
            } catch (e) {}

            // Важливо для зовнішнього VLC / MX / тощо
            try {
                if (Lampa.Player && typeof Lampa.Player.callback === 'function') {
                    Lampa.Player.callback(function () {
                        setTimeout(function () { self.flushExternal(self.currentMovie); }, 400);
                        setTimeout(function () { self.flushExternal(self.currentMovie); }, 1500);
                        setTimeout(function () { self.flushExternal(self.currentMovie); }, 3500);
                    });
                }
            } catch (e) {}

            try {
                if (Lampa.Player && Lampa.Player.listener) {
                    Lampa.Player.listener.follow('start', function (e) { self.onStart(e); });
                    Lampa.Player.listener.follow('ready', function (e) { self.onStart(e); });
                    Lampa.Player.listener.follow('external', function (e) { self.onStart(e); });
                    Lampa.Player.listener.follow('destroy', function () {
                        [200, 800, 1800, 3500].forEach(function (ms) {
                            setTimeout(function () { self.flushExternal(self.currentMovie); }, ms);
                        });
                        setTimeout(function () { self.currentMovie = null; }, 6000);
                    });
                }
            } catch (e) {}

            try {
                if (Lampa.PlayerVideo && Lampa.PlayerVideo.listener) {
                    Lampa.PlayerVideo.listener.follow('timeupdate', function (e) { self.onVideo(e); });
                }
            } catch (e) {}

            try {
                if (Lampa.Timeline && Lampa.Timeline.listener) {
                    Lampa.Timeline.listener.follow('update', function (e) { self.onTimeline(e); });
                }
            } catch (e) {}

            try {
                Lampa.Listener.follow('activity', function (e) {
                    if (!e) return;
                    if (e.type === 'start' || e.type === 'archive' || e.type === 'resume') {
                        setTimeout(function () { self.flushExternal(self.currentMovie); }, 500);
                        setTimeout(function () { self.flushExternal(self.currentMovie); }, 1800);
                    }
                });
            } catch (e) {}

            try {
                Lampa.Listener.follow('full', function (e) {
                    if (!e || !e.data) return;
                    if (e.type !== 'complite' && e.type !== 'start' && e.type !== 'complete') return;

                    var movie = e.data.movie || (e.object && e.object.card) || null;
                    if (!movie && e.object) {
                        movie = {
                            id: e.object.id,
                            title: e.object.title,
                            name: e.object.name,
                            method: e.object.method
                        };
                    }
                    if (!movie) return;

                    if (e.object && !movie.id && e.object.id) {
                        movie = Object.assign({}, movie, { id: e.object.id });
                    }

                    var cast = null;
                    if (e.data.persons && e.data.persons.cast) cast = e.data.persons.cast;
                    else if (e.data.credits && e.data.credits.cast) cast = e.data.credits.cast;

                    if (cast && cast.length) {
                        movie = Object.assign({}, movie, {
                            credits: { cast: cast },
                            persons: { cast: cast }
                        });
                    }

                    setTimeout(function () {
                        movie = DomMeta.mergeInto(movie);
                        Media.remember(movie);
                        MetaLoader.enrich(movie);
                        if (self.currentMovie && Media.labelOf(self.currentMovie) === Media.labelOf(movie)) {
                            self.currentMovie = Media.lastCard;
                        }
                    }, 400);
                });
            } catch (e) {}

            this.timer = setInterval(function () { self.tick(); }, CONFIG.interval);
        },

        onStart: function (e) {
            var movie = Media.normalize(e) || Current.getMovie();
            if (!movie) return;

            Media.remember(movie);
            movie = MetaStore.applyToMovie(CardCache.get(movie) || movie);
            this.currentMovie = movie;

            MetaLoader.enrich(movie, function (rich) {
                if (rich) {
                    Tracker.currentMovie = MetaStore.applyToMovie(CardCache.get(rich) || rich);
                    Media.remember(rich);
                }
            });
        },

        flushExternal: function (movie) {
            if (!Settings.collecting()) return;
            movie = movie || this.currentMovie || Media.lastCard;
            if (!movie) return;

            var time = 0, duration = 0;

            try {
                var v = Current.getVideoState();
                if (v) {
                    time = v.time;
                    duration = v.duration;
                }
            } catch (e) {}

            // Для зовнішнього VLC / MX / Vimu тощо
            try {
                if ((!time || time <= 0) && Lampa.Storage) {
                    var keys = ['player_road_last', 'timeline_last', 'player_timecode', 'last_timecode'];
                    for (var i = 0; i < keys.length; i++) {
                        var last = Lampa.Storage.get(keys[i]);
                        if (last && Number.isFinite(Number(last.time))) {
                            time = Number(last.time);
                            duration = Number(last.duration) || 0;
                            break;
                        }
                    }
                }
            } catch (e) {}

            // Спроба через Timeline API
            try {
                if ((!time || time <= 0) && Lampa.Timeline && typeof Lampa.Timeline.view === 'function' && movie) {
                    var hash = null;
                    try {
                        if (Lampa.Utils && Lampa.Utils.hash) hash = Lampa.Utils.hash(Media.getId(movie));
                    } catch (e2) {}
                    if (hash) {
                        var road = Lampa.Timeline.view(hash);
                        if (road && Number.isFinite(Number(road.time))) {
                            time = Number(road.time);
                            duration = Number(road.duration) || 0;
                        }
                    }
                }
            } catch (e) {}

            if (Number.isFinite(time) && time > 0) {
                this.apply(time, duration || 0, Math.max(time, 600));
            }
        },

        apply: function (time, duration, wallDelta) {
            if (!Settings.collecting()) return;

            var movie = this.currentMovie || Current.getMovie() || Media.lastCard;
            if (movie) {
                movie = CardCache.get(movie) || movie;
                movie = MetaStore.applyToMovie(movie);
            }

            var meta = Media.metaFrom(movie);

            if (Media.lastCard) {
                var alt = Media.metaFrom(Media.lastCard);
                if (alt) {
                    if ((!meta || !meta.genres || !meta.genres.length) && alt.genres && alt.genres.length) {
                        meta = meta || {};
                        meta.genres = alt.genres;
                    }
                    if (meta && (!meta.actors || !meta.actors.length) && alt.actors && alt.actors.length) {
                        meta.actors = alt.actors;
                    }
                    if (meta && !meta.year && alt.year) meta.year = alt.year;
                    if (meta && !meta.poster && alt.poster) meta.poster = alt.poster;
                    if (meta && !meta.title && alt.title) meta.title = alt.title;
                    if (meta && !meta.baseId && alt.baseId) meta.baseId = alt.baseId;
                    if (meta && meta.isEpisode == null) meta.isEpisode = alt.isEpisode;
                }
            }

            var id = movie ? Media.getId(movie) : 'session:anon';
            StatsDB.addProgress(id, time, duration, wallDelta, meta);

            if (movie && Number.isFinite(duration) && duration > 0 && time / duration >= CONFIG.completion) {
                StatsDB.markCompleted(Media.getId(movie), meta, movie);
            }
        },

        onVideo: function (e) {
            if (!Settings.collecting() || !e) return;
            var time = Number(e.current !== undefined ? e.current : e.time);
            var duration = Number(e.duration);
            if (!Number.isFinite(time) || time < 0) return;
            this.apply(time, Number.isFinite(duration) ? duration : 0, 2);
        },

        onTimeline: function (e) {
            if (!Settings.collecting() || !e || !e.data) return;
            var road = e.data.road || e.data;
            if (!road) return;
            var time = Number(road.time);
            var duration = Number(road.duration);
            if (!Number.isFinite(time) || time < 0) return;
            this.apply(time, Number.isFinite(duration) ? duration : 0, 600);
        },

        tick: function () {
            if (!Settings.collecting()) return;
            var video = Current.getVideoState();
            if (!video) return;
            var now = Date.now();
            var wall = this.lastTickAt ? Math.max(0, (now - this.lastTickAt) / 1000) : 1;
            this.lastTickAt = now;
            this.apply(video.time, video.duration, wall + 1);
        }
    };

    /* ===================== Scroll / Controller ===================== */
    function makeScroll() {
        return new Lampa.Scroll({ mask: true, over: true, step: 220 });
    }

    function forceScrollSize(scroll) {
        try {
            var node = scroll.render();
            if (!node) return;

            // Головний фікс Lampa — клас layer--wheight
            node.classList.add('layer--wheight');
            node.classList.add('layer--height');

            var h = Math.max(420, (window.innerHeight || 900) - 100);
            node.style.height = h + 'px';
            node.style.maxHeight = h + 'px';
            node.style.minHeight = h + 'px';

            if (typeof scroll.minus === 'function') {
                try { scroll.minus(); } catch (e) {}
            }
            if (typeof scroll.height === 'function') {
                try { scroll.height(); } catch (e) {}
            }
            if (typeof scroll.resize === 'function') {
                try { scroll.resize(); } catch (e) {}
            }

            // Fallback нативний скрол (якщо Lampa.Scroll не рухається)
            var content = node.querySelector('.scroll__content') || node.querySelector('.scroll__body');
            if (content) {
                content.style.overflowY = 'auto';
                content.style.height = '100%';
                content.style.maxHeight = '100%';
                content.style.webkitOverflowScrolling = 'touch';
            }
        } catch (e) {}
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
                var step = dy > 0 ? 200 : -200;
                if (typeof scroll.wheel === 'function') scroll.wheel(step);
                else if (typeof scroll.move === 'function') scroll.move(step);
                else {
                    // native fallback
                    var content = node.querySelector('.scroll__content') || node;
                    if (content) content.scrollTop += step;
                }
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
                    else if (typeof scroll.wheel === 'function') scroll.wheel(-300);
                    else if (typeof scroll.move === 'function') scroll.move(-300);
                },
                down: function () {
                    if (Navigator.canmove('down')) Navigator.move('down');
                    else if (typeof scroll.wheel === 'function') scroll.wheel(300);
                    else if (typeof scroll.move === 'function') scroll.move(300);
                },
                back: function () { Lampa.Activity.backward(); }
            });
            Lampa.Controller.toggle('content');
        } catch (e) {}
    }

    function bindFocusScroll(html, scroll) {
        html.find('.selector').on('hover:focus focus hover:enter', function () {
            try {
                scroll.update($(this), true);
            } catch (e) {
                // native fallback
                try {
                    var node = scroll.render();
                    var el = this;
                    if (node && el) {
                        var content = node.querySelector('.scroll__content') || node;
                        if (content && el.offsetTop !== undefined) {
                            content.scrollTop = Math.max(0, el.offsetTop - 120);
                        }
                    }
                } catch (e2) {}
            }
        });
    }

    /* ===================== UI: main ===================== */
    function StatsComponent() {
        var scroll = makeScroll();
        var html = $('<div class="stv-root"></div>');

        this.create = function () {
            renderAll(html);
            scroll.clear();
            scroll.append(html);
            forceScrollSize(scroll);
            bindFocusScroll(html, scroll);
            bindWheel(scroll);

            [50, 200, 500, 1000].forEach(function (ms) {
                setTimeout(function () { forceScrollSize(scroll); }, ms);
            });

            try { if (this.activity && this.activity.loader) this.activity.loader(false); } catch (e) {}
        };
        this.start = function () {
            forceScrollSize(scroll);
            bindController(scroll);
            bindWheel(scroll);
            setTimeout(function () { forceScrollSize(scroll); }, 150);
        };
        this.pause = function () {};
        this.render = function () { return scroll.render(); };
        this.destroy = function () {
            try { scroll.destroy(); } catch (e) {}
            html.remove();
        };

        function renderAll(root) {
            root.empty();
            root.append('<div class="stv-title">' + LANG.page_title + '</div>');

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
            var g = StatsDB.topGenre();
            row.append(card(
                LANG.fav_genre,
                '<div class="stv-genre-name">' + g.name + '</div><div class="stv-genre-pct">' + g.percent + '%</div>',
                '◎'
            ));
            return row;
        }

        function totalTimeWithLevelCard() {
            var info = LevelSystem.info();
            var c = $('<div class="stv-card selector stv-card-total"></div>');
            c.append('<div class="stv-card-label">' + LANG.total_time + '</div>');

            var body = $('<div class="stv-card-body stv-total-body"></div>');
            body.append('<div class="stv-card-val">' + StatsDB.formatTime(StatsDB.data.seconds_watched) + '</div>');

            body.append(
                '<div class="stv-level-inline">' +
                '<span class="stv-level-num-sm">' + info.level + '</span> ' +
                '<span class="stv-level-name-sm">' + info.name + '</span>' +
                '</div>'
            );

            body.append(
                '<div class="stv-level-bar stv-level-bar-sm"><div class="stv-level-fill" style="width:' +
                Math.round(info.progress * 100) + '%"></div></div>'
            );

            var sub = info.max
                ? LANG.level_max
                : (LANG.level_to + ' «' + info.nextName + '» — ' + StatsDB.formatTime(info.toNext));
            body.append('<div class="stv-level-sub">' + sub + '</div>');

            c.append(body);
            return c;
        }

        function watchedCard() {
            var c = $('<div class="stv-card selector stv-card-watched"></div>');
            c.append('<div class="stv-card-label">' + LANG.watched + '</div>');
            var body = $('<div class="stv-card-body stv-watched-body"></div>');
            body.append(
                '<div class="stv-watched-counts">' +
                '<span class="stv-big">' + (StatsDB.data.movies_watched || 0) + '</span>' +
                '<span class="stv-sub"> ' + LANG.movies + ' / ' + (StatsDB.data.episodes_watched || 0) + ' ' + LANG.episodes + '</span>' +
                '</div>'
            );
            var posters = $('<div class="stv-posters"></div>');
            StatsDB.recentCompleted(CONFIG.max_posters_show).forEach(function (item) {
                var p = $('<div class="stv-poster" title="' + (item.title || '').replace(/"/g, '&quot;') + '"></div>');
                var url = posterUrl(item.poster);
                if (url) p.css('background-image', 'url(' + url + ')');
                else {
                    p.addClass('stv-poster-empty');
                    p.text(item.isEpisode ? 'S' : 'F');
                }
                if (item.isEpisode) p.append('<span class="stv-poster-badge">EP</span>');
                posters.append(p);
            });
            body.append(posters);
            c.append(body);
            return c;
        }

        function card(label, valueHtml, icon) {
            var c = $('<div class="stv-card selector"></div>');
            c.append('<div class="stv-card-label">' + label + '</div>');
            c.append('<div class="stv-card-body"><span class="stv-card-icon">' + icon + '</span><div class="stv-card-val">' + valueHtml + '</div></div>');
            return c;
        }

        function actorsBlock() {
            var wrap = $('<div class="stv-section"></div>');
            wrap.append('<div class="stv-section-title">' + LANG.fav_actors + '</div>');
            var scrollWrap = $('<div class="stv-actors-scroll"></div>');
            var row = $('<div class="stv-actors"></div>');
            var list = StatsDB.topActors(CONFIG.max_actors_show);
            if (!list.length) {
                row.append('<div class="stv-muted">' + LANG.no_actors + '</div>');
            } else {
                list.forEach(function (a) {
                    var item = $('<div class="stv-actor selector"></div>');
                    var img = a.profile_path
                        ? (String(a.profile_path).indexOf('http') === 0 ? a.profile_path : CONFIG.tmdb_img + a.profile_path)
                        : '';
                    if (img) item.append('<div class="stv-actor-photo" style="background-image:url(' + img + ')"></div>');
                    else item.append('<div class="stv-actor-photo stv-actor-ph">' + (a.name || '?').charAt(0) + '</div>');
                    item.append('<div class="stv-actor-name">' + (a.name || '') + '</div>');
                    item.append(
                        '<div class="stv-actor-meta">' + StatsDB.formatTime(a.seconds || 0) +
                        ', ' + (a.count || 0) + ' ' + LANG.films_short + '</div>'
                    );
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
            var rec = $('<div class="stv-panel selector"></div>');
            rec.append('<div class="stv-section-title">' + LANG.records + '</div>');
            var bm = StatsDB.bestMonth(), bw = StatsDB.bestWeekday(), bh = StatsDB.bestHour(), recHtml = '';
            if (bm) recHtml += '<div class="stv-rec-line"><b>' + bm.label + '</b> (' + bm.text + ')</div>';
            if (bw) recHtml += '<div class="stv-rec-line">' + bw + (bh ? ', ' + bh : '') + '</div>';
            if (!recHtml) recHtml = '<div class="stv-muted">—</div>';
            rec.append(recHtml);
            row.append(rec);

            var years = $('<div class="stv-panel selector"></div>');
            years.append('<div class="stv-section-title">' + LANG.by_years + '</div>');
            years.append(yearBars());
            row.append(years);

            var genres = $('<div class="stv-panel selector"></div>');
            genres.append('<div class="stv-section-title">' + LANG.genres_dist + '</div>');
            genres.append(genrePie());
            row.append(genres);
            return row;
        }

        function yearBars() {
            var data = StatsDB.yearBuckets();
            var box = $('<div class="stv-bars"></div>');
            if (!data.length) { box.append('<div class="stv-muted">—</div>'); return box; }
            var max = 1;
            data.forEach(function (d) { if (d.seconds > max) max = d.seconds; });
            data.forEach(function (d) {
                var h = Math.max(8, Math.round((d.seconds / max) * 100));
                var col = $('<div class="stv-bar-col"></div>');
                col.append('<div class="stv-bar" style="height:' + h + '%"></div>');
                col.append('<div class="stv-bar-label">' + d.label + '</div>');
                box.append(col);
            });
            return box;
        }

        function genrePie() {
            var list = StatsDB.genreList().slice(0, 6);
            var box = $('<div class="stv-pie-wrap"></div>');
            if (!list.length) { box.append('<div class="stv-muted">—</div>'); return box; }
            var total = 0;
            list.forEach(function (g) { total += g.seconds; });
            if (total <= 0) total = 1;
            var colors = ['#3b82f6', '#ef4444', '#f59e0b', '#22c55e', '#a855f7', '#06b6d4'];
            var stops = [], acc = 0;
            list.forEach(function (g, i) {
                var p = (g.seconds / total) * 100, from = acc;
                acc += p;
                stops.push(colors[i % colors.length] + ' ' + from.toFixed(2) + '% ' + acc.toFixed(2) + '%');
            });
            box.append($('<div class="stv-pie" style="background:conic-gradient(' + stops.join(',') + ')"></div>'));
            var legend = $('<div class="stv-legend"></div>');
            list.forEach(function (g, i) {
                legend.append(
                    '<div class="stv-leg-item"><span class="stv-dot" style="background:' + colors[i % colors.length] +
                    '"></span>' + g.name + ' ' + Math.round((g.seconds / total) * 100) + '%</div>'
                );
            });
            box.append(legend);
            return box;
        }

        function resetBtn(root) {
            var b = $('<div class="stv-reset selector">' + LANG.reset + '</div>');
            b.on('hover:enter click', function () {
                if (confirm(LANG.reset_confirm)) {
                    StatsDB.reset();
                    Lampa.Noty.show(LANG.reset_done);
                    renderAll(root);
                    scroll.clear();
                    scroll.append(root);
                    forceScrollSize(scroll);
                    bindFocusScroll(root, scroll);
                    bindWheel(scroll);
                    try {
                        Lampa.Controller.collectionSet(scroll.render());
                        Lampa.Controller.collectionFocus(false, scroll.render());
                    } catch (e) {}
                }
            });
            return b;
        }
    }

    /* ===================== UI: fallback actor ===================== */
    function ActorWorksComponent(object) {
        var scroll = makeScroll();
        var html = $('<div class="stv-root"></div>');
        var key = (object && object.actor_key) || '';

        this.create = function () {
            render();
            scroll.clear();
            scroll.append(html);
            forceScrollSize(scroll);
            bindFocusScroll(html, scroll);
            bindWheel(scroll);

            [50, 200, 500].forEach(function (ms) {
                setTimeout(function () { forceScrollSize(scroll); }, ms);
            });

            try { if (this.activity && this.activity.loader) this.activity.loader(false); } catch (e) {}
        };
        this.start = function () {
            forceScrollSize(scroll);
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
            html.append('<div class="stv-title">' + name + '</div>');
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
                var url = posterUrl(w.poster);
                if (url) poster.css('background-image', 'url(' + url + ')');
                else poster.addClass('stv-poster-empty').text(w.isEpisode ? 'S' : 'F');
                var info = $('<div class="stv-work-info"></div>');
                info.append('<div class="stv-work-title">' + (w.title || '') + '</div>');
                info.append(
                    '<div class="stv-work-meta">' +
                    (w.isEpisode ? LANG.series_ep : LANG.film) +
                    ' · ' + StatsDB.formatTime(w.seconds) +
                    (w.completed ? ' · ✓' : '') +
                    '</div>'
                );
                row.append(poster);
                row.append(info);
                list.append(row);
            });
            html.append(list);
        }
    }

    var Menu = {
        selector: '.menu .menu__list',
        createItem: function () {
            var item = $(
                '<li class="menu__item selector" data-action="' + CONFIG.menu_action +
                '"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20V14"/></svg></div><div class="menu__text">' +
                LANG.menu_title + '</div></li>'
            );
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

    var CSS =
        '.stv-root{padding:22px 28px 60px;color:#fff;box-sizing:border-box;}' +
        '.stv-title{font-size:28px;font-weight:700;margin-bottom:18px;}' +
        '.stv-card,.stv-actor,.stv-panel,.stv-reset,.stv-work,.stv-empty{' +
        'transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease,background .15s ease;' +
        '}' +
        '.stv-card:focus,.stv-actor:focus,.stv-panel:focus,.stv-reset:focus,.stv-work:focus,.stv-empty:focus,' +
        '.stv-card.focus,.stv-actor.focus,.stv-panel.focus,.stv-reset.focus,.stv-work.focus,' +
        '.stv-card.hover,.stv-actor.hover,.stv-panel.hover,.stv-reset.hover{' +
        'transform:translateY(-6px);' +
        'box-shadow:0 10px 28px rgba(0,0,0,.45);' +
        'border-color:rgba(96,165,250,.9)!important;' +
        'background:rgba(255,255,255,.12)!important;' +
        'outline:none;' +
        'z-index:2;' +
        '}' +
        '.stv-cards{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:28px;}' +
        '.stv-card{min-width:220px;flex:1;padding:16px 18px;border-radius:14px;background:rgba(255,255,255,0.06);border:2px solid transparent;}' +
        '.stv-card-label{font-size:11px;opacity:0.5;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;}' +
        '.stv-card-body{display:flex;align-items:center;gap:12px;}' +
        '.stv-card-icon{font-size:22px;opacity:0.85;}' +
        '.stv-card-val{font-size:22px;font-weight:700;}' +
        '.stv-big{font-size:26px;}' +
        '.stv-sub{font-size:13px;font-weight:500;opacity:0.7;}' +
        '.stv-genre-name{font-size:18px;font-weight:700;text-transform:uppercase;}' +
        '.stv-genre-pct{font-size:13px;opacity:0.6;margin-top:2px;}' +
        '.stv-total-body{flex-direction:column;align-items:flex-start;gap:8px;}' +
        '.stv-level-inline{display:flex;align-items:baseline;gap:8px;margin-top:2px;}' +
        '.stv-level-num-sm{font-size:20px;font-weight:800;}' +
        '.stv-level-name-sm{font-size:15px;font-weight:700;text-transform:uppercase;opacity:0.9;}' +
        '.stv-level-bar-sm{height:6px;border-radius:4px;background:rgba(255,255,255,0.12);overflow:hidden;width:100%;max-width:220px;}' +
        '.stv-level-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#60a5fa,#a855f7);}' +
        '.stv-level-sub{font-size:12px;opacity:0.55;line-height:1.3;}' +
        '.stv-watched-body{flex-direction:column;align-items:flex-start;gap:10px;}' +
        '.stv-watched-counts{display:flex;align-items:baseline;gap:4px;}' +
        '.stv-posters{display:flex;flex-wrap:wrap;gap:6px;}' +
        '.stv-poster{width:36px;height:54px;border-radius:6px;background-size:cover;background-position:center;background-color:rgba(255,255,255,0.1);position:relative;flex-shrink:0;}' +
        '.stv-poster-empty{display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;opacity:0.6;}' +
        '.stv-poster-badge{position:absolute;bottom:2px;right:2px;font-size:8px;background:rgba(0,0,0,0.7);padding:1px 3px;border-radius:3px;}' +
        '.stv-section{margin-bottom:26px;}' +
        '.stv-section-title{font-size:13px;opacity:0.55;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:14px;}' +
        '.stv-actors-scroll{width:100%;overflow:hidden;}' +
        '.stv-actors{display:flex;flex-wrap:nowrap;gap:14px;overflow-x:auto;overflow-y:hidden;padding:8px 4px 16px;-webkit-overflow-scrolling:touch;}' +
        '.stv-actor{width:110px;min-width:110px;flex-shrink:0;text-align:center;padding:8px;border-radius:12px;border:2px solid transparent;background:transparent;}' +
        '.stv-actor-photo{width:68px;height:68px;border-radius:50%;margin:0 auto 8px;background-size:cover;background-position:center;background-color:rgba(255,255,255,0.08);}' +
        '.stv-actor-ph{display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;}' +
        '.stv-actor-name{font-size:12px;font-weight:600;line-height:1.2;margin-bottom:4px;}' +
        '.stv-actor-meta{font-size:11px;opacity:0.55;}' +
        '.stv-works{display:flex;flex-direction:column;gap:10px;}' +
        '.stv-work{display:flex;align-items:center;gap:14px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,0.05);border:2px solid transparent;}' +
        '.stv-work-poster{width:48px;height:72px;border-radius:6px;background-size:cover;background-position:center;background-color:rgba(255,255,255,0.1);flex-shrink:0;}' +
        '.stv-work-title{font-size:16px;font-weight:600;margin-bottom:4px;}' +
        '.stv-work-meta{font-size:12px;opacity:0.55;}' +
        '.stv-bottom{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:24px;}' +
        '.stv-panel{flex:1;min-width:200px;padding:16px;border-radius:14px;background:rgba(255,255,255,0.05);border:2px solid transparent;}' +
        '.stv-rec-line{font-size:15px;margin-bottom:6px;}' +
        '.stv-bars{display:flex;align-items:flex-end;gap:8px;height:120px;padding-top:10px;}' +
        '.stv-bar-col{flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;}' +
        '.stv-bar{width:70%;max-width:28px;background:linear-gradient(180deg,#60a5fa,#2563eb);border-radius:6px 6px 2px 2px;min-height:8px;}' +
        '.stv-bar-label{font-size:10px;opacity:0.55;margin-top:6px;text-align:center;}' +
        '.stv-pie-wrap{display:flex;align-items:center;gap:14px;flex-wrap:wrap;}' +
        '.stv-pie{width:90px;height:90px;border-radius:50%;flex-shrink:0;}' +
        '.stv-legend{font-size:12px;opacity:0.85;}' +
        '.stv-leg-item{margin-bottom:4px;display:flex;align-items:center;gap:6px;}' +
        '.stv-dot{width:8px;height:8px;border-radius:50%;display:inline-block;}' +
        '.stv-muted{opacity:0.45;font-size:13px;}' +
        '.stv-empty{padding:36px;border-radius:12px;background:rgba(255,255,255,0.04);text-align:center;opacity:0.7;margin-bottom:16px;border:2px solid transparent;}' +
        '.stv-disabled{padding:12px 16px;border-radius:8px;background:rgba(255,80,80,0.12);color:#fca5a5;margin-bottom:16px;}' +
        '.stv-reset{display:inline-block;margin-top:8px;margin-bottom:50px;padding:12px 18px;border-radius:10px;background:rgba(255,255,255,0.06);border:2px solid transparent;opacity:0.85;}';

    function installCSS() {
        var old = document.getElementById('lampa-stats-v051-style');
        if (old) old.remove();
        var old2 = document.getElementById('lampa-stats-v050-style');
        if (old2) old2.remove();
        var old3 = document.getElementById('lampa-stats-v9-style');
        if (old3) old3.remove();
        var s = document.createElement('style');
        s.id = 'lampa-stats-v051-style';
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
            }
            Tracker.init();
            Menu.init();
            console.log('Lampa stats v0.51 ready (scroll + external VLC)');
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
