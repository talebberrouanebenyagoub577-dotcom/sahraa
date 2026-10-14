# API Reference & Endpoints | دليل الواجهات البرمجية (REST API)

يوثق هذا الدليل كافة نقاط الاتصال البرمجية (Endpoints) المتاحة في منصة **صحرا (SAHRAA)**، ومعاملات الطلب، والصلاحيات المطلوبة، ونماذج الاستجابة.

---

## 1. التنسيق المعياري للاستجابة (Standard Response Format)

جميع استجابات الـ API ترجع بتنسيق JSON موحد:

### استجابة ناجحة (Success)
```json
{
  "success": true,
  "data": { ... }
}
```

### استجابة خطأ (Error)
```json
{
  "success": false,
  "error": "وصف الخطأ أو الرسالة",
  "details": [ ... ]
}
```

---

## 2. المصادقة والمستخدمين (Authentication & Users)

| النقطة (Endpoint) | الطريقة | الصلاحية | الوصف |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | تسجيل حساب جديد مع تعيين الكوكيز المشفرة |
| `/api/auth/login` | `POST` | Public | تسجيل الدخول بالبريد وكلمة المرور |
| `/api/auth/logout` | `POST` | Public | تسجيل الخروج ومسح كوكيز الجلسة |
| `/api/auth/me` | `GET` | Authenticated | استرجاع بيانات المستخدم المسجل حالياً |
| `/api/users/me` | `GET`, `PATCH` | Authenticated | تحديث الملف الشخصي والبيانات |

---

## 3. كتالوج المنتجات والأقسام (Catalog & Products)

| النقطة (Endpoint) | الطريقة | الصلاحية | الوصف |
| :--- | :--- | :--- | :--- |
| `/api/products` | `GET` | Public | استرجاع المنتجات مع الفلترة (قسم، صفحة، سعر) مع كاش Redis |
| `/api/products/[slug]` | `GET` | Public | استرجاع بيانات المنتج الكاملة مع الصور والخيارات والمراجعات |
| `/api/categories` | `GET` | Public | استرجاع شجرة الأقسام والتصنيفات |
| `/api/search` | `GET` | Public | بحث ذكي مع اقتراحات الإكمال التلقائي (`?type=suggest`) |
| `/api/reviews` | `GET`, `POST` | Public / Auth | قراءة مراجعات المنتج أو إضافة مراجعة جديدة |
| `/api/recently-viewed` | `GET`, `POST` | Authenticated | إدارة سجل المنتجات المشاهدة مؤخراً |
| `/api/banners` | `GET` | Public | بنرات الصفحة الرئيسية والعروض الترويجية |

---

## 4. سلة المشتريات والعروض الترويجية (Cart & Offers)

| النقطة (Endpoint) | الطريقة | الصلاحية | الوصف |
| :--- | :--- | :--- | :--- |
| `/api/cart` | `GET` | Authenticated | استرجاع عناصر السلة من قاعدة البيانات مع ملخص الباقات |
| `/api/cart` | `POST` | Authenticated | إضافة منتج للسلة في قاعدة البيانات |
| `/api/cart` | `PATCH` | Authenticated | تعديل كمية منتج في السلة أو تطبيق كوبون |
| `/api/cart` | `DELETE` | Authenticated | حذف منتج معين أو إفراغ السلة |
| `/api/upsell` | `GET` | Public | **محرك الـ Upsell الذكي**: يقترح منتجاً مكملاً بـ 99 ريال بناءً على عناصر سلة الزائر (`?cartIds=...&cartSlugs=...`) |

---

## 5. الطلبات وإتمام الشراء (Orders & Checkout)

### 5.1 إنشاء طلب جديد (`POST /api/orders`)
- **الصلاحية:** Public (يدعم تسجيل حساب زائر تلقائي وسلس لزبائن الـ COD).
- **المدخلات (Request Body):**
```json
{
  "shippingAddress": {
    "firstName": "سلطان القحطاني",
    "phone": "+966551234567",
    "city": "الرياض",
    "country": "SA"
  },
  "paymentMethod": "COD",
  "items": [
    { "productId": "cuid...", "variantId": null, "quantity": 2 }
  ],
  "upsellProductId": "cuid..." // اختياري في حال قبول عرض الـ Upsell بـ 99 ريال
}
```
- **المعالجة:**
  - يتم حساب الإجمالي بدقة وفق هندسة الباقات (1 بـ 199، 2 بـ 279، 3 بـ 349).
  - إذا تم تمرير `upsellProductId`، يضاف كبند منفصل بقيمة 99 ريال.
  - الشحن مجاني (0 ريال).
  - حفظ الطلب ضمن Prisma Transaction وتحديث المخزون.
  - إرسال البيانات فوراً لـ Google Sheet Webhook.
  - إصدار كوكيز مصادقة للزائر لتمكينه من استعراض صفحة الشكر مباشرة.

### 5.2 قراءة طلب معين (`GET /api/orders/[id]`)
- **الصلاحية:** المشتري صاحب الطلب، أو المشرف (Admin)، أو عبر المعرف الفرعي للطلب في صفحة الشكر.
- **الوصف:** استرجاع تفاصيل الطلب، البنود، الحالات، والعنوان.

### 5.3 تعديل الطلب أو إضافة Cross-Sell (`PATCH /api/orders/[id]`)
- **الصلاحية:** Public لصفحة الشكر (إذا تضمن `addCrossSellProductId`)، أو Admin لتعديل الحالة ورقم التتبع.
- **إضافة منتج لنفس الشحنة:**
```json
{
  "addCrossSellProductId": "cuid..."
}
```
يقوم الخادم بدمج المنتج في نفس الطلب بسعره الأصلي (199 ريال)، وتحديث إجمالي الطلب، وتحديث صف الطلب في Google Sheets دون إنشاء طلب جديد.

---

## 6. واجهات لوحة تحكم المشرف (Admin API Routes)

تتطلب صلاحية `ADMIN` أو `SUPER_ADMIN`:

| النقطة (Endpoint) | الطريقة | الوصف |
| :--- | :--- | :--- |
| `/api/admin/products` | `GET`, `POST` | إدارة كافة المنتجات والموافقة عليها |
| `/api/admin/catalog/products` | `GET`, `POST` | كتالوج الإدارة العام |
| `/api/admin/catalog/products/[id]` | `GET`, `PUT`, `DELETE` | تعديل أو حذف منتج معين |
| `/api/admin/catalog/upload` | `POST` | رفع صور المنتجات |
| `/api/admin/users` | `GET`, `PATCH` | إدارة حسابات المستخدمين وصلاحياتهم |
| `/api/admin/sellers` | `GET`, `PATCH` | إدارة البائعين وتفعيل المتاجر |
| `/api/admin/coupons` | `GET`, `POST`, `DELETE` | إدارة الكوبونات |
| `/api/admin/stats` | `GET` | إحصائيات المبيعات، الإيرادات، والطلبات |
| `/api/admin/cod-network` | `GET`, `POST` | شبكة الدفع عند الاستلام والموزعين |
| `/api/admin/audit-logs` | `GET` | استعراض سجل تتبع الإجراءات الأمنية |

---

## 7. واجهات لوحة تحكم البائع (Seller API Routes)

تتطلب صلاحية `SELLER` أو أعلى:

| النقطة (Endpoint) | الطريقة | الوصف |
| :--- | :--- | :--- |
| `/api/seller/products` | `GET`, `POST` | إدارة منتجات المتجر الخاص بالبائع |
| `/api/seller/orders` | `GET` | طلبات الزبائن الخاصة بمنتجات البائع |
| `/api/seller/inventory` | `GET`, `PATCH` | تحديث كميات المخزون |
| `/api/seller/stats` | `GET` | إحصائيات أداء المتجر والمبيعات |
| `/api/seller/withdrawals` | `GET`, `POST` | طلبات سحب الأرباح والعمولات |

---

## 8. واجهات الذكاء الاصطناعي والدعم والنظام (AI & System)

| النقطة (Endpoint) | الطريقة | الصلاحية | الوصف |
| :--- | :--- | :--- | :--- |
| `/api/ai/chat` | `POST` | Rate Limited | المساعد الذكي للإجابة عن المنتجات وتتبع الشحنات |
| `/api/ai/recommendations` | `GET` | Public | توصيات ذكية مبنية على اهتمامات الزائر |
| `/api/support/tickets` | `GET`, `POST` | Authenticated | تذاكر الدعم والمساعدة الفنية |
| `/api/settings` | `GET`, `PUT` | Public / Admin | قراءة أو تحديث إعدادات المتجر العامة والشعار |
| `/api/settings/upload` | `POST` | Admin | رفع شعار الموقع أو الأيقونة المفضلة |
| `/api/health` | `GET` | Public | فحص جاهزية الخادم وقاعدة البيانات وريديس (Docker Healthcheck) |
| `/api/newsletter` | `POST` | Public | الاشتراك في النشرة الإخبارية |
