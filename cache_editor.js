(function() {
    'use strict';

    const PLUGIN_VERSION = '1.0';

    // ==========================================
    // СТИЛІ (template literal + responsive)
    // ==========================================
    const styles = `
    <style>
        .cache-editor-module { width: 100%; height: 100%; display: flex; flex-direction: column; overflow: hidden; padding: 10px; box-sizing: border-box; }
        .cache-editor-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 15px; padding: 10px 10px 50px 10px; width: 100%; box-sizing: border-box; }
        .cache-card { background: rgba(255,255,255,0.08); border-radius: 12px; height: 160px; padding: 15px; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 3px solid transparent; transition: transform 0.2s; cursor: pointer; overflow: hidden; box-sizing: border-box; position: relative; }
        .cache-card.focus { background: #fff !important; transform: scale(1.08); z-index: 2; position: relative; border-color: #fff; box-shadow: 0 10px 20px rgba(0,0,0,0.4); }
        .cache-card.focus .cc-title, .cache-card.focus .cc-subtitle, .cache-card.focus .cc-desc { color: #000 !important; text-shadow: none !important; }
        .cc-title { font-weight: bold; font-size: 1.15em; margin-bottom: 5px; color: #fff; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; position: relative; z-index: 2; }
        .cc-subtitle { font-size: 0.75em; color: #888; margin-bottom: 10px; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: center; position: relative; z-index: 2; }
        .cc-desc { font-size: 0.95em; font-weight: bold; color: #aaa; width: 100%; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-align: center; word-break: break-word; position: relative; z-index: 2; }
        .cc-bg-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.95)); z-index: 1; }
        .cache-card.has-bg .cc-title { text-shadow: 1px 1px 3px rgba(0,0,0,0.9); }
        .cache-card.has-bg .cc-subtitle { color: #bbb; text-shadow: 1px 1px 2px rgba(0,0,0,0.9); }
        .cache-card.has-bg .cc-desc { color: #ddd; text-shadow: 1px 1px 3px rgba(0,0,0,0.9); }
        .cache-card.control-card { border: 2px dashed rgba(255,255,255,0.35); background: rgba(255,255,255,0.03); height: 90px; }
        .cache-card.control-card.focus { border-color: #fff; }
        .cache-card.control-card .cc-title { font-size: 1.05em; }
        .cache-card.control-card .cc-desc { color: #999; font-weight: normal; font-size: 0.8em; }
        .cache-card.control-card.focus .cc-desc { color: #555 !important; }
        .cache-card.control-danger { border-color: rgba(255,120,120,0.5); }
        .cc-bar-outer { width: 100%; height: 6px; background: rgba(255,255,255,0.15); border-radius: 3px; margin-top: 8px; overflow: hidden; position: relative; z-index: 2; }
        .cc-bar-inner { height: 100%; border-radius: 3px; transition: width 0.3s; }
        .cache-chart-card { grid-column: 1 / -1; background: rgba(255,255,255,0.04); border-radius: 12px; padding: 15px 18px; box-sizing: border-box; }
        .cc-chart-title { font-weight: bold; margin-bottom: 12px; font-size: 1em; color: #fff; }
        .cc-chart-row { display: flex; align-items: center; gap: 10px; margin-bottom: 9px; }
        .cc-chart-row:last-child { margin-bottom: 0; }
        .cc-chart-label { width: 130px; flex-shrink: 0; font-size: 0.85em; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cc-chart-track { flex: 1; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; overflow: hidden; }
        .cc-chart-fill { height: 100%; border-radius: 5px; background: linear-gradient(to right, #4caf50, #8bc34a); }
        .cc-chart-value { width: 72px; flex-shrink: 0; text-align: right; font-size: 0.8em; color: #999; }
        @media (max-width: 768px), (orientation: portrait) {
            .cache-editor-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px; padding: 10px 10px 50px 10px; }
            .cache-card { height: 130px; padding: 10px; }
            .cc-title { font-size: 1em; margin-bottom: 2px; }
            .cc-subtitle { font-size: 0.65em; margin-bottom: 5px; }
            .cc-desc { font-size: 0.85em; -webkit-line-clamp: 2; }
            .cc-chart-label { width: 80px; font-size: 0.75em; }
            .cc-chart-value { width: 55px; font-size: 0.72em; }
        }
    </style>
    `;
    $('head').append(styles);

    // ==========================================
    // УТИЛІТИ
    // ==========================================
    const safeJsonParse = (data, defaultReturn = {}) => {
        if (!data) return defaultReturn;
        try { return JSON.parse(data); }
        catch (e) { return defaultReturn; }
    };

    const safeJsonObject = (data) => {
        const parsed = safeJsonParse(data, {});
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    };

    const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);

    const byteSize = (str) => {
        const s = String(str === null || str === undefined ? '' : str);
        return s.length * 2;
    };

    const formatBytes = (bytes) => {
        const b = bytes || 0;
        if (b < 1024) return b + ' Б';
        if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' КБ';
        return (b / (1024 * 1024)).toFixed(2) + ' МБ';
    };

    const getKeyByteSize = (key) => byteSize(key) + byteSize(localStorage.getItem(key));

    const localHash = (str) => {
        if (window.Lampa && window.Lampa.Utils && typeof window.Lampa.Utils.hash === 'function') {
            return String(window.Lampa.Utils.hash(str));
        }
        let hash = 0;
        const s = String(str);
        for (let i = 0; i < s.length; i++) {
            hash = ((hash << 5) - hash) + s.charCodeAt(i);
            hash |= 0;
        }
        return String(Math.abs(hash));
    };

    // ==========================================
    // КОМПОНЕНТ РЕДАКТОРА
    // ==========================================
    function initCacheEditorActivity() {
        if (Lampa.Component.get('cache_editor_grid')) return;

        Lampa.Component.add('cache_editor_grid', function(object) {
            const self = this;
            const html = $('<div class="cache-editor-module"></div>');
            const scroll = new Lampa.Scroll({ mask: true, over: true, scroll_by_item: true });
            const grid = $('<div class="cache-editor-grid"></div>');

            let action_busy = false;
            let last_back_time = 0;
            let search_query = '';
            let render_limit = 60;
            const PAGE_SIZE = 60;
            const metaCache = Object.create(null);

            let hashIndex = null;
            let paginating = false;

            let groupsCache = { signature: null };
            let keysCache = { signature: null };
            let jsonCache = { signature: null };
            let trashCache = { signature: null };
            let duplicatesCache = { signature: null };

            const TRASH_KEY = 'lampaCacheEditorTrash';
            const TRASH_RETENTION_DAYS = 3;
            const TRASH_MAX_ITEMS = 300;
            const TECHNICAL_KEYS = [TRASH_KEY];

            let sort_mode = 'size';
            let filter_min_kb = 0;

            const isTechnicalKey = (k) => TECHNICAL_KEYS.indexOf(k) !== -1;

            // --- Синхронізація з Lampa.Storage ---
            const writeStorage = (key, value) => {
                localStorage.setItem(key, value);
                if (Lampa.Storage && Lampa.Storage.set) Lampa.Storage.set(key, value);
            };
            const deleteStorage = (key) => {
                localStorage.removeItem(key);
                if (Lampa.Storage && Lampa.Storage.set) {
                    Lampa.Storage.set(key, '');
                    localStorage.removeItem(key);
                }
            };

            // --- Кошик (безпечний) ---
            const getTrash = () => {
                try {
                    const parsed = JSON.parse(localStorage.getItem(TRASH_KEY) || '[]');
                    return Array.isArray(parsed) ? parsed : [];
                } catch (e) { return []; }
            };
            const saveTrash = (arr) => {
                try {
                    localStorage.setItem(TRASH_KEY, JSON.stringify(arr));
                    return true;
                } catch (e) {
                    Lampa.Noty.show('Не вдалося записати кошик: бракує місця');
                    return false;
                }
            };
            const purgeOldTrash = () => {
                const arr = getTrash();
                const cutoff = Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
                const filtered = arr.filter(t => t && t.deletedAt >= cutoff);
                if (filtered.length !== arr.length) saveTrash(filtered);
                return filtered;
            };
            const pushToTrash = (entry) => {
                let arr = purgeOldTrash();
                if (arr.length >= TRASH_MAX_ITEMS) {
                    Lampa.Noty.show('Кошик заповнений; очистіть його або видаліть запис назавжди');
                    return null;
                }
                entry.id = 't_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
                entry.deletedAt = Date.now();
                arr.push(entry);
                return saveTrash(arr) ? entry : null;
            };
            const moveToTrash = (entry, removeFn) => {
                const saved = pushToTrash(entry);
                if (!saved) return false;
                try {
                    removeFn();
                    return true;
                } catch (e) {
                    Lampa.Noty.show('Видалення перервано; копія залишилась у кошику');
                    return false;
                }
            };
            const removeFromTrash = (id) => saveTrash(getTrash().filter(t => t.id !== id));

            const restoreTrashEntry = (entry) => {
                try {
                    if (entry.type === 'key' || entry.type === 'group') {
                        const items = entry.type === 'key' ? [entry.payload] : entry.payload.items;
                        if (items.some(it => {
                            const current = localStorage.getItem(it.key);
                            return current !== null && current !== it.value;
                        })) {
                            Lampa.Noty.show('Відновлення скасовано: ключ уже існує');
                            return false;
                        }
                        items.forEach(it => {
                            if (localStorage.getItem(it.key) === null) writeStorage(it.key, it.value);
                        });
                    } else if (entry.type === 'json_item' || entry.type === 'json_bulk') {
                        const raw = localStorage.getItem(entry.payload.storageKey);
                        const obj = raw === null ? {} : safeJsonParse(raw, null);
                        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error('invalid JSON');
                        const restored = entry.type === 'json_item'
                            ? [[entry.payload.itemKey, entry.payload.itemValue]]
                            : Object.keys(entry.payload.items).map(k => [k, entry.payload.items[k]]);
                        if (restored.some(pair =>
                            Object.prototype.hasOwnProperty.call(obj, pair[0]) &&
                            JSON.stringify(obj[pair[0]]) !== JSON.stringify(pair[1])
                        )) {
                            Lampa.Noty.show('Відновлення скасовано: запис уже існує');
                            return false;
                        }
                        restored.forEach(pair => {
                            if (!Object.prototype.hasOwnProperty.call(obj, pair[0])) {
                                Object.defineProperty(obj, pair[0], {
                                    value: pair[1], enumerable: true, writable: true, configurable: true
                                });
                            }
                        });
                        writeStorage(entry.payload.storageKey, JSON.stringify(obj));
                    } else return false;
                    return removeFromTrash(entry.id);
                } catch (e) {
                    Lampa.Noty.show('Не вдалося відновити запис');
                    return false;
                }
            };

            // --- Дублікати ---
            this.findDuplicateSets = function(useCache) {
                if (useCache && duplicatesCache.signature === 'built' && duplicatesCache.sets) return duplicatesCache.sets;
                const map = Object.create(null);
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (!k || isTechnicalKey(k)) continue;
                    const val = localStorage.getItem(k) || '';
                    if (val.length < 20) continue;
                    const hk = val.length + '_' + localHash(val);
                    if (!map[hk]) map[hk] = [];
                    map[hk].push(k);
                }
                const sets = [];
                for (const hkKey in map) {
                    let candidates = map[hkKey].slice();
                    while (candidates.length > 1) {
                        const refVal = localStorage.getItem(candidates[0]);
                        const confirmed = candidates.filter(kk => localStorage.getItem(kk) === refVal);
                        candidates = candidates.filter(kk => localStorage.getItem(kk) !== refVal);
                        if (confirmed.length > 1) {
                            sets.push({ id: hkKey + '_' + sets.length, keys: confirmed, valueSize: byteSize(refVal) });
                        }
                    }
                }
                sets.sort((a, b) => (b.keys.length * b.valueSize) - (a.keys.length * a.valueSize));
                duplicatesCache = { signature: 'built', sets };
                return sets;
            };

            // --- Hash-індекс метаданих ---
            const buildHashIndex = () => {
                hashIndex = Object.create(null);
                const cards = [];
                const addCard = (c) => {
                    if (!c || typeof c !== 'object') return;
                    cards.push(c);
                    if (c.card) cards.push(c.card);
                    if (c.movie) cards.push(c.movie);
                };

                const hist = Lampa.Storage.get('history', []);
                if (Array.isArray(hist)) hist.forEach(addCard);

                const fav = Lampa.Storage.get('favorite', {});
                for (const fKey in fav) if (Array.isArray(fav[fKey])) fav[fKey].forEach(addCard);

                const ov = Lampa.Storage.get('online_view', {});
                for (const oKey in ov) addCard(ov[oKey]);

                const tv = Lampa.Storage.get('torrents_view', {});
                for (const tKey in tv) addCard(tv[tKey]);

                const uniqueCards = [];
                const seenKeys = Object.create(null);
                cards.forEach(c => {
                    const uniqKey = (c.original_title || c.original_name || c.title || c.name || '') + '_' + (c.id || '');
                    if (uniqKey && !seenKeys[uniqKey]) {
                        seenKeys[uniqKey] = true;
                        uniqueCards.push(c);
                    }
                });

                const register = (hashStr, title, subtitle, card) => {
                    if (hashIndex[hashStr]) return;
                    const imgPath = card.backdrop_path || card.poster_path;
                    hashIndex[hashStr] = {
                        title,
                        subtitle,
                        bg: imgPath ? (imgPath.indexOf('http') === 0 ? imgPath : 'https://image.tmdb.org/t/p/w300' + imgPath) : null
                    };
                };

                uniqueCards.forEach(card => {
                    const origTitle = card.original_title || '';
                    const origName = card.original_name || card.original_title || '';
                    const localTitle = card.title || card.name || '';
                    const idLabel = card.id || 'Невідомо';

                    const registerMovieTitle = (t) => {
                        if (!t) return;
                        register(localHash(t), card.title || card.name || t, 'Фільм (ID: ' + idLabel + ')', card);
                    };
                    registerMovieTitle(origTitle);
                    registerMovieTitle(localTitle);

                    const registerSerialProgress = (nameStr) => {
                        if (!nameStr) return;
                        for (let ep = 1; ep <= 50; ep++) {
                            register(localHash('1' + ep + nameStr), (card.title || card.name || nameStr) + ' (Серія ' + ep + ')', 'Серіал (ID: ' + idLabel + ')', card);
                        }
                    };
                    registerSerialProgress(origName);
                    registerSerialProgress(localTitle);

                    const registerSerialEpisodes = (nameStr) => {
                        if (!nameStr) return;
                        for (let s = 1; s <= 20; s++) {
                            const delimiter = s > 10 ? ':' : '';
                            for (let e = 1; e <= 60; e++) {
                                register(localHash(s + delimiter + e + nameStr), (card.title || card.name || nameStr) + ' (Сезон ' + s + ', Серія ' + e + ')', 'Серіал (ID: ' + idLabel + ')', card);
                            }
                        }
                    };
                    registerSerialEpisodes(origName);
                    registerSerialEpisodes(localTitle);
                });
            };

            this.findMetaForHash = function(hash) {
                const hashStr = String(hash);
                if (!hashIndex) buildHashIndex();
                if (hashIndex[hashStr]) return hashIndex[hashStr];

                const meta = { title: 'Невідомий файл', bg: null, subtitle: 'Хеш: ' + hashStr };

                for (let j = 0; j < localStorage.length; j++) {
                    const key = localStorage.key(j);
                    if (key === object.storage_key) continue;
                    const val = localStorage.getItem(key);
                    if (!val || val.indexOf(hashStr) === -1) continue;

                    try {
                        const parsed = JSON.parse(val);
                        if (typeof parsed === 'object' && parsed !== null) {
                            for (const mKey in parsed) {
                                const movie = parsed[mKey];
                                if (typeof movie === 'object' && movie !== null) {
                                    if (JSON.stringify(movie).indexOf(hashStr) !== -1 || String(movie.id) === hashStr) {
                                        const title = movie.title || movie.name || movie.original_title || (movie.movie && (movie.movie.title || movie.movie.name));
                                        if (title) {
                                            meta.title = title;
                                            const source = key === 'online_view' ? 'Онлайн' : (key === 'torrents_view' ? 'Торрент' : (key === 'history' ? 'Історія' : 'Кеш'));
                                            meta.subtitle = source + ' (ID: ' + (movie.id || mKey) + ')';
                                            const imgPath = movie.backdrop_path || movie.poster_path || (movie.movie && movie.movie.backdrop_path);
                                            if (imgPath) meta.bg = imgPath.indexOf('http') === 0 ? imgPath : 'https://image.tmdb.org/t/p/w300' + imgPath;
                                            return meta;
                                        }
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        if (hashStr.indexOf('http') === 0 && meta.title === 'Невідомий файл') {
                            try {
                                const parts = hashStr.split('/');
                                meta.title = decodeURIComponent(parts[parts.length - 1] || parts[parts.length - 2]);
                            } catch (err) {}
                        }
                    }
                }
                return meta;
            };

            const getMeta = (k) => {
                if (!metaCache[k]) metaCache[k] = self.findMetaForHash(k);
                return metaCache[k];
            };

            // --- UI builders ---
            const createCardNode = (fragment, title, rawId, desc, type, extra) => {
                const safeDesc = typeof desc === 'string' && desc.length > 90 ? desc.substring(0, 90) + '...' : desc;
                const card = $('<div class="cache-card selector"></div>');
                card.attr('data-id', rawId).attr('data-type', type);
                if (extra && extra.bg) {
                    const bg = String(extra.bg);
                    if (/^https?:\/\//i.test(bg)) {
                        card.addClass('has-bg').css({
                            backgroundImage: 'url("' + bg.replace(/["\\\r\n]/g, '') + '")',
                            backgroundSize: 'cover', backgroundPosition: 'center'
                        });
                        card.append($('<div class="cc-bg-overlay"></div>'));
                    }
                }
                card.append($('<div class="cc-title"></div>').text(title));
                if (type !== 'group') {
                    card.append($('<div class="cc-subtitle"></div>').text(extra && extra.rawSubtitle ? extra.rawSubtitle : rawId));
                }
                card.append($('<div class="cc-desc"></div>').text(safeDesc == null ? '' : safeDesc));
                if (extra) card.data('extra', extra);
                $(fragment).append(card);
            };

            const createControlNode = (fragment, title, desc, onEnter, opts = {}) => {
                const card = $('<div class="cache-card selector control-card"></div>');
                card.attr('data-id', '__ctrl_' + title).attr('data-type', 'control');
                if (opts.danger) card.addClass('control-danger');
                if (opts.wide) card.css('grid-column', '1 / -1');
                card.append($('<div class="cc-title"></div>').text(title));
                if (desc) card.append($('<div class="cc-desc"></div>').text(desc));
                if (typeof opts.percent === 'number') {
                    const pct = Math.max(0, Math.min(100, opts.percent));
                    const barColor = pct < 60 ? '#4caf50' : (pct < 85 ? '#ffc107' : '#f44336');
                    const bar = $('<div class="cc-bar-outer"></div>');
                    bar.append($('<div class="cc-bar-inner"></div>').css({ width: pct + '%', background: barColor }));
                    card.append(bar);
                }
                card.data('onEnter', onEnter);
                $(fragment).append(card);
            };

            const buildSizeChartHtml = (namesSortedBySize, sizeMap) => {
                const top = namesSortedBySize.slice(0, 8);
                if (!top.length) return null;
                const maxB = sizeMap[top[0]] || 1;
                const chart = $('<div class="cache-chart-card"></div>');
                chart.append($('<div class="cc-chart-title"></div>').text('📈 Топ груп за розміром'));
                top.forEach(name => {
                    const bytes = sizeMap[name] || 0;
                    const pct = Math.max(4, Math.round((bytes / maxB) * 100));
                    const safeName = name.length > 18 ? name.substring(0, 18) + '…' : name;
                    const row = $('<div class="cc-chart-row"></div>');
                    row.append($('<div class="cc-chart-label"></div>').text(safeName));
                    const track = $('<div class="cc-chart-track"></div>');
                    track.append($('<div class="cc-chart-fill"></div>').css('width', pct + '%'));
                    row.append(track, $('<div class="cc-chart-value"></div>').text(formatBytes(bytes)));
                    chart.append(row);
                });
                return chart;
            };

            // --- Дії UI ---
            this.openSizeFilter = function() {
                Lampa.Input.edit({ title: 'Мінімальний розмір, КБ (0 = без фільтра)', value: String(filter_min_kb || 0), free: true, nosave: true }, (val) => {
                    const num = parseFloat(val);
                    filter_min_kb = (isNaN(num) || num < 0) ? 0 : num;
                    render_limit = PAGE_SIZE;
                    self.buildData();
                    setTimeout(() => Lampa.Controller.toggle('content'), 100);
                });
            };

            const sortLabel = () => sort_mode === 'size' ? 'за розміром' : (sort_mode === 'date' ? 'за датою' : 'за назвою');

            this.openSearch = function() {
                Lampa.Input.edit({ title: 'Пошук', value: search_query, free: true, nosave: true }, (val) => {
                    search_query = (val === undefined || val === null) ? '' : String(val).trim();
                    render_limit = PAGE_SIZE;
                    self.buildData();
                    setTimeout(() => Lampa.Controller.toggle('content'), 100);
                });
            };

            this.clearSearch = function() {
                search_query = '';
                render_limit = PAGE_SIZE;
                self.buildData();
                Lampa.Controller.toggle('content');
            };

            this.bulkCleanup = function(mode) {
                const parsedObj = safeJsonObject(localStorage.getItem(object.storage_key));
                const toDelete = [];
                Object.keys(parsedObj).forEach(k => {
                    const item = parsedObj[k];
                    if (mode === 'watched' && item && typeof item.percent === 'number' && item.percent >= 95) toDelete.push(k);
                    else if (mode === 'orphan') {
                        const meta = getMeta(k);
                        if (!meta || meta.title === 'Невідомий файл') toDelete.push(k);
                    }
                });
                if (!toDelete.length) return Lampa.Noty.show('Немає записів для видалення');

                let freedBytes = 0;
                toDelete.forEach(k => { freedBytes += byteSize(JSON.stringify(parsedObj[k])); });

                Lampa.Select.show({
                    title: 'Видалити ' + toDelete.length + ' записів (' + formatBytes(freedBytes) + ')?',
                    nomark: true,
                    items: [{ title: '✅ Так, видалити', id: 'yes' }, { title: '❌ Скасувати', id: 'no' }],
                    onSelect: (a) => {
                        if (a.id === 'yes') {
                            const trashItems = Object.create(null);
                            toDelete.forEach(k => {
                                trashItems[k] = parsedObj[k];
                                delete parsedObj[k];
                                delete metaCache[k];
                            });
                            if (moveToTrash({
                                type: 'json_bulk',
                                label: 'Масове видалення (' + toDelete.length + ')',
                                sizeBytes: freedBytes,
                                payload: { storageKey: object.storage_key, items: trashItems }
                            }, () => writeStorage(object.storage_key, JSON.stringify(parsedObj)))) {
                                Lampa.Noty.show('Переміщено в кошик: ' + toDelete.length + ' записів');
                                render_limit = PAGE_SIZE;
                                self.buildData();
                            }
                        }
                        Lampa.Controller.toggle('content');
                    },
                    onBack: () => Lampa.Controller.toggle('content')
                });
            };

            this.emptyTrash = function() {
                Lampa.Select.show({
                    title: 'Очистити кошик назавжди?',
                    nomark: true,
                    items: [{ title: '✅ Так, очистити', id: 'yes' }, { title: '❌ Скасувати', id: 'no' }],
                    onSelect: (a) => {
                        if (a.id === 'yes') {
                            if (saveTrash([])) {
                                Lampa.Noty.show('Кошик очищено');
                                self.buildData();
                            }
                        }
                        Lampa.Controller.toggle('content');
                    },
                    onBack: () => Lampa.Controller.toggle('content')
                });
            };

            // --- Делегована логіка карток ---
            this.handleCardEnter = function(card, type, rawId, extra) {
                if (type === 'group') {
                    Lampa.Activity.push({ url: '', title: 'Група: ' + rawId, component: 'cache_editor_grid', level: 'keys', prefix: rawId });
                } else if (type === 'trash_item') {
                    Lampa.Select.show({
                        title: 'Кошик: ' + rawId,
                        nomark: true,
                        items: [
                            { title: '♻ Відновити', id: 'restore' },
                            { title: '🗑 Видалити назавжди', id: 'purge' },
                            { title: 'Скасувати', id: 'cancel' }
                        ],
                        onSelect: (a) => {
                            if (a.id === 'restore') {
                                if (restoreTrashEntry(extra.trashEntry)) {
                                    Lampa.Noty.show('Відновлено');
                                    self.buildData();
                                }
                            } else if (a.id === 'purge') {
                                if (removeFromTrash(extra.trashEntry.id)) {
                                    Lampa.Noty.show('Видалено назавжди');
                                    self.buildData();
                                }
                            }
                            Lampa.Controller.toggle('content');
                        },
                        onBack: () => Lampa.Controller.toggle('content')
                    });
                } else if (type === 'dup_set') {
                    const set = extra.dupSet;
                    const dupItems = set.keys.map((k, i) => {
                        const option = $('<div class="selectbox-item selector"></div>');
                        option.append($('<div class="selectbox-item__title"></div>').text(k));
                        return { title: k, id: 'key_' + i, html: option };
                    });
                    dupItems.push({ title: '🗑 Видалити всі копії, крім однієї', id: 'keep_one' });
                    dupItems.push({ title: 'Скасувати', id: 'cancel' });
                    Lampa.Select.show({
                        title: 'Дублікати (' + set.keys.length + ')',
                        nomark: true,
                        items: dupItems,
                        onSelect: (a) => {
                            if (a.id === 'keep_one') {
                                const keep = set.keys[0];
                                const toRemove = set.keys.slice(1);
                                const keepValue = localStorage.getItem(keep);
                                if (keepValue === null || toRemove.some(k => localStorage.getItem(k) !== keepValue)) {
                                    Lampa.Noty.show('Набір дублікатів змінився, оновіть список');
                                    self.buildData();
                                } else {
                                    const items = toRemove.map(k => ({ key: k, value: localStorage.getItem(k) }));
                                    const size = toRemove.reduce((sum, k) => sum + getKeyByteSize(k), 0);
                                    if (moveToTrash({ type: 'group', label: 'Дублікати (' + keep + ')', sizeBytes: size, payload: { items } }, () => {
                                        toRemove.forEach(deleteStorage);
                                    })) {
                                        Lampa.Noty.show('Копії переміщено в кошик: ' + toRemove.length);
                                        self.buildData();
                                    }
                                }
                                Lampa.Controller.toggle('content');
                            } else if (a.id.indexOf('key_') === 0) {
                                const selectedKey = set.keys[Number(a.id.slice(4))];
                                Lampa.Select.show({
                                    title: selectedKey,
                                    nomark: true,
                                    items: [{ title: '🗑 Видалити цей запис', id: 'del' }, { title: 'Скасувати', id: 'cancel' }],
                                    onSelect: (b) => {
                                        if (b.id === 'del') {
                                            const selectedValue = localStorage.getItem(selectedKey);
                                            if (selectedValue !== null && moveToTrash({
                                                type: 'key',
                                                label: selectedKey,
                                                sizeBytes: getKeyByteSize(selectedKey),
                                                payload: { key: selectedKey, value: selectedValue }
                                            }, () => deleteStorage(selectedKey))) {
                                                Lampa.Noty.show('Видалено (у кошику)');
                                                self.buildData();
                                            }
                                        }
                                        Lampa.Controller.toggle('content');
                                    },
                                    onBack: () => Lampa.Controller.toggle('content')
                                });
                            } else {
                                Lampa.Controller.toggle('content');
                            }
                        },
                        onBack: () => Lampa.Controller.toggle('content')
                    });
                } else if (type === 'key' || type === 'json_item') {
                    const isJson = (type === 'json_item');
                    const storageKey = isJson ? extra.parentKey : rawId;
                    const oldStorageValue = localStorage.getItem(storageKey);
                    const oldVal = isJson ? JSON.stringify(extra.jsonObj[rawId], null, 2) : (oldStorageValue || '');

                    Lampa.Input.edit({ title: 'Редагування (JSON):', value: oldVal, free: true, nosave: true }, (nv) => {
                        if (nv === undefined || nv === null || nv === oldVal) {
                            Lampa.Noty.show('Скасовано (без змін)');
                        } else if (localStorage.getItem(storageKey) !== oldStorageValue) {
                            Lampa.Noty.show('Запис змінився, відкрийте його знову');
                            self.buildData();
                        } else {
                            try {
                                if (isJson) {
                                    extra.jsonObj[rawId] = JSON.parse(nv);
                                    writeStorage(extra.parentKey, JSON.stringify(extra.jsonObj));
                                    Lampa.Noty.show('Збережено');
                                    self.buildData();
                                } else {
                                    writeStorage(rawId, String(nv));
                                    Lampa.Noty.show('Збережено');
                                    self.buildData();
                                }
                            } catch (err) {
                                Lampa.Noty.show(isJson && err instanceof SyntaxError ? 'Помилка: Невірний JSON формат' : 'Не вдалося зберегти запис');
                            }
                        }
                        setTimeout(() => {
                            Lampa.Controller.toggle('content');
                        }, 200);
                    });
                }
            };

            this.handleCardContextMenu = function(card, type, rawId, extra) {
                const menuItems = [];
                if (type === 'group') {
                    menuItems.push({ title: '🗑 Видалити групу', id: 'del' });
                    menuItems.push({ title: '🗑 Видалити групу назавжди', id: 'purge' });
                    menuItems.push({ title: '➕ Створити нову групу', id: 'add' });
                } else if (type === 'key') {
                    menuItems.push({ title: '🗑 Видалити запис', id: 'del' });
                    menuItems.push({ title: '🗑 Видалити запис назавжди', id: 'purge' });
                    menuItems.push({ title: '➕ Створити новий запис', id: 'add' });
                } else if (type === 'json_item') {
                    menuItems.push({ title: '🗑 Видалити таймкод', id: 'del' });
                    menuItems.push({ title: '🗑 Видалити таймкод назавжди', id: 'purge' });
                }
                menuItems.push({ title: 'Скасувати', id: 'cancel' });

                Lampa.Select.show({
                    title: 'Дія: ' + (type === 'group' ? rawId : 'Поточний запис'),
                    nomark: true,
                    items: menuItems,
                    onSelect: (a) => {
                        if (a.id === 'del') {
                            if (type === 'group') {
                                const toDel = [];
                                let freedGroupBytes = 0;
                                const groupItems = [];
                                for (let i = 0; i < localStorage.length; i++) {
                                    const k = localStorage.key(i);
                                    if (k && !isTechnicalKey(k) && (k.split('_')[0] === rawId || k === rawId)) toDel.push(k);
                                }
                                toDel.forEach(k => {
                                    groupItems.push({ key: k, value: localStorage.getItem(k) });
                                    freedGroupBytes += getKeyByteSize(k);
                                });
                                if (!moveToTrash({ type: 'group', label: rawId, sizeBytes: freedGroupBytes, payload: { prefix: rawId, items: groupItems } }, () => {
                                    toDel.forEach(deleteStorage);
                                })) {
                                    Lampa.Controller.toggle('content');
                                    return;
                                }
                                Lampa.Noty.show('Групу ' + escapeHtml(rawId) + ' переміщено в кошик');
                            } else if (type === 'json_item') {
                                const oldItemVal = extra.jsonObj[rawId];
                                if (!moveToTrash({
                                    type: 'json_item',
                                    label: (getMeta(rawId).title || rawId),
                                    sizeBytes: byteSize(JSON.stringify(oldItemVal)),
                                    payload: { storageKey: extra.parentKey, itemKey: rawId, itemValue: oldItemVal }
                                }, () => {
                                    delete extra.jsonObj[rawId];
                                    writeStorage(extra.parentKey, JSON.stringify(extra.jsonObj));
                                })) {
                                    Lampa.Controller.toggle('content');
                                    return;
                                }
                                Lampa.Noty.show('Таймкод переміщено в кошик');
                            } else {
                                const oldKeyVal = localStorage.getItem(rawId);
                                if (oldKeyVal === null || !moveToTrash({
                                    type: 'key',
                                    label: rawId,
                                    sizeBytes: getKeyByteSize(rawId),
                                    payload: { key: rawId, value: oldKeyVal }
                                }, () => deleteStorage(rawId))) {
                                    Lampa.Controller.toggle('content');
                                    return;
                                }
                                Lampa.Noty.show('Запис переміщено в кошик');
                            }
                            const nextFocus = card.next('.selector')[0] || card.prev('.selector')[0];
                            if (nextFocus) object.last_focus = $(nextFocus).attr('data-id');
                            self.buildData();
                            Lampa.Controller.toggle('content');
                        } else if (a.id === 'purge') {
                            Lampa.Select.show({
                                title: 'Видалити назавжди без кошика?',
                                nomark: true,
                                items: [{ title: 'Так, видалити назавжди', id: 'yes' }, { title: 'Скасувати', id: 'cancel' }],
                                onSelect: (confirm) => {
                                    if (confirm.id === 'yes') {
                                        try {
                                            if (type === 'group') {
                                                const keys = [];
                                                for (let i = 0; i < localStorage.length; i++) {
                                                    const key = localStorage.key(i);
                                                    if (key && !isTechnicalKey(key) && (key.split('_')[0] === rawId || key === rawId)) keys.push(key);
                                                }
                                                keys.forEach(deleteStorage);
                                            } else if (type === 'json_item') {
                                                const current = safeJsonParse(localStorage.getItem(extra.parentKey), null);
                                                if (!current || typeof current !== 'object' || Array.isArray(current)) throw new Error('invalid JSON');
                                                delete current[rawId];
                                                writeStorage(extra.parentKey, JSON.stringify(current));
                                            } else {
                                                deleteStorage(rawId);
                                            }
                                            Lampa.Noty.show('Видалено назавжди');
                                            self.buildData();
                                        } catch (e) {
                                            Lampa.Noty.show('Не вдалося видалити запис');
                                        }
                                    }
                                    Lampa.Controller.toggle('content');
                                },
                                onBack: () => Lampa.Controller.toggle('content')
                            });
                        } else if (a.id === 'add') {
                            if (type === 'group') self.createNewGroup();
                            if (type === 'key') self.createNewKey(object.prefix);
                        } else {
                            Lampa.Controller.toggle('content');
                            if (card && card.length) Lampa.Controller.collectionFocus(card[0], scroll.render());
                        }
                    },
                    onBack: () => {
                        Lampa.Controller.toggle('content');
                        if (card && card.length) Lampa.Controller.collectionFocus(card[0], scroll.render());
                    }
                });
            };

            // ==========================================
            // BUILD DATA
            // ==========================================
            this.buildData = function() {
                grid.empty();
                scroll.clear();
                if (typeof scroll.minus === 'function') scroll.minus();
                if (typeof scroll.reset === 'function') scroll.reset();
                const bodyEl = scroll.render().find('.scroll__body');
                if (bodyEl.length) bodyEl.css('transform', 'translate3d(0px, 0px, 0px)');

                const fragment = document.createDocumentFragment();
                let hasItems = false;
                const q = search_query ? search_query.toLowerCase() : '';

                createControlNode(fragment, '🔍 Пошук' + (search_query ? ': ' + search_query : ''), search_query ? 'Натисніть, щоб змінити' : 'Натисніть, щоб шукати', () => self.openSearch());
                if (search_query) createControlNode(fragment, '❌ Скинути пошук', '', () => self.clearSearch());

                const addSortFilterControls = (modes) => {
                    if (modes.indexOf(sort_mode) === -1) sort_mode = modes[0];
                    createControlNode(fragment, '🔀 Сортування: ' + sortLabel(), 'Натисніть, щоб змінити', () => {
                        sort_mode = modes[(modes.indexOf(sort_mode) + 1) % modes.length];
                        self.buildData();
                    });
                    createControlNode(fragment, '📏 Фільтр розміру' + (filter_min_kb > 0 ? ': > ' + filter_min_kb + ' КБ' : ': вимкнено'), 'Натисніть, щоб змінити поріг', () => self.openSizeFilter());
                };

                // --- GROUPS ---
                if (object.level === 'groups') {
                    createControlNode(fragment, '➕ Створити групу', '', () => self.createNewGroup());
                    const groupsSignature = 'groups|' + q + '|' + sort_mode + '|' + filter_min_kb;
                    let groups, groupBytes, allGroupNames, keysArr;

                    if (paginating && groupsCache.signature === groupsSignature) {
                        groups = groupsCache.groups;
                        groupBytes = groupsCache.groupBytes;
                        allGroupNames = groupsCache.allGroupNames;
                        keysArr = groupsCache.keysArr;
                    } else {
                        groups = Object.create(null);
                        groupBytes = Object.create(null);
                        for (let i = 0; i < localStorage.length; i++) {
                            const k = localStorage.key(i);
                            if (!k || isTechnicalKey(k)) continue;
                            const p = k.split('_')[0] || k;
                            if (!groups[p]) { groups[p] = 0; groupBytes[p] = 0; }
                            groups[p]++;
                            groupBytes[p] += getKeyByteSize(k);
                        }
                        allGroupNames = Object.keys(groups);
                        keysArr = allGroupNames;
                        if (q) keysArr = keysArr.filter(p => p.toLowerCase().indexOf(q) !== -1);
                        if (filter_min_kb > 0) keysArr = keysArr.filter(p => (groupBytes[p] / 1024) >= filter_min_kb);
                        if (sort_mode === 'name') keysArr.sort();
                        else keysArr.sort((a, b) => groupBytes[b] - groupBytes[a]);
                        groupsCache = { signature: groupsSignature, groups, groupBytes, allGroupNames, keysArr };
                    }

                    if (!q) {
                        let totalStorageBytes = 0;
                        for (const gKey in groupBytes) totalStorageBytes += groupBytes[gKey];
                        createControlNode(fragment, '📊 Загальний розмір кешу',
                            'Оцінка: ' + formatBytes(totalStorageBytes) + ' • ' + allGroupNames.length + ' груп (без кошика)',
                            () => self.buildData(),
                            { wide: true }
                        );
                        const namesBySize = allGroupNames.slice().sort((a, b) => groupBytes[b] - groupBytes[a]);
                        const chartHtml = buildSizeChartHtml(namesBySize, groupBytes);
                        if (chartHtml) $(fragment).append(chartHtml);
                    }

                    addSortFilterControls(['size', 'name']);
                    const totalGroups = keysArr.length;
                    keysArr.slice(0, render_limit).forEach(p => {
                        createCardNode(fragment, '📁 ' + p, p, groups[p] + ' записів • ' + formatBytes(groupBytes[p]), 'group');
                        hasItems = true;
                    });
                    if (totalGroups > render_limit) {
                        createControlNode(fragment, '▶ Показати ще', (totalGroups - render_limit) + ' груп залишилось', () => {
                            paginating = true;
                            render_limit += PAGE_SIZE;
                            self.buildData();
                            paginating = false;
                        }, { wide: true });
                    }
                }
                // --- KEYS ---
                else if (object.level === 'keys') {
                    const prefix = object.prefix;
                    const keysSignature = 'keys|' + prefix + '|' + q + '|' + sort_mode + '|' + filter_min_kb;
                    let keyNames, keySizeMap, rawKeyNames;

                    if (paginating && keysCache.signature === keysSignature) {
                        keyNames = keysCache.keyNames;
                        keySizeMap = keysCache.keySizeMap;
                        rawKeyNames = keysCache.rawKeyNames;
                    } else {
                        rawKeyNames = [];
                        keySizeMap = Object.create(null);
                        for (let j = 0; j < localStorage.length; j++) {
                            const keyName = localStorage.key(j);
                            if (keyName && !isTechnicalKey(keyName) && (keyName.split('_')[0] === prefix || keyName === prefix)) {
                                rawKeyNames.push(keyName);
                                keySizeMap[keyName] = getKeyByteSize(keyName);
                            }
                        }
                        keyNames = rawKeyNames;
                        if (q) {
                            keyNames = keyNames.filter(keyName => {
                                if (keyName.toLowerCase().indexOf(q) !== -1) return true;
                                const val = localStorage.getItem(keyName) || '';
                                return val.toLowerCase().indexOf(q) !== -1;
                            });
                        }
                        if (filter_min_kb > 0) keyNames = keyNames.filter(kn => (keySizeMap[kn] / 1024) >= filter_min_kb);
                        if (sort_mode === 'name') keyNames.sort();
                        else keyNames.sort((a, b) => keySizeMap[b] - keySizeMap[a]);
                        keysCache = { signature: keysSignature, keyNames, keySizeMap, rawKeyNames };
                    }

                    if (!q) {
                        let groupTotalBytes = 0;
                        rawKeyNames.forEach(kn => { groupTotalBytes += keySizeMap[kn]; });
                        createControlNode(fragment, '📊 Розмір групи «' + prefix + '»',
                            formatBytes(groupTotalBytes) + ' • ' + rawKeyNames.length + ' записів',
                            () => self.buildData(),
                            { wide: true }
                        );
                    }

                    addSortFilterControls(['size', 'name']);
                    const totalKeys = keyNames.length;
                    keyNames.slice(0, render_limit).forEach(keyName => {
                        createCardNode(fragment, '📄 ' + keyName, keyName, localStorage.getItem(keyName) || '', 'key', { rawSubtitle: formatBytes(keySizeMap[keyName]) });
                        hasItems = true;
                    });
                    if (totalKeys > render_limit) {
                        createControlNode(fragment, '▶ Показати ще', (totalKeys - render_limit) + ' записів залишилось', () => {
                            paginating = true;
                            render_limit += PAGE_SIZE;
                            self.buildData();
                            paginating = false;
                        }, { wide: true });
                    }
                }
                // --- JSON (таймкоди) ---
                else if (object.level === 'json') {
                    const parsedObj = safeJsonObject(localStorage.getItem(object.storage_key));

                    if (!q) {
                        createControlNode(fragment, '📊 Розмір даних',
                            formatBytes(getKeyByteSize(object.storage_key)) + ' • ' + Object.keys(parsedObj).length + ' записів',
                            () => self.buildData(),
                            { wide: true }
                        );
                    }

                    createControlNode(fragment, '🧹 Очистити переглянуті', 'Видалити таймкоди з прогресом ≥95%', () => self.bulkCleanup('watched'), { danger: true });
                    createControlNode(fragment, '🧹 Видалити невідомі', 'Видалити записи без визначеної назви', () => self.bulkCleanup('orphan'), { danger: true });

                    const jsonSignature = 'json|' + object.storage_key + '|' + q + '|' + sort_mode + '|' + filter_min_kb;
                    let pKeys, jsonSizeMap, dateField;

                    if (paginating && jsonCache.signature === jsonSignature) {
                        pKeys = jsonCache.pKeys;
                        jsonSizeMap = jsonCache.jsonSizeMap;
                        dateField = jsonCache.dateField;
                    } else {
                        pKeys = Object.keys(parsedObj);
                        jsonSizeMap = Object.create(null);
                        pKeys.forEach(k => { jsonSizeMap[k] = byteSize(JSON.stringify(parsedObj[k])); });

                        dateField = null;
                        const dateCandidates = ['date', 'timestamp', 'updated', 'watched_at', 'mtime', 'utime', 'atime', 'time_added'];
                        findDate: for (let dpk = 0; dpk < pKeys.length && dpk < 30; dpk++) {
                            const dItem = parsedObj[pKeys[dpk]];
                            if (dItem && typeof dItem === 'object') {
                                for (let dci = 0; dci < dateCandidates.length; dci++) {
                                    if (typeof dItem[dateCandidates[dci]] === 'number') {
                                        dateField = dateCandidates[dci];
                                        break findDate;
                                    }
                                }
                            }
                        }

                        if (q) {
                            pKeys = pKeys.filter(k => {
                                const meta = getMeta(k);
                                return k.toLowerCase().indexOf(q) !== -1 ||
                                    (meta.title && meta.title.toLowerCase().indexOf(q) !== -1) ||
                                    (meta.subtitle && meta.subtitle.toLowerCase().indexOf(q) !== -1);
                            });
                        }
                        if (filter_min_kb > 0) pKeys = pKeys.filter(k => (jsonSizeMap[k] / 1024) >= filter_min_kb);

                        if (sort_mode === 'name') pKeys.sort((a, b) => getMeta(a).title.localeCompare(getMeta(b).title));
                        else if (sort_mode === 'date' && dateField) pKeys.sort((a, b) => (parsedObj[b][dateField] || 0) - (parsedObj[a][dateField] || 0));
                        else pKeys.sort((a, b) => jsonSizeMap[b] - jsonSizeMap[a]);

                        jsonCache = { signature: jsonSignature, pKeys, jsonSizeMap, dateField };
                    }

                    addSortFilterControls(dateField ? ['size', 'name', 'date'] : ['size', 'name']);

                    const totalJson = pKeys.length;
                    if (totalJson > 0) {
                        pKeys.slice(0, render_limit).forEach(k => {
                            const item = parsedObj[k];
                            const meta = getMeta(k);
                            let desc = JSON.stringify(item);
                            if (item && item.percent !== undefined) {
                                const m = Math.floor((item.time || 0) / 60);
                                const s = String(Math.floor((item.time || 0) % 60)).padStart(2, '0');
                                const md = Math.floor((item.duration || 0) / 60);
                                const sd = String(Math.floor((item.duration || 0) % 60)).padStart(2, '0');
                                desc = '⏳ ' + item.percent + '% ( ' + m + ':' + s + ' / ' + md + ':' + sd + ' )';
                            }
                            createCardNode(fragment, meta.title, k, desc, 'json_item', {
                                bg: meta.bg,
                                parentKey: object.storage_key,
                                jsonObj: parsedObj,
                                rawSubtitle: meta.subtitle + ' • ' + formatBytes(jsonSizeMap[k])
                            });
                            hasItems = true;
                        });
                    }
                    if (totalJson > render_limit) {
                        createControlNode(fragment, '▶ Показати ще', (totalJson - render_limit) + ' записів залишилось', () => {
                            paginating = true;
                            render_limit += PAGE_SIZE;
                            self.buildData();
                            paginating = false;
                        }, { wide: true });
                    }
                }
                // --- TRASH ---
                else if (object.level === 'trash') {
                    const trashSignature = 'trash|' + q;
                    let trashArr;

                    if (paginating && trashCache.signature === trashSignature) {
                        trashArr = trashCache.trashArr;
                    } else {
                        trashArr = purgeOldTrash();
                        trashArr.sort((a, b) => b.deletedAt - a.deletedAt);
                        if (q) trashArr = trashArr.filter(t => (t.label || t.type || '').toLowerCase().indexOf(q) !== -1);
                        trashCache = { signature: trashSignature, trashArr };
                    }

                    if (!q && trashArr.length) {
                        let trashTotalBytes = 0;
                        trashArr.forEach(t => { trashTotalBytes += (t.sizeBytes || 0); });
                        createControlNode(fragment, '🗑 У кошику',
                            formatBytes(trashTotalBytes) + ' • ' + trashArr.length + ' записів • займає місце до очищення',
                            () => self.buildData(),
                            { wide: true }
                        );
                        createControlNode(fragment, '🧹 Очистити кошик назавжди', 'Видалити всі записи без можливості відновлення', () => self.emptyTrash(), { danger: true, wide: true });
                    }

                    const totalTrash = trashArr.length;
                    trashArr.slice(0, render_limit).forEach(t => {
                        const dateLabel = new Date(t.deletedAt).toLocaleString();
                        const typeLabel = t.type === 'group' ? 'Група' : (t.type === 'json_item' ? 'Таймкод' : (t.type === 'json_bulk' ? 'Масове видалення' : 'Запис'));
                        createCardNode(fragment, '🗑 ' + (t.label || t.type), t.id, typeLabel + ' • видалено ' + dateLabel, 'trash_item', {
                            rawSubtitle: formatBytes(t.sizeBytes || 0),
                            trashEntry: t
                        });
                        hasItems = true;
                    });
                    if (totalTrash > render_limit) {
                        createControlNode(fragment, '▶ Показати ще', (totalTrash - render_limit) + ' записів залишилось', () => {
                            paginating = true;
                            render_limit += PAGE_SIZE;
                            self.buildData();
                            paginating = false;
                        }, { wide: true });
                    }
                }
                // --- DUPLICATES ---
                else if (object.level === 'duplicates') {
                    let dupSets = self.findDuplicateSets(paginating);
                    if (q) dupSets = dupSets.filter(s => s.keys.join(' ').toLowerCase().indexOf(q) !== -1);

                    if (!q && dupSets.length) {
                        let wastedBytes = 0;
                        dupSets.forEach(s => { wastedBytes += s.valueSize * (s.keys.length - 1); });
                        createControlNode(fragment, '🧬 Знайдено дублікатів',
                            dupSets.length + ' наборів • повторюються дані на ' + formatBytes(wastedBytes),
                            () => self.buildData(),
                            { wide: true }
                        );
                    }

                    const totalDup = dupSets.length;
                    dupSets.slice(0, render_limit).forEach(s => {
                        const sample = s.keys.slice(0, 3).join(', ') + (s.keys.length > 3 ? '…' : '');
                        createCardNode(fragment, '🧬 ' + s.keys.length + ' копії', s.id, sample, 'dup_set', {
                            rawSubtitle: formatBytes(s.valueSize) + ' кожна • ' + formatBytes(s.valueSize * s.keys.length) + ' разом',
                            dupSet: s
                        });
                        hasItems = true;
                    });
                    if (totalDup > render_limit) {
                        createControlNode(fragment, '▶ Показати ще', (totalDup - render_limit) + ' наборів залишилось', () => {
                            paginating = true;
                            render_limit += PAGE_SIZE;
                            self.buildData();
                            paginating = false;
                        }, { wide: true });
                    }
                    if (!dupSets.length && !q) {
                        $(fragment).append('<div style="grid-column: 1 / -1; padding: 3em; text-align: center; font-size: 1.3em;">Дублікатів не знайдено 🎉</div>');
                        hasItems = true;
                    }
                }

                if (!hasItems) {
                    if (search_query) {
                        $(fragment).append($('<div style="grid-column: 1 / -1; padding: 3em; text-align: center; font-size: 1.3em;"></div>').text('Нічого не знайдено за запитом «' + search_query + '»'));
                    } else if (object.level === 'keys') {
                        createControlNode(fragment, '➕ Створити перший запис', '', () => self.createNewKey(object.prefix));
                    } else {
                        $(fragment).append('<div style="grid-column: 1 / -1; padding: 3em; text-align: center; font-size: 1.3em;">Список порожній</div>');
                    }
                }

                grid.append(fragment);
                scroll.append(grid);
            };

            this.createNewGroup = function() {
                Lampa.Input.edit({ title: 'Префікс нової групи', value: '', free: true, nosave: true }, (newPrefix) => {
                    if (newPrefix && newPrefix.trim()) {
                        const key = newPrefix.trim() + '_new_record';
                        if (key === TRASH_KEY || localStorage.getItem(key) !== null) {
                            Lampa.Noty.show('Ключ уже існує');
                        } else {
                            try {
                                writeStorage(key, 'новий запис');
                                self.buildData();
                            } catch (e) {
                                Lampa.Noty.show('Не вдалося створити групу');
                            }
                        }
                    }
                    setTimeout(() => Lampa.Controller.toggle('content'), 100);
                });
            };

            this.createNewKey = function(prefix) {
                Lampa.Input.edit({ title: 'Ключ (починайте з ' + escapeHtml(prefix) + '_):', value: prefix + '_', free: true, nosave: true }, (newKey) => {
                    if (newKey && newKey.trim()) {
                        newKey = newKey.trim();
                        if (newKey.indexOf(prefix + '_') !== 0 || isTechnicalKey(newKey)) {
                            Lampa.Noty.show('Ключ має починатися з ' + escapeHtml(prefix) + '_');
                            Lampa.Controller.toggle('content');
                            return;
                        }
                        if (localStorage.getItem(newKey) !== null) {
                            Lampa.Noty.show('Ключ уже існує');
                            Lampa.Controller.toggle('content');
                            return;
                        }
                        setTimeout(() => {
                            Lampa.Input.edit({ title: 'Значення для ' + escapeHtml(newKey) + ':', value: '', free: true, nosave: true }, (newVal) => {
                                if (newVal !== undefined && newVal !== null) {
                                    try {
                                        writeStorage(newKey, String(newVal));
                                        self.buildData();
                                    } catch (e) {
                                        Lampa.Noty.show('Не вдалося створити запис');
                                    }
                                }
                                setTimeout(() => Lampa.Controller.toggle('content'), 100);
                            });
                        }, 300);
                    } else {
                        setTimeout(() => Lampa.Controller.toggle('content'), 100);
                    }
                });
            };

            this.create = function() {
                purgeOldTrash();

                if (!grid.data('events_bound')) {
                    const eventCard = (event) => {
                        let node = event.target;
                        while (node && node !== grid[0]) {
                            if (node.nodeType === 1 && $(node).hasClass('cache-card')) return $(node);
                            node = node.parentNode;
                        }
                        return null;
                    };

                    grid[0].addEventListener('hover:focus', (event) => {
                        const card = eventCard(event);
                        if (!card) return;
                        object.last_focus = card.attr('data-id');
                        scroll.update(card);
                    }, true);

                    grid[0].addEventListener('hover:enter', (event) => {
                        const card = eventCard(event);
                        if (!card) return;
                        if (action_busy) return;
                        action_busy = true;
                        setTimeout(() => { action_busy = false; }, 300);

                        const type = card.attr('data-type');
                        if (type === 'control') {
                            const cb = card.data('onEnter');
                            if (cb) cb();
                            return;
                        }
                        self.handleCardEnter(card, type, card.attr('data-id'), card.data('extra'));
                    }, true);

                    const openContextMenu = (event) => {
                        if (event.type === 'contextmenu') { event.preventDefault(); event.stopPropagation(); }
                        const card = eventCard(event);
                        if (!card || card.attr('data-type') === 'control') return;
                        if (action_busy) return;
                        action_busy = true;
                        setTimeout(() => { action_busy = false; }, 1000);

                        self.handleCardContextMenu(card, card.attr('data-type'), card.attr('data-id'), card.data('extra'));
                    };
                    grid[0].addEventListener('hover:long', openContextMenu, true);
                    grid[0].addEventListener('contextmenu', openContextMenu, true);

                    grid.data('events_bound', true);
                }

                this.buildData();
                html.append(scroll.render());
                return this.render();
            };

            this.start = function() {
                Lampa.Controller.add('content', {
                    toggle: () => {
                        Lampa.Controller.collectionSet(scroll.render());
                        const elements = scroll.render().find('.selector');
                        let target = false;
                        if (object.last_focus) {
                            elements.each(function() {
                                if ($(this).attr('data-id') === object.last_focus) target = this;
                            });
                        }
                        if (!target && elements.length) target = elements.eq(0)[0];
                        Lampa.Controller.collectionFocus(target || false, scroll.render());
                    },
                    left: () => {
                        if (window.Navigator && window.Navigator.canmove('left')) window.Navigator.move('left');
                        else Lampa.Controller.toggle('menu');
                    },
                    right: () => { if (window.Navigator && window.Navigator.canmove('right')) window.Navigator.move('right'); },
                    up: () => {
                        if (window.Navigator && window.Navigator.canmove('up')) window.Navigator.move('up');
                        else Lampa.Controller.toggle('head');
                    },
                    down: () => { if (window.Navigator && window.Navigator.canmove('down')) window.Navigator.move('down'); },
                    back: () => {
                        const now = Date.now();
                        if (now - last_back_time < 500) return;
                        last_back_time = now;
                        Lampa.Activity.backward();
                    }
                });
                Lampa.Controller.toggle('content');
            };

            this.pause = function() {};
            this.stop = function() {};
            this.render = function() { return html; };
            this.destroy = function() { scroll.destroy(); html.remove(); };
        });
    }

    // ==========================================
    // ІНІЦІАЛІЗАЦІЯ
    // ==========================================
    function initPlugin() {
        window.lampac_cache_editor_plugin = true;
        initCacheEditorActivity();

        Lampa.SettingsApi.addComponent({
            component: 'local_cache_editor_menu',
            icon: '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
            name: 'Редактор Кешу'
        });

        Lampa.SettingsApi.addParam({
            component: 'local_cache_editor_menu',
            param: { type: 'button' },
            field: { name: 'ℹ️ Версія: ' + PLUGIN_VERSION },
            onChange: () => Lampa.Noty.show('Редактор Кешу • Версія ' + PLUGIN_VERSION)
        });

        Lampa.SettingsApi.addParam({
            component: 'local_cache_editor_menu',
            param: { type: 'button' },
            field: { name: '🛠 Відкрити загальний редактор кешу' },
            onChange: () => Lampa.Activity.push({ url: '', title: 'Редактор Кешу', component: 'cache_editor_grid', level: 'groups' })
        });

        Lampa.SettingsApi.addParam({
            component: 'local_cache_editor_menu',
            param: { type: 'button' },
            field: { name: '⏱ Відкрити редактор Таймкодів' },
            onChange: () => {
                const tcKey = (typeof Lampa.Timeline === 'object' && typeof Lampa.Timeline.filename === 'function') ? Lampa.Timeline.filename() : 'file_view';
                Lampa.Activity.push({ url: '', title: 'Редактор Таймкодів', component: 'cache_editor_grid', level: 'json', storage_key: tcKey });
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'local_cache_editor_menu',
            param: { type: 'button' },
            field: { name: '🗑 Кошик (відновити видалене)' },
            onChange: () => Lampa.Activity.push({ url: '', title: 'Кошик', component: 'cache_editor_grid', level: 'trash' })
        });

        Lampa.SettingsApi.addParam({
            component: 'local_cache_editor_menu',
            param: { type: 'button' },
            field: { name: '🧬 Знайти дублікати кешу' },
            onChange: () => Lampa.Activity.push({ url: '', title: 'Дублікати', component: 'cache_editor_grid', level: 'duplicates' })
        });
    }

    const checkTimer = setInterval(() => {
        if (window.Lampa && window.Lampa.SettingsApi && typeof window.Lampa.Platform !== 'undefined') {
            if (!window.lampac_cache_editor_plugin) initPlugin();
            clearInterval(checkTimer);
        }
    }, 500);

})();
