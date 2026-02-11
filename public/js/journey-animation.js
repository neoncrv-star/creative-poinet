document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);

    const journeySection = document.querySelector('.journey-scroll-section');
    const eyebrow = document.querySelector('.journey-eyebrow');
    const lines = document.querySelectorAll('.journey-line');

    if (!journeySection || !lines.length) return;

    // Animate Eyebrow first
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

    // Animate Lines Sequence
    lines.forEach((line) => {
        ScrollTrigger.create({
            trigger: line,
            start: "top 65%", // Trigger when line is slightly below center
            end: "bottom 35%", // End when line is slightly above center
            toggleClass: "is-active",
            // markers: true, // Remove for production
            onEnter: () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const activeColor = currentTheme === 'light' ? "#000" : "#fff";
                gsap.to(line, { opacity: 1, color: activeColor, filter: "blur(0px)", duration: 0.5 });
            },
            onLeave: () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const inactiveColor = currentTheme === 'light' ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.1)";
                gsap.to(line, { opacity: 0.1, color: inactiveColor, filter: "blur(2px)", duration: 0.5 });
            },
            onEnterBack: () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const activeColor = currentTheme === 'light' ? "#000" : "#fff";
                gsap.to(line, { opacity: 1, color: activeColor, filter: "blur(0px)", duration: 0.5 });
            },
            onLeaveBack: () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const inactiveColor = currentTheme === 'light' ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.1)";
                gsap.to(line, { opacity: 0.1, color: inactiveColor, filter: "blur(2px)", duration: 0.5 });
            }
        });
    });
});
