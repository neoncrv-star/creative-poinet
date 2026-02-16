document.addEventListener('DOMContentLoaded', function () {
    // التحقق من بيئة العمل
    if (typeof window === 'undefined') return;

    var start = function () {
        // التحقق من تحميل مكتبات GSAP
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.warn('GSAP or ScrollTrigger not loaded');
            // تعيين علامة الجاهزية لتجنب التعليق
            window.__CP_READY = window.__CP_READY || {};
            window.__CP_READY.services = true;
            return;
        }

        gsap.registerPlugin(ScrollTrigger);

        // 1. تحديد العناصر
        var section = document.querySelector('.services-horizontal-section');
        if (!section) {
            window.__CP_READY = window.__CP_READY || {};
            window.__CP_READY.services = true;
            return;
        }

        var mediaImage = section.querySelector('.services-media-image-inner');
        var mediaTitle = section.querySelector('.services-media-title');
        var mediaText = section.querySelector('.services-media-text');
        var cards = section.querySelectorAll('.service-card');

        // التحقق من وجود العناصر الأساسية
        if (!mediaImage || !cards.length) {
            window.__CP_READY = window.__CP_READY || {};
            window.__CP_READY.services = true;
            return;
        }

        var activeIndex = -1; // لتتبع الكرت الحالي

        // 2. دالة تحديث الصورة والنصوص (القسم الثابت)
        function updateStickyContent(card, index) {
            if (index === activeIndex) return; // منع التكرار إذا نفس الكرت
            activeIndex = index;

            // جلب البيانات
            var newImageSrc = card.getAttribute('data-image');
            var newTitle = card.getAttribute('data-title') || card.querySelector('.service-card-title')?.textContent;
            var newDesc = card.getAttribute('data-description') || card.querySelector('.service-card-desc')?.textContent;

            // إنشاء Timeline لتزامن خروج القديم ودخول الجديد
            var tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

            // أ) إخفاء العناصر الحالية (Fade Out & Move Up)
            tl.to([mediaImage, mediaTitle, mediaText], {
                opacity: 0,
                y: -15,
                filter: 'blur(5px)',
                duration: 0.3
            })
            // ب) تغيير المحتوى فعلياً
            .call(function () {
                if (mediaTitle) mediaTitle.textContent = newTitle;
                if (mediaText) mediaText.textContent = newDesc;
                if (mediaImage && newImageSrc && mediaImage.tagName === 'IMG') {
                    mediaImage.setAttribute('src', newImageSrc);
                }
            })
            // ج) إعادة تهيئة الموقع (set) ثم الإظهار (Fade In)
            .set([mediaImage, mediaTitle, mediaText], { y: 15 }) // نبدأ من الأسفل قليلاً
            .to([mediaImage, mediaTitle, mediaText], {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: 0.4,
                stagger: 0.05 // تأخير بسيط بين الصورة والنصوص لجمالية الحركة
            });
        }

        // 3. دالة تفعيل الكرت (القائمة المتحركة)
        function activateCard(index) {
            cards.forEach(function (c, i) {
                var isActive = (i === index);
                var divider = c.querySelector('.service-divider');
                var marker = c.querySelector('.service-card-marker');

                // إضافة/إزالة الكلاس للتحكم بالـ CSS أيضاً
                if (isActive) {
                    c.classList.add('service-card-active');
                } else {
                    c.classList.remove('service-card-active');
                }

                // حركة GSAP للكروت (التركيز vs التغبيش)
                gsap.to(c, {
                    opacity: isActive ? 1 : 0.25, // الكرت غير النشط شفاف
                    filter: isActive ? 'blur(0px)' : 'blur(4px)', // الكرت غير النشط مغبش
                    scale: isActive ? 1 : 0.95, // الكرت النشط أكبر قليلاً
                    duration: 0.5,
                    overwrite: true
                });

                // حركة الخط الفاصل (Divider)
                if (divider) {
                    gsap.to(divider, {
                        scaleX: isActive ? 1 : 0,
                        transformOrigin: "left center",
                        duration: 0.5,
                        overwrite: true
                    });
                }

                // حركة النقطة (Marker)
                if (marker) {
                    gsap.to(marker, {
                        backgroundColor: isActive ? "#ff0000" : "transparent",
                        borderColor: isActive ? "#ff0000" : "rgba(255,255,255,0.2)",
                        scale: isActive ? 1.1 : 1,
                        duration: 0.3
                    });
                }
            });
        }

        // 4. إعداد مراقب السكرول (ScrollTrigger)
        cards.forEach(function (card, index) {
            ScrollTrigger.create({
                trigger: card,
                // يبدأ التفعيل عندما يصل أعلى الكرت إلى 55% من ارتفاع الشاشة (المنتصف تقريباً)
                start: "top 55%", 
                // ينتهي عندما يغادر
                end: "bottom 55%",
                
                onEnter: function () {
                    activateCard(index);
                    updateStickyContent(card, index);
                },
                onEnterBack: function () {
                    activateCard(index);
                    updateStickyContent(card, index);
                }
            });
        });

        // 5. التهيئة الأولية (تفعيل أول كرت عند التحميل)
        if (cards.length > 0) {
            activateCard(0);
            // ملاحظة: لا نستدعي updateStickyContent هنا لتجنب وميض الصورة عند تحميل الصفحة
            // نفترض أن الـ HTML يحتوي بالفعل على صورة ونصوص الكرت الأول
        }

        // إشعار اكتمال التحميل
        window.__CP_READY = window.__CP_READY || {};
        window.__CP_READY.services = true;
    };

    // ==========================================
    // منطق التحميل الآمن (تكامل مع النظام لديك)
    // ==========================================
    
    // 1. محاولة استخدام scrollManager إذا وجد
    if (window.scrollManager && typeof window.scrollManager.section === 'function') {
        window.scrollManager.section('services', function (gsapRef, ScrollTriggerRef) {
            if (!gsapRef || !ScrollTriggerRef) return;
            start();
        });
        return;
    }

    // 2. محاولة استخدام safeScrollTrigger إذا وجد
    if (typeof window.safeScrollTrigger === 'function') {
        window.safeScrollTrigger(function (gsapRef, ScrollTriggerRef) {
            if (!gsapRef || !ScrollTriggerRef) return;
            start();
        });
        return;
    }

    // 3. التشغيل المباشر
    start();
});
  