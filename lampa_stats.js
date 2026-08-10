(function () {
    'use strict';

    if (window.lampa_ukrainian_stats_v84) return;
    window.lampa_ukrainian_stats_v84 = true;

    var LANG = {
        menu_title: 'Статистика',
        page_title: 'МОЯ СТАТИСТИКА ПЕРЕГЛЯДІВ',
        total_time: 'ЗАГАЛЬНИЙ ЧАС ПЕРЕГЛЯДУ',
        movies: 'ФІЛЬМІВ',
        episodes: 'СЕРІЙ',
        hours: 'год.',
        minutes: 'хв.',
        days: 'дн.',
        empty_text: 'Тут поки що порожньо. Почніть дивитися фільми або серіали.',
        disabled_text: 'Збір статистики наразі вимкнено в налаштуваннях.',
        collect_setting: 'Збирати статистику переглядів',
        menu_setting: 'Показувати статистику в головному меню',
        settings_title: 'Статистика переглядів',
        reset: 'Скинути статистику',
        reset_confirm: 'Ви впевнені, що хочете скинути всю статистику переглядів?',
        reset_done: 'Статистику переглядів скинуто.'
    };

    var CONFIG = {
        stats_storage: 'lampa_personal_stats',
        collect_storage: 'stats_collect',
        menu_storage: 'stats_menu_visible',
        menu_action: 'lampa_ukrainian_stats',
        activity: 'lampa_ukrainian_stats_view',
        completion: 0.85,
        interval: 1000
    };

    var DEFAULT_STATS = {
        seconds_watched: 0,
        movies_watched: 0,
        episodes_watched: 0,
        completed: {},
        last_recorded: {}
    };

    /* ===================== StatsDB ===================== */
    var StatsDB = {
        data: null,

        init: function () {
            var saved = null;
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

            this.data = Object.assign(JSON.parse(JSON.stringify(DEFAULT_STATS)), saved);

            if (!this.data.completed || typeof this.data.completed !== 'object') {
                this.data.completed = {};
            }
            if (!this.data.last_recorded || typeof this.data.last_recorded !== 'object') {
                this.data.last_recorded = {};
            }

            this.normalize();
        },

        normalize: function () {
            if (!Number.isFinite(this.data.seconds_watched)) this.data.seconds_watched = 0;
            if (!Number.isFinite(this.data.movies_watched)) this.data.movies_watched = 0;
            if (!Number.isFinite(this.data.episodes_watched)) this.data.episodes_watched = 0;

            this.data.seconds_watched = Math.max(0, Math.floor(this.data.seconds_watched));
            this.data.movies_watched = Math.max(0, Math.floor(this.data.movies_watched));
            this.data.episodes_watched = Math.max(0, Math.floor(this.data.episodes_watched));
        },

        save: function () {
            this.normalize();
            try {
                Lampa.Storage.set(CONFIG.stats_storage, this.data);
            } catch (e) {
                console.error('Статистика: save error', e);
            }
        },

        reset: function () {
            this.data = JSON.parse(JSON.stringify(DEFAULT_STATS));
            this.save();
        },

        getLastRecorded: function (id) {
            var v = this.data.last_recorded[id];
            return Number.isFinite(v) ? v : 0;
        },

        setLastRecorded: function (id, time) {
            this.data.last_recorded[id] = Math.max(0, Math.floor(time));
        },

        addWatchProgress: function (id, time, duration) {
            if (!id || !Number.isFinite(time) || time < 0) return 0;

            var prev = this.getLastRecorded(id);

            if (time < prev - 5) {
                this.setLastRecorded(id, time);
                this.save();
                return 0;
            }

            var delta = Math.max(0, time - prev);
            var maxJump = Number.isFinite(duration) && duration > 0 ? Math.min(duration, 21600) : 21600;
            var safeDelta = Math.min(delta, maxJump);

            if (safeDelta > 0) {
                this.data.seconds_watched += Math.floor(safeDelta);
            }

            this.setLastRecorded(id, time);
            this.save();
            return Math.floor(safeDelta);
        },

        getTimeString: function () {
            var seconds = Math.max(0, Math.floor(this.data.seconds_watched || 0));
            var totalMinutes = Math.floor(seconds / 60);
            var days = Math.floor(totalMinutes / 1440);
            var hours = Math.floor((totalMinutes % 1440) / 60);
            var minutes = totalMinutes % 60;

            if (days > 0) {
                return days + ' ' + LANG.days + ' ' + hours + ' ' + LANG.hours + ' ' + minutes + ' ' + LANG.minutes;
            }
            if (hours > 0) {
                return hours + ' ' + LANG.hours + ' ' + minutes + ' ' + LANG.minutes;
            }
            return minutes + ' ' + LANG.minutes;
        }
    };

    /* ===================== Settings ===================== */
    var Settings = {
        added: false,

        setup: function () {
            if (this.added || !Lampa.SettingsApi || !Lampa.SettingsApi.addParam) return;
            this.added = true;

            try {
                if (Lampa.Storage.get(CONFIG.collect_storage) === null || Lampa.Storage.get(CONFIG.collect_storage) === undefined) {
                    Lampa.Storage.set(CONFIG.collect_storage, true);
                }
                if (Lampa.Storage.get(CONFIG.menu_storage) === null || Lampa.Storage.get(CONFIG.menu_storage) === undefined) {
                    Lampa.Storage.set(CONFIG.menu_storage, true);
                }
            } catch (e) {}

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
                console.error('Статистика: settings error', e);
            }
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

    /* ===================== Current ===================== */
    var Current = {
        getActivity: function () {
            try {
                if (Lampa.Activity && typeof Lampa.Activity.active === 'function') {
                    return Lampa.Activity.active();
                }
            } catch (e) {}
            return null;
        },

        getMovie: function () {
            var activity = this.getActivity();
            if (!activity) return null;

            if (activity.movie && typeof activity.movie === 'object') return activity.movie;
            if (activity.object && activity.object.movie) return activity.object.movie;
            if (activity.card && typeof activity.card === 'object') return activity.card;
            return null;
        },

        getVideoState: function () {
            try {
                var video = null;

                if (Lampa.PlayerVideo && typeof Lampa.PlayerVideo.video === 'function') {
                    video = Lampa.PlayerVideo.video();
                }

                if (!video) {
                    video = document.querySelector('.player video') || document.querySelector('video');
                }

                if (!video) return null;

                var time = Number(video.currentTime);
                var duration = Number(video.duration);

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

    /* ===================== Media ===================== */
    var Media = {
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
            return !!(
                movie.episode ||
                movie.episode_number ||
                (movie.season_number && movie.episode_number) ||
                (movie.season && movie.episode)
            );
        },

        normalizeFromPlayerData: function (data) {
            if (!data) return null;

            var movie = data.card || data.movie || null;
            if (!movie || typeof movie !== 'object') {
                if (data.id || data.title || data.name || data.original_title || data.original_name) {
                    movie = data;
                } else {
                    return null;
                }
            }

            var season = data.season != null ? data.season : null;
            var episode = data.episode != null ? data.episode : null;

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

    /* ===================== Tracker ===================== */
    var Tracker = {
        timer: null,
        initialized: false,
        currentMovie: null,
        lastDebug: {
            at: 0,
            source: '-',
            id: '-',
            time: 0,
            duration: 0,
            added: 0,
            movie: false,
            collecting: false
        },

        init: function () {
            if (this.initialized) return;
            this.initialized = true;

            var self = this;

            try {
                if (Lampa.Player && Lampa.Player.listener) {
                    Lampa.Player.listener.follow('start', function (e) { self.onPlayerStart(e); });
                    Lampa.Player.listener.follow('ready', function (e) { self.onPlayerStart(e); });
                    Lampa.Player.listener.follow('external', function (e) { self.onPlayerStart(e); });
                    Lampa.Player.listener.follow('destroy', function () {
                        setTimeout(function () {
                            self.currentMovie = null;
                        }, 5000);
                    });
                }
            } catch (e) {}

            try {
                if (Lampa.PlayerVideo && Lampa.PlayerVideo.listener) {
                    Lampa.PlayerVideo.listener.follow('timeupdate', function (e) {
                        self.onVideoTimeUpdate(e);
                    });
                }
            } catch (e) {}

            try {
                if (Lampa.Timeline && Lampa.Timeline.listener) {
                    Lampa.Timeline.listener.follow('update', function (e) {
                        self.onTimelineUpdate(e);
                    });
                }
            } catch (e) {}

            try {
                document.addEventListener('visibilitychange', function () {
                    if (!document.hidden) {
                        setTimeout(function () { self.tick(); }, 400);
                    }
                });
            } catch (e) {}

            this.timer = setInterval(function () {
                self.tick();
            }, CONFIG.interval);

            console.log('[stats] tracker v8.4 init');
        },

        setDebug: function (partial) {
            for (var k in partial) {
                if (Object.prototype.hasOwnProperty.call(partial, k)) {
                    this.lastDebug[k] = partial[k];
                }
            }
            this.lastDebug.at = Date.now();
        },

        onPlayerStart: function (e) {
            var movie = Media.normalizeFromPlayerData(e) || Current.getMovie();

            try {
                if (!movie && e && e.card) movie = e.card;
                if (!movie && e && e.object && e.object.movie) movie = e.object.movie;
            } catch (err) {}

            if (movie) this.currentMovie = movie;

            this.setDebug({
                source: 'player-start',
                movie: !!this.currentMovie,
                collecting: Settings.collecting()
            });
        },

        onVideoTimeUpdate: function (e) {
            if (!Settings.collecting()) return;

            var time = NaN;
            var duration = NaN;

            if (e) {
                if (e.current !== undefined) time = Number(e.current);
                else if (e.time !== undefined) time = Number(e.time);

                if (e.duration !== undefined) duration = Number(e.duration);
            }

            if (!Number.isFinite(time) || time < 0) return;

            var movie = this.currentMovie || Current.getMovie();
            var id = movie ? Media.getId(movie) : 'session:video';

            var added = StatsDB.addWatchProgress(
                id,
                time,
                Number.isFinite(duration) ? duration : 0
            );

            this.setDebug({
                source: 'video-timeupdate',
                id: id,
                time: time,
                duration: Number.isFinite(duration) ? duration : 0,
                added: added,
                movie: !!movie,
                collecting: true
            });

            if (movie && Number.isFinite(duration) && duration > 0 && time / duration >= CONFIG.completion) {
                this.markCompleted(movie, Media.getId(movie));
            }
        },

        onTimelineUpdate: function (e) {
            if (!Settings.collecting()) return;
            if (!e || !e.data) return;

            var hash = e.data.hash;
            var road = e.data.road || e.data;
            if (!road) return;

            var time = Number(road.time);
            var duration = Number(road.duration);
            var percent = Number(road.percent);

            if (!Number.isFinite(time) || time < 0) return;

            var movie = this.currentMovie || Current.getMovie();
            var id = movie ? Media.getId(movie) : ('hash:' + String(hash || 'unknown'));

            var added = StatsDB.addWatchProgress(
                id,
                time,
                Number.isFinite(duration) ? duration : 0
            );

            this.setDebug({
                source: 'timeline',
                id: id,
                time: time,
                duration: Number.isFinite(duration) ? duration : 0,
                added: added,
                movie: !!movie,
                collecting: true
            });

            var done =
                (Number.isFinite(percent) && percent >= CONFIG.completion * 100) ||
                (Number.isFinite(duration) && duration > 0 && time / duration >= CONFIG.completion);

            if (done && movie) {
                this.markCompleted(movie, Media.getId(movie));
            }
        },

        tick: function () {
            var collecting = Settings.collecting();
            if (!collecting) {
                this.setDebug({ collecting: false, source: 'tick-off' });
                return;
            }

            var movie = this.currentMovie || Current.getMovie();
            var video = Current.getVideoState();

            if (!video) {
                this.setDebug({
                    source: 'tick-no-video',
                    movie: !!movie,
                    collecting: true,
                    time: 0,
                    duration: 0,
                    added: 0
                });
                return;
            }

            var id = movie ? Media.getId(movie) : 'session:tick';
            var added = StatsDB.addWatchProgress(id, video.time, video.duration);

            this.setDebug({
                source: 'tick',
                id: id,
                time: video.time,
                duration: video.duration,
                added: added,
                movie: !!movie,
                collecting: true
            });

            if (movie && video.duration > 0 && video.time / video.duration >= CONFIG.completion) {
                this.markCompleted(movie, Media.getId(movie));
            }
        },

        markCompleted: function (movie, id) {
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

    /* ===================== Stats Component ===================== */
    function StatsComponent(object) {
        var html = $('<div class="lampa-stats-view"></div>');

        this.create = function () {
            buildContent(html);
            try {
                if (this.activity && this.activity.loader) {
                    this.activity.loader(false);
                }
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
                    right: function () {
                        Navigator.move('right');
                    },
                    up: function () {
                        if (Navigator.canmove('up')) Navigator.move('up');
                        else Lampa.Controller.toggle('head');
                    },
                    down: function () {
                        if (Navigator.canmove('down')) Navigator.move('down');
                    },
                    back: function () {
                        Lampa.Activity.backward();
                    }
                });
                Lampa.Controller.toggle('content');
            } catch (e) {
                console.error('Статистика: focus error', e);
            }
        };

        this.pause = function () {};

        this.render = function () {
            return html;
        };

        this.destroy = function () {
            html.remove();
        };

        function buildContent(container) {
            container.empty();

            container.append('<div class="lampa-stats-title">' + LANG.page_title + '</div>');

            var d = Tracker.lastDebug || {};
            var dbg =
                'sec=' + (StatsDB.data.seconds_watched || 0) +
                ' | src=' + (d.source || '-') +
                ' | t=' + Math.floor(d.time || 0) +
                '/' + Math.floor(d.duration || 0) +
                ' | movie=' + (d.movie ? 'Y' : 'N') +
                ' | collect=' + (d.collecting ? 'Y' : 'N') +
                ' | add=' + (d.added || 0);

            container.append(
                '<div style="opacity:0.45;font-size:13px;margin-bottom:16px;word-break:break-all;">' +
                dbg +
                '</div>'
            );

            if (!Settings.collecting()) {
                container.append(
                    '<div class="lampa-stats-disabled">' + LANG.disabled_text + '</div>'
                );
            }

            var hasData =
                StatsDB.data.seconds_watched > 0 ||
                StatsDB.data.movies_watched > 0 ||
                StatsDB.data.episodes_watched > 0;

            if (!hasData) {
                container.append(
                    $('<div class="lampa-stats-empty selector">' + LANG.empty_text + '</div>')
                );
            } else {
                container.append(renderSummary());
                container.append(renderResetButton());
            }
        }

        function renderSummary() {
            var summary = $('<div class="lampa-stats-summary"></div>');
            summary.append(renderCard(LANG.total_time, StatsDB.getTimeString(), '⏱'));
            summary.append(renderCard(LANG.movies, StatsDB.data.movies_watched || 0, '🎬'));
            summary.append(renderCard(LANG.episodes, StatsDB.data.episodes_watched || 0, '📺'));
            return summary;
        }

        function renderCard(label, value, icon) {
            var card = $('<div class="lampa-stats-card selector"></div>');
            card.append('<div class="lampa-stats-card-icon">' + icon + '</div>');
            var content = $('<div class="lampa-stats-card-content"></div>');
            content.append('<div class="lampa-stats-card-label">' + label + '</div>');
            content.append('<div class="lampa-stats-card-value">' + value + '</div>');
            card.append(content);
            return card;
        }

        function renderResetButton() {
            var button = $('<div class="lampa-stats-reset selector">' + LANG.reset + '</div>');
            button.on('hover:enter click', function () {
                if (confirm(LANG.reset_confirm)) {
                    StatsDB.reset();
                    Lampa.Noty.show(LANG.reset_done);
                    buildContent(html);
                    try {
                        Lampa.Controller.collectionSet(html);
                        Lampa.Controller.collectionFocus(false, html);
                    } catch (e) {}
                }
            });
            return button;
        }
    }

    /* ===================== Menu ===================== */
    var Menu = {
        selector: '.menu .menu__list',

        createItem: function () {
            var item = $(
                '<li class="menu__item selector" data-action="' + CONFIG.menu_action + '">' +
                '<div class="menu__ico">' +
                '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M18 20V10"></path><path d="M12 20V4"></path><path d="M6 20V14"></path>' +
                '</svg></div>' +
                '<div class="menu__text">' + LANG.menu_title + '</div></li>'
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

            var attempts = 0;
            var timer = setInterval(function () {
                self.update();
                attempts++;
                if (attempts >= 30) clearInterval(timer);
            }, 1000);
        }
    };

    /* ===================== CSS ===================== */
    var CSS =
        '.lampa-stats-view{padding:25px;color:#fff;box-sizing:border-box;}' +
        '.lampa-stats-title{font-size:26px;font-weight:700;margin-bottom:25px;color:#fff;}' +
        '.lampa-stats-summary{display:flex;flex-wrap:wrap;gap:15px;margin-bottom:25px;}' +
        '.lampa-stats-card{display:flex;align-items:center;min-width:230px;padding:18px;border-radius:10px;background:rgba(255,255,255,0.06);border:2px solid transparent;box-sizing:border-box;}' +
        '.lampa-stats-card:focus{outline:none;border-color:rgba(255,255,255,0.5);background:rgba(255,255,255,0.12);}' +
        '.lampa-stats-card-icon{width:45px;min-width:45px;font-size:25px;opacity:0.8;}' +
        '.lampa-stats-card-content{padding-left:12px;}' +
        '.lampa-stats-card-label{font-size:12px;opacity:0.55;text-transform:uppercase;}' +
        '.lampa-stats-card-value{margin-top:5px;font-size:21px;font-weight:700;}' +
        '.lampa-stats-empty{max-width:700px;padding:40px 25px;border-radius:10px;background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.55);text-align:center;border:2px solid transparent;}' +
        '.lampa-stats-empty:focus{outline:none;border-color:rgba(255,255,255,0.5);}' +
        '.lampa-stats-disabled{max-width:700px;padding:15px 20px;margin-bottom:20px;border-radius:8px;background:rgba(255,80,80,0.10);color:rgba(255,140,140,1);}' +
        '.lampa-stats-reset{display:inline-block;padding:14px 20px;border-radius:8px;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.65);border:2px solid transparent;}' +
        '.lampa-stats-reset:focus{outline:none;border-color:rgba(255,255,255,0.5);background:rgba(255,255,255,0.12);}';

    function installCSS() {
        if (document.getElementById('lampa-ukrainian-stats-style')) return;
        var style = document.createElement('style');
        style.id = 'lampa-ukrainian-stats-style';
        style.innerHTML = CSS;
        document.head.appendChild(style);
    }

    /* ===================== Init ===================== */
    function init() {
        try {
            if (!window.Lampa) {
                console.error('Статистика: Lampa API недоступний');
                return;
            }

            StatsDB.init();
            installCSS();
            Settings.setup();

            if (Lampa.Component && Lampa.Component.add) {
                Lampa.Component.add(CONFIG.activity, StatsComponent);
            }

            Tracker.init();
            Menu.init();

            console.log('Lampa — Статистика v8.4 запущено');
        } catch (error) {
            console.error('Статистика: помилка запуску', error);
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
