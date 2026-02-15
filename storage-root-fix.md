## نطاق الإصلاح

- الهدف: منع فقدان أو كسر صور الخدمات / الشركاء / المشاريع بعد أي deploy أو إعادة تشغيل.
- البيئة: Node + Express + Sequelize + MySQL على استضافة مشتركة، مع نشر عبر `git pull` داخل `public_html`.

## 1. طبقة التخزين الموحدة Storage Service

- تم إنشاء طبقة تخزين مركزية:
  - المسار: `src/storage/storage.service.js`
  - المسؤوليات:
    - تحديد مسار التخزين الفعلي `UPLOAD_PATH`.
    - توليد رابط عام ثابت `UPLOAD_URL`.
    - توحيد شكل القيمة المخزنة في قاعدة البيانات.
    - التعامل مع حذف الملفات.
  - الدوال الأساسية:
    - `buildPublicUrl(filename)` → يرجع `UPLOAD_URL/filename` أو `/uploads/filename`.
    - `buildAbsolutePath(filename)` → يرجع المسار الكامل داخل التخزين الدائم.
    - `mapDbValueToLocal(dbValue)` → يحول القيم القديمة (`/uploads/x.png` أو `https://.../uploads/x.png`) إلى اسم الملف فقط.
    - `toDbValue(filename)` → يحول اسم الملف إلى القيمة القياسية للتخزين في قاعدة البيانات.
    - `removeFile(filename)` → حذف الملف من التخزين الدائم إن وجد.

## 2. نقل مسار التخزين إلى Persistent Volume

- المسار الافتراضي إذا لم تُضبط المتغيرات:
  - `UPLOAD_PATH` الافتراضي: `<root>/public/uploads`
- عند ضبط:
  - `UPLOAD_PATH=/home/storage/uploads`
  - فسيتم استخدام هذا المسار كجذر فعلي للصور.
- `storage.service` يضمن إنشاء المجلد إن لم يكن موجودًا (`fs.mkdirSync(..., { recursive: true })`)، وبالتالي:
  - المجلد يكون خارج مجلد المشروع إن تم ضبطه كما في المثال.
  - لا يتأثر بعمليات `git pull` أو إعادة بناء الكود.

## 3. ربط المجلد بالسيرفر

- في `app.js`:
  - يتم تحميل `storageService` مرة واحدة في أعلى الملف:
    - `const storageService = require('./src/storage/storage.service');`
  - ثم:
    - `app.use('/uploads', express.static(storageService.UPLOAD_PATH, { maxAge: '365d', etag: true }));`
  - هذا يعني أن أي طلب على:
    - `https://domain.com/uploads/xxx.webp`
    - يتم خدمته مباشرة من `UPLOAD_PATH` (سواء كان داخل أو خارج المشروع).

## 4. Static server + Fallback ذكي للصور

- بعد الـ static:
  - ميدل وير `/uploads` يقوم بـ:
    - محاولة self-heal إذا كان الامتداد المطلوب مفقودًا:
      - يبحث عن نفس الاسم بامتدادات `.webp`, `.png`, `.jpg`, ...الخ داخل `UPLOAD_PATH`.
      - إذا وجد بديل، يتم إرساله مع Cache طويل.
    - إذا لم توجد أي نسخة:
      - في سياق لوحة التحكم (`/admin`):
        - يظهر SVG أحمر واضح مكتوب عليه `MISSING` حتى ينتبه الأدمن.
      - في واجهة الزوار:
        - يتم إرسال صورة شفافة صغيرة (pixel) مع كاش قصير لمنع كسر التصميم والـ layout.

- ميدل وير إضافي:
  - دعم الوصول للملفات ذات الأسماء الـ hashed مباشرة بدون `/uploads/`:
    - إذا كان المسار `/abcdef1234....webp` يتم البحث عنه في `UPLOAD_PATH` وإرساله إن وجد.

## 5. توحيد تخزين المسارات في قاعدة البيانات

- تم تحديث `controllers/adminController.js` لاستخدام طبقة التخزين:
  - إضافة:
    - `const storageService = require('../src/storage/storage.service');`
  - `normalizeAsset(value)`:
    - تستخدم الآن:
      - `mapDbValueToLocal(value)` للحصول على اسم الملف القديم.
      - `toDbValue(filename)` لإنتاج القيمة القياسية الجديدة (غالبًا `UPLOAD_URL/filename`).
    - إذا كانت القيمة رابط خارجي بالكامل لا ينتمي إلى `UPLOAD_URL` أو لا يحتوي `/uploads/`:
      - يتم تركها كما هي (لا تُعتبر من الأصول المحلية).
  - `toHashedAsset(file)`:
    - تنقل الملف المرفوع إلى `storageService.UPLOAD_PATH`.
    - تستخدم SHA-256 لتوليد اسم ثابت.
    - تحاول إنشاء نسخة WebP.
    - تُرجع دائمًا قيمة قياسية عبر `storageService.toDbValue(...)` بدلًا من `/uploads/...`.
  - `deleteFile(stored)`:
    - يحوّل القيمة المخزنة (قديمة أو جديدة) إلى اسم ملف محلي.
    - يستدعي `removeFile` من `storageService`.

## 6. ربط Multer بطبقة التخزين

- في `routes/admin.js`:
  - تم استبدال المسار الثابت:
    - من: `cb(null, 'public/uploads');`
    - إلى: `cb(null, storageService.UPLOAD_PATH);`
  - هذا يضمن أن جميع الرفع يذهب مباشرة إلى الـ persistent volume.

## 7. سكربت Migration للصور القديمة

- تمت إضافة سكربت:
  - المسار: `scripts/fix-assets.js`
  - السكربت يقرأ المتغيرات من `.env` إن وجدت.
  - يقوم بالتالي:
    - الاتصال بقاعدة البيانات عبر `sequelize`.
    - تحميل موديلات: `Service`, `Partner`, `Project`, `Post`, `GlobalSeo`.
    - لكل سجل في هذه الجداول:
      - يحول القيمة المخزنة إلى اسم ملف محلي باستخدام `mapDbValueToLocal`.
      - يتأكد من وجود الملف في `UPLOAD_PATH`:
        - إن لم يوجد يحاول نسخه من `public/uploads`.
      - يحدّث القيمة في قاعدة البيانات إلى الشكل القياسي عبر `toDbValue(filename)`.
    - يسجل في الـ console:
      - عدد القيم التي تم تحديثها.
      - عدد الملفات المفقودة التي لم يتم العثور عليها.

- تم تسجيل سكربت npm:
  - في `package.json`:
    - `"fix:assets": "node scripts/fix-assets.js"`

## 8. متغيرات البيئة المطلوبة

- لإكمال المعمارية كما هو مطلوب:
  - في `.env` على السيرفر:
    - `UPLOAD_PATH=/home/storage/uploads`
    - `UPLOAD_URL=https://cpoint-sa.com/uploads`
  - بعد ضبطهما:
    - تشغيل:
      - `npm run fix:assets`
    - هذا يعيد كتابة القيم في قاعدة البيانات إلى الشكل:
      - `https://cpoint-sa.com/uploads/<hash>.webp`

## 9. منع الاعتماد على relative path

- بعد التعديلات:
  - جميع المسارات الجديدة التي تُخزَّن في DB تمر عبر:
    - `storageService.toDbValue(filename)`
  - هذا يضمن:
    - تخزين رابط كامل إذا كان `UPLOAD_URL` معرفًا.
    - أو على الأقل مسار موحد باستخدام `/uploads/...` في حال عدم توفر `UPLOAD_URL`.

- `normalizeAsset` يجعل الكود القديم الذي كان يستخدم `/uploads/...` ينسجم مع الشكل الجديد تدريجيًا كلما تم تحديث السجلات.

## 10. اختبار السيناريوهات الحرجة

السيناريو المقترح للتأكد من الاستقرار (يتم تنفيذه من المتصفح/السيرفر):

1. ضبط متغيرات البيئة وتشغيل التطبيق.
2. رفع:
   - صورة خدمة.
   - صورة شريك.
   - صورة مشروع.
3. التأكد من:
   - ظهور الصور في الواجهة الأمامية.
   - ظهورها في لوحة التحكم.
4. تشغيل:
   - `npm run fix:assets`
5. تنفيذ `git pull` + إعادة تشغيل السيرفر.
6. التحقق بعد إعادة التشغيل:
   - الصور لا تزال تعمل.
   - الروابط في قاعدة البيانات أصبحت بالشكل القياسي (`UPLOAD_URL/uploads/...`).

## 11. الخلاصة

- الرفع الآن يمر عبر مسار واحد فقط:
  - Multer → `storageService.UPLOAD_PATH` → `toHashedAsset` → DB (قيمة قياسية عبر `toDbValue`).
- السيرفر يخدم الصور من:
  - المسار الدائم `UPLOAD_PATH` بغض النظر عن مكانه (داخل المشروع أو خارجه).
- السكربت `fix:assets` يعالج التراكمات القديمة ويضمن عدم الاعتماد على المسارات النسبية.
- fallback الذكي يمنع كسر التصميم عند اختفاء ملف معين، مع إبقاء رسائل واضحة للأدمن في لوحة التحكم.

