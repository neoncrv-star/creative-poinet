;(function (win) {
    if (typeof win === 'undefined') {
        return;
    }
    var inited = false;
    var sections = {};
    var refreshScheduled = false;
    var lastRefreshTime = 0;
    var MIN_REFRESH_INTERVAL = 120;
    function scheduleRefresh() {
        if (!win || !win.ScrollTrigger) return;
        var now = Date.now();
        if (refreshScheduled) return;
        if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) return;
        refreshScheduled = true;
        win.requestAnimationFrame(function () {
            refreshScheduled = false;
            lastRefreshTime = Date.now();
            try {
                win.ScrollTrigger.refresh();
            } catch (e) {
                console.warn("ScrollTrigger refresh failed:", e);
            }
        });
    }
    function initGlobal(ScrollTrigger) {
        if (inited || !ScrollTrigger) return;
        inited = true;
        try {
            ScrollTrigger.config({
                autoRefreshEvents: "visibilitychange"
            });
        } catch (e) {
            console.warn("ScrollTrigger config failed:", e);
        }
        try {
            if (!win.__SCROLL_TRIGGER_INIT__) {
                win.__SCROLL_TRIGGER_INIT__ = true;
                if (win.addEventListener) {
                    win.addEventListener("load", function () {
                        scheduleRefresh();
                    });
                }
                if (typeof document !== "undefined" && document.fonts && document.fonts.ready) {
                    document.fonts.ready.then(function () {
                        scheduleRefresh();
                    }).catch(function () {});
                }
            }
        } catch (e) {
            console.warn("ScrollTrigger global init failed:", e);
        }
    }
    win.safeScrollTrigger = function (callback) {
        if (typeof win === "undefined") return;
        if (typeof callback !== "function") return;
        win.requestAnimationFrame(function () {
            try {
                var gsap = win.gsap || win.GSAP;
                var ScrollTrigger = win.ScrollTrigger;
                if (!gsap || !ScrollTrigger) {
                    return;
                }
                initGlobal(ScrollTrigger);
                callback(gsap, ScrollTrigger);
            } catch (e) {
                console.warn("ScrollTrigger prevented crash:", e);
            }
        });
    };
    win.scrollManager = win.scrollManager || {
        section: function (name, builder) {
            if (!name) return null;
            var entry = sections[name] || (sections[name] = {
                inited: false,
                cleanup: null
            });
            if (entry.inited) {
                return {
                    refresh: function () { scheduleRefresh(); },
                    destroy: function () {
                        if (entry.cleanup) {
                            try {
                                entry.cleanup();
                            } catch (e) {}
                        }
                        entry.inited = false;
                        entry.cleanup = null;
                    }
                };
            }
            if (typeof builder === "function") {
                win.safeScrollTrigger(function (gsap, ScrollTrigger) {
                    if (entry.inited) return;
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
                    scheduleRefresh();
                });
            }
            return {
                refresh: function () { scheduleRefresh(); },
                destroy: function () {
                    if (entry.cleanup) {
                        try {
                            entry.cleanup();
                        } catch (e) {}
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
                        try {
                            entry.cleanup();
                        } catch (e) {}
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
    win.killAllScrollTriggers = function () {
        try {
            if (!win || !win.ScrollTrigger) return;
            win.ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
        } catch (e) {
            console.warn("ScrollTrigger killAll error:", e);
        }
    };
})(typeof window !== "undefined" ? window : undefined);
