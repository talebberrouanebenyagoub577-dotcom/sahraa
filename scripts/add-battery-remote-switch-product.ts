import { copyFile, mkdir } from "fs/promises";
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
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_6d49470c-b851-4c1a-8d6f-0c22ef52b5f8-7c0722df-fa01-4a54-a32b-d79049fcb336.jpg",
    filename: "product.jpg",
    alt: "قاطع بطارية السيارة بالريموت مركّب على قطب البطارية داخل غرفة المحرك",
    isPrimary: true,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_c2358699-0555-44e3-8e88-2abf98f87106-724f7210-d3fa-4ce4-8f72-83a30172da0a.jpg",
    filename: "remotes.jpg",
    alt: "الجهاز مع ريموتين بزرّي ON وOFF لفصل وتوصيل كهرباء البطارية",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_1ba09d1a-382a-413c-9390-89720012ca4d-eb1beb7f-0998-4739-84e3-f4712d498044.jpg",
    filename: "installation.jpg",
    alt: "تركيب قاطع البطارية في الورشة والتحكم به عن بعد بالريموت",
    isPrimary: false,
  },
  {
    source:
      "c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_c2d4b4acf9bca68b9ed6c82cf9bda499_images_6c87c314-0172-4856-906b-d500e81f1276-aaf877ce-2531-4f21-a5b3-e386da05f469.jpg",
    filename: "remote-control.jpg",
    alt: "سيارة متوقفة في مرآب مظلم ومالكتها تفصل البطارية عن بعد بالريموت",
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
      "A remote-control battery disconnect switch that mounts directly on the car battery terminal. With the included ON/OFF remotes, you can cut or restore the battery power from outside the car, with no tools and no need to open the hood each time. It helps prevent battery drain when the car is parked for a long time, and adds an extra layer of protection against unauthorized starting. Comes with two remotes. Professional installation is recommended; check compatibility with your car's battery and electrical system before installing.",
    descriptionAr:
      "قاطع كهرباء البطارية بالريموت يُركّب مباشرة على قطب بطارية السيارة. بفضل الريموتين المرفقين بزرّي ON وOFF، يمكنك فصل كهرباء البطارية أو إعادتها من خارج السيارة، دون أدوات ودون الحاجة لفتح غطاء المحرك في كل مرة. يساعد على منع تفريغ البطارية عند ركن السيارة لفترة طويلة، ويضيف طبقة حماية إضافية ضد تشغيل السيارة دون إذنك. يأتي مع ريموتين. يُنصح بالتركيب لدى فني مختص، والتأكد من توافقه مع بطارية سيارتك ونظامها الكهربائي قبل التركيب.",
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
          "The switch is installed on the battery terminal. Press OFF on the remote to cut the battery power, and ON to restore it before starting the car.",
        answerAr:
          "يُركّب القاطع على قطب البطارية. اضغط OFF على الريموت لفصل كهرباء البطارية، وON لإعادتها قبل تشغيل السيارة.",
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
        answer: "One battery disconnect switch and two ON/OFF remotes.",
        answerAr: "قاطع بطارية واحد وريموتان بزرّي ON وOFF.",
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
