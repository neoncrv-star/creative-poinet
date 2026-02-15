document.addEventListener('DOMContentLoaded', () => {
    if (typeof window === 'undefined') return;

    console.log("Services Animation: init");

    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (isMobile) {
        window.__CP_READY = window.__CP_READY || {};
        window.__CP_READY.services = true;
        return;
    }

    const initServices = (gsap, ScrollTrigger) => {
        gsap.registerPlugin(ScrollTrigger);

        const servicesSection = document.querySelector('.services-horizontal-section');
        const panelContainer = document.querySelector('.services-panel-container');
        const panels = gsap.utils.toArray('.service-panel');
        const isRTL = document.documentElement.getAttribute('dir') === 'rtl';

        if (!servicesSection || !panelContainer || !panels.length) {
            console.warn('Services Animation: Required elements missing');
            return;
        }

        /* ---------------- Intro animation ---------------- */
        gsap.timeline({
            scrollTrigger: {
                trigger: servicesSection,
                start: "top 80%",
                once: true
            }
        })
        .to('.services-counter', { opacity: 1, y: 0, duration: 0.8 })
        .to('.services-section-title', { opacity: 1, y: 0, duration: 0.8 }, "-=0.6")
        .to('.services-desc', { opacity: 1, y: 0, duration: 0.8 }, "-=0.6")
        .to('.scroll-indicator', { opacity: 1, y: 0, duration: 0.8 }, "-=0.6");


        /* ---------------- Main scroll ---------------- */
        let mainTween;
        let ctx;

        const destroy = () => {
            if (ctx) {
                ctx.revert();
                ctx = null;
            }
            if (mainTween) {
                mainTween.kill();
                mainTween = null;
            }
            ScrollTrigger.getAll().forEach(st => {
                if (st.vars?.id?.startsWith('services')) st.kill();
            });
        };


        const build = () => {
            destroy();

            if (!panelContainer.isConnected) return;

            const totalWidth = panelContainer.scrollWidth;
            const scrollAmount = Math.max(0, totalWidth - window.innerWidth);
            const xValue = isRTL ? scrollAmount : -scrollAmount;

            ctx = gsap.context(() => {

                mainTween = gsap.to(panelContainer, {
                    x: xValue,
                    ease: "none",
                    force3D: true,
                    scrollTrigger: {
                        id: "services-main",
                        trigger: servicesSection,
                        pin: true,
                        scrub: 1,
                        start: "top top",
                        end: () => `+=${scrollAmount}`,
                        invalidateOnRefresh: true,
                        anticipatePin: 1
                    }
                });

                /* -------- Panels -------- */
                panels.forEach((panel, i) => {

                    const bg = panel.querySelector('.panel-bg-wrapper');
                    const content = panel.querySelector('.panel-content');

                    if (bg) {
                        gsap.fromTo(bg,
                            { x: isRTL ? "-15%" : "15%" },
                            {
                                x: isRTL ? "15%" : "-15%",
                                ease: "none",
                                force3D: true,
                                scrollTrigger: {
                                    id: `services-parallax-${i}`,
                                    trigger: panel,
                                    containerAnimation: mainTween,
                                    scrub: true
                                }
                            }
                        );
                    }

                    if (content && !panel.classList.contains('intro-panel')) {
                        gsap.fromTo(content,
                            { opacity: 0, y: 50, x: isRTL ? -30 : 30 },
                            {
                                opacity: 1,
                                y: 0,
                                x: 0,
                                duration: 0.9,
                                ease: "power2.out",
                                scrollTrigger: {
                                    id: `services-reveal-${i}`,
                                    trigger: panel,
                                    containerAnimation: mainTween,
                                    toggleActions: "play none none reverse"
                                }
                            }
                        );
                    }
                });

            }, servicesSection);

            ScrollTrigger.refresh();
        };


        /* -------- Delay to ensure layout ready -------- */
        requestAnimationFrame(() => {
            setTimeout(build, 120);
        });


        /* ---------------- Resize (debounced) ---------------- */
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                build();
            }, 300);
        });


        window.__CP_READY = window.__CP_READY || {};
        window.__CP_READY.services = true;
    };


    /* -------- Safe GSAP loader -------- */
    if (typeof window.safeScrollTrigger === 'function') {
        window.safeScrollTrigger(initServices);
    } else if (window.gsap && window.ScrollTrigger) {
        initServices(window.gsap, window.ScrollTrigger);
    } else {
        console.warn('Services Animation: GSAP unavailable');
    }
});
