document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(CSSPlugin);

    const menuDot = document.querySelector('.menu-dot');
    const dot = document.querySelector('.dot');
    const menu = document.querySelector('.header-menu');
    const menuLinks = document.querySelectorAll('.header-menu a');
    const isRTL = document.documentElement.dir === 'rtl';

    let isOpen = false;
    let isMobile = window.innerWidth < 1024;

    // Initialize Timeline
    const tl = gsap.timeline({ paused: true, reversed: true });

    // Define Animations based on device type
    function initAnimations() {
        tl.clear();
        isMobile = window.innerWidth < 1024;

        if (isMobile) {
            // Mobile Animation: Full screen slide down
            tl.to(menu, {
                duration: 0.5,
                opacity: 1,
                visibility: 'visible',
                y: '0%', // Slide to 0 (assuming starting at -100%)
                ease: "power3.out"
            })
            .to(menuLinks, {
                duration: 0.4,
                opacity: 1,
                y: 0,
                stagger: 0.1,
                ease: "back.out(1.7)"
            }, "-=0.2");
        } else {
            // Desktop Animation: Slide horizontally
            // Initial state set in CSS to hidden
            
            const startX = isRTL ? -50 : 50; // Slide from left in RTL, right in LTR? 
            // Actually, in CSS I set:
            // RTL: left: 0, rounded right.
            // LTR: right: 0, rounded left.
            // The menu is positioned where it should end up.
            // So we animate 'width' or 'clip-path' or 'x'.
            
            // Let's use clip-path for a "reveal" effect or just width.
            // Or simple opacity + x translation.
            
            // Set initial state via GSAP to be safe
            gsap.set(menu, { 
                x: isRTL ? '-20px' : '20px', // Start slightly off
                width: 'auto'
            });

            tl.to(menu, {
                duration: 0.4,
                opacity: 1,
                visibility: 'visible',
                x: '0%',
                ease: "power2.out"
            })
            .to(menuLinks, {
                duration: 0.3,
                opacity: 1,
                y: 0,
                stagger: 0.05,
                ease: "power2.out"
            }, "-=0.2");
        }
    }

    // Injecting lines for X
    const line1 = document.createElement('span');
    const line2 = document.createElement('span');
    line1.className = 'close-line line-1';
    line2.className = 'close-line line-2';
    // Style them
    const xColor = document.documentElement.getAttribute('data-theme') === 'light' ? '#000' : '#fff';
    gsap.set([line1, line2], {
        position: 'absolute',
        width: '20px',
        height: '2px',
        backgroundColor: xColor,
        opacity: 0,
        rotate: 0
    });
    if (menuDot) {
        menuDot.appendChild(line1);
        menuDot.appendChild(line2);
    }

    // Redefine dotAnim
    const dotTl = gsap.timeline({ paused: true, reversed: true });
    
    dotTl
    // Hide Dot and Ripple
    .to(dot, {
        duration: 0.3,
        scale: 0,
        opacity: 0,
        visibility: 'hidden',
        ease: "back.in(1.7)"
    })
    // Show X
    .to([line1, line2], {
        duration: 0.3,
        opacity: 1,
        visibility: 'visible',
        ease: "power2.out"
    }, "-=0.1")
    .to(line1, {
        rotation: 45,
        duration: 0.3,
        ease: "back.out(1.7)"
    }, "<")
    .to(line2, {
        rotation: -45,
        duration: 0.3,
        ease: "back.out(1.7)"
    }, "<");

    
    // Initialize
    initAnimations();

    // Resize Handler
    window.addEventListener('resize', () => {
        // Debounce could be good here
        const newIsMobile = window.innerWidth < 1024;
        if (newIsMobile !== isMobile) {
            // Reset if crossing breakpoint
            if (isOpen) toggleMenu();
            initAnimations();
        }
    });

    // Toggle Function
    function toggleMenu() {
        isOpen = !isOpen;
        if (menuDot) {
            menuDot.setAttribute('aria-expanded', isOpen);
            updateXColor();

            if (!isOpen) {
                // Closing logic
                menuDot.classList.remove('is-open');
                
                // Reverse GSAP timelines
                tl.reverse();
                dotTl.reverse();
                
                menu.classList.remove('is-open');
            } else {
                // Opening logic
                menuDot.classList.add('is-open');
                menu.classList.add('is-open');
                tl.play();
                dotTl.play();
            }
        }
    }

    function updateXColor() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const xColor = currentTheme === 'light' ? '#000' : '#fff';
        gsap.set([line1, line2], { backgroundColor: xColor });
    }

    // Listen for theme changes to update X color if menu is open
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            // Small delay to let data-theme attribute update
            setTimeout(updateXColor, 10);
        });
    }

    if (menuDot) {
        menuDot.addEventListener('click', toggleMenu);
    }

    // Close on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) {
            toggleMenu();
        }
    });

    // Close on link click (optional, good for UX)
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (isOpen) toggleMenu();
        });
    });
});
