/**
 * ════════════════════════════════════════════════════════════════════
 * GSAP Safe Wrapper - Production Ready
 * ════════════════════════════════════════════════════════════════════
 * 
 * يوفر طبقة حماية لـ GSAP ScrollTrigger لمنع الأخطاء الشائعة:
 * - NotFoundError عند إزالة عناصر DOM
 * - Refresh أثناء التفاعل
 * - تعارضات CSS sticky مع Pin
 * - Memory leaks
 * 
 * @version 2.0.0
 * @author Creative Point
 */

;(function (win) {
    'use strict';
    
    if (typeof win === 'undefined') return;

    // ════════════════════════════════════════════════════════════════
    // 1. State Management
    // ════════════════════════════════════════════════════════════════
    
    var state = {
        initialized: false,
        interactionLock: false,
        refreshScheduled: false,
        sections: {}
    };

    var timers = {
        interactionLock: null,
        refreshDebounce: null,
        safeguardTimeout: null
    };

    // ════════════════════════════════════════════════════════════════
    // 2. Safe Refresh Mechanism
    // ════════════════════════════════════════════════════════════════
    
    /**
     * قفل التفاعل مؤقتاً لمنع Refresh أثناء Hover/Click
     */
    function lockInteraction() {
        state.interactionLock = true;
        
        if (timers.interactionLock) {
            clearTimeout(timers.interactionLock);
        }
        
        timers.interactionLock = setTimeout(function () {
            state.interactionLock = false;
        }, 300);
    }

    /**
     * تنظيف ScrollTriggers المعلقة (orphaned)
     */
    function cleanupOrphanedTriggers() {
        if (!win.ScrollTrigger) return;
        
        try {
            var triggers = win.ScrollTrigger.getAll();
            
            triggers.forEach(function (trigger) {
                if (!trigger) return;
                
                var element = trigger.pin || trigger.trigger;
                
                // إذا العنصر محذوف من DOM
                if (element && (!element.parentNode || !element.isConnected)) {
                    try {
                        trigger.kill(true); // true = تنظيف كامل
                    } catch (e) {
                        console.warn('[GSAP Safe] Failed to kill orphaned trigger:', e.message);
                    }
                }
            });
        } catch (e) {
            console.warn('[GSAP Safe] Cleanup failed:', e.message);
        }
    }

    /**
     * جدولة Refresh بشكل آمن مع Debounce
     */
    function scheduleRefresh(delay) {
        delay = delay || 200;
        
        // لا تعمل refresh أثناء التفاعل
        if (state.interactionLock) {
            return;
        }
        
        // إلغاء أي refresh مجدول سابق
        if (timers.refreshDebounce) {
            clearTimeout(timers.refreshDebounce);
        }
        
        if (timers.safeguardTimeout) {
            clearTimeout(timers.safeguardTimeout);
        }
        
        state.refreshScheduled = true;
        
        timers.refreshDebounce = setTimeout(function () {
            if (!win.ScrollTrigger) {
                state.refreshScheduled = false;
                return;
            }
            
            win.requestAnimationFrame(function () {
                try {
                    // تنظيف قبل Refresh
                    cleanupOrphanedTriggers();
                    
                    // Refresh آمن
                    win.ScrollTrigger.refresh(true);
                    
                } catch (e) {
                    console.warn('[GSAP Safe] Refresh failed safely:', e.message);
                } finally {
                    state.refreshScheduled = false;
                }
            });
        }, delay);
        
        // Safeguard: إذا Refresh ما اشتغل خلال 5 ثواني، إلغاء الجدولة
        timers.safeguardTimeout = setTimeout(function () {
            state.refreshScheduled = false;
        }, 5000);
    }

    // ════════════════════════════════════════════════════════════════
    // 3. Event Listeners
    // ════════════════════════════════════════════════════════════════
    
    /**
     * تسجيل مستمعي الأحداث
     */
    function registerEventListeners() {
        if (typeof document === 'undefined') return;
        
        // قفل عند التفاعل
        var interactionEvents = [
            'pointerenter', 
            'pointerleave', 
            'touchstart', 
            'mouseenter',
            'mouseleave'
        ];
        
        interactionEvents.forEach(function (event) {
            document.addEventListener(event, lockInteraction, { passive: true, capture: true });
        });
        
        // Refresh عند استقرار الصفحة
        win.addEventListener('load', function () {
            setTimeout(function () {
                scheduleRefresh(150);
            }, 100);
        });
        
        // Refresh بعد تحميل الخطوط
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready
                .then(function () {
                    setTimeout(function () {
                        scheduleRefresh(100);
                    }, 50);
                })
                .catch(function (e) {
                    console.warn('[GSAP Safe] Fonts loading failed:', e.message);
                });
        }
        
        // Refresh عند عودة التبويب
        document.addEventListener('visibilitychange', function () {
            if (!document.hidden) {
                setTimeout(function () {
                    scheduleRefresh(100);
                }, 50);
            }
        });
        
        // Refresh عند تغيير حجم النافذة (مع Debounce قوي)
        var resizeTimer = null;
        win.addEventListener('resize', function () {
            if (resizeTimer) clearTimeout(resizeTimer);
            
            resizeTimer = setTimeout(function () {
                scheduleRefresh(250);
            }, 150);
        }, { passive: true });
    }

    // ════════════════════════════════════════════════════════════════
    // 4. ScrollTrigger Initialization
    // ════════════════════════════════════════════════════════════════
    
    /**
     * تهيئة ScrollTrigger بإعدادات آمنة
     */
    function initializeScrollTrigger() {
        if (state.initialized) return;
        if (!win.ScrollTrigger) return;
        
        try {
            // إعدادات آمنة
            win.ScrollTrigger.config({
                limitCallbacks: true,              // تقليل عدد Callbacks
                ignoreMobileResize: true,           // تجاهل تغيير حجم الموبايل
                autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load',
                syncInterval: 150                   // تزامن أقل تكراراً
            });
            
            // تسجيل الأحداث
            registerEventListeners();
            
            state.initialized = true;
            
            console.info('[GSAP Safe] ScrollTrigger initialized successfully');
            
        } catch (e) {
            console.error('[GSAP Safe] Initialization failed:', e);
        }
    }

    // ════════════════════════════════════════════════════════════════
    // 5. Public API
    // ════════════════════════════════════════════════════════════════
    
    /**
     * Wrapper آمن لتشغيل GSAP/ScrollTrigger
     * 
     * @param {Function} callback - دالة تستقبل (gsap, ScrollTrigger)
     */
    win.safeScrollTrigger = function (callback) {
        if (typeof callback !== 'function') {
            console.warn('[GSAP Safe] Callback must be a function');
            return;
        }
        
        win.requestAnimationFrame(function () {
            try {
                var gsap = win.gsap || win.GSAP;
                var ScrollTrigger = win.ScrollTrigger;
                
                if (!gsap) {
                    console.warn('[GSAP Safe] GSAP not loaded');
                    return;
                }
                
                if (!ScrollTrigger) {
                    console.warn('[GSAP Safe] ScrollTrigger not loaded');
                    return;
                }
                
                // تهيئة أول مرة
                initializeScrollTrigger();
                
                // تشغيل Callback
                callback(gsap, ScrollTrigger);
                
            } catch (e) {
                console.error('[GSAP Safe] Callback execution failed:', e);
            }
        });
    };

    // ════════════════════════════════════════════════════════════════
    // 6. Scroll Manager (لإدارة الأقسام)
    // ════════════════════════════════════════════════════════════════
    
    win.scrollManager = {
        
        /**
         * تسجيل قسم مع ScrollTrigger
         * 
         * @param {string} name - اسم القسم (مثل: 'services', 'hero')
         * @param {Function} builder - دالة بناء ScrollTriggers
         * @returns {Object} - كائن للتحكم بالقسم
         */
        section: function (name, builder) {
            if (!name || typeof builder !== 'function') {
                console.warn('[Scroll Manager] Invalid section registration');
                return null;
            }
            
            // إنشاء أو استرجاع القسم
            var section = state.sections[name] || {
                initialized: false,
                cleanup: null
            };
            
            state.sections[name] = section;
            
            // تشغيل البناء
            win.safeScrollTrigger(function (gsap, ScrollTrigger) {
                try {
                    var cleanup = builder(gsap, ScrollTrigger);
                    
                    section.initialized = true;
                    section.cleanup = typeof cleanup === 'function' ? cleanup : null;
                    
                    // Refresh بعد بناء القسم
                    setTimeout(function () {
                        scheduleRefresh(80);
                    }, 50);
                    
                } catch (e) {
                    console.error('[Scroll Manager] Section "' + name + '" failed:', e);
                    section.initialized = false;
                }
            });
            
            // واجهة للتحكم
            return {
                refresh: function () {
                    scheduleRefresh(100);
                },
                
                destroy: function () {
                    if (section.cleanup) {
                        try {
                            section.cleanup();
                        } catch (e) {
                            console.warn('[Scroll Manager] Cleanup failed for "' + name + '":', e);
                        }
                    }
                    
                    section.initialized = false;
                    section.cleanup = null;
                }
            };
        },
        
        /**
         * Refresh يدوي آمن
         */
        refresh: function () {
            scheduleRefresh(100);
        },
        
        /**
         * حذف كل الأقسام والـ Triggers
         */
        destroyAll: function () {
            try {
                // تنظيف كل الأقسام
                Object.keys(state.sections).forEach(function (key) {
                    var section = state.sections[key];
                    
                    if (section && section.cleanup) {
                        try {
                            section.cleanup();
                        } catch (e) {
                            console.warn('[Scroll Manager] Cleanup error for "' + key + '":', e);
                        }
                    }
                });
                
                // إعادة تعيين
                state.sections = {};
                
                // حذف كل ScrollTriggers
                if (win.ScrollTrigger) {
                    win.ScrollTrigger.getAll().forEach(function (t) {
                        try {
                            t.kill(true);
                        } catch (e) {
                            // silent fail
                        }
                    });
                }
                
                console.info('[Scroll Manager] All sections destroyed');
                
            } catch (e) {
                console.error('[Scroll Manager] Destroy all failed:', e);
            }
        }
    };

    // ════════════════════════════════════════════════════════════════
    // 7. Utility Functions
    // ════════════════════════════════════════════════════════════════
    
    /**
     * حذف كل ScrollTriggers (مساعد سريع)
     */
    win.killAllScrollTriggers = function () {
        try {
            if (!win.ScrollTrigger) return;
            
            var triggers = win.ScrollTrigger.getAll();
            
            triggers.forEach(function (trigger) {
                try {
                    trigger.kill(true);
                } catch (e) {
                    // silent
                }
            });
            
            console.info('[GSAP Safe] All ScrollTriggers killed');
            
        } catch (e) {
            console.warn('[GSAP Safe] Kill all failed:', e);
        }
    };

    // ════════════════════════════════════════════════════════════════
    // 8. Auto-Initialize (إذا GSAP موجود)
    // ════════════════════════════════════════════════════════════════
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            if (win.ScrollTrigger) {
                initializeScrollTrigger();
            }
        });
    } else {
        if (win.ScrollTrigger) {
            setTimeout(initializeScrollTrigger, 0);
        }
    }

    console.info('[GSAP Safe] Wrapper loaded successfully');

})(typeof window !== 'undefined' ? window : undefined);