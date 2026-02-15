document.addEventListener('DOMContentLoaded', () => {
    if (typeof window === 'undefined') return;
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

    if (typeof window.safeScrollTrigger === 'function') {
        window.safeScrollTrigger((gsap, ScrollTrigger) => {
            gsap.registerPlugin(ScrollTrigger);
            const animateElements = document.querySelectorAll('[data-gsap]');
            if (!animateElements.length) return;
            const fadeUp = [];
            const fadeLeft = [];
            const fadeRight = [];
            animateElements.forEach(el => {
                if (!el || !el.parentNode || !el.isConnected) return;
                const type = el.getAttribute('data-gsap');
                if (type === 'fade-up') fadeUp.push(el);
                else if (type === 'fade-left') fadeLeft.push(el);
                else if (type === 'fade-right') fadeRight.push(el);
            });
            if (fadeUp.length) {
                ScrollTrigger.batch(fadeUp, {
                    start: 'top 85%',
                    onEnter: batch => {
                        gsap.from(batch, {
                            y: 50,
                            opacity: 0,
                            duration: 1,
                            ease: 'power3.out',
                            force3D: true,
                            stagger: 0.12,
                            overwrite: 'auto'
                        });
                    },
                    onEnterBack: batch => {
                        gsap.from(batch, {
                            y: 50,
                            opacity: 0,
                            duration: 1,
                            ease: 'power3.out',
                            force3D: true,
                            stagger: 0.12,
                            overwrite: 'auto'
                        });
                    }
                });
            }
            if (fadeLeft.length) {
                ScrollTrigger.batch(fadeLeft, {
                    start: 'top 85%',
                    onEnter: batch => {
                        gsap.from(batch, {
                            x: -50,
                            opacity: 0,
                            duration: 1,
                            ease: 'power3.out',
                            force3D: true,
                            stagger: 0.12,
                            overwrite: 'auto'
                        });
                    },
                    onEnterBack: batch => {
                        gsap.from(batch, {
                            x: -50,
                            opacity: 0,
                            duration: 1,
                            ease: 'power3.out',
                            force3D: true,
                            stagger: 0.12,
                            overwrite: 'auto'
                        });
                    }
                });
            }
            if (fadeRight.length) {
                ScrollTrigger.batch(fadeRight, {
                    start: 'top 85%',
                    onEnter: batch => {
                        gsap.from(batch, {
                            x: 50,
                            opacity: 0,
                            duration: 1,
                            ease: 'power3.out',
                            force3D: true,
                            stagger: 0.12,
                            overwrite: 'auto'
                        });
                    },
                    onEnterBack: batch => {
                        gsap.from(batch, {
                            x: 50,
                            opacity: 0,
                            duration: 1,
                            ease: 'power3.out',
                            force3D: true,
                            stagger: 0.12,
                            overwrite: 'auto'
                        });
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

                if (typeof window !== 'undefined') {
                    requestAnimationFrame(() => {
                        try {
                            if (window.scrollManager && typeof window.scrollManager.refresh === 'function') {
                                window.scrollManager.refresh();
                            } else if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === 'function') {
                                window.ScrollTrigger.refresh();
                            }
                        } catch (e) {
                            console.warn('ScrollTrigger refresh after filter failed:', e);
                        }
                    });
                }
            });
        });
    }

    // Initialize Portfolio Swiper
    if (typeof Swiper !== 'undefined') {
        const isRtl = html.getAttribute('dir') === 'rtl';

        // Read config from JSON script tag
        let config = {};
        const configElement = document.getElementById('slider-config-data');
        if (configElement) {
            try {
                config = JSON.parse(configElement.textContent);
            } catch (e) {
                console.error('Error parsing slider config:', e);
            }
        }

        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        const isMobileView = viewportWidth <= 768;

        const slidesPerViewConfig = config.slidesPerView || 3;
        const spaceBetweenConfig = config.spaceBetween || 40;
        const sliderEffect = isMobileView ? 'slide' : (config.effect || 'slide');

        const portfolioSwiper = new Swiper('.portfolio-swiper', {
            // Mobile‑first: دائما شريحة واحدة في العرض على الجوال
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true,
            centeredSlides: true,
            grabCursor: true,
            speed: 800,
            rtl: isRtl,
            effect: sliderEffect,
            autoplay: config.autoplay ? {
                delay: config.autoplayDelay || 3000,
                disableOnInteraction: false,
            } : false,
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
                768: {
                    slidesPerView: Math.min(slidesPerViewConfig, 2),
                    spaceBetween: 24,
                },
                1024: {
                    slidesPerView: Math.min(slidesPerViewConfig, 2.5),
                    spaceBetween: 32,
                },
                1200: {
                    slidesPerView: slidesPerViewConfig,
                    spaceBetween: spaceBetweenConfig,
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
