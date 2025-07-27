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
        })
        .catch(err => console.error('Translation load error:', err));

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
