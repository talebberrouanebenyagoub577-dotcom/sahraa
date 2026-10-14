# Pixels و CAPI | مواصفات التتبع الإعلاني المعتمدة

هذه الوثيقة هي المرجع الوحيد لتنفيذ Meta Pixel و TikTok Pixel و Snapchat Pixel، والتتبع من الخادم (CAPI / Events API). الصيغ أدناه مأخوذة من وثائق المنصات الرسمية (أكتوبر 2026)، وليست من ملخصات ثانوية.

**الوضع الحالي في الكود:** لا توجد بكسلات ولا CAPI. هذه الوثيقة مواصفة تنفيذ، لا وصف لما هو مبني.

مصادر رسمية:

- Meta: `POST https://graph.facebook.com/{version}/{pixel_id}/events` ووثيقة Customer Information Parameters. الهاتف: أرقام فقط مع مفتاح الدولة **بدون** `+`، ثم SHA-256.
- TikTok Events API 2.0: `POST https://business-api.tiktok.com/open_api/v1.3/event/track/` — حقل `phone`: تطبيع E.164 **مع** `+` ثم SHA-256. المصدر: [Report App, Web, Offline, or CRM Events](https://business-api.tiktok.com/portal/docs/report-app-web-offline-or-crm-events/v1.3).
- Snapchat CAPI v3: `POST https://tr.snapchat.com/v3/{PIXEL_ID}/events` — حقل `ph`: مفتاح الدولة **بدون** `+` وبدون مسافات، ثم SHA-256. المصدر: [Parameters](https://developers.snap.com/marketing-api/Conversions-API/Parameters) و [Deduplication](https://developers.snap.com/marketing-api/Conversions-API/Deduplication).

---

## 1. قاعدة التشفير

| القناة | هل نُشفّر نحن البيانات قبل الإرسال؟ |
| :--- | :--- |
| Web Pixel (المتصفح) للمتاجر الثلاث | **لا.** البكسل يُشفّر بنفسه عند المطابقة المتقدمة. نمرّر القيمة الخام. |
| Meta CAPI | **نعم** لكل حقل هوية (بريد، هاتف، اسم، مدينة، دولة). |
| TikTok Events API | **نعم** للبريد والهاتف. |
| Snapchat CAPI | **نعم** للبريد والهاتف والاسم والمدينة والدولة. |

التشفير دائماً SHA-256 بناتج **hex بأحرف صغيرة**. لا تُشفّر قيمة فارغة، ولا تُشفّر قيمة مُشفّرة مسبقاً. إذا لم يتوفر الحقل، احذفه من الـ payload.

لا يُشفَّر أبداً: عنوان IP، و User-Agent، وملفات تعريف النقرة والكوكي (`fbc`, `fbp`, `ttclid`, `ttp`, `sc_click_id`, `sc_cookie1`).

### رقم الجوال السعودي

المدخل المقبول في المتجر: `05xxxxxxxx` أو `5xxxxxxxx` أو `+9665xxxxxxxx`.

| المنصة | الشكل قبل SHA-256 | مثال |
| :--- | :--- | :--- |
| Meta `user_data.ph` | أرقام فقط، مفتاح الدولة، **بدون** `+` وبدون صفر في البداية | `9665xxxxxxxx` |
| Snap `user_data.ph` | نفس قاعدة ميتا: أرقام فقط **بدون** `+` | `9665xxxxxxxx` |
| TikTok `user.phone` | E.164 **مع** `+`، بدون أقواس وبدون أصفار زائدة | `+9665xxxxxxxx` |

البريد: `trim` ثم أحرف صغيرة ثم SHA-256 على القنوات الثلاث.

---

## 2. معرّف الحدث الواحد (Deduplication)

يُنشأ `event_id` في المتصفح **قبل** إطلاق البكسل، ويُرسل مع الطلب إلى الخادم، ويُعاد استخدامه في CAPI. ممنوع توليد UUID جديد على الخادم لحدث سبق أن أطلقه المتصفح.

الصيغة: `{orderNumber}_{EventName}` للشراء، و `{uuid}` لبقية الأحداث مع حفظ نفس القيمة للطرفين.

| المنصة | اسم الحقل في البكسل | اسم الحقل في الخادم | نافذة الإزالة |
| :--- | :--- | :--- | :--- |
| Meta | الوسيط الرابع `eventID` | `event_id` | 48 ساعة، مع تطابق `event_name` حرفياً |
| TikTok | `event_id` داخل `ttq.track` | `event_id` | يُطابق `event_source_id` + `event_id` + `event` |
| Snap | `client_dedup_id` | `event_id` | 48 ساعة |

لشراء سناب فقط، أرسل أيضاً رقم الطلب مرتين بالاسمين المختلفين:

- البكسل: `transaction_id`
- CAPI v3: `custom_data.order_id`

نفس النص في الحقلين. نافذة إضافية حتى 30 يوماً. لا تعتمد على المعرّف الذي يولّده بكسل سناب تلقائياً (يبدأ بـ `@-`) لأنه غير معروف للخادم.

---

## 3. خريطة الأحداث

القيمة والعملة مطلوبة في أحداث الشراء. العملة دائماً `SAR`. القيمة هي المبلغ المدفوع فعلياً بعد العرض (199 أو 279 أو 349 أو 99 للعرض الإضافي)، لا السعر قبل الخصم.

| لحظة الإطلاق | Meta | TikTok | Snap |
| :--- | :--- | :--- | :--- |
| تحميل صفحة | `PageView` | `Pageview` | `PAGE_VIEW` |
| صفحة منتج | `ViewContent` | `ViewContent` | `VIEW_CONTENT` |
| إضافة للسلة | `AddToCart` | `AddToCart` | `ADD_CART` |
| فتح نافذة الطلب | `InitiateCheckout` | `InitiateCheckout` | `START_CHECKOUT` |
| إنشاء الطلب وظهور الشكر | `Purchase` | `CompletePayment` | `PURCHASE` |
| قبول العرض بـ 99 ريال | `Purchase` بـ `event_id` مختلف ينتهي بـ `_Upsell` | `CompletePayment` بنفس القاعدة | `PURCHASE` بنفس القاعدة |

أسماء ميتا حساسة لحالة الأحرف: `Purchase` لا `purchase`. أسماء سناب بالشكل `PURCHASE`. حدث تيك توك القياسي لإتمام الدفع في البكسل هو `CompletePayment`؛ أحداث الخادم تستخدم نفس الاسم حتى ينجح حذف التكرار.

`Purchase` / `CompletePayment` / `PURCHASE` تُطلق مرة واحدة بعد نجاح `POST` إنشاء الطلب، لا عند الضغط على الزر.

---

## 4. حمولة الخادم

### Meta

```http
POST https://graph.facebook.com/v21.0/{META_PIXEL_ID}/events
Content-Type: application/json
```

```json
{
  "data": [{
    "event_name": "Purchase",
    "event_time": 1710000000,
    "event_id": "SAH-1042_Purchase",
    "action_source": "website",
    "event_source_url": "https://sahraaaaaaaaaaa.shop/ar/order/success/SAH-1042",
    "user_data": {
      "ph": ["<sha256 of 9665xxxxxxxx>"],
      "fn": ["<sha256>"],
      "ct": ["<sha256 of المدينة بلا مسافات>"],
      "country": ["<sha256 of sa>"],
      "external_id": ["<sha256 of order id>"],
      "client_ip_address": "<raw>",
      "client_user_agent": "<raw>",
      "fbc": "<raw>",
      "fbp": "<raw>"
    },
    "custom_data": {
      "currency": "SAR",
      "value": 199,
      "order_id": "SAH-1042",
      "contents": [{ "id": "SKU", "quantity": 1, "item_price": 199 }],
      "content_type": "product"
    }
  }],
  "access_token": "<META_CAPI_ACCESS_TOKEN>"
}
```

لأحداث الموقع، `event_source_url` و `client_user_agent` مطلوبان. `fbc` يُبنى من `fbclid` بالشكل `fb.1.{timestamp_ms}.{fbclid}` إذا لم يكن كوكي `_fbc` موجوداً.

اختبار: أضف `test_event_code` في جسم الطلب واستخدم Test Events في Events Manager.

### TikTok

```http
POST https://business-api.tiktok.com/open_api/v1.3/event/track/
Access-Token: <TIKTOK_EVENTS_ACCESS_TOKEN>
Content-Type: application/json
```

```json
{
  "event_source": "web",
  "event_source_id": "<TIKTOK_PIXEL_ID>",
  "data": [{
    "event": "CompletePayment",
    "event_time": 1710000000,
    "event_id": "SAH-1042_CompletePayment",
    "user": {
      "phone": "<sha256 of +9665xxxxxxxx>",
      "external_id": "<sha256>",
      "ttclid": "<raw ttclid>",
      "ttp": "<raw _ttp cookie>",
      "ip": "<raw>",
      "user_agent": "<raw>"
    },
    "page": { "url": "https://sahraaaaaaaaaaa.shop/ar/order/success/SAH-1042" },
    "properties": {
      "currency": "SAR",
      "value": 199,
      "content_type": "product",
      "contents": [{ "content_id": "SKU", "content_name": "name", "quantity": 1, "price": 199 }]
    }
  }]
}
```

`page` مطلوب لأحداث الويب. أرسل الحدث فور حدوثه، لا على دفعات. للاختبار أضف `test_event_code`.

### Snapchat CAPI v3

```http
POST https://tr.snapchat.com/v3/{SNAP_PIXEL_ID}/events?access_token=<SNAP_CAPI_TOKEN>
Content-Type: application/json
```

```json
{
  "data": [{
    "event_name": "PURCHASE",
    "event_time": 1710000000,
    "event_id": "SAH-1042_PURCHASE",
    "action_source": "WEB",
    "event_source_url": "https://sahraaaaaaaaaaa.shop/ar/order/success/SAH-1042",
    "user_data": {
      "ph": ["<sha256 of 9665xxxxxxxx>"],
      "client_ip_address": "<raw>",
      "client_user_agent": "<raw>",
      "sc_click_id": "<raw ScCid>",
      "sc_cookie1": "<raw _scid>"
    },
    "custom_data": {
      "currency": "SAR",
      "value": 199,
      "order_id": "SAH-1042",
      "content_ids": ["SKU"],
      "num_items": "1",
      "content_type": "product"
    }
  }]
}
```

`event_source_url` مطلوب. `value` مطلوب لـ `PURCHASE`.

---

## 5. تحميل البكسل بشكل مؤجّل

البكسلات لا تُحقن في `<head>` بشكل متزامن، ولا عبر `strategy="beforeInteractive"`.

1. صفّ الأحداث في `window.__sahraaTrack` فور تفاعل المستخدم، حتى لو لم تُحمَّل السكربتات.
2. حمّل السكربتات الثلاثة بعد `window` `load` وداخل `requestIdleCallback` (مع مهلة احتياطية 2500ms). في Next.js استخدم `next/script` مع `strategy="lazyOnload"`.
3. بعد جاهزية كل بكسل، أفرغ الصف بنفس `event_id`.
4. معرّفات البكسل فقط هي العامة (`NEXT_PUBLIC_*`). رموز CAPI تبقى على الخادم.
5. لا تنتظر البكسل قبل إظهار الصفحة أو قبل إتمام الطلب. فشل التتبع لا يفشل الطلب.

التقاط النقرات عند أول زيارة (تُحفظ في `localStorage` وتُرسل مع الطلب):

| الاستعلام | ما يُحفظ |
| :--- | :--- |
| `fbclid` | `fbc` و `fbclid` |
| كوكي `_fbp` | `fbp` |
| `ttclid` | `ttclid` |
| كوكي `_ttp` | `ttp` |
| `ScCid` | `sc_click_id` |
| كوكي `_scid` | `sc_cookie1` |
| `utm_source` `utm_campaign` `utm_content` `utm_term` | كما هي |

---

## 6. أين يُطلق كل حدث

| الحدث | المتصفح | الخادم |
| :--- | :--- | :--- |
| PageView / ViewContent / AddToCart / InitiateCheckout | نعم، من الصف المؤجّل | نعم، `POST /v1/track` يستقبل نفس `event_id` ويرسل CAPI. لا تحجب الواجهة على هذا الطلب. |
| Purchase و Upsell | نعم، بعد رد 200 من إنشاء الطلب، بنفس `event_id` الذي أرسله الخادم في الرد أو الذي ولّدته الواجهة قبل الإرسال | نعم، داخل معالج إنشاء الطلب بعد حفظ الصف، بشكل غير متزامن (لا تُعدّ فشل CAPI فشلاً للطلب) |

الخادم يسجّل في جدول `TrackingEvent`: `event_id`, `platform`, `status`, `sent_at`. إعادة التشغيل لا تعيد إرسال نفس `event_id` لنفس المنصة.

---

## 7. متغيرات EasyPanel (الخادم فقط ما عدا المعرّفات)

انظر `backend/env.example`. المعرّفات العامة في `frontend/env.example`.

ممنوع وضع `META_CAPI_ACCESS_TOKEN` أو `TIKTOK_EVENTS_ACCESS_TOKEN` أو `SNAP_CAPI_TOKEN` في أي متغير يبدأ بـ `NEXT_PUBLIC_`.
