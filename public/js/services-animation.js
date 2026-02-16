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
                        if (newSrc && mediaImage) {
                            if (mediaImage.tagName === 'IMG') {
                                mediaImage.src = newSrc;
                            } else {
                                mediaImage.style.backgroundImage = "url('" + newSrc + "')";
                                mediaImage.style.backgroundSize = 'cover';
                                mediaImage.style.backgroundPosition = 'center';
                                mediaImage.classList.remove('services-media-image-placeholder');
                            }
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
                const isActive = index === activeIndex;
                const marker = card.querySelector('.service-card-marker');

                try {
                    if (isActive) {
                        card.classList.add('active-service');
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
        
        const listColumn = section.querySelector('.services-list-column');
        if (!listColumn) {
            console.warn('[Services] List column not found');
            return;
        }

        let cardGap = 0;
        if (cards.length > 1) {
            const firstTop = cards[0].offsetTop;
            const secondTop = cards[1].offsetTop;
            cardGap = Math.max(0, secondTop - firstTop);
        }

        const steps = Math.max(cards.length - 1, 1);
        const totalShift = cardGap * steps;

        const updateVisualByCenter = () => {
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
            const centerLine = viewportHeight / 2;
            let bestIndex = 0;
            let bestScore = -1;

            cards.forEach((card, index) => {
                const rect = card.getBoundingClientRect();
                const cardCenter = rect.top + rect.height / 2;
                const dist = Math.abs(cardCenter - centerLine);
                const maxDist = viewportHeight * 0.6;
                const t = 1 - Math.min(dist / maxDist, 1);

                const opacity = 0.25 + t * 0.75;
                const blur = 5 - t * 5;
                const scale = 0.95 + t * 0.05;

                gsap.to(card, {
                    opacity,
                    filter: "blur(" + blur + "px)",
                    scale,
                    duration: 0.2,
                    ease: "power2.out",
                    overwrite: "auto"
                });

                if (t > bestScore) {
                    bestScore = t;
                    bestIndex = index;
                }
            });

            if (bestScore > 0.7 && bestIndex !== currentActiveIndex && !isUpdating) {
                try {
                    activateCard(bestIndex);
                    updateMedia(bestIndex);
                } catch (e) {
                    console.warn('[Services] Center update error:', e.message);
                }
            }
        };

        const tl = gsap.timeline({
            scrollTrigger: {
                id: 'services-master',
                trigger: section,
                start: 'top top',
                end: '+=' + (steps * 450),
                pin: true,
                scrub: 0.7,
                snap: {
                    snapTo: (value) => {
                        if (!steps) return 0;
                        const step = 1 / steps;
                        return Math.round(value / step) * step;
                    },
                    duration: { min: 0.15, max: 0.25 },
                    ease: 'power2.out'
                },
                onUpdate: () => {
                    updateVisualByCenter();
                },
                invalidateOnRefresh: true
            }
        });

        tl.fromTo(listColumn, { y: 0 }, { y: -totalShift, ease: 'power1.out' }, 0);

        updateVisualByCenter();

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
