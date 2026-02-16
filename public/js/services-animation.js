document.addEventListener('DOMContentLoaded', function () {
    
    // دالة التشغيل الرئيسية
    const initServices = () => {
        // 1. التحقق من البيئة
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') { 
            console.warn('GSAP Libraries not loaded yet.'); 
            return; 
        }

        gsap.registerPlugin(ScrollTrigger);

        // 2. تنظيف أي تريجر قديم لتجنب التضارب (حل المشكلة القاتلة)
        ScrollTrigger.getAll().forEach(t => {
            if (t.vars && t.vars.id === 'service-card-trigger') t.kill();
        });

        // 3. تحديد العناصر
        const section = document.querySelector('.services-horizontal-section');
        if (!section) return;

        const cards = section.querySelectorAll('.service-card');
        const mediaImage = section.querySelector('.services-media-image-inner');
        const mediaTitle = section.querySelector('.services-media-title');
        const mediaText = section.querySelector('.services-media-text');

        if (!cards.length || !mediaImage) return;

        // متغير لتجنب التكرار
        let currentActiveIndex = -1;

        // دالة تحديث المحتوى (تأثيرات بصرية فقط)
        const updateMedia = (index) => {
            if (index === currentActiveIndex) return;
            currentActiveIndex = index;

            const card = cards[index];
            const newSrc = card.getAttribute('data-image');
            const newTitle = card.getAttribute('data-title');
            const newDesc = card.getAttribute('data-description');

            // Timeline لتبديل المحتوى بنعومة
            const tl = gsap.timeline();

            // إخفاء
            tl.to([mediaImage, mediaTitle, mediaText], {
                opacity: 0,
                y: 10,
                duration: 0.25,
                ease: "power1.in",
                onComplete: () => {
                    // تبديل البيانات
                    if (newSrc && mediaImage.tagName === 'IMG') mediaImage.src = newSrc;
                    if (newTitle && mediaTitle) mediaTitle.textContent = newTitle;
                    if (newDesc && mediaText) mediaText.textContent = newDesc;
                }
            })
            // إظهار
            .to([mediaImage, mediaTitle, mediaText], {
                opacity: 1,
                y: 0,
                duration: 0.4,
                ease: "power2.out",
                stagger: 0.05
            });
        };

        // دالة تفعيل الكرت
        const activateCard = (index) => {
            cards.forEach((c, i) => {
                const isActive = (i === index);
                const marker = c.querySelector('.service-card-marker');
                
                if (isActive) {
                    c.classList.add('active-service');
                    gsap.to(c, { opacity: 1, filter: "blur(0px)", scale: 1, duration: 0.5 });
                    if(marker) gsap.to(marker, { background: "#ff0000", scale: 1.2, duration: 0.3 });
                } else {
                    c.classList.remove('active-service');
                    gsap.to(c, { opacity: 0.3, filter: "blur(4px)", scale: 0.95, duration: 0.5 });
                    if(marker) gsap.to(marker, { background: "transparent", scale: 1, duration: 0.3 });
                }
            });
        };

        // إنشاء ScrollTrigger لكل كرت
        cards.forEach((card, index) => {
            ScrollTrigger.create({
                id: 'service-card-trigger', // معرف للتنظيف لاحقاً
                trigger: card,
                // المنطقة الحساسة: عندما يكون منتصف الكرت في منتصف الشاشة
                start: "top center+=10%", 
                end: "bottom center-=10%",
                toggleClass: "is-in-view", // كلاس مؤقت للمساعدة
                
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

        // تفعيل الأول يدوياً عند التحميل
        activateCard(0);
        
        // إشعار الجاهزية
        window.__CP_READY = window.__CP_READY || {};
        window.__CP_READY.services = true;

        // تحديث الحسابات بعد تحميل الصور لضمان الدقة
        ScrollTrigger.refresh();
    };

    // تشغيل الدالة مع تأخير بسيط جداً لضمان استقرار الـ DOM
    setTimeout(initServices, 100);
});