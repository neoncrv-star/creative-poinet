;(function (win) {
    if (typeof win === 'undefined') {
        return;
    }
    var inited = false;
    function initGlobal(ScrollTrigger) {
        if (inited || !ScrollTrigger) return;
        inited = true;
        try {
            ScrollTrigger.config({
                autoRefreshEvents: "visibilitychange,DOMContentLoaded,load,resize"
            });
        } catch (e) {
            console.warn("ScrollTrigger config failed:", e);
        }
        try {
            if (!win.__SCROLL_TRIGGER_INIT__) {
                win.__SCROLL_TRIGGER_INIT__ = true;
            }
            if (typeof MutationObserver !== "undefined" && document && document.body && !win.__SCROLL_TRIGGER_OBSERVER__) {
                var refreshTimeout = null;
                var observer = new MutationObserver(function () {
                    if (!win.ScrollTrigger) return;
                    if (refreshTimeout) {
                        win.clearTimeout(refreshTimeout);
                    }
                    refreshTimeout = win.setTimeout(function () {
                        try {
                            ScrollTrigger.refresh();
                        } catch (e) {
                            console.warn("ScrollTrigger refresh from observer failed:", e);
                        }
                    }, 120);
                });
                observer.observe(document.body, { childList: true, subtree: true });
                win.__SCROLL_TRIGGER_OBSERVER__ = observer;
            }
            var refreshOnEvents = ["pageshow", "orientationchange"];
            refreshOnEvents.forEach(function (evt) {
                win.addEventListener(evt, function () {
                    if (!win.ScrollTrigger) return;
                    win.requestAnimationFrame(function () {
                        try {
                            ScrollTrigger.refresh();
                        } catch (e) {
                            console.warn("ScrollTrigger refresh on " + evt + " failed:", e);
                        }
                    });
                });
            });
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
    win.killAllScrollTriggers = function () {
        try {
            if (!win || !win.ScrollTrigger) return;
            ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
        } catch (e) {
            console.warn("ScrollTrigger killAll error:", e);
        }
    };
})(typeof window !== "undefined" ? window : undefined);

