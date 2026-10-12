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
        })
        .catch(err => console.error('Translation load error:', err));

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
