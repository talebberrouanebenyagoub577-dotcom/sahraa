# النشر على EasyPanel و GitHub

النطاق العام: `https://sahraaaaaaaaaaa.shop`  
نطاق الـ API: `https://api.sahraaaaaaaaaaa.shop`

قاعدة البيانات موجودة مسبقاً داخل EasyPanel. التطبيق يتصل بها عبر اسم المضيف الداخلي. **لا تكتب رابط القاعدة ولا كلمة المرور في الكود ولا في Git.** ضع القيمة فقط في متغيرات بيئة خدمة الـ Backend داخل EasyPanel، في المتغير `DATABASE_URL`.

شكل الرابط (القيم السرية تُستبدل في اللوحة، ولا تُنسخ إلى المستودع):

```text
postgres://<USER>:<PASSWORD>@sahraaaaaaaaaaa_database:5432/sahraaaaaaaaaaa?sslmode=disable
```

اسم المضيف `sahraaaaaaaaaaa_database` هو اسم خدمة Postgres على شبكة Docker الداخلية في EasyPanel. لا تستبدله بـ `localhost` داخل الحاوية.

---

## 1. شكل المستودع

Monorepo واحد على GitHub، خدمتان في EasyPanel:

```text
frontend/     واجهة Next.js على sahraaaaaaaaaaa.shop
backend/      API على api.sahraaaaaaaaaaa.shop
docs/         هذه الوثائق ملزمة
templates/    قوالب Google Sheets و CSV
```

لا تُعد بناء مسار الشراء. انقل السلوك الموثّق في `checkout.md` و `offers.md` و `upsells.md` و `orders.md` و `cart.md`.

الواجهة لا تتصل بقاعدة البيانات. كل القراءة والكتابة عبر `https://api.sahraaaaaaaaaaa.shop`.

---

## 2. EasyPanel

أنشئ ثلاث خدمات إن لم تكن قاعدة البيانات موجودة، أو اربط الخدمتين بقاعدة البيانات الحالية:

| الخدمة | النوع | النطاق | المنفذ الداخلي |
| :--- | :--- | :--- | :--- |
| `sahraaaaaaaaaaa` (الموقع) | Dockerfile من `frontend/Dockerfile` | `sahraaaaaaaaaaa.shop` و `www` يحوّل إليه | `3000` |
| `sahraaaaaaaaaaa-api` | Dockerfile من `backend/Dockerfile` | `api.sahraaaaaaaaaaa.shop` | `4000` |
| قاعدة البيانات | Postgres الجاهزة | داخلية فقط، بلا نطاق عام | `5432` |

فعّل HTTPS من لوحة EasyPanel لكل نطاق. لا تفتح منفذ Postgres على الإنترنت.

متغيرات الواجهة من `frontend/env.example`.  
متغيرات الخادم من `backend/env.example`.

`FRONTEND_ORIGIN=https://sahraaaaaaaaaaa.shop` على الخادم، و CORS يسمح بهذا الأصل فقط في الإنتاج.

---

## 3. Docker

`frontend/Dockerfile`: بناء Next.js متعدد المراحل (`standalone`)، مستخدم غير جذري، `NODE_ENV=production`. معرّفات البكسل تُمرَّر كـ `ARG` ثم `ENV` لأن Next يدمج `NEXT_PUBLIC_*` وقت البناء. غيّرت المعرّف؟ أعد البناء.

`backend/Dockerfile`: Node 20 Alpine، `npx prisma generate` أثناء البناء، التشغيل عبر `backend/docker-entrypoint.sh`.

لا تضع `DATABASE_URL` الافتراضي داخل Dockerfile. إذا غاب المتغير، الخادم يتوقف عند الإقلاع برسالة واضحة.

---

## 4. ترحيل قاعدة البيانات مرة واحدة

عند كل إقلاع للـ Backend، وقبل فتح المنفذ:

1. احصل على قفل Postgres الاستشاري: `pg_advisory_lock(9142026)` عبر اتصال منفصل باستخدام `DATABASE_URL`.
2. شغّل `npx prisma migrate deploy` (لا `migrate dev` في الإنتاج).
3. أطلق القفل في `finally` حتى لو فشل الترحيل.
4. بعدها ابدأ خادم HTTP.

هكذا إعادة تشغيل الحاوية، أو نسختان مؤقتاً أثناء النشر، لا تنفّذان الترحيل معاً. الترحيلات في `backend/prisma/migrations` إضافية فقط. لا تعدّل ترحيلاً سبق تطبيقه.

إذا فشل الترحيل، الحاوية تخرج برمز غير صفري ولا تبدأ في استقبال الطلبات.

---

## 5. GitHub

1. المستودع خاص.
2. `.env` و `.env.local` و `.env.production` في `.gitignore`. المسموح رفعه هو `env.example` بلا أسرار.
3. فحص CI بسيط: `npm run lint` في الواجهة والخادم، و `prisma validate`.
4. EasyPanel يبني من الفرع `main` عند الدفع، أو يدوياً من اللوحة.

قبل أول دفع، تأكد أن `git status` لا يظهر `.env` ولا رابط قاعدة فيه كلمة مرور.

---

## 6. ترتيب أول نشر

1. ضع `DATABASE_URL` الداخلي في EasyPanel.
2. انشر الـ Backend وانتظر حتى تنجح الترحيلات (`/health` يعيد 200 و `database: ok`).
3. انشر الواجهة مع `NEXT_PUBLIC_API_URL=https://api.sahraaaaaaaaaaa.shop`.
4. افتح `https://sahraaaaaaaaaaa.shop/ar` وأتمم طلب تجريبي.
5. أكّد الطلب التجريبي من صفحة الشكر. حدث الشراء يُرسل بعد التأكيد لا عند الإنشاء: صف Google Sheets يظهر `new` ثم `confirmed`، وTest Events تعرض شراءً واحداً Browser + Server.
