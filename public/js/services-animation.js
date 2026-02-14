document.addEventListener('DOMContentLoaded', () => {
    console.log("Services Animation: init");
    if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
        console.warn('Services Animation: GSAP/ScrollTrigger unavailable at init');
        return;
    }
    gsap.registerPlugin(ScrollTrigger);

    const servicesSection = document.querySelector('.services-horizontal-section');
    const horizontalWrapper = document.querySelector('.services-horizontal-wrapper');
    const panelContainer = document.querySelector('.services-panel-container');
    const panels = gsap.utils.toArray('.service-panel');
    const isRTL = document.documentElement.getAttribute('dir') === 'rtl';

    if (!servicesSection || !panelContainer || panels.length === 0) {
        console.warn('Services Animation: Required elements missing', { servicesSection: !!servicesSection, panelContainer: !!panelContainer, panels: panels.length });
        return;
    }
    const imgs = document.querySelectorAll('.parallax-img');
    imgs.forEach((img) => {
        const src = img.getAttribute('src');
        img.addEventListener('load', () => console.debug('Service image loaded:', src));
        img.addEventListener('error', () => console.warn('Service image failed:', src));
    });

    // --- 1. Intro Panel Entrance Animation ---
    const introTl = gsap.timeline({
        scrollTrigger: {
            trigger: servicesSection,
            start: "top 80%",
        }
    });

    introTl.to('.services-counter', { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" })
           .to('.services-section-title', { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.6")
           .to('.services-desc', { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.6")
           .to('.scroll-indicator', { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.6");

    // --- 2. Horizontal Scroll Logic ---
    let mainTween;
    const cleanup = () => {
        try {
            if (mainTween) {
                mainTween.kill();
                mainTween = null;
            }
            ScrollTrigger.getAll().forEach(st => {
                const trg = st.vars && st.vars.trigger;
                if (trg && servicesSection && servicesSection.contains(trg)) {
                    st.kill();
                }
                if (st.vars && st.vars.id && ('' + st.vars.id).startsWith('service-')) {
                    st.kill();
                }
                if (st.vars && st.vars.id === 'servicesScroll') {
                    st.kill();
                }
            });
            gsap.set([servicesSection, panelContainer], { clearProps: 'all' });
        } catch (e) {
            console.debug('Services Animation: cleanup error', e);
        }
    };

    const updateScroll = () => {
        cleanup();
        console.debug('Services Animation: updateScroll()', {
            panelCount: panels.length,
            containerWidth: panelContainer.offsetWidth,
            viewport: { w: window.innerWidth, h: window.innerHeight }
        });
        let totalWidth = panelContainer.offsetWidth;
        let scrollAmount = totalWidth - window.innerWidth;
        const xValue = isRTL ? scrollAmount : -scrollAmount;

        mainTween = gsap.to(panelContainer, {
            x: xValue,
            ease: "none",
            scrollTrigger: {
                id: "servicesScroll",
                trigger: servicesSection,
                pin: true,
                pinSpacing: true,
                start: "top top",
                end: () => `+=${scrollAmount}`,
                scrub: 1,
                invalidateOnRefresh: true,
                anticipatePin: 1,
            }
        });

        // Update Parallax & Reveal with the new mainTween
        panels.forEach((panel, i) => {
            const img = panel.querySelector('.parallax-img');
            const bgWrapper = panel.querySelector('.panel-bg-wrapper');
            const content = panel.querySelector('.panel-content');
            
            if (img && bgWrapper) {
                gsap.fromTo(bgWrapper, 
                    { x: isRTL ? "-15%" : "15%" }, 
                    { 
                        x: isRTL ? "15%" : "-15%",
                        ease: "none",
                        scrollTrigger: {
                            id: `service-parallax-${i}`,
                            trigger: panel,
                            containerAnimation: mainTween,
                            start: isRTL ? "right left" : "left right",
                            end: isRTL ? "left right" : "right left",
                            scrub: true
                        }
                    }
                );
            }

            if (content && !panel.classList.contains('intro-panel')) {
                gsap.fromTo(content, 
                    { opacity: 0, y: 50, x: isRTL ? -30 : 30 },
                    {
                        opacity: 1, y: 0, x: 0,
                        duration: 1,
                        ease: "power2.out",
                        scrollTrigger: {
                            id: `service-reveal-${i}`,
                            trigger: panel,
                            containerAnimation: mainTween,
                            start: isRTL ? "right 85%" : "left 85%",
                            toggleActions: "play none none reverse"
                        }
                    }
                );
            }
        });
        // Defer refresh to next tick to avoid pin swap conflicts
        setTimeout(() => ScrollTrigger.refresh(), 0);
    };

    // Initialize after a short delay to ensure layout is ready
    setTimeout(() => requestAnimationFrame(updateScroll), 100);

    // Refresh everything on window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.debug('Services Animation: resize -> refresh');
            requestAnimationFrame(updateScroll);
        }, 250);
    });
});
