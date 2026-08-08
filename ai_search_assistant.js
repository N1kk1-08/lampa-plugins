(function () {
    'use strict';

    // === ГЛОБАЛЬНІ НАЛАШТУВАННЯ ===
    var STORAGE_KEY = 'google_native_key_v1';
    
    var AI_MODELS_LIST = [
        { id: 'gemini-3.1-flash-lite-preview', name: 'gemini-3.1-flash-lite-preview' },
        { id: 'gemini-3-flash-preview', name: 'gemini-3-flash-preview' },
        { id: 'gemini-2.5-flash-lite', name: 'gemini-2.5-flash-lite' },
        { id: 'gemini-2.5-flash', name: 'gemini-2.5-flash' },
        { id: 'gemma-4-31b-it', name: 'gemma-4-31b-it' },
        { id: 'gemma-3-27b-it', name: 'gemma-3-27b-it' },
        { id: 'gemma-3-4b-it', name: 'gemma-3-4b-it' }
    ];

    var PLUGIN_ICON_ASSIST = '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><style>.cls-left{fill:currentColor;fill-rule:evenodd;}.cls-right{fill:#a0a0a0;fill-rule:evenodd;}</style><g><polygon class="cls-right" points="16.64 15.13 17.38 13.88 20.91 13.88 22 12 19.82 8.25 16.75 8.25 15.69 6.39 14.5 6.39 14.5 5.13 16.44 5.13 17.5 7 19.09 7 16.9 3.25 12.63 3.25 12.63 8.25 14.36 8.25 15.09 9.5 12.63 9.5 12.63 12 14.89 12 15.94 10.13 18.75 10.13 19.47 11.38 16.67 11.38 15.62 13.25 12.63 13.25 12.63 17.63 16.03 17.63 15.31 18.88 12.63 18.88 12.63 20.75 16.9 20.75 20.18 15.13 18.09 15.13 17.36 16.38 14.5 16.38 14.5 15.13 16.64 15.13"/><polygon class="cls-left" points="7.36 15.13 6.62 13.88 3.09 13.88 2 12 4.18 8.25 7.25 8.25 8.31 6.39 9.5 6.39 9.5 5.13 7.56 5.13 6.5 7 4.91 7 7.1 3.25 11.38 3.25 11.38 8.25 9.64 8.25 8.91 9.5 11.38 9.5 11.38 12 9.11 12 8.06 10.13 5.25 10.13 4.53 11.38 7.33 11.38 8.38 13.25 11.38 13.25 11.38 17.63 7.97 17.63 8.69 18.88 11.38 18.88 11.38 20.75 7.1 20.75 3.82 15.13 5.91 15.13 6.64 16.38 9.5 16.38 9.5 15.13 7.36 15.13"/></g></svg>';
    
    window.ai_pagination = { base_prompt: '', exclude_list: [], preloaded_results: null, preloaded_raw_list: null, is_loading: false, is_preloading: false };
    window.ai_cached_results = [];
    window.ai_active_controller = null;
    window.plugin_ai_session_ids = window.plugin_ai_session_ids || new Set();

    // === UI ТА ДОПОМІЖНІ ФУНКЦІЇ ===
    function addIcon(type) {
        var ico = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><circle cx="9" cy="9" r="1"></circle><circle cx="15" cy="15" r="1"></circle><circle cx="15" cy="9" r="1"></circle><circle cx="9" cy="15" r="1"></circle></svg>';
        return '<div class="menu__ico">' + ico + '</div>';
    }

    var statusBox = null;
    function updateStatus(text) {
        if (!statusBox) {
            $('body').append('<div id="ai-global-status"><div class="ai-toast"><div class="ai-spinner"></div><span class="status-text"></span></div></div>');
            statusBox = $('#ai-global-status');
        }
        statusBox.find('.status-text').text(text);
        statusBox.fadeIn(200);
    }
    
    function hideStatus() { if(statusBox) statusBox.fadeOut(500); }

    function parseJsonSafe(text) {
        if (!text) return null;
        try { return JSON.parse(text); } catch (e) {}
        var regex = /\[[\s\S]*?\]/g;
        var match;
        while ((match = regex.exec(text)) !== null) {
            try { var result = JSON.parse(match[0]); if (Array.isArray(result) && result.length > 0) return result; } catch (e3) {}
        }
        var clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        try { return JSON.parse(clean); } catch (e2) {}
        return null;
    }

    // === БЕЗПЕЧНА КАРТКА V53 ===
    var GENRES_MAP = {28:"Бойовик",12:"Пригоди",16:"Мультфільм",35:"Комедія",80:"Кримінал",99:"Документальний",18:"Драма",10751:"Сімейний",14:"Фентезі",36:"Історія",27:"Жахи",10402:"Музика",9648:"Детектив",10749:"Мелодрама",878:"Фантастика",10770:"Телефільм",53:"Трилер",10752:"Військовий",37:"Вестерн"};

    function buildSafeCard(item, type) {
        if (!item || !item.id) return null;
        if (!item.backdrop_path) return null; 

        var realMediaType = 'movie';
        if (type === 'tv' || type === 'anime' || item.media_type === 'tv') {
            realMediaType = 'tv';
        }

        var card = {
            id: item.id,
            source: 'tmdb',
            media_type: realMediaType,
            ready: true,
            overview: String(item.overview || ''),
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            vote_average: parseFloat(item.vote_average || 0),
            vote_count: parseInt(item.vote_count || 0),
            genre_ids: Array.isArray(item.genre_ids) ? item.genre_ids : [],
            production_countries: [],
            origin_country: item.origin_country || []
        };

        if (realMediaType === 'tv') {
            card.name = String(item.name || item.title || 'Без назви');
            card.original_name = String(item.original_name || item.original_title || item.name || item.title || '');
            card.first_air_date = String(item.first_air_date || item.release_date || '2000-01-01');
        } else {
            card.title = String(item.title || item.name || 'Без назви');
            card.original_title = String(item.original_title || item.original_name || item.title || item.name || '');
            card.release_date = String(item.release_date || item.first_air_date || '2000-01-01');
        }

        if (card.genre_ids.length) {
            card.genres = card.genre_ids.map(function(id) { return { id: id, name: GENRES_MAP[id] || 'Жанр' }; });
        } else {
            card.genres = [{ id: 0, name: 'Інше' }];
        }

        if (card.media_type === 'movie') {
            if (!card.origin_country.length && item.original_language) card.origin_country = [item.original_language.toUpperCase()];
            if (!card.origin_country.length) card.origin_country = ['US'];
        }
        card.production_countries = card.origin_country.map(function(c) { return { iso_3166_1: c, name: c }; });

        return card;
    }

    // === AI АСИСТЕНТ (ЯДРО ТА КАРТКА) ===
    function AIAssistantPlugin() {
        var _this = this;
        
        this.init = function () {
            this.injectStyles();
            Lampa.Listener.follow('full', function (e) {
                if (e.type == 'complite' || e.type == 'complete') {
                    // НОВЕ: Перевіряємо чи увімкнений Асистент в налаштуваннях
                    if (Lampa.Storage.get('ai_show_assistant_btn', true)) {
                        _this.drawButton(e.object.activity.render(), e.data.movie);
                        _this.preloadTags(e.data.movie);
                    }
                }
            });
            Lampa.Listener.follow('card', function(e) {
                if (e.action == 'render' && e.card) {
                    if (e.card.is_load_more) {
                        e.element.attr('data-id', 'ai_load_more');
                        e.element.find('.card__title, .card__age, .item__title, .item__age, .card__vote, .card__icons').hide();
                    } else if (e.card.id) {
                        e.element.attr('data-id', e.card.id);
                    }
                }
            });
        };

        this.getTMDBDetails = function(card, callback) {
            var method = (card.name || card.original_name) ? 'tv' : 'movie';
            var url = Lampa.TMDB.api(method + '/' + card.id + '?api_key=' + Lampa.TMDB.key() + '&language=en-US&append_to_response=credits');
            Lampa.Network.silent(url, function(res) {
                var overview = (res.overview || '').replace(/"/g, "'").replace(/\n/g, ' ');
                var leadActor = 'unknown';
                if (res.credits && res.credits.cast && res.credits.cast.length > 0) leadActor = res.credits.cast[0].name;
                callback({ overview: overview, leadActor: leadActor });
            }, function() { callback({ overview: '', leadActor: 'unknown' }); });
        };

        this.preloadTags = function(card) {
            if (card.translated_tags) return;
            var attempts = 0, delays = [1000, 2000];
            var waitAndCheck = function() {
                setTimeout(function() {
                    if (card.translated_tags && card.translated_tags.length > 0) return;
                    attempts++;
                    if (attempts < delays.length) waitAndCheck();
                    else _this.runOwnTagTranslation(card);
                }, delays[attempts]);
            };
            waitAndCheck();
        };

        this.runOwnTagTranslation = function(card) {
            if (card.translated_tags) return;
            var method = (card.original_name || card.name) ? 'tv' : 'movie';
            var url = Lampa.TMDB.api(method + '/' + card.id + '/keywords?api_key=' + Lampa.TMDB.key());
            $.ajax({
                url: url, dataType: 'json',
                success: function (resp) {
                    var tags = resp.keywords || resp.results || [];
                    if (tags.length > 0) _this.translateTags(tags, function(translatedTags) { card.translated_tags = translatedTags; });
                    else card.translated_tags = [];
                }
            });
        };

        this.getSafeDynamicColor = function() {
            var raw = getComputedStyle(document.documentElement).getPropertyValue('--main-color').trim();
            if (!raw) return '#ffffff';
            var r = 0, g = 0, b = 0;
            if (raw.indexOf('#') === 0) {
                var hex = raw.slice(1);
                if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
                r = parseInt(hex.slice(0,2), 16); g = parseInt(hex.slice(2,4), 16); b = parseInt(hex.slice(4,6), 16);
            } else if (raw.indexOf('rgb') === 0) {
                var m = raw.match(/\d+/g);
                if (m) { r = parseInt(m[0]); g = parseInt(m[1]); b = parseInt(m[2]); }
            } else return raw;
            r /= 255; g /= 255; b /= 255;
            var max = Math.max(r, g, b), min = Math.min(r, g, b), h = 0, s = 0, l = (max + min) / 2;
            if (max !== min) {
                var d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            if (l < 0.35) l = 0.35;
            return 'hsl(' + Math.round(h * 360) + ',' + Math.round(s * 100) + '%,' + Math.round(l * 100) + '%)';
        };

        this.injectStyles = function() {
            if ($('#ai-assistant-styles').length) return;
            $('<style id="ai-assistant-styles">').prop('type', 'text/css').html(
                '.button--ai-assist { display: flex !important; align-items: center; justify-content: center; gap: 1px; } ' +
                '.button--ai-assist svg { width: 1.9em !important; height: 1.9em !important; margin: 0 !important; } ' +
                '#ai-global-status { position: fixed; bottom: 80px; left: 0; right: 0; text-align: center; z-index: 10001; pointer-events: none; display: flex; justify-content: center; }' +
                '.ai-toast { display: inline-flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.8); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); padding: 10px 24px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 5px 20px rgba(0,0,0,0.8); color: #fff; font-size: 1.1em; position: relative; overflow: hidden; height: 44px; }' +
                '.ai-toast:after { content:""; position:absolute; top:0; left:-100%; width:30%; height:100%; background:linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent); animation: ai-shimmer 4s infinite; }' +
                '@keyframes ai-shimmer { to {left:150%} }' +
                '.ai-spinner { width: 22px; height: 22px; border-radius: 50%; border: 3px solid transparent; border-top-color: #fff; animation: ai-rot 0.8s linear infinite, ai-rainbow 4s linear infinite; }' +
                '@keyframes ai-rot { to { transform: rotate(360deg); } }' +
                '@keyframes ai-rainbow { 0%{border-top-color:#fff} 16.6%{border-top-color:var(--main-color, #fff)} 33.3%{border-top-color:#0cf} 50%{border-top-color:#f0f} 66.6%{border-top-color:var(--main-color, #f0f)} 83.3%{border-top-color:#8b0000} 100%{border-top-color:#fff} }' +
                '.ai-viewer-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 5001; display: flex; align-items: center; justify-content: center; }' +
                '.ai-viewer-body { width: 85%; max-width: 900px; height: 80%; background: #121212; display: flex; flex-direction: column; border-radius: 16px; border: 1px solid var(--main-color, #fff); overflow: hidden; }' +
                '.ai-header { height: 48px; padding: 0 15px; background: #1a1a1a; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; }' +
                '.ai-title { font-size: 1.5em; font-weight: bold; }' +
                '.ai-close-btn { width: 32px; height: 32px; background: #333; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; font-family: sans-serif; cursor: pointer; border: 2px solid transparent; line-height: 0; padding-bottom: 0px; }' +
                '.ai-close-btn.focus { background: #fff; color: #000; outline: none; }' +
                '.ai-content-scroll { flex: 1; overflow-y: auto; padding: 10px 20px 20px 20px; color: #efefef; line-height: 1.4; font-size: var(--ai-font-size, 1.25em); }' +
                '.ai-fact-title { color: var(--safe-text-color, var(--main-color, #fff)); font-weight: bold; display: block; margin-bottom: 2px; }'
            ).appendTo('head');
        };

        this.drawButton = function (render, card) {
            var container = render.find('.full-start-new__buttons, .full-start__buttons').first();
            if (!container.length || container.find('.button--ai-assist').length) return;
            var btn = $('<div class="full-start__button selector button--ai-assist">' + PLUGIN_ICON_ASSIST + '<span>AI Асистент</span></div>');
            btn.on('hover:enter click', function () { _this.openAiMenu(card, btn, render); });
            var lastBtn = container.find('.selector').last();
            if (lastBtn.length) lastBtn.after(btn); else container.append(btn);
        };

        this.restoreFocus = function(btnElement, renderContainer, controllerName) {
            if (Lampa.Activity.active() && Lampa.Activity.active().activity) Lampa.Activity.active().activity.toggle();
            else Lampa.Controller.toggle(controllerName || 'full');
            if (!Lampa.Platform.is('touch') && btnElement && renderContainer) {
                setTimeout(function() { Lampa.Controller.collectionFocus(btnElement[0], renderContainer[0]); }, 10);
            }
        };

        this.openAiMenu = function(card, btnElement, renderContainer, prevCtrl) {
            var controllerName = prevCtrl || Lampa.Controller.enabled().name;
            var items = [
                { title: 'Рекомендації', action: 'recommendations' },
                { title: 'Цікаві факти', action: 'facts' }
            ];
            if (card.translated_tags && card.translated_tags.length > 0) items.splice(1, 0, { title: 'Добірки за тегами', action: 'tags' });
            if ((card.number_of_seasons && card.number_of_seasons > 1) || card.belongs_to_collection) items.push({ title: 'Стислий переказ', action: 'recap' });
            
            Lampa.Select.show({
                title: 'AI Асистент',
                items: items,
                onSelect: function (item) {
                    setTimeout(function() {
                        if (item.action === 'facts') _this.actionFacts(card, btnElement, renderContainer, controllerName);
                        else if (item.action === 'recap') _this.actionRecapMenu(card, btnElement, renderContainer, controllerName);
                        else if (item.action === 'recommendations') _this.actionRecommendations(card, btnElement, renderContainer, controllerName);
                        else if (item.action === 'tags') _this.actionTags(card, btnElement, renderContainer, controllerName);
                    }, 50);
                },
                onBack: function () { _this.restoreFocus(btnElement, renderContainer, controllerName); }
            });
        };

        this.showViewer = function(title, contentHtml, btnElement, renderContainer, controllerName) {
            var safeColor = _this.getSafeDynamicColor();
            var fontSize = Lampa.Storage.get('ai_font_size', '1.25em');
            var viewer = $('<div class="ai-viewer-container" style="--safe-text-color: ' + safeColor + '; --ai-font-size: ' + fontSize + ';">' +
                '<div class="ai-viewer-body">' +
                '<div class="ai-header"><div class="ai-title">' + title + '</div><div class="ai-close-btn selector">×</div></div>' +
                '<div class="ai-content-scroll">' + contentHtml + '</div></div></div>');
            $('body').append(viewer);
            var close = function() { viewer.remove(); _this.restoreFocus(btnElement, renderContainer, controllerName); };
            viewer.find('.ai-close-btn').on('click hover:enter', close);
            Lampa.Controller.add('ai_viewer', {
                toggle: function() { Lampa.Controller.collectionSet(viewer); Lampa.Controller.collectionFocus(viewer.find('.ai-close-btn')[0], viewer); },
                up: function() { viewer.find('.ai-content-scroll').scrollTop(viewer.find('.ai-content-scroll').scrollTop() - 100); },
                down: function() { viewer.find('.ai-content-scroll').scrollTop(viewer.find('.ai-content-scroll').scrollTop() + 100); },
                back: close
            });
            Lampa.Controller.toggle('ai_viewer');
        };

        this.actionFacts = function(card, btn, render, ctrl) {
            if (!_this.checkApiKey(btn, render, ctrl)) return;
            var ukrT = card.title || card.name, origT = card.original_title || card.original_name, year = (card.release_date || card.first_air_date || '').slice(0,4);
            var type = (card.name || card.original_name) ? 'TV series' : 'movie';
            window.ai_active_controller = ctrl || Lampa.Controller.enabled().name;
            updateStatus('Пошук фактів');
            _this.getTMDBDetails(card, function(tmdb) {
                var p = 'Provide 6 to 10 interesting, little-known facts about the ' + type + ' "' + ukrT + '" (original title: "' + origT + '", ' + year + ') with ' + tmdb.leadActor + ' in the lead role, in Ukrainian. CRITICAL RULE: If you lack verified facts, you MUST use the Google Search tool. If no reliable facts, return: [{"title": "Інформація відсутня", "text": "На жаль, достовірних фактів не знайдено."}]. Otherwise, return strictly JSON array: [{"title":"..","text":".."}]. No markdown, no intro text.';
                _this.askGemini(p, function(text) {
                    hideStatus();
                    if (Lampa.Activity.active() && Lampa.Activity.active().component !== 'full') return;
                    var data = parseJsonSafe(text);
                    if (!data) { Lampa.Noty.show('Помилка обробки результату'); _this.restoreFocus(btn, render, ctrl); return; }
                    var html = (data || []).map(function(f){ var cleanText = f.text.replace(/\[\d+(?:,\s*\d+)*\]/g, '').trim(); return '<div style="margin-bottom:12px"><span class="ai-fact-title">'+f.title+'</span>'+cleanText+'</div>'; }).join('');
                    _this.showViewer('Цікаві факти: ' + ukrT, html, btn, render, ctrl);
                }, null, false, true);
            });
        };

        this.actionRecapMenu = function(card, btn, render, ctrl) {
            if (!_this.checkApiKey(btn, render, ctrl)) return;
            var items = [];
            if (card.number_of_seasons > 1) {
                for (var i = 1; i < card.number_of_seasons; i++) items.push({ title: 'Сезон ' + i, type: 'season', value: i });
            } else if (card.belongs_to_collection) {
                window.ai_active_controller = ctrl || Lampa.Controller.enabled().name;
                updateStatus('Збір історії');
                Lampa.Network.silent(Lampa.TMDB.api('collection/' + card.belongs_to_collection.id + '?api_key=' + Lampa.TMDB.key() + '&language=uk-UA'), function(res) {
                    hideStatus();
                    (res.parts || []).forEach(function(p) { if (p.id != card.id) items.push({ title: p.title, type: 'movie', value: p.original_title }); });
                    _this.showRecapSelect(items, card, btn, render, ctrl);
                }, function() { hideStatus(); Lampa.Noty.show('Помилка завантаження колекції'); if (window.ai_active_controller) Lampa.Controller.toggle(window.ai_active_controller); });
                return;
            }
            _this.showRecapSelect(items, card, btn, render, ctrl);
        };

        this.showRecapSelect = function(items, card, btn, render, ctrl) {
            Lampa.Select.show({
                title: 'Що переказати?', items: items,
                onSelect: function(item) {
                    var t = card.original_title || card.original_name, year = (card.release_date || card.first_air_date || '').slice(0,4);
                    window.ai_active_controller = Lampa.Controller.enabled().name;
                    updateStatus('Підготовка переказу');
                    var p = 'Provide a 10-point brief recap in Ukrainian of "' + item.title + '" from the franchise "' + t + '" (' + year + '). Respond ONLY with a valid JSON array: [{"point":".."}]. No markdown, no intro text.';
                    _this.askGemini(p, function(text) {
                        hideStatus();
                        if (Lampa.Activity.active().component !== 'full') return;
                        var data = parseJsonSafe(text);
                        if (!data) { Lampa.Noty.show('Помилка обробки результату'); if (window.ai_active_controller) Lampa.Controller.toggle(window.ai_active_controller); return; }
                        var html = (data || []).map(function(i){ return '<div style="margin-bottom:10px">• '+i.point+'</div>'; }).join('');
                        _this.showViewer('Переказ: ' + item.title, html, btn, render, ctrl);
                    }, function() { hideStatus(); }, false, true);
                },
                onBack: function() { _this.openAiMenu(card, btn, render, ctrl); }
            });
        };

        this.actionRecommendations = function(card, btn, render, ctrl) {
            if (!_this.checkApiKey(btn, render, ctrl)) return;
            var limit = Lampa.Storage.get('ai_result_count', '20'), t = card.original_title || card.original_name, year = (card.release_date || card.first_air_date || '').slice(0,4);
            window.ai_active_controller = ctrl || Lampa.Controller.enabled().name;
            updateStatus('Аналіз фільму');
            _this.getTMDBDetails(card, function(tmdb) {
                var p = 'Suggest strictly ' + limit + ' movies or TV series that closely match the vibe, genre, and plot of "' + t + '" (' + year + ') with ' + tmdb.leadActor + ' in the lead role and the following plot description: "' + tmdb.overview + '".';
                _this.fetchList(p, 'Рекомендації', card, btn, render, ctrl);
            });
        };

        this.actionTags = function(card, btn, render, ctrl) {
            if (!_this.checkApiKey(btn, render, ctrl)) return;
            if (card.translated_tags && card.translated_tags.length > 0) _this.showTagsMenu(card.translated_tags, card, btn, render, ctrl);
            else _this.restoreFocus(ctrl);
        };

        this.translateTags = function (tags, callback) {
            var lang = Lampa.Storage.get('language', 'uk');
            tags.forEach(function(tag) { tag.orig_name = tag.name; });
            if (lang !== 'uk') return callback(tags);
            var tagsWithContext = tags.map(function(t) { return "Movie tag: " + t.name; });
            var url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=uk&dt=t&q=' + encodeURIComponent(tagsWithContext.join(' ||| '));
            $.ajax({
                url: url, dataType: 'json',
                success: function (result) {
                    try {
                        var translatedText = '';
                        if (result && result[0]) result[0].forEach(function(item) { if (item[0]) translatedText += item[0]; });
                        var translatedArray = translatedText.split('|||');
                        tags.forEach(function(tag, index) {
                            if (translatedArray[index]) {
                                tag.name = translatedArray[index].replace(/позначка до фільму[:\s]*/gi, '').replace(/тег до фільму[:\s]*/gi, '').replace(/тег фільму[:\s]*/gi, '').replace(/movie tag[:\s]*/gi, '').replace(/^[:\s\-]*/, '').trim();
                            }
                        });
                        callback(tags);
                    } catch (e) { callback(tags); }
                }, error: function () { callback(tags); }
            });
        };

        this.showTagsMenu = function(tags, card, btn, render, ctrl) {
            var items = tags.map(function(tag) { return { title: tag.name.charAt(0).toUpperCase() + tag.name.slice(1), tag_data: tag }; });
            Lampa.Select.show({
                title: 'Оберіть тег', items: items,
                onSelect: function (item) {
                    var limit = Lampa.Storage.get('ai_result_count', '20');
                    var p = 'Suggest strictly ' + limit + ' movies or TV series that are strongly associated with the specific TMDB keyword: "' + item.tag_data.orig_name + '".';
                    _this.fetchList(p, 'Тег: ' + item.title, card, btn, render, ctrl);
                },
                onBack: function () { _this.openAiMenu(card, btn, render, ctrl); }
            });
        };

        this.askGemini = function(p, onSuccess, onError, isSilent, useSearch) {
            var rawValue = Lampa.Storage.get(STORAGE_KEY, '');
            if (!rawValue) {
                if (!isSilent) Lampa.Noty.show('ШІ спить 😴 Додайте API ключ у налаштуваннях, щоб розбудити його');
                if (onError) onError(); return;
            }
            var keys = rawValue.split(',').map(function(k) { return k.trim(); }).filter(Boolean);
            var primaryModel = Lampa.Storage.get('ai_model', 'gemini-2.5-flash');
            var fallbackMode = Lampa.Storage.get('ai_fallback_mode', 'off');
            var fallbackList = Lampa.Storage.get('ai_fallback_list', []);
            var fallbackChecked = Lampa.Storage.get('ai_fallback_checked', []);
            var requestQueue = [];

            keys.forEach(function(k) { requestQueue.push({ model: primaryModel, key: k }); });

            if (fallbackMode !== 'off') {
                var modelsToAdd = [];
                if (fallbackMode === 'all') {
                    fallbackList.forEach(function(mId) { if (mId !== primaryModel && AI_MODELS_LIST.find(function(am){return am.id === mId})) modelsToAdd.push(mId); });
                    AI_MODELS_LIST.forEach(function(m) { if (m.id !== primaryModel && modelsToAdd.indexOf(m.id) === -1) modelsToAdd.push(m.id); });
                } else if (fallbackMode === 'custom') {
                    fallbackList.forEach(function(mId) { if (mId !== primaryModel && fallbackChecked.indexOf(mId) !== -1) modelsToAdd.push(mId); });
                }
                modelsToAdd.forEach(function(modelId) { keys.forEach(function(k) { requestQueue.push({ model: modelId, key: k }); }); });
            }

            var attemptRequest = function(queueIndex) {
                if (queueIndex >= requestQueue.length) {
                    if (!isSilent) { hideStatus(); Lampa.Noty.show('Сервіс недоступний або ліміти вичерпано'); _this.restoreFocus(window.ai_active_controller); }
                    if (onError) onError('All attempts failed');
                    return;
                }
                var task = requestQueue[queueIndex];
                var payload = { contents: [{ parts: [{ text: p }] }] };
                if (useSearch && task.model.indexOf('gemini') === 0 && task.model.indexOf('gemini-3') === -1) payload.tools = [{ googleSearch: {} }];

                fetch('https://generativelanguage.googleapis.com/v1beta/models/' + task.model + ':generateContent?key=' + task.key, {
                    method: "POST", body: JSON.stringify(payload)
                }).then(function(r) { return r.json().then(function(json) { return { status: r.status, ok: r.ok, data: json }; }); }).then(function(res) {
                    if (res.status === 429 || res.status === 503) return attemptRequest(queueIndex + 1);
                    if (!res.ok) throw new Error(res.data.error ? res.data.error.message : 'Unknown error');
                    if (res.data.candidates && res.data.candidates[0].content) {
                        var fullText = res.data.candidates[0].content.parts.map(function(part) { return part.text || ""; }).join("\n");
                        onSuccess(fullText);
                    } else throw new Error('Empty response');
                }).catch(function(e) { return attemptRequest(queueIndex + 1); });
            };
            attemptRequest(0);
        };

        this.showFallbackSelector = function() {
            var primaryModel = Lampa.Storage.get('ai_model', 'gemini-2.5-flash');
            var mode = Lampa.Storage.get('ai_fallback_mode', 'off');
            var savedList = Lampa.Storage.get('ai_fallback_list', []);
            var savedChecked = Lampa.Storage.get('ai_fallback_checked', []);
            var availableModels = AI_MODELS_LIST.filter(function(m) { return m.id !== primaryModel; });
            var workingList = [];
            savedList.forEach(function(savedId) {
                var found = availableModels.find(function(m) { return m.id === savedId; });
                if (found) workingList.push({ id: found.id, name: found.name, checked: (mode === 'all' || (mode === 'custom' && savedChecked.indexOf(found.id) !== -1)) });
            });
            availableModels.forEach(function(m) {
                if (!workingList.find(function(w) { return w.id === m.id; })) workingList.push({ id: m.id, name: m.name, checked: mode === 'all' });
            });

            var listContainer = $('<div class="menu-edit-list ai-fallback-list" style="padding-bottom:10px;"></div>');
            var svgUp = '<svg width="16" height="10" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 12L11 3L20 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>';
            var svgDown = '<svg width="16" height="10" viewBox="0 0 22 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2L11 11L20 2" stroke="currentColor" stroke-width="4" stroke-linecap="round"/></svg>';
            var svgCheck = '<svg width="22" height="22" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.89111" y="1.78369" width="21.793" height="21.793" rx="3.5" stroke="currentColor" stroke-width="3"/><path d="M7.44873 12.9658L10.8179 16.3349L18.1269 9.02588" stroke="currentColor" stroke-width="3" class="dot" stroke-linecap="round"/></svg>';
            var svgRadioOn = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="5" fill="currentColor"/></svg>';
            var svgRadioOff = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>';
            
            var topControls = $('<div style="display:flex; justify-content:space-around; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1);">' +
                '<div class="fallback-ctrl-btn selector" data-action="off" style="padding: 8px 15px; border-radius: 8px; display:flex; align-items:center; gap:8px;"></div>' +
                '<div class="fallback-ctrl-btn selector" data-action="all" style="padding: 8px 15px; border-radius: 8px; display:flex; align-items:center; gap:8px;"></div>' +
                '</div>');
            listContainer.append(topControls);
            var modelsContainer = $('<div></div>');
            listContainer.append(modelsContainer);

            function updateUIState() {
                var isOff = mode === 'off', isAll = mode === 'all';
                topControls.find('[data-action="off"]').html((isOff?svgRadioOn:svgRadioOff) + ' Вимкнути').css('color', isOff?'#f55':'');
                topControls.find('[data-action="all"]').html((isAll?svgRadioOn:svgRadioOff) + ' Всі').css('color', isAll?'#4b5':'');
                modelsContainer.find('.source-item').each(function() {
                    var id = $(this).attr('data-id'), itm = workingList.find(function(w){return w.id===id;});
                    if (isOff) itm.checked = false; else if (isAll) itm.checked = true;
                    $(this).find('.dot').attr('opacity', itm.checked ? 1 : 0);
                    $(this).find('.source-name').css('opacity', itm.checked ? '1' : '0.4');
                });
                updateArrowsState();
            }

            function updateArrowsState() {
                var items = modelsContainer.find('.source-item');
                items.each(function(idx) {
                    $(this).find('.move-up').css('opacity', idx === 0 ? '0.2' : '1');
                    $(this).find('.move-down').css('opacity', idx === items.length - 1 ? '0.2' : '1');
                });
            }

            topControls.find('[data-action="off"]').on('hover:enter', function() { mode = 'off'; updateUIState(); });
            topControls.find('[data-action="all"]').on('hover:enter', function() { mode = 'all'; updateUIState(); });

            workingList.forEach(function(src) {
                var itemSort = $('<div class="source-item" data-id="' + src.id + '" style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; border-bottom:1px solid rgba(255,255,255,0.05);">' +
                    '<div class="source-name" style="font-size:15px; opacity: ' + (src.checked ? '1' : '0.4') + ';">' + src.name + '</div>' +
                    '<div style="display:flex; gap:8px; align-items:center;">' +
                    '<div class="move-up selector" style="padding:6px; border-radius:6px; display:flex; align-items:center;">' + svgUp + '</div>' +
                    '<div class="move-down selector" style="padding:6px; border-radius:6px; display:flex; align-items:center;">' + svgDown + '</div>' +
                    '<div class="toggle selector" style="padding:4px; border-radius:6px; margin-left:5px; display:flex; align-items:center;">' + svgCheck + '</div>' +
                    '</div></div>');
                itemSort.find('.dot').attr('opacity', src.checked ? 1 : 0);
                itemSort.find('.move-up').on('hover:enter', function() { var p = itemSort.prev(); if(p.length){ itemSort.insertBefore(p); updateArrowsState(); }});
                itemSort.find('.move-down').on('hover:enter', function() { var n = itemSort.next(); if(n.length){ itemSort.insertAfter(n); updateArrowsState(); }});
                itemSort.find('.toggle').on('hover:enter', function() {
                    src.checked = !src.checked;
                    if (src.checked) { var allChecked = workingList.every(function(w){return w.checked;}); mode = allChecked ? 'all' : 'custom'; }
                    else { var noneChecked = workingList.every(function(w){return !w.checked;}); mode = noneChecked ? 'off' : 'custom'; }
                    updateUIState();
                });
                modelsContainer.append(itemSort);
            });
            updateUIState();

            Lampa.Modal.open({
                title: 'Автоперемикання моделей', html: listContainer, size: 'small', scroll_to_center: true,
                onBack: function() {
                    var finalOrder = [], finalSavedChecked = [];
                    modelsContainer.find('.source-item').each(function() {
                        var id = $(this).attr('data-id'), s = workingList.find(function(x) { return x.id === id; });
                        if (s) { finalOrder.push(s.id); if (s.checked) finalSavedChecked.push(s.id); }
                    });
                    if (mode === 'all') Lampa.Storage.set('ai_fallback_mode', 'all');
                    else if (mode === 'off') Lampa.Storage.set('ai_fallback_mode', 'off');
                    else Lampa.Storage.set('ai_fallback_mode', finalSavedChecked.length > 0 ? 'custom' : 'off');
                    Lampa.Storage.set('ai_fallback_list', finalOrder);
                    Lampa.Storage.set('ai_fallback_checked', finalSavedChecked);
                    Lampa.Modal.close();
                    Lampa.Controller.toggle('settings_component');
                }
            });
        };

        this.processAiList = function(list, callback) {
            var results = [], processed = 0;
            if (!window.ai_pagination.exclude_ids) window.ai_pagination.exclude_ids = [];
            if (!list || !list.length) return callback(results);
            list.forEach(function(item) {
                var q = encodeURIComponent(item.orig || item.uk);
                Lampa.Network.silent(Lampa.TMDB.api('search/multi?query=' + q + '&api_key=' + Lampa.TMDB.key() + '&language=uk-UA'), function(res) {
                    processed++;
                    if (res.results && res.results[0]) {
                        var b = res.results[0];
                        if (b.media_type !== 'person' && window.ai_pagination.exclude_ids.indexOf(b.id) === -1) {
                            window.ai_pagination.exclude_ids.push(b.id);
                            b.source = 'tmdb';
                            results.push(b);
                        }
                    }
                    if (processed === list.length) callback(results);
                });
            });
        };

        this.fetchNextPageData = function(callback, isSilent) {
            var limit = Lampa.Storage.get('ai_result_count', '20');
            var exclusions = window.ai_pagination.exclude_list.slice(-50).join(', ');
            var p = window.ai_pagination.base_prompt + ' IMPORTANT: You MUST EXCLUDE these titles from your suggestions: ' + exclusions + '. Provide strictly NEW ' + limit + ' suggestions. Respond ONLY with a valid JSON array: [{"uk":"Назва","orig":"Original Title","year":Year}]. No markdown, no intro text.';
            _this.askGemini(p, function(text) {
                var list = parseJsonSafe(text);
                if (!list || !list.length) { callback(null, null); return; }
                _this.processAiList(list, function(results) { callback(list, results); });
            }, function() { callback(null, null); }, isSilent);
        };

        this.preloadNextPage = function() {
            if (window.ai_pagination.is_preloading) return;
            window.ai_pagination.is_preloading = true;
            _this.fetchNextPageData(function(list, results) {
                if (results && results.length) { window.ai_pagination.preloaded_results = results; window.ai_pagination.preloaded_raw_list = list; }
                window.ai_pagination.is_preloading = false;
            }, true);
        };

        this.loadMore = function(activeActivity) {
            if (window.ai_pagination.is_loading) return;
            window.ai_active_controller = Lampa.Controller.enabled().name;
            var renderResults = function(results, rawList) {
                rawList.forEach(function(i) { window.ai_pagination.exclude_list.push(i.orig || i.uk); });
                window.ai_pagination.preloaded_results = null; window.ai_pagination.preloaded_raw_list = null; window.ai_pagination.is_loading = false;
                hideStatus();
                if (!results.length) { Lampa.Noty.show('Більше нічого не знайдено'); if (window.ai_active_controller) Lampa.Controller.toggle(window.ai_active_controller); return; }
                window.ai_cached_results = window.ai_cached_results.filter(function(r) { return !r.is_load_more; });
                window.ai_cached_results = window.ai_cached_results.concat(results);
                window.ai_cached_results.push({ id: 'ai_load_more', is_load_more: true, name: '', poster: 'https://bodya-elven.github.io/different/icons/more.webp', img: 'https://bodya-elven.github.io/different/icons/more.webp' });
                if (activeActivity && activeActivity.activity) {
                    var act = activeActivity.activity; var rnder = act.render();
                    var oldBtn = rnder.find('.item[data-id="ai_load_more"]'); if (oldBtn.length) oldBtn.remove();
                    var items_to_append = results.slice(); items_to_append.push({ id: 'ai_load_more', is_load_more: true, name: '', poster: 'https://bodya-elven.github.io/different/icons/more.webp', img: 'https://bodya-elven.github.io/different/icons/more.webp' });
                    if (act.append) {
                        act.append(items_to_append);
                        setTimeout(function() {
                            var cardToFocus = rnder.find('.item[data-id="' + results[0].id + '"]');
                            if (cardToFocus.length) Lampa.Controller.collectionFocus(cardToFocus[0], rnder[0]);
                        }, 100);
                    } else Lampa.Activity.replace({ url: 'ai_assistant_list', title: activeActivity.title, component: 'category_full', source: 'ai_assistant_list', page: 1 });
                }
                setTimeout(function() { _this.preloadNextPage(); }, 1000);
            };
            if (window.ai_pagination.preloaded_results) {
                window.ai_pagination.is_loading = true; renderResults(window.ai_pagination.preloaded_results, window.ai_pagination.preloaded_raw_list);
            } else if (window.ai_pagination.is_preloading) {
                window.ai_pagination.is_loading = true; updateStatus('Підбір результатів...');
                var waitInterval = setInterval(function() {
                    if (window.ai_pagination.preloaded_results) { clearInterval(waitInterval); renderResults(window.ai_pagination.preloaded_results, window.ai_pagination.preloaded_raw_list); }
                    else if (!window.ai_pagination.is_preloading) { clearInterval(waitInterval); window.ai_pagination.is_loading = false; hideStatus(); Lampa.Noty.show('Помилка підбору, спробуйте ще'); if (window.ai_active_controller) Lampa.Controller.toggle(window.ai_active_controller); }
                }, 500);
            } else {
                window.ai_pagination.is_loading = true; updateStatus('Підбір результатів...');
                _this.fetchNextPageData(function(list, results) {
                    if(results && results.length) renderResults(results, list);
                    else { window.ai_pagination.is_loading = false; hideStatus(); Lampa.Noty.show('Нічого не знайдено'); if (window.ai_active_controller) Lampa.Controller.toggle(window.ai_active_controller); }
                }, false);
            }
        };

        this.fetchList = function(base_prompt_task, title, card, btn, render, ctrl) {
            window.ai_pagination = { base_prompt: base_prompt_task, exclude_list: [], exclude_ids: [], preloaded_results: null, preloaded_raw_list: null, is_loading: false, is_preloading: false };
            window.ai_cached_results = []; window.ai_active_controller = ctrl || Lampa.Controller.enabled().name;
            var full_prompt = base_prompt_task + ' Respond ONLY with a valid JSON array: [{"uk":"Назва","orig":"Original Title","year":Year}]. No markdown, no intro text.';
            updateStatus('Підбір результатів');
            _this.askGemini(full_prompt, function(text) {
                var list = parseJsonSafe(text);
                if (Lampa.Activity.active().component !== 'full') { hideStatus(); return; }
                if (!list || !list.length) { hideStatus(); Lampa.Noty.show('Нічого не знайдено або помилка парсингу'); if (window.ai_active_controller) Lampa.Controller.toggle(window.ai_active_controller); return; }
                list.forEach(function(i) { window.ai_pagination.exclude_list.push(i.orig || i.uk); });
                _this.processAiList(list, function(results) {
                    hideStatus();
                    if (Lampa.Activity.active().component !== 'full') return;
                    if (!results.length) { Lampa.Noty.show('Нічого не знайдено'); if (window.ai_active_controller) Lampa.Controller.toggle(window.ai_active_controller); return; }
                    window.ai_cached_results = results; window.ai_cached_results.push({ id: 'ai_load_more', is_load_more: true, name: '', poster: 'https://bodya-elven.github.io/different/icons/more.webp', img: 'https://bodya-elven.github.io/different/icons/more.webp' });
                    Lampa.Activity.push({ url: 'ai_assistant_list', title: title, component: 'category_full', source: 'ai_assistant_list', page: 1 });
                    setTimeout(function() { _this.preloadNextPage(); }, 1000);
                });
            }, null, false);
        };

        this.checkApiKey = function(btn, render, ctrl) {
            var rawValue = Lampa.Storage.get(STORAGE_KEY, '');
            if (!rawValue) {
                Lampa.Noty.show('ШІ спить 😴 Додайте API ключ у налаштуваннях, щоб розбудити його');
                if (btn && render) _this.restoreFocus(btn, render, ctrl);
                return false;
            }
            return true;
        };
    }


    // === RANDOM ДЖЕРЕЛО ===
    var NativeRandomSource = {
        list: function(params, oncomplite, onerror) {
            var type = params.url || 'movie'; 
            var minRate = parseFloat(Lampa.Storage.get('ai_min_rating', '6')); 
            var yearLimit = parseInt(Lampa.Storage.get('ai_year_limit', '0'));
            var excludeCountries = Lampa.Storage.get('ai_exclude_countries_list', '');
            var excludeList = excludeCountries ? excludeCountries.split(',') : [];
            
            if (params.page === 1) {
                window.plugin_ai_session_ids.clear();
                var yearText = '';
                if (yearLimit > 0) {
                    if (yearLimit === 2020) yearText = ' (2020+)';
                    else yearText = ' (' + yearLimit + '-' + (yearLimit + 9) + ')';
                }
                var rateText = minRate > 0 ? ' (Рейтинг > ' + minRate + ')' : '';
                var exclText = excludeCountries ? ' (Без ' + excludeCountries + ')' : '';
                updateStatus('🎲 Шукаю' + yearText + rateText + exclText + '...');
            }

            var endpoint = 'movie'; 
            var query = [];

            if (type === 'movie') { endpoint = 'movie'; query.push('without_genres=16'); } 
            else if (type === 'tv') { endpoint = 'tv'; query.push('without_genres=16'); }
            else if (type === 'cartoon') { endpoint = 'movie'; query.push('with_genres=16'); }
            else if (type === 'anime') { endpoint = 'tv'; query.push('with_genres=16'); query.push('with_original_language=ja'); }

            if (yearLimit > 0) {
                var dateField = (endpoint === 'movie') ? 'primary_release_date' : 'first_air_date';
                query.push(dateField + '.gte=' + yearLimit + '-01-01');
                if (yearLimit < 2020) {
                    var endYear = yearLimit + 9;
                    query.push(dateField + '.lte=' + endYear + '-12-31');
                }
            }

            if (minRate > 0) { query.push("vote_average.gte=" + minRate); query.push("vote_count.gte=50"); } else { query.push("vote_count.gte=20"); }
            if (excludeCountries) { query.push('without_origin_country=' + excludeCountries); }
            query.push('include_adult=true');

            var baseQuery = "&" + query.join('&');
            var accumulatedCards = [];
            var attempts = 0, MAX_ATTEMPTS = 20, maxPage = 100; 
            
            if (type === 'anime') maxPage = 20; 
            if (yearLimit > 0 && yearLimit < 2020) maxPage = 50; 
            if (yearLimit >= 2020) maxPage = 30; 

            var usedPagesInBatch = []; 

            function fetchBatch() {
                attempts++;
                var randomPage, safeLoop = 0;
                do { randomPage = Math.floor(Math.random() * maxPage) + 1; safeLoop++; } while (usedPagesInBatch.indexOf(randomPage) !== -1 && safeLoop < 20);
                usedPagesInBatch.push(randomPage);

                var url = "discover/" + endpoint + "?api_key=" + Lampa.TMDB.key() + "&language=uk-UA&sort_by=popularity.desc&page=" + randomPage + baseQuery;

                Lampa.Network.silent(Lampa.TMDB.api(url), function(data) {
                    if (data && data.total_pages) {
                        var actualMaxPage = Math.min(data.total_pages, 500); 
                        if (actualMaxPage < maxPage) { maxPage = actualMaxPage; if (randomPage > maxPage) return fetchBatch(); }
                    }

                    if (data && data.results) {
                        data.results.forEach(function(item) {
                            if (type === 'cartoon' && item.original_language === 'ja') return;
                            if (window.plugin_ai_session_ids.has(item.id)) return;
                            if (excludeList.length > 0 && item.origin_country && item.origin_country.length) {
                                var skipCard = false;
                                for (var i = 0; i < item.origin_country.length; i++) {
                                    if (excludeList.indexOf(item.origin_country[i].toUpperCase()) !== -1) { skipCard = true; break; }
                                }
                                if (skipCard) return; 
                            }
                            var card = buildSafeCard(item, type);
                            if (card) { window.plugin_ai_session_ids.add(item.id); accumulatedCards.push(card); }
                        });
                    }

                    if (accumulatedCards.length >= 20 || attempts >= MAX_ATTEMPTS) {
                        hideStatus();
                        if (accumulatedCards.length === 0) oncomplite({ results: [], title: params.title, page: params.page, total_pages: 1 }); 
                        else oncomplite({ results: accumulatedCards, title: params.title, page: params.page, total_pages: 100 });
                    } else {
                        updateStatus('🎲 Відсіювання (спроба ' + attempts + '/' + MAX_ATTEMPTS + ')... Знайдено: ' + accumulatedCards.length);
                        fetchBatch();
                    }
                }, function() { hideStatus(); oncomplite({ results: accumulatedCards.length ? accumulatedCards : [], title: params.title, page: params.page, total_pages: 1 }); });
            }
            fetchBatch();
        }
    };
    NativeRandomSource.main = NativeRandomSource.list;
    NativeRandomSource.get = NativeRandomSource.list;


    // === AI SEARCH ДЖЕРЕЛО (Використовує Fallback Асистента) ===
    var AiSearchSource = {
        discovery: function () {
            return {
                title: '✨ AI Пошук',
                search: function (params, done) {
                    var q = decodeURIComponent(params.query || '').trim();
                    var limit = parseInt(Lampa.Storage.get('ai_result_count', '20'));
                    var excludeCountries = Lampa.Storage.get('ai_exclude_countries_list', '');
                    
                    if (!q) return done([]);
                    updateStatus('🤖 Думаю над запитом "' + q + '"...');
                    
                    var prompt = 'Act as a movie expert. Suggest ' + limit + ' distinct movies or TV series based on this request: "' + q + '". ' +
                                 'Context: If the query is vague (e.g. "renovation"), interpret it as a plot topic, not just a keyword. Prioritize popular content. ';
                    if (excludeCountries) prompt += 'CRITICAL RULE: DO NOT suggest any movies, series, or content produced in countries with these ISO 3166-1 alpha-2 codes: ' + excludeCountries + '. ';
                    prompt += 'Return strictly a JSON array with no markdown: [{"ru":"Ukrainian Title","orig":"Original Title","year":Year}].';
                    
                    if (window.plugin_ai_assistant_instance) {
                        window.plugin_ai_assistant_instance.askGemini(prompt, function(text) {
                            var list = parseJsonSafe(text);
                            if (!list || !Array.isArray(list)) { hideStatus(); Lampa.Noty.show('AI Помилка формату'); return done([]); }
                            
                            updateStatus('🤖 AI запропонував ' + list.length + ' назв. Шукаємо в TMDB...');
                            var results = [], queue = list, active = 0, processed = 0, totalToProcess = queue.length;

                            function next() {
                                if (!queue.length && active === 0) { 
                                    hideStatus(); 
                                    if (results.length === 0) Lampa.Noty.show('AI щось знайшов, але в TMDB цього немає');
                                    done([{ title: 'AI: '+q, results: results, total: results.length }]); 
                                    return; 
                                }
                                if (!queue.length || active >= 3) return; 
                                var item = queue.shift(); active++;
                                var qTmdb = item.orig || item.original || item.ru;
                                
                                Lampa.Network.silent(Lampa.TMDB.api("search/multi?query=" + encodeURIComponent(qTmdb) + "&api_key=" + Lampa.TMDB.key() + "&language=uk-UA"), function(t) {
                                    processed++; updateStatus('🤖 TMDB: ' + results.length + ' знайдено (' + processed + '/' + totalToProcess + ')');
                                    if(t.results && t.results[0]) {
                                        var best = t.results[0];
                                        if(best.media_type === 'movie' || best.media_type === 'tv') {
                                            var c = buildSafeCard(best, best.media_type);
                                            if(c) results.push(c);
                                        }
                                    }
                                    active--; next();
                                }, function(){ processed++; active--; next(); });
                            }
                            next();
                        }, function() { done([]); }, false, false);
                    } else {
                        hideStatus(); done([]);
                    }
                },
                params: { save: true, lazy: true },
                onSelect: function (p, close) { close(); Lampa.Activity.push({ url: p.element.media_type+'/'+p.element.id, component: 'full', id: p.element.id, method: p.element.media_type, card: p.element, source: 'tmdb' }); }
            };
        }
    };


    // === СТАРТ ТА НАЛАШТУВАННЯ ===
    function startPlugin() {
        window.plugin_ai_search_ready = true;

        // Ініціалізація Асистента
        if (!window.plugin_ai_assistant_instance) {
            window.plugin_ai_assistant_instance = new AIAssistantPlugin();
            window.plugin_ai_assistant_instance.init();
        }

        // Патчі для пагінації (Load More)
        if (!window.ai_push_patched) {
            var originalPush = Lampa.Activity.push;
            Lampa.Activity.push = function(obj) {
                var card = obj.card || obj.movie;
                if (card && card.is_load_more) {
                    if (window.plugin_ai_assistant_instance) window.plugin_ai_assistant_instance.loadMore(Lampa.Activity.active());
                    return;
                }
                originalPush.apply(Lampa.Activity, arguments);
            };
            window.ai_push_patched = true;
        }
        if (window.Lampa && Lampa.Api) {
            Lampa.Api.sources.ai_assistant_list = { list: function(params, oncomplite) { oncomplite({ results: window.ai_cached_results, total_pages: 1 }); } };
        }

        // --- МЕНЮ НАЛАШТУВАНЬ ---
        Lampa.SettingsApi.addComponent({ component: 'ai_search_cfg', name: 'AI Пошук & Асистент', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' });
        
        // 1. API Ключ
        Lampa.SettingsApi.addParam({ component: 'ai_search_cfg', param: { name: 'ai_key_trigger', type: 'trigger' }, field: { name: 'API Ключі (Google Gemini)', description: 'Можна вказати кілька ключів через кому' }, onRender: function(item) {
            var val = Lampa.Storage.get(STORAGE_KEY, '');
            item.find('.settings-param__value').text(val ? 'Встановлено' : 'Немає').css('color', val ? '#4b5':'#f55');
            item.on('hover:enter', function() {
                Lampa.Input.edit({ title: 'Keys', value: val, free: true, nosave: true }, function(v) { 
                    if(v){ Lampa.Storage.set(STORAGE_KEY, v.trim()); item.find('.settings-param__value').text('OK').css('color', '#4b5'); } 
                });
            });
        }});

        // 2. Основна модель
        var modelValues = {};
        AI_MODELS_LIST.forEach(function(m) { modelValues[m.id] = '\u200B' + m.name; });
        var currentPrimaryModel = Lampa.Storage.get('ai_model', 'gemini-2.5-flash');
        Lampa.SettingsApi.addParam({ component: 'ai_search_cfg', param: { name: 'ai_model', type: 'select', values: modelValues, default: 'gemini-2.5-flash' }, field: { name: 'Основна модель ШІ' }, onChange: function(newModel) {
            if (newModel !== currentPrimaryModel) {
                var list = Lampa.Storage.get('ai_fallback_list', []), checked = Lampa.Storage.get('ai_fallback_checked', []);
                var listIdx = list.indexOf(newModel); if (listIdx !== -1) list[listIdx] = currentPrimaryModel; else list.push(currentPrimaryModel);
                var checkedIdx = checked.indexOf(newModel); if (checkedIdx !== -1) checked[checkedIdx] = currentPrimaryModel;
                Lampa.Storage.set('ai_fallback_list', list); Lampa.Storage.set('ai_fallback_checked', checked);
                currentPrimaryModel = newModel;
            }
        }});

        // 3. Автоперемикання
        Lampa.SettingsApi.addParam({ component: 'ai_search_cfg', param: { type: 'button', name: 'ai_fallback_trigger' }, field: { name: 'Автоперемикання моделей', description: 'Резервні моделі у разі вичерпання лімітів або помилок' }, onChange: function() {
            if (window.plugin_ai_assistant_instance) window.plugin_ai_assistant_instance.showFallbackSelector();
        }});

        // 4. Кількість результатів
        Lampa.SettingsApi.addParam({ component: 'ai_search_cfg', param: { name: 'ai_result_count', type: 'select', values: { '10': '10', '20': '20', '30': '30', '50': '50' }, default: '20' }, field: { name: 'Кількість AI результатів' } });
        
        // 5. Виключення країн
        Lampa.SettingsApi.addParam({ component: 'ai_search_cfg', param: { name: 'ai_exclude_countries_btn', type: 'trigger' }, field: { name: 'Виключити країни' }, onRender: function(item) {
            var val = Lampa.Storage.get('ai_exclude_countries_list', '');
            item.find('.settings-param__value').text(val ? val : 'Немає').css('color', val ? '#f55':'#fff');
            item.on('hover:enter', function() {
                function showSelect() {
                    var selected = Lampa.Storage.get('ai_exclude_countries_list', '').split(',').filter(Boolean);
                    var list = [ { title: '🗑️ Очистити вибір', clear: true } ];
                    var available = [
                        { title: 'Росія (RU)', id: 'RU' }, { title: 'СРСР (SU)', id: 'SU' }, { title: 'Індія (IN)', id: 'IN' },
                        { title: 'Китай (CN)', id: 'CN' }, { title: 'Туреччина (TR)', id: 'TR' }, { title: 'Південна Корея (KR)', id: 'KR' },
                        { title: 'Японія (JP)', id: 'JP' }, { title: 'США (US)', id: 'US' }, { title: 'Великобританія (GB)', id: 'GB' },
                        { title: 'Франція (FR)', id: 'FR' }, { title: 'Іспанія (ES)', id: 'ES' }, { title: 'Німеччина (DE)', id: 'DE' }
                    ];
                    available.forEach(function(c) { var isSel = selected.indexOf(c.id) !== -1; list.push({ title: (isSel ? '✅ ' : '⬜ ') + c.title, id: c.id, selected: isSel }); });
                    Lampa.Select.show({
                        title: 'Виключити країни', items: list,
                        onSelect: function (a) {
                            if (a.clear) selected = []; else { if (a.selected) selected = selected.filter(function(s) { return s !== a.id; }); else selected.push(a.id); }
                            var newVal = selected.join(',');
                            Lampa.Storage.set('ai_exclude_countries_list', newVal);
                            item.find('.settings-param__value').text(newVal ? newVal : 'Немає').css('color', newVal ? '#f55':'#fff');
                            setTimeout(showSelect, 50);
                        },
                        onBack: function () { Lampa.Controller.toggle('settings_component'); }
                    });
                }
                showSelect();
            });
        }});
        
        // 6. Мін. рейтинг (Для рандому)
        Lampa.SettingsApi.addParam({ component: 'ai_search_cfg', param: { name: 'ai_min_rating', type: 'select', values: { '0': 'Будь-який', '5': '> 5', '6': '> 6', '7': '> 7', '8': '> 8' }, default: '6' }, field: { name: 'Мін. рейтинг (Random)' } });
        
        // 7. Десятиліття (Для рандому)
        Lampa.SettingsApi.addParam({ component: 'ai_search_cfg', param: { name: 'ai_year_limit', type: 'select', values: { '0': 'Будь-які', '1980': '80-ті (1980-1989)', '1990': '90-ті (1990-1999)', '2000': '2000-ні (2000-2009)', '2010': '2010-ті (2010-2019)', '2020': '2020-ті (2020-...)' }, default: '0' }, field: { name: 'Десятиліття (Random)' } });
        
        // 8. Розмір шрифту (Асистент)
        Lampa.SettingsApi.addParam({ component: 'ai_search_cfg', param: { name: 'ai_font_size', type: 'select', values: { '1.1em':'1.1em','1.2em':'1.2em','1.3em':'1.3em','1.4em':'1.4em','1.5em':'1.5em','1.6em':'1.6em' }, default: '1.2em' }, field: { name: 'Розмір тексту (Асистент)' } });

        // 9. Кнопка вмикання/вимикання самого Асистента
        Lampa.SettingsApi.addParam({ component: 'ai_search_cfg', param: { name: 'ai_show_assistant_btn', type: 'trigger', default: true }, field: { name: 'Кнопка: AI Асистент (у картці фільму)' } });

        // 10. Кнопки меню рандому
        Lampa.SettingsApi.addParam({ component: 'ai_search_cfg', param: { name: 'ai_show_btn_movie', type: 'trigger', default: true }, field: { name: 'Пункт в меню: Випадкові фільми' } });
        Lampa.SettingsApi.addParam({ component: 'ai_search_cfg', param: { name: 'ai_show_btn_tv', type: 'trigger', default: true }, field: { name: 'Пункт в меню: Випадкові серіали' } });
        Lampa.SettingsApi.addParam({ component: 'ai_search_cfg', param: { name: 'ai_show_btn_cartoon', type: 'trigger', default: true }, field: { name: 'Пункт в меню: Випадкові мультфільми' } });
        Lampa.SettingsApi.addParam({ component: 'ai_search_cfg', param: { name: 'ai_show_btn_anime', type: 'trigger', default: true }, field: { name: 'Пункт в меню: Випадкове аніме' } });

        // --- РЕЄСТРАЦІЯ ДЖЕРЕЛ ---
        Lampa.Api.sources.ai_random = NativeRandomSource;
        Lampa.Search.addSource(AiSearchSource.discovery());

        // --- БОКОВЕ МЕНЮ ---
        function addButtons() {
            var list = $('.menu .menu__list').eq(0);
            if (!list.length) return setTimeout(addButtons, 500);

            function btn(type, title, key) {
                if (!Lampa.Storage.get(key, true)) return;
                if (list.find('[data-action="ai_'+type+'"]').length) return;
                var el = $('<li class="menu__item selector" data-action="ai_'+type+'">' + addIcon(type) + '<div class="menu__text">'+title+'</div></li>');
                el.on('hover:enter', function() {
                    Lampa.Activity.push({ url: type, title: title, component: 'category_full', source: 'ai_random', page: 1 });
                });
                list.append(el);
            }

            btn('movie', 'Випадкові фільми', 'ai_show_btn_movie');
            btn('tv', 'Випадкові серіали', 'ai_show_btn_tv');
            btn('cartoon', 'Випадкові мультфільми', 'ai_show_btn_cartoon');
            btn('anime', 'Випадкове аніме', 'ai_show_btn_anime');
        }
        addButtons();
        console.log('AI System: V55 (Toggle Assistant Button) - UA Patched');
    }

    if (!window.plugin_ai_search_ready) {
        if (window.appready) startPlugin();
        else { Lampa.Listener.follow('app', function(e) { if (e.type == 'ready') startPlugin(); }); }
    }
})();