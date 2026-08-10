(function () {
    'use strict';

    if (window.lampa_ukrainian_stats_v90) return;
    window.lampa_ukrainian_stats_v90 = true;

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
        films_short: 'фільмів'
    };

    var CONFIG = {
        stats_storage: 'lampa_personal_stats_v9',
        collect_storage: 'stats_collect',
        menu_storage: 'stats_menu_visible',
        menu_action: 'lampa_ukrainian_stats',
        activity: 'lampa_ukrainian_stats_view',
        completion: 0.85,
        interval: 1000,
        tmdb_img: 'https://image.tmdb.org/t/p/w185',
        max_actors_store: 80,
        max_actors_show: 8
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
        by_hour: {}
    };

    /* ===================== DB ===================== */
    var StatsDB = {
        data: null,

        init: function () {
            var saved = null;
            try {
                saved = Lampa.Storage.get(CONFIG.stats_storage);
            } catch (e) {}

            if (!saved || typeof saved !== 'object') {
                this.data = JSON.parse(JSON.stringify(DEFAULT_STATS));
                this.save();
                return;
            }

            this.data = Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATS)), saved);
            ['completed', 'last_recorded', 'genres', 'actors', 'years', 'by_month', 'by_weekday', 'by_hour'].forEach(function (k) {
                if (!StatsDB.data[k] || typeof StatsDB.data[k] !== 'object') StatsDB.data[k] = {};
            });
            this.normalize();
        },

        normalize: function () {
            ['seconds_watched', 'movies_watched', 'episodes_watched'].forEach(function (k) {
                if (!Number.isFinite(StatsDB.data[k])) StatsDB.data[k] = 0;
                StatsDB.data[k] = Math.max(0, Math.floor(StatsDB.data[k]));
            });
        },

        save: function () {
            this.normalize();
            try {
                Lampa.Storage.set(CONFIG.stats_storage, this.data);
            } catch (e) {}
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

        /**
         * deltaSec — реальний приріст цього тіка
         * meta — { genres[], actors[], year, isEpisode }
         */
        addProgress: function (id, time, duration, deltaSec, meta) {
            if (!id || !Number.isFinite(time) || time < 0) return 0;

            var prev = this.getLast(id);
            if (time < prev - 5) {
                this.setLast(id, time);
                this.save();
                return 0;
            }

            var raw = Math.max(0, time - prev);
            if (Number.isFinite(deltaSec) && deltaSec >= 0) {
                raw = Math.min(raw, deltaSec + 1.5);
            }

            var maxJump = Number.isFinite(duration) && duration > 0 ? Math.min(duration, 7200) : 600;
            // перший запис: не зараховуємо всю resume-позицію
            if (prev === 0 && raw > 30) {
                raw = Math.min(raw, 5);
            }

            var safe = Math.min(raw, maxJump);
            if (safe > 0) {
                this.data.seconds_watched += Math.floor(safe);
                if (meta) this.enrich(Math.floor(safe), meta);
            }

            this.setLast(id, time);
            this.save();
            return Math.floor(safe);
        },

        enrich: function (sec, meta) {
            if (!sec || !meta) return;

            var now = new Date();
            var month = now.getMonth();
            var weekday = now.getDay();
            var hour = now.getHours();

            this.data.by_month[month] = (this.data.by_month[month] || 0) + sec;
            this.data.by_weekday[weekday] = (this.data.by_weekday[weekday] || 0) + sec;
            this.data.by_hour[hour] = (this.data.by_hour[hour] || 0) + sec;

            if (meta.year) {
                var y = String(meta.year);
                if (!this.data.years[y]) this.data.years[y] = { seconds: 0, count: 0 };
                this.data.years[y].seconds += sec;
            }

            if (meta.genres && meta.genres.length) {
                meta.genres.forEach(function (g) {
                    var name = typeof g === 'string' ? g : (g && g.name);
                    if (!name) return;
                    if (!StatsDB.data.genres[name]) StatsDB.data.genres[name] = { seconds: 0, count: 0 };
                    StatsDB.data.genres[name].seconds += sec;
                });
            }

            if (meta.actors && meta.actors.length) {
                meta.actors.slice(0, 8).forEach(function (a) {
                    if (!a || !a.id) return;
                    var key = String(a.id);
                    if (!StatsDB.data.actors[key]) {
                        StatsDB.data.actors[key] = {
                            id: a.id,
                            name: a.name || '',
                            profile_path: a.profile_path || '',
                            seconds: 0,
                            count: 0
                        };
                    }
                    StatsDB.data.actors[key].seconds += sec;
                    if (a.name) StatsDB.data.actors[key].name = a.name;
                    if (a.profile_path) StatsDB.data.actors[key].profile_path = a.profile_path;
                });
            }
        },

        markCompleted: function (id, meta) {
            if (!id || this.data.completed[id]) return false;

            this.data.completed[id] = { date: Date.now(), isEpisode: !!(meta && meta.isEpisode) };

            if (meta && meta.isEpisode) this.data.episodes_watched++;
            else this.data.movies_watched++;

            if (meta && meta.genres) {
                meta.genres.forEach(function (g) {
                    var name = typeof g === 'string' ? g : (g && g.name);
                    if (!name) return;
                    if (!StatsDB.data.genres[name]) StatsDB.data.genres[name] = { seconds: 0, count: 0 };
                    StatsDB.data.genres[name].count += 1;
                });
            }

            if (meta && meta.actors) {
                meta.actors.slice(0, 8).forEach(function (a) {
                    if (!a || !a.id) return;
                    var key = String(a.id);
                    if (!StatsDB.data.actors[key]) {
                        StatsDB.data.actors[key] = {
                            id: a.id,
                            name: a.name || '',
                            profile_path: a.profile_path || '',
                            seconds: 0,
                            count: 0
                        };
                    }
                    StatsDB.data.actors[key].count += 1;
                });
            }

            if (meta && meta.year) {
                var y = String(meta.year);
                if (!this.data.years[y]) this.data.years[y] = { seconds: 0, count: 0 };
                this.data.years[y].count += 1;
            }

            this.save();
            return true;
        },

        formatTime: function (sec) {
            sec = Math.max(0, Math.floor(sec || 0));
            var totalMin = Math.floor(sec / 60);
            var days = Math.floor(totalMin / 1440);
            var hours = Math.floor((totalMin % 1440) / 60);
            var minutes = totalMin % 60;

            if (days > 0) {
                var dlabel = days === 1 ? LANG.day : LANG.days;
                return days + ' ' + dlabel + ' ' + hours + ' ' + LANG.hours;
            }
            if (hours > 0) return hours + ' ' + LANG.hours + ' ' + minutes + ' ' + LANG.minutes;
            return minutes + ' ' + LANG.minutes;
        },

        topGenre: function () {
            var best = null, bestSec = -1, total = 0;
            Object.keys(this.data.genres).forEach(function (name) {
                var s = StatsDB.data.genres[name].seconds || 0;
                total += s;
                if (s > bestSec) {
                    bestSec = s;
                    best = name;
                }
            });
            if (!best || total <= 0) return { name: LANG.no_genre, percent: 0 };
            return { name: best, percent: Math.round((bestSec / total) * 100) };
        },

        topActors: function (limit) {
            limit = limit || CONFIG.max_actors_show;
            return Object.keys(this.data.actors)
                .map(function (k) { return StatsDB.data.actors[k]; })
                .sort(function (a, b) { return (b.seconds || 0) - (a.seconds || 0); })
                .slice(0, limit);
        },

        genreList: function () {
            return Object.keys(this.data.genres)
                .map(function (name) {
                    return { name: name, seconds: StatsDB.data.genres[name].seconds || 0 };
                })
                .sort(function (a, b) { return b.seconds - a.seconds; });
        },

        yearBuckets: function () {
            var buckets = {};
            Object.keys(this.data.years).forEach(function (y) {
                var year = parseInt(y, 10);
                if (!year) return;
                var decade = Math.floor(year / 10) * 10;
                var key = decade + '-ті';
                if (!buckets[key]) buckets[key] = 0;
                buckets[key] += StatsDB.data.years[y].seconds || 0;
            });
            return Object.keys(buckets)
                .map(function (k) { return { label: k, seconds: buckets[k] }; })
                .sort(function (a, b) { return a.label.localeCompare(b.label); });
        },

        bestMonth: function () {
            var best = -1, sec = -1;
            Object.keys(this.data.by_month).forEach(function (m) {
                var s = StatsDB.data.by_month[m] || 0;
                if (s > sec) {
                    sec = s;
                    best = parseInt(m, 10);
                }
            });
            if (best < 0) return null;
            return { label: MONTHS[best] || String(best), hours: Math.floor(sec / 3600) };
        },

        bestWeekday: function () {
            var best = -1, sec = -1;
            Object.keys(this.data.by_weekday).forEach(function (d) {
                var s = StatsDB.data.by_weekday[d] || 0;
                if (s > sec) {
                    sec = s;
                    best = parseInt(d, 10);
                }
            });
            if (best < 0) return null;
            return WEEKDAYS[best] || '';
        },

        bestHour: function () {
            var best = -1, sec = -1;
            Object.keys(this.data.by_hour).forEach(function (h) {
                var s = StatsDB.data.by_hour[h] || 0;
                if (s > sec) {
                    sec = s;
                    best = parseInt(h, 10);
                }
            });
            if (best < 0) return null;
            var hh = best < 10 ? '0' + best : String(best);
            return hh + ':00';
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
                Lampa.SettingsApi.addParam({
                    component: 'interface',
                    param: { type: 'title' },
                    field: { name: LANG.settings_title }
                });
                Lampa.SettingsApi.addParam({
                    component: 'interface',
                    param: { name: CONFIG.collect_storage, type: 'trigger', default: true },
                    field: { name: LANG.collect_setting }
                });
                Lampa.SettingsApi.addParam({
                    component: 'interface',
                    param: { name: CONFIG.menu_storage, type: 'trigger', default: true },
                    field: { name: LANG.menu_setting },
                    onChange: function () {
                        setTimeout(function () { Menu.update(); }, 100);
                    }
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

    /* ===================== Media helpers ===================== */
    var Media = {
        lastCard: null,

        getId: function (movie) {
            if (!movie) return 'unknown';
            var id =
                movie.id ||
                movie.tmdb_id ||
                movie.kinopoisk_id ||
                movie.imdb_id ||
                movie.original_title ||
                movie.original_name ||
                movie.title ||
                movie.name ||
                'unknown';
            var season = movie.season_number || movie.season || 0;
            var episode = movie.episode_number || movie.episode || 0;
            return String(id) + ':' + String(season) + ':' + String(episode);
        },

        isEpisode: function (movie) {
            if (!movie) return false;
            if (movie.episode || movie.episode_number) return true;
            if (movie.season_number && movie.episode_number) return true;
            if (movie.name && !movie.title && (movie.first_air_date || movie.number_of_seasons)) return true;
            return false;
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
            if (Array.isArray(movie.genres) && movie.genres.length) return movie.genres;
            if (Array.isArray(movie.genre_ids)) return [];
            return [];
        },

        actorsOf: function (movie) {
            if (!movie) return [];
            var list = [];
            try {
                if (movie.credits && Array.isArray(movie.credits.cast)) list = movie.credits.cast;
                else if (movie.cast && Array.isArray(movie.cast)) list = movie.cast;
                else if (movie.persons && Array.isArray(movie.persons)) list = movie.persons;
            } catch (e) {}
            return list
                .filter(function (p) { return p && (p.id || p.name); })
                .slice(0, 12)
                .map(function (p) {
                    return {
                        id: p.id || p.name,
                        name: p.name || '',
                        profile_path: p.profile_path || p.img || ''
                    };
                });
        },

        metaFrom: function (movie) {
            if (!movie) return null;
            return {
                isEpisode: this.isEpisode(movie),
                year: this.yearOf(movie),
                genres: this.genresOf(movie),
                actors: this.actorsOf(movie)
            };
        },

        normalize: function (data) {
            if (!data) return null;
            var movie = data.card || data.movie || null;
            if (!movie || typeof movie !== 'object') {
                if (data.id || data.title || data.name) movie = data;
                else return null;
            }
            var season = data.season != null ? data.season : null;
            var episode = data.episode != null ? data.episode : null;
            if (season != null || episode != null) {
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
        },

        remember: function (movie) {
            if (movie && typeof movie === 'object') this.lastCard = movie;
        }
    };

    var Current = {
        getMovie: function () {
            if (Media.lastCard) return Media.lastCard;
            try {
                var a = Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active();
                if (!a) return null;
                if (a.movie) return a.movie;
                if (a.card) return a.card;
                if (a.object && a.object.movie) return a.object.movie;
            } catch (e) {}
            return null;
        },

        getVideoState: function () {
            try {
                var video = null;
                if (Lampa.PlayerVideo && typeof Lampa.PlayerVideo.video === 'function') {
                    video = Lampa.PlayerVideo.video();
                }
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
                if (Lampa.Player && Lampa.Player.listener) {
                    Lampa.Player.listener.follow('start', function (e) { self.onStart(e); });
                    Lampa.Player.listener.follow('ready', function (e) { self.onStart(e); });
                    Lampa.Player.listener.follow('external', function (e) { self.onStart(e); });
                    Lampa.Player.listener.follow('destroy', function () {
                        setTimeout(function () {
                            self.currentMovie = null;
                        }, 4000);
                    });
                }
            } catch (e) {}

            try {
                if (Lampa.PlayerVideo && Lampa.PlayerVideo.listener) {
                    Lampa.PlayerVideo.listener.follow('timeupdate', function (e) {
                        self.onVideo(e);
                    });
                }
            } catch (e) {}

            try {
                if (Lampa.Timeline && Lampa.Timeline.listener) {
                    Lampa.Timeline.listener.follow('update', function (e) {
                        self.onTimeline(e);
                    });
                }
            } catch (e) {}

            try {
                Lampa.Listener.follow('full', function (e) {
                    if (e && e.type === 'complite' && e.data && e.data.movie) {
                        Media.remember(e.data.movie);
                        // підтягнути акторів з persons якщо є
                        if (e.data.persons && e.data.persons.cast && e.data.movie) {
                            try {
                                var m = Object.assign({}, e.data.movie);
                                m.credits = { cast: e.data.persons.cast };
                                Media.remember(m);
                                if (self.currentMovie && self.currentMovie.id === m.id) {
                                    self.currentMovie = m;
                                }
                            } catch (err) {}
                        }
                    }
                });
            } catch (e) {}

            this.timer = setInterval(function () { self.tick(); }, CONFIG.interval);
        },

        onStart: function (e) {
            var movie = Media.normalize(e) || Current.getMovie();
            if (movie) {
                this.currentMovie = movie;
                Media.remember(movie);
            }
        },

        apply: function (time, duration, wallDelta) {
            if (!Settings.collecting()) return;

            var movie = this.currentMovie || Current.getMovie() || Media.lastCard;
            var id = movie ? Media.getId(movie) : 'session:anon';
            var meta = Media.metaFrom(movie);

            var added = StatsDB.addProgress(id, time, duration, wallDelta, meta);

            if (movie && Number.isFinite(duration) && duration > 0 && time / duration >= CONFIG.completion) {
                StatsDB.markCompleted(Media.getId(movie), meta);
            }

            return added;
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
            this.apply(time, Number.isFinite(duration) ? duration : 0, 120);
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

    /* ===================== UI ===================== */
    function StatsComponent() {
        var html = $('<div class="stv-root"></div>');

        this.create = function () {
            renderAll(html);
            try {
                if (this.activity && this.activity.loader) this.activity.loader(false);
            } catch (e) {}
        };

        this.start = function () {
            try {
                Lampa.Controller.add('content', {
                    toggle: function () {
                        Lampa.Controller.collectionSet(html);
                        Lampa.Controller.collectionFocus(false, html);
                    },
                    left: function () {
                        if (Navigator.canmove('left')) Navigator.move('left');
                        else Lampa.Controller.toggle('menu');
                    },
                    right: function () { Navigator.move('right'); },
                    up: function () {
                        if (Navigator.canmove('up')) Navigator.move('up');
                        else Lampa.Controller.toggle('head');
                    },
                    down: function () { Navigator.move('down'); },
                    back: function () { Lampa.Activity.backward(); }
                });
                Lampa.Controller.toggle('content');
            } catch (e) {}
        };

        this.pause = function () {};
        this.render = function () { return html; };
        this.destroy = function () { html.remove(); };

        function renderAll(root) {
            root.empty();
            root.append('<div class="stv-title">' + LANG.page_title + '</div>');

            if (!Settings.collecting()) {
                root.append('<div class="stv-disabled">' + LANG.disabled_text + '</div>');
            }

            var has =
                StatsDB.data.seconds_watched > 0 ||
                StatsDB.data.movies_watched > 0 ||
                StatsDB.data.episodes_watched > 0;

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
            var g = StatsDB.topGenre();

            row.append(card(LANG.total_time, StatsDB.formatTime(StatsDB.data.seconds_watched), '⏱'));
            row.append(
                card(
                    LANG.watched,
                    '<span class="stv-big">' +
                        (StatsDB.data.movies_watched || 0) +
                        '</span><span class="stv-sub"> ' +
                        LANG.movies +
                        ' / ' +
                        (StatsDB.data.episodes_watched || 0) +
                        ' ' +
                        LANG.episodes +
                        '</span>',
                    '🎞'
                )
            );

            var genreHtml =
                '<div class="stv-genre-name">' +
                g.name +
                '</div><div class="stv-genre-pct">' +
                g.percent +
                '%</div>';
            row.append(card(LANG.fav_genre, genreHtml, '◎'));

            return row;
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
            var row = $('<div class="stv-actors"></div>');
            var list = StatsDB.topActors(CONFIG.max_actors_show);

            if (!list.length) {
                row.append('<div class="stv-muted">' + LANG.no_actors + '</div>');
            } else {
                list.forEach(function (a) {
                    var item = $('<div class="stv-actor selector"></div>');
                    var img = a.profile_path
                        ? (a.profile_path.indexOf('http') === 0 ? a.profile_path : CONFIG.tmdb_img + a.profile_path)
                        : '';
                    if (img) {
                        item.append('<div class="stv-actor-photo" style="background-image:url(' + img + ')"></div>');
                    } else {
                        item.append('<div class="stv-actor-photo stv-actor-ph">' + (a.name || '?').charAt(0) + '</div>');
                    }
                    item.append('<div class="stv-actor-name">' + (a.name || '') + '</div>');
                    item.append(
                        '<div class="stv-actor-meta">' +
                            StatsDB.formatTime(a.seconds || 0) +
                            ', ' +
                            (a.count || 0) +
                            ' ' +
                            LANG.films_short +
                            '</div>'
                    );
                    row.append(item);
                });
            }
            wrap.append(row);
            return wrap;
        }

        function bottomRow() {
            var row = $('<div class="stv-bottom"></div>');

            // records
            var rec = $('<div class="stv-panel selector"></div>');
            rec.append('<div class="stv-section-title">' + LANG.records + '</div>');
            var bm = StatsDB.bestMonth();
            var bw = StatsDB.bestWeekday();
            var bh = StatsDB.bestHour();
            var recHtml = '';
            if (bm) recHtml += '<div class="stv-rec-line"><b>' + bm.label + '</b> (' + bm.hours + ' ' + LANG.hours + ')</div>';
            if (bw) recHtml += '<div class="stv-rec-line">' + bw + (bh ? ', ' + bh : '') + '</div>';
            if (!recHtml) recHtml = '<div class="stv-muted">—</div>';
            rec.append(recHtml);
            row.append(rec);

            // years bars
            var years = $('<div class="stv-panel selector"></div>');
            years.append('<div class="stv-section-title">' + LANG.by_years + '</div>');
            years.append(yearBars());
            row.append(years);

            // genres pie
            var genres = $('<div class="stv-panel selector"></div>');
            genres.append('<div class="stv-section-title">' + LANG.genres_dist + '</div>');
            genres.append(genrePie());
            row.append(genres);

            return row;
        }

        function yearBars() {
            var data = StatsDB.yearBuckets();
            var box = $('<div class="stv-bars"></div>');
            if (!data.length) {
                box.append('<div class="stv-muted">—</div>');
                return box;
            }
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
            if (!list.length) {
                box.append('<div class="stv-muted">—</div>');
                return box;
            }
            var total = 0;
            list.forEach(function (g) { total += g.seconds; });
            if (total <= 0) total = 1;

            var colors = ['#3b82f6', '#ef4444', '#f59e0b', '#22c55e', '#a855f7', '#06b6d4'];
            var stops = [];
            var acc = 0;
            list.forEach(function (g, i) {
                var p = (g.seconds / total) * 100;
                var from = acc;
                acc += p;
                stops.push(colors[i % colors.length] + ' ' + from.toFixed(2) + '% ' + acc.toFixed(2) + '%');
            });

            var pie = $(
                '<div class="stv-pie" style="background:conic-gradient(' + stops.join(',') + ')"></div>'
            );
            box.append(pie);

            var legend = $('<div class="stv-legend"></div>');
            list.forEach(function (g, i) {
                var pct = Math.round((g.seconds / total) * 100);
                legend.append(
                    '<div class="stv-leg-item"><span class="stv-dot" style="background:' +
                        colors[i % colors.length] +
                        '"></span>' +
                        g.name +
                        ' ' +
                        pct +
                        '%</div>'
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
                    try {
                        Lampa.Controller.collectionSet(root);
                        Lampa.Controller.collectionFocus(false, root);
                    } catch (e) {}
                }
            });
            return b;
        }
    }

    /* ===================== Menu ===================== */
    var Menu = {
        selector: '.menu .menu__list',

        createItem: function () {
            var item = $(
                '<li class="menu__item selector" data-action="' +
                    CONFIG.menu_action +
                    '"><div class="menu__ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20V14"/></svg></div><div class="menu__text">' +
                    LANG.menu_title +
                    '</div></li>'
            );
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

        update: function () {
            var visible = Settings.menuVisible();
            var old = $('.menu__item[data-action="' + CONFIG.menu_action + '"]');
            if (!visible) {
                old.remove();
                return;
            }
            if (old.length) return;
            var menu = $(this.selector).first();
            if (!menu.length) return;
            var item = this.createItem();
            var history = menu.find('.menu__item[data-action="history"]');
            if (history.length) history.after(item);
            else menu.append(item);
        },

        init: function () {
            var self = this;
            setTimeout(function () { self.update(); }, 500);
            var n = 0;
            var t = setInterval(function () {
                self.update();
                if (++n >= 30) clearInterval(t);
            }, 1000);
        }
    };

    var CSS =
        '.stv-root{padding:22px 28px 40px;color:#fff;box-sizing:border-box;}' +
        '.stv-title{font-size:28px;font-weight:700;margin-bottom:22px;letter-spacing:0.02em;}' +
        '.stv-cards{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:28px;}' +
        '.stv-card{min-width:220px;flex:1;padding:16px 18px;border-radius:14px;background:rgba(255,255,255,0.06);border:2px solid transparent;}' +
        '.stv-card:focus{border-color:rgba(59,130,246,0.8);background:rgba(255,255,255,0.1);}' +
        '.stv-card-label{font-size:11px;opacity:0.5;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;}' +
        '.stv-card-body{display:flex;align-items:center;gap:12px;}' +
        '.stv-card-icon{font-size:22px;opacity:0.85;}' +
        '.stv-card-val{font-size:22px;font-weight:700;}' +
        '.stv-big{font-size:26px;}' +
        '.stv-sub{font-size:13px;font-weight:500;opacity:0.7;}' +
        '.stv-genre-name{font-size:18px;font-weight:700;text-transform:uppercase;}' +
        '.stv-genre-pct{font-size:13px;opacity:0.6;margin-top:2px;}' +
        '.stv-section{margin-bottom:26px;}' +
        '.stv-section-title{font-size:13px;opacity:0.55;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:14px;}' +
        '.stv-actors{display:flex;gap:14px;overflow:hidden;flex-wrap:wrap;}' +
        '.stv-actor{width:120px;text-align:center;padding:8px;border-radius:12px;border:2px solid transparent;}' +
        '.stv-actor:focus{border-color:rgba(59,130,246,0.7);background:rgba(255,255,255,0.06);}' +
        '.stv-actor-photo{width:72px;height:72px;border-radius:50%;margin:0 auto 8px;background-size:cover;background-position:center;background-color:rgba(255,255,255,0.08);}' +
        '.stv-actor-ph{display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;}' +
        '.stv-actor-name{font-size:13px;font-weight:600;line-height:1.2;margin-bottom:4px;}' +
        '.stv-actor-meta{font-size:11px;opacity:0.55;}' +
        '.stv-bottom{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:24px;}' +
        '.stv-panel{flex:1;min-width:200px;padding:16px;border-radius:14px;background:rgba(255,255,255,0.05);border:2px solid transparent;}' +
        '.stv-panel:focus{border-color:rgba(59,130,246,0.7);}' +
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
        '.stv-empty{padding:36px;border-radius:12px;background:rgba(255,255,255,0.04);text-align:center;opacity:0.7;margin-bottom:16px;}' +
        '.stv-disabled{padding:12px 16px;border-radius:8px;background:rgba(255,80,80,0.12);color:#fca5a5;margin-bottom:16px;}' +
        '.stv-reset{display:inline-block;margin-top:8px;padding:12px 18px;border-radius:10px;background:rgba(255,255,255,0.06);border:2px solid transparent;opacity:0.75;}' +
        '.stv-reset:focus{border-color:rgba(255,255,255,0.45);background:rgba(255,255,255,0.1);}';

    function installCSS() {
        if (document.getElementById('lampa-stats-v9-style')) return;
        var s = document.createElement('style');
        s.id = 'lampa-stats-v9-style';
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
            }
            Tracker.init();
            Menu.init();
            console.log('Lampa stats v9.0 ready');
        } catch (e) {
            console.error('stats init error', e);
        }
    }

    if (window.appready) setTimeout(init, 100);
    else if (window.Lampa && Lampa.Listener && Lampa.Listener.follow) {
        Lampa.Listener.follow('app', function (e) {
            if (e.type === 'ready') setTimeout(init, 100);
        });
    } else setTimeout(init, 1500);
})();
