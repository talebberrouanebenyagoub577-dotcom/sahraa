# Database Schema & Data Models | توثيق قاعدة البيانات والمخطط

توثق هذه الصفحة المخطط الكامل لقاعدة بيانات منصة **صحرا (SAHRAA)** المبنية على **PostgreSQL 16** وتتم إدارتها عبر **Prisma ORM** (`prisma/schema.prisma`).

---

## 1. التعدادات الأساسية (Enums)

| التعداد (Enum) | القيم المدعومة | الوصف |
| :--- | :--- | :--- |
| `UserRole` | `SUPER_ADMIN`, `ADMIN`, `SELLER`, `CUSTOMER`, `SUPPORT_AGENT` | أدوار المستخدمين وصلاحياتهم |
| `CountryCode` | `SA`, `AE`, `KW`, `QA`, `BH`, `OM` | دول مجلس التعاون الخليجي الست |
| `Currency` | `SAR`, `AED`, `KWD`, `QAR`, `BHD`, `OMR`, `USD` | العملات المدعومة |
| `OrderStatus` | `PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `REFUNDED` | حالات دورة حياة الطلب |
| `PaymentMethod` | `COD`, `CREDIT_CARD`, `MADA`, `APPLE_PAY`, `TABBY`, `TAMARA`, `STRIPE`, `PAYPAL` | طرق الدفع (الأساسية حالياً: COD) |
| `PaymentStatus` | `PENDING`, `PAID`, `FAILED`, `REFUNDED` | حالة سداد الأموال |
| `ProductStatus` | `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `ARCHIVED` | حالة قبول المنتجات |
| `DiscountType` | `PERCENTAGE`, `FIXED` | نوع التخفيض في الكوبونات |
| `ShippingProvider` | `ARAMEX`, `SMSA`, `JT`, `DHL`, `CUSTOM` | شركات الشحن والتوصيل |

---

## 2. النماذج والجداول الرئيسية (Core Models)

### 2.1 المستخدم والمصادقة (User & Auth)
- **`User`**: الحساب الرئيسي للعملاء، البائعين، والمديرين.
  - الحقول الأساسية: `id`, `email`, `phone`, `passwordHash`, `firstName`, `lastName`, `role`, `country`, `currency`, `isActive`.
  - العلاقات: يمتلك سلة واحدة (`Cart`)، طلبات متعددة (`orders`)، عناوين (`addresses`)، ومراجعات (`reviews`).
- **`RefreshToken`**: تخزين الـ Refresh Tokens الصالحة لجلسات المستخدمين.
  - الحقول: `id`, `token` (فريد), `userId`, `expiresAt`, `createdAt`.

### 2.2 المتجر والبائعون (Sellers)
- **`SellerProfile`**: الملف التجاري للبائع التابع لمنصة صحرا متعددة البائعين.
  - الحقول: `storeName`, `storeNameAr`, `slug` (فريد), `logo`, `banner`, `status`, `rating`, `commissionRate`, `bankAccount`.
  - العلاقة: يرتبط بمنتجات البائع (`products`) وطلباته (`orders`).

### 2.3 المنتجات والكتالوج (Catalog & Products)
- **`Category`**: تصنيفات المنتجات (مثل: العناية، العطور، الإلكترونيات، المنزل).
  - يدعم الشجرة الهرمية (`parentId` و `children`) وله حقول `name`, `nameAr`, `slug`.
- **`Product`**: جدول المنتجات الأساسي.
  - الحقول المالية والتسويقية: `price` (سعر البيع الافتراضي 199 ر.س), `compareAtPrice`, `costPrice`.
  - المقاييس: `rating` (متوسط التقييم), `reviewCount` (عدد التقييمات), `soldCount` (عدد المبيعات), `viewCount`.
  - خصائص الدفع عند الاستلام: `codAvailable` (Boolean).
  - العلاقات: `images` (`ProductImage`), `variants` (`ProductVariant`), `inventory` (`Inventory`), `reviews` (`Review`), `faqs` (`ProductFAQ`).
- **`ProductImage`**: صور المنتج، تدعم الترتيب `sortOrder` وتحديد الصورة الرئيسية `isPrimary`.
- **`ProductVariant`**: خيارات المنتج (الحجم، اللون، السعر المخصص، المخزون).
- **`Inventory`**: إدارة كميات المخزون، مع تنبيهات انخفاض المخزون `lowStockAlert`.

### 2.4 سلة المشتريات (Cart & Items)
- **`Cart`**: سلة العميل المرتبطة بـ `userId`.
- **`CartItem`**: عناصر السلة، تشمل `productId`, `variantId`, و `quantity`.
- ملاحظة معمارية: النظام الحالي يستخدم أيضاً التخزين المحلي في المتصفح `localStorage` لضمان عمل السلة لغير المسجلين بكفاءة فورية، مع إمكانية التزامن مع هذا الجدول.

### 2.5 الطلبات والعمليات (Orders & Fulfillment)
- **`Order`**: الجدول المركزي لطلبات الشراء.
  - المعرفات: `id` (CUID فريد وداخلي), `orderNumber` (كود فريد يظهر للعميل مثل `SHR-XXXX`).
  - المبالغ: `subtotal`, `discount`, `shippingCost` (0 في صحرا), `total`, `currency`.
  - الدفع: `paymentMethod` (COD), `paymentStatus` (PENDING).
  - الشحن: `shippingAddress` (حقل JSON يحتوي على الاسم، رقم الهاتف، والمدينة).
  - الحالات: `status` (يبدأ بـ `PENDING`), `estimatedDelivery`.
  - العلاقات: `items` (`OrderItem`), `statusHistory` (`OrderStatusHistory`).
- **`OrderItem`**: تفاصيل كل منتج داخل الشحنة:
  - الحقول: `name`, `nameAr`, `sku`, `price`, `quantity`, `total`.
  - يدعم تمييز منتجات الـ Upsell (التي تُسجل بسعر 99 ر.س) والمنتجات المعتادة (199 ر.س).
- **`OrderStatusHistory`**: سجل تدقيق كامل لتغير حالة الطلب مع التوقيت والملاحظات.

### 2.6 المراجعات والمحتوى الاجتماعي (Social Proof & Reviews)
- **`Review`**: تجارب وتقييمات العملاء الموثقة للمنتجات.
  - الحقول: `rating` (من 1 إلى 5), `title`, `comment`, `isVerified` (توثيق أن المشتري استلم المنتج بالفعل).

### 2.7 الإعدادات والمراقبة (Settings & Audit)
- **`SiteSettings`**: إعدادات المنصة المركزية بسجل معرفه `default`، يشمل اسم الموقع، وصف السيو، الشعار، أرقام الواتساب والدعم الفني.
- **`AuditLog`**: سجل تتبع لعمليات المشرفين والإجراءات الحساسة في لوحة التحكم.

---

## 3. الفهارس وقواعد الأداء (Indexes & Performance)

يحتوي المخطط على فهارس مركبة ومفردة مُعدة لحماية الأداء عند زيادة عدد الزوار:
- `Product`: فهارس على `slug`, `status`, `categoryId`, `sellerId`, `isFeatured`, `isTrending`, `isFlashDeal`.
- `Order`: فهارس على `orderNumber`, `userId`, `status`, `createdAt`.
- `CartItem`: فهرس فريد مركب على `[cartId, productId, variantId]`.
- `Review`: فهرس على `[productId, rating]` وفهرس مركب لمنع تكرار تقييم نفس المستخدم للمنتج `[userId, productId]`.

---

## 4. الهجرة والتغذية (Migrations & Seeding)

- **ملف البذر والتغذية:** `prisma/seed.ts`
- **سكريبتات مساعدة:**
  - `scripts/seed-customer-reviews.ts`: إضافة وتحديث مراجعات واقعية موثقة للمنتجات الـ 14.
  - `scripts/add-*-product.ts`: سكريبتات إضافة الكتالوج والمنتجات الجديدة.
- **أوامر التشغيل:**
  ```bash
  npx prisma migrate dev --name <migration_name>
  npx prisma db push
  npx prisma db seed
  ```
