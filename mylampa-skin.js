/* MyLampa skin 0.1.0 — optional theme and editable native-menu shortcuts. */
(function (global) {
    'use strict';
    var VERSION = '0.1.0';
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
    var core = { normalizeButtons: normalizeButtons, editButtons: editButtons, safeLink: safeLink, defaults: copy(DEFAULT_BUTTONS) };
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
    var palettes = { blue: '#78a0ff', mint: '#91cdbb', amber: '#deb789', violet: '#b6a2f5' };
    var definitions = [
        ['enabled', 'trigger', true, 'Увімкнути MyLampa skin'],
        ['accent', 'select', 'blue', 'Акцентний колір', { blue: 'Синій', mint: "М'ятний", amber: 'Теплий', violet: 'Фіолетовий' }],
        ['density', 'select', 'comfortable', 'Щільність інтерфейсу', { comfortable: 'Зручна', compact: 'Компактна' }],
        ['radius', 'select', '14', 'Заокруглення карток', { '0': 'Без заокруглення', '8': 'Невелике', '14': 'Помірне', '20': 'Велике' }],
        ['sidebar', 'select', 'rail', 'Бічне меню', { rail: 'Іконки, підписи при відкритті', expanded: 'Іконки та підписи' }],
        ['clock', 'trigger', true, 'Показувати годинник'],
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
        body.toggleClass('mls-compact', enabled && setting('density', 'comfortable') === 'compact');
        body.toggleClass('mls-wide-sidebar', enabled && setting('sidebar', 'rail') === 'expanded');
        body.toggleClass('mls-no-clock', enabled && !setting('clock', true));
        body.toggleClass('mls-no-button-icons', enabled && !setting('button_icons', true));
        var accent = palettes[setting('accent', 'blue')] || palettes.blue;
        var radius = ['0', '8', '14', '20'].indexOf(String(setting('radius', '14'))) >= 0 ? setting('radius', '14') : '14';
        document.documentElement.style.setProperty('--mls-accent', accent);
        document.documentElement.style.setProperty('--mls-radius', radius + 'px');
        renderNavigation();
        resizeHeader();
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
    function editLink(entry) {
        Lampa.Input.edit({ title: 'Адреса — http:// або https://', value: entry ? entry.url : 'https://', free: true, nosave: true }, function (value) {
            if (typeof value !== 'string') { openEditor(false); return; }
            var url = safeLink(value);
            if (!url) { notify('Вкажіть коректне HTTP або HTTPS посилання.'); openEditor(false); return; }
            if (entry) { changeButton(entry.id, 'update', { url: url }); openEditor(false); }
            else {
                Lampa.Input.edit({ title: 'Назва нової кнопки', value: '', free: true, nosave: true }, function (label) {
                    if (typeof label === 'string' && cleanText(label)) changeButton('', 'add', { id: nextId(), type: 'link', url: url, label: cleanText(label), key: '' });
                    openEditor(false);
                });
            }
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
        if (entry.type === 'link') items.splice(1, 0, { title: 'Змінити адресу посилання', action: 'url' });
        if (index > 0) items.push({ title: 'Перемістити ліворуч', action: 'left' });
        if (index < buttons.length - 1) items.push({ title: 'Перемістити праворуч', action: 'right' });
        items.push({ title: 'Видалити верхню кнопку', action: 'remove' });
        showPicker(titleFor(entry), items, function (item) {
            if (item.action === 'rename') { renameButton(entry); return; }
            if (item.action === 'replace') { chooseMenu(id); return; }
            if (item.action === 'icon') { chooseIcon(entry); return; }
            if (item.action === 'url') { editLink(entry); return; }
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
        items.push({ title: 'Додати власне посилання', link: true });
        items.push({ title: 'Відновити стандартні кнопки', reset: true });
        showPicker('Верхні кнопки', items, function (item) {
            if (item.add) chooseMenu();
            else if (item.link) editLink();
            else if (item.reset) resetButtons();
            else editButton(item.id);
        });
    }
    function addSettings() {
        Lampa.SettingsApi.addComponent({ component: COMPONENT, name: 'MyLampa skin', icon: Lampa.Template.string('icon_settings'), after: 'interface' });
        definitions.forEach(function (definition) {
            var param = { name: PREFIX + definition[0], type: definition[1], default: definition[2] };
            if (definition[4]) param.values = definition[4];
            Lampa.SettingsApi.addParam({ component: COMPONENT, param: param, field: { name: definition[3] }, onChange: function () { setTimeout(applyAppearance, 0); } });
        });
        Lampa.SettingsApi.addParam({ component: COMPONENT, param: { type: 'title' }, field: { name: 'Верхня панель' } });
        Lampa.SettingsApi.addParam({ component: COMPONENT, param: { name: PREFIX + 'edit_buttons', type: 'button' }, field: { name: 'Налаштувати верхні кнопки', description: 'Будь-які пункти меню, власні назви, іконки, порядок та посилання.' }, onChange: function () { openEditor(true); } });
        Lampa.SettingsApi.addParam({ component: COMPONENT, param: { type: 'static' }, field: { name: 'Кнопка налаштувань завжди залишається справа.', description: 'Видалення верхньої кнопки повертає її пункт у бічне меню.' } });
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
            'body.mls-enabled .head__title,body.mls-enabled .head__markers,body.mls-enabled .head__time-date,body.mls-enabled .head__time-week{display:none!important}',
            'body.mls-enabled .head__actions{flex:1;min-width:0;align-items:center;gap:.35em}',
            'body.mls-enabled .head__action.open--profile,body.mls-enabled .notice--icon,body.mls-enabled .full--screen{display:none!important}',
            'body.mls-enabled .head__action.open--settings,body.mls-enabled .head__action.open--search{display:flex!important;flex-shrink:0;border-radius:.7em;margin-left:.25em}',
            'body.mls-enabled .head__time{margin:0 0 0 .5em}',
            'body.mls-enabled .head__time-now{font-size:1.15em;font-weight:500;margin:0;color:#b4bfd2}',
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
            'body.mls-enabled .wrap__content{width:calc(100% - var(--mls-rail))!important}',
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
            'body.mls-enabled.mls-compact .items-line{margin-bottom:1.6em}',
            'body.mls-enabled.mls-compact .items-line__head{margin-bottom:.65em}',
            '@media(max-width:900px){body.mls-enabled .mls-top-button{padding:.45em .6em;max-width:11em}body.mls-enabled .head__time{display:none!important}}',
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
            else if (event.name && event.name.indexOf(PREFIX) === 0) applyAppearance();
        });
        Lampa.Listener.follow('activity', function () { setTimeout(updateActive, 0); });
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