document.addEventListener('DOMContentLoaded', function () {
    if (typeof window === 'undefined') return;

    var start = function () {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            window.__CP_READY = window.__CP_READY || {};
            window.__CP_READY.services = true;
            return;
        }

        gsap.registerPlugin(ScrollTrigger);

        var section = document.querySelector('.services-horizontal-section');
        if (!section) {
            window.__CP_READY = window.__CP_READY || {};
            window.__CP_READY.services = true;
            return;
        }

        var mediaSticky = section.querySelector('.services-media-sticky');
        var mediaImage = section.querySelector('.services-media-image-inner');
        var mediaTitle = section.querySelector('.services-media-title');
        var mediaText = section.querySelector('.services-media-text');
        var cards = section.querySelectorAll('.service-card');

        if (!mediaSticky || !mediaImage || !mediaTitle || !mediaText || !cards.length) {
            window.__CP_READY = window.__CP_READY || {};
            window.__CP_READY.services = true;
            return;
        }

        var activeIndex = -1;
        var easing = "power3.out";

        function setActive(card, index) {
            if (!card || index === activeIndex) return;
            activeIndex = index;

            cards.forEach(function (c) {
                if (!c) return;
                c.classList.toggle('service-card-active', c === card);
            });

            var title = card.getAttribute('data-title') || '';
            var description = card.getAttribute('data-description') || '';
            var imageSrc = card.getAttribute('data-image') || '';

            var targetTitle = title || (card.querySelector('.service-card-title') ? card.querySelector('.service-card-title').textContent : '');
            var targetDesc = description || (card.querySelector('.service-card-desc') ? card.querySelector('.service-card-desc').textContent : '');

            gsap.to([mediaTitle, mediaText], {
                opacity: 0,
                y: 12,
                duration: 0.28,
                ease: easing,
                onComplete: function () {
                    mediaTitle.textContent = targetTitle;
                    mediaText.textContent = targetDesc;
                    gsap.to([mediaTitle, mediaText], {
                        opacity: 1,
                        y: 0,
                        duration: 0.42,
                        ease: easing
                    });
                }
            });

            if (imageSrc && mediaImage.tagName === 'IMG') {
                gsap.to(mediaImage, {
                    scale: 1.03,
                    filter: 'blur(4px)',
                    duration: 0.28,
                    ease: easing,
                    onComplete: function () {
                        mediaImage.setAttribute('src', imageSrc);
                        gsap.to(mediaImage, {
                            scale: 1,
                            filter: 'blur(0px)',
                            duration: 0.5,
                            ease: easing
                        });
                    }
                });
            }
        }

        if (window.innerWidth >= 900) {
            ScrollTrigger.create({
                trigger: section,
                start: "top top+=80",
                end: "bottom bottom-=80",
                pin: mediaSticky,
                scrub: 0.7,
                anticipatePin: 1
            });

            gsap.to(mediaImage, {
                y: 40,
                scale: 1.05,
                ease: "none",
                scrollTrigger: {
                    trigger: section,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 0.5
                }
            });
        }

        cards.forEach(function (card, index) {
            var divider = card.querySelector('.service-divider');

            gsap.set(card, {
                opacity: 0.35,
                y: 26,
                filter: 'blur(4px)'
            });

            if (divider) {
                gsap.set(divider, {
                    scaleX: 0,
                    transformOrigin: "0% 50%"
                });
            }

            ScrollTrigger.create({
                trigger: card,
                start: "top 80%",
                end: "top 40%",
                onEnter: function () {
                    gsap.to(card, {
                        opacity: 1,
                        y: 0,
                        filter: 'blur(0px)',
                        duration: 0.6,
                        ease: easing
                    });
                    if (divider) {
                        gsap.to(divider, {
                            scaleX: 1,
                            duration: 0.6,
                            ease: easing
                        });
                    }
                    setActive(card, index);
                },
                onEnterBack: function () {
                    gsap.to(card, {
                        opacity: 1,
                        y: 0,
                        filter: 'blur(0px)',
                        duration: 0.6,
                        ease: easing
                    });
                    if (divider) {
                        gsap.to(divider, {
                            scaleX: 1,
                            duration: 0.6,
                            ease: easing
                        });
                    }
                    setActive(card, index);
                }
            });
        });

        if (cards[0]) {
            setActive(cards[0], 0);
        }

        window.__CP_READY = window.__CP_READY || {};
        window.__CP_READY.services = true;
    };

    if (window.scrollManager && typeof window.scrollManager.section === 'function') {
        window.scrollManager.section('services', function (gsapRef, ScrollTriggerRef) {
            if (!gsapRef || !ScrollTriggerRef) return;
            start();
        });
        return;
    }

    if (typeof window.safeScrollTrigger === 'function') {
        window.safeScrollTrigger(function (gsapRef, ScrollTriggerRef) {
            if (!gsapRef || !ScrollTriggerRef) return;
            start();
        });
        return;
    }

    if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
        window.__CP_READY = window.__CP_READY || {};
        window.__CP_READY.services = true;
        return;
    }

    start();
});
