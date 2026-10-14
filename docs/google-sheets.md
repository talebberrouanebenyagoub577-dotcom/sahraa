# Google Sheets | الطلبات والتأكيد

جدول واحد هو لوحة فريق التأكيد في السعودية. الخادم يدفع الطلب عند إنشائه أو تحديثه. سكربت داخل الجدول يعيد حالات التأكيد والشحن إلى الـ API.

---

## 1. متغيرات الخادم

من `backend/env.example`:

| المتغير | الاتجاه |
| :--- | :--- |
| `GOOGLE_SHEETS_WEBHOOK_URL` | الخادم → جدول (رابط تطبيق Apps Script المنشور كـ Web App) |
| `GOOGLE_SHEETS_SHARED_SECRET` | سر مشترك في ترويسة `X-Sheet-Secret` في الاتجاهين |
| `SHEETS_SYNC_ENABLED` | `true` في الإنتاج |

غياب الرابط لا يفشل الطلب. يُسجَّل تحذير فقط. إعادة المحاولة مرتان، مع منع تكرار نفس `orderNumber + event` لمدة 24 ساعة (المنطق الحالي في `src/lib/services/googleSheet.ts` يُنقل كما هو).

---

## 2. أعمدة القالب

الصف الأول في `templates/google-sheets/orders-template.csv`. استورد الملف إلى جدول جديد باسم `SAHRAA Orders`. لا تحذف الأعمدة ولا تغيّر أسماءها الإنجليزية؛ الفريق يكتب العربية في الخلايا.

| العمود | من يكتبه | المعنى |
| :--- | :--- | :--- |
| `order_number` | الخادم | رقم الطلب الظاهر للعميل |
| `created_at` | الخادم | ISO 8601 |
| `customer_name` | الخادم | الاسم |
| `phone` | الخادم | E.164 مع `+` للعرض البشري، مثل `+9665xxxxxxxx` |
| `city` | الخادم | المدينة |
| `items` | الخادم | نص المنتجات والكميات |
| `qty` | الخادم | إجمالي القطع |
| `total` | الخادم | المبلغ بالريال |
| `currency` | الخادم | `SAR` |
| `payment_method` | الخادم | `COD` |
| `has_upsell` | الخادم | `yes` / `no` |
| `upsell_product` | الخادم | اسم العرض أو فارغ |
| `status` | الفريق | إحدى قيم `templates/google-sheets/order-statuses.csv` |
| `confirmation_notes` | الفريق | ملاحظة الاتصال |
| `courier` | الفريق | شركة الشحن |
| `tracking_number` | الفريق | رقم البوليصة |
| `utm_source` | الخادم | مصدر الإعلان |
| `utm_campaign` | الخادم | الحملة |
| `event_id` | الخادم | معرّف إزالة التكرار، لا يُعدَّل |
| `synced_at` | السكربت | آخر إرسال ناجح من الجدول إلى الـ API |

الحالات المسموحة: `new`, `no_answer`, `confirmed`, `cancelled`, `shipped`, `delivered`, `refused`, `returned`.

`confirmed` يرفع أولوية التجهيز. `delivered` و `refused` و `returned` هي ما يُقاس به معدل التسليم. لا ترسل هذه الحالات كأحداث شراء جديدة إلى البكسلات.

---

## 3. سكربت الجدول

الملف: `templates/google-sheets/Code.gs`.

1. Extensions → Apps Script، الصق المحتوى.
2. Script properties: `API_BASE` = `https://api.sahraaaaaaaaaaa.shop` و `SHEET_SECRET` = نفس `GOOGLE_SHEETS_SHARED_SECRET`.
3. انشر Web App: Execute as Me، Access Anyone (السر في الترويسة هو الحماية).
4. الصق رابط النشر في `GOOGLE_SHEETS_WEBHOOK_URL`.

السكربت يفعل شيئين:

- `doPost`: يستقبل الطلب من الخادم ويكتب صفاً جديداً أو يحدّث الصف المطابق لـ `order_number`.
- `onEdit`: إذا تغيّر عمود `status` أو `courier` أو `tracking_number`، يرسل `POST /v1/orders/sheet-sync` إلى الـ API.

الخادم يتحقق من السر، يجد الطلب برقمه، ويحدّث الحالة. طلب برقم غير موجود يُرفض بـ 404 ولا يُنشأ طلب من الجدول إلا إذا أُرسلت الأعمدة الإلزامية (`customer_name`, `phone`, `city`, `items`, `total`) وكان `status` = `new`. هذا مسار احتياطي، والمسار الأساسي هو الشراء من الموقع.

---

## 4. CSV

| الملف | الاستخدام |
| :--- | :--- |
| `templates/google-sheets/orders-template.csv` | رأس الجدول وصف مثال وهمي للاستيراد |
| `templates/google-sheets/order-statuses.csv` | قائمة الحالات لعمود التحقق من البيانات في Google Sheets |
| `templates/google-sheets/products-import-template.csv` | استيراد كتالوج أولي: sku, slug, name_ar, price_sar, category |
