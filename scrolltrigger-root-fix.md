## نطاق الإصلاح

- بيئة: موقع Creative Point (Node + Express + EJS، بدون React/SPA).
- المشكلة: أخطاء `ScrollTrigger` متقطعة من نوع DOM mutation مثل:
  - `Uncaught NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.`
- الهدف: منع الكراش، منع memory leak، وضمان استقرار الأنيميشن.

## الملفات المعدلة

- `views/partials/header.ejs`
  - إضافة تحميل مبكر للطبقة الآمنة:
    - `/public/js/gsap-safe.js`
- `public/js/gsap-safe.js` (جديد)
  - طبقة حماية عالمية:
    - `window.safeScrollTrigger(callback)`
    - `window.killAllScrollTriggers()`
  - تكوين عام:
    - `ScrollTrigger.config({ autoRefreshEvents: "visibilitychange,DOMContentLoaded,load,resize" })`
  - إضافة:
    - `MutationObserver` على `document.body` مع debounce لتشغيل `ScrollTrigger.refresh()`.
    - مستمعين `pageshow` و`orientationchange` لتحديث التريجر بعد تغيّر الـ DOM أو الرجوع من الـ bfcache.
    - علم عالمي `window.__SCROLL_TRIGGER_INIT__` للتأكد من أن التهيئة العامة لا تتكرر.

- `public/js/main.js`
  - فرض التنفيذ في المتصفح فقط:
    - حارس `if (typeof window === 'undefined') return;`
  - استبدال الاستخدام المباشر لـ `gsap` و `ScrollTrigger` بـ:
    - `window.safeScrollTrigger((gsap, ScrollTrigger) => { ... })`
  - قبل إنشاء أي تريجر:
    - التأكد أن العنصر موجود وما زال في الـ DOM: `if (!el || !el.parentNode || !el.isConnected) return;`
  - عند تغيير الفلاتر في البورتفوليو:
    - تحديث آمن:
      - `requestAnimationFrame(() => window.ScrollTrigger.refresh())` مع try/catch.

- `public/js/hero-animation.js`
  - حارس للمتصفح:
    - `if (typeof window === 'undefined') return;`
  - تهيئة GSAP/ScrollTrigger عبر الطبقة الآمنة:
    - `window.safeScrollTrigger(() => { if (!window.gsap || !window.ScrollTrigger) return; start(); })`
  - إزالة منطق التحميل اليدوي لسكربت `ScrollTrigger` (لم يعد مطلوبًا لأننا نحمله من الـ header).
  - الحفاظ على تايملاين واحد مع `pin` و `scrub` لكن داخل مسار آمن بحيث لا يتم التنفيذ إلا بعد جاهزية المكتبة وDOM.

- `public/js/services-animation.js`
  - تهيئة عبر `safeScrollTrigger` مع fallback عادي إذا لم تتوفر الطبقة:
    - داخل callback:
      - فحص وجود العناصر (`servicesSection`, `panelContainer`, `panels`) قبل البناء.
      - تسجيل الصور ومراقبة نجاح/فشل التحميل لأغراض تشخيصية.
    - منطق horizontal scroll:
      - تنظيف كامل قبل إعادة البناء:
        - `ctx.revert()`، `mainTween.kill()`، وقتل كل `ScrollTrigger` المرتبطة بالقسم.
      - التحقق من أن `panelContainer` ما زال في الـ DOM قبل حساب المقاسات أو إنشاء التريجر.
      - استدعاء `ScrollTrigger.refresh()` مؤجل باستخدام `setTimeout` + `requestAnimationFrame`.
  - إضافة نسخة fallback في حالة عدم توفر `safeScrollTrigger` لكن بنفس قواعد الحماية.

- `public/js/journey-animation.js`
  - نقل التهيئة إلى `safeScrollTrigger` مع fallback:
    - فحص وجود العناصر (`journeySection`, `lines`) قبل الإنشاء.
    - لكل سطر:
      - قبل أي تعديل أو أنيميشن يتم التأكد أن العنصر ما زال متصلاً بالـ DOM.

- `views/portfolio/detail.ejs`
  - استخدام `safeScrollTrigger` للأنيميشن الخاصة بالصفحة:
    - الحماية من العمل على عناصر غير متصلة بالـ DOM.

## أسباب المشكلة المحتملة

- إنشاء أو تحديث `ScrollTrigger` على عناصر تم حذفها أو إعادة تركيبها في الـ DOM.
- تغييرات في DOM (مثل تغيير فلاتر البورتفوليو أو تغيير اللغة/الثيم) أثناء وجود `ScrollTrigger` مثبت على عناصر لم تعد موجودة.
- محاولة تشغيل `ScrollTrigger` قبل تحميل GSAP أو قبل اكتمال DOM.
- تغييرات في ارتفاع المحتوى بدون `ScrollTrigger.refresh()`، مما يجعل الحسابات الداخلية تعتمد على عقد قديمة.

## الحل الجذري (طبقة GSAP Safe Layer)

1. **تأجيل التنفيذ إلى ما بعد DOM + GSAP**
   - جميع الأنيميشنات التي تعتمد على `ScrollTrigger` لا تعمل الآن إلا عبر:
     - `window.safeScrollTrigger((gsap, ScrollTrigger) => { ... })`
   - هذا يضمن:
     - توفر `window` (لا تشغيل على SSR).
     - توفر `gsap` و`ScrollTrigger`.
     - تنفيذ داخل `requestAnimationFrame` بعد اكتمال دورة الرسم الحالية.

2. **منع العمل على عناصر غير موجودة**
   - قبل أي تريجر جديد:
     - التحقق من:
       - `if (!el || !el.parentNode || !el.isConnected) return;`
   - هذا يمنع أخطاء `insertBefore` الناتجة عن محاولات على عقد منفصلة عن الـ DOM.

3. **تنظيف كامل عند إعادة البناء**
   - في سكربت الخدمات الأفقية:
     - دالة `cleanup()` تقوم بـ:
       - `ctx.revert()`
       - `mainTween.kill()`
       - قتل التريجرات المرتبطة بالقسم أو المعرفات `service-*` و`servicesScroll`.
   - يتم استدعاء `cleanup()` قبل كل إعادة بناء نتيجة تغيير حجم الشاشة.

4. **تحديث ذكي بعد تغيّر الـ DOM**
   - `MutationObserver` على مستوى `document.body`:
     - أي تغيير كبير في DOM يؤدي إلى `ScrollTrigger.refresh()` مع debounce.
   - تحديثات إضافية عند:
     - `pageshow`
     - `orientationchange`

5. **توافق مع SSR وعدم التنفيذ في السيرفر**
   - في جميع السكربتات:
     - `if (typeof window === 'undefined') return;`
   - هذا يمنع تشغيل أي كود يعتمد على `document` أو `window` في بيئات غير المتصفح.

6. **منع التهيئة المكررة**
   - علم عالمي:
     - `window.__SCROLL_TRIGGER_INIT__`
   - يضمن أن تهيئة الإعدادات العامة والـ `MutationObserver` تتم مرة واحدة فقط.

## الاختبارات التي تم التركيز عليها (منهجية مقترحة)

> (التنفيذ الفعلي للاختبارات يتم من خلال المتصفح من طرف العميل)

- فتح/إغلاق الصفحة الرئيسية عدة مرات مع:
  - Scroll شديد وسريع.
  - تغيير حجم الشاشة (desktop ↔ mobile).
- اختبار قسم الخدمات الأفقي:
  - سحب أفقي قوي.
  - تغيير حجم الشاشة أثناء التمرير.
- اختبار صفحة تفاصيل البورتفوليو:
  - التمرير للأعلى والأسفل مع وجود عناصر متعددة تحمل `data-gsap`.
- مراقبة وحدة التحكم (Console):
  - عدم ظهور `NotFoundError` أو أي DOM mutation error.
  - ملاحظة أي تحذيرات من طبقة الحماية لمزيد من التحسين مستقبلاً.

## النتيجة المتوقعة

- عدم حدوث كراش بسبب `ScrollTrigger`.
- استقرار في أنيميشن الهيرو، الخدمات، والرحلة والزمن.
- تقليل احتمالية memory leaks بسبب:
  - قتل التريجرات القديمة.
  - إعادة البناء بطريقة آمنة عند تغير الـ DOM أو المقاس.

