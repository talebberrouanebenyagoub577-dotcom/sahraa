import { copyFile, mkdir } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const assetsDir =
  "C:\\Users\\pc\\.cursor\\projects\\c-Users-pc-Desktop-sahra\\assets";

const slug = "ems-foot-massager-mat";
const sku = "SAHRAA-EMS-FOOT-MASSAGER";

const images = [
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_e81ef437-742a-4895-be62-4f5ca11f81d8-598f4cc6-1e3d-448e-a85a-518ccc0d293a.jpg",
    filename: "product.jpg",
    alt: "جهاز مساج القدمين EMS Foot Massager على شكل وسادة رفيعة مع شاشة تحكم رقمية",
    isPrimary: true,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_b88ebf28-5bda-4035-8523-e839ad19addb-d30d42c4-7bea-47eb-9145-46df46466c98.jpg",
    filename: "lifestyle.jpg",
    alt: "استرخاء في المنزل مع جهاز مساج القدمين EMS أثناء القراءة على الكنبة",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_5e5c481e-d033-4b3a-8522-2bdded34bc69__1_-61ddc29e-ca75-4cfc-8181-6819b1e5bae3.jpg",
    filename: "controller.jpg",
    alt: "وحدة التحكم الرقمية لجهاز EMS مع أزرار التشغيل وضبط الشدة",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_9f59036f-d471-45a2-b3d1-7425398e688b-813530c8-4e0a-41dd-9236-09202b53170f.jpg",
    filename: "usage.jpg",
    alt: "طريقة الاستعمال: ضع القدمين حافيتين على الوسادة وشغّل الجهاز",
    isPrimary: false,
  },
] as const;

async function main() {
  const publicDir = path.join(process.cwd(), "public", "products", slug);
  await mkdir(publicDir, { recursive: true });

  for (const img of images) {
    await copyFile(
      path.join(assetsDir, img.source),
      path.join(publicDir, img.filename)
    );
    console.log(`Copied ${img.filename}`);
  }

  const admin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
    select: { id: true },
  });
  if (!admin) throw new Error("SUPER_ADMIN account not found");

  const seller = await prisma.sellerProfile.upsert({
    where: { slug: "sahraa-official-store" },
    update: { status: "APPROVED", approvedAt: new Date() },
    create: {
      userId: admin.id,
      storeName: "SAHRAA Store",
      storeNameAr: "متجر صحرا",
      slug: "sahraa-official-store",
      description: "Official SAHRAA catalog",
      descriptionAr: "المتجر الرسمي لمنصة صحرا",
      status: "APPROVED",
      approvedAt: new Date(),
    },
  });

  const category = await prisma.category.upsert({
    where: { slug: "sports" },
    update: { isActive: true },
    create: {
      name: "Sports",
      nameAr: "رياضة",
      slug: "sports",
      icon: "⚽",
      isActive: true,
    },
  });

  const productData = {
    sellerId: seller.id,
    categoryId: category.id,
    name: "EMS Foot Massager Mat with Digital Controller",
    nameAr: "جهاز مساج القدمين EMS بشاشة رقمية",
    slug,
    description:
      "EMS Foot Massager is a thin, foldable foot-massage mat that uses gentle EMS electrical pulses to relax tired feet. It has a round digital controller with a display and buttons to switch on and adjust the mode and intensity, and it is rechargeable for easy use anywhere. Place your bare feet on the mat, switch it on, and start at a low intensity. Ideal after a long day of standing, walking, or exercise. Not suitable for people with a pacemaker or implanted electronic device, during pregnancy, or for people with epilepsy, heart conditions, or open wounds on the feet. Consult a doctor if you have any health condition. This is a relaxation device, not a medical treatment.",
    descriptionAr:
      "جهاز مساج القدمين EMS Foot Massager هو وسادة رفيعة قابلة للطي تعمل بنبضات كهربائية خفيفة (EMS) لإرخاء القدمين المتعبتين. يأتي بوحدة تحكم دائرية بشاشة رقمية وأزرار للتشغيل وضبط النمط والشدة، وهو قابل للشحن لسهولة الاستعمال في أي مكان. ضع قدميك حافيتين على الوسادة، شغّل الجهاز، وابدأ بشدة منخفضة. مثالي بعد يوم طويل من الوقوف أو المشي أو التمارين. لا يناسب من لديهم منظّم ضربات القلب أو أي جهاز إلكتروني مزروع، ولا الحوامل، ولا المصابين بالصرع أو أمراض القلب أو بجروح مفتوحة في القدمين. استشر الطبيب إذا كانت لديك أي حالة صحية. هذا جهاز للاسترخاء وليس علاجاً طبياً.",
    price: 199,
    sku,
    codAvailable: true,
    status: "APPROVED" as const,
    isFeatured: true,
    isNewArrival: true,
  };

  const productImages = images.map((img, idx) => ({
    url: `/products/${slug}/${img.filename}`,
    alt: img.alt,
    isPrimary: img.isPrimary,
    sortOrder: idx,
  }));

  const existing = await prisma.product.findUnique({ where: { sku } });

  const product = existing
    ? await prisma.product.update({
        where: { sku },
        data: {
          ...productData,
          images: {
            deleteMany: {},
            create: productImages,
          },
          inventory: {
            upsert: {
              create: { quantity: 999, lowStockAlert: 0 },
              update: { quantity: 999, lowStockAlert: 0 },
            },
          },
        },
      })
    : await prisma.product.create({
        data: {
          ...productData,
          images: { create: productImages },
          inventory: {
            create: { quantity: 999, lowStockAlert: 0 },
          },
        },
      });

  await prisma.productFAQ.deleteMany({ where: { productId: product.id } });
  await prisma.productFAQ.createMany({
    data: [
      {
        productId: product.id,
        question: "How do I use it?",
        questionAr: "كيفية استعمال المنتج؟",
        answer:
          "Place the mat on the floor, sit down, and put your bare feet on it. Press the power button, choose a mode, and start at the lowest intensity, raising it gradually until it feels comfortable. A session of about 15 minutes is enough.",
        answerAr:
          "ضع الوسادة على الأرض واجلس، ثم ضع قدميك حافيتين عليها. اضغط زر التشغيل واختر النمط، وابدأ بأقل شدة ثم ارفعها تدريجياً حتى تشعر بالراحة. تكفي جلسة لمدة 15 دقيقة تقريباً.",
        sortOrder: 0,
      },
      {
        productId: product.id,
        question: "Who should not use it?",
        questionAr: "من لا يناسبه هذا الجهاز؟",
        answer:
          "Do not use it if you have a pacemaker or implanted electronic device, are pregnant, have epilepsy or a heart condition, or have open wounds on your feet. Consult a doctor if you have any health condition. Keep away from children.",
        answerAr:
          "لا يُستعمل لمن لديهم منظّم ضربات القلب أو جهاز إلكتروني مزروع، ولا للحوامل، ولا للمصابين بالصرع أو أمراض القلب، ولا عند وجود جروح مفتوحة في القدمين. استشر الطبيب إذا كانت لديك أي حالة صحية، ويُحفظ بعيداً عن الأطفال.",
        sortOrder: 1,
      },
      {
        productId: product.id,
        question: "Can I use it with socks?",
        questionAr: "هل يمكن استعماله بالجوارب؟",
        answer:
          "The pulses work best with bare feet in direct contact with the mat. If you feel very little through socks, slightly moisten your soles or use it barefoot.",
        answerAr:
          "تعمل النبضات بشكل أفضل مع القدمين الحافيتين الملامستين للوسادة مباشرة. إذا كان الإحساس ضعيفاً مع الجوارب، رطّب باطن القدمين قليلاً أو استعمله حافياً.",
        sortOrder: 2,
      },
    ],
  });

  console.log(`Published product: ${product.nameAr} (${product.slug})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
