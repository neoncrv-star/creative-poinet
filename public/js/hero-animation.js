document.addEventListener('DOMContentLoaded', () => {
    const start = () => {
        gsap.registerPlugin(ScrollTrigger);

        const stickySection = document.querySelector('.hero-sticky-section');
        const maskContainer = document.querySelector('.hero-mask-container');
        const contentOverlay = document.querySelector('.hero-content-overlay');
        
        // Dot elements
        const whiteDot = document.querySelector('.point-dot-white');
        const redDot = document.querySelector('.point-dot-red');
        const initialText = document.querySelector('.hero-initial-text');
        const scrollMouse = document.querySelector('.scroll-mouse-icon');

        if (!stickySection || !maskContainer) return;

        // --- Initial Load Animations ---
        const loadTl = gsap.timeline();
        loadTl
            .fromTo(whiteDot, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, ease: "elastic.out(1, 0.3)" })
            .fromTo(initialText, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power2.out" }, "-=0.5");

        // --- Scroll Animation Timeline ---
        // Use a longer end value to create virtual scroll space
        // --- Force Video Playback Logic ---
        const video = document.querySelector('.hero-video');
        if (video) {
            // Force play immediately
            video.play().catch(e => console.log("Autoplay blocked initially:", e));
            
            // Ensure it's playing even if paused
            if (video.paused) {
                video.setAttribute('autoplay', 'true');
                video.setAttribute('muted', 'true');
                video.setAttribute('playsinline', 'true');
                video.play().catch(e => console.log("Retry play failed:", e));
            }
        }

        const scrollTl = gsap.timeline({
            scrollTrigger: {
                trigger: stickySection,
                start: "top top",
                end: window.innerWidth < 768 ? "+=2000" : "+=3000", // Slightly longer for radical feel
                scrub: 1, // Smoother scrub
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true
            }
        });

        // Force Initial States immediately
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const initialTextColor = currentTheme === 'light' ? "#000" : "#fff";
        
        gsap.set(contentOverlay, { opacity: 0, y: 50 });
        gsap.set(maskContainer, { clipPath: "circle(0% at 50% 50%)", webkitClipPath: "circle(0% at 50% 50%)" });
        gsap.set(whiteDot, { scale: 1, opacity: 1 });
        gsap.set(redDot, { scale: 0, opacity: 1 });
        gsap.set(initialText, { opacity: 1, color: initialTextColor, fontWeight: "300", scale: 1, y: 0 });

        // Sequence based on user request:
        // 1. White Dot expands
        // 2. Red Dot expands with "Strong Marketing Text"
        // 3. Final Point (Video Mask) expands
        // 4. End of scroll: Reveal Title, Subtitle, and Button

        scrollTl
            .to(scrollMouse, { opacity: 0, duration: 0.5 }, 0)

            // Step 1: White Dot expands to fill screen
            .to(whiteDot, { scale: 150, duration: 2, ease: "none" }, 0)
            
            // Step 2: Red Dot expands over white with strong text
            .fromTo(redDot, 
                { scale: 0 },
                { scale: 300, duration: 3, ease: "none" }, 
                1.5 
            )
            .to(initialText, { 
                opacity: 1,
                color: "#fff", 
                scale: 1.5,
                fontWeight: "900", // Strong marketing feel
                duration: 1,
                ease: "none"
            }, 2.0)
            
            // Step 3: Radical Mask Reveal (Video Point)
            .to(maskContainer, 
                { 
                    clipPath: "circle(50px at 50% 50%)", 
                    webkitClipPath: "circle(50px at 50% 50%)", 
                    duration: 1, 
                    ease: "none" 
                },
                4.5 
            )
            .to(initialText, { opacity: 0, scale: 0, duration: 0.5 }, 4.5) // Remove initial text as video starts
            
            .to(maskContainer, 
                { 
                    clipPath: "circle(150% at 50% 50%)", 
                    webkitClipPath: "circle(150% at 50% 50%)", 
                    duration: 4, 
                    ease: "power2.inOut" 
                },
                5.5 
            )
            
            // Step 4: End of scroll - Reveal final content
            .to(contentOverlay, 
                { opacity: 1, y: 0, duration: 2, ease: "power2.out" }, 
                9.0
            );
    };

    if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
        let retries = 0;
        const maxRetries = 60; // ~3s at 50ms
        const waitForGsap = () => {
            if (window.gsap && window.ScrollTrigger) {
                start();
            } else if (retries < maxRetries) {
                retries++;
                setTimeout(waitForGsap, 50);
            } else {
                try {
                    if (!window.ScrollTrigger) {
                        const s = document.createElement('script');
                        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js';
                        s.onload = () => start();
                        document.head.appendChild(s);
                    }
                } catch (e) {
                    console.warn('GSAP/ScrollTrigger not available, hero animation skipped.');
                }
            }
        };
        waitForGsap();
        return;
    }
    start();

});
