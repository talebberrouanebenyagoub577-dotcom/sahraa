# البرومبت الجاهز لمبرمج الذكاء الاصطناعي

انسخ كل ما داخل الإطار وأرسله كما هو. لا تختصر الوثائق التي يشير إليها.

---

أنت تعمل داخل مستودع SAHRAA. نفّذ مواصفات 2026 كما هي مكتوبة، ولا تخترع مساراً بديلاً للشراء أو للتسعير أو للتتبع.

## اقرأ والتزم بهذا الترتيب قبل أي تعديل

1. `docs/AI-CODER-PROMPT.md` (هذه التعليمات).
2. `docs/ai-coding-rules.md` — القواعد الملزمة للكود الحالي.
3. `docs/architecture.md` و `docs/gap-analysis.md` — ما هو موجود حتى لا تعيد بناءه.
4. `docs/checkout.md` و `docs/offers.md` و `docs/upsells.md` و `docs/cross-sells.md` و `docs/cart.md` و `docs/orders.md` — مسار التحويل. التسعير ثابت: 199 لمنتج، 279 لاثنين، 349 لثلاثة، شحن مجاني، عرض ما بعد الطلب 99 ريالاً لمرة واحدة لمدة 15 ثانية.
5. `docs/tracking.md` — **المرجع الوحيد** لـ Meta و TikTok و Snapchat (Pixel + CAPI). طبّق صيغ الهاتف والتشفير وإزالة التكرار كما هي مكتوبة، لأنها مأخوذة من الوثائق الرسمية:
   - ميتا وسناب: أرقام فقط بمفتاح الدولة **بدون** `+` ثم SHA-256 على الخادم فقط.
   - تيك توك: E.164 **مع** `+` ثم SHA-256 على الخادم فقط.
   - البكسل في المتصفح لا يُشفّر شيئاً.
   - نفس `event_id` على الطرفين. سناب: `client_dedup_id` في البكسل يساوي `event_id` في CAPI، و`transaction_id` يساوي `custom_data.order_id`.
6. `docs/easypanel.md` و `frontend/env.example` و `backend/env.example`.
7. `docs/google-sheets.md` و `templates/google-sheets/`.
8. `docs/fraud-prevention.md` و `docs/seo.md` و `docs/performance.md` و `docs/security.md`.

النطاق العام: `https://sahraaaaaaaaaaa.shop`  
الـ API: `https://api.sahraaaaaaaaaaa.shop`

## ممنوع

- وضع `DATABASE_URL` أو أي رمز CAPI أو سر Google Sheets في الكود أو في Git أو في متغير `NEXT_PUBLIC_`.
- تغيير أسعار 199 / 279 / 349 / 99 أو إضافة كوبونات.
- إطلاق حدث الشراء قبل نجاح إنشاء الطلب، أو إطلاقه مرتين بمعرّفين مختلفين.
- تحميل البكسلات بشكل متزامن في `<head>`. استخدم صفاً ثم `lazyOnload` كما في `docs/tracking.md`.
- فشل التتبع أو فشل Google Sheets لا يُفشل الطلب.
- `prisma migrate dev` في الإنتاج. الإنتاج: `migrate deploy` داخل قفل `pg_advisory_lock(9142026)` قبل فتح المنفذ، كما في `docs/easypanel.md`.

## المطلوب بناؤه

1. **Monorepo:** مجلد `frontend` (Next.js، الواجهة الحالية منقولة إليه) ومجلد `backend` (API + Prisma + CAPI + Sheets). Dockerfile لكل مجلد، و `docker-entrypoint.sh` للخادم ينفّذ الترحيل المقفل ثم يشغّل الخادم على المنفذ 4000.
2. **الواجهة** تستدعي `NEXT_PUBLIC_API_URL` فقط. العربية RTL هي الافتراضية، والإنجليزية LTR تبقى. مسار الشراء على الجوال: درج السلة، نافذة الاسم والجوال والمدينة، ثم العرض الحصري، ثم صفحة الشكر مع واتساب.
3. **البكسلات الثلاث** مؤجّلة، مع CAPI من الخادم لنفس الأحداث ونفس `event_id`. أحداث الشراء: Meta `Purchase`، TikTok `CompletePayment`، Snap `PURCHASE`.
4. **Google Sheets:** الخادم يرسل إلى `GOOGLE_SHEETS_WEBHOOK_URL`. احتفظ بـ `templates/google-sheets/Code.gs` متوافقاً مع الأعمدة في `orders-template.csv`. نقطة `POST /v1/orders/sheet-sync` محمية بالسر المشترك.
5. **قاعدة البيانات:** `DATABASE_URL` من البيئة فقط. المضيف الداخلي المتوقع `sahraaaaaaaaaaa_database`، والقاعدة `sahraaaaaaaaaaa`، و `sslmode=disable` لأن الاتصال داخل شبكة EasyPanel. لا تفتح Postgres على الإنترنت.
6. **CORS** يسمح فقط بـ `https://sahraaaaaaaaaaa.shop`.
7. **صحة الخدمة:** `GET /health` على الـ API يعيد حالة القاعدة. الواجهة تبقى سريعة: صور المنتجات محلية، لا سكربت بكسل قبل الرسم الأول.

## تعريف الانتهاء

- طلب COD تجريبي من الجوال بالعربية يُنشئ طلباً ويظهر في الجدول.
- Test Events في المنصات الثلاث يظهر شراءً واحداً مُعلَّماً كـ Browser و Server معاً، لا نسختين.
- رقم سعودي `0512345678` يصبح قبل التشفير `966512345678` لميتا وسناب، و `+966512345678` لتيك توك.
- إعادة تشغيل حاوية الـ API لا تشغّل ترحيلين متوازيين.
- `git grep` لكلمة مرور القاعدة ولرموز CAPI لا يعيد أي نتيجة في الملفات المتتبَّعة.

إذا تعارضت وثيقة قديمة عن الدومين `sahraa.com` مع هذه التعليمات، فالدومين المعتمد هو `sahraaaaaaaaaaa.shop` وهذه الوثيقة و `docs/tracking.md` و `docs/easypanel.md` هي التي تُتبع.
