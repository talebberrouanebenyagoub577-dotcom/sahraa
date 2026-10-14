# Security Architecture & Best Practices | معمارية الأمان والحماية

توثق هذه الصفحة طبقات الأمان والسياسات الوقائية المطبقة في منصة **صحرا (SAHRAA)**.

---

## 1. ترويسات الأمان (HTTP Security Headers)

تم ضبط ترويسات الأمان على مستويين متكاملين:
1. **على مستوى Nginx Reverse Proxy (`nginx/conf.d/sahraa-http-only.conf`):**
   - `X-Frame-Options "DENY"`: لمنع هجمات Clickjacking وتضمين الموقع داخل Iframes ضارة.
   - `X-Content-Type-Options "nosniff"`: لمنع المتصفحات من تخمين نوع الملفات (MIME Sniffing).
   - `X-XSS-Protection "1; mode=block"`: تفعيل فلتر الحماية من هجمات XSS.
2. **على مستوى تطبيق Next.js (`next.config.ts` و `src/middleware.ts`):**
   - تطبيق `nosniff`, `DENY`, `strict-origin-when-cross-origin` على جميع الروابط ونقاط الـ API.

---

## 2. المصادقة وإدارة الجلسات (JWT & Session Management)

1. **كوكيز مشفرة ومحمية (HTTP-Only Secure Cookies):**
   - يُخزن `access_token` في كوكيز بخاصية `httpOnly: true`، مما يمنع وصول برمجيات JavaScript الخبيثة إليها عبر المتصفح (مقاومة لـ XSS).
   - خاصية `sameSite: "lax"` لمنع هجمات CSRF أثناء التنقل بين النوافذ.
   - خاصية `secure: true` في بيئة الإنتاج لضمان مرورها عبر HTTPS فقط.
2. **عمر التوكن القصير:**
   - الـ Access Token صالح لمدة 15 دقيقة فقط، مما يقلل نافذة الخطر في حال تسرب التوكن.
3. **تشفير كلمات المرور:**
   - استخدام خوارزمية `bcryptjs` مع جولات تمليح (Salt Rounds = 10) في `src/lib/auth/password.ts`.

---

## 3. التحقق من المدخلات والتطهير (Input Validation & Sanitization)

- تعتمد المنصة بشكل كامل على مكتبة **Zod** (`zod v4`) للتحقق من جميع المدخلات قبل وصولها لمنطق الأعمال وقاعدة البيانات:
  - مخطط تسجيل الدخول والتسجيل: `src/lib/validations/auth.ts`.
  - مخطط إتمام الطلبات والسلة: `src/lib/validations/order.ts`.
  - مخطط المنتجات والمراجعات: `src/lib/validations/product.ts`.
- تنظيف أرقام الهواتف من المسافات والرموز الزائدة لمنع هجمات الحقن.
- حماية Prisma ORM التلقائية ضد هجمات **SQL Injection** عبر الاستعلامات المعلمة (Parameterized Queries).

---

## 4. التحكم في معدل الطلبات (Rate Limiting & DDoS Prevention)

- **طبقة Nginx:**
  - `limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;`
  - `limit_conn_zone $binary_remote_addr zone=conn:10m;`
- **طبقة التطبيق وريديس (`src/lib/api/rate-limit.ts`):**
  - استخدام خوارزمية النافذة المنزلقة (Sliding Window Counter) في Redis.
  - مطبقة على نقاط الدخول الحساسة: `/api/auth/login`, `/api/auth/register`, `/api/ai/chat`.
  - إرجاع خطأ `HTTP 429 Too Many Requests` عند تجاوز الحد المسموح.

---

## 5. عزل الحاويات والشبكات (Docker Network Isolation)

في `docker-compose.yml`:
- **`sahraa-internal` (شبكة مغلقة):**
  - تربط قاعدة البيانات `postgres` وتخزين `redis` وخدمة `db-backup` و `health-monitor` مع التطبيق.
  - منافذ PostgreSQL (5432) و Redis (6379) **غير مفتوحة نهائياً للإنترنت الخارجي**.
- **`sahraa-external` (شبكة موجهة):**
  - تربط فقط الـ Nginx Reverse Proxy مع الإنترنت الخارجي على المنفذين 80 و 443.
