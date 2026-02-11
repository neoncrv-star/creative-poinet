document.addEventListener('DOMContentLoaded', () => {
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
            end: window.innerWidth < 768 ? "+=1500" : "+=2500", // Shorter scroll on mobile
            scrub: 0.5,
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

    // Sequence:
    // 0. Fade out mouse icon immediately
    scrollTl
        .to(scrollMouse, { opacity: 0, duration: 0.2 }, 0)

        // 1. White Dot Expands (Background becomes White/Black depending on theme)
        .to(whiteDot, { scale: 100, duration: 1.5, ease: "power2.inOut" }, 0)
        
        // 2. Text Adaptation (Text becomes Red on expanded dot)
        .to(initialText, { 
            color: "#ff0000", 
            fontWeight: "700", 
            scale: 1.5,
            duration: 0.8 
        }, 0.5)

        // 3. Red Dot Expands (Background becomes Red)
        // Start earlier and scale larger to ensure no black bars
        .fromTo(redDot, 
            { scale: 0 },
            { scale: 500, duration: 2, ease: "power2.in" }, 
            1.0 
        )
        
        // 4. Text Adaptation (Text becomes White on Red BG)
        .to(initialText, { 
            color: "#fff", 
            zIndex: 10,
            duration: 0.8 
        }, 1.5)
        
        // 5. Video Mask Reveal (The Final Dot)
        // Step 5a: Appear as a small "Black Dot" (Video inside)
        .to(maskContainer, 
            { clipPath: "circle(20px at 50% 50%)", webkitClipPath: "circle(20px at 50% 50%)", duration: 0.5, ease: "power1.out" },
            2.0 
        )
        
        // Step 5b: Expand from Dot to Full Screen
        .to(maskContainer, 
            { clipPath: "circle(150% at 50% 50%)", webkitClipPath: "circle(150% at 50% 50%)", duration: 2.5, ease: "power2.inOut" },
            2.5 // Starts after the dot is formed
        )
        
        // 6. Initial Text Removal
        .to(initialText, { opacity: 0, scale: 3, duration: 1 }, 3.0)

        // 7. Reveal Hero Content
        .to(contentOverlay, 
            { opacity: 1, y: 0, duration: 1.5, ease: "power2.out" }, 
            4.0
        );

});
