/**
 * ════════════════════════════════════════════════════════════════════
 * Services Animation - Final Fixed (No Pin Conflicts)
 * ════════════════════════════════════════════════════════════════════
 */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    
    if (typeof window === 'undefined') return;

    const initServices = (gsap, ScrollTrigger) => {
        if (!gsap || !ScrollTrigger) {
            console.warn('[Services] GSAP or ScrollTrigger not available');
            return;
        }

        try {
            gsap.registerPlugin(ScrollTrigger);
        } catch (e) {
            console.error('[Services] Failed to register ScrollTrigger:', e);
            return;
        }

        // ════════════════════════════════════════════════════════════
        // Cleanup Old Triggers
        // ════════════════════════════════════════════════════════════
        
        try {
            ScrollTrigger.getAll().forEach(trigger => {
                if (trigger.vars && trigger.vars.id && trigger.vars.id.includes('service')) {
                    trigger.kill(true);
                }
            });
        } catch (e) {
            console.warn('[Services] Cleanup warning:', e.message);
        }

        // ════════════════════════════════════════════════════════════
        // DOM Elements
        // ════════════════════════════════════════════════════════════
        
        const section = document.querySelector('.services-horizontal-section');
        if (!section) {
            console.info('[Services] Section not found');
            return;
        }

        const cards = section.querySelectorAll('.service-card');
        const mediaImage = section.querySelector('.services-media-image-inner');
        const mediaTitle = section.querySelector('.services-media-title');
        const mediaText = section.querySelector('.services-media-text');

        if (!cards.length || !mediaImage) {
            console.warn('[Services] Required elements not found');
            return;
        }

        // ════════════════════════════════════════════════════════════
        // State
        // ════════════════════════════════════════════════════════════
        
        let currentActiveIndex = -1;
        let isUpdating = false;

        // ════════════════════════════════════════════════════════════
        // Update Media Function
        // ════════════════════════════════════════════════════════════
        
        const updateMedia = (index) => {
            if (index === currentActiveIndex || isUpdating) return;
            
            isUpdating = true;
            currentActiveIndex = index;

            const card = cards[index];
            if (!card) {
                isUpdating = false;
                return;
            }

            const newSrc = card.getAttribute('data-image');
            const newTitle = card.getAttribute('data-title');
            const newDesc = card.getAttribute('data-description');

            const tl = gsap.timeline({
                onComplete: () => {
                    isUpdating = false;
                }
            });

            tl.to([mediaImage, mediaTitle, mediaText], {
                opacity: 0,
                y: 10,
                duration: 0.25,
                ease: "power1.in",
                onComplete: () => {
                    try {
                        if (newSrc && mediaImage && mediaImage.tagName === 'IMG') {
                            mediaImage.src = newSrc;
                        }
                        if (newTitle && mediaTitle) {
                            mediaTitle.textContent = newTitle;
                        }
                        if (newDesc && mediaText) {
                            mediaText.textContent = newDesc;
                        }
                    } catch (e) {
                        console.warn('[Services] Media update error:', e.message);
                    }
                }
            });

            tl.to([mediaImage, mediaTitle, mediaText], {
                opacity: 1,
                y: 0,
                duration: 0.4,
                ease: "power2.out",
                stagger: 0.05
            });
        };

        // ════════════════════════════════════════════════════════════
        // Activate Card Function
        // ════════════════════════════════════════════════════════════
        
        const activateCard = (activeIndex) => {
            cards.forEach((card, index) => {
                const isActive = (index === activeIndex);
                const marker = card.querySelector('.service-card-marker');

                try {
                    if (isActive) {
                        card.classList.add('active-service');
                        
                        gsap.to(card, { 
                            opacity: 1, 
                            filter: "blur(0px)", 
                            scale: 1, 
                            duration: 0.5,
                            ease: "power2.out"
                        });
                        
                        if (marker) {
                            gsap.to(marker, { 
                                background: "#ff0000", 
                                scale: 1.2, 
                                duration: 0.3,
                                ease: "back.out(1.7)"
                            });
                        }
                    } else {
                        card.classList.remove('active-service');
                        
                        gsap.to(card, { 
                            opacity: 0.3, 
                            filter: "blur(4px)", 
                            scale: 0.95, 
                            duration: 0.5,
                            ease: "power2.out"
                        });
                        
                        if (marker) {
                            gsap.to(marker, { 
                                background: "transparent", 
                                scale: 1, 
                                duration: 0.3,
                                ease: "power2.out"
                            });
                        }
                    }
                } catch (e) {
                    console.warn('[Services] Card activation error:', e.message);
                }
            });
        };
        
        cards.forEach((card, index) => {
            try {
                ScrollTrigger.create({
                    id: `service-card-${index}`,
                    trigger: card,
                    start: "center center",
                    end: "bottom center",
                    onEnter: () => {
                        activateCard(index);
                        updateMedia(index);
                    },
                    onEnterBack: () => {
                        activateCard(index);
                        updateMedia(index);
                    },
                    invalidateOnRefresh: true
                });
            } catch (e) {
                console.warn('[Services] Failed to create trigger for card', index, e.message);
            }
        });

        // ════════════════════════════════════════════════════════════
        // Initial State
        // ════════════════════════════════════════════════════════════
        
        try {
            activateCard(0);
            updateMedia(0);
        } catch (e) {
            console.warn('[Services] Initial state error:', e.message);
        }

        // ════════════════════════════════════════════════════════════
        // Safe Refresh (بعد 100ms)
        // ════════════════════════════════════════════════════════════
        
        setTimeout(() => {
            try {
                ScrollTrigger.refresh(true);
                console.info('[Services] Animation initialized successfully');
            } catch (e) {
                console.warn('[Services] Refresh failed (safe to ignore):', e.message);
            }
        }, 100);
    };

    // ════════════════════════════════════════════════════════════════
    // Safe Loading
    // ════════════════════════════════════════════════════════════════
    
    if (window.scrollManager && typeof window.scrollManager.section === 'function') {
        window.scrollManager.section('services', (gsap, ScrollTrigger) => {
            initServices(gsap, ScrollTrigger);
        });
        return;
    }

    if (typeof window.safeScrollTrigger === 'function') {
        window.safeScrollTrigger((gsap, ScrollTrigger) => {
            initServices(gsap, ScrollTrigger);
        });
        return;
    }

    if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
        console.warn('[Services] GSAP/ScrollTrigger unavailable, waiting...');
        
        const checkInterval = setInterval(() => {
            if (window.gsap && window.ScrollTrigger) {
                clearInterval(checkInterval);
                initServices(window.gsap, window.ScrollTrigger);
            }
        }, 100);
        
        setTimeout(() => {
            clearInterval(checkInterval);
            console.error('[Services] GSAP/ScrollTrigger failed to load');
        }, 5000);
        
        return;
    }

    try {
        initServices(window.gsap || window.GSAP, window.ScrollTrigger);
    } catch (e) {
        console.error('[Services] Initialization failed:', e);
    }
});
