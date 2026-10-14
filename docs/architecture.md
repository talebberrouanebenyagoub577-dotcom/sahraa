# Architecture & System Design | معمارية النظام

> النشر المعتمد من 2026 هو monorepo: `frontend/` (Next.js على `https://sahraaaaaaaaaaa.shop`) و `backend/` (API على `https://api.sahraaaaaaaaaaa.shop`). الواجهة لا تتصل بقاعدة البيانات. التفاصيل الملزمة في `docs/easypanel.md` و `docs/tracking.md`. الرسم أدناه يصف الشكل السابق قبل الفصل.

توثق هذه الصفحة المعمارية الحالية لمنصة **صحرا (SAHRAA)**، موضحّة طبقات النظام، وتدفق البيانات، والتقنيات المستخدمة بالفعل.

---

## 1. نظرة عامة على الهيكل التقني (High-Level Topology)

يعمل المشروع وفق معمارية متكاملة عبر حاويات Docker على سيرفر VPS (Ubuntu 24.04):

```text
                                  ┌──────────────────────────┐
                                  │      Client Browser      │
                                  └─────────────┬────────────┘
                                                │ HTTPS (80 / 443)
                                                ▼
                                  ┌──────────────────────────┐
                                  │     Nginx Reverse Proxy  │
                                  │   (SSL, Gzip, Caching)   │
                                  └─────────────┬────────────┘
                                                │ HTTP (:3000)
                                                ▼
                                  ┌──────────────────────────┐
                                  │   Next.js 15 Standalone  │
                                  │   (App Router + SSR/API) │
                                  └──────┬──────────┬────────┘
                                         │          │
                     ┌───────────────────┘          └───────────────────┐
                     ▼                                                  ▼
          ┌─────────────────────┐                            ┌─────────────────────┐
          │   PostgreSQL 16     │                            │      Redis 7        │
          │ (Prisma ORM Client) │                            │ (Cache & RateLimit) │
          └─────────────────────┘                            └─────────────────────┘
                     │                                                  │
                     ▼                                                  ▼
          ┌─────────────────────┐                            ┌─────────────────────┐
          │   Google Sheets     │                            │     Let's Encrypt   │
          │   (Webhook Service) │                            │   (Certbot Auto-SSL)│
          └─────────────────────┘                            └─────────────────────┘
```

---

## 2. الطبقات التقنية (Technology Layers)

### 2.1 الواجهة الأمامية (Presentation & Frontend Layer)
- **Framework:** Next.js 15.5.19 (React 19.2.7).
- **Routing:** Next.js App Router مع تجزئة دولية `src/app/[locale]/`.
- **Styling:** Tailwind CSS v4 مع أدوات مساعدة `clsx` و `tailwind-merge`.
- **UI Primitives:** Radix UI (`@radix-ui/react-*`) لضمان معايير سهولة الوصول والأمان.
- **i18n:** `next-intl` لدعم العربية (RTL) كلغة افتراضية والإنجليزية (LTR).
- **Client State:** React Context API (`CartContext`, `AuthContext`, `SettingsContext`).

### 2.2 الخادم والواجهات البرمجية (Application & API Layer)
- **Runtime:** Node.js 20 LTS في وضع `standalone`.
- **API Architecture:** Next.js App Router Route Handlers (`src/app/api/**/route.ts`).
- **Validation:** Zod v4 للتحقق الصارم من مدخلات الـ API ومخططات النماذج.
- **Authentication:** JWT (JSON Web Tokens) هجين:
  - Access Token (مدة الصلاحية: 15 دقيقة) يُحفظ في كوكيز `access_token` مشفرة.
  - Refresh Token (مدة الصلاحية: 7 أيام) يُحفظ في قاعدة البيانات في جدول `RefreshToken`.
  - التحقق السريع في الـ Edge Middleware (`src/middleware.ts` عبر `src/lib/auth/edge-jwt.ts`).

### 2.3 طبقة البيانات والتخزين المؤقت (Data & Cache Layer)
- **قاعدة البيانات الأساسية:** PostgreSQL 16 Alpine.
- **ORM:** Prisma Client v6.19.3 مع تفعيل الاتصال عبر `src/lib/prisma.ts`.
- **التخزين المؤقت (Caching):** Redis 7 Alpine عبر مكتبة `ioredis`:
  - تخزين مؤقت لكتالوج المنتجات (`products:*`) لمدة 300 ثانية.
  - تخزين مؤقت لصفحات تفاصيل المنتجات (`product:[slug]`).
  - تحديد معدل الطلبات (Sliding Window Rate Limiting) لحماية نقاط الدخول الحساسة.

### 2.4 الخدمات والتكاملات الخارجية (External Integrations)
- **Google Sheets Webhook:** مزامنة آلية لطلبات الدفع عند الاستلام مع جداول بيانات Google (`src/lib/services/googleSheet.ts`).
- **AI Modules:** دعم مساعد الدردشة الذكي وتوصيات المنتجات عبر نماذج OpenAI (`src/lib/ai/`).
- **Payments (اختياري/مجهز):** Stripe و PayPal في حال الرغبة في الدفع المسبق (بينما التركيز التشغيلي الحالي هو COD).

---

## 3. تدفق البيانات في دورة الشراء (Purchase Data Flow)

```text
1. العميل يتصفح الموقع (Product Section أو AmazonProductPage).
2. عند الضغط على "أضف للسلة":
   - يُضاف المنتج إلى CartContext (يُحفظ في localStorage).
   - ينزلق الـ CartDrawer فورياً دون إعادة تحميل الصفحة.
3. عند الضغط على "اطلب الآن" أو "إتمام الطلب":
   - يفتح الـ CheckoutModal المنبثق.
   - يدخل العميل اسمه ورقم هاتفه ومدينته فقط.
4. عند الضغط على "تأكيد الطلب":
   - يتحقق الكود من سلامة الاسم ورقم الهاتف.
   - تفتح نافذة الـ UpsellModal فورياً بعرض OTO بـ 99 ريال (مع عداد 15 ثانية).
5. قبول أو رفض الـ Upsell:
   - يُرسل طلب POST إلى /api/orders.
   - إذا كان الزائر غير مسجل، يتم إنشاء حساب زائر خفيف (Guest Account) برقم هاتفه وتثبيت الكوكيز.
   - يُسجل الطلب في قاعدة البيانات وتُخصم الكميات من المخزون ضمن Prisma Transaction.
   - يُرسل صف الطلب تلقائياً إلى الـ Google Sheet Webhook.
6. التوجيه لصفحة الشكر (/order/success/[orderId]):
   - تظهر صفحة الشكر الغنية بعناصر التعزيز النفسي.
   - زر تأكيد واتساب بنقرة واحدة لتسريع الشحن.
   - قسم إضافة منتجات إضافية للشحنة بسعر 199 ريال (PATCH /api/orders/[id]).
```
