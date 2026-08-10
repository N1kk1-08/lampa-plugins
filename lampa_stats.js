// --- Функція ініціалізації плагіна ---
    function initStatsPlugin() {
        
        // 1. Додавання пункту в бокове меню Lampa вручну (через jQuery)
        var addMenuItem = function () {
            // Перевіряємо, чи немає вже нашого пункту, щоб уникнути дублів
            if ($('.menu__item[data-action="lampa_stats"]').length) return;

            // HTML-структура пункту меню, як у самої Lampa
            var menuItem = $('<li class="menu__item selector" data-action="lampa_stats">' +
                '<div class="menu__ico">' +
                    // Використовуємо красиву SVG-іконку графіка (Lampa віддає перевагу SVG)
                    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 20V10"></path><path d="M12 20V4"></path><path d="M6 20V14"></path></svg>' +
                '</div>' +
                '<div class="menu__text">' + lang.menu_title + '</div>' +
            '</li>');

            // 'hover:enter' — це подія Lampa для натискання кнопки ОК на пульті
            menuItem.on('hover:enter click', function () {
                // Закриваємо меню, якщо воно відкрите на мобільних/ТБ
                if ($('body').hasClass('menu--open')) {
                    $('body').removeClass('menu--open');
                }
                
                // Відкриваємо нашу активність
                Lampa.Activity.push({
                    url: 'stats.view',
                    title: lang.menu_title,
                    component: 'lampa_stats_view',
                    page: 1
                });
            });

            // Додаємо наш пункт у список
            $('.menu__list').append(menuItem);
        };

        // Викликаємо функцію для додавання меню
        addMenuItem();

        // 2. Визначення компонента Activity (самого екрану)
        Lampa.Activity.define('lampa_stats_view', {
            start: function () {
                var render = Lampa.Template.get('activity_lampa_stats_view', {});
                this.dom = render;

                render.append('<div class="lampa-stats-title">' + lang.page_title + '</div>');

                var summary = $('<div class="lampa-stats-summary"></div>');
                summary.append(this.renderSummaryCard(lang.total_time, lang.days_hours.replace('{days}', mock_data.total_time.days).replace('{hours}', mock_data.total_time.hours), '<i class="fa fa-clock-o"></i>'));
                summary.append(this.renderSummaryCard(lang.watched, lang.movies_episodes.replace('{movies}', mock_data.watched.movies).replace('{episodes}', mock_data.watched.episodes), '<i class="fa fa-film"></i>'));
                summary.append(this.renderFavGenreCard());
                render.append(summary);

                var actorsBlock = $('<div class="lampa-stats-actors"></div>');
                actorsBlock.append('<div class="lampa-stats-actors-title">' + lang.actors_title + '</div>');
                var carouselDom = $('<div class="lampa-stats-carousel"></div>');
                actorsBlock.append(carouselDom);
                render.append(actorsBlock);
                this.renderActorCarousel(carouselDom);

                var chartsGrid = $('<div class="lampa-stats-charts-grid"></div>');
                chartsGrid.append(this.renderYearPrefsBlock());
                chartsGrid.append(this.renderGenreDistBlock());
                render.append(chartsGrid);

                var recordsBlock = $('<div class="lampa-stats-records-left"></div>');
                recordsBlock.append('<div class="lampa-stats-records-title">' + lang.records_title + '</div>');
                recordsBlock.append('<div class="lampa-stats-record-item">' + lang.records_oct.replace('{hours}', mock_data.records.hours) + '</div>');
                recordsBlock.append('<div class="lampa-stats-record-item">' + lang.records_sat + '</div>');
                render.append(recordsBlock);

                render.addClass('lampa-stats-view');
                render.onfocus = this.onfocus.bind(this);
            },
            
            renderSummaryCard: function (label, value, iconHtml) {
                var card = $('<div class="lampa-stats-card lampa-stats-card-main" tabindex="0"></div>');
                card.append('<div class="lampa-stats-card-icon">' + iconHtml + '</div>');
                var content = $('<div class="lampa-stats-card-content"></div>');
                content.append('<div class="lampa-stats-card-label">' + label + '</div>');
                content.append('<div class="lampa-stats-card-value">' + value + '</div>');
                card.append(content);
                return card;
            },

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

            renderActorCarousel: function (carouselDom) {
                var carousel = new Lampa.Carousel(carouselDom, {
                    items: mock_data.actors,
                    onrender: function (item, dom) {
                        dom.addClass('lampa-stats-actor-card card');
                        dom.attr('tabindex', '0');
                        dom.append('<img src="' + item.img + '" alt="' + item.name + '" class="lampa-stats-actor-img card__image">');
                        dom.append('<div class="lampa-stats-actor-name card__title">' + item.name + '</div>');
                        dom.append('<div class="lampa-stats-actor-info">' + lang.hours_movies.replace('{hours}', item.hours).replace('{movies}', item.movies) + '</div>');
                    }
                });
                carousel.render();
                
                setTimeout(function() {
                    carouselDom.find('.lampa-stats-actor-card').first().focus();
                }, 100);
            },

            renderYearPrefsBlock: function () {
                var block = $('<div class="lampa-stats-chart-block lampa-stats-chart-years-block" tabindex="0"></div>');
                block.append('<div class="lampa-stats-chart-title">' + lang.chart_year_title + '</div>');
                var chart = $('<div class="lampa-stats-chart-years"></div>');
                var maxValue = Math.max.apply(Math, mock_data.year_prefs.map(function(o) { return o.value; }));

                mock_data.year_prefs.forEach(function (item) {
                    var barWrap = $('<div class="lampa-stats-chart-year-bar-wrap"></div>');
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

            renderGenreDistBlock: function () {
                var block = $('<div class="lampa-stats-chart-block lampa-stats-chart-genres-block" tabindex="0"></div>');
                block.append('<div class="lampa-stats-chart-title">' + lang.chart_genre_title + '</div>');
                var chart = $('<div class="lampa-stats-chart-genres"></div>');
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

            onfocus: function () {
                var render = this.dom;
                Lampa.Focus.set({
                    element: render.find('.lampa-stats-card, .lampa-stats-actor-card, .lampa-stats-chart-block')
                });
            },
            
            destroy: function () {
                if (this.dom) {
                    this.dom.empty().remove();
                }
            }
        });
    }
