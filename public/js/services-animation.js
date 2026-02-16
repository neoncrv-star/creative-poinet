document.addEventListener('DOMContentLoaded', function () {
    if (typeof window === 'undefined') return;

    const initServices = (gsap, ScrollTrigger) => {
        if (!gsap || !ScrollTrigger) return;

        gsap.registerPlugin(ScrollTrigger);

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

        cards.forEach((card, index) => {
            ScrollTrigger.create({
                id: 'service-card-trigger',
                trigger: card,
                start: "top center+=10%",
                end: "bottom center-=10%",
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

        activateCard(0);
        updateMedia(0);

        ScrollTrigger.refresh();
    };

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
