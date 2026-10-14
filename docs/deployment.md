# Production Deployment Guide | دليل النشر والتشغيل في بيئة الإنتاج

يوثق هذا الدليل خطوات نشر منصة **صحرا (SAHRAA)** على خوادم **Hostinger VPS** بنظام تشغيل **Ubuntu 24.04** باستخدام Docker و Nginx.

---

## 1. المتطلبات السيرفرية (Server Prerequisites)

- خادم VPS يعمل بنظام **Ubuntu 24.04 64-bit**.
- موارد السيرفر الموصى بها: **2 CPU Core / 4 GB RAM** على الأقل لتحمل ضغط الزيارات والحمل الإعلاني.
- دومين مربوط بالـ IP الخاص بالسيرفر عبر سجل **A Record** (مثال: `sahraa.com` و `www.sahraa.com`).
- المنافذ المفتوحة في الجدار الناري (Firewall):
  - `22/tcp` (SSH)
  - `80/tcp` (HTTP)
  - `443/tcp` (HTTPS)

---

## 2. الإعداد الأولي للسيرفر (Initial Server Setup)

عند الدخول إلى السيرفر لأول مرة عبر SSH:

```bash
# 1. تحديث حزم النظام وتثبيت المتطلبات الأساسية
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw fail2ban

# 2. ضبط الجدار الناري UFW
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 3. تثبيت Docker و Docker Compose (أو تشغيل سكريبت scripts/setup-vps.sh)
sudo bash scripts/setup-vps.sh
```

---

## 3. إعداد المشروع ومتغيرات البيئة

```bash
# 1. الانتقال لمجلد التطبيقات واستنساخ المشروع
cd /opt
sudo git clone <REPO_URL> sahraa
cd sahraa

# 2. إنشاء وتعبئة ملف متغيرات البيئة
cp .env.example .env
nano .env
```

تأكد من تعبئة القيم الحساسة:
- `POSTGRES_PASSWORD`: كلمة مرور قوية جداً لقاعدة البيانات.
- `JWT_SECRET`: مفتاح عشوائي لا يقل عن 32 حرفاً (`openssl rand -base64 48`).
- `JWT_REFRESH_SECRET`: مفتاح عشوائي للـ Refresh Tokens.
- `NEXT_PUBLIC_APP_URL`: رابط الدومين الحقيقي `https://sahraa.com`.
- `GOOGLE_SHEETS_WEBHOOK_URL`: رابط الـ Webhook لمزامنة الطلبات.

---

## 4. التشغيل وإصدار شهادة SSL (Let's Encrypt)

تأتي المنصة بسكريبت أوتوماتيكي مدمج في `scripts/setup-ssl.sh`:

```bash
# 1. تشغيل التطبيق في وضع HTTP المؤقت
docker compose up -d postgres redis migrate app nginx

# 2. تشغيل سكريبت تثبيت SSL
sudo bash scripts/setup-ssl.sh sahraa.com admin@sahraa.com
```

يقوم السكريبت بـ:
1. طلب الشهادة من Let's Encrypt عبر خدمة `certbot`.
2. تفعيل تكوين `nginx/conf.d/sahraa-ssl.conf`.
3. إعادة تحميل Nginx ليصبح الموقع متاحاً حصراً عبر HTTPS.

---

## 5. التحديث المستمر وعدم توقف الخدمة (Zero-Downtime Updates)

لتحديث التطبيق عند دفع كود جديد:

```bash
# استخدام سكريبت التحديث المدمج
bash scripts/update.sh
```

أو يدوياً:
```bash
git pull origin main
docker compose build app
docker compose up -d --no-deps app
docker compose exec nginx nginx -s reload
```

---

## 6. خطة النسخ الاحتياطي والاستعادة (Backup & Recovery)

1. **النسخ الاحتياطي التلقائي:**
   - خدمة `db-backup` تقوم يومياً بتشغيل `scripts/backup-db.sh` وضغط نسخة كاملة من PostgreSQL داخل مجلد `./backups/` مع حذف النسخ الأقدم من 14 يوماً.
2. **النسخ الاحتياطي اليدوي الفوري:**
   ```bash
   docker compose exec db-backup sh /backup-db.sh
   ```
3. **استعادة قاعدة البيانات من نسخة احتياطية:**
   ```bash
   bash scripts/restore-db.sh ./backups/sahraa_backup_YYYYMMDD.sql.gz
   ```
