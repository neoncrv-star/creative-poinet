;(function (win) {
    if (typeof win === 'undefined') return;

    var inited = false;
    var sections = {};

    // 🔥 Interaction lock لمنع refresh أثناء hover أو التفاعل
    var interactionLock = false;
    var lockTimer = null;

    function lockInteraction() {
        interactionLock = true;
        if (lockTimer) clearTimeout(lockTimer);
        lockTimer = setTimeout(function () {
            interactionLock = false;
        }, 250);
    }

    // التقاط كل أنواع التفاعل
    if (typeof document !== "undefined") {
        document.addEventListener("pointerenter", lockInteraction, true);
        document.addEventListener("pointerleave", lockInteraction, true);
        document.addEventListener("touchstart", lockInteraction, true);
        document.addEventListener("mouseenter", lockInteraction, true);
    }

    // 🔥 Debounce حقيقي للـ refresh
    var refreshTimeout = null;

    function scheduleRefresh() {
        if (!win || !win.ScrollTrigger) return;
        if (interactionLock) return;

        if (refreshTimeout) {
            clearTimeout(refreshTimeout);
        }

        refreshTimeout = setTimeout(function () {
            requestAnimationFrame(function () {
                try {
                    var ScrollTrigger = win.ScrollTrigger;

                    if (!ScrollTrigger) return;

                    if (typeof ScrollTrigger.getAll === "function") {
                        ScrollTrigger.getAll().forEach(function (t) {
                            try {
                                if (!t) return;
                                var pin = t.pin || t.trigger;
                                if (!pin) return;
                                if (!pin.parentNode || !pin.isConnected) {
                                    t.kill(true);
                                }
                            } catch (e) {}
                        });
                    }

                    ScrollTrigger.refresh();
                } catch (e) {
                    console.warn("ScrollTrigger refresh failed:", e);
                }
            });
        }, 220);
    }


    function initGlobal(ScrollTrigger) {
        if (inited || !ScrollTrigger) return;
        inited = true;

        try {
            ScrollTrigger.config({
                autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
                limitCallbacks: true,
                ignoreMobileResize: true
            });
        } catch (e) {
            console.warn("ScrollTrigger config failed:", e);
        }

        try {
            if (!win.__SCROLL_TRIGGER_INIT__) {
                win.__SCROLL_TRIGGER_INIT__ = true;

                // refresh فقط بعد استقرار الصفحة
                if (win.addEventListener) {
                    win.addEventListener("load", function () {
                        setTimeout(scheduleRefresh, 120);
                    });
                }

                // بعد تحميل الخطوط
                if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
                    document.fonts.ready.then(function () {
                        setTimeout(scheduleRefresh, 120);
                    }).catch(function () {});
                }

                // عند عودة التبويب
                document.addEventListener("visibilitychange", function () {
                    if (!document.hidden) {
                        setTimeout(scheduleRefresh, 80);
                    }
                });
            }
        } catch (e) {
            console.warn("ScrollTrigger global init failed:", e);
        }
    }

    // 🔥 Safe wrapper
    win.safeScrollTrigger = function (callback) {
        if (typeof win === "undefined") return;
        if (typeof callback !== "function") return;

        win.requestAnimationFrame(function () {
            try {
                var gsap = win.gsap || win.GSAP;
                var ScrollTrigger = win.ScrollTrigger;

                if (!gsap || !ScrollTrigger) return;

                initGlobal(ScrollTrigger);

                callback(gsap, ScrollTrigger);
            } catch (e) {
                console.warn("ScrollTrigger prevented crash:", e);
            }
        });
    };

    // 🔥 Scroll manager
    win.scrollManager = win.scrollManager || {

        section: function (name, builder) {
            if (!name) return null;

            var entry = sections[name] || (sections[name] = {
                inited: false,
                cleanup: null
            });

            if (typeof builder === "function") {
                win.safeScrollTrigger(function (gsap, ScrollTrigger) {
                    entry.inited = true;

                    var cleanup = null;

                    try {
                        cleanup = builder(gsap, ScrollTrigger) || null;
                    } catch (e) {
                        console.warn("Scroll section '" + name + "' init failed:", e);
                        entry.inited = false;
                        entry.cleanup = null;
                        return;
                    }

                    if (typeof cleanup === "function") {
                        entry.cleanup = cleanup;
                    }

                    setTimeout(scheduleRefresh, 60);
                });
            }

            return {
                refresh: function () { scheduleRefresh(); },
                destroy: function () {
                    if (entry.cleanup) {
                        try { entry.cleanup(); } catch (e) {}
                    }
                    entry.inited = false;
                    entry.cleanup = null;
                }
            };
        },

        refresh: function () {
            scheduleRefresh();
        },

        destroyAll: function () {
            try {
                Object.keys(sections).forEach(function (key) {
                    var entry = sections[key];

                    if (entry && entry.cleanup) {
                        try { entry.cleanup(); } catch (e) {}
                    }

                    sections[key] = {
                        inited: false,
                        cleanup: null
                    };
                });

                if (win.ScrollTrigger && win.ScrollTrigger.getAll) {
                    win.ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
                }
            } catch (e) {
                console.warn("ScrollManager destroyAll error:", e);
            }
        }
    };

    // 🔥 Kill helper
    win.killAllScrollTriggers = function () {
        try {
            if (!win || !win.ScrollTrigger) return;
            win.ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
        } catch (e) {
            console.warn("ScrollTrigger killAll error:", e);
        }
    };

})(typeof window !== "undefined" ? window : undefined);
