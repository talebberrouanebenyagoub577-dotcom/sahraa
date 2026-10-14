import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const sampleUsers = [
  { firstName: "نورة", lastName: "العتيبي", email: "noura.otaibi@example.com", phone: "+966501112233" },
  { firstName: "فهد", lastName: "الدوسري", email: "fahad.dossari@example.com", phone: "+966502223344" },
  { firstName: "ريم", lastName: "الشمري", email: "reem.shammari@example.com", phone: "+966503334455" },
  { firstName: "عبدالله", lastName: "القحطاني", email: "abdullah.qahtani@example.com", phone: "+966504445566" },
  { firstName: "سارة", lastName: "الحربي", email: "sara.harbi@example.com", phone: "+966505556677" },
  { firstName: "ماجد", lastName: "العنزي", email: "majed.anazi@example.com", phone: "+966506667788" },
  { firstName: "منيرة", lastName: "السبيعي", email: "mounira.subaie@example.com", phone: "+966507778899" },
  { firstName: "خالد", lastName: "المطيري", email: "khaled.mutairi@example.com", phone: "+966508889900" },
  { firstName: "هند", lastName: "الغامدي", email: "hind.ghamdi@example.com", phone: "+966509990011" },
  { firstName: "سلطان", lastName: "الشهري", email: "sultan.shehri@example.com", phone: "+966501239876" },
  { firstName: "ليلى", lastName: "الزهراني", email: "laila.zahrani@example.com", phone: "+966502348765" },
  { firstName: "عمر", lastName: "السعيد", email: "omar.saeed@example.com", phone: "+966503457654" },
  { firstName: "العنود", lastName: "الشريف", email: "alanoud.sharif@example.com", phone: "+966504568765" },
  { firstName: "تركي", lastName: "العسيري", email: "turki.asiri@example.com", phone: "+966505679876" },
  { firstName: "حصة", lastName: "الدخيل", email: "hessa.dakheel@example.com", phone: "+966506780987" },
  { firstName: "عبدالمحسن", lastName: "التميمي", email: "abdulmohsen.tamimi@example.com", phone: "+966507891098" },
  { firstName: "أمل", lastName: "المنصوري", email: "amal.mansoori@example.com", phone: "+971501234567" },
  { firstName: "فيصل", lastName: "الرشيدي", email: "faisal.rashidi@example.com", phone: "+96590123456" },
  { firstName: "مريم", lastName: "البلوشي", email: "maryam.balushi@example.com", phone: "+96891234567" },
  { firstName: "حمد", lastName: "الهاجري", email: "hamad.hajri@example.com", phone: "+97455123456" },
];

const productReviewsData: Record<string, { title: string; comment: string; rating: number }[]> = {
  "deep-cera-vitamin-illuminating-serum": [
    {
      title: "سيروم خفيف وممتاز للاستخدام اليومي",
      comment: "وصلني الطلب مغلف بعناية فائقة والدفع عند الاستلام سهل جداً. السيروم قوامه ناعم وخفيف وتمتصه البشرة بسرعة بدون أي ملمس دهني، وتغليف العلبة والقارورة فخم ومرتب.",
      rating: 5,
    },
    {
      title: "تغليف فاخر وجودة عالية",
      comment: "القطارة عملية جداً وتوزع الكمية بدقة. السيروم منعش وريحته هادئة ومكوناته واضحة ومطبوعة على العبوة. تجربة ممتازة مع المتجر والتوصيل كان سريع في الرياض.",
      rating: 5,
    },
    {
      title: "أعجبني ضمن عرض الـ 3 منتجات",
      comment: "طلبته ضمن عرض 3 منتجات بـ 399 ريال، وفرق كبير في السعر والتوصيل مجاني لباب البيت. منتج ممتاز وأصلي نفس الصور المعروضة بالضبط.",
      rating: 5,
    },
    {
      title: "منتج رائع وتوصيل سريع",
      comment: "التوصيل استغرق يومين فقط لجدة، والمندوب محترم والدفع عند الاستلام مريح. العبوة زجاجية أصلية وجميلة ومرتاحة عليه في روتيني اليومي.",
      rating: 4,
    },
    {
      title: "تجربة شراء ممتازة وأنصح به",
      comment: "جودة القارورة والسيروم الذهبي راقية جداً وواضح العناية بالتفاصيل. سرعة التوصيل وخدمة العملاء ممتازة.",
      rating: 5,
    },
  ],
  "al-asmad-alharmain-kohl": [
    {
      title: "كحل أصلي وفخم جداً",
      comment: "كحل الحرمين بماء زمزم وماء الورد، لونه أسود داكن وأنيق وبارد على العين بدون أي حرقان. العود النحاسي المرفق فخم وسهل الاستعمال.",
      rating: 5,
    },
    {
      title: "تراث وجودة أصيلة",
      comment: "من أفضل ما جربت للكحل العربي. العبوة الزجاجية وغطاؤها المنقوش مع العلبة السوداء تدل على أصالة المنتج. شكراً لمتجر صحرا على توفيره.",
      rating: 5,
    },
    {
      title: "ممتاز وتغليف راقي",
      comment: "ثابت وسواده جميل، والعود المرفق مريح جداً في التكحيل. استلمت الطلب ودفعت عند الاستلام بدون أي تعقيد.",
      rating: 5,
    },
    {
      title: "طلبته للمرة الثانية",
      comment: "كحل راقي وأعجب الوالدة جداً، بارد ومريح للعين ويستاهل كل ريال خصوصاً مع التوصيل المجاني.",
      rating: 5,
    },
    {
      title: "سواد عربي كلاسيكي مريح",
      comment: "أعجبني وضوح السواد وسهولة التحكم بالعود النحاسي المنقوش، منتج تقليدي فاخر وتوصيل سريع في مكة المكرمة.",
      rating: 5,
    },
  ],
  "eelhoe-hair-darkening-spray": [
    {
      title: "بخاخ عملي وسهل الاستخدام",
      comment: "العبوة حجمها مناسب 120 مل، والرشاش دقيق ومريح في التوزيع. التغليف وصل محكم وبدون أي تسريب، والدفع عند الاستلام ميزة مريحة.",
      rating: 5,
    },
    {
      title: "ممتاز للعناية بمظهر الشعر",
      comment: "رائحة لطيفة وملمس غير لزج، يعطي لمعة ونعومة حلوة للشعر. التعامل مع المتجر والتوصيل ممتازين.",
      rating: 4,
    },
    {
      title: "جودة عالية وسعر مناسب",
      comment: "استفدت من عرض الباقة مع منتجين آخرين وكان التوصيل مجاني، المنتج مطابق للصور والمواصفات.",
      rating: 5,
    },
    {
      title: "راضي جداً عن التجربة",
      comment: "منتج أنيق وسهل التطبيق اليومي، شكر وتقدير لفريق صحرا على سرعة الاستجابة وخدمة التوصيل.",
      rating: 5,
    },
    {
      title: "توصيل ممتاز ومنتج مطابق للوصف",
      comment: "العبوة الزجاجية البنية وصلت سليمة ومحكمة، والرش متوازن دون هدر. تجربة شراء ناجحة.",
      rating: 5,
    },
  ],
  "dr-melaxin-peel-shot": [
    {
      title: "أمبولة ممتازة للعناية بالبشرة",
      comment: "قوام لطيف وسريع الامتصاص، يعطي إحساساً بالنظافة والترطيب الناعم للبشرة. العبوة وصلت سليمة ومحكمة الإغلاق.",
      rating: 5,
    },
    {
      title: "ملمس ناعم وجودة كورية راقية",
      comment: "توزيع السيروم سهل جداً وملمسه مائي خفيف غير مزعج، ممتاز في الروتين المسائي والتوصيل سريع.",
      rating: 5,
    },
    {
      title: "تجربة ممتازة وتعامل احترافي",
      comment: "الدفع عند الاستلام جعل التجربة مريحة وآمنة. المنتج مطابق تماماً للوصف على الموقع.",
      rating: 4,
    },
    {
      title: "أصلي وخفيف على البشرة",
      comment: "القطارة مريحة ونقطتين تكفي كامل الوجه. مناسب جداً قبل النوم وتغليفه ممتاز.",
      rating: 5,
    },
    {
      title: "خدمة متجر صحرا ممتازة",
      comment: "وصلني الطلب في الرياض خلال 48 ساعة والدفع عند الاستلام كاش بكل سهولة.",
      rating: 5,
    },
  ],
  "booty-gainer-pro-series": [
    {
      title: "تغليف محكم وعبوة أصلية",
      comment: "العبوة وصلت مغلفة بغلاف الأمان الأصلي، والتوصيل كان في الموعد تماماً. شكراً لمتجر صحرا.",
      rating: 5,
    },
    {
      title: "خدمة توصيل ممتازة ومطابق للمواصفات",
      comment: "طلبت المنتج ووصلني خلال 48 ساعة لباب البيت والدفع كاش عند الاستلام. جودة وتغليف ممتازين.",
      rating: 5,
    },
    {
      title: "تجربة جيدة وسعر منافس",
      comment: "عرض الـ 3 منتجات بـ 399 ريال ممتاز جداً ويوفر الكثير. المنتج أصلي ونفس الصور.",
      rating: 4,
    },
    {
      title: "منتج ممتاز وتوصيل مجاني",
      comment: "سعيد بسرعة التوصيل والتعامل الراقي من مندوب التوصيل، المنتج مطابق لما هو معروض في المتجر.",
      rating: 5,
    },
  ],
  "capsicum-pain-relief-cream": [
    {
      title: "كريم مهدئ ومريح جداً بعد يوم طويل",
      comment: "إحساس الدفء لطيف ومريح للعضلات والظهر بعد العمل أو التمارين. قوامه سهل الفرد ولا يترك أثراً دهنياً، والتغليف ممتاز.",
      rating: 5,
    },
    {
      title: "ممتاز لآلام الركبة والكتف",
      comment: "استعملته للوالد وأعجبه جداً، يعطي شعوراً دافئاً ومهدئاً. الدفع عند الاستلام مريح والشحن كان مجاني.",
      rating: 5,
    },
    {
      title: "منتج عملي وجودة ممتازة",
      comment: "عبوة محكمة وتوصيل سريع في الدمام، تجربة شراء موثوقة وأنصح بتجربته.",
      rating: 5,
    },
    {
      title: "دفء لطيف وسريع التأثير",
      comment: "كمية بسيطة مع تدليك لطيف تكفي تماماً، إحساس الراحة يدوم لساعات والعبوة مريحة في الاستعمال.",
      rating: 5,
    },
    {
      title: "توصيل ممتاز ومطابق للصورة",
      comment: "المنتج أصلي وتاريخ الصلاحية حديث ومغلف بإحكام، شكراً لمتجر صحرا على المصداقية.",
      rating: 5,
    },
  ],
  "al-jabrut-assaoudi-50ml": [
    {
      title: "منتج أصلي بحجم عملي ممتاز",
      comment: "الحجم 50 مل مناسب جداً وسهل الحمل في الحقيبة أو السيارة. التغليف فاخر ومحكم وخدمة التوصيل في المتجر سريعة وممتازة.",
      rating: 5,
    },
    {
      title: "جودة وتصميم فاخر",
      comment: "القارورة والتغليف يعكسان فخامة المنتج، تجربة ممتازة مع متجر صحرا والدفع عند الاستلام سلس.",
      rating: 5,
    },
    {
      title: "حجم مناسب وسهل التنقل به",
      comment: "أعجبني الحجم المدمج والتغليف الأنيق، وصلني الطلب بحالة ممتازة وبدون أي تأخير.",
      rating: 5,
    },
    {
      title: "أنصح به وتجربة شراء راقية",
      comment: "اشتريته ضمن باقة الـ 3 منتجات ووصلني مع شحن مجاني لباب البيت في المدينة المنورة.",
      rating: 5,
    },
  ],
  "al-matthee-fun-math-game": [
    {
      title: "لعبة تعليمية ممتعة ومفيدة للأطفال",
      comment: "خامات الكروت واللوحة قوية وجودتها ممتازة، والأولاد تشجعوا جداً على حل المسائل واللعب المشترك. فكرة ذكية ومسلية.",
      rating: 5,
    },
    {
      title: "أنصح بها لكل عائلة",
      comment: "جمعت أطفالي بعيداً عن الشاشات واستمتعوا باللعب التنافسي. التوصيل كان سريعاً والعلبة متكاملة وجذابة.",
      rating: 5,
    },
    {
      title: "طريقة ذكية لتقوية الحساب الذهني",
      comment: "البطاقات سميكة ومصممة بألوان واضحة، أطفالي يقضون معها وقتاً مفيداً وممتعاً يومياً.",
      rating: 5,
    },
    {
      title: "تغليف متقن وجودة رائعة",
      comment: "العلبة وصلت محكمة ومحمية بالكامل، منتج تعليمي يستحق الاقتناء وتوصيل سريع.",
      rating: 5,
    },
  ],
  "ems-foot-massager-mat": [
    {
      title: "جهاز مساج مريح وممتاز بعد الوقوف الطويل",
      comment: "الشاشة الرقمية واضحة وبرامج المساج متعددة، يعطي راحة واسترخاء ممتاز للقدمين والساقين. سهل الطي والحفظ واستفدت منه يومياً.",
      rating: 5,
    },
    {
      title: "عملي جداً وبطاريته تدوم",
      comment: "سهل الشحن وخفيف الوزن، والدفع عند الاستلام مع التوصيل المجاني جعل الطلب مريحاً ومضموناً.",
      rating: 5,
    },
    {
      title: "مستويات قوة متنوعة تناسب الجميع",
      comment: "تغيير الأنماط سهل بالريموت والشاشة، يعطي نبضات ممتازة تحرك الدورة الدموية في باطن القدم.",
      rating: 5,
    },
    {
      title: "خفيف وسهل التخزين",
      comment: "ينطوي بسهولة بعد الجلسة ولا يأخذ أي مكان، استخدمه يومياً بعد الدوام وأنصح به.",
      rating: 4,
    },
    {
      title: "توصيل سريع وجودة ممتازة",
      comment: "وصلني الطلب لجدة في يومين فقط، الجهاز يشتغل بكفاءة عالية وبطاريته ممتازة.",
      rating: 5,
    },
  ],
  "women-perfume-trio-la-vita-sbela-mi-way-ideal": [
    {
      title: "مجموعة عطور رائعة وتستاهل كل ريال",
      comment: "ثلاثة عطور بروائح أنثوية مميزة ومتنوعة، العبوات أنيقة ومناسبة جداً للإهداء أو الاستعمال اليومي. ثباتها ممتاز وسعرها اقتصادي.",
      rating: 5,
    },
    {
      title: "تغليف هدايا فاخر وريحة تجنن",
      comment: "كل عطر له طابع خاص وجذاب، وصلتني بحالة ممتازة ومغلفة بشكل محمي. تجربة تسوق راقية.",
      rating: 5,
    },
    {
      title: "روائح متناسقة وثبات جميل",
      comment: "العلب أنيقة جداً على التسريحة، روائح زهرية وفاكهية هادئة تدوم لساعات ووصلت مغلفة بعناية.",
      rating: 5,
    },
    {
      title: "أفضل صفقة عطور",
      comment: "الحصول على 3 عطور كاملة بـ 199 ريال مع التوصيل المجاني صفقة لا تعوض، شكراً صحرا.",
      rating: 5,
    },
    {
      title: "توصيل سريع وفخامة في التقديم",
      comment: "التغليف الخارجي محمي ضد الصدمات ووصل سليم، تنوع الروائح ممتاز للاستعمال اليومي.",
      rating: 5,
    },
  ],
  "oswei-disposable-toilet-cleaning-wand": [
    {
      title: "أداة عملية جداً ونظافة بدون مجهود",
      comment: "فكرة الإسفنجات ذات الاستعمال الواحد ممتازة وصحية، المادة المنظفة بالداخل تنظف برغوة ورائحة منعشة وتخلصك من الحوسة.",
      rating: 5,
    },
    {
      title: "مريح وسهل الاستخدام في البيت",
      comment: "المقبض طويل ومريح والتخلص من القطعة بكبسة زر بدون لمس. منتج ذكي ووصلني في وقت قياسي.",
      rating: 5,
    },
    {
      title: "نظافة ورائحة معقمة ممتازة",
      comment: "الرغوة الزرقاء تطلع فور ملامسة الماء وتنظف الزوايا الصعبة بسهولة، منتج اختصر وقت التنظيف.",
      rating: 5,
    },
    {
      title: "الحامل أنيق وعملي",
      comment: "يثبت على الجدار بنظافة وبدون حفر، والإسفنجات البديلة تكفي لفترة طويلة وتغليفها محكم.",
      rating: 5,
    },
    {
      title: "ممتاز وأنصح كل بيت فيه",
      comment: "توصيل سريع والدفع عند الاستلام، أداة تنظيف صحية ومريحة جداً وتغنيك عن الفرش التقليدية.",
      rating: 5,
    },
  ],
  "car-battery-remote-disconnect-switch": [
    {
      title: "اختراع ذكي لحماية بطارية السيارة",
      comment: "الريموت يعمل من مسافة ممتازة والتركيب كان واضحاً وسهلاً، مريح جداً عند السفر وترك السيارة لفترة طويلة لمنع تفريغ البطارية.",
      rating: 5,
    },
    {
      title: "جودة قوية ويعمل بكفاءة",
      comment: "معه ريموتين ويتحمل أمبير عالي، التوصيل والدفع عند الاستلام كانا بمنتهى السهولة والأمان.",
      rating: 4,
    },
    {
      title: "حل نهائي لمشكلة تفريغ البطارية",
      comment: "ركبته على سيارة الدوام اللي تقف أيام طويلة، كبسة زر بالريموت وتفصل كل شي وترتاح من اشتراك البطارية.",
      rating: 5,
    },
    {
      title: "وصلات نحاسية قوية وتصنيع متين",
      comment: "القطع سميكة وتتحمل الحرارة، والريموت الثاني ميزة ممتازة تخليه احتياط في البيت. توصيل سريع في الرياض.",
      rating: 5,
    },
  ],
  "hair-concealer-fuller-hair-look": [
    {
      title: "تغطية فورية وطبيعية لفراغات الشعر",
      comment: "اللون يندمج مع الشعر بشكل طبيعي جداً بدون أي تكتل، مقاوم للتعرق وخفيف على الفروة. ممتاز في المناسبات السريعة.",
      rating: 5,
    },
    {
      title: "سهل الحمل والاستعمال",
      comment: "البخاخ دقيق ولا يسبب فوضى، وصلني الطلب خلال يومين والتغليف ممتاز.",
      rating: 5,
    },
    {
      title: "ثبات عالي ومظهر طبيعي",
      comment: "لا يترك بقع على الجبين وسهل التوزيع بالمشط، ويزول مع أول غسيل بالشامبو بدون أي أثر.",
      rating: 5,
    },
    {
      title: "حل عملي وسريع",
      comment: "ينفع جداً قبل الطلعات السريعة، حجم العلبة مدمج وتوصيل مجاني لباب البيت والدفع كاش عند الاستلام.",
      rating: 4,
    },
    {
      title: "راضي تماماً عن النتيجة",
      comment: "المنتج أصلي ونفس الصور، يعطي مظهر كثافة لطيف ومتناسق. تعامل المتجر راقي.",
      rating: 5,
    },
  ],
  "harvey-ross-instant-eye-lift": [
    {
      title: "كريم مريح وناعم لمحيط العين",
      comment: "قوامه خفيف وسريع الامتصاص، يعطي إحساساً بالشد والانتعاش ويقلل من مظهر الإجهاد الصباحي حول العينين.",
      rating: 5,
    },
    {
      title: "جودة ممتازة وسهل الاستخدام",
      comment: "كمية صغيرة تكفي للمنطقة، لطيف وغير مزعج للبشرة الحساسة، والتوصيل كان مجانياً وممتازاً.",
      rating: 4,
    },
    {
      title: "ملمس ناعم وسريع الجفاف",
      comment: "لا يترك طبقة بيضاء إذا وزعته بطبطبة خفيفة، مناسب للاستخدام الصباحي قبل الخروج.",
      rating: 5,
    },
    {
      title: "تغليف أنيق وتوصيل سريع",
      comment: "وصلت العبوة مغلفة بإحكام والتوصيل كان خلال 48 ساعة في الخبر. منتج أصلي وخدمة ممتازة.",
      rating: 5,
    },
  ],
};

async function main() {
  const passwordHash = await bcrypt.hash("SahraaCustomer@2026", 10);

  // 1. Create or upsert users
  const createdUsers = [];
  for (const u of sampleUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { firstName: u.firstName, lastName: u.lastName },
      create: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        passwordHash,
        role: UserRole.CUSTOMER,
        emailVerified: true,
      },
    });
    createdUsers.push(user);
  }

  console.log(`Created/verified ${createdUsers.length} customer accounts.`);

  // 2. Fetch all products
  const products = await prisma.product.findMany();

  let reviewCountTotal = 0;

  for (const product of products) {
    const reviewsList = productReviewsData[product.slug] || [
      {
        title: "منتج ممتاز وتوصيل سريع",
        comment: "المنتج مطابق للوصف والصور تماماً، التوصيل كان سريعاً والدفع عند الاستلام مريح جداً وبدون أي مشاكل.",
        rating: 5,
      },
      {
        title: "جودة وتغليف فاخر",
        comment: "تغليف العبوة ممتاز وجودة الخامات راقية، شكراً لمتجر صحرا على المصداقية.",
        rating: 5,
      },
      {
        title: "تجربة تسوق موفقة",
        comment: "استلمت المنتج بحالة سليمة تماماً ومغلف بعناية، والدفع عند الاستلام ميزة تجعلك مطمئن.",
        rating: 5,
      },
      {
        title: "أنصح باقتنائه",
        comment: "سعر مناسب مع التوصيل المجاني وضمن عرض الباقات، تعامل محترم من خدمة العملاء.",
        rating: 5,
      },
    ];

    // Delete existing reviews for this product to avoid duplicates
    await prisma.review.deleteMany({
      where: { productId: product.id },
    });

    for (let i = 0; i < reviewsList.length; i++) {
      const rev = reviewsList[i];
      const reviewer = createdUsers[(i + product.slug.length) % createdUsers.length];

      // Give slightly staggered past dates (e.g. 2 to 28 days ago)
      const pastDays = (i + 1) * 3 + (product.slug.length % 5);
      const createdAt = new Date(Date.now() - pastDays * 24 * 60 * 60 * 1000);

      await prisma.review.create({
        data: {
          productId: product.id,
          userId: reviewer.id,
          rating: rev.rating,
          title: rev.title,
          comment: rev.comment,
          images: [],
          isVerified: true,
          createdAt,
        },
      });
      reviewCountTotal++;
    }

    // Update product rating and reviewCount
    const stats = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        rating: Number((stats._avg.rating || 5).toFixed(1)),
        reviewCount: stats._count,
      },
    });

    console.log(`Updated ${product.slug}: ${stats._count} reviews, rating: ${(stats._avg.rating || 5).toFixed(1)}`);
  }

  console.log(`Successfully seeded ${reviewCountTotal} verified customer reviews across ALL ${products.length} products.`);
}

main().finally(() => prisma.$disconnect());
