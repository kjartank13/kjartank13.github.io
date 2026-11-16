document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const target = button.dataset.tab;
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));
            button.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });

    let currentLang = 'is';
    let translations = {};

    function getNestedTranslation(obj, path) {
        return path.split('.').reduce((o, p) => (o ? o[p] : undefined), obj);
    }

    function updateContent(lang) {
        document.getElementById('lang-is').classList.toggle('selected', lang === 'is');
        document.getElementById('lang-en').classList.toggle('selected', lang === 'en');
        document.documentElement.lang = lang;

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = getNestedTranslation(translations[lang], key);
            if (translation !== undefined) {
                el.innerHTML = translation;
            } else {
                console.warn(`Missing translation for key "${key}" in lang "${lang}"`);
            }
        });
    }

    function setLang(lang) {
        currentLang = lang;
        updateContent(lang);
        renderNews();
        renderEvents();
        renderValues();
    }

    document.getElementById('lang-is').addEventListener('click', () => {
        if (currentLang !== 'is') setLang('is');
    });

    document.getElementById('lang-en').addEventListener('click', () => {
        if (currentLang !== 'en') setLang('en');
    });

    // Load translations
    fetch('translations.json')
        .then(res => res.json())
        .then(data => {
            translations = data;
            updateContent(currentLang);
            renderNews();
            renderEvents();
            renderValues();
        })
        .catch(err => console.error('Translation load error:', err));

    // Events: events.json, fields start/end (YYYY-MM-DD), title/place ({is, en}) and optional link.
    // An event counts as past once its last day is over.
    let events = [];

    function parseDate(str) {
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d);
    }

    // Month names are spelled out here because not every browser ships Icelandic date formats
    const MONTHS = {
        is: ['janúar', 'febrúar', 'mars', 'apríl', 'maí', 'júní', 'júlí', 'ágúst', 'september', 'október', 'nóvember', 'desember'],
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };

    // e.g. "3.–7. nóvember 2025" / "3–7 November 2025"
    function formatEventDate(event) {
        const months = MONTHS[currentLang] || MONTHS.is;
        const day = d => currentLang === 'is' ? `${d.getDate()}.` : `${d.getDate()}`;
        const dayMonth = d => `${day(d)} ${months[d.getMonth()]}`;
        const start = parseDate(event.start);
        const end = event.end ? parseDate(event.end) : start;

        if (start.getTime() === end.getTime()) return `${dayMonth(start)} ${start.getFullYear()}`;
        if (start.getFullYear() !== end.getFullYear()) {
            return `${dayMonth(start)} ${start.getFullYear()} – ${dayMonth(end)} ${end.getFullYear()}`;
        }
        if (start.getMonth() !== end.getMonth()) return `${dayMonth(start)} – ${dayMonth(end)} ${end.getFullYear()}`;
        return `${day(start)}–${dayMonth(end)} ${end.getFullYear()}`;
    }

    function eventCard(event) {
        const t = key => getNestedTranslation(translations[currentLang], key) || '';
        const pick = obj => (obj && (obj[currentLang] || obj.is)) || '';

        const card = document.createElement('article');
        card.className = 'card event-card';
        card.innerHTML = '<i class="fa-regular fa-calendar card-icon" aria-hidden="true"></i>';

        const body = document.createElement('div');
        const title = document.createElement('h4');
        title.textContent = pick(event.title);
        body.appendChild(title);

        const details = document.createElement('p');
        details.className = 'event-details';
        details.textContent = [formatEventDate(event), pick(event.place)].filter(Boolean).join(' · ');
        body.appendChild(details);

        if (event.link) {
            const a = document.createElement('a');
            a.href = event.link;
            a.target = '_blank';
            a.rel = 'noopener';
            a.className = 'event-link';
            a.textContent = t('events.linkText');
            body.appendChild(a);
        }

        card.appendChild(body);
        return card;
    }

    function renderEvents() {
        const upcomingList = document.getElementById('upcoming-events');
        const pastList = document.getElementById('past-events');
        upcomingList.innerHTML = '';
        pastList.innerHTML = '';

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isPast = e => parseDate(e.end || e.start) < today;

        const upcoming = events.filter(e => !isPast(e)).sort((a, b) => a.start.localeCompare(b.start));
        const past = events.filter(isPast).sort((a, b) => b.start.localeCompare(a.start));

        if (upcoming.length) {
            upcoming.forEach(e => upcomingList.appendChild(eventCard(e)));
        } else {
            const p = document.createElement('p');
            p.textContent = getNestedTranslation(translations[currentLang], 'events.none') || '';
            upcomingList.appendChild(p);
        }

        past.forEach(e => pastList.appendChild(eventCard(e)));
        // Hide the "Past events" heading when there is nothing under it
        pastList.previousElementSibling.hidden = !past.length;
    }

    fetch('events.json')
        .then(res => res.json())
        .then(data => {
            events = data;
            renderEvents();
        })
        .catch(err => console.error('Events load error:', err));

    // Values: values.json, per language an intro (paragraphs) and values ({title, lead?, body}).
    let values = {};

    function renderValues() {
        const intro = document.getElementById('values-intro');
        const list = document.getElementById('values-list');
        intro.innerHTML = '';
        list.innerHTML = '';
        const content = values[currentLang] || values.is;
        if (!content) return;

        content.intro.forEach(text => {
            const p = document.createElement('p');
            p.textContent = text;
            intro.appendChild(p);
        });

        content.values.forEach((value, i) => {
            const li = document.createElement('li');
            li.className = 'value';

            const number = document.createElement('span');
            number.className = 'value-number';
            number.setAttribute('aria-hidden', 'true');
            number.textContent = String(i + 1).padStart(2, '0');
            li.appendChild(number);

            const body = document.createElement('div');
            const title = document.createElement('h3');
            title.textContent = value.title;
            body.appendChild(title);

            if (value.lead) {
                const lead = document.createElement('p');
                lead.className = 'value-lead';
                lead.textContent = value.lead;
                body.appendChild(lead);
            }
            value.body.forEach(text => {
                const p = document.createElement('p');
                p.textContent = text;
                body.appendChild(p);
            });

            li.appendChild(body);
            list.appendChild(li);
        });
    }

    fetch('values.json')
        .then(res => res.json())
        .then(data => {
            values = data;
            renderValues();
        })
        .catch(err => console.error('Values load error:', err));

    // News: Google Sheet published as CSV (File > Share > Publish to web > CSV).
    // Columns: date | title_is | text_is | title_en | text_en. One row per item, newest (bottom row) shown first.
    const NEWS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQu4_HFwXSWMkrr7bdokvcSWLmZIEvGg7i6RnPmBaB-bYQtQ3qWF-_v5-oPhaI_0mAnMSc5m4c55fvd/pub?gid=0&single=true&output=csv';
    let newsItems = [];

    // Minimal CSV parser: handles quoted fields, escaped quotes and line breaks inside cells
    function parseCSV(text) {
        const rows = [];
        let row = [], field = '', inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (inQuotes) {
                if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
                else if (c === '"') inQuotes = false;
                else field += c;
            } else if (c === '"') inQuotes = true;
            else if (c === ',') { row.push(field); field = ''; }
            else if (c === '\n' || c === '\r') {
                if (c === '\r' && text[i + 1] === '\n') i++;
                row.push(field); rows.push(row); row = []; field = '';
            } else field += c;
        }
        if (field || row.length) { row.push(field); rows.push(row); }
        return rows;
    }

    // Append text to el, turning URLs into links (no HTML from the sheet is ever injected)
    function appendLinkified(el, text) {
        text.split(/(https?:\/\/[^\s]+)/).forEach((part, i) => {
            if (i % 2) {
                const a = document.createElement('a');
                a.href = part;
                a.textContent = part;
                a.target = '_blank';
                a.rel = 'noopener';
                a.className = 'event-link';
                el.appendChild(a);
            } else if (part) {
                el.appendChild(document.createTextNode(part));
            }
        });
    }

    function renderNews() {
        const list = document.getElementById('news-list');
        list.innerHTML = '';
        // Fall back to Icelandic when the English columns are left empty
        const field = (item, name) => item[`${name}_${currentLang}`] || item[`${name}_is`] || '';
        const visible = newsItems.filter(item => field(item, 'title') || field(item, 'text'));

        if (!visible.length) {
            const p = document.createElement('p');
            p.textContent = getNestedTranslation(translations[currentLang], 'news.empty') || '';
            list.appendChild(p);
            return;
        }

        visible.forEach(item => {
            const article = document.createElement('article');
            article.className = 'news-item';

            const title = field(item, 'title');
            if (title) {
                const h3 = document.createElement('h3');
                h3.textContent = title;
                article.appendChild(h3);
            }
            if (item.date) {
                const date = document.createElement('p');
                date.className = 'news-date';
                date.textContent = item.date;
                article.appendChild(date);
            }
            // Blank lines in a cell separate paragraphs
            field(item, 'text').split(/\n\s*\n/).forEach(para => {
                if (!para.trim()) return;
                const p = document.createElement('p');
                appendLinkified(p, para.trim());
                article.appendChild(p);
            });

            list.appendChild(article);
        });
    }

    if (NEWS_CSV_URL) {
        fetch(NEWS_CSV_URL)
            .then(res => res.text())
            .then(text => {
                const [header, ...rows] = parseCSV(text);
                const keys = header.map(h => h.trim().toLowerCase());
                newsItems = rows.map(r => Object.fromEntries(keys.map((k, i) => [k, (r[i] || '').trim()]))).reverse();
                renderNews();
            })
            .catch(err => console.error('News load error:', err));
    }

    // Load artists
    fetch('artists.json')
        .then(res => res.json())
        .then(artists => {
            const list = document.querySelector('.artist-list');
            list.innerHTML = ''; // Clear static HTML

            artists.forEach(artist => {
                const li = document.createElement('li');

                const nameSpan = document.createElement('span');
                nameSpan.className = 'artist-name';
                nameSpan.textContent = artist.name;
                li.appendChild(nameSpan);

                if (artist.insta) {
                    const a = document.createElement('a');
                    a.href = `https://instagram.com/${artist.insta}`;
                    a.target = '_blank';
                    a.rel = 'noopener';
                    a.setAttribute('aria-label', artist.name + " on Instagram");
                    a.innerHTML = `<i class="fab fa-instagram"></i>`;
                    li.appendChild(a);
                }

                if (artist.bsky) {
                    const a = document.createElement('a');
                    a.href = artist.bsky;
                    a.target = '_blank';
                    a.rel = 'noopener';
                    a.setAttribute('aria-label', artist.name + " on Bluesky");
                    a.innerHTML = `<i class="fa-solid fa-cloud"></i>`;
                    li.appendChild(a);
                }

                list.appendChild(li);
            });
        })
        .catch(err => console.error('Artist list load error:', err));
});
