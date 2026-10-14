# Performance Optimization & Caching | هندسة الأداء والتخزين المؤقت

توثق هذه الصفحة استراتيجيات وتقنيات تحسين الأداء المطبقة في منصة **صحرا (SAHRAA)** لضمان تحميل فائق السرعة واستقرار النظام عند آلاف الزيارات المتزامنة.

---

## 1. وضع الإنتاج المستقل (Standalone Build)

في `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  output: "standalone",
  // ...
};
```
- يقوم Next.js بنسخ الملفات والتبعيات الضرورية فقط لتشغيل السيرفر داخل مجلد `.next/standalone`.
- يقلص حجم حاوية الـ Docker من عدة غيغابايت إلى أقل من 200 ميجابايت، مما يسرع تشغيل الحاوية ويقلل استهلاك الذاكرة (RAM).

---

## 2. تحسين وضغط الصور (Image Optimization via Sharp)

- استخدام مكتبة **`sharp`** (`v0.34.5`) المدمجة في Dockerfile و Node.js.
- مكون `next/image` يقوم تلقائياً بـ:
  - تحويل الصور إلى صيغ الويب الحديثة فائقة الضغط (**WebP** و **AVIF**).
  - ضبط أحجام الصور ديناميكياً بحسب شاشة المستخدم (`sizes` و `deviceSizes`).
  - التحميل الكسول (Lazy Loading) للصور خارج إطار الشاشة الأولي لتقليل استهلاك البيانات وسرعة العرض (LCP).

---

## 3. التخزين المؤقت في الذاكرة عبر Redis (In-Memory Caching)

في `src/lib/redis.ts`:
- **كاش كتالوج المنتجات (`products:*`):**
  - الاستعلامات الشائعة للمنتجات والتصنيفات في الصفحة الرئيسية وصفحات الأقسام يتم حفظ استجابتها في Redis لمدة **300 ثانية (5 دقائق)**.
  - يمنع ذلك الاستعلام المتكرر من قاعدة البيانات PostgreSQL عند كل زيارة للموقع.
- **كاش تفاصيل المنتج الفردي (`product:[slug]`):**
  - حفظ شجرة المنتج والخيارات والأسئلة الشائعة في الذاكرة لتسريع استعراض صفحة المنتج.
- **تحديث وإبطال الكاش (Cache Invalidation):**
  - عند تعديل المنتج أو إضافة مراجعة جديدة يتم استدعاء `cacheDel("products:*")` و `cacheDel("product:[slug]")` لضمان ظهور البيانات المحدثة.

---

## 4. تحسينات شبكة Nginx والتخزين المؤقت للملفات الثابتة

في `nginx/conf.d/sahraa-http-only.conf` و `nginx/nginx.conf`:
1. **ضغط البيانات (Gzip Compression):**
   - ضغط ملفات JSON و HTML و CSS و JavaScript و SVG بنسبة تصل إلى 70% لتقليل حجم النقل الشبكي.
2. **كاش الملفات الثابتة (Static Asset Caching):**
   ```nginx
   location /_next/static/ {
       proxy_pass http://sahraa_app;
       add_header Cache-Control "public, max-age=31536000, immutable";
   }
   ```
   - حفظ ملفات الجافاسكريبت والخطوط وملفات التنسيق الثابتة في كاش المتصفح لمدة سنة كاملة (`max-age=31536000, immutable`).
3. **تفعيل إعدادات شبكة لينكس المتقدمة:**
   - `sendfile on;`
   - `tcp_nopush on;`
   - `tcp_nodelay on;`

---

## 5. فهارس واستعلامات قاعدة البيانات (Database Indexing)

- تم وضع فهارس متخصصة (`@@index`) في `schema.prisma` على جميع الحقول التي يتم الفلترة أو الفرز بها بانتظام:
  - `Product`: `[status]`, `[categoryId]`, `[sellerId]`, `[soldCount]`, `[rating]`, `[createdAt]`.
  - `Order`: `[userId]`, `[status]`, `[orderNumber]`, `[createdAt]`.
- تجنب مشكلة `N+1 Query` بالاعتماد على خاصية `include` المتقدمة في Prisma لدمج الجداول في استعلامات موحدة.
