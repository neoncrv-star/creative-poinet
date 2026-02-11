document.addEventListener('DOMContentLoaded', () => {
    console.log("Cinematic Services Animation Initializing...");
    gsap.registerPlugin(ScrollTrigger);

    const servicesSection = document.querySelector('.services-horizontal-section');
    const horizontalWrapper = document.querySelector('.services-horizontal-wrapper');
    const panelContainer = document.querySelector('.services-panel-container');
    const panels = gsap.utils.toArray('.service-panel');
    const isRTL = document.documentElement.getAttribute('dir') === 'rtl';

    if (!servicesSection || !panelContainer || panels.length === 0) return;

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

    const updateScroll = () => {
        let totalWidth = panelContainer.offsetWidth;
        let scrollAmount = totalWidth - window.innerWidth;
        const xValue = isRTL ? scrollAmount : -scrollAmount;

        // Kill existing animations if any (for resize)
        if (mainTween) {
            mainTween.kill();
            ScrollTrigger.getAll().forEach(st => {
                if (st.vars.id && st.vars.id.startsWith("service-")) st.kill();
            });
            ScrollTrigger.getById("servicesScroll")?.kill();
        }

        mainTween = gsap.to(panelContainer, {
            x: xValue,
            ease: "none",
            scrollTrigger: {
                id: "servicesScroll",
                trigger: servicesSection,
                pin: true,
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
    };

    // Initialize after a short delay to ensure layout is ready
    setTimeout(updateScroll, 100);

    // Refresh everything on window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateScroll();
            ScrollTrigger.refresh();
        }, 250);
    });
});
