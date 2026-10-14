import { copyFile, mkdir, rm } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const assetsDir =
  "C:\\Users\\pc\\.cursor\\projects\\c-Users-pc-Desktop-sahra\\assets";

const slug = "car-battery-remote-disconnect-switch";
const sku = "SAHRAA-BATTERY-REMOTE-SWITCH";

const images = [
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_c2358699-0555-44e3-8e88-2abf98f87106-020d40b1-40f1-4029-8de5-1b477013e1c3.jpg",
    filename: "main.jpg",
    alt: "قاطع بطارية السيارة بالريموت مركّب على البطارية مع ريموتين بزرّي ON وOFF",
    isPrimary: true,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_840621259_1652971269824237_4172483350453784729_n-62ae706f-a384-4fbc-837a-ff481e55e470.jpg",
    filename: "features.jpg",
    alt: "قاطع البطارية Remote Control Battery Disconnect Switch بتيار عالٍ 240A مع ريموتين وملحقاته",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_839095024_1899362704768052_9209426847671516065_n-94b038a8-5007-4b93-baba-09aa21a5f61c.jpg",
    filename: "kit.jpg",
    alt: "محتويات العلبة: الجهاز بشاشة الفولتية، ريموتان، كابل، وسادة عازلة، حلقة، مفتاح ربط ومفتاح ألن",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_838983567_1416994769893271_6825726906938082456_n-1f266911-3e10-4be3-ade3-02ed5de20bba.jpg",
    filename: "voltage-display.jpg",
    alt: "شاشة رقمية لعرض فولتية البطارية مع زرّي ON وOFF اليدويين",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_840752304_1382372830313114_8173323888008510834_n-925f2951-3a11-481a-8262-12582075e0d3.jpg",
    filename: "manual.jpg",
    alt: "الجهاز مع ريموتين ودليل الاستعمال وتعليمات التركيب",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_830496966_1609351473899113_102027939931943415_n-13009833-0c0e-4f01-ad04-baaba5e06d10.jpg",
    filename: "wiring.jpg",
    alt: "مخطط التوصيل: تركيب القاطع على القطب السالب وتوصيل السلك الأحمر بالقطب الموجب",
    isPrimary: false,
  },
] as const;

async function main() {
  const publicDir = path.join(process.cwd(), "public", "products", slug);
  await rm(publicDir, { recursive: true, force: true });
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
    where: { slug: "electronics" },
    update: { isActive: true },
    create: {
      name: "Electronics",
      nameAr: "إلكترونيات",
      slug: "electronics",
      icon: "📱",
      isActive: true,
    },
  });

  const productData = {
    sellerId: seller.id,
    categoryId: category.id,
    name: "Car Battery Remote Disconnect Switch with 2 Remotes",
    nameAr: "قاطع بطارية السيارة بالريموت مع ريموتين",
    slug,
    description:
      "A remote-control battery disconnect switch that mounts directly on the car battery's negative terminal. With the two included ON/OFF remotes, you can cut or restore the battery power from outside the car, with no need to open the hood each time. High current rating of 240A, a digital display showing the battery voltage, and ON/OFF buttons on the unit itself. Magnetic latching design with only 3mA standby current, automatic disconnect when the battery voltage drops low (12V/24V systems) to protect it from draining, and an anti-false contact design. Ideal for cars parked for a long time and as an extra layer of protection against unauthorized starting. Professional installation is recommended; check compatibility with your car's battery and electrical system before installing.",
    descriptionAr:
      "قاطع كهرباء البطارية بالريموت يُركّب مباشرة على القطب السالب لبطارية السيارة. بفضل الريموتين المرفقين بزرّي ON وOFF، يمكنك فصل كهرباء البطارية أو إعادتها من خارج السيارة دون الحاجة لفتح غطاء المحرك في كل مرة. يتحمّل تياراً عالياً حتى 240 أمبير، وفيه شاشة رقمية تعرض فولتية البطارية، وزرّا ON وOFF على الجهاز نفسه. يعمل بنظام قفل مغناطيسي باستهلاك 3 مللي أمبير فقط في وضع الانتظار، ويفصل الكهرباء تلقائياً عند انخفاض فولتية البطارية (لأنظمة 12 و24 فولت) لحمايتها من التفريغ، مع تصميم يمنع التلامس الخاطئ. مثالي للسيارات التي تبقى متوقفة لفترة طويلة، ويضيف طبقة حماية إضافية ضد تشغيل السيارة دون إذنك. يُنصح بالتركيب لدى فني مختص، والتأكد من توافقه مع بطارية سيارتك ونظامها الكهربائي قبل التركيب.",
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
        question: "How does it work?",
        questionAr: "كيف يعمل الجهاز؟",
        answer:
          "The switch is installed on the battery's negative terminal and its red wire goes to the positive terminal. Press OFF on the remote (or on the unit) to cut the battery power, and ON to restore it before starting the car. It also disconnects automatically if the battery voltage drops too low.",
        answerAr:
          "يُركّب القاطع على القطب السالب للبطارية ويوصَل سلكه الأحمر بالقطب الموجب. اضغط OFF على الريموت (أو على الجهاز) لفصل كهرباء البطارية، وON لإعادتها قبل تشغيل السيارة. كما يفصل الكهرباء تلقائياً إذا انخفضت فولتية البطارية كثيراً.",
        sortOrder: 0,
      },
      {
        productId: product.id,
        question: "Is it hard to install?",
        questionAr: "هل تركيبه صعب؟",
        answer:
          "It connects directly to the battery terminal, but we recommend having it installed by a qualified technician, especially in modern cars with sensitive electronics.",
        answerAr:
          "يتصل مباشرة بقطب البطارية، لكن ننصح بتركيبه لدى فني مختص، خاصة في السيارات الحديثة ذات الأنظمة الإلكترونية الحساسة.",
        sortOrder: 1,
      },
      {
        productId: product.id,
        question: "What is included in the package?",
        questionAr: "ماذا تحتوي العلبة؟",
        answer:
          "The battery disconnect switch, two ON/OFF remotes with key rings, a red wire with a ring terminal, an insulating pad, and a washer. Some versions also include a connection cable, a wrench, and an Allen key; accessories may vary by version.",
        answerAr:
          "قاطع البطارية، وريموتان بزرّي ON وOFF مع حلقات مفاتيح، وسلك أحمر بطرف توصيل، ووسادة عازلة، وحلقة. وبعض الإصدارات تشمل أيضاً كابل توصيل ومفتاح ربط ومفتاح ألن؛ قد تختلف الملحقات حسب الإصدار.",
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
