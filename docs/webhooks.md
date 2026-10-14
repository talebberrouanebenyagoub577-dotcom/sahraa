# Webhooks & External Event Sinks | خطافات الويب والخدمات التزامنية

توثق هذه الصفحة معمارية الـ Webhooks الصادرة والواردة في منصة **صحرا (SAHRAA)**، والخدمات التزامنية الحالية والمستقبلية.

---

## 1. الـ Webhooks الصادرة الحالية (Outgoing Webhooks)

### 1.1 مزامنة Google Sheets لطلبات الدفع عند الاستلام (`src/lib/services/googleSheet.ts`)
- **الغرض التشغيلي:**
  - في إدارة عمليات الـ COD الخليجية، تعتمد فرق المتابعة والتأكيد ومستودعات التغليف بشكل كبير على جداول Google لمتابعة الطلبات وتحديث حالتها بشكل فوري.
- **آلية العمل:**
  - يتم قراءة الرابط من المتغير `GOOGLE_SHEETS_WEBHOOK_URL`.
  - عند إنشاء أي طلب جديد في `POST /api/orders` أو عند إضافة منتج تكميلي في `PATCH /api/orders/[id]`، يتم إرسال طلب `POST` مشفر بـ JSON إلى الرابط.
- **هيكل الحمولة (Payload Structure):**
```json
{
  "orderId": "cuid...",
  "orderNumber": "SHR-MUVERWVF-WSZQ",
  "date": "1448/04/18 18:32:01",
  "customerName": "سلطان القحطاني",
  "customerPhone": "0551234567",
  "city": "الرياض",
  "country": "SA",
  "itemsSummary": "سيروم ديب سيرا (2x) [199 ر.س] + كريم هارفي روس (1x) [عرض Upsell بـ 99]",
  "hasUpsell": "نعم (99 ر.س)",
  "upsellProduct": "كريم Harvey Ross لشد محيط العين الفوري",
  "subtotal": 497,
  "discount": 119,
  "shipping": "مجاني",
  "total": "378 SAR",
  "paymentMethod": "دفع عند الاستلام (COD)",
  "status": "PENDING"
}
```
- **المعالجة الآمنة (Non-Blocking Safe Execution):**
  - يتم استدعاء الخدمة كعملية خلفية `void appendOrderToGoogleSheet(...)`؛ بحيث لا يتعطل العميل أو يتأخر فتح صفحة الشكر حتى لو كان خادم جداول بيانات Google بطيئاً أو غير متاح.

---

## 2. الـ Webhooks الواردة والتحليل الراهن (Incoming Webhooks Status)

- **بوابات الدفع الإلكتروني (Stripe / PayPal):**
  - المتغير `STRIPE_WEBHOOK_SECRET` معرّف في ملفات البيئة، ولكن **لا توجد نقطة استقبال مفعلة حالياً في مسار `src/app/api/webhooks/stripe`**.
  - يعود ذلك إلى أن التركيز التشغيلي الحالي لمنصة صحرا هو **الدفع عند الاستلام (COD)**.
  - تم توثيق ذلك في [`gap-analysis.md`](./gap-analysis.md).

---

## 3. خطة تكامل خطافات شركات الشحن (Courier Webhooks Roadmap)

في المرحلة القادمة عند ربط شركات الشحن (مثل أرامكس Aramex، سمسا SMSA، أو J&T Express):
- إنشاء نقطة استقبال موحدة: `/api/webhooks/shipping/[carrier]`
- التحقق من توقيع الطلب (Signature Verification / HMAC).
- تحديث حالة الطلب في قاعدة البيانات تلقائياً:
  - عند استلام الشحنة: تحديث إلى `SHIPPED` مع رقم التتبع.
  - عند خروج الشحنة مع المندوب: تحديث إلى `OUT_FOR_DELIVERY`.
  - عند تسليم المبلغ واستلام الطرد: تحديث إلى `DELIVERED` وتحديث `paymentStatus` إلى `PAID`.
