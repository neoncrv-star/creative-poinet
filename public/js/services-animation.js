document.addEventListener('DOMContentLoaded', function () {
    if (typeof window === 'undefined') return;

    const initServices = (gsap, ScrollTrigger) => {
        if (!gsap || !ScrollTrigger) return;

        gsap.registerPlugin(ScrollTrigger);

        // تنظيف ScrollTriggers القديمة
        ScrollTrigger.getAll().forEach(t => {
            if (t.vars && t.vars.id === 'service-card-trigger') t.kill();
        });

        const section = document.querySelector('.services-horizontal-section');
        if (!section) return;

        const cards = section.querySelectorAll('.service-card');
        const mediaImage = section.querySelector('.services-media-image-inner');
        const mediaTitle = section.querySelector('.services-media-title');
        const mediaText = section.querySelector('.services-media-text');

        if (!cards.length || !mediaImage) return;

        let currentActiveIndex = -1;

        // تحديث الصورة والنص
        const updateMedia = (index) => {
            if (index === currentActiveIndex) return;
            currentActiveIndex = index;

            const card = cards[index];
            const newSrc = card.getAttribute('data-image');
            const newTitle = card.getAttribute('data-title');
            const newDesc = card.getAttribute('data-description');

            const tl = gsap.timeline();

            tl.to([mediaImage, mediaTitle, mediaText], {
                opacity: 0,
                y: 10,
                duration: 0.25,
                ease: "power1.in",
                onComplete: () => {
                    if (newSrc && mediaImage.tagName === 'IMG') mediaImage.src = newSrc;
                    if (newTitle && mediaTitle) mediaTitle.textContent = newTitle;
                    if (newDesc && mediaText) mediaText.textContent = newDesc;
                }
            }).to([mediaImage, mediaTitle, mediaText], {
                opacity: 1,
                y: 0,
                duration: 0.4,
                ease: "power2.out",
                stagger: 0.05
            });
        };

        // تفعيل الكرت النشط
        const activateCard = (index) => {
            cards.forEach((c, i) => {
                const isActive = (i === index);
                const marker = c.querySelector('.service-card-marker');

                if (isActive) {
                    c.classList.add('active-service');
                    gsap.to(c, { opacity: 1, filter: "blur(0px)", scale: 1, duration: 0.5 });
                    if (marker) gsap.to(marker, { background: "#ff0000", scale: 1.2, duration: 0.3 });
                } else {
                    c.classList.remove('active-service');
                    gsap.to(c, { opacity: 0.3, filter: "blur(4px)", scale: 0.95, duration: 0.5 });
                    if (marker) gsap.to(marker, { background: "transparent", scale: 1, duration: 0.3 });
                }
            });
        };

        // ✨ الحل الأساسي: ScrollTrigger مع Snap
        cards.forEach((card, index) => {
            ScrollTrigger.create({
                id: 'service-card-trigger',
                trigger: card,
                start: "center center",    // ← الكرت يبدأ التفعيل عندما يكون في المنتصف
                end: "center center",      // ← ينتهي في نفس النقطة
                
                // ✅ هذا هو المهم: تثبيت الكرت في المنتصف
                snap: {
                    snapTo: "center",      // ← يثبت في المنتصف بالضبط
                    duration: 0.4,         // ← مدة الحركة للوصول للمنتصف
                    delay: 0,              // ← بدون تأخير
                    ease: "power2.inOut"   // ← منحنى سلس
                },
                
                toggleClass: "is-in-view",
                invalidateOnRefresh: true,
                
                onEnter: () => {
                    activateCard(index);
                    updateMedia(index);
                },
                onEnterBack: () => {
                    activateCard(index);
                    updateMedia(index);
                }
            });
        });

        // ✨ إضافة Snap للقسم بأكمله
        ScrollTrigger.create({
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            snap: {
                snapTo: (progress) => {
                    // حساب أقرب كارت للمنتصف
                    const positions = Array.from(cards).map((card, i) => {
                        const rect = card.getBoundingClientRect();
                        const offset = rect.top + rect.height / 2 - window.innerHeight / 2;
                        return Math.abs(offset);
                    });
                    const nearestIndex = positions.indexOf(Math.min(...positions));
                    return nearestIndex / (cards.length - 1);
                },
                duration: { min: 0.3, max: 0.6 },
                ease: "power1.inOut"
            }
        });

        // تفعيل أول كرت
        activateCard(0);
        updateMedia(0);

        ScrollTrigger.refresh();
    };

    // التحميل الآمن
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
        console.warn('Services Animation: GSAP/ScrollTrigger unavailable, skipping.');
        return;
    }

    initServices(window.gsap || window.GSAP, window.ScrollTrigger);
});