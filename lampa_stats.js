(function () {
    'use strict';

    console.log('Lampa Stats Plugin loading...');

    // --- Локалізація (Українська) ---
    // Усі текстові константи приведені до української мови, як на дизайні.
    var lang = {
        menu_title: 'Статистика',
        page_title: 'МОЯ СТАТИСТИКА ПЕРЕГЛЯДІВ',
        total_time: 'СУМАРНИЙ ЧАС',
        days_hours: '{days} день {hours} годин',
        watched: 'ПЕРЕГЛЯНУТО',
        movies_episodes: '{movies} фільмів / {episodes} серій',
        fav_genre: 'УЛЮБЛЕНИЙ ЖАНР',
        genre_sci_fi: 'ФАНТАСТИКА',
        actors_title: 'ВАШІ УЛЮБЛЕНІ АКТОРЫ',
        hours_movies: '{hours} годин, {movies} фільмів',
        chart_year_title: 'ВПОДОБАННЯ ЗА РОКАМИ ВИПУСКУ',
        chart_genre_title: 'РОЗПОДІЛ ЖАНРІВ',
        records_title: 'РЕКОРДИ',
        records_oct: 'Жовтень ({hours} год.)',
        records_sat: 'Субота, 21:00'
    };

    // --- Mock-дані (на основі дизайну) ---
    // У реальному плагіні ці дані мають братися з API (наприклад, TMDB)
    // або локальної бази даних профілю Lampa.
    var mock_data = {
        total_time: { days: 21, hours: 7 },
        watched: { movies: 312, episodes: 1150 },
        fav_genre: { name: lang.genre_sci_fi, percent: 35 },
        actors: [
            { name: 'Кілліан Мерфі', img: 'https://image.tmdb.org/t/p/w185/wMrlvE7H14r6ZJm3HlC1M5G0A5T.jpg', hours: 48, movies: 12 },
            { name: 'Флоренс П\'ю', img: 'https://image.tmdb.org/t/p/w185/4YdFT0Y0T4q44f8W1K8v9XFm6f6.jpg', hours: 31, movies: 8 },
            { name: 'Том Круз', img: 'https://image.tmdb.org/t/p/w185/g5m5t4A0qA3D1M5R5S6b3G6oM5P.jpg', hours: 29, movies: 7 },
            { name: 'Емма Стоун', img: 'https://image.tmdb.org/t/p/w185/vM5t4A0qA3D1M5R5S6b3G6oM5P.jpg', hours: 25, movies: 6 }
        ],
        year_prefs: [ { year: '2010-ті', value: 180 }, { year: '2020-ті', value: 210 } ],
        genre_dist: [
            { name: 'Фантастика', percent: 35, color: '#3182CE' },
            { name: 'Драма', percent: 25, color: '#48BB78' },
            { name: 'Комедія', percent: 20, color: '#F6E05E' },
            { name: 'Трилер', percent: 20, color: '#F56565' }
        ],
        records: { month: 'Жовтень', hours: 120, day: 'Субота, 21:00' }
    };

    // --- CSS Стилі плагіна ---
    // Специфічні стилі для імітації дизайну на зображенні,
    // включаючи кольори, відступи, рамки та ефекти фокусу.
    var css_styles = `
        .lampa-stats-view { padding: 20px; color: #fff; font-family: sans-serif; }
        .lampa-stats-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #fff; }
        .lampa-stats-summary { display: flex; gap: 15px; margin-bottom: 25px; }
        .lampa-stats-card { background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; flex: 1; display: flex; align-items: center; gap: 10px; border: 2px solid transparent; transition: border-color 0.2s, box-shadow 0.2s; }
        .lampa-stats-card:focus { border-color: #3182CE; box-shadow: 0 0 10px rgba(49,130,206,0.5); outline: none; }
        .lampa-stats-card-icon { font-size: 24px; color: #3182CE; }
        .lampa-stats-card-content { flex-grow: 1; }
        .lampa-stats-card-label { font-size: 12px; color: #a0aec0; text-transform: uppercase; }
        .lampa-stats-card-value { font-size: 18px; font-weight: bold; margin-top: 2px; color: #fff; }
        
        /* Улюблений жанр з круговою діаграмою */
        .lampa-stats-fav-genre-chart { width: 50px; height: 50px; border-radius: 50%; background: conic-gradient(#3182CE ${mock_data.fav_genre.percent}%, rgba(255,255,255,0.1) 0%); position: relative; }
        .lampa-stats-fav-genre-percent { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 12px; font-weight: bold; color: #fff; }
        
        .lampa-stats-actors { margin-bottom: 25px; }
        .lampa-stats-actors-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #fff; }
        .lampa-stats-carousel { overflow: hidden; position: relative; width: 100%; height: 210px; }
        .lampa-stats-actor-card { width: 160px; text-align: center; margin-right: 15px; border: 2px solid transparent; border-radius: 8px; padding: 10px; background: rgba(255,255,255,0.02); transition: border-color 0.2s, background 0.2s, box-shadow 0.2s; }
        .lampa-stats-actor-card:focus { border-color: #3182CE; box-shadow: 0 0 10px rgba(49,130,206,0.5); outline: none; background: rgba(255,255,255,0.05); }
        .lampa-stats-actor-img { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin: 0 auto 10px; display: block; border: 2px solid rgba(255,255,255,0.1); }
        .lampa-stats-actor-card:focus .lampa-stats-actor-img { border-color: #3182CE; }
        .lampa-stats-actor-name { font-size: 14px; font-weight: bold; color: #fff; margin-bottom: 2px; }
        .lampa-stats-actor-info { font-size: 10px; color: #a0aec0; }

        .lampa-stats-charts-grid { display: flex; gap: 15px; margin-bottom: 25px; }
        .lampa-stats-chart-block { background: rgba(255,255,255,0.03); padding: 15px; border-radius: 8px; flex: 1; border: 2px solid transparent; }
        .lampa-stats-chart-block:focus { border-color: #3182CE; outline: none; box-shadow: 0 0 10px rgba(49,130,206,0.3); }
        .lampa-stats-chart-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #fff; }
        
        /* Гістограма по роках (спрощена HTML/CSS) */
        .lampa-stats-chart-years { display: flex; align-items: flex-end; gap: 10px; height: 150px; padding-top: 20px; }
        .lampa-stats-chart-year-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; }
        .lampa-stats-chart-year-bar { background: #3182CE; border-radius: 4px; width: 30px; position: relative; transition: height 0.3s; }
        .lampa-stats-chart-year-value { position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 10px; color: #a0aec0; }
        .lampa-stats-chart-year-label { font-size: 10px; color: #a0aec0; margin-top: 5px; }
        
        /* Розподіл жанрів (спрощена HTML/CSS) */
        .lampa-stats-chart-genres { display: flex; gap: 15px; align-items: center; }
        .lampa-stats-chart-genres-pie { width: 100px; height: 100px; border-radius: 50%; position: relative; }
        .lampa-stats-chart-genres-legend { flex-grow: 1; display: flex; flex-direction: column; gap: 5px; }
        .lampa-stats-genre-legend-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #a0aec0; }
        .lampa-stats-genre-dot { width: 8px; height: 8px; border-radius: 50%; }

        .lampa-stats-records-left { width: 25%; float: left; margin-top: 25px; background: rgba(255,255,255,0.02); padding: 10px; border-radius: 8px; }
        .lampa-stats-records-title { font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #fff; }
        .lampa-stats-record-item { font-size: 12px; color: #a0aec0; margin-bottom: 5px; }
    `;

    // Додавання CSS стилів у Lampa
    Lampa.Template.add('stats_plugin_styles', '<style>' + css_styles + '</style>');
    $('body').append(Lampa.Template.get('stats_plugin_styles'));

    // --- Функція ініціалізації плагіна ---
    function initStatsPlugin() {
        // Додавання пункту в бокове меню Lampa
        Lampa.Menu.add({
            id: 'lampa_stats',
            title: lang.menu_title,
            icon: '<i class="fa fa-bar-chart"></i>', // Використання FontAwesome іконки гистограми
            onclick: function () {
                // Перехід до активності плагіна при кліку
                Lampa.Activity.push({
                    url: 'stats.view',
                    component: 'lampa_stats_view',
                    page: 1
                });
            }
        });

        // --- Визначення компонента Activity (екрану) ---
        Lampa.Activity.define('lampa_stats_view', {
            start: function () {
                // Отримання порожнього шаблону для рендерингу
                var render = Lampa.Template.get('activity_lampa_stats_view', {});
                this.dom = render;

                // Основний заголовок сторінки
                render.append('<div class="lampa-stats-title">' + lang.page_title + '</div>');

                // 1. Сводні картки
                var summary = $('<div class="lampa-stats-summary"></div>');
                summary.append(this.renderSummaryCard(lang.total_time, lang.days_hours.replace('{days}', mock_data.total_time.days).replace('{hours}', mock_data.total_time.hours), '<i class="fa fa-clock-o"></i>'));
                summary.append(this.renderSummaryCard(lang.watched, lang.movies_episodes.replace('{movies}', mock_data.watched.movies).replace('{episodes}', mock_data.watched.episodes), '<i class="fa fa-film"></i>'));
                summary.append(this.renderFavGenreCard());
                render.append(summary);

                // 2. Блок з каруселлю акторів
                var actorsBlock = $('<div class="lampa-stats-actors"></div>');
                actorsBlock.append('<div class="lampa-stats-actors-title">' + lang.actors_title + '</div>');
                var carouselDom = $('<div class="lampa-stats-carousel"></div>');
                actorsBlock.append(carouselDom);
                render.append(actorsBlock);
                // Ініціалізація каруселі Lampa
                this.renderActorCarousel(carouselDom);

                // 3. Сетка з графіками
                var chartsGrid = $('<div class="lampa-stats-charts-grid"></div>');
                chartsGrid.append(this.renderYearPrefsBlock());
                chartsGrid.append(this.renderGenreDistBlock());
                render.append(chartsGrid);

                // 4. Блок рекордів (зліва)
                var recordsBlock = $('<div class="lampa-stats-records-left"></div>');
                recordsBlock.append('<div class="lampa-stats-records-title">' + lang.records_title + '</div>');
                recordsBlock.append('<div class="lampa-stats-record-item">' + lang.records_oct.replace('{hours}', mock_data.records.hours) + '</div>');
                recordsBlock.append('<div class="lampa-stats-record-item">' + lang.records_sat + '</div>');
                render.append(recordsBlock);

                // Додавання класу для стилізації
                render.addClass('lampa-stats-view');
                // Налаштування фокусу
                render.onfocus = this.onfocus.bind(this);
            },
            
            // --- Допоміжні функції рендерингу ---
            
            // Рендерить просту сводну картку
            renderSummaryCard: function (label, value, iconHtml) {
                var card = $('<div class="lampa-stats-card lampa-stats-card-main" tabindex="0"></div>');
                card.append('<div class="lampa-stats-card-icon">' + iconHtml + '</div>');
                var content = $('<div class="lampa-stats-card-content"></div>');
                content.append('<div class="lampa-stats-card-label">' + label + '</div>');
                content.append('<div class="lampa-stats-card-value">' + value + '</div>');
                card.append(content);
                return card;
            },

            // Рендерить картку улюбленого жанру з круговою діаграмою
            renderFavGenreCard: function () {
                var card = $('<div class="lampa-stats-card lampa-stats-card-fav-genre" tabindex="0"></div>');
                var chart = $('<div class="lampa-stats-fav-genre-chart"></div>');
                chart.append('<div class="lampa-stats-fav-genre-percent">' + mock_data.fav_genre.percent + '%</div>');
                card.append(chart);
                var content = $('<div class="lampa-stats-card-content"></div>');
                content.append('<div class="lampa-stats-card-label">' + lang.fav_genre + '</div>');
                content.append('<div class="lampa-stats-card-value">' + mock_data.fav_genre.name + '</div>');
                card.append(content);
                return card;
            },

            // Рендерить заголовок і карусель акторів
            renderActorCarousel: function (carouselDom) {
                var carousel = new Lampa.Carousel(carouselDom, {
                    items: mock_data.actors,
                    onrender: function (item, dom) {
                        // Кастомний рендер картки актора
                        dom.addClass('lampa-stats-actor-card card');
                        dom.attr('tabindex', '0');
                        dom.append('<img src="' + item.img + '" alt="' + item.name + '" class="lampa-stats-actor-img card__image">');
                        dom.append('<div class="lampa-stats-actor-name card__title">' + item.name + '</div>');
                        dom.append('<div class="lampa-stats-actor-info">' + lang.hours_movies.replace('{hours}', item.hours).replace('{movies}', item.movies) + '</div>');
                    }
                });
                carousel.render();
                
                // Встановлення фокусу на першого актора (Кілліан Мерфі), як на дизайні
                setTimeout(function() {
                    carouselDom.find('.lampa-stats-actor-card').first().focus();
                }, 100);
            },

            // Рендерить блок гістограми за роками випуску
            renderYearPrefsBlock: function () {
                var block = $('<div class="lampa-stats-chart-block lampa-stats-chart-years-block" tabindex="0"></div>');
                block.append('<div class="lampa-stats-chart-title">' + lang.chart_year_title + '</div>');
                var chart = $('<div class="lampa-stats-chart-years"></div>');
                
                // Визначення максимального значення для масштабування (mock)
                var maxValue = Math.max.apply(Math, mock_data.year_prefs.map(function(o) { return o.value; }));

                mock_data.year_prefs.forEach(function (item) {
                    var barWrap = $('<div class="lampa-stats-chart-year-bar-wrap"></div>');
                    // Розрахунок висоти в відсотках (спрощено)
                    var heightPercent = (item.value / maxValue) * 100;
                    var bar = $('<div class="lampa-stats-chart-year-bar" style="height: ' + heightPercent + '%;"></div>');
                    bar.append('<div class="lampa-stats-chart-year-value">' + item.value + '</div>');
                    barWrap.append(bar);
                    barWrap.append('<div class="lampa-stats-chart-year-label">' + item.year + '</div>');
                    chart.append(barWrap);
                });
                block.append(chart);
                return block;
            },

            // Рендерить блок розподілу жанрів з легендою
            renderGenreDistBlock: function () {
                var block = $('<div class="lampa-stats-chart-block lampa-stats-chart-genres-block" tabindex="0"></div>');
                block.append('<div class="lampa-stats-chart-title">' + lang.chart_genre_title + '</div>');
                var chart = $('<div class="lampa-stats-chart-genres"></div>');
                
                // Створення кругової діаграми з conic-gradient
                var gradientStr = 'conic-gradient(';
                var currentPercent = 0;
                mock_data.genre_dist.forEach(function (item, index) {
                    gradientStr += item.color + ' ' + currentPercent + '% ' + (currentPercent + item.percent) + '%';
                    currentPercent += item.percent;
                    if (index < mock_data.genre_dist.length - 1) {
                        gradientStr += ', ';
                    }
                });
                gradientStr += ')';

                var pie = $('<div class="lampa-stats-chart-genres-pie" style="background: ' + gradientStr + ';"></div>');
                chart.append(pie);

                // Створення легенди
                var legend = $('<div class="lampa-stats-chart-genres-legend"></div>');
                mock_data.genre_dist.forEach(function (item) {
                    var legendItem = $('<div class="lampa-stats-genre-legend-item"></div>');
                    legendItem.append('<div class="lampa-stats-genre-dot" style="background: ' + item.color + ';"></div>');
                    legendItem.append('<span>' + item.name + '</span>');
                    legendItem.append('<span style="margin-left: auto;">' + item.percent + '%</span>');
                    legend.append(legendItem);
                });
                chart.append(legend);
                block.append(chart);
                return block;
            },

            // Налаштування навигації і фокусу Lampa
            onfocus: function () {
                var render = this.dom;
                // Навігація по кардках, акторах і графіках
                Lampa.Focus.set({
                    element: render.find('.lampa-stats-card, .lampa-stats-actor-card, .lampa-stats-chart-block'),
                    onfocus: function(dom) {
                        // Ефекти при фокусуванні (можна додати додаткову логіку)
                    },
                    onclick: function(dom) {
                        // Дія при кліку (наприклад, відкрити деталі)
                    }
                });
            },
            
            // Очистка при закритті активності
            destroy: function () {
                if (this.dom) {
                    this.dom.empty().remove();
                }
            }
        });
    }

    // --- Очікування завантаження Lampa ---
    Lampa.Listener.follow('app', function (e) {
        if (e.type == 'ready') {
            initStatsPlugin();
        }
    });

})();
