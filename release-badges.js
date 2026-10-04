(function () {
    'use strict';

    var CACHE_TTL = 2 * 60 * 60 * 1000;
    var EMPTY_TTL = 10 * 60 * 1000;
    var ERROR_TTL = 60 * 1000;
    var MAX_CACHE = 150;
    var DISK_CACHE_KEY = 'release_badges_disk_v1';
    var DISK_MAX = 300;
    var DISK_TTL = 24 * 60 * 60 * 1000;
    var DISK_EMPTY_TTL = 30 * 60 * 1000;
    var DISK_SAVE_DELAY = 10000;
    var MAX_QUEUE = 12;
    var REQUEST_GAP_MS = 2500;
    var REQUEST_WINDOW_MS = 60000;
    var REQUESTS_PER_WINDOW = 12;
    var REQUEST_TIMEOUT = 20000;
    var ANALYSE_LIMIT = 200;
    var LOAD_IDLE_MS = 700;
    var cache = {};
    var diskCache = null;
    var diskDirty = false;
    var diskSaveTimer = null;
    var pending = {};
    var queue = [];
    var activeTask = null;
    var requestStarts = [];
    var pumpTimer = null;
    var sourceVersion = 0;
    var viewVersion = 0;
    var settingsRefreshTimer = null;
    var cardObserver = null;
    var viewRoot = null;
    var fullMovie = null;
    var scanTimer = null;
    var lastActivity = 0;
    var MESSAGES = {
        uk: {
            settings_menu: 'Мітки релізів: якість та аудіо',
            settings_source: 'Джерело міток: парсер Lampa (розділ «Парсер»)',
            settings_enabled: 'Показувати мітки релізів',
            settings_quality: 'Показувати якість',
            settings_hdr: 'Показувати HDR / Dolby Vision',
            settings_ua: 'Показувати аудіо UA',
            settings_ru: 'Показувати аудіо RU',
            settings_en: 'Показувати аудіо EN',
            settings_rating: 'Показувати рейтинг TMDB',
            badge_audio: 'Знайдено реліз з аудіо {language}',
            badge_audio_quality: 'Знайдено реліз з аудіо {language} та якістю {quality}',
            badge_quality: 'Знайдено реліз у якості {quality}',
            badge_dv: 'Знайдено реліз з Dolby Vision',
            badge_hdr: 'Знайдено реліз з HDR',
            badge_rating: 'Рейтинг TMDB'
        },
        ru: {
            settings_menu: 'Метки релизов',
            settings_source: 'Источник меток: парсер Lampa (раздел «Парсер»)',
            settings_enabled: 'Показывать метки релизов',
            settings_quality: 'Показывать качество',
            settings_hdr: 'Показывать HDR / Dolby Vision',
            settings_ua: 'Показывать аудио UA',
            settings_ru: 'Показывать аудио RU',
            settings_en: 'Показывать аудио EN',
            settings_rating: 'Показывать рейтинг TMDB',
            badge_audio: 'Найден релиз с аудио {language}',
            badge_audio_quality: 'Найден релиз с аудио {language} и качеством {quality}',
            badge_quality: 'Найден релиз в качестве {quality}',
            badge_dv: 'Найден релиз с Dolby Vision',
            badge_hdr: 'Найден релиз с HDR',
            badge_rating: 'Рейтинг TMDB'
        },
        en: {
            settings_menu: 'Release badges',
            settings_source: 'Badge source: Lampa parser (Parser settings)',
            settings_enabled: 'Show release badges',
            settings_quality: 'Show quality',
            settings_hdr: 'Show HDR / Dolby Vision',
            settings_ua: 'Show UA audio',
            settings_ru: 'Show RU audio',
            settings_en: 'Show EN audio',
            settings_rating: 'Show TMDB rating',
            badge_audio: 'Found a release with {language} audio',
            badge_audio_quality: 'Found a {quality} release with {language} audio',
            badge_quality: 'Found a {quality} release',
            badge_dv: 'Found a release with Dolby Vision',
            badge_hdr: 'Found a release with HDR',
            badge_rating: 'TMDB rating'
        }
    };

    function localizedText(key, language, values) {
        var code = String(language || '').toLowerCase();
        var phrase = (MESSAGES[code] || MESSAGES.en)[key] || MESSAGES.en[key] || key;
        return phrase.replace(/\{(\w+)\}/g, function (match, name) {
            return values && values[name] != null ? String(values[name]) : match;
        });
    }

    function normal(text) {
        return String(text || '').toLowerCase()
            .replace(/[^a-z0-9\u0400-\u04ff]+/g, ' ')
            .replace(/\s+/g, ' ').trim();
    }

    function movieIdentity(movie) {
        var series = Boolean(movie.original_name || movie.first_air_date || movie.number_of_seasons);
        var title = movie.original_title || movie.original_name || movie.title || movie.name || '';
        var translated = movie.title || movie.name || '';
        var year = String(movie.release_date || movie.first_air_date || '').slice(0, 4);
        return {
            id: String(movie.id || ''),
            series: series,
            title: String(title).trim(),
            translated: String(translated).trim(),
            year: /^\d{4}$/.test(year) ? year : ''
        };
    }

    function matchesTitle(releaseTitle, movie) {
        var release = ' ' + normal(releaseTitle) + ' ';
        var names = [movie.title, movie.translated];
        var matched = false;
        for (var i = 0; i < names.length; i++) {
            var name = normal(names[i]);
            if (name.length >= 3 && release.indexOf(' ' + name + ' ') !== -1) matched = true;
        }
        if (!movie.series && movie.year) {
            var years = release.match(/\b(?:19|20)\d{2}\b/g) || [];
            if (years.length && years.indexOf(movie.year) === -1) return false;
        }
        return matched;
    }

    function qualityFrom(item) {
        var fields = [item.quality, item.resolution, item.Resolution,
            item.info && item.info.quality, item.Title || item.title];
        var best = 0;
        for (var i = 0; i < fields.length; i++) {
            var value = String(fields[i] == null ? '' : fields[i]);
            var quality = 0;
            if (/(?:^|[^0-9])(?:2160|4k|uhd)(?:p|[^0-9a-z]|$)/i.test(value)) quality = 2160;
            else if (/(?:^|[^0-9])(?:1080|full[ ._-]?hd|fhd)(?:p|i|[^0-9a-z]|$)/i.test(value)) quality = 1080;
            else if (/(?:^|[^0-9])(?:720|hd)(?:p|[^0-9a-z]|$)/i.test(value)) quality = 720;
            if (quality > best) best = quality;
        }
        return best;
    }

    function markLanguage(text, found) {
        var value = ' ' + String(text || '').toLowerCase() + ' ';
        var boundary = '[^a-zа-яіїєґ]';
        if (new RegExp(boundary + '(?:ua|uk|ukr|ukrainian|українськ[а-яіїєґ]*|украинск[а-яіїєґ]*|укр)' + boundary, 'i').test(value)) found.ua = true;
        if (new RegExp(boundary + '(?:ru|rus|russian|русск[а-яіїєґ]*|російськ[а-яіїєґ]*|рус)' + boundary, 'i').test(value)) found.ru = true;
        if (new RegExp(boundary + '(?:en|eng|english|английск[а-яіїєґ]*|англійськ[а-яіїєґ]*|англ)' + boundary, 'i').test(value)) found.en = true;
    }

    function readAudio(value, found, depth) {
        if (depth > 3 || value == null) return;
        if (typeof value === 'string' || typeof value === 'number') {
            markLanguage(value, found);
        } else if (Array.isArray(value)) {
            for (var i = 0; i < Math.min(value.length, 12); i++) readAudio(value[i], found, depth + 1);
        } else if (typeof value === 'object') {
            var keys = Object.keys(value).slice(0, 12);
            for (var j = 0; j < keys.length; j++) {
                var key = keys[j];
                if (key === 'subtitles' || key === 'subtitle') continue;
                if (key === 'language' || key === 'lang' || key === 'name' || key === 'title' || key === 'code') {
                    readAudio(value[key], found, depth + 1);
                } else if (/^(?:ua|uk|ukr|ru|rus|en|eng)$/i.test(key) && value[key]) {
                    markLanguage(key, found);
                }
            }
        }
    }

    function languagesFrom(item) {
        var found = { ua: false, ru: false, en: false };
        readAudio(item.audio_languages, found, 0);
        readAudio(item.audioLanguages, found, 0);
        readAudio(item.audio, found, 0);
        readAudio(item.languages, found, 0);
        if (item.info) readAudio(item.info.audio_languages, found, 0);

        if (Array.isArray(item.ffprobe)) {
            var streams = item.ffprobe;
            var maxS = Math.min(streams.length, 15);
            for (var s = 0; s < maxS; s++) {
                var stream = streams[s];
                if (stream && (stream.codec_type === 'audio' || stream.type === 'audio')) {
                    readAudio(stream.tags && stream.tags.language, found, 0);
                    readAudio(stream.language, found, 0);
                }
            }
        }

        var title = String(item.Title || item.title || '');
        title = title.replace(/\[[^\]]*(?:subtitles?|subs?|субтитр)[^\]]*\]/ig, ' ')
            .replace(/\([^)]*(?:subtitles?|subs?|субтитр)[^)]*\)/ig, ' ')
            .replace(/(?:subtitles?|subs?|субтитр[а-я]*)\s*[:=-]?\s*(?:(?:UA|UKR|RU|RUS|EN|ENG)\b[\s,/+]*)+/ig, ' ');
        var tags = title.match(/[[(][^\])]{1,60}[\])]/g) || [];
        for (var t = 0; t < tags.length; t++) markLanguage(tags[t], found);

        var codes = title.match(/(?:^|[\s._-])(?:UA|UKR|RU|RUS|EN|ENG)(?=$|[\s._-])/g) || [];
        for (var c = 0; c < codes.length; c++) markLanguage(codes[c], found);

        var audioLabel = /(?:audio|dubbed|dub|voice|озвучка|озвучення|дубляж|звук|мова|язык)\s*[:=-]?\s*([^\[\]()]{1,50})/ig;
        var match;
        while ((match = audioLabel.exec(title))) markLanguage(match[1], found);
        return found;
    }

    function videoTypeFrom(item) {
        var title = String(item.Title || item.title || '');
        var type = String(item.videotype || item.videoType ||
            (item.info && item.info.videotype) || '');
        var dolby = item.dolbyVision === true || /dolby[ ._-]?vision|\bdovi\b/i.test(title + ' ' + type) ||
            /(?:^|[\s.[(])DV(?:$|[\s.\])])/i.test(title);
        if (dolby) return 'DV';
        return item.hdr === true || /\bhdr(?:10\+?|ip)?\b/i.test(title + ' ' + type) ? 'HDR' : '';
    }

    function analyse(results, movie) {
        var summary = { quality: 0, ua: null, ru: null, en: null,
            hdr: false, dv: false, matches: 0 };
        if (!Array.isArray(results)) return summary;
        var list = results;
        var len = Math.min(list.length, ANALYSE_LIMIT);
        for (var i = 0; i < len; i++) {
            var item = list[i];
            if (!item || !matchesTitle(item.Title || item.title, movie)) continue;
            var quality = qualityFrom(item);
            var langs = languagesFrom(item);
            var videoType = videoTypeFrom(item);
            summary.matches++;
            if (quality > summary.quality) summary.quality = quality;
            if (videoType === 'DV') summary.dv = true;
            if (videoType) summary.hdr = true;
            if (langs.ua && (summary.ua === null || quality > summary.ua)) summary.ua = quality;
            if (langs.ru && (summary.ru === null || quality > summary.ru)) summary.ru = quality;
            if (langs.en && (summary.en === null || quality > summary.en)) summary.en = quality;
        }
        return summary;
    }

    function qualityLabel(quality) {
        return quality >= 2160 ? '4K' : quality >= 1080 ? '1080p' : quality >= 720 ? '720p' : '';
    }

    function tmdbRating(movie) {
        var rating = Number(movie && movie.vote_average);
        return isFinite(rating) && rating > 0 && rating <= 10 ? rating : 0;
    }

    function summarySignature(summary, movie) {
        if (!summary) {
            var r = tmdbRating(movie);
            return 'null|' + (r ? r.toFixed(1) : '0') + '|' +
                setting('release_badges_enabled', true) + '|' +
                setting('release_badges_rating', true);
        }
        return [
            summary.quality || 0,
            summary.ua === null ? 'n' : summary.ua,
            summary.ru === null ? 'n' : summary.ru,
            summary.en === null ? 'n' : summary.en,
            summary.hdr ? 1 : 0,
            summary.dv ? 1 : 0,
            tmdbRating(movie) ? tmdbRating(movie).toFixed(1) : '0',
            setting('release_badges_enabled', true),
            setting('release_badges_quality', true),
            setting('release_badges_hdr', true),
            setting('release_badges_ua', true),
            setting('release_badges_ru', true),
            setting('release_badges_en', true),
            setting('release_badges_rating', true)
        ].join('|');
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { movieIdentity: movieIdentity, matchesTitle: matchesTitle,
            qualityFrom: qualityFrom, languagesFrom: languagesFrom, analyse: analyse,
            videoTypeFrom: videoTypeFrom, tmdbRating: tmdbRating,
            searchCandidates: searchCandidates, localizedText: localizedText };
    }
    if (typeof window === 'undefined') return;

    function setting(name, fallback) {
        try {
            var value = window.Lampa.Storage.get(name, fallback);
            return value === true || value === 'true' || value === 1 || value === '1';
        } catch (e) { return fallback; }
    }

    function field(name) {
        try {
            var storage = window.Lampa.Storage;
            return storage.field ? storage.field(name) : storage.get(name, '');
        } catch (e) { return ''; }
    }

    function currentLanguage() {
        try { return window.Lampa.Storage.get('language', 'ru'); }
        catch (e) { return 'ru'; }
    }

    function label(key, values) {
        return localizedText(key, currentLanguage(), values);
    }

    function sourceReady() {
        if (!window.Lampa || !Lampa.Parser || typeof Lampa.Parser.get !== 'function') return false;
        if (!setting('parser_use', false)) return false;
        var type = field('parser_torrent_type');
        if (type === 'jackett' || type === 'prowlarr') {
            var primary = field(type + '_url');
            var secondary = field(type + '_url_two');
            var use = field('parser_use_link') || 'one';
            return Boolean(use === 'two' ? secondary : use === 'both' ? primary || secondary : primary);
        }
        if (type === 'torrserver') {
            return Boolean(field(field('torrserver_use_link') === 'two' ?
                'torrserver_url_two' : 'torrserver_url'));
        }
        return false;
    }

    function compactMovie(movie) {
        var result = {};
        // Never retain a card, component, or arbitrary nested data in a parser task.
        ['id', 'source', 'title', 'name', 'original_title', 'original_name',
            'release_date', 'first_air_date', 'number_of_seasons', 'original_language',
            'vote_average'].forEach(function (key) {
            if (typeof movie[key] === 'string' || typeof movie[key] === 'number') result[key] = movie[key];
        });
        result.title = result.title || result.name || '';
        result.original_title = result.original_title || result.original_name || result.title;
        result.genres = Array.isArray(movie.genres) ? movie.genres.slice(0, 20).map(function (genre) {
            return { id: Number(genre && genre.id) || 0, name: String(genre && genre.name || '') };
        }) : [];
        return result;
    }

    function searchCandidates(info) {
        var original = info.title || info.translated;
        var local = info.translated || original;
        var year = info.series ? '' : info.year;
        var requested = [original, local];
        var seen = {};
        return requested.filter(function (part) {
            if (!part || seen[normal(part)]) return false;
            seen[normal(part)] = true;
            return true;
        }).map(function (part) { return part + (year ? ' ' + year : ''); });
    }

    function cacheKey(movie) {
        var info = movieIdentity(movie);
        return sourceVersion + ':' + (info.series ? 'tv:' : 'movie:') + (movie.source || 'tmdb') + ':' +
            info.id + ':' + normal(info.title) + ':' + info.year;
    }

    function diskKey(movie) {
        var info = movieIdentity(movie);
        return (info.series ? 'tv:' : 'movie:') + (movie.source || 'tmdb') + ':' +
            info.id + ':' + normal(info.title) + ':' + info.year;
    }

    function sourceFingerprint() {
        var names = ['parser_use', 'parser_torrent_type', 'parser_use_link',
            'jackett_url', 'jackett_url_two', 'jackett_key', 'jackett_key_two',
            'prowlarr_url', 'prowlarr_url_two', 'prowlarr_key', 'prowlarr_key_two',
            'torrserver_use_link', 'torrserver_url', 'torrserver_url_two', 'parse_lang'];
        var hash = 5381;
        for (var i = 0; i < names.length; i++) {
            var value = String(field(names[i]));
            for (var j = 0; j < value.length; j++) {
                hash = ((hash << 5) + hash) ^ value.charCodeAt(j);
            }
            hash = ((hash << 5) + hash) ^ 31;
        }
        return (hash >>> 0).toString(36);
    }

    function ensureDiskCache() {
        if (diskCache) return diskCache;
        var source = sourceFingerprint();
        diskCache = { source: source, entries: {}, order: [] };
        var stale = false;
        try {
            var raw = Lampa.Storage.get(DISK_CACHE_KEY, null);
            if (raw && typeof raw === 'object' && raw.source === source &&
                raw.entries && typeof raw.entries === 'object' && Array.isArray(raw.order)) {
                diskCache.entries = raw.entries || {};
                diskCache.order = raw.order || [];
            } else if (raw) stale = true;
        } catch (e) {}
        pruneDiskCache();
        if (stale) scheduleDiskSave();
        return diskCache;
    }

    function pruneDiskCache() {
        if (!diskCache) return;
        var now = Date.now();
        var order = diskCache.order;
        var entries = diskCache.entries;
        var next = [];
        for (var i = 0; i < order.length; i++) {
            var k = order[i];
            var item = entries[k];
            if (!item || !item.expires || item.expires <= now) {
                delete entries[k];
            } else {
                next.push(k);
            }
        }
        while (next.length > DISK_MAX) {
            var old = next.shift();
            delete entries[old];
        }
        diskCache.order = next;
    }

    function scheduleDiskSave() {
        diskDirty = true;
        if (diskSaveTimer) return;
        diskSaveTimer = setTimeout(flushDiskSave, DISK_SAVE_DELAY);
    }

    function flushDiskSave() {
        clearTimeout(diskSaveTimer);
        diskSaveTimer = null;
        if (!diskDirty || !diskCache) return;
        pruneDiskCache();
        try {
            Lampa.Storage.set(DISK_CACHE_KEY, {
                source: diskCache.source, entries: diskCache.entries, order: diskCache.order
            });
            diskDirty = false;
        } catch (e) {}
    }

    function readDiskSummary(movie) {
        var key = diskKey(movie);
        var store = ensureDiskCache();
        var item = store.entries[key];
        if (!item || !item.expires || item.expires <= Date.now()) {
            if (item) {
                delete store.entries[key];
                var idx = store.order.indexOf(key);
                if (idx !== -1) store.order.splice(idx, 1);
                scheduleDiskSave();
            }
            return null;
        }
        var order = store.order;
        var pos = order.indexOf(key);
        if (pos !== -1) {
            order.splice(pos, 1);
            order.push(key);
        }
        return item;
    }

    function writeDiskSummary(movie, summary, ttl) {
        if (summary === undefined) return;
        var key = diskKey(movie);
        var store = ensureDiskCache();
        var order = store.order;
        var pos = order.indexOf(key);
        if (pos !== -1) order.splice(pos, 1);
        order.push(key);
        store.entries[key] = {
            summary: summary,
            expires: Date.now() + ttl
        };
        while (order.length > DISK_MAX) {
            var old = order.shift();
            delete store.entries[old];
        }
        scheduleDiskSave();
    }

    function clearDiskCache() {
        diskCache = { source: sourceFingerprint(), entries: {}, order: [] };
        diskDirty = false;
        if (diskSaveTimer) {
            clearTimeout(diskSaveTimer);
            diskSaveTimer = null;
        }
        try { Lampa.Storage.set(DISK_CACHE_KEY, diskCache); } catch (e) {}
    }

    function markActivity() {
        lastActivity = Date.now();
        scheduleScan(180);
        schedulePump();
    }

    function remember(key, summary, expires) {
        cache[key] = { summary: summary, expires: expires };
        var keys = Object.keys(cache);
        while (keys.length > MAX_CACHE) delete cache[keys.shift()];
    }

    function cachedSummary(movie) {
        var key = cacheKey(movie);
        if (!sourceReady()) return null;
        var hit = cache[key];
        if (hit && hit.expires > Date.now()) return hit;
        if (hit) delete cache[key];
        var diskHit = readDiskSummary(movie);
        if (diskHit !== null) {
            remember(key, diskHit.summary, Math.min(diskHit.expires, Date.now() + CACHE_TTL));
            return cache[key];
        }
        return null;
    }

    function networkEnabled() {
        return connected(viewRoot) && !document.hidden && setting('release_badges_enabled', true) &&
            sourceReady() && ['quality', 'hdr', 'ua', 'ru', 'en'].some(function (name) {
                return setting('release_badges_' + name, true);
            });
    }

    function taskCurrent(task) {
        return !task.obsolete && task.version === sourceVersion && task.view === viewVersion &&
            networkEnabled();
    }

    function schedulePump() {
        clearTimeout(pumpTimer);
        pumpTimer = null;
        if (!networkEnabled() || (activeTask && activeTask.inFlight)) return;
        if (!activeTask && !queue.length) return;
        var now = Date.now();
        while (requestStarts.length && requestStarts[0] <= now - REQUEST_WINDOW_MS) requestStarts.shift();
        var due = Math.max(now, lastActivity + LOAD_IDLE_MS);
        if (requestStarts.length) due = Math.max(due, requestStarts[requestStarts.length - 1] + REQUEST_GAP_MS);
        if (requestStarts.length >= REQUESTS_PER_WINDOW) due = Math.max(due, requestStarts[0] + REQUEST_WINDOW_MS);
        pumpTimer = setTimeout(pump, Math.max(0, due - now));
    }

    function pump() {
        pumpTimer = null;
        // Reconcile visibility immediately before every native request, including a fallback search.
        scan();
        if (!networkEnabled() || (activeTask && activeTask.inFlight)) return;
        if (activeTask && !taskCurrent(activeTask)) finishTask(activeTask, null, ERROR_TTL);
        if (!activeTask) {
            while (queue.length) {
                var next = queue.shift();
                if (taskCurrent(next)) { activeTask = next; break; }
                if (pending[next.key] === next) delete pending[next.key];
            }
        }
        if (!activeTask) return;
        // Input or a rate limit may have changed while the timer was pending.
        var now = Date.now();
        while (requestStarts.length && requestStarts[0] <= now - REQUEST_WINDOW_MS) requestStarts.shift();
        if (now - lastActivity < LOAD_IDLE_MS ||
            (requestStarts.length && now - requestStarts[requestStarts.length - 1] < REQUEST_GAP_MS) ||
            requestStarts.length >= REQUESTS_PER_WINDOW) return schedulePump();
        request(activeTask);
    }

    function finishTask(task, summary, ttl) {
        if (task.timer) clearTimeout(task.timer);
        task.timer = null;
        task.inFlight = false;
        if (taskCurrent(task)) {
            remember(task.key, summary, Date.now() + ttl);
            if (summary !== null && summary !== undefined) {
                writeDiskSummary(task.movie, summary, summary.matches ? DISK_TTL : DISK_EMPTY_TTL);
            }
        }
        if (pending[task.key] === task) delete pending[task.key];
        if (activeTask === task) activeTask = null;
        // Parser callbacks hold plain task data only. Locate the current DOM anew.
        scheduleScan(0);
        schedulePump();
    }

    function request(task) {
        if (!taskCurrent(task)) return finishTask(task, null, ERROR_TTL);
        var info = movieIdentity(task.movie);
        var searches = searchCandidates(info);
        if (task.index >= searches.length) return finishTask(task, null, ERROR_TTL);
        clearTimeout(pumpTimer);
        pumpTimer = null;
        task.inFlight = true;
        requestStarts.push(Date.now());
        var parserTimeout = Number(field('parse_timeout'));
        var timeout = isFinite(parserTimeout) && parserTimeout > 0 ?
            Math.min(parserTimeout * 2000 + 5000, 65000) : REQUEST_TIMEOUT * 2;
        task.timer = setTimeout(function () {
            task.timer = null;
            task.obsolete = true;
            task.stalled = true;
            if (pending[task.key] === task) delete pending[task.key];
            // Parser.get exposes no per-request cancellation. Keep the native slot occupied
            // until its callback arrives; a JS timeout must not create overlapping requests.
        }, timeout);
        var returned = false;
        function receive(data) {
            if (returned) return;
            returned = true;
            clearTimeout(task.timer);
            task.timer = null;
            scan();
            task.inFlight = false;
            if (!taskCurrent(task)) return finishTask(task, null, ERROR_TTL);
            var results = data && data.Results;
            var summary = Array.isArray(results) ? analyse(results, info) : null;
            task.index++;
            if ((!summary || !summary.matches) && task.index < searches.length) {
                schedulePump();
            } else finishTask(task, summary, summary && summary.matches ? CACHE_TTL : summary ? EMPTY_TTL : ERROR_TTL);
        }
        try {
            Lampa.Parser.get({ search: searches[task.index], search_one: info.translated,
                search_two: info.title, movie: task.movie, page: 1 }, receive, function () { receive(null); });
        } catch (e) { receive(null); }
    }

    function empty(element) {
        while (element.firstChild) element.removeChild(element.firstChild);
    }

    function badge(text, className, title) {
        var node = document.createElement('span');
        node.className = 'release-badges__badge release-badges__badge--' + className;
        node.textContent = text;
        node.title = title;
        return node;
    }

    function render(container, summary, movie) {
        var sig = summarySignature(summary, movie);
        if (container.__releaseBadgesSig === sig) return;
        container.__releaseBadgesSig = sig;

        empty(container);
        var card = container.closest && container.closest('.card');
        if (!setting('release_badges_enabled', true)) {
            if (card) card.classList.remove('release-badges-has-rating', 'release-badges-has-quality');
            return;
        }
        var showQuality = Boolean(summary && summary.quality && setting('release_badges_quality', true));
        if (summary) {
            if (summary.ua !== null && setting('release_badges_ua', true)) {
                var qUa = qualityLabel(summary.ua);
                container.appendChild(badge('UA', 'ua',
                    label(qUa ? 'badge_audio_quality' : 'badge_audio', { language: 'UA', quality: qUa })));
            }
            if (summary.ru !== null && setting('release_badges_ru', true)) {
                var qRu = qualityLabel(summary.ru);
                container.appendChild(badge('RU', 'ru',
                    label(qRu ? 'badge_audio_quality' : 'badge_audio', { language: 'RU', quality: qRu })));
            }
            if (summary.en !== null && setting('release_badges_en', true)) {
                var qEn = qualityLabel(summary.en);
                container.appendChild(badge('EN', 'en',
                    label(qEn ? 'badge_audio_quality' : 'badge_audio', { language: 'EN', quality: qEn })));
            }
            if (showQuality) {
                var qualityClass = summary.quality >= 2160 ? '4k' : summary.quality >= 1080 ? 'fhd' : 'hd';
                container.appendChild(badge(qualityLabel(summary.quality), qualityClass,
                    label('badge_quality', { quality: qualityLabel(summary.quality) })));
            }
            if (summary.hdr && setting('release_badges_hdr', true)) {
                container.appendChild(badge(summary.dv ? 'DV' : 'HDR', 'hdr',
                    label(summary.dv ? 'badge_dv' : 'badge_hdr')));
            }
        }
        var rating = tmdbRating(movie);
        var showRating = Boolean(rating && setting('release_badges_rating', true));
        if (showRating) {
            container.appendChild(badge('★ ' + rating.toFixed(1), 'rating', label('badge_rating')));
        }
        if (card) {
            card.classList.toggle('release-badges-has-rating', showRating);
            card.classList.toggle('release-badges-has-quality', showQuality);
        }
    }

    function getMovie(card) {
        try {
            return card.heroMovieData || card.card_data || card.item ||
                (window.$ && $(card).data && $(card).data('item')) || null;
        } catch (e) { return null; }
    }

    function hostForCard(card) {
        return card.querySelector('.card__view') || card;
    }

    function ensureContainer(host) {
        var container = host.querySelector('.release-badges');
        if (!container) {
            container = document.createElement('div');
            container.className = 'release-badges';
            if (window.getComputedStyle && window.getComputedStyle(host).position === 'static') {
                host.style.position = 'relative';
            }
            host.appendChild(container);
        }
        return container;
    }

    function connected(node) {
        return Boolean(node && document.documentElement && document.documentElement.contains(node));
    }

    function visible(card) {
        if (!connected(card)) return false;
        if (!card.getBoundingClientRect) return true;
        var rect = card.getBoundingClientRect();
        var width = window.innerWidth || document.documentElement.clientWidth;
        var height = window.innerHeight || document.documentElement.clientHeight;
        return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 &&
            rect.top < height && rect.left < width;
    }

    function scan() {
        clearTimeout(scanTimer);
        scanTimer = null;
        if (!viewRoot || document.hidden || !setting('release_badges_enabled', true)) return;
        if (!connected(viewRoot)) return stopView();
        var candidates = [];
        var wanted = {};
        var useNetwork = networkEnabled();
        function consider(movie, host, full) {
            if (!movie || !movie.id) return;
            var key = cacheKey(movie);
            var hit = useNetwork ? cachedSummary(movie) : null;
            var container = ensureContainer(host);
            if (full) container.classList.add('release-badges--full');
            render(container, hit ? hit.summary : null, movie);
            if (!useNetwork || hit || wanted[key]) return;
            wanted[key] = true;
            if (activeTask && activeTask.key === key && taskCurrent(activeTask)) return;
            if (candidates.length < MAX_QUEUE) {
                candidates.push(pending[key] && taskCurrent(pending[key]) ? pending[key] : {
                    key: key, movie: compactMovie(movie), version: sourceVersion,
                    view: viewVersion, index: 0, inFlight: false, obsolete: false
                });
            }
        }
        if (fullMovie && viewRoot.querySelector) {
            var poster = viewRoot.querySelector('.full-start__poster, .full-start-new__poster');
            if (poster && connected(poster)) consider(fullMovie, poster, true);
        }
        var cards = viewRoot.querySelectorAll ? viewRoot.querySelectorAll('.card') : [];
        // Focus gets the first free queue slot; all other visible cards refill the bounded queue.
        for (var pass = 0; pass < 2; pass++) {
            for (var i = 0; i < cards.length; i++) {
                var card = cards[i];
                var focused = card.classList && card.classList.contains('focus');
                if ((pass === 0) !== Boolean(focused) || !visible(card)) continue;
                consider(getMovie(card), hostForCard(card), false);
            }
        }
        if (activeTask && (!wanted[activeTask.key] || !taskCurrent(activeTask))) {
            activeTask.obsolete = true;
            if (!activeTask.inFlight) finishTask(activeTask, null, ERROR_TTL);
        }
        queue = candidates;
        pending = {};
        for (var j = 0; j < queue.length; j++) pending[queue[j].key] = queue[j];
        if (activeTask && !activeTask.obsolete) pending[activeTask.key] = activeTask;
        schedulePump();
    }

    function scheduleScan(delay) {
        if (!viewRoot || document.hidden || !setting('release_badges_enabled', true)) return;
        if (scanTimer !== null) return;
        scanTimer = setTimeout(scan, delay == null ? 16 : delay);
    }

    function unwrap(element) {
        return element && (element.nodeType ? element : element[0]) || null;
    }

    function activityRoot(object) {
        try { return unwrap(object && object.activity && object.activity.render(true)); }
        catch (e) { return null; }
    }

    function stopView() {
        viewVersion++;
        clearTimeout(scanTimer);
        clearTimeout(pumpTimer);
        scanTimer = pumpTimer = null;
        if (cardObserver) cardObserver.disconnect();
        if (activeTask) {
            activeTask.obsolete = true;
            if (!activeTask.inFlight) {
                clearTimeout(activeTask.timer);
                activeTask = null;
            }
        }
        queue = [];
        pending = {};
        fullMovie = null;
        viewRoot = null;
        bindInput(false);
    }

    function startView(object) {
        stopView();
        if (!setting('release_badges_enabled', true) || document.hidden) return;
        viewRoot = activityRoot(object) ||
            (document.querySelector && document.querySelector('.activity--active')) || document.body;
        if (!connected(viewRoot)) { viewRoot = null; return; }
        if (object && object.component === 'full' && (object.card || object.movie)) {
            fullMovie = compactMovie(object.card || object.movie);
        }
        lastActivity = Date.now();
        bindInput(true);
        if (cardObserver) cardObserver.observe(viewRoot, { childList: true, subtree: true });
        scan();
    }

    function showFull(movie, renderElement) {
        var root = unwrap(renderElement);
        if (!viewRoot || !movie || !movie.id || !connected(root)) return;
        if (root !== viewRoot && viewRoot.contains && !viewRoot.contains(root)) return;
        fullMovie = compactMovie(movie);
        scan();
    }

    function currentActivity() {
        try { return Lampa.Activity && Lampa.Activity.active && Lampa.Activity.active(); }
        catch (e) { return null; }
    }

    function refresh() {
        stopView();
        var containers = document.querySelectorAll('.release-badges');
        for (var i = 0; i < containers.length; i++) {
            containers[i].__releaseBadgesSig = null;
            if (containers[i].parentNode) containers[i].parentNode.removeChild(containers[i]);
        }
        var cards = document.querySelectorAll('.card');
        for (var j = 0; j < cards.length; j++) {
            cards[j].__releaseBadgesKey = null;
            cards[j].__releaseBadgesQueued = false;
            cards[j].classList.remove('release-badges-has-rating', 'release-badges-has-quality');
        }
        if (!setting('release_badges_enabled', true)) return;
        startView(currentActivity());
    }

    function settingsMenuPosition() {
        var item = document.querySelector && document.querySelector('[data-name="release_badges_open"]');
        return item && item.parentNode ? Math.max(0,
            Array.prototype.indexOf.call(item.parentNode.querySelectorAll('.selector'), item)) : 0;
    }

    function addSettings() {
        if (!Lampa.SettingsApi || !Lampa.SettingsApi.addParam ||
            !Lampa.Settings || !Lampa.Settings.create ||
            !Lampa.Template || !Lampa.Template.add) return;
        var component = 'release_badges';
        Lampa.Template.add('settings_' + component, '<div></div>');
        Lampa.SettingsApi.addParam({ component: 'interface',
            param: { name: 'release_badges_open', type: 'button' },
            field: { name: label('settings_menu') },
            onRender: function (item) {
                item.find('.settings-param__name').text(label('settings_menu'));
            },
            onChange: function () {
                // onRender runs before Lampa inserts the item. Read its position when opened,
                // without retaining the settings DOM after closing the menu.
                var index = settingsMenuPosition();
                Lampa.Settings.create(component, {
                    onBack: function () {
                        Lampa.Settings.create('interface', { last_index: Math.max(0, index) });
                    }
                });
            }
        });
        [
            ['release_badges_enabled', 'settings_enabled'],
            ['release_badges_quality', 'settings_quality'],
            ['release_badges_hdr', 'settings_hdr'],
            ['release_badges_ua', 'settings_ua'],
            ['release_badges_ru', 'settings_ru'],
            ['release_badges_en', 'settings_en'],
            ['release_badges_rating', 'settings_rating']
        ].forEach(function (entry) {
            Lampa.SettingsApi.addParam({ component: component,
                param: { name: entry[0], type: 'trigger', default: true },
                field: { name: label(entry[1]),
                    description: entry[0] === 'release_badges_enabled' ? label('settings_source') : '' },
                onRender: function (item) {
                    item.find('.settings-param__name').text(label(entry[1]));
                    if (entry[0] === 'release_badges_enabled') {
                        item.find('.settings-param__descr').text(label('settings_source'));
                    }
                },
                onChange: refresh });
        });
    }

    function addStyle() {
        if (document.getElementById('release-badges-style')) return;
        var style = document.createElement('style');
        style.id = 'release-badges-style';
        style.textContent = [
            '.release-badges{position:absolute;left:-.2em;top:1.4em;z-index:25;display:flex;flex-direction:column;align-items:flex-start;gap:.2em;pointer-events:none}',
            '.hero-banner .release-badges{left:1.2em;top:1.5em;gap:.3em}',
            'body:not(.ifx-type-badges) .card.card--tv .card__view > .release-badges{top:3.2em}',
            '.release-badges--full{left:.5em;top:.8em;gap:.3em}',
            '.release-badges__badge{display:inline-flex;align-items:center;justify-content:center;align-self:flex-start;padding:.32em .48em;border:1px solid rgba(255,255,255,.16);border-radius:.32em;color:#fff;font-size:.78em;font-weight:800;line-height:1;letter-spacing:.03em;white-space:nowrap;box-shadow:0 1px 5px rgba(0,0,0,.35)}',
            '.release-badges__badge--ua{background:linear-gradient(135deg,#1565c0,#42a5f5);border-color:rgba(66,165,245,.4)}',
            '.release-badges__badge--ru{background:linear-gradient(135deg,#8e244d,#d75a74);border-color:rgba(215,90,116,.4)}',
            '.release-badges__badge--en{background:linear-gradient(135deg,#37474f,#78909c);border-color:rgba(120,144,156,.4)}',
            '.release-badges__badge--4k{background:linear-gradient(135deg,#e65100,#ff9800);border-color:rgba(255,152,0,.4)}',
            '.release-badges__badge--fhd{background:linear-gradient(135deg,#4a148c,#ab47bc);border-color:rgba(171,71,188,.4)}',
            '.release-badges__badge--hd{background:linear-gradient(135deg,#1b5e20,#66bb6a);border-color:rgba(102,187,106,.4)}',
            '.release-badges__badge--hdr{background:linear-gradient(135deg,#f57f17,#ffeb3b);color:#000;border-color:rgba(255,235,59,.4)}',
            '.release-badges__badge--rating{background:linear-gradient(135deg,#1a1a2e,#16213e);color:#ffd700;border-color:rgba(255,215,0,.35)}',
            '.card.release-badges-has-rating .card__vote{display:none!important}',
            '.card.release-badges-has-quality .card__quality{display:none!important}'
        ].join('');
        document.head.appendChild(style);
    }

    var inputBound = false;
    function bindInput(enabled) {
        if (inputBound === enabled) return;
        inputBound = enabled;
        ['keydown', 'wheel', 'touchmove', 'scroll'].forEach(function (name) {
            if (enabled) {
                try { document.addEventListener(name, markActivity, { passive: true, capture: true }); }
                catch (e) { document.addEventListener(name, markActivity, true); }
            } else if (document.removeEventListener) document.removeEventListener(name, markActivity, true);
        });
    }

    function init() {
        if (window.__lampaReleaseBadgesV2) return;
        if (!document.body || !window.Lampa || !Lampa.Storage || !Lampa.Parser) return;
        window.__lampaReleaseBadgesV2 = true;
        window.__lampaReleaseBadgesV1 = true;
        addStyle();
        addSettings();
        cardObserver = new MutationObserver(function (mutations) {
            for (var m = 0; m < mutations.length; m++) {
                var mutation = mutations[m];
                if (mutation.target && mutation.target.closest && mutation.target.closest('.release-badges')) continue;
                var changed = Array.prototype.slice.call(mutation.addedNodes || []).concat(
                    Array.prototype.slice.call(mutation.removedNodes || []));
                for (var i = 0; i < changed.length; i++) {
                    var node = changed[i];
                    if (node.nodeType !== 1 || (node.classList && node.classList.contains('release-badges'))) continue;
                    scheduleScan(16);
                    return;
                }
            }
        });
        if (Lampa.Listener && Lampa.Listener.follow) {
            Lampa.Listener.follow('activity', function (event) {
                if (!event) return;
                if (event.type === 'init') stopView();
                else if (event.type === 'start') startView(event.object);
                else if (event.type === 'destroy' && viewRoot &&
                    (activityRoot(event.object) === viewRoot || !connected(viewRoot))) stopView();
            });
            Lampa.Listener.follow('full', function (event) {
                if (event.type !== 'complite') return;
                var movie = event.data && event.data.movie;
                var activity = event.object && event.object.activity;
                showFull(movie, activity && activity.render && activity.render());
            });
        }
        if (Lampa.Storage.listener && Lampa.Storage.listener.follow) {
            Lampa.Storage.listener.follow('change', function (event) {
                if (event && /^release_badges_(?:enabled|quality|hdr|ua|ru|en|rating)$/.test(event.name)) {
                    refresh();
                    return;
                }
                if (event && event.name === 'language') {
                    clearTimeout(settingsRefreshTimer);
                    settingsRefreshTimer = setTimeout(refresh, 400);
                    return;
                }
                if (!event || !/^(?:parser_use|parser_torrent_type|parser_use_link|parse_lang|torrserver_use_link|jackett_(?:url|key)(?:_two)?|prowlarr_(?:url|key)(?:_two)?|torrserver_url(?:_two)?)$/.test(event.name)) return;
                sourceVersion++;
                cache = {};
                stopView();
                clearDiskCache();
                clearTimeout(settingsRefreshTimer);
                settingsRefreshTimer = setTimeout(refresh, 400);
            });
        }
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) { stopView(); flushDiskSave(); }
            else startView(currentActivity());
        });
        if (window.addEventListener) window.addEventListener('pagehide', function () {
            stopView();
            flushDiskSave();
        });
        window.LAMPA_RELEASE_BADGES_REFRESH = refresh;
        // Counts only: no movie titles, parser addresses, or credentials in diagnostics.
        window.LAMPA_RELEASE_BADGES_STATS = function () {
            var now = Date.now();
            return { queued: queue.length, pending: Object.keys(pending).length,
                active: activeTask && activeTask.inFlight ? 1 : 0,
                stalled: Boolean(activeTask && activeTask.stalled),
                observing: Boolean(viewRoot), observedCards: 0,
                memoryEntries: Object.keys(cache).length,
                requestsLastMinute: requestStarts.filter(function (time) { return time > now - REQUEST_WINDOW_MS; }).length };
        };
        startView(currentActivity());
    }

    function waitForLampa(attempt) {
        if (window.__lampaReleaseBadgesV2) return;
        if (window.Lampa && Lampa.Storage && Lampa.Parser && document.body) {
            init();
        } else if (attempt < 60) {
            setTimeout(function () { waitForLampa(attempt + 1); }, 500);
        }
    }
    waitForLampa(0);
})();
