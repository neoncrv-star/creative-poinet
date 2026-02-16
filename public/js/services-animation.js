/**
 * ════════════════════════════════════════════════════════════════════
 * Services Section Animation - Production Ready
 * ════════════════════════════════════════════════════════════════════
 * 
 * ميزات:
 * - Smooth scroll snapping للكروت
 * - تغيير تلقائي للصور والنصوص
 * - تأثيرات بصرية احترافية (blur, opacity, scale)
 * - حماية من الأخطاء وإدارة آمنة للذاكرة
 * - دعم كامل للموبايل
 * 
 * @version 2.0.0
 * @author Creative Point
 */

document.addEventListener('DOMContentLoaded', function () {
    'use strict';
    
    if (typeof window === 'undefined') return;

    // ════════════════════════════════════════════════════════════════
    // 1. Main Initialization Function
    // ════════════════════════════════════════════════════════════════
    
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
        // 2. Cleanup Old Triggers
        // ════════════════════════════════════════════════════════════
        
        try {
            ScrollTrigger.getAll().forEach(trigger => {
                if (trigger.vars && trigger.vars.id === 'service-card-trigger') {
                    trigger.kill(true); // ← true للتنظيف الكامل
                }
            });
        } catch (e) {
            console.warn('[Services] Cleanup warning:', e.message);
        }

        // ════════════════════════════════════════════════════════════
        // 3. DOM Elements Selection
        // ════════════════════════════════════════════════════════════
        
        const section = document.querySelector('.services-horizontal-section');
        if (!section) {
            console.info('[Services] Section not found, skipping initialization');
            return;
        }

        const cards = section.querySelectorAll('.service-card');
        const mediaImage = section.querySelector('.services-media-image-inner');
        const mediaTitle = section.querySelector('.services-media-title');
        const mediaText = section.querySelector('.services-media-text');

        if (!cards.length) {
            console.warn('[Services] No service cards found');
            return;
        }

        if (!mediaImage) {
            console.warn('[Services] Media image element not found');
            return;
        }

        // ════════════════════════════════════════════════════════════
        // 4. State Management
        // ════════════════════════════════════════════════════════════
        
        let currentActiveIndex = -1;
        let isUpdating = false;

        // ════════════════════════════════════════════════════════════
        // 5. Media Update Function (الصورة والنص)
        // ════════════════════════════════════════════════════════════
        
        /**
         * تحديث الصورة والنص بناءً على الكارت النشط
         * @param {number} index - رقم الكارت
         */
        const updateMedia = (index) => {
            // منع التحديثات المتكررة
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

            // Timeline للانتقال السلس
            const tl = gsap.timeline({
                onComplete: () => {
                    isUpdating = false;
                }
            });

            // Fade Out
            tl.to([mediaImage, mediaTitle, mediaText], {
                opacity: 0,
                y: 10,
                duration: 0.25,
                ease: "power1.in",
                onComplete: () => {
                    // تحديث المحتوى
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

            // Fade In
            tl.to([mediaImage, mediaTitle, mediaText], {
                opacity: 1,
                y: 0,
                duration: 0.4,
                ease: "power2.out",
                stagger: 0.05
            });
        };

        // ════════════════════════════════════════════════════════════
        // 6. Card Activation Function (تفعيل الكارت)
        // ════════════════════════════════════════════════════════════
        
        /**
         * تفعيل كارت معين وإلغاء تفعيل الباقي
         * @param {number} activeIndex - رقم الكارت المراد تفعيله
         */
        const activateCard = (activeIndex) => {
            cards.forEach((card, index) => {
                const isActive = (index === activeIndex);
                const marker = card.querySelector('.service-card-marker');

                try {
                    if (isActive) {
                        // تفعيل الكارت
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
                        // إلغاء التفعيل
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

        // ════════════════════════════════════════════════════════════
        // 7. ScrollTrigger Setup - Individual Cards
        // ════════════════════════════════════════════════════════════
        
        cards.forEach((card, index) => {
            try {
                ScrollTrigger.create({
                    id: 'service-card-trigger',
                    trigger: card,
                    start: "center center",
                    end: "center center",
                    
                    // ✅ Snap للوسط
                    snap: {
                        snapTo: "center",
                        duration: 0.4,
                        delay: 0,
                        ease: "power2.inOut"
                    },
                    
                    toggleClass: "is-in-view",
                    invalidateOnRefresh: true,
                    
                    // Callbacks
                    onEnter: () => {
                        activateCard(index);
                        updateMedia(index);
                    },
                    
                    onEnterBack: () => {
                        activateCard(index);
                        updateMedia(index);
                    }
                });
                
            } catch (e) {
                console.warn('[Services] Failed to create trigger for card', index, e.message);
            }
        });

        // ════════════════════════════════════════════════════════════
        // 8. ScrollTrigger Setup - Section Snap
        // ════════════════════════════════════════════════════════════
        
        try {
            ScrollTrigger.create({
                id: 'service-section-snap',
                trigger: section,
                start: "top top",
                end: "bottom bottom",
                
                snap: {
                    snapTo: (progress) => {
                        try {
                            // حساب أقرب كارت للمنتصف
                            const positions = Array.from(cards).map((card) => {
                                const rect = card.getBoundingClientRect();
                                const offset = rect.top + rect.height / 2 - window.innerHeight / 2;
                                return Math.abs(offset);
                            });
                            
                            const nearestIndex = positions.indexOf(Math.min(...positions));
                            return nearestIndex / Math.max(1, cards.length - 1);
                            
                        } catch (e) {
                            console.warn('[Services] Snap calculation error:', e.message);
                            return progress;
                        }
                    },
                    duration: { min: 0.3, max: 0.6 },
                    ease: "power1.inOut"
                }
            });
        } catch (e) {
            console.warn('[Services] Section snap failed:', e.message);
        }

        // ════════════════════════════════════════════════════════════
        // 9. Initial State
        // ════════════════════════════════════════════════════════════
        
        try {
            activateCard(0);
            updateMedia(0);
        } catch (e) {
            console.warn('[Services] Initial state error:', e.message);
        }

        // ════════════════════════════════════════════════════════════
        // 10. Refresh ScrollTrigger
        // ════════════════════════════════════════════════════════════
        
        setTimeout(() => {
            try {
                ScrollTrigger.refresh(true);
            } catch (e) {
                console.warn('[Services] Refresh failed:', e.message);
            }
        }, 100);

        console.info('[Services] Animation initialized successfully');
    };

    // ════════════════════════════════════════════════════════════════
    // 11. Safe Loading Mechanism
    // ════════════════════════════════════════════════════════════════
    
    /**
     * المحاولة 1: استخدام scrollManager (الأفضل)
     */
    if (window.scrollManager && typeof window.scrollManager.section === 'function') {
        window.scrollManager.section('services', (gsap, ScrollTrigger) => {
            initServices(gsap, ScrollTrigger);
        });
        return;
    }

    /**
     * المحاولة 2: استخدام safeScrollTrigger
     */
    if (typeof window.safeScrollTrigger === 'function') {
        window.safeScrollTrigger((gsap, ScrollTrigger) => {
            initServices(gsap, ScrollTrigger);
        });
        return;
    }

    /**
     * المحاولة 3: التحميل المباشر (Fallback)
     */
    if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
        console.warn('[Services] GSAP/ScrollTrigger unavailable, waiting for load...');
        
        // انتظار تحميل GSAP
        const checkInterval = setInterval(() => {
            if (window.gsap && window.ScrollTrigger) {
                clearInterval(checkInterval);
                initServices(window.gsap, window.ScrollTrigger);
            }
        }, 100);
        
        // Timeout بعد 5 ثواني
        setTimeout(() => {
            clearInterval(checkInterval);
            console.error('[Services] GSAP/ScrollTrigger failed to load after 5 seconds');
        }, 5000);
        
        return;
    }

    /**
     * المحاولة 4: التحميل الفوري
     */
    try {
        initServices(window.gsap || window.GSAP, window.ScrollTrigger);
    } catch (e) {
        console.error('[Services] Initialization failed:', e);
    }
});