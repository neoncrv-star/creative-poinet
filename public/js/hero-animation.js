document.addEventListener('DOMContentLoaded', () => {
    if (typeof window === 'undefined') return;
    const start = () => {
        gsap.registerPlugin(ScrollTrigger);

        const stickySection = document.querySelector('.hero-sticky-section');
        const maskContainer = document.querySelector('.hero-mask-container');
        const contentOverlay = document.querySelector('.hero-content-overlay');
        const whiteDot = document.querySelector('.point-dot-white');
        const redDot = document.querySelector('.point-dot-red');
        const initialText = document.querySelector('.hero-initial-text');
        const scrollMouse = document.querySelector('.scroll-mouse-icon');
        if (!stickySection || !maskContainer) return;

        // --- Initial Load Animations ---
        const loadTl = gsap.timeline();
        loadTl
            .fromTo(whiteDot, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: "elastic.out(1, 0.3)", force3D: true })
            .fromTo(initialText, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power2.out", force3D: true }, "-=0.5");

        // --- Scroll Animation Timeline ---
        // Use a longer end value to create virtual scroll space
        // --- Force Video Playback Logic ---
        const video = document.querySelector('.hero-video');
        if (video && typeof video.play === 'function') {
            try {
                video.play().catch(e => console.debug("Hero video autoplay blocked:", e));
                if (video.paused) {
                    video.setAttribute('autoplay', 'true');
                    video.setAttribute('muted', 'true');
                    video.setAttribute('playsinline', 'true');
                    video.play().catch(e => console.debug("Hero video retry failed:", e));
                }
            } catch (e) {
                console.debug('Hero video play not supported on this element.');
            }
        } else {
            console.debug('Hero media is not an HTMLVideoElement; skipping play().');
        }

        const scrollTl = gsap.timeline({
            scrollTrigger: {
                trigger: stickySection,
                start: "top top",
                end: window.innerWidth < 768 ? "+=2000" : "+=3000",
                scrub: 1,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true
            }
        });

        // Force Initial States immediately
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const initialTextColor = currentTheme === 'light' ? "#000" : "#fff";
        gsap.set(contentOverlay, { opacity: 0, y: 50, force3D: true });
        gsap.set(maskContainer, { clipPath: "circle(0% at 50% 50%)", webkitClipPath: "circle(0% at 50% 50%)" });
        gsap.set(whiteDot, { scale: 1, opacity: 1 });
        gsap.set(redDot, { scale: 0, opacity: 1 });
        gsap.set(initialText, { opacity: 1, color: initialTextColor, fontWeight: "300", scale: 1, y: 0 });
        scrollTl
            .to(scrollMouse, { opacity: 0, duration: 0.5 }, 0)
            .to(whiteDot, { scale: 150, duration: 2, ease: "none", force3D: true }, 0)
            .fromTo(redDot, 
                { scale: 0 },
                { scale: 300, duration: 3, ease: "none", force3D: true }, 
                1.5 
            )
            .to(initialText, { 
                opacity: 1,
                color: "#fff", 
                scale: 1.5,
                fontWeight: "900",
                duration: 1,
                ease: "none",
                force3D: true
            }, 2.0)
            .to(maskContainer, 
                { 
                    clipPath: "circle(50px at 50% 50%)", 
                    webkitClipPath: "circle(50px at 50% 50%)", 
                    duration: 1, 
                    ease: "none" 
                },
                4.5 
            )
            .to(initialText, { opacity: 0, scale: 0, duration: 0.5, force3D: true }, 4.5)
            .to(maskContainer, 
                { 
                    clipPath: "circle(150% at 50% 50%)", 
                    webkitClipPath: "circle(150% at 50% 50%)", 
                    duration: 4, 
                    ease: "power2.inOut" 
                },
                5.5 
            )
            .to(contentOverlay, 
                { opacity: 1, y: 0, duration: 2, ease: "power2.out", force3D: true }, 
                9.0
            );
    };

    if (typeof window.safeScrollTrigger === 'function') {
        window.safeScrollTrigger(() => {
            if (!window.gsap || !window.ScrollTrigger) return;
            start();
        });
        return;
    }
    if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
        console.warn('Hero Animation: GSAP/ScrollTrigger unavailable, skipping.');
        return;
    }
    start();

});
