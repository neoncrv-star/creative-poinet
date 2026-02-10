document.addEventListener('DOMContentLoaded', () => {
    const langToggle = document.getElementById('lang-toggle');
    const html = document.documentElement;
    const body = document.body;

    // Check saved preference
    const savedLang = localStorage.getItem('lang') || 'ar';
    setLanguage(savedLang);

    if (langToggle) {
        langToggle.addEventListener('click', () => {
            const currentLang = body.classList.contains('lang-ar') ? 'ar' : 'en';
            const newLang = currentLang === 'ar' ? 'en' : 'ar';
            setLanguage(newLang);
        });
    }

    function setLanguage(lang) {
        if (lang === 'ar') {
            body.classList.remove('lang-en');
            body.classList.add('lang-ar');
            html.setAttribute('lang', 'ar');
            html.setAttribute('dir', 'rtl');
            if(langToggle) langToggle.textContent = 'English';
        } else {
            body.classList.remove('lang-ar');
            body.classList.add('lang-en');
            html.setAttribute('lang', 'en');
            html.setAttribute('dir', 'ltr');
            if(langToggle) langToggle.textContent = 'العربية';
        }
        localStorage.setItem('lang', lang);
    }
});
