document.addEventListener('DOMContentLoaded', () => {
    if (typeof window === 'undefined') return;
    if (typeof window.safeScrollTrigger === 'function') {
        window.safeScrollTrigger((gsap, ScrollTrigger) => {
            gsap.registerPlugin(ScrollTrigger);

            const journeySection = document.querySelector('.journey-scroll-section');
            const eyebrow = document.querySelector('.journey-eyebrow');
            const lines = document.querySelectorAll('.journey-line');

            if (!journeySection || !lines.length) return;

            gsap.to(eyebrow, {
                scrollTrigger: {
                    trigger: journeySection,
                    start: "top 80%",
                    toggleActions: "play none none reverse"
                },
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "power2.out"
            });

            lines.forEach((line) => {
                if (!line || !line.parentNode || !line.isConnected) return;
                ScrollTrigger.create({
                    trigger: line,
                    start: "top 65%",
                    end: "bottom 35%",
                    toggleClass: "is-active",
                    onEnter: () => {
                        if (!line || !line.parentNode || !line.isConnected) return;
                        const currentTheme = document.documentElement.getAttribute('data-theme');
                        const activeColor = currentTheme === 'light' ? "#000" : "#fff";
                        gsap.to(line, { opacity: 1, color: activeColor, filter: "blur(0px)", duration: 0.5 });
                    },
                    onLeave: () => {
                        if (!line || !line.parentNode || !line.isConnected) return;
                        const currentTheme = document.documentElement.getAttribute('data-theme');
                        const inactiveColor = currentTheme === 'light' ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.1)";
                        gsap.to(line, { opacity: 0.1, color: inactiveColor, filter: "blur(2px)", duration: 0.5 });
                    },
                    onEnterBack: () => {
                        if (!line || !line.parentNode || !line.isConnected) return;
                        const currentTheme = document.documentElement.getAttribute('data-theme');
                        const activeColor = currentTheme === 'light' ? "#000" : "#fff";
                        gsap.to(line, { opacity: 1, color: activeColor, filter: "blur(0px)", duration: 0.5 });
                    },
                    onLeaveBack: () => {
                        if (!line || !line.parentNode || !line.isConnected) return;
                        const currentTheme = document.documentElement.getAttribute('data-theme');
                        const inactiveColor = currentTheme === 'light' ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.1)";
                        gsap.to(line, { opacity: 0.1, color: inactiveColor, filter: "blur(2px)", duration: 0.5 });
                    }
                });
            });
        });
        return;
    }
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
    const journeySection = document.querySelector('.journey-scroll-section');
    const eyebrow = document.querySelector('.journey-eyebrow');
    const lines = document.querySelectorAll('.journey-line');
    if (!journeySection || !lines.length) return;
    gsap.to(eyebrow, {
        scrollTrigger: {
            trigger: journeySection,
            start: "top 80%",
            toggleActions: "play none none reverse"
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out"
    });
    lines.forEach((line) => {
        if (!line || !line.parentNode || !line.isConnected) return;
        ScrollTrigger.create({
            trigger: line,
            start: "top 65%",
            end: "bottom 35%",
            toggleClass: "is-active",
            onEnter: () => {
                if (!line || !line.parentNode || !line.isConnected) return;
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const activeColor = currentTheme === 'light' ? "#000" : "#fff";
                gsap.to(line, { opacity: 1, color: activeColor, filter: "blur(0px)", duration: 0.5 });
            },
            onLeave: () => {
                if (!line || !line.parentNode || !line.isConnected) return;
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const inactiveColor = currentTheme === 'light' ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.1)";
                gsap.to(line, { opacity: 0.1, color: inactiveColor, filter: "blur(2px)", duration: 0.5 });
            },
            onEnterBack: () => {
                if (!line || !line.parentNode || !line.isConnected) return;
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const activeColor = currentTheme === 'light' ? "#000" : "#fff";
                gsap.to(line, { opacity: 1, color: activeColor, filter: "blur(0px)", duration: 0.5 });
            },
            onLeaveBack: () => {
                if (!line || !line.parentNode || !line.isConnected) return;
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const inactiveColor = currentTheme === 'light' ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.1)";
                gsap.to(line, { opacity: 0.1, color: inactiveColor, filter: "blur(2px)", duration: 0.5 });
            }
        });
    });
});
