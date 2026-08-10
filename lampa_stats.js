(function () {
    'use strict';

    // Змінено версію на v3 для уникнення конфліктів при оновленні
    if (window.lampa_stats_plugin_v3) return;
    window.lampa_stats_plugin_v3 = true;

    // --- Локалізація (Українська) ---
    var lang = {
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
    var StatsDB = {
        data: Lampa.Storage.get('lampa_personal_stats', {
            seconds_watched: 0,
            movies_watched: 0,
            episodes_watched: 0
        }),
        save: function() {
            Lampa.Storage.set('lampa_personal_stats', this.data);
        },
        getFormattedTime: function() {
            var totalMins = Math.floor((this.data.seconds_watched || 0) / 60);
            var days = Math.floor(totalMins / (24 * 60));
            var hours = Math.floor((totalMins % (24 * 60)) / 60);
            var mins = totalMins % 60;
            return { days: days, hours: hours, mins: mins };
        }
    };

    // --- Універсальний Трекер (Для внутрішніх та зовнішніх плеєрів) ---
    var view_cache = {};
    var stats_initialized = false;

    function initTracker() {
        if (stats_initialized) return;
        stats_initialized = true;

        var initial_views = Lampa.Storage.get('file_view', {});
        var now = Date.now();
        for(var h in initial_views) {
            view_cache[h] = { time: initial_views[h].time || 0, ts: now };
        }

        var origSet = Lampa.Storage.set;
        Lampa.Storage.set = function (name, value) {
            if (name === 'file_view' && Lampa.Storage.get('stats_collect', true)) {
                processFileViewUpdate(value);
            }
            origSet.apply(this, arguments);
        };
    }

    function processFileViewUpdate(new_views) {
        var now = Date.now();
        for (var hash in new_views) {
            var curr = new_views[hash];
            var cached = view_cache[hash];

            if (!cached) {
                view_cache[hash] = { time: curr.time || 0, ts: now };
            } else if (curr.time !== cached.time) {
                var video_delta = (curr.time || 0) - cached.time;
                var real_delta = Math.floor((now - cached.ts) / 1000);

                if (video_delta > 0) {
                    var actual_watched = Math.min(video_delta, real_delta + 15);

                    if (actual_watched > 0) {
                        StatsDB.data.seconds_watched = (StatsDB.data.seconds_watched || 0) + actual_watched;
                        
                        var duration = curr.duration || 1;
                        var percent_now = (curr.time || 0) / duration;
                        var percent_before = cached.time / duration;

                        if (percent_now >= 0.85 && percent_before < 0.85) {
                            var is_tv = false;
                            var active = Lampa.Activity.active();
                            if (active && active.movie && active.movie.name) is_tv = true;
                            
                            if (is_tv) StatsDB.data.episodes_watched = (StatsDB.data.episodes_watched || 0) + 1;
                            else StatsDB.data.movies_watched = (StatsDB.data.movies_watched || 0) + 1;
                        }
                        
                        StatsDB.save();
                    }
                }
                view_cache[hash] = { time: curr.time || 0, ts: now };
            }
        }
    }

    // --- Налаштування плагіна ---
    function setupSettings() {
        if (!Lampa.SettingsApi || !Lampa.SettingsApi.addParam) return;
        if (window.stats_settings_added) return;
        window.stats_settings_added = true;

        var targetComponent = 'interface';
        if (Lampa.Storage.get('stats_collect') === null) Lampa.Storage.set('stats_collect', true);
        if (Lampa.Storage.get('stats_menu_visible') === null) Lampa.Storage.set('stats_menu_visible', true);

        Lampa.SettingsApi.addParam({ component: targetComponent, param: { type: 'title' }, field: { name: 'Статистика (Stats Plugin)' } });
        Lampa.SettingsApi.addParam({ component: targetComponent, param: { name: 'stats_collect', type: 'trigger', default: true }, field: { name: 'Збирати статистику переглядів' } });
        Lampa.SettingsApi.addParam({ component: targetComponent, param: { name: 'stats_menu_visible', type: 'trigger', default: true }, field: { name: 'Відображати розділ у головному меню' }, onChange: function () { updateMenuVisibility(); } });
    }

    // --- Логіка відображення меню (З ФІКСОМ ПЕРЕЗАВАНТАЖЕННЯ) ---
    function updateMenuVisibility() {
        var isVisible = Lampa.Storage.get('stats_menu_visible', true);
        var existingMenuItem = $('.menu__item[data-action="lampa_stats"]');
        
        if (!isVisible) {
            existingMenuItem.remove();
            return;
        }
        if (existingMenuItem.length) return; 
        if ($('.menu__list').length === 0) return; // Меню ще не відрендерене Лампою

        var menuItem = $('<li class="menu__item selector" data-action="lampa_stats">' +
            '<div class="menu__ico">' +
                '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"></path><path d="M12 20V4"></path><path d="M6 20V14"></path></svg>' +
            '</div>' +
            '<div class="menu__text">' + lang.menu_title + '</div>' +
        '</li>');

        menuItem.on('hover:enter click', function () {
            if ($('body').hasClass('menu--open')) $('body').removeClass('menu--open');
            Lampa.Activity.push({ url: 'stats.view', title: lang.menu_title, component: 'lampa_stats_view', page: 1 });
        });

        var historyItem = $('.menu__item[data-action="history"]');
        if (historyItem.length) historyItem.after(menuItem);
        else $('.menu__list').append(menuItem);
    }

    // --- Визначення екрану Activity ---
    function defineActivity() {
        Lampa.Activity.define('lampa_stats_view', {
            start: function () {
                var render = Lampa.Template.get('activity_lampa_stats_view', {});
                this.dom = render;

                render.append('<div class="lampa-stats-title">' + lang.page_title + '</div>');

                if (!Lampa.Storage.get('stats_collect', true)) {
                    render.append('<div style="color:#F56565; margin-bottom:20px;">Збір статистики наразі вимкнено в налаштуваннях Інтерфейсу.</div>');
                }

                if ((StatsDB.data.seconds_watched || 0) === 0) {
                    var emptyBlock = $('<div class="lampa-stats-empty selector" tabindex="0">' + lang.empty_text + '</div>');
                    render.append(emptyBlock);
                } else {
                    var timeData = StatsDB.getFormattedTime();
                    var timeString = lang.days_hours.replace('{days}', timeData.days).replace('{hours}', timeData.hours).replace('{minutes}', timeData.mins);
                    var watchedString = lang.movies_episodes.replace('{movies}', StatsDB.data.movies_watched || 0).replace('{episodes}', StatsDB.data.episodes_watched || 0);

                    var summary = $('<div class="lampa-stats-summary"></div>');
                    summary.append(this.renderSummaryCard(lang.total_time, timeString, '<i class="fa fa-clock-o"></i>'));
                    summary.append(this.renderSummaryCard(lang.watched, watchedString, '<i class="fa fa-film"></i>'));
                    render.append(summary);
                    
                    var demoNotice = $('<div style="color:#a0aec0; margin-top:20px; font-size:14px; text-align:center;">* Графіки нижче використовують демонстраційні дані для тестування дизайну *</div>');
                    render.append(demoNotice);
                }

                render.addClass('lampa-stats-view');
                render.onfocus = this.onfocus.bind(this);
            },
            
            renderSummaryCard: function (label, value, iconHtml) {
                var card = $('<div class="lampa-stats-card selector" tabindex="0"></div>');
                card.append('<div class="lampa-stats-card-icon">' + iconHtml + '</div>');
                var content = $('<div class="lampa-stats-card-content"></div>');
                content.append('<div class="lampa-stats-card-label">' + label + '</div>');
                content.append('<div class="lampa-stats-card-value">' + value + '</div>');
                card.append(content);
                return card;
            },

            onfocus: function () {
                var render = this.dom;
                Lampa.Focus.set({ element: render.find('.selector') });
            },
            
            destroy: function () {
                if (this.dom) this.dom.empty().remove();
            }
        });
    }

    // --- CSS Стилі ---
    var css_styles = `
        .lampa-stats-view { padding: 20px; color: #fff; font-family: sans-serif; }
        .lampa-stats-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #fff; }
        .lampa-stats-summary { display: flex; gap: 15px; margin-bottom: 25px; }
        .lampa-stats-card { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; flex: 1; display: flex; align-items: center; gap: 10px; border: 2px solid transparent; transition: border-color 0.2s, box-shadow 0.2s; }
        .lampa-stats-card:focus { border-color: #3182CE; box-shadow: 0 0 10px rgba(49,130,206,0.5); outline: none; background: rgba(255,255,255,0.1); }
        .lampa-stats-card-icon { font-size: 24px; color: #3182CE; }
        .lampa-stats-card-content { flex-grow: 1; }
        .lampa-stats-card-label { font-size: 12px; color: #a0aec0; text-transform: uppercase; }
        .lampa-stats-card-value { font-size: 18px; font-weight: bold; margin-top: 2px; color: #fff; }
        .lampa-stats-empty { background: rgba(255,255,255,0.02); border-radius: 8px; padding: 40px; text-align: center; color: #a0aec0; font-size: 16px; margin-bottom: 20px; border: 2px solid transparent; }
        .lampa-stats-empty:focus { border-color: #3182CE; outline: none; }
    `;

    // --- Запуск ---
    function runInit() {
        if (!document.getElementById('lampa-stats-style')) {
            Lampa.Template.add('stats_plugin_styles', '<style id="lampa-stats-style">' + css_styles + '</style>');
            $('body').append(Lampa.Template.get('stats_plugin_styles'));
        }
        setupSettings();
        initTracker(); 
        defineActivity();
        
        // Перевіряємо наявність меню кожну секунду (вирішує проблему з перезавантаженням)
        setInterval(updateMenuVisibility, 1000);
    }

    if (window.appready) runInit();
    else if (Lampa.Listener && Lampa.Listener.follow) {
        Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') runInit(); });
    } else {
        setTimeout(runInit, 1500);
    }

})();
