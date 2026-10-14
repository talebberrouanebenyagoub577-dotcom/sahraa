# Docker & Containerization | هندسة الحاويات وتكوين دوكر

توثق هذه الصفحة بناء وتكوين حاويات Docker في منصة **صحرا (SAHRAA)**، والتي تدير بيئة الإنتاج بالكامل على سيرفرات Hostinger VPS بنظام Ubuntu 24.04.

---

## 1. هيكل الخدمات في `docker-compose.yml`

يتكون النظام من 8 خدمات متكاملة ومعزولة شبكياً:

| اسم الخدمة (Service) | الصورة (Base Image) | الدور والوظيفة |
| :--- | :--- | :--- |
| **`postgres`** | `postgres:16-alpine` | قاعدة البيانات الرئيسية مع إعدادات ذاكرة مهيأة (shared_buffers=256MB). |
| **`redis`** | `redis:7-alpine` | كاش الذاكرة وتحديد معدل الطلبات وحفظ الجلسات السريعة. |
| **`migrate`** | `Dockerfile (migrator)` | تشغيل `prisma migrate deploy` والبذر الاختياري لمرة واحدة عند الإقلاع. |
| **`app`** | `Dockerfile (runner)` | تطبيق Next.js 15 Standalone في بيئة الإنتاج على المنفذ 3000. |
| **`nginx`** | `nginx:1.27-alpine` | موجه عكسي (Reverse Proxy)، ومسؤول التشفير وتجديد الكاش. |
| **`certbot`** | `certbot/certbot:latest` | التجديد التلقائي لشهادات SSL المجانية من Let's Encrypt كل 12 ساعة. |
| **`health-monitor`** | `alpine:3.20` | فحص دوري لصحة التطبيق كل 60 ثانية وتسجيل التقارير في `/logs`. |
| **`db-backup`** | `postgres:16-alpine` | أخذ نسخ احتياطية لقاعدة البيانات يومياً والاحتفاظ بها لـ 14 يوماً. |

---

## 2. مراحل بناء التطبيق (`Dockerfile` Multi-Stage)

يتبع الـ Dockerfile نمط البناء متعدد المراحل لتحقيق أقصى درجات الأمان وتقليص حجم الصورة:

1. **مرحلة `base`:**
   - صورة `node:20-alpine` مع مكتبات `libc6-compat` و `openssl`.
2. **مرحلة `deps`:**
   - نسخ `package.json` و `package-lock.json`.
   - تنفيذ `npm ci --legacy-peer-deps`.
3. **مرحلة `builder`:**
   - نسخ ملفات الكود والتبعيات.
   - تشغيل `npx prisma generate`.
   - تشغيل `npm run build` لإنتاج مخرجات الـ Standalone.
4. **مرحلة `migrator`:**
   - صورة مخصصة لتشغيل هجرات قاعدة البيانات فقط عند تشغيل الـ Stack.
5. **مرحلة `runner` (صورة الإنتاج النهائية):**
   - إنشاء مستخدم غير جذري `nextjs:nodejs` (UID: 1001) لمنع تشغيل التطبيق كـ root.
   - نسخ فقط ملفات `.next/standalone` و `.next/static` والملفات العامة `public`.
   - تفعيل فحص الجاهزية المدمج `HEALTHCHECK`.

---

## 3. الشبكات ومناطق الأمان (Networks & Isolation)

- **`sahraa-internal` (شبكة خلفية خاصة):**
  - لا يمكن الوصول إليها من خارج السيرفر نهائياً.
  - تضم: `postgres`, `redis`, `migrate`, `health-monitor`, `db-backup`, والاتصال الداخلي لـ `app`.
- **`sahraa-external` (شبكة عامة):**
  - المنفذان الوحيدان المفتوحان للإنترنت هما:
    - المنفذ `80` (HTTP لتحويله أو لتحديات Let's Encrypt ACME).
    - المنفذ `443` (HTTPS المشفر).

---

## 4. وحدات التخزين المستمر (Persistent Volumes)

- `postgres_data`: لحفظ ملفات قاعدة البيانات بعد إعادة تشغيل الحاويات.
- `redis_data`: لحفظ بيانات ريديس على القرص (`appendonly yes`).
- `nginx_cache`: لحفظ كاش Nginx للملفات الثابتة.
- `./backups`: مجلد محلي لنسخ قواعد البيانات اليومية (`.sql.gz`).
- `./public/uploads`: لحفظ صور المنتجات المرفوعة من قبل الإدارة والبائعين.
