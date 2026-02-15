document.addEventListener('DOMContentLoaded', () => {
    if (typeof window === 'undefined') return;

    const initJourney = (gsap, ScrollTrigger) => {
        if (!gsap || !ScrollTrigger) return;

        gsap.registerPlugin(ScrollTrigger);

        const journeySection = document.querySelector('.journey-scroll-section');
        const eyebrow = document.querySelector('.journey-eyebrow');
        const lines = document.querySelectorAll('.journey-line');

        if (!journeySection || !lines.length) return;

        // 🔥 Cache theme (منع reflow)
        let currentTheme = document.documentElement.getAttribute('data-theme');
        let activeColor = currentTheme === 'light' ? "#000" : "#fff";
        let inactiveColor = currentTheme === 'light'
            ? "rgba(0,0,0,0.15)"
            : "rgba(255,255,255,0.1)";

        // تحديث عند تغيير الثيم فقط
        const updateTheme = () => {
            currentTheme = document.documentElement.getAttribute('data-theme');
            activeColor = currentTheme === 'light' ? "#000" : "#fff";
            inactiveColor = currentTheme === 'light'
                ? "rgba(0,0,0,0.15)"
                : "rgba(255,255,255,0.1)";
        };

        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        gsap.fromTo(eyebrow,
            { opacity: 0, y: 40 },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "power2.out",
                force3D: true,
                scrollTrigger: {
                    trigger: journeySection,
                    start: "top 80%",
                    once: true
                }
            }
        );

        // 🔥 initial state (بدون filter)
        gsap.set(lines, {
            opacity: 0.1,
            color: inactiveColor,
            willChange: "opacity, transform"
        });

        // 🔥 batching = أداء عالي
        ScrollTrigger.batch(lines, {
            start: "top 70%",
            end: "bottom 40%",

            onEnter: (batch) => {
                gsap.to(batch, {
                    opacity: 1,
                    color: activeColor,
                    duration: 0.45,
                    stagger: 0.06,
                    overwrite: true
                });
            },

            onLeave: (batch) => {
                gsap.to(batch, {
                    opacity: 0.1,
                    color: inactiveColor,
                    duration: 0.35,
                    overwrite: true
                });
            },

            onEnterBack: (batch) => {
                gsap.to(batch, {
                    opacity: 1,
                    color: activeColor,
                    duration: 0.45,
                    stagger: 0.06,
                    overwrite: true
                });
            },

            onLeaveBack: (batch) => {
                gsap.to(batch, {
                    opacity: 0.1,
                    color: inactiveColor,
                    duration: 0.35,
                    overwrite: true
                });
            }
        });

        if (typeof window !== 'undefined') {
            window.__CP_READY = window.__CP_READY || {};
            window.__CP_READY.journey = true;
        }

        return () => {
            observer.disconnect();
        };
    };

    // 🔥 Scroll Manager
    if (window.scrollManager?.section) {
        window.scrollManager.section('journey', (gsap, ScrollTrigger) => {
            initJourney(gsap, ScrollTrigger);
        });
        return;
    }

    // fallback
    if (window.safeScrollTrigger) {
        window.safeScrollTrigger((gsap, ScrollTrigger) => {
            initJourney(gsap, ScrollTrigger);
        });
        return;
    }

    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    initJourney(gsap, ScrollTrigger);
});
