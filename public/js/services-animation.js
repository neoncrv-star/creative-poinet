document.addEventListener('DOMContentLoaded', () => {
    if (typeof window === 'undefined') return;

    // دالة التهيئة الرئيسية لضمان عدم تكرار الكود
    const initServicesAnimation = (gsap, ScrollTrigger) => {
        gsap.registerPlugin(ScrollTrigger);

        const servicesSection = document.querySelector('.services-horizontal-section');
        const panelContainer = document.querySelector('.services-panel-container');
        const panels = gsap.utils.toArray('.service-panel');
        
        // التحقق من وجود العناصر
        if (!servicesSection || !panelContainer || panels.length === 0) {
            return;
        }

        // إعدادات الاتجاه (RTL/LTR)
        const isRTL = document.documentElement.getAttribute('dir') === 'rtl';

        // متغير لتخزين سياق GSAP للتنظيف لاحقاً
        let ctx;

        const buildAnimation = () => {
            if (ctx) ctx.revert();

            const isMobile = window.matchMedia('(max-width: 1024px)').matches;

            if (isMobile) {
                servicesSection.style.height = 'auto';
                servicesSection.style.minHeight = '0';
                servicesSection.classList.remove('services-scrolling');

                if (panelContainer && panelContainer.style) {
                    panelContainer.style.transform = 'none';
                }

                if (ScrollTrigger && typeof ScrollTrigger.getAll === 'function') {
                    try {
                        ScrollTrigger.getAll().forEach(t => {
                            if (!t) return;
                            if (t.vars && t.vars.id === 'servicesScroll') {
                                t.kill(true);
                                return;
                            }
                            if (t.trigger === servicesSection) {
                                t.kill(true);
                            }
                        });
                    } catch (e) {}
                }

                return;
            }

            // إنشاء سياق جديد
            ctx = gsap.context(() => {
                // 1. أنيميشن ظهور العناصر التعريفية (Intro)
                const introTl = gsap.timeline({
                    scrollTrigger: {
                        trigger: servicesSection,
                        start: "top 80%",
                        toggleActions: "play none none reverse"
                    }
                });

                introTl.to('.services-counter', { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" })
                       .to('.services-section-title', { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.6")
                       .to('.services-desc', { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.6")
                       .to('.scroll-indicator', { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, "-=0.6");

                const getScrollAmount = () => {
                    const totalWidth = panelContainer.scrollWidth || 0;
                    const viewport = window.innerWidth || 0;
                    const scrollDistance = totalWidth - viewport;
                    return scrollDistance > 0 ? scrollDistance : 0;
                };

                // 3. الأنيميشن الرئيسي (Horizontal Scroll)
                const mainTween = gsap.to(panelContainer, {
                    x: () => isRTL ? getScrollAmount() : -getScrollAmount(),
                    ease: "none",
                    scrollTrigger: {
                        id: "servicesScroll",
                        trigger: servicesSection,
                        pin: true,
                        pinSpacing: true,
                        anticipatePin: 1,
                        invalidateOnRefresh: true,
                        start: "top top",
                        end: () => `+=${getScrollAmount()}`,
                        scrub: 1,
                        onUpdate: (self) => {
                            if (Math.abs(self.getVelocity()) > 5) {
                                servicesSection.classList.add('services-scrolling');
                            } else {
                                servicesSection.classList.remove('services-scrolling');
                            }
                        }
                    }
                });

                // 4. تأثيرات داخلية لكل لوحة (Parallax & Reveal)
                panels.forEach((panel, i) => {
                    const bgWrapper = panel.querySelector('.panel-bg-wrapper');
                    const content = panel.querySelector('.panel-content');

                    // تأثير البارالاكس للخلفية
                    if (bgWrapper) {
                        gsap.fromTo(bgWrapper, 
                            { x: isRTL ? "-15%" : "15%" }, 
                            { 
                                x: isRTL ? "15%" : "-15%",
                                ease: "none",
                                force3D: true, // تحسين الأداء
                                scrollTrigger: {
                                    trigger: panel,
                                    containerAnimation: mainTween,
                                    start: isRTL ? "right left" : "left right",
                                    end: isRTL ? "left right" : "right left",
                                    scrub: true
                                }
                            }
                        );
                    }

                    // تأثير ظهور المحتوى (ما عدا أول لوحة لأنها تظهر مع الـ Intro)
                    if (content && !panel.classList.contains('intro-panel')) {
                        gsap.fromTo(content, 
                            { opacity: 0, y: 50, x: isRTL ? -30 : 30 },
                            {
                                opacity: 1, y: 0, x: 0,
                                duration: 1,
                                ease: "power2.out",
                                scrollTrigger: {
                                    trigger: panel,
                                    containerAnimation: mainTween,
                                    start: isRTL ? "right 85%" : "left 85%",
                                    toggleActions: "play none none reverse"
                                }
                            }
                        );
                    }
                });

            }, servicesSection); // Scope definition
        };

        const updateScroll = () => {
            buildAnimation();
            ScrollTrigger.refresh(true);
        };

        let lastWidth = window.innerWidth;

        buildAnimation();

        if (typeof ScrollTrigger !== "undefined" && typeof ScrollTrigger.refresh === "function") {
            window.requestAnimationFrame(() => {
                ScrollTrigger.refresh(true);
            });
        }

        window.addEventListener("resize", () => {
            const currentWidth = window.innerWidth;
            if (Math.abs(currentWidth - lastWidth) < 50) return;
            lastWidth = currentWidth;
            window.requestAnimationFrame(updateScroll);
        });

        // إشارة للنظام بأن السكربت جاهز
        if (typeof window !== 'undefined') {
            window.__CP_READY = window.__CP_READY || {};
            window.__CP_READY.services = true;
        }
    };

    // نقطة الدخول: التحقق من safeScrollTrigger أو استخدام GSAP العالمي
    if (typeof window.safeScrollTrigger === 'function') {
        window.safeScrollTrigger((gsap, ScrollTrigger) => {
            initServicesAnimation(gsap, ScrollTrigger);
        });
    } else if (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
        initServicesAnimation(window.gsap, window.ScrollTrigger);
    } else {
        if (typeof window !== 'undefined') {
            window.__CP_READY = window.__CP_READY || {};
            window.__CP_READY.services = true;
        }
        console.warn('Services Animation: GSAP or ScrollTrigger not found.');
    }
});
