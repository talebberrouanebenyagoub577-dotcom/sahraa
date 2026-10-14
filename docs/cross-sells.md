# Post-Purchase Cross-Sells | نظام البيع التقاطعي في صفحة الشكر

توثق هذه الصفحة معمارية نظام البيع التقاطعي (Cross-Sells) في صفحة تأكيد الطلب والشكر (Thank You Page) في منصة **صحرا (SAHRAA)**.

---

## 1. قواعد العمل للبيع التقاطعي (Cross-Sell Rules)

1. **الأسعار الأصلية حصراً:**
   - جميع المنتجات المعروضة في قسم البيع التقاطعي بصفحة الشكر تظهر بـ **السعر الأصلي: 199 ريال سعودي**.
   - لا يوجد أي خصم إضافي بعد مرحلة الـ Upsell.
2. **شحن مجاني مدمج:**
   - الميزة التي تدفع العميل للشراء هنا هي دمج المنتج داخل **نفس الطرد** دون دفع أي تكاليف شحن أو رسوم استلام إضافية.
3. **عدم إنشاء طلب جديد:**
   - الإضافة تتم مباشرة على سجل الطلب المفتوح حالياً في قاعدة البيانات؛ مما يعني أن العميل يستلم شحنة واحدة وفاتورة واحدة ومندوباً واحداً.

---

## 2. التدفق البرمجي والتنفيذ (Technical Flow)

```text
[صفحة الشكر: عرض منتجات إضافية بسعر 199 ر.س]
                          │
         [العميل يضغط: "أضف لنفس الشحنة"]
                          │
                          ▼
            [إرسال PATCH /api/orders/[id]]
     الحمولة: { addCrossSellProductId: "<PRODUCT_ID>" }
                          │
     ┌────────────────────┴────────────────────┐
     ▼                                         ▼
[تحديث قاعدة البيانات]                 [تحديث Google Sheet]
- إضافة OrderItem جديد بسعر 199 ر.س   - تحديث إجمالي الفاتورة
- زيادة subtotal و total بـ 199 ر.س   - تحديث قائمة المنتجات
- خصم 1 من المخزون وتحديث soldCount
                          │
                          ▼
           [تحديث فوري لصفحة الشكر للعميل]
```

---

## 3. نقطة الاتصال (`PATCH /api/orders/[id]`)

تتعامل هذه النقطة في `src/app/api/orders/[id]/route.ts` مع طلب الإضافة كالتالي:
```typescript
if (body.addCrossSellProductId) {
  const product = await prisma.product.findUnique({
    where: { id: body.addCrossSellProductId, status: "APPROVED" },
  });
  
  // إضافة بند الطلب بسعر 199 ريال
  const updatedOrder = await prisma.$transaction(async (tx) => {
    await tx.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        name: product.name,
        nameAr: product.nameAr,
        sku: product.sku,
        price: PRODUCT_UNIT_PRICE, // 199 SAR
        quantity: 1,
        total: PRODUCT_UNIT_PRICE,
      },
    });

    return await tx.order.update({
      where: { id: order.id },
      data: {
        subtotal: order.subtotal + PRODUCT_UNIT_PRICE,
        total: order.total + PRODUCT_UNIT_PRICE,
      },
      include: { items: { include: { product: true } } },
    });
  });

  // مزامنة التحديث مع Google Sheet Webhook
  void appendOrderToGoogleSheet({ ... });
  
  return apiSuccess(updatedOrder);
}
```

---

## 4. استبعاد المنتجات الموجودة مسبقاً في الطلب
يقوم المكون في `OrderConfirmation.tsx` بفلترة قائمة المنتجات المعروضة:
```typescript
const orderedProductIds = new Set(
  order.items.map((i) => i.productId || i.product?.id || i.product?.slug)
);
const eligibleCrossSells = crossSells.filter(
  (p) => !orderedProductIds.has(p.id) && !orderedProductIds.has(p.slug)
);
```
يضمن هذا عدم اقتراح منتج قام العميل بشرائه بالفعل في طلبه الأساسي أو في مرحلة الـ Upsell.
