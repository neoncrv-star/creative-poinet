document.addEventListener('DOMContentLoaded', () => {
    const langToggle = document.getElementById('lang-toggle');
    const html = document.documentElement;
    const body = document.body;

    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle ? themeToggle.querySelector('i') : null;
    const logoImg = document.querySelector('.header-logo-img');
    
    // Check for saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);
    updateThemeUI(savedTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeUI(newTheme);
        });
    }

    function updateThemeUI(theme) {
        // Update Icon
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'ri-sun-line' : 'ri-moon-line';
        }
        // Update Logos (Header and Footer)
        const logos = document.querySelectorAll('.header-logo-img, .footer-logo-img');
        logos.forEach(img => {
            img.src = theme === 'dark' ? '/210.png' : '/212.png';
        });
    }

    // Sticky Header Logic (Show on scroll up)
    const header = document.querySelector('header');
    let lastScrollTop = 0;
    const scrollThreshold = 10;

    window.addEventListener('scroll', () => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (Math.abs(lastScrollTop - scrollTop) <= scrollThreshold) return;

        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            header.classList.add('header-hidden');
            header.classList.remove('header-visible');
        } else {
            // Scrolling up
            header.classList.remove('header-hidden');
            header.classList.add('header-visible');
        }
        
        if (scrollTop < 50) {
            header.classList.remove('header-visible');
        }

        lastScrollTop = scrollTop;
    }, { passive: true });

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

    // GSAP Animations for elements with data-gsap attribute
    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        const animateElements = document.querySelectorAll('[data-gsap]');
        animateElements.forEach(el => {
            const animationType = el.getAttribute('data-gsap');
            
            if (animationType === 'fade-up') {
                gsap.from(el, {
                    y: 50,
                    opacity: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 85%',
                        toggleActions: 'play none none none'
                    }
                });
            } else if (animationType === 'fade-left') {
                gsap.from(el, {
                    x: -50,
                    opacity: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 85%',
                        toggleActions: 'play none none none'
                    }
                });
            } else if (animationType === 'fade-right') {
                gsap.from(el, {
                    x: 50,
                    opacity: 0,
                    duration: 1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 85%',
                        toggleActions: 'play none none none'
                    }
                });
            }
        });
    }

    // Portfolio Filtering Logic
    const tabButtons = document.querySelectorAll('.tab-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    if (tabButtons.length > 0) {
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                tabButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');

                const filter = btn.getAttribute('data-filter');

                portfolioItems.forEach(item => {
                    const category = item.getAttribute('data-category');
                    if (filter === 'all' || category === filter) {
                        item.classList.remove('hide');
                        item.classList.add('show');
                    } else {
                        item.classList.remove('show');
                        item.classList.add('hide');
                    }
                });

                // Refresh ScrollTrigger as heights change
                if (typeof ScrollTrigger !== 'undefined') {
                    ScrollTrigger.refresh();
                }
            });
        });
    }

    // Initialize Portfolio Swiper
    if (typeof Swiper !== 'undefined') {
        const isRtl = html.getAttribute('dir') === 'rtl';
        
        const portfolioSwiper = new Swiper('.portfolio-swiper', {
            slidesPerView: 1,
            spaceBetween: 30,
            loop: true,
            centeredSlides: true,
            grabCursor: true,
            speed: 800,
            rtl: isRtl,
            navigation: {
            nextEl: '.next-btn',
            prevEl: '.prev-btn',
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
            dynamicBullets: true,
        },
            breakpoints: {
                640: {
                    slidesPerView: 1.5,
                    spaceBetween: 20,
                },
                768: {
                    slidesPerView: 2,
                    spaceBetween: 30,
                },
                1024: {
                    slidesPerView: 2.5,
                    spaceBetween: 40,
                },
                1200: {
                    slidesPerView: 3,
                    spaceBetween: 50,
                }
            },
            on: {
                init: function() {
                    // Ensure video play on hover for current slides
                    updateVideoHover();
                },
                slideChange: function() {
                    // Handle video playback on slide change if needed
                }
            }
        });

        // Video hover playback function
        function updateVideoHover() {
            const projectCards = document.querySelectorAll('.project-card');
            projectCards.forEach(card => {
                const video = card.querySelector('video');
                if (video) {
                    card.addEventListener('mouseenter', () => {
                        video.play().catch(e => console.log('Video play failed:', e));
                    });
                    card.addEventListener('mouseleave', () => {
                        video.pause();
                        video.currentTime = 0;
                    });
                }
            });
        }

        // Call it initially
        updateVideoHover();
    }
});
