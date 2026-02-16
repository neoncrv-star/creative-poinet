document.addEventListener('DOMContentLoaded', function () {
    if (typeof window === 'undefined') return;

    var section = document.querySelector('.services-horizontal-section');
    if (!section) return;

    var serviceCards = section.querySelectorAll('.service-card');
    var stickyImage = section.querySelector('.services-media-image-inner');
    var stickyTitle = section.querySelector('.services-media-title');
    var stickyDesc = section.querySelector('.services-media-text');

    if (!serviceCards.length || !stickyImage || !stickyTitle || !stickyDesc) return;

    function updateFromCard(card) {
        if (!card) return;
        serviceCards.forEach(function (c) {
            c.classList.toggle('active-service', c === card);
        });

        var newImage = card.getAttribute('data-image') || '';
        var newTitle = card.getAttribute('data-title') || '';
        var newDesc = card.getAttribute('data-description') || '';

        if (!newTitle) {
            var tEl = card.querySelector('.service-card-title');
            if (tEl) newTitle = tEl.textContent || '';
        }
        if (!newDesc) {
            var dEl = card.querySelector('.service-card-desc');
            if (dEl) newDesc = dEl.textContent || '';
        }

        if (stickyTitle) stickyTitle.textContent = newTitle;
        if (stickyDesc) stickyDesc.textContent = newDesc;

        if (stickyImage && newImage) {
            var current = stickyImage.getAttribute('src') || '';
            if (current !== newImage) {
                stickyImage.style.opacity = '0';
                setTimeout(function () {
                    stickyImage.onload = function () {
                        stickyImage.style.opacity = '1';
                        stickyImage.onload = null;
                    };
                    stickyImage.setAttribute('src', newImage);
                }, 200);
            }
        }
    }

    function setupObserver() {
        if (!('IntersectionObserver' in window)) {
            window.addEventListener('scroll', function () {
                var bestCard = null;
                var bestScore = Infinity;
                var viewportCenter = (window.innerHeight || document.documentElement.clientHeight || 0) / 2;
                serviceCards.forEach(function (card) {
                    var rect = card.getBoundingClientRect();
                    var cardCenter = rect.top + rect.height / 2;
                    var score = Math.abs(cardCenter - viewportCenter);
                    if (score < bestScore) {
                        bestScore = score;
                        bestCard = card;
                    }
                });
                if (bestCard) updateFromCard(bestCard);
            }, { passive: true });
            if (serviceCards[0]) updateFromCard(serviceCards[0]);
            return;
        }

        var observerOptions = {
            root: null,
            rootMargin: '-40% 0px -40% 0px',
            threshold: 0
        };

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                updateFromCard(entry.target);
            });
        }, observerOptions);

        serviceCards.forEach(function (card) {
            observer.observe(card);
        });

        if (serviceCards[0]) updateFromCard(serviceCards[0]);
    }

    setupObserver();

    window.__CP_READY = window.__CP_READY || {};
    window.__CP_READY.services = true;
});
