document.addEventListener('DOMContentLoaded', () => {
    if (typeof window === 'undefined') return;

    const initJourney = (gsap, ScrollTrigger) => {
        if (!gsap || !ScrollTrigger) return;

        gsap.registerPlugin(ScrollTrigger);

        const journeySection = document.querySelector('.journey-scroll-section');
        const eyebrow = document.querySelector('.journey-eyebrow');
        const lines = document.querySelectorAll('.journey-line');

        if (!journeySection || !lines.length) return;

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

        // 🔥 batching = أداء عالي
        ScrollTrigger.batch(lines, {
            start: "top 70%",
            end: "bottom 40%",

            onEnter: (batch) => {
                batch.forEach((el) => el.classList.add('is-active'));
            },

            onLeave: (batch) => {
                batch.forEach((el) => el.classList.remove('is-active'));
            },

            onEnterBack: (batch) => {
                batch.forEach((el) => el.classList.add('is-active'));
            },

            onLeaveBack: (batch) => {
                batch.forEach((el) => el.classList.remove('is-active'));
            }
        });

        if (typeof window !== 'undefined') {
            window.__CP_READY = window.__CP_READY || {};
            window.__CP_READY.journey = true;
        }
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
