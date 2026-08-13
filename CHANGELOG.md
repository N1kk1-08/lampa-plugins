# Changelog — Lampa Stats

## v0.61 (2026-08-13)

### Fixed / Improved
- **Зовнішні плеєри (Just+, VLC, Android intent) на Android TV**
  - При поверненні з зовнішнього плеєра хвилини тепер підхоплюються з Timeline / storage (раніше часто губилися).
  - Прибрано жорсткий clamp «перших 5 секунд», який зрізав великий стрибок після Just+/VLC.
  - Для даних з Timeline дозволені великі стрибки (до 4 год), для живого `<video>` — як раніше обережно.
  - Більше спроб `flush` після `destroy` / `callback` / resume activity (Timeline на Android пишеться із затримкою).
  - Слухач `state:changed` (target: timeline).
  - Додаткові ключі storage + спроба `Lampa.Timeline.view`.

### Technical
- Версія: `lampa_ukrainian_stats_v061`
- CSS: `lampa-stats-v061-style`

## v0.60 (2026-08-13)

### Fixed
- Головні актори не потрапляли в «Улюблені актори» (приклад: Milly Alcock / Supergirl).
  - Сортування за `order` тільки якщо значення реально різні.
  - Інакше зберігається оригінальний порядок TMDB.
  - До 30 акторів з картки, до 25 при записі прогресу.
  - Re-enrich до 30 хв при пізній підвантажці касту.

## v0.59

- Сортування акторів за полем `order` (0 = головна роль).
