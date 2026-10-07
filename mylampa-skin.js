/* MyLampa skin 0.2.0 — optional theme and editable native-menu shortcuts. */
(function (global) {
    'use strict';
    var VERSION = '0.2.0';
    var COMPONENT = 'mylampa_skin';
    var BUTTONS_KEY = 'mylampa_skin_top_buttons_v1';
    var PREFIX = 'mylampa_skin_';
    var DEFAULT_BUTTONS = [
        { id: 'home', type: 'menu', key: 'action:main', label: '' },
        { id: 'movies', type: 'menu', key: 'action:movie', label: '' },
        { id: 'series', type: 'menu', key: 'action:tv', label: '' },
        { id: 'favorites', type: 'menu', key: 'action:favorite', label: '' }
    ];
    function copy(value) { return JSON.parse(JSON.stringify(value)); }
    function cleanText(value, limit) {
        return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, limit || 100) : '';
    }
    function safeLink(value) {
        value = cleanText(value, 2048);
        if (!/^https?:\/\//i.test(value)) return '';
        try {
            var url = new URL(value);
            return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
        } catch (e) { return ''; }
    }
    function normalizeButtons(value) {
        if (!Array.isArray(value)) return copy(DEFAULT_BUTTONS);
        var seen = {};
        var result = [];
        value.forEach(function (item, index) {
            if (!item || typeof item !== 'object') return;
            var type = item.type === 'link' ? 'link' : 'menu';
            var key = cleanText(item.key, 500);
            var url = type === 'link' ? safeLink(item.url) : '';
            if (type === 'menu' && !key || type === 'link' && !url) return;
            var id = cleanText(item.id, 120) || 'button-' + index;
            while (seen[id]) id += '-copy';
            seen[id] = true;
            result.push({ id: id, type: type, key: key, label: cleanText(item.label), url: url, icon: cleanText(item.icon, 500) });
        });
        return result;
    }
    function editButtons(value, operation, id, data) {
        var result = normalizeButtons(value);
        var index = -1;
        result.forEach(function (entry, i) { if (entry.id === id) index = i; });
        if (operation === 'add') result.push(data);
        if (index >= 0 && operation === 'remove') result.splice(index, 1);
        if (index >= 0 && operation === 'update') {
            Object.keys(data || {}).forEach(function (key) { if (key !== 'id') result[index][key] = data[key]; });
        }
        if (index >= 0 && operation === 'move') {
            var destination = Math.max(0, Math.min(result.length - 1, index + Number(data)));
            result.splice(destination, 0, result.splice(index, 1)[0]);
        }
        return normalizeButtons(result);
    }
    function fingerprint(value) {
        var hash = 2166136261;
        for (var i = 0; i < value.length; i++) hash = ((hash ^ value.charCodeAt(i)) * 16777619) >>> 0;
        return hash.toString(36);
    }

    function featuredQuery(source, type) {
        var media = type === 'movie' || type === 'tv' ? type : 'all';
        return source === 'tmdb' ? 'trending/' + media + '/week' : '?sort=top' + (media !== 'all' ? '&cat=' + media : '');
    }
    function resumeState(card, lastMap, hash, view, watched) {
        var series = !!(card.original_name || card.first_air_date || card.number_of_seasons || card.media_type === 'tv');
        var names = [card.original_title, card.original_name, card.title, card.name].filter(function (name, index, all) { return name && all.indexOf(name) === index; });
        var last = null;
        names.some(function (name) { last = lastMap[hash(name)]; return last && Number(last.episode) > 0; });
        var state = { series: series, season: 0, episode: 0, name: '', hash: '', percent: 0, time: 0, duration: 0, updated: 0 };
        var best = null;
        function consider(key) {
            var road = view(key) || {};
            if (!best || (Number(road.updated) || 0) > (Number(best.updated) || 0) || !Number(best.percent) && Number(road.percent)) {
                best = { hash: key, percent: road.percent, time: road.time, duration: road.duration, updated: road.updated };
            }
        }
        if (series && last && Number(last.episode) > 0) {
            state.season = Number(last.season) || 1;
            state.episode = Number(last.episode);
            state.name = cleanText(last.episode_name || last.name);
            names.forEach(function (name) { consider(hash([state.season, state.season > 10 ? ':' : '', state.episode, name].join(''))); });
        } else if (!series) {
            names.forEach(function (name) { consider(hash(name)); });
        } else if (watched) {
            var list = watched(card, true);
            if (Array.isArray(list) && list.length) {
                list.sort(function (a, b) { return (Number(a.view.updated) || a.ep) - (Number(b.view.updated) || b.ep); });
                var latest = list[list.length - 1];
                state.season = 1;
                state.episode = latest.ep;
                best = latest.view;
            }
        }
        if (best) {
            state.hash = best.hash || '';
            state.time = Math.max(0, Number(best.time) || 0);
            state.duration = Math.max(0, Number(best.duration) || 0);
            state.percent = Math.max(0, Math.min(100, Number(best.percent) || (state.duration ? state.time / state.duration * 100 : 0)));
            state.updated = Number(best.updated) || 0;
        }
        return state;
    }
    function minuteLabel(seconds) {
        var minutes = Math.max(0, Math.floor(Number(seconds) / 60) || 0);
        return minutes >= 60 ? Math.floor(minutes / 60) + ' год ' + minutes % 60 + ' хв' : minutes + ' хв';
    }

    var core = { featuredQuery: featuredQuery, resumeState: resumeState, minuteLabel: minuteLabel, normalizeButtons: normalizeButtons, editButtons: editButtons, safeLink: safeLink, defaults: copy(DEFAULT_BUTTONS) };
    if (typeof module !== 'undefined' && module.exports) module.exports = core;
    if (!global || !global.document) return;
    if (global.MyLampaSkin) return;

    var Lampa;
    var $;
    var ready = false;
    var buttons = [];
    var menu = [];
    var nav;
    var menuObserver;
    var syncTimer;
    var navSignature = '';
    var editorController = 'settings_component';
    var palettes = { blue: '#78a0ff', sky: '#70c5ff', cyan: '#56d5dc', mint: '#91cdbb', emerald: '#67d6a0', lime: '#badb74', amber: '#deb789', gold: '#f1ce73', orange: '#ffb06b', coral: '#ff908c', red: '#ff7c84', pink: '#eda0d4', violet: '#b6a2f5', white: '#dce9f7' };
    var colorOptions = { blue: 'Синій', sky: 'Блакитний', cyan: 'Бірюзовий', mint: "М'ятний", emerald: 'Смарагдовий', lime: 'Лаймовий', amber: 'Теплий', gold: 'Золотий', orange: 'Помаранчевий', coral: 'Кораловий', red: 'Червоний', pink: 'Рожевий', violet: 'Фіолетовий', white: 'Крижаний білий' };
    var highlightColors = { accent: 'Як колір акценту' };
    Object.keys(colorOptions).forEach(function (key) { highlightColors[key] = colorOptions[key]; });
    function colorTint(color, alpha) {
        return 'rgba(' + parseInt(color.slice(1, 3), 16) + ',' + parseInt(color.slice(3, 5), 16) + ',' + parseInt(color.slice(5, 7), 16) + ',' + alpha + ')';
    }
    var definitions = [
        ['enabled', 'trigger', true, 'Увімкнути MyLampa skin'],
        ['accent', 'select', 'blue', 'Акцентний колір', colorOptions],
        ['card_color', 'select', 'accent', 'Колір підсвітки карток', highlightColors],
        ['card_focus', 'select', 'outline_glow', 'Підсвітка карток', { outline: 'Рамка', glow: "М'яке сяйво", outline_glow: 'Рамка та сяйво', double: 'Подвійна рамка' }],
        ['menu_color', 'select', 'accent', 'Колір підсвітки меню', highlightColors],
        ['menu_focus', 'select', 'fill', 'Підсвітка меню та кнопок', { fill: 'Заливка', outline: 'Рамка', glow: 'Сяйво', stripe: 'Акцентна смуга' }],
        ['radius', 'select', '14', 'Заокруглення карток', { '0': 'Без заокруглення', '8': 'Невелике', '14': 'Помірне', '20': 'Велике' }],
        ['sidebar', 'select', 'rail', 'Бічне меню', { rail: 'Іконки, підписи при відкритті', expanded: 'Іконки та підписи' }],
        ['hero', 'trigger', true, 'В центрі уваги'],
        ['hero_type', 'select', 'all', 'Добірка в банері', { all: 'Фільми та серіали', movie: 'Фільми', tv: 'Серіали' }],
        ['hero_interval', 'select', '15', 'Зміна банера', { '0': 'Лише вручну', '15': 'Кожні 15 секунд', '30': 'Кожні 30 секунд' }],
        ['resume', 'trigger', true, 'Продовжити перегляд'],
        ['clock', 'trigger', true, 'Годинник, дата й день тижня'],
        ['button_icons', 'trigger', true, 'Іконки верхніх кнопок']
    ];
    function setting(name, fallback) {
        if (typeof fallback === 'boolean') {
            // Storage.get can replace a cached boolean false with its fallback.
            // Read the serialized value so switching the theme off stays reliable.
            var stored = Lampa.Storage.value(PREFIX + name);
            if (stored === '' || stored === null || typeof stored === 'undefined') return fallback;
            return stored !== false && stored !== 'false' && stored !== 0 && stored !== '0';
        }
        return Lampa.Storage.get(PREFIX + name, fallback);
    }
    function loadButtons() { buttons = normalizeButtons(Lampa.Storage.get(BUTTONS_KEY, null)); }
    function saveButtons(next) {
        buttons = normalizeButtons(next);
        Lampa.Storage.set(BUTTONS_KEY, buttons);
        renderNavigation();
        resizeHeader();
    }
    function notify(text) { if (Lampa.Noty) Lampa.Noty.show(text); }
    function collectMenu() {
        var found = [];
        var counts = {};
        $('.menu .menu__item').each(function () {
            var element = $(this);
            var title = cleanText(element.find('.menu__text').text()) || cleanText(element.text());
            var action = element.attr('data-action');
            var component = element.attr('data-component');
            var base = action ? 'action:' + action : component ? 'component:' + component : 'custom:' + fingerprint(title + '|' + (element.attr('href') || ''));
            counts[base] = (counts[base] || 0) + 1;
            var key = base + (counts[base] > 1 ? ':' + counts[base] : '');
            found.push({ key: key, title: title || action || component || 'Пункт меню', element: element, hidden: element.hasClass('hide') || element.hasClass('hidden') });
        });
        menu = found;
        return found;
    }
    function findMenu(key) {
        for (var i = 0; i < menu.length; i++) if (menu[i].key === key) return menu[i];
        return null;
    }
    function titleFor(entry) {
        var item = findMenu(entry.key);
        return entry.label || (entry.type === 'link' ? 'Посилання' : item ? item.title : 'Пункт тимчасово недоступний');
    }
    function activeKey() {
        var activity = Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active();
        if (!activity) return '';
        var object = activity.object || activity;
        if (object.component === 'main') return 'action:main';
        if (object.component === 'category' && object.url === 'movie') return String(object.genres) === '16' ? 'action:cartoon' : 'action:movie';
        if (object.component === 'category' && object.url === 'tv') return 'action:tv';
        if (object.component === 'bookmarks') return 'action:favorite';
        if (object.component === 'favorite') return object.type === 'history' ? 'action:history' : 'action:favorite';
        return 'action:' + (object.component || '');
    }
    function resizeHeader() {
        if (!ready || !setting('enabled', true)) return;
        var head = Lampa.Head.render()[0];
        if (head) document.documentElement.style.setProperty('--mls-head-height', Math.ceil(head.getBoundingClientRect().height) + 'px');
    }
    function updateActive() {
        if (!nav) return;
        var key = activeKey();
        nav.find('.mls-top-button').each(function () {
            var selected = $(this).attr('data-mls-key') === key;
            $(this).toggleClass('mls-current', selected).attr('aria-current', selected ? 'page' : 'false');
        });
    }
    function triggerEntry(id) {
        collectMenu();
        var entry = buttons.filter(function (item) { return item.id === id; })[0];
        if (!entry) return;
        if (entry.type === 'link') {
            var url = safeLink(entry.url);
            if (url) global.open(url, '_blank', 'noopener,noreferrer');
            return;
        }
        var target = findMenu(entry.key);
        if (!target) { notify('Цей пункт меню ще не завантажений. Налаштування кнопки збережено.'); return; }
        // Retain the original native/plugin action, including delegated menu handlers.
        target.element.trigger('hover:enter');
    }
    function renderNavigation() {
        if (!ready) return;
        var focusedId = nav && nav.find('.mls-top-button.focus').attr('data-mls-id');
        collectMenu();
        var enabled = setting('enabled', true);
        $('.menu .menu__item').removeClass('mls-promoted');
        if (!enabled) {
            if (nav) { nav.remove(); nav = null; }
            navSignature = '';
            if (Lampa.Controller.enabled().name === 'head') Lampa.Controller.toggle('head');
            return;
        }
        buttons.forEach(function (entry) {
            var target = entry.type === 'menu' ? findMenu(entry.key) : null;
            if (target && entry.key !== 'action:settings') target.element.addClass('mls-promoted');
        });
        var signature = JSON.stringify(buttons.map(function (entry) {
            var item = findMenu(entry.key);
            var iconItem = findMenu(entry.icon) || item || findMenu('action:catalog');
            return [entry.id, entry.type, entry.key, entry.url, titleFor(entry), !!item, iconItem && iconItem.element.find('.menu__ico').html()];
        }));
        if (nav && nav[0].isConnected !== false && signature === navSignature) { updateActive(); return; }
        navSignature = signature;
        if (nav) nav.remove();
        nav = $('<div class="mls-top-nav" role="navigation" aria-label="Верхні розділи"></div>');
        buttons.forEach(function (entry) {
            var title = titleFor(entry);
            var target = findMenu(entry.key);
            var iconItem = findMenu(entry.icon) || target || findMenu('action:catalog');
            var button = $('<div class="head__action selector mls-top-button" role="button"></div>');
            button.attr('data-mls-id', entry.id).attr('data-mls-key', entry.key).attr('aria-label', title).attr('title', title);
            if (entry.type === 'menu' && !target) button.addClass('mls-unavailable').attr('aria-disabled', 'true');
            if (iconItem) button.append(iconItem.element.find('.menu__ico').clone(false).addClass('mls-top-icon'));
            button.append($('<span class="mls-top-label"></span>').text(title));
            button.on('hover:enter', function () { triggerEntry(entry.id); });
            nav.append(button);
        });
        Lampa.Head.addElement(nav);
        updateActive();
        if (Lampa.Controller.enabled().name === 'head') {
            // Refresh the remote-control collection when late plugins change the bar.
            Lampa.Controller.toggle('head');
            if (focusedId) {
                var focused = nav.find('.mls-top-button').filter(function () { return $(this).attr('data-mls-id') === focusedId; });
                if (focused.length) Lampa.Controller.collectionFocus(focused, Lampa.Head.render(), true);
            }
        }
    }
    function applyAppearance() {
        if (!ready) return;
        var enabled = setting('enabled', true);
        var body = $('body');
        body.toggleClass('mls-enabled', enabled);
        body.removeClass('mls-compact');
        body.toggleClass('mls-wide-sidebar', enabled && setting('sidebar', 'rail') === 'expanded');
        body.toggleClass('mls-no-clock', enabled && !setting('clock', true));
        body.toggleClass('mls-no-button-icons', enabled && !setting('button_icons', true));
        var accent = palettes[setting('accent', 'blue')] || palettes.blue;
        var radius = ['0', '8', '14', '20'].indexOf(String(setting('radius', '14'))) >= 0 ? setting('radius', '14') : '14';
        var cardColor = palettes[setting('card_color', 'accent')] || accent;
        var menuColor = palettes[setting('menu_color', 'accent')] || accent;
        var cardFocus = setting('card_focus', 'outline_glow');
        var menuFocus = setting('menu_focus', 'fill');
        var cardShadows = {
            outline: '0 0 0 .16em ' + cardColor,
            glow: '0 0 0 .08em ' + cardColor + ',0 0 1.3em ' + colorTint(cardColor, .7),
            outline_glow: '0 0 0 .16em ' + cardColor + ',0 0 1.3em ' + colorTint(cardColor, .4),
            double: '0 0 0 .12em #0c111b,0 0 0 .28em ' + cardColor + ',0 0 0 .4em ' + colorTint(cardColor, .28)
        };
        var menuShadows = {
            fill: 'none',
            outline: 'inset 0 0 0 2px ' + menuColor,
            glow: 'inset 0 0 0 1px ' + menuColor + ',0 0 .9em ' + colorTint(menuColor, .5),
            stripe: 'inset 3px 0 0 ' + menuColor
        };
        body.attr('data-mls-card-focus', cardShadows[cardFocus] ? cardFocus : 'outline_glow');
        body.attr('data-mls-menu-focus', menuShadows[menuFocus] ? menuFocus : 'fill');
        var rootStyle = document.documentElement.style;
        rootStyle.setProperty('--mls-accent', accent);
        rootStyle.setProperty('--mls-card-color', cardColor);
        rootStyle.setProperty('--mls-card-shadow', cardShadows[cardFocus] || cardShadows.outline_glow);
        rootStyle.setProperty('--mls-menu-color', menuColor);
        rootStyle.setProperty('--mls-menu-soft', colorTint(menuColor, .14));
        rootStyle.setProperty('--mls-menu-bg', menuFocus === 'fill' ? menuColor : colorTint(menuColor, .14));
        rootStyle.setProperty('--mls-menu-text', menuFocus === 'fill' ? '#0c1630' : '#f3f6fd');
        rootStyle.setProperty('--mls-menu-shadow', menuShadows[menuFocus] || menuShadows.fill);
        document.documentElement.style.setProperty('--mls-radius', radius + 'px');
        renderNavigation();
        resizeHeader();
        syncHome(false);
    }
    function returnToSettings() { Lampa.Controller.toggle(editorController); }
    function showPicker(title, items, onSelect, onBack) {
        Lampa.Select.show({ title: title, items: items, onSelect: onSelect, onBack: onBack || returnToSettings });
    }
    function nextId() { return 'custom-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8); }
    function changeButton(id, operation, data) { saveButtons(editButtons(buttons, operation, id, data)); }
    function chooseMenu(id) {
        collectMenu();
        var current = buttons.filter(function (entry) { return entry.id === id; })[0];
        var items = menu.map(function (entry) {
            return { title: entry.title, subtitle: entry.hidden ? 'Прихований у бічному меню' : '', key: entry.key, selected: !!current && current.key === entry.key };
        });
        showPicker(id ? 'Замінити пункт меню' : 'Додати верхню кнопку', items, function (item) {
            if (id) changeButton(id, 'update', { type: 'menu', key: item.key, url: '' });
            else changeButton('', 'add', { id: nextId(), type: 'menu', key: item.key, label: '' });
            openEditor(false);
        }, function () { openEditor(false); });
    }
    function renameButton(entry) {
        Lampa.Input.edit({ title: 'Назва кнопки', value: entry.label || titleFor(entry), free: true, nosave: true }, function (value) {
            if (typeof value === 'string') changeButton(entry.id, 'update', { label: cleanText(value) });
            openEditor(false);
        });
    }
    function chooseIcon(entry) {
        collectMenu();
        var items = [{ title: 'Автоматично', key: '', selected: !entry.icon }].concat(menu.map(function (item) {
            return { title: item.title, key: item.key, selected: entry.icon === item.key };
        }));
        showPicker('Іконка кнопки', items, function (item) { changeButton(entry.id, 'update', { icon: item.key }); openEditor(false); }, function () { openEditor(false); });
    }
    function editButton(id) {
        var entry = buttons.filter(function (item) { return item.id === id; })[0];
        if (!entry) { openEditor(false); return; }
        var index = buttons.indexOf(entry);
        var items = [
            { title: 'Перейменувати', action: 'rename' },
            { title: 'Замінити пункт меню', action: 'replace' },
            { title: 'Змінити іконку', action: 'icon' },
            { title: 'Стандартна назва', action: 'reset_name' }
        ];
        if (index > 0) items.push({ title: 'Перемістити ліворуч', action: 'left' });
        if (index < buttons.length - 1) items.push({ title: 'Перемістити праворуч', action: 'right' });
        items.push({ title: 'Видалити верхню кнопку', action: 'remove' });
        showPicker(titleFor(entry), items, function (item) {
            if (item.action === 'rename') { renameButton(entry); return; }
            if (item.action === 'replace') { chooseMenu(id); return; }
            if (item.action === 'icon') { chooseIcon(entry); return; }
            if (item.action === 'reset_name') changeButton(id, 'update', { label: '' });
            if (item.action === 'left') changeButton(id, 'move', -1);
            if (item.action === 'right') changeButton(id, 'move', 1);
            if (item.action === 'remove') changeButton(id, 'remove');
            openEditor(false);
        }, function () { openEditor(false); });
    }
    function resetButtons() {
        showPicker('Відновити верхні кнопки?', [{ title: 'Відновити', reset: true }, { title: 'Скасувати' }], function (item) {
            if (item.reset) saveButtons(copy(DEFAULT_BUTTONS));
            openEditor(false);
        }, function () { openEditor(false); });
    }
    function openEditor(captureController) {
        if (captureController !== false) {
            var enabled = Lampa.Controller.enabled();
            editorController = enabled && enabled.name || 'settings_component';
        }
        collectMenu();
        var items = buttons.map(function (entry, index) {
            var target = findMenu(entry.key);
            return { title: (index + 1) + '. ' + titleFor(entry), subtitle: entry.type === 'link' ? entry.url : target ? target.title : 'Плагін ще не завантажений', id: entry.id };
        });
        items.push({ title: 'Додати пункт меню', add: true });
        items.push({ title: 'Відновити стандартні кнопки', reset: true });
        showPicker('Верхні кнопки', items, function (item) {
            if (item.add) chooseMenu();
            else if (item.reset) resetButtons();
            else editButton(item.id);
        });
    }

    var homeInstances = [];
    var featuredCache = {};
    var homeSyncTimer;
    var playSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
    var bookmarkSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    function primarySource() { return Lampa.Storage.field('source') || 'tmdb'; }
    function movieTitle(card) { return card.title || card.name || card.original_title || card.original_name || 'Без назви'; }
    function movieImage(card, wide) {
        if (wide && card.backdrop_path) return Lampa.Api.img(card.backdrop_path, 'w1280');
        var direct = wide ? card.cover || card.background || card.img : card.poster || card.img;
        if (direct) return direct;
        if (card.poster_path) return Lampa.Api.img(card.poster_path, 'w500');
        return card.poster || card.img || '';
    }
    function imageInto(element, card, wide) {
        var url = movieImage(card, wide);
        element.on('error', function () {
            var fallback = movieImage(card, false);
            if (fallback && element.attr('src') !== fallback) element.attr('src', fallback);
            else element.addClass('mls-image-missing');
        });
        if (url) element.attr('src', url);
    }
    function openMovie(card, resume) {
        var series = !!(card.original_name || card.first_air_date || card.number_of_seasons || card.media_type === 'tv');
        Lampa.Activity.push({ component: 'full', source: card.source || primarySource(), id: card.id, method: series ? 'tv' : 'movie', card: card, title: movieTitle(card), url: '', season: resume && resume.season || undefined, episode: resume && resume.episode || undefined });
    }
    function openHistory() { Lampa.Activity.push({ component: 'favorite', type: 'history', title: 'Історія перегляду', page: 1, url: '' }); }
    function isContinueRow(data) {
        return data && (data.mls_continue || data.title === Lampa.Lang.translate('title_continue') || data.title === Lampa.Lang.translate('title_watched'));
    }
    function getResume(card) {
        return resumeState(card, Lampa.Storage.get('online_watched_last', {}), Lampa.Utils.hash, Lampa.Timeline.view, Lampa.Timeline.watched);
    }
    function continueCards() {
        var history = Lampa.Favorite.get({ type: 'history' }) || [];
        var finished = (Lampa.Favorite.get({ type: 'viewed' }) || []).concat(Lampa.Favorite.get({ type: 'thrown' }) || []);
        return history.filter(function (card) {
            if (finished.some(function (other) { return other.id === card.id && other.source === card.source; })) return false;
            var progress = getResume(card);
            return progress.series || progress.percent > 0 && progress.percent < 95;
        }).slice(0, 20).map(function (card) { return copy(card); });
    }
    function drawResumeCard(instance, card) {
        var root = $(instance.render(true));
        if (root.find('.mls-resume-overlay').length) return;
        root.addClass('mls-resume-card');
        var view = root.find('.card__view');
        var cover = $('<img class="mls-resume-cover" alt="" />');
        imageInto(cover, card, true);
        var overlay = $('<div class="mls-resume-overlay"><div class="mls-resume-play"></div><div class="mls-resume-text"><div class="mls-resume-title"></div><div class="mls-resume-episode"></div></div><div class="mls-resume-time"></div></div>');
        overlay.find('.mls-resume-play').html(playSvg);
        overlay.find('.mls-resume-title').text(movieTitle(card));
        view.append(cover, overlay);
        function update() {
            var state = getResume(card);
            overlay.find('.mls-resume-episode').text(state.episode ? 'S' + state.season + ' E' + state.episode + (state.name ? ' — ' + state.name : '') : state.series ? 'Продовжити серіал' : 'Продовжити фільм');
            overlay.find('.mls-resume-time').text(state.duration ? minuteLabel(state.time) + ' / ' + minuteLabel(state.duration) : state.percent ? Math.round(state.percent) + '% переглянуто' : '');
            view.find('.mls-resume-progress').remove();
            var line = state.hash ? Lampa.Timeline.render(state) : $('<div class="time-line"><div></div></div>');
            $(line).addClass('mls-resume-progress').removeClass('hide').find('>div').css('width', state.percent + '%');
            view.append(line);
            root.attr('data-mls-season', state.season).attr('data-mls-episode', state.episode).attr('data-mls-progress', state.percent);
        }
        update();
        instance.use({ onUpdate: update });
    }
    function styleContinue(item, data) {
        if (!isContinueRow(data)) return;
        item.use({
            onCreate: function () {
                $(item.render(true)).addClass('mls-resume-row');
                var more = $('<div class="items-line__more selector"></div>').text('Дивитися все').on('hover:enter', openHistory);
                $(item.render(true)).find('.items-line__head').append(more);
            },
            onVisible: function () {
                var root = $(item.render(true));
                var more = root.find('.items-line__more'); more.slice(1).remove(); more = more.first();
                if (!more.length) {
                    more = $('<div class="items-line__more selector"></div>');
                    root.find('.items-line__head').append(more);
                }
                more.text('Дивитися все').off('hover:enter').on('hover:enter', openHistory);
            },
            onlyMore: openHistory,
            onInstance: function (card, cardData) { card.use({ onCreate: function () { drawResumeCard(card, cardData); } }); }
        });
    }
    function customRow(root) {
        var row = new Lampa.Emit();
        row.html = root;
        row.last = null;
        row.dead = false;
        row.render = function (js) { return js ? root[0] : root; };
        function focusDelta(delta) {
            var selects = root.find('.selector').filter(function () { return this.offsetParent !== null; });
            var index = selects.index(row.last);
            if (index < 0) index = 0;
            var next = index + delta;
            if (next < 0) { row.emit('left'); return; }
            if (next < selects.length) Lampa.Controller.collectionFocus(selects.eq(next), root, true);
        }
        row.toggle = function () {
            if (row.dead) return;
            Lampa.Controller.add('mls_home', { link: row, toggle: function () {
                Lampa.Controller.collectionSet(root, false, true);
                Lampa.Controller.collectionFocus(row.last, root, true);
                row.emit('active');
                row.emit('toggle');
            }, right: function () { focusDelta(1); }, left: function () { focusDelta(-1); }, up: function () { row.emit('up'); }, down: function () { row.emit('down'); }, back: function () { row.emit('back'); } });
            Lampa.Controller.toggle('mls_home');
        };
        root.find('.selector').on('hover:focus hover:hover hover:touch', function () {
            row.last = this;
            if (!Lampa.Controller.own(row) && ['content', 'items_line', 'head', 'mls_home'].indexOf(Lampa.Controller.enabled().name) >= 0) row.toggle();
        });
        row.destroy = function () { row.dead = true; clearInterval(row.timer); root.remove(); row.emit('destroy'); };
        return row;
    }
    function heroRow() {
        var html = $('<section class="mls-home-row mls-hero" aria-label="В центрі уваги"><img class="mls-hero-image" alt=""/><div class="mls-hero-shade"></div><div class="mls-hero-content"><div class="mls-hero-eyebrow">В центрі уваги</div><h1 class="mls-hero-title">Завантажуємо добірку…</h1><div class="mls-hero-meta"></div><div class="mls-hero-description"></div><div class="mls-hero-actions"><div class="selector mls-hero-play mls-hero-button"></div><div class="selector mls-hero-book mls-hero-button"></div></div></div><div class="mls-hero-pagination"><div class="selector mls-hero-prev" aria-label="Попередній реліз">‹</div><span class="mls-hero-counter"></span><div class="selector mls-hero-next" aria-label="Наступний реліз">›</div></div></section>');
        html.find('.mls-hero-play').append(playSvg, $('<span></span>').text('Дивитися'));
        html.find('.mls-hero-book').append(bookmarkSvg, $('<span></span>').text('До обраного'));
        var row = customRow(html);
        row.cards = [];
        row.index = 0;
        row.token = 0;
        row.card = null;
        function bookmark() {
            var checked = row.card && Lampa.Favorite.check(row.card).book;
            html.find('.mls-hero-book span').text(checked ? 'В обраному' : 'До обраного');
            html.find('.mls-hero-book').attr('aria-pressed', checked ? 'true' : 'false');
        }
        row.show = function (index) {
            if (row.dead || !row.cards.length) return;
            row.index = (index + row.cards.length) % row.cards.length;
            row.card = row.cards[row.index];
            var card = row.card;
            html.attr('data-mls-source', row.source).attr('data-mls-card-id', card.id).removeClass('mls-hero-loading mls-hero-error');
            var image = html.find('.mls-hero-image').removeClass('mls-image-missing').off('error');
            imageInto(image, card, true);
            html.find('.mls-hero-title').text(movieTitle(card));
            var year = (card.release_date || card.first_air_date || card.release_year || '').toString().slice(0, 4);
            var series = card.original_name || card.first_air_date || card.media_type === 'tv';
            var score = Number(card.vote_average || card.rating || 0);
            html.find('.mls-hero-meta').text((series ? 'Серіал' : 'Фільм') + (year ? ' · ' + year : '') + (score > 0 ? ' · ★ ' + score.toFixed(1) : ''));
            html.find('.mls-hero-description').text(card.overview || card.description || 'Один із популярних релізів зараз. Відкрийте картку, щоб обрати перегляд.');
            html.find('.mls-hero-counter').text((row.index + 1) + ' / ' + row.cards.length);
            html.find('.mls-hero-play span').text('Дивитися');
            bookmark();
        };
        function fetch() {
            var source = primarySource();
            var type = setting('hero_type', 'all');
            var key = source + ':' + type;
            var token = ++row.token;
            row.source = source;
            row.type = type;
            row.card = null;
            row.cards = [];
            html.addClass('mls-hero-loading').removeClass('mls-hero-error').attr('data-mls-source', source);
            html.find('.mls-hero-image').removeAttr('src');
            html.find('.mls-hero-title').text('Завантажуємо добірку…');
            html.find('.mls-hero-description,.mls-hero-meta,.mls-hero-counter').text('');
            function receive(cards) {
                if (row.dead || row.token !== token || source !== primarySource()) return;
                row.cards = cards.filter(function (card) { return card && card.id && (card.title || card.name) && !card.adult; }).slice(0, 10);
                row.cards.forEach(function (card) { if (!card.source) card.source = source; });
                if (row.cards.length) row.show(0);else fail();
            }
            function fail() {
                if (row.dead || row.token !== token) return;
                delete featuredCache[key];
                html.removeClass('mls-hero-loading').addClass('mls-hero-error');
                html.find('.mls-hero-title').text('Добірка тимчасово недоступна');
                html.find('.mls-hero-description').text('Спробуйте оновити банер. Інші розділи Lampa залишаються доступними.');
                html.find('.mls-hero-play span').text('Оновити');
            }
            var cache = featuredCache[key];
            if (cache && Date.now() - cache.time < 10 * 60 * 1000) { receive(copy(cache.cards)); return; }
            try {
                Lampa.Api.list({ source: source, url: featuredQuery(source, type), page: 1 }, function (data) {
                    var cards = data && data.results || [];
                    if (cards.length) featuredCache[key] = { time: Date.now(), cards: copy(cards) };
                    receive(cards);
                }, fail);
            } catch (e) { fail(); }
        }
        html.find('.mls-hero-play').on('hover:enter', function () { if (row.card) openMovie(row.card);else fetch(); });
        html.find('.mls-hero-book').on('hover:enter', function () { if (row.card) { Lampa.Favorite.toggle('book', row.card); bookmark(); } });
        html.find('.mls-hero-prev').on('hover:enter', function () { row.show(row.index - 1); });
        html.find('.mls-hero-next').on('hover:enter', function () { row.show(row.index + 1); });
        row.refresh = function (force) {
            if (force || row.source !== primarySource() || row.type !== setting('hero_type', 'all')) fetch();
            clearInterval(row.timer);
            var seconds = Number(setting('hero_interval', '15'));
            if (seconds > 0) row.timer = setInterval(function () {
                var bounds = html[0].getBoundingClientRect();
                if (!row.dead && row.cards.length > 1 && !html.find('.focus').length && !document.querySelector('body.settings--open,body.selectbox--open,body.menu--open') && bounds.bottom > 0 && bounds.top < innerHeight) row.show(row.index + 1);
            }, seconds * 1000);
        };
        row.refresh(true);
        return row;
    }
    function emptyResumeRow() {
        var html = $('<section class="mls-home-row mls-resume-empty"><h2>Продовжити перегляд</h2><div class="mls-resume-empty-body"><div class="mls-resume-empty-icon"></div><div><strong>Тут буде ваше кіно</strong><p>Почніть перегляд — збережені фільми та серії з’являться тут.</p></div><div class="selector mls-hero-button mls-resume-catalog">Відкрити каталог</div></div></section>');
        html.find('.mls-resume-empty-icon').html(playSvg);
        html.find('.mls-resume-catalog').on('hover:enter', function () { collectMenu(); var catalog = findMenu('action:catalog'); if (catalog) catalog.element.trigger('hover:enter'); });
        return customRow(html);
    }
    function currentContent(component) {
        var active = Lampa.Activity.active();
        return active && active.activity && active.activity.component === component && ['content', 'items_line', 'mls_home'].indexOf(Lampa.Controller.enabled().name) >= 0;
    }
    function attachFront(component, front, focus) {
        var prior = component.items[component.active];
        component.items = front.concat(component.items.filter(function (item) { return front.indexOf(item) < 0; }));
        var body = component.scroll.body(true);
        for (var i = front.length - 1; i >= 0; i--) body.insertBefore(front[i].render(true), body.firstChild);
        component.active = focus ? 0 : Math.max(0, component.items.indexOf(prior));
        if (currentContent(component) && focus && component.items[0]) component.items[0].toggle();
    }
    function removeHome(component, silent) {
        if (!component.mlsHome) return;
        var state = component.mlsHome;
        var prior = component.items[component.active];
        state.front.forEach(function (item) { item.destroy(); });
        component.items = component.items.filter(function (item) { return state.front.indexOf(item) < 0; });
        state.detached.forEach(function (stored) {
            var index = Math.min(stored.index, component.items.length);
            var next = component.items[index];
            component.items.splice(index, 0, stored.item);
            if (next) next.render(true).parentNode.insertBefore(stored.item.render(true), next.render(true));else component.scroll.body(true).appendChild(stored.item.render(true));
        });
        component.mlsHome = null;
        component.active = Math.max(0, component.items.indexOf(prior));
        $(component.html).removeClass('mls-main-page');
        if (!silent && currentContent(component) && component.items[component.active]) component.items[component.active].toggle();
    }
    function installHome(component, focus) {
        if (!component.items || component.mlsDead || !component.mlsBuilt) return;
        if (!setting('enabled', true)) { removeHome(component); return; }
        if (component.mlsHome) {
            if (component.mlsHome.hero) component.mlsHome.hero.refresh(false);
            return;
        }
        $(component.html).addClass('mls-main-page');
        var state = { front: [], detached: [], hero: null };
        component.mlsHome = state;
        if (setting('hero', true)) {
            state.hero = heroRow();
            component.emit('append', state.hero);
            state.front.push(state.hero);
        }
        if (setting('resume', true)) {
            var nativeItems = component.items.slice();
            nativeItems.forEach(function (item, index) {
                if (isContinueRow(item.data)) {
                    state.detached.push({ item: item, index: index });
                    $(item.render(true)).detach();
                    component.items.splice(component.items.indexOf(item), 1);
                }
            });
            var cards = continueCards();
            if (cards.length) {
                component.emit('createAndAppend', { title: 'Продовжити перегляд', mls_continue: true, total_pages: 2, results: cards, params: { items: { view: 3 } } });
                state.front.push(component.items[component.items.length - 1]);
            } else {
                var empty = emptyResumeRow();
                component.emit('append', empty);
                state.front.push(empty);
            }
        }
        attachFront(component, state.front, focus); if (Lampa.Layer) Lampa.Layer.visible(component.scroll.render(true));
    }
    function decorateComponent(component, main) {
        if (!component || !component.use || component.mlsDecorated) return component;
        component.mlsDecorated = true;
        component.use({
            onInstance: function (item, data) { styleContinue(item, data); },
            onBuild: function () { if (main) { component.mlsBuilt = true; installHome(component, true); } },
            onStart: function () { if (main && component.mlsBuilt) installHome(component, false); },
            onController: function (controller) {
                if (!main) return;
                var toggle = controller.toggle;
                controller.toggle = function () {
                    toggle.call(this);
                    if (component.mlsHome && Lampa.Controller.enabled().name === 'content' && component.items[component.active]) component.items[component.active].toggle();
                };
            },
            onDestroy: function () {
                component.mlsDead = true;
                if (component.mlsHome) component.mlsHome.detached.forEach(function (stored) { stored.item.destroy(); });
                homeInstances = homeInstances.filter(function (entry) { return entry !== component; });
            }
        });
        if (main) homeInstances.push(component);
        return component;
    }
    function registerHome() {
        ['main', 'category'].forEach(function (name) {
            var Original = Lampa.Component.get(name);
            if (!Original) return;
            Lampa.Component.add(name, function (object) { return decorateComponent(new Original(object), name === 'main'); });
        });
        Lampa.Activity.all().forEach(function (entry) {
            var component = entry.activity && entry.activity.component;
            var name = entry.component || entry.object && entry.object.component;
            if (component && (name === 'main' || name === 'category')) {
                decorateComponent(component, name === 'main');
                if (component.items) component.items.forEach(function (item) {
                    if (isContinueRow(item.data)) {
                        $(item.render(true)).addClass('mls-resume-row');
                        (item.items || []).forEach(function (card) { if (card.data) drawResumeCard(card, card.data); });
                    }
                });
                if (name === 'main' && component.items && component.items.length) { component.mlsBuilt = true; installHome(component, false); }
            }
        });
    }
    function syncHome(rebuild) {
        homeInstances.slice().forEach(function (component) {
            if (component.mlsDead) return;
            var active = component.items && component.items[component.active];
            var homeIndex = component.mlsHome ? component.mlsHome.front.indexOf(active) : -1;
            var focusedCard = active && active.items && active.items[active.active];
            var focusedId = focusedCard && focusedCard.data && focusedCard.data.id;
            var restore = rebuild && homeIndex >= 0 && currentContent(component);
            if (rebuild) removeHome(component, true);
            installHome(component, false);
            if (restore && component.mlsHome && component.mlsHome.front[homeIndex]) {
                var row = component.mlsHome.front[homeIndex];
                if (focusedId && row.items) row.items.some(function (card) {
                    if (card.data && card.data.id === focusedId) { row.last = card.render(true); return true; }
                    return false;
                });
                component.active = component.items.indexOf(row);
                row.toggle();
            }
        });
    }
    function scheduleHomeSync() {
        clearTimeout(homeSyncTimer);
        homeSyncTimer = setTimeout(function () { syncHome(true); }, 180);
    }

    function addSettings() {
        Lampa.SettingsApi.addComponent({ component: COMPONENT, name: 'MyLampa skin', icon: Lampa.Template.string('icon_settings'), after: 'interface' });
        definitions.forEach(function (definition) {
            var param = { name: PREFIX + definition[0], type: definition[1], default: definition[2] };
            if (definition[4]) param.values = definition[4];
            Lampa.SettingsApi.addParam({ component: COMPONENT, param: param, field: { name: definition[3] }, onChange: function () { setTimeout(applyAppearance, 0); } });
        });
        Lampa.SettingsApi.addParam({ component: COMPONENT, param: { type: 'title' }, field: { name: 'Верхня панель' } });
        Lampa.SettingsApi.addParam({ component: COMPONENT, param: { name: PREFIX + 'edit_buttons', type: 'button' }, field: { name: 'Налаштувати верхні кнопки', description: 'Пункти меню та плагінів, власні назви, іконки й порядок.' }, onChange: function () { openEditor(true); } });
        Lampa.SettingsApi.addParam({ component: COMPONENT, param: { name: PREFIX + 'reset_appearance', type: 'button' }, field: { name: 'Відновити оформлення' }, onChange: function () {
            definitions.forEach(function (definition) { Lampa.Storage.set(PREFIX + definition[0], definition[2]); });
            applyAppearance();
            notify('Стандартне оформлення MyLampa skin відновлено.');
        } });
    }
    function addStyle() {
        var style = document.createElement('style');
        style.id = 'mylampa-skin-style';
        style.textContent = [
            'body.mls-enabled{background:#0c111b!important;color:#eef2fa;--mls-rail:4.5em;--mls-expanded:13.5em}',
            'body.mls-enabled .background{opacity:.12!important}',
            'body.mls-enabled .head{background:#0c111b;border-bottom:1px solid #222c3d}',
            'body.mls-enabled .head__body{min-height:3.5em;padding:.45em 1.2em;gap:.6em}',
            'body.mls-enabled .head__title,body.mls-enabled .head__markers{display:none!important}',
            'body.mls-enabled .head__actions{flex:1;min-width:0;align-items:center;gap:.35em}',
            'body.mls-enabled .head__action.open--profile,body.mls-enabled .notice--icon,body.mls-enabled .full--screen{display:none!important}',
            'body.mls-enabled .head__action.open--settings,body.mls-enabled .head__action.open--search{display:flex!important;flex-shrink:0;border-radius:.7em;margin-left:.25em}',
            'body.mls-enabled .head__time{display:flex!important;align-items:center;gap:.55em;margin:0 0 0 .7em;flex-shrink:0}body.mls-enabled .head__time-date,body.mls-enabled .head__time-week{display:block!important;font-size:.72em;line-height:1.25;color:#c1cbda}',
            'body.mls-enabled .head__time-now{font-size:1.6em;font-weight:600;margin:0;color:#eef2fa;line-height:1}',
            'body.mls-enabled.mls-no-clock .head__time{display:none!important}',
            '.mls-top-nav{display:flex;align-items:center;flex:1;flex-wrap:wrap;min-width:0;gap:.4em}',
            'body.mls-enabled .mls-top-button{width:auto;min-width:2.6em;height:2.55em;padding:.45em .85em;border-radius:.65em;gap:.5em;margin:0;color:#b5c0d2;max-width:14em;background:transparent;flex-shrink:0;font-size:.9em}',
            '.mls-top-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:12em}',
            '.mls-top-icon{height:1.05em!important;width:1.05em!important;margin:0!important;flex-shrink:0}',
            '.mls-top-icon svg,.mls-top-icon img{width:100%!important;height:100%!important}',
            'body.mls-enabled .mls-top-button.mls-current{color:#edf3ff;background:#1b2a47;box-shadow:inset 0 -2px 0 var(--mls-accent)}',
            'body.mls-enabled .mls-top-button.focus,body.mls-enabled .mls-top-button.hover,body.mls-enabled .head__action.focus{background:var(--mls-accent)!important;color:#0c1630!important;box-shadow:0 0 0 2px var(--mls-accent)}',
            '.mls-top-button.mls-unavailable{opacity:.45}',
            'body.mls-enabled.mls-no-button-icons .mls-top-icon{display:none}',
            'body.mls-enabled .mls-promoted{display:none!important}',
            'body.mls-enabled .wrap__left,body.mls-enabled .wrap__content{padding-top:var(--mls-head-height,4em)!important}body.mls-enabled .wrap__left{width:var(--mls-rail)!important;margin-left:0!important;visibility:visible!important;transform:none!important;background:#0e1420;border-right:1px solid #222c3d}',
            'body.mls-enabled .wrap__left>.scroll{width:var(--mls-rail)!important;background:#0e1420}',
            'body.mls-enabled .wrap__content{width:calc(100% - var(--mls-rail))!important}body.mls-enabled .wrap__content .activitys,body.mls-enabled .wrap__content .activity{width:100%!important}',
            'body.mls-enabled .wrap__left .menu__text{display:none!important}',
            'body.mls-enabled .menu__list{padding:0 .4em}',
            'body.mls-enabled .menu__item{padding:.8em 1em;border-radius:.65em;color:#b5c0d2}',
            'body.mls-enabled .menu__ico{margin-right:0}',
            'body.mls-enabled .menu__split{margin:.8em 1.1em;width:2.2em}',
            'body.mls-enabled.menu--open .wrap__left>.scroll{width:var(--mls-expanded)!important;box-shadow:1em 0 3em rgba(0,0,0,.3)}',
            'body.mls-enabled.menu--open .wrap__left .menu__text{display:block!important}',
            'body.mls-enabled.menu--open .menu__ico{margin-right:1em}',
            'body.mls-enabled.menu--open .wrap__content{transform:translate3d(calc(var(--mls-expanded) - var(--mls-rail)),0,0)!important}',
            'body.mls-enabled.mls-wide-sidebar{--mls-rail:13.5em}',
            'body.mls-enabled.mls-wide-sidebar .wrap__left .menu__text{display:block!important}',
            'body.mls-enabled.mls-wide-sidebar .menu__ico{margin-right:1em}',
            'body.mls-enabled .menu__item.focus,body.mls-enabled .menu__item.hover{background:#1c2c47!important;color:#f3f6fd!important;box-shadow:inset 3px 0 0 var(--mls-accent)}',
            'body.mls-enabled .menu__item.focus svg [stroke],body.mls-enabled .menu__item.hover svg [stroke]{stroke:currentColor!important}',
            'body.mls-enabled .card__view,body.mls-enabled .card__img{border-radius:var(--mls-radius)!important}',
            'body.mls-enabled .card.focus .card__view{box-shadow:0 0 0 .13em var(--mls-accent)!important}',
            'body.mls-enabled .card.focus .card__view::after,body.mls-enabled .card.hover .card__view::after{border-color:var(--mls-accent)!important;border-radius:calc(var(--mls-radius) + .5em)!important}',
            'body.mls-enabled .settings-param.focus,body.mls-enabled .selectbox-item.focus{background:#1c2c47!important;box-shadow:inset 3px 0 0 var(--mls-accent);color:#f3f6fd}',
            'body.mls-enabled .settings__content,body.mls-enabled .selectbox__content{background:#141c2a!important}',

            'body.mls-enabled .card.focus .card__view,body.mls-enabled .card.hover .card__view{box-shadow:var(--mls-card-shadow)!important}body.mls-enabled .card.focus .card__view::after,body.mls-enabled .card.hover .card__view::after{border:0!important;box-shadow:none!important}',
            'body.mls-enabled .mls-top-button.mls-current{background:var(--mls-menu-soft);box-shadow:inset 0 -2px 0 var(--mls-menu-color)}',
            'body.mls-enabled .mls-top-button.focus,body.mls-enabled .mls-top-button.hover,body.mls-enabled .head__action.focus,body.mls-enabled .menu__item.focus,body.mls-enabled .menu__item.hover,body.mls-enabled .settings-param.focus,body.mls-enabled .selectbox-item.focus,body.mls-enabled .mls-hero-button.focus,body.mls-enabled .mls-hero-prev.focus,body.mls-enabled .mls-hero-next.focus{background:var(--mls-menu-bg)!important;color:var(--mls-menu-text)!important;box-shadow:var(--mls-menu-shadow)!important;border-color:var(--mls-menu-color)!important}',
            'body.mls-enabled[data-mls-menu-focus="stripe"] .mls-top-button.focus,body.mls-enabled[data-mls-menu-focus="stripe"] .mls-top-button.hover,body.mls-enabled[data-mls-menu-focus="stripe"] .head__action.focus,body.mls-enabled[data-mls-menu-focus="stripe"] .mls-hero-button.focus{box-shadow:inset 0 -3px 0 var(--mls-menu-color)!important}',
            '.mls-home-row{display:none}body.mls-enabled .mls-home-row{display:block}',
            'body.mls-enabled .mls-main-page>.scroll>.scroll__content{padding-top:0}',
            'body.mls-enabled .mls-hero{position:relative;min-height:14.1em;overflow:hidden;margin-bottom:.6em;background:#0c111b}',
            '.mls-hero-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 32%}',
            '.mls-hero-shade{position:absolute;inset:0;background:linear-gradient(90deg,#0c111b 0%,rgba(12,17,27,.95) 22%,rgba(12,17,27,.64) 45%,rgba(12,17,27,.08) 78%),linear-gradient(0deg,#0c111b 0%,transparent 48%)}',
            '.mls-hero-content{position:relative;z-index:1;padding:1.1em 1.5em 1.1em;max-width:34em}',
            '.mls-hero-eyebrow{font-size:.6em;text-transform:uppercase;letter-spacing:.22em;color:#becbe0;margin-bottom:.6em;font-weight:600}',
            '.mls-hero-title{font-size:2em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-weight:650;line-height:1.03;letter-spacing:-.035em;margin:0 0 .32em;max-width:14em;text-shadow:0 2px 20px rgba(0,0,0,.4)}',
            '.mls-hero-meta{font-size:.7em;color:#becbe0;margin-bottom:.6em}',
            '.mls-hero-description{font-size:.78em;line-height:1.35;color:#d1d9e6;max-width:30em;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:1em}',
            '.mls-hero-actions{display:flex;gap:.7em;align-items:center}',
            '.mls-hero-button{display:flex;align-items:center;justify-content:center;gap:.5em;min-height:2.75em;padding:.65em 1.2em;border:1px solid #3b4658;border-radius:.75em;background:rgba(21,29,43,.72);font-size:.8em;font-weight:600;color:#f0f5fd;cursor:pointer}',
            '.mls-hero-button svg{width:1.2em;height:1.2em;flex-shrink:0}',
            '.mls-hero-play{background:var(--mls-accent);color:#101827;border-color:var(--mls-accent);box-shadow:0 6px 24px rgba(73,124,237,.24)}',
            '.mls-hero-button.focus,.mls-hero-prev.focus,.mls-hero-next.focus{box-shadow:0 0 0 3px #fff;background:var(--mls-accent);color:#101827;border-color:var(--mls-accent)}',
            '.mls-hero-pagination{position:absolute;z-index:2;right:1.5em;bottom:1.4em;display:flex;align-items:center;gap:.7em;color:#c6d0df;font-size:.75em}',
            '.mls-hero-prev,.mls-hero-next{display:flex;align-items:center;justify-content:center;width:2em;height:2em;border-radius:50%;background:#111b2bc4;border:1px solid #3b4658;font-size:1.3em;cursor:pointer}',
            '.mls-hero-loading .mls-hero-book,.mls-hero-error .mls-hero-book{display:none}.mls-hero-loading .mls-hero-title{font-size:1.8em}.mls-image-missing{opacity:.15!important}',
            'body.mls-enabled .mls-main-page .items-line{padding-bottom:1.6em}body.mls-enabled .mls-main-page .items-line__head{margin-bottom:.7em}body.mls-enabled .mls-main-page .items-line__title{font-size:1.15em;font-weight:600}',
            'body.mls-enabled .mls-main-page .card:not(.mls-resume-card){width:10em!important}body.mls-enabled .mls-main-page .card:not(.mls-resume-card)>.card__title{font-size:.9em;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}body.mls-enabled .mls-main-page .card:not(.mls-resume-card)>.card__age{font-size:.7em}',
            'body.mls-enabled .mls-resume-row{padding-bottom:1.1em!important}body.mls-enabled .mls-resume-row .items-line__head{margin-bottom:.55em}body.mls-enabled .mls-resume-row .items-line__title{font-size:1.15em;font-weight:600}body.mls-enabled .mls-resume-row .items-line__more{font-size:.75em;color:#bac6d9}',
            'body.mls-enabled .mls-resume-row .card{width:calc((100vw - var(--mls-rail) - 6em)/3)!important;margin-right:.7em}body.mls-enabled .mls-resume-card .card__view{height:5.8em;padding:0!important;margin-bottom:0;position:relative;background:#162234;border:1px solid #28384b}',
            'body.mls-enabled .mls-resume-card>:not(.card__view),body.mls-enabled .mls-resume-card .card__img,body.mls-enabled .mls-resume-card>.card__title,body.mls-enabled .mls-resume-card>.card__age,body.mls-enabled .mls-resume-card .card-watched,body.mls-enabled .mls-resume-card .card__icons{display:none!important}',
            '.mls-resume-cover,.mls-resume-overlay,.mls-resume-progress{display:none}body.mls-enabled .mls-resume-cover{display:block;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:var(--mls-radius)}',
            'body.mls-enabled .mls-resume-overlay{display:flex;position:absolute;inset:0;align-items:flex-end;padding:1.3em .75em 1em;gap:.6em;background:linear-gradient(0deg,rgba(6,13,23,.96),rgba(6,13,23,.12) 100%);border-radius:var(--mls-radius);z-index:1}',
            'body.mls-enabled .mls-resume-card .card__type{left:auto;right:.45em;top:.35em;font-size:.5em;padding:.35em .45em;height:auto;width:auto;border-radius:.2em}body.mls-enabled .mls-resume-card .card__vote{display:none!important}', '.mls-resume-play{border-radius:50%;width:1.55em;height:1.55em;background:#f4f7fb;color:#111b2b;display:flex;align-items:center;justify-content:center;flex-shrink:0}.mls-resume-play svg{width:1.1em;height:1.1em}',
            '.mls-resume-text{min-width:0;flex:1}.mls-resume-title{font-size:.78em;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mls-resume-episode{font-size:.56em;color:#d2dbe9;margin-top:.25em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mls-resume-time{font-size:.55em;color:#e0e7f2;white-space:nowrap;padding-bottom:.1em}',
            'body.mls-enabled .mls-resume-progress{display:block!important;position:absolute;bottom:.45em;left:.6em;right:.6em;height:.18em;background:#334157;border-radius:1em;z-index:3;margin:0!important}body.mls-enabled .mls-resume-progress>div{height:100%;background:var(--mls-accent);border-radius:1em}',
            'body.mls-enabled .mls-resume-row .card__view>.release-badges{top:.35em!important;left:.45em;right:.4em;flex-direction:row;flex-wrap:wrap;gap:.15em}body.mls-enabled .mls-resume-row .release-badges__badge{font-size:.5em;padding:.3em .4em}',
            'body.mls-enabled .mls-resume-empty{padding:.6em 1.5em 1.4em}.mls-resume-empty h2{font-size:1.15em;margin:0 0 .6em;font-weight:600}.mls-resume-empty-body{display:flex;align-items:center;gap:1em;padding:1em 1.1em;background:linear-gradient(110deg,#18263c,#101927);border:1px solid #29394e;border-radius:var(--mls-radius)}.mls-resume-empty-body strong{font-size:.85em}.mls-resume-empty-body p{font-size:.65em;color:#aab9cc;margin:.3em 0 0}.mls-resume-empty-icon{color:var(--mls-accent);width:2.2em;height:2.2em}.mls-resume-empty-icon svg{width:100%;height:100%}.mls-resume-catalog{margin-left:auto;white-space:nowrap}',
            '@media(max-width:900px){body.mls-enabled .mls-hero{min-height:17em}.mls-hero-content{max-width:25em}.mls-hero-title{font-size:2em}body.mls-enabled .mls-resume-row .card{width:calc((100vw - var(--mls-rail) - 5em)/2)!important}.mls-resume-time{font-size:.5em}}',
            '@media(max-width:620px){body.mls-enabled .mls-hero{min-height:21em}.mls-hero-image{object-position:65% center}.mls-hero-shade{background:linear-gradient(0deg,#0c111b 0%,rgba(12,17,27,.75) 50%,rgba(12,17,27,.08) 100%)}.mls-hero-content{padding:7em 1em 2em}.mls-hero-title{font-size:1.8em}.mls-hero-actions{gap:.4em}.mls-hero-button{font-size:.68em;padding:.65em .85em}.mls-hero-pagination{bottom:.65em;right:1em}body.mls-enabled .mls-resume-row .card{width:calc(100vw - var(--mls-rail) - 3em)!important}.mls-resume-empty-body{flex-wrap:wrap}.mls-resume-catalog{margin-left:0}.mls-resume-empty-body p{max-width:24em}body.mls-enabled .head__time{margin-left:0}.head__time-date{white-space:nowrap}}',
            '@media(max-width:900px){body.mls-enabled .mls-top-button{padding:.45em .6em;max-width:11em}}',
            '@media(max-width:620px){body.mls-enabled{--mls-rail:3.7em}body.mls-enabled .head__body{padding:.5em .7em;align-items:flex-start;flex-wrap:wrap}body.mls-enabled .head__actions{flex-basis:calc(100% - 4em);flex-wrap:wrap}body.mls-enabled .mls-top-nav{flex-basis:100%;order:3}body.mls-enabled .mls-top-button{font-size:.85em;max-width:11em;min-height:2.7em}body.mls-enabled .head__action.open--settings,body.mls-enabled .head__action.open--search{height:2.5em;width:2.5em;margin:0}body.mls-enabled .menu__item{padding:.8em .7em}body.mls-enabled .head__backward{display:none}body.mls-enabled .wrap__left,body.mls-enabled .wrap__content{padding-top:var(--mls-head-height,7em)}body.mls-enabled.mls-wide-sidebar{--mls-rail:10em}}'
        ].join('\n');
        document.head.appendChild(style);
    }
    function scheduleMenuSync() {
        clearTimeout(syncTimer);
        syncTimer = setTimeout(renderNavigation, 60);
    }
    function init() {
        if (ready || !global.Lampa || !global.$ || !LampaOrGlobalReady()) return;
        Lampa = global.Lampa;
        $ = global.$;
        ready = true;
        loadButtons();
        addStyle();
        addSettings();
        registerHome();
        applyAppearance();
        menuObserver = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var target = mutations[i].target;
                if ($(target).closest('.menu').length) { scheduleMenuSync(); return; }
                for (var j = 0; j < mutations[i].addedNodes.length; j++) {
                    var node = mutations[i].addedNodes[j];
                    if (node.nodeType === 1 && (node.matches('.menu') || node.querySelector('.menu'))) { scheduleMenuSync(); return; }
                }
            }
        });
        menuObserver.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['data-action', 'data-component', 'href'] });
        global.addEventListener('resize', resizeHeader);
        if (global.ResizeObserver) new ResizeObserver(resizeHeader).observe(Lampa.Head.render()[0]);
        Lampa.Storage.listener.follow('change', function (event) {
            if (event.name === BUTTONS_KEY) { loadButtons(); renderNavigation(); }
            else if (event.name && event.name.indexOf(PREFIX) === 0) { applyAppearance(); if (['mylampa_skin_hero', 'mylampa_skin_resume'].indexOf(event.name) >= 0) syncHome(true); }
            else if (event.name === 'source') { featuredCache = {}; syncHome(false); }
            else if (event.name === 'online_watched_last') scheduleHomeSync();
        });
        Lampa.Listener.follow('activity', function () { setTimeout(updateActive, 0); });
        Lampa.Listener.follow('state:changed', function (event) {
            if (event.target === 'timeline' || event.target === 'favorite' && (['history', 'viewed', 'thrown'].indexOf(event.type) >= 0 || event.reason === 'profile' || event.reason === 'read')) scheduleHomeSync();
        });
        Lampa.Listener.follow('menu', scheduleMenuSync);
        Lampa.Listener.follow('app', function (event) { if (event.type === 'ready') scheduleMenuSync(); });
    }
    function LampaOrGlobalReady() {
        return global.Lampa.Head && global.Lampa.Head.render && global.Lampa.Head.render() && global.Lampa.Head.render().length !== 0 && global.Lampa.SettingsApi && global.Lampa.Storage;
    }
    global.MyLampaSkin = {
        version: VERSION,
        editor: function () { openEditor(true); },
        buttons: function () { return copy(buttons); },
        menu: function () { return collectMenu().map(function (item) { return { key: item.key, title: item.title }; }); },
        setButtons: function (value) { saveButtons(value); },
        refresh: function () { applyAppearance(); }
    };
    function boot() {
        if (ready) return;
        init();
        if (!ready) setTimeout(boot, 250);
    }
    boot();
})(typeof window !== 'undefined' ? window : null);
