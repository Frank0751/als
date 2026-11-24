/**
 * Seed script — ALS Online Store & Training Platform
 * Aquatic Link Solutions (ALS), Akuse, Eastern Region, Ghana
 * Run: bun scripts/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes, scryptSync } from "crypto";

const db = new PrismaClient();

function hashSecret(secret: string): string {
  const salt = randomBytes(8).toString("hex");
  const hash = scryptSync(secret, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Next `count` occurrences of day-of-week (0=Sun..6=Sat), starting tomorrow. */
function nextDows(dow: number, count: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (out.length < count) {
    if (d.getDay() === dow) out.push(isoDate(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoDate(d);
}

function dayShift(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(10, 30, 0, 0);
  return d;
}

async function main() {
  console.log("Seeding ALS platform…");

  // ---------- clean slate ----------
  await db.emailLog.deleteMany();
  await db.auditLog.deleteMany();
  await db.proofFile.deleteMany();
  await db.orderEvent.deleteMany();
  await db.order.deleteMany();
  await db.booking.deleteMany();
  await db.trainingSession.deleteMany();
  await db.trainingCourse.deleteMany();
  await db.notifyRequest.deleteMany();
  await db.quoteRequest.deleteMany();
  await db.contactMessage.deleteMany();
  await db.review.deleteMany();
  await db.product.deleteMany();
  await db.collectionDate.deleteMany();
  await db.deliveryArea.deleteMany();
  await db.customer.deleteMany();
  await db.staff.deleteMany();
  await db.siteContent.deleteMany();

  // ---------- fingerlings (ALS primary business) ----------
  const fingerlings = [
    {
      name: "Tilapia fingerlings — nursery (2–4 g)",
      category: "Nursery size",
      price: 0.85,
      tiers: [
        { minQty: 1000, price: 0.8, label: "1,000+" },
        { minQty: 5000, price: 0.75, label: "5,000+" },
        { minQty: 10000, price: 0.7, label: "10,000+" },
      ],
      stock: 60000,
      featured: false,
      spec: "Mean weight 2–4 g — young fish raised past the fry stage, ready to stock into nursery ponds, hapas or tanks. Sold in oxygen-bagged lots of 1,000. Graded to reduce size variation and cannibalism.",
    },
    {
      name: "Tilapia fingerlings — 5–8 g",
      category: "Standard size",
      price: 1.2,
      tiers: [
        { minQty: 1000, price: 1.1, label: "1,000+" },
        { minQty: 5000, price: 1.05, label: "5,000+" },
        { minQty: 10000, price: 0.98, label: "10,000+" },
      ],
      stock: 45000,
      featured: true,
      spec: "Mean weight 5–8 g. Our most-ordered size for pond and cage stocking. Strong swim-up feeding response, graded twice. Sold in oxygen-bagged lots of 1,000.",
    },
    {
      name: "Tilapia fingerlings — 10–15 g",
      category: "Advanced size",
      price: 1.8,
      tiers: [
        { minQty: 1000, price: 1.7, label: "1,000+" },
        { minQty: 5000, price: 1.62, label: "5,000+" },
        { minQty: 10000, price: 1.55, label: "10,000+" },
      ],
      stock: 28000,
      featured: true,
      spec: "Mean weight 10–15 g. Hardier fish with a head start on growth — fewer early losses for new farmers. Ideal for cage systems on the Volta River. Sold in oxygen-bagged lots of 1,000.",
    },
    {
      name: "Tilapia juveniles — 20–30 g",
      category: "Advanced size",
      price: 2.6,
      tiers: [
        { minQty: 500, price: 2.5, label: "500+" },
        { minQty: 2000, price: 2.4, label: "2,000+" },
      ],
      stock: 12000,
      featured: false,
      spec: "Mean weight 20–30 g juveniles. Best survival for farmers who want to skip the nursery stage. Limited batches — check the stock count and collection dates.",
    },
    {
      name: "Tilapia broodstock — selected pairs",
      category: "Broodstock",
      price: 55,
      unit: "pair",
      tiers: [
        { minQty: 10, price: 52, label: "10 pairs+" },
        { minQty: 50, price: 48, label: "50 pairs+" },
      ],
      stock: 140,
      featured: false,
      spec: "Mature selected breeders (females 150–250 g, males 200–300 g) from our hatchery lines at Akuse. Sexed pairs for hatchery start-ups and breed improvement.",
    },
  ];

  // ---------- marketplace ----------
  const market = [
    {
      name: "Seine net — 30 m × 3 m, lead line",
      category: "Nets & cages",
      price: 850,
      unit: "each",
      stock: 12,
      image: "/images/p-seine-net.png",
      featured: true,
      description:
        "Full-size harvesting seine net with floats and lead line. Knotted nylon mesh, 25 mm. The net we use on our own ponds — sized for concrete and earthen ponds up to 40 m wide.",
    },
    {
      name: "Hand net — fine mesh, 40 cm",
      category: "Nets & cages",
      price: 65,
      unit: "each",
      stock: 40,
      image: "/images/p-hand-net.png",
      featured: true,
      description:
        "Gentle fine-mesh hand net for scooping fingerlings and fry without damaging fins. 40 cm frame, 1.2 m handle. Every new farmer should have two.",
    },
    {
      name: "Hapa net — 2 m × 2 m × 1 m, fine mesh",
      category: "Nets & cages",
      price: 180,
      unit: "each",
      stock: 35,
      image: "/images/p-hapa.png",
      featured: false,
      description:
        "Fine-mesh hapa for nursing fingerlings or holding broodstock. Rope-reinforced edges and tying loops. Fits pond, tank and cage setups.",
    },
    {
      name: "Cast net — 8 ft radius",
      category: "Harvesting",
      price: 320,
      unit: "each",
      stock: 18,
      image: "/images/p-cast-net.png",
      featured: false,
      description:
        "Weighted cast net for sampling and partial harvests. 8 ft radius, galvanised weights, throw line included.",
    },
    {
      name: "Fish crate — 50 L, vented, stackable",
      category: "Transport & packaging",
      price: 110,
      unit: "each",
      stock: 60,
      image: "/images/p-crates.png",
      featured: true,
      description:
        "Food-grade vented crate for carrying harvest and delivering live fish short distances. Stackable, easy to wash. Used with our oxygen-bag deliveries.",
    },
    {
      name: "Portable aerator pump — twin diffuser",
      category: "Water & aeration",
      price: 640,
      unit: "each",
      stock: 9,
      image: "/images/p-aerator.png",
      featured: true,
      description:
        "Battery/12V portable aeration pump with twin air stones and hose. Keeps fish alive during transport and power outages — essential for any farmer moving live fish.",
    },
    {
      name: "Water quality test kit — pH, ammonia, nitrite",
      category: "Water & aeration",
      price: 275,
      unit: "kit",
      stock: 22,
      image: "/images/p-test-kit.png",
      featured: false,
      description:
        "Field test kit with vials, reagents and colour cards for pH, ammonia and nitrite. Clear picture instructions — no lab needed. Check water weekly and before every stocking.",
    },
    {
      name: "Digital pond thermometer",
      category: "Water & aeration",
      price: 45,
      unit: "each",
      stock: 80,
      image: "/images/p-thermometer.png",
      featured: false,
      description:
        "Waterproof digital thermometer in a protective case. Tilapia grow best between 26–30 °C — know your water before you feed more.",
    },
    {
      name: "Automatic fish feeder — timer hopper",
      category: "Feed & accessories",
      price: 720,
      unit: "each",
      stock: 7,
      image: "/images/p-feeder.png",
      featured: true,
      description:
        "Timer-driven feeder with 12 kg hopper and clamp mount. Set feeding times and rations, cut feed waste and labour. Suits tanks, cages and small ponds.",
    },
    {
      name: "Floating tilapia feed, 4 mm — 20 kg sack",
      category: "Feed & accessories",
      price: 420,
      unit: "sack",
      stock: 150,
      image: "/images/p-feed.png",
      featured: false,
      description:
        "Floating grower pellets, 4 mm, 30% protein. The ration we recommend for grow-out from 10 g to market size. Store dry, use within 6 weeks of opening.",
    },
    {
      name: "Feed scoop — 2 L, graduated",
      category: "Feed & accessories",
      price: 35,
      unit: "each",
      stock: 100,
      image: null,
      featured: false,
      description:
        "Graduated 2 L scoop that makes feed rationing consistent. One scoop ≈ 0.9 kg of 4 mm pellets.",
    },
    {
      name: "Chest waders — olive, size L",
      category: "Pond safety",
      price: 340,
      unit: "pair",
      stock: 15,
      image: "/images/p-waders.png",
      featured: false,
      description:
        "Chest-high waders for pond and cage work. Reinforced knees and boot soles. Stay dry and safe when netting and grading.",
    },
    {
      name: "Rubber work gloves — pair",
      category: "Pond safety",
      price: 18,
      unit: "pair",
      stock: 200,
      image: null,
      featured: false,
      description:
        "Textured rubber gloves for handling fish and nets. Protects against spines, rope burns and infection. One pair lasts a season.",
    },
    {
      name: "Transport tank — 250 L with aerator port",
      category: "Transport & packaging",
      price: 1250,
      unit: "each",
      stock: 5,
      image: null,
      featured: false,
      description:
        "Rounded 250 L fibreglass transport tank with lid and aerator port. For farms moving live fish long distances. Fits a pickup flatbed.",
    },
  ];

  const productRows: { id: string; kind: string; name: string }[] = [];
  for (const f of fingerlings) {
    const row = await db.product.create({
      data: {
        kind: "FINGERLING",
        name: f.name,
        category: f.category,
        description:
          "Tilapia fingerlings from the ALS hatchery in Akuse — young fish raised beyond the fry stage and ready to stock into ponds and cage systems on the Volta River. Graded, hardy and sold with our care guide.",
        spec: f.spec,
        price: f.price,
        unit: f.unit ?? "fingerling",
        stock: f.stock,
        imageUrl: "/images/fingerlings.png",
        priceTiers: JSON.stringify(f.tiers),
        featured: f.featured,
      },
    });
    productRows.push({ id: row.id, kind: "FINGERLING", name: row.name });
  }
  for (const m of market) {
    const row = await db.product.create({
      data: {
        kind: "MARKET",
        name: m.name,
        category: m.category,
        description: m.description,
        price: m.price,
        unit: m.unit,
        stock: m.stock,
        imageUrl: m.image,
        featured: m.featured,
      },
    });
    productRows.push({ id: row.id, kind: "MARKET", name: row.name });
  }

  const byName = (n: string) => productRows.find((p) => p.name.startsWith(n))!.id;

  // ---------- reviews ----------
  const reviews = [
    { n: "Tilapia fingerlings — 5–8 g", name: "Akosua Mensah", location: "Koforidua", rating: 5, comment: "The fingerlings arrived strong and uniform. I stocked 3,000 in my ponds and survival was excellent. Abigail's team even called to check on us after a week." },
    { n: "Tilapia fingerlings — 5–8 g", name: "Yaw Boateng", location: "Akosombo", rating: 5, comment: "I have bought fingerlings four times now. Sizes are true to what they say, no mixed small fry. My cages on the Volta are doing well." },
    { n: "Tilapia fingerlings — 10–15 g", name: "Adjoa Owusu", location: "Tema", rating: 5, comment: "Bought the bigger size for my first cycle and I lost very few fish. The care guide that came with the order helped me a lot as a beginner." },
    { n: "Tilapia juveniles — 20–30 g", name: "Kwame Asare", location: "Kumasi", rating: 4, comment: "Juveniles were healthy and well graded. Collection day was organised, in and out in 20 minutes." },
    { n: "Seine net — 30 m × 3 m, lead line", name: "Efua Sarpong", location: "Somanya", rating: 5, comment: "Strong net, proper floats and weights. It has pulled many harvests on our farm without a single tear." },
    { n: "Portable aerator pump — twin diffuser", name: "Kofi Darko", location: "Akuse", rating: 5, comment: "This pump saved my fish during a long power cut. Every cage farmer should keep one charged." },
    { n: "Floating tilapia feed, 4 mm — 20 kg sack", name: "Ama Antwi", location: "Akosombo", rating: 4, comment: "Good float, low dust. My fish grow steadily on it and the price is fair for the quality." },
    { n: "Water quality test kit — pH, ammonia, nitrite", name: "Grace Nyarko", location: "Ho", rating: 5, comment: "Simple to use even for me as a beginner. The picture cards helped me test my pond water myself." },
    { n: "Hand net — fine mesh, 40 cm", name: "Joseph Quaye", location: "Madina, Accra", rating: 5, comment: "Fine mesh does not hurt the fry. I ordered two and ALS delivered to Accra the same week." },
    { n: "Hapa net — 2 m × 2 m × 1 m, fine mesh", name: "Comfort Boadi", location: "Nsawam", rating: 4, comment: "Well sewn edges, strong rope. I nurse my fingerlings in these before moving them to the grow-out cages." },
  ];
  for (const r of reviews) {
    await db.review.create({
      data: {
        productId: byName(r.n),
        name: r.name,
        location: r.location,
        rating: r.rating,
        comment: r.comment,
        verified: true,
      },
    });
  }

  // ---------- collection dates (Fridays + Saturdays, next 4 weeks) ----------
  const openDates = [...nextDows(5, 4), ...nextDows(6, 4)].sort();
  const bookedMap: Record<number, number> = { 0: 6, 1: 2, 2: 9, 3: 4, 4: 0, 5: 3, 6: 7, 7: 1 };
  for (let i = 0; i < openDates.length; i++) {
    await db.collectionDate.create({
      data: { date: openDates[i], isOpen: true, capacity: 25, booked: bookedMap[i] ?? 0 },
    });
  }

  // ---------- delivery areas ----------
  const areas = [
    { name: "Akuse town", fee: 30 },
    { name: "Akosombo / Atimpoku", fee: 60 },
    { name: "Somanya / Odumase", fee: 80 },
    { name: "Koforidua", fee: 150 },
    { name: "Tema", fee: 200 },
    { name: "Accra", fee: 250 },
    { name: "Kumasi", fee: 450 },
  ];
  for (const a of areas) await db.deliveryArea.create({ data: a });

  // ---------- training ----------
  const courses = [
    {
      title: "On-Farm Practical Training",
      type: "ON_FARM",
      fee: 800,
      durationText: "3 days, on our farm in Akuse",
      description:
        "Three hands-on days at our hatchery and ponds in Akuse. You will hold the fish, test the water, feed, grade, and harvest with our team. Every participant leaves with a printed manual and a starter checklist.",
      image: "/images/training.png",
      covers: [
        "Pond and tank preparation before stocking",
        "Handling, stocking and acclimatising fingerlings",
        "Feeding rates and growth monitoring",
        "Water quality testing and correction",
        "Grading, harvesting and marketing",
      ],
      sessions: [
        { date: daysFromNow(12), timeText: "9:00 AM – 3:30 PM each day", location: "ALS Farm, Akuse", seats: 15, booked: 8 },
        { date: daysFromNow(26), timeText: "9:00 AM – 3:30 PM each day", location: "ALS Farm, Akuse", seats: 15, booked: 3 },
      ],
    },
    {
      title: "Fish Farming Starter Seminar",
      type: "SEMINAR",
      fee: 150,
      durationText: "1 day",
      description:
        "A one-day beginner seminar covering the economics and basics of tilapia farming in Ghana. Come with your questions — hundreds of new farmers started here, and about 7 in 10 of our trainees are women.",
      image: "/images/harvest.png",
      covers: [
        "The tilapia value chain in Ghana",
        "Ponds vs. cages on the Volta River — what suits you",
        "Start-up costs and a realistic budget",
        "Where to buy fingerlings and feed",
        "Common beginner mistakes and how to avoid them",
      ],
      sessions: [
        { date: daysFromNow(7), timeText: "10:00 AM – 3:00 PM", location: "ALS Training Centre, Akuse", seats: 30, booked: 21 },
        { date: daysFromNow(21), timeText: "10:00 AM – 3:00 PM", location: "ALS Training Centre, Akuse", seats: 30, booked: 6 },
      ],
    },
    {
      title: "Women in Aquaculture Workshop",
      type: "WORKSHOP",
      fee: 250,
      durationText: "2 days",
      description:
        "A practical workshop built around women-led fish farming — from small tank systems to group marketing. Women make up about 70% of ALS customers, and this workshop is led by experienced women farmers.",
      image: "/images/hero-women.png",
      covers: [
        "Starting small: tanks, hapas and backyard systems",
        "Feed budgeting that protects your profit",
        "Record keeping made simple",
        "Group marketing and bulk buying",
        "Access to fingerlings from the ALS hatchery",
      ],
      sessions: [
        { date: daysFromNow(17), timeText: "9:30 AM – 2:30 PM each day", location: "ALS Training Centre, Akuse", seats: 25, booked: 14 },
      ],
    },
    {
      title: "Live Online Course: Tilapia Hatchery Basics",
      type: "ONLINE",
      fee: 300,
      durationText: "4 live evening sessions (2 hrs each)",
      description:
        "Four live online evenings with our hatchery team, for farmers anywhere in Ghana and abroad. Joining link and materials arrive by email as soon as ALS confirms your payment.",
      image: null,
      covers: [
        "Broodstock selection and care",
        "Spawning, egg collection and incubation",
        "Larval and fry rearing",
        "Grading, packaging and selling fingerlings",
      ],
      sessions: [
        { date: daysFromNow(10), timeText: "6:30 PM – 8:30 PM (Mon–Thu)", location: "Live online — link sent by email", seats: 40, booked: 17 },
        { date: daysFromNow(31), timeText: "6:30 PM – 8:30 PM (Mon–Thu)", location: "Live online — link sent by email", seats: 40, booked: 2 },
      ],
    },
  ];

  const sessionIds: string[] = [];
  for (const c of courses) {
    const course = await db.trainingCourse.create({
      data: {
        title: c.title,
        type: c.type,
        fee: c.fee,
        durationText: c.durationText,
        description: c.description,
        covers: JSON.stringify(c.covers),
        imageUrl: c.image,
      },
    });
    for (const s of c.sessions) {
      const row = await db.trainingSession.create({
        data: {
          courseId: course.id,
          date: s.date,
          timeText: s.timeText,
          location: s.location,
          seats: s.seats,
          booked: s.booked,
        },
      });
      sessionIds.push(row.id);
    }
  }

  // ---------- staff ----------
  const staff = [
    { username: "abigail", name: "Abigail", role: "OWNER" },
    { username: "naa", name: "Naa Dedei Aryee", role: "MANAGER" },
    { username: "kojo", name: "Kojo Annan", role: "STAFF" },
  ];
  for (const s of staff) {
    await db.staff.create({
      data: { username: s.username, name: s.name, role: s.role, passwordHash: hashSecret("als2026") },
    });
  }

  // ---------- site content ----------
  const content: Record<string, string> = {
    "business.name": "Aquatic Link Solutions (ALS)",
    "business.tagline": "Quality tilapia fingerlings and sustainable fish farming — Akuse, Ghana",
    "home.hero_title": "Quality tilapia fingerlings, farm equipment and training — straight from our hatchery in Akuse",
    "home.hero_sub":
      "Browse live availability, build your order and send it to ALS on WhatsApp in one tap. Get a branded receipt, pay by MoMo or bank transfer, and track every order. No account needed to order.",
    "home.about_intro":
      "Aquatic Link Solutions is an aquaculture business specialising in tilapia farming in Ghana. Our primary specialisation is the production and sale of high-quality tilapia fingerlings — young fish raised beyond the fry stage and suitable for stocking in ponds and cage systems. We also run tilapia grow-out production, raising fish from fingerling to market size in cage systems on the Volta River.",
    "farm.story":
      "Aquatic Link Solutions has been in aquaculture for over 17 years. Our hatchery at Akuse, in the Eastern Region, produces and sells high-quality tilapia fingerlings to fish farmers across Ghana — young fish that have developed beyond the fry stage and are ready to stock into ponds and cage farming systems. Fish farmers raise them until they reach market size.\n\nAlongside the hatchery, ALS runs its own tilapia grow-out production, raising fish from fingerling stage to market size in cage systems on the Volta River. Every practice we teach is a practice we use ourselves.\n\nThrough these operations we aim to supply quality stocking materials, promote sustainable fish farming and contribute to the growth of Ghana's aquaculture industry. Demand for good-quality fingerlings keeps running ahead of reliable supply, and the national aquaculture plan names poor fingerling supply as a key constraint — that is the gap we work to close every week.",
    "farm.impact":
      "About 70% of our customers are women. Our training programme has taught hundreds of new farmers — from complete beginners at our starter seminars to women-led groups running their own tank systems. We host farm visits for schools and farmer groups, and we supply fingerlings to cage farms along the Volta River and to pond farmers across the Eastern, Volta, Greater Accra and Ashanti regions.",
    "faqs": JSON.stringify([
      { q: "How do I place an order?", a: "Add fingerlings, equipment or training to your cart, then tap \"Send order on WhatsApp\". The full order — items, sizes, quantities, prices, total and your collection or delivery date — is typed for you. One tap and it reaches ALS. Your order is saved the moment you send it, and you get an order number and tracking page." },
      { q: "What is the minimum order for fingerlings?", a: "There is no strict minimum, but fingerlings are sold in oxygen-bagged lots of 1,000 for the nursery and standard sizes, and in lots of 500 for juveniles. Smaller starter quantities can be arranged on request." },
      { q: "How do I pay?", a: "After sending your order, pay ALS directly by mobile money (MoMo) or bank transfer — the accounts are shown on your order page. Upload your payment proof there, and once ALS confirms it you receive a branded receipt with a code you can verify online. Buyers abroad can use our USD account." },
      { q: "When can I collect my fish?", a: "Live fish are handed over only on dates ALS opens for collection and delivery — you choose one of these dates when you order. This protects fish quality: nothing is sold before it is ready and strong enough to travel." },
      { q: "Do you deliver, and how far?", a: "Yes. ALS delivers to Akuse, Akosombo, Somanya, Koforidua, Tema, Accra and Kumasi, with delivery fees shown at checkout. Fingerlings travel in oxygen-bagged lots with aeration. For buyers outside Ghana, contact us for export arrangements." },
      { q: "What if some fingerlings die in transport?", a: "We pack in oxygen and grade carefully to cut travel losses, and every order comes with our care guide. Report any transport losses to ALS with photos within 24 hours of collection or delivery — we review each case against our refund policy." },
      { q: "How does training booking work?", a: "Pick a course, choose an open date from ALS's booking calendar and book online. Your receipt doubles as an admission slip with a code ALS checks at the gate. A date closes automatically when it is full. Online course participants receive their joining link and materials by email once payment is confirmed." },
      { q: "Do I need an account to order?", a: "No. You can order as a guest at any hour. An optional account keeps your order history, saved addresses and past receipts in one place, with one-tap reorder." },
      { q: "I'm outside Ghana. Can I order?", a: "Yes — ALS serves buyers beyond Ghana, with contacts in Norway and partners abroad. Order the same way and pay into our USD account; contact us to agree shipping for equipment." },
      { q: "How do I check a receipt is genuine?", a: "Every ALS receipt carries a code. Enter it on the Verify receipt page (find it in the menu) and the platform confirms whether the receipt is real, for which order and amount. That protects our customers from fake receipts." },
    ]),
    "policies.privacy":
      "Aquatic Link Solutions (ALS) collects only the information needed to serve your order: your name, phone number, email address, delivery address and order history.\n\nWe use your details to process orders, confirm payments, deliver fish and equipment, send order updates, and keep receipts you can download at any time. We do not sell your data to anyone.\n\nOrders sent on WhatsApp are also stored in our order system so nothing is lost in a chat. Payment proof you upload is seen only by authorised ALS staff.\n\nUnder Ghana's Data Protection Act, 2012 (Act 843), ALS is registered with the Data Protection Commission and handles your personal data in line with it. You may ask us at any time to correct or delete your customer record — contact us through the details on our Contact page.\n\nOur site uses only privacy-respecting analytics to count visits; it does not advertise to you or follow you around the internet.",
    "policies.terms":
      "These terms of sale apply to all orders placed with Aquatic Link Solutions (ALS) through this platform or on WhatsApp.\n\n1. Orders. An order is a request. It becomes binding when ALS confirms availability and you pay. Every order gets a number and appears on your tracking page.\n\n2. Prices. Prices are shown in Ghana cedis and are calculated by the platform, including quantity discounts and delivery fees by area. ALS may change prices from batch to batch; the price shown when you send your order applies to that order.\n\n3. Collection and delivery of live fish. Fingerlings and juveniles are handed over only on dates ALS opens. Delivery times are estimates; live animals are released to you on arrival in good condition, signed for by you or your agent.\n\n4. Payment. Payment is made directly to ALS by MoMo or bank transfer, or by USD transfer for buyers abroad. A branded receipt is issued once ALS confirms your payment. Keep your receipt — it is your proof of payment and, for training, your admission slip.\n\n5. Live fish care. From hand-over, the care of fish follows the care guide supplied with your order. Transport losses must be reported within 24 hours with photos.\n\n6. Equipment. Equipment items carry the manufacturer's warranty where one exists; faults are handled by replacement or repair through ALS.\n\n7. Training. Bookings are confirmed on payment. A booking may be moved to a later open date if requested at least 3 days before the session. If ALS cancels a session, you are moved free of charge or refunded in full.\n\n8. Refunds. See our refund policy.\n\n9. Governing law. These terms are governed by the laws of the Republic of Ghana.",
    "policies.refund":
      "ALS refund policy — including for live fish.\n\nLive fish (fingerlings, juveniles, broodstock):\n• Because they are living animals, live fish cannot be returned once they have been accepted in good condition at hand-over.\n• If fish arrive dead or in poor condition due to packing or transport, report to ALS within 24 hours with photos of the bags and fish. ALS will replace the affected lot on the next open date or refund the affected portion.\n• Losses reported after 24 hours, or caused by poor handling, stocking or water conditions after hand-over, are not covered.\n\nEquipment and accessories:\n• Unused items in original packaging may be returned within 7 days of collection or delivery for a refund, less delivery costs.\n• Faulty items are replaced or repaired under warranty at no cost to you.\n\nTraining:\n• If you cancel a booking at least 3 days before the session, you may move to any later open date or receive a full refund.\n• Cancellations inside 3 days can be moved to a later date but are not refunded.\n• If ALS cancels a session, you choose: move free of charge or full refund.\n\nHow refunds are paid: refunds go back to the same MoMo number, bank account or USD account you paid from, within 5 working days of approval. Every approved refund is confirmed to you in writing with a reference number.",
    "contact.whatsapp_1": "+233 20 111 2233",
    "contact.whatsapp_2": "+233 24 555 7788",
    "contact.whatsapp_orders": "+233 20 111 2233",
    "contact.email": "info@aquaticlinkgh.com",
    "contact.orders_email": "orders@aquaticlinkgh.com",
    "contact.phone": "+233 20 111 2233",
    "contact.location": "ALS Hatchery & Farm, Akuse, Eastern Region, Ghana",
    "contact.hours": "Monday – Saturday, 8:00 AM – 5:00 PM",
    "payment.momo": "Aquatic Link Solutions — MTN MoMo: 020 111 2233 — Account name: Aquatic Link Solutions",
    "payment.bank":
      "Aquatic Link Solutions Ltd — GCB Bank plc — Account number: 1111 2233 4455 66 — Branch: Akosombo",
    "payment.usd":
      "Aquatic Link Solutions Ltd — USD account — GCB Bank plc — Account number: 2222 5566 7788 99 — SWIFT: GHCBGHAC",
    "social.facebook": "https://facebook.com/aquaticlinkgh",
    "social.instagram": "https://instagram.com/aquaticlinkgh",
    "social.youtube": "",
  };
  for (const [key, value] of Object.entries(content)) {
    await db.siteContent.create({ data: { key, value } });
  }

  // ---------- demo orders ----------
  type Line = {
    kind: string;
    refId: string;
    name: string;
    variant: string;
    qty: number;
    unit: string;
    unitPrice: number;
    lineTotal: number;
  };
  const P = (n: string) => productRows.find((p) => p.name.startsWith(n))!;

  function mkLine(name: string, variant: string, qty: number, unitPrice: number, unit: string, kind: string): Line {
    const p = P(name);
    return {
      kind,
      refId: p.id,
      name: p.name,
      variant,
      qty,
      unit,
      unitPrice,
      lineTotal: Math.round(qty * unitPrice * 100) / 100,
    };
  }

  const demoOrders: {
    days: number;
    name: string;
    phone: string;
    email: string;
    city: string;
    fulfilment: "PICKUP" | "DELIVERY";
    area?: string;
    fee?: number;
    status: string;
    method?: string;
    items: Line[];
    notes?: string;
  }[] = [
    { days: -21, name: "Kwame Asare", phone: "024 555 1020", email: "kwame.asare@example.com", city: "Kumasi", fulfilment: "DELIVERY", area: "Kumasi", fee: 450, status: "COMPLETED", method: "MOMO", items: [mkLine("Tilapia fingerlings — 5–8 g", "5–8 g", 5000, 1.05, "fingerling", "FINGERLING")] },
    { days: -19, name: "Akosua Mensah", phone: "020 331 4477", email: "akosua.m@example.com", city: "Koforidua", fulfilment: "PICKUP", status: "COMPLETED", method: "MOMO", items: [mkLine("Tilapia fingerlings — 10–15 g", "10–15 g", 2000, 1.7, "fingerling", "FINGERLING"), mkLine("Hand net — fine mesh, 40 cm", "—", 2, 65, "each", "MARKET")] },
    { days: -17, name: "Yaw Boateng", phone: "055 224 8890", email: "yaw.boateng@example.com", city: "Akosombo", fulfilment: "DELIVERY", area: "Akosombo / Atimpoku", fee: 60, status: "COMPLETED", method: "BANK", items: [mkLine("Tilapia fingerlings — 5–8 g", "5–8 g", 10000, 0.98, "fingerling", "FINGERLING")] },
    { days: -15, name: "Adjoa Owusu", phone: "024 678 2231", email: "adjoa.owusu@example.com", city: "Tema", fulfilment: "DELIVERY", area: "Tema", fee: 200, status: "COMPLETED", method: "MOMO", items: [mkLine("Tilapia fingerlings — 10–15 g", "10–15 g", 1000, 1.7, "fingerling", "FINGERLING"), mkLine("Water quality test kit — pH, ammonia, nitrite", "kit", 1, 275, "kit", "MARKET")] },
    { days: -13, name: "Grace Nyarko", phone: "020 994 5501", email: "grace.nyarko@example.com", city: "Ho", fulfilment: "PICKUP", status: "COMPLETED", method: "MOMO", items: [mkLine("Floating tilapia feed, 4 mm — 20 kg sack", "4 mm", 4, 420, "sack", "MARKET"), mkLine("Digital pond thermometer", "—", 2, 45, "each", "MARKET")] },
    { days: -11, name: "Daniel Mensah", phone: "054 118 6633", email: "d.mensah@example.com", city: "Accra", fulfilment: "DELIVERY", area: "Accra", fee: 250, status: "COMPLETED", method: "USD", items: [mkLine("Seine net — 30 m × 3 m, lead line", "30 m", 1, 850, "each", "MARKET"), mkLine("Fish crate — 50 L, vented, stackable", "50 L", 6, 110, "each", "MARKET")] },
    { days: -10, name: "Efua Sarpong", phone: "024 445 9087", email: "efua.s@example.com", city: "Somanya", fulfilment: "PICKUP", status: "COMPLETED", method: "MOMO", items: [mkLine("Tilapia juveniles — 20–30 g", "20–30 g", 500, 2.5, "fingerling", "FINGERLING"), mkLine("Rubber work gloves — pair", "pair", 4, 18, "pair", "MARKET")] },
    { days: -8, name: "Kofi Darko", phone: "055 903 2114", email: "kofi.darko@example.com", city: "Akuse", fulfilment: "DELIVERY", area: "Akuse town", fee: 30, status: "COMPLETED", method: "MOMO", items: [mkLine("Portable aerator pump — twin diffuser", "twin", 1, 640, "each", "MARKET"), mkLine("Hapa net — 2 m × 2 m × 1 m, fine mesh", "2×2×1 m", 3, 180, "each", "MARKET")] },
    { days: -6, name: "Ama Antwi", phone: "020 776 4512", email: "ama.antwi@example.com", city: "Akosombo", fulfilment: "PICKUP", status: "READY_OUT", method: "MOMO", items: [mkLine("Tilapia fingerlings — 5–8 g", "5–8 g", 3000, 1.1, "fingerling", "FINGERLING")] },
    { days: -5, name: "Comfort Boadi", phone: "024 220 7845", email: "comfort.b@example.com", city: "Nsawam", fulfilment: "PICKUP", status: "PREPARING", method: "BANK", items: [mkLine("Tilapia fingerlings — nursery (2–4 g)", "2–4 g", 8000, 0.75, "fingerling", "FINGERLING"), mkLine("Hapa net — 2 m × 2 m × 1 m, fine mesh", "2×2×1 m", 2, 180, "each", "MARKET")] },
    { days: -3, name: "Peter Nkrumah", phone: "057 330 9912", email: "p.nkrumah@example.com", city: "Akosombo", fulfilment: "DELIVERY", area: "Akosombo / Atimpoku", fee: 60, status: "PAYMENT_CONFIRMED", method: "MOMO", items: [mkLine("Tilapia juveniles — 20–30 g", "20–30 g", 1000, 2.5, "fingerling", "FINGERLING")] },
    { days: -2, name: "Joseph Quaye", phone: "026 812 4470", email: "j.quaye@example.com", city: "Madina, Accra", fulfilment: "DELIVERY", area: "Accra", fee: 250, status: "RECEIVED", items: [mkLine("Hand net — fine mesh, 40 cm", "—", 3, 65, "each", "MARKET"), mkLine("Tilapia fingerlings — 5–8 g", "5–8 g", 2000, 1.1, "fingerling", "FINGERLING")] },
    { days: -1, name: "Mary Ofori", phone: "024 663 1178", email: "mary.ofori@example.com", city: "Koforidua", fulfilment: "PICKUP", status: "RECEIVED", items: [mkLine("Tilapia fingerlings — 10–15 g", "10–15 g", 3000, 1.7, "fingerling", "FINGERLING")] },
    { days: -12, name: "Samuel Adjei", phone: "055 009 8823", email: "s.adjei@example.com", city: "Tema", fulfilment: "DELIVERY", area: "Tema", fee: 200, status: "CANCELLED", notes: "Customer travel — will reorder next month.", items: [mkLine("Automatic fish feeder — timer hopper", "12 kg", 1, 720, "each", "MARKET")] },
  ];

  let seq = 1;
  const year = new Date().getFullYear();
  for (const o of demoOrders) {
    const subtotal = Math.round(o.items.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;
    const total = Math.round((subtotal + (o.fee ?? 0)) * 100) / 100;
    const orderNumber = `ALS-${year}-${String(seq).padStart(4, "0")}`;
    seq += 1;
    const createdAt = dayShift(o.days);
    const receiptCode = o.status === "COMPLETED" ? `ALS-${randomBytes(3).toString("hex").toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}` : null;
    const events: { status: string; note: string | null; actor: string | null; at: number }[] = [
      { status: "RECEIVED", note: "Order sent on WhatsApp and saved.", actor: null, at: 0 },
    ];
    if (["PAYMENT_CONFIRMED", "PREPARING", "READY_OUT", "COMPLETED"].includes(o.status))
      events.push({ status: "PAYMENT_CONFIRMED", note: `Payment confirmed (${o.method ?? "MOMO"}) against uploaded proof.`, actor: "Abigail", at: 2 });
    if (["PREPARING", "READY_OUT", "COMPLETED"].includes(o.status))
      events.push({ status: "PREPARING", note: "Being prepared for hand-over.", actor: "Naa Dedei Aryee", at: 4 });
    if (["READY_OUT", "COMPLETED"].includes(o.status))
      events.push({ status: o.fulfilment === "PICKUP" ? "READY_OUT" : "OUT_FOR_DELIVERY", note: o.fulfilment === "PICKUP" ? "Ready for pickup at the farm gate." : "Out for delivery.", actor: "Kojo Annan", at: 6 });
    if (o.status === "COMPLETED")
      events.push({ status: "COMPLETED", note: "Handed over and signed for. Thank you for farming with ALS.", actor: "Kojo Annan", at: 8 });
    if (o.status === "CANCELLED")
      events.push({ status: "CANCELLED", note: o.notes ?? "Cancelled.", actor: "Abigail", at: 3 });

    const order = await db.order.create({
      data: {
        orderNumber,
        customerName: o.name,
        customerPhone: o.phone,
        customerEmail: o.email,
        customerCity: o.city,
        fulfilment: o.fulfilment,
        areaName: o.area ?? null,
        areaFee: o.fee ?? 0,
        deliveryDate: openDates[(seq + 3) % openDates.length] ?? null,
        items: JSON.stringify(o.items),
        subtotal,
        total,
        status: o.status,
        paymentMethod: o.method ?? null,
        paymentRef: o.method ? `TR-${randomBytes(3).toString("hex").toUpperCase()}` : null,
        receiptCode,
        receiptIssuedAt: receiptCode ? dayShift(o.days + 2) : null,
        whatsappSent: true,
        notes: o.status === "CANCELLED" ? o.notes ?? null : null,
        createdAt,
        updatedAt: dayShift(o.days + 4),
        events: {
          create: events.map((e) => ({
            status: e.status,
            note: e.note,
            actor: e.actor,
            createdAt: dayShift(o.days + e.at),
          })),
        },
      },
    });
    if (receiptCode) {
      await db.emailLog.create({
        data: {
          toEmail: o.email,
          subject: `Receipt for order ${orderNumber} — Aquatic Link Solutions`,
          body: `Dear ${o.name},\n\nYour payment for order ${orderNumber} (GHS ${total.toFixed(2)}) has been confirmed. Your branded receipt is ready with verification code ${receiptCode}.\n\nTrack your order any time with your order number and phone number on our tracking page.\n\nThank you for farming with ALS.\nAquatic Link Solutions — Akuse, Eastern Region`,
          kind: "RECEIPT",
          createdAt: dayShift(o.days + 2),
        },
      });
    }
    await db.emailLog.create({
      data: {
        toEmail: o.email,
        subject: `Order ${orderNumber} received — Aquatic Link Solutions`,
        body: `Dear ${o.name},\n\nWe have your order ${orderNumber}. Send your payment proof on your order page and ALS will confirm it.\n\n— Aquatic Link Solutions, Akuse`,
        kind: "ORDER_STAGE",
        createdAt,
      },
    });
  }

  // ---------- demo bookings ----------
  const bookings = [
    { si: 1, name: "Adjoa Owusu", phone: "024 678 2231", email: "adjoa.owusu@example.com", seats: 2, status: "CONFIRMED" },
    { si: 0, name: "Joseph Quaye", phone: "026 812 4470", email: "j.quaye@example.com", seats: 1, status: "CONFIRMED" },
    { si: 0, name: "Mary Ofori", phone: "024 663 1178", email: "mary.ofori@example.com", seats: 1, status: "PENDING_PAYMENT" },
    { si: 2, name: "Grace Nyarko", phone: "020 994 5501", email: "grace.nyarko@example.com", seats: 2, status: "CONFIRMED" },
    { si: 2, name: "Akosua Mensah", phone: "020 331 4477", email: "akosua.m@example.com", seats: 3, status: "CONFIRMED" },
    { si: 3, name: "Yaw Boateng", phone: "055 224 8890", email: "yaw.boateng@example.com", seats: 1, status: "CONFIRMED" },
    { si: 4, name: "Ama Antwi", phone: "020 776 4512", email: "ama.antwi@example.com", seats: 1, status: "PENDING_PAYMENT" },
    { si: 5, name: "Daniel Mensah", phone: "054 118 6633", email: "d.mensah@example.com", seats: 2, status: "CONFIRMED" },
  ];
  let bseq = 1;
  for (const b of bookings) {
    const session = sessionIds[b.si];
    const s = await db.trainingSession.findUnique({ where: { id: session } });
    const course = s ? await db.trainingCourse.findUnique({ where: { id: s.courseId } }) : null;
    await db.booking.create({
      data: {
        reference: `ALS-T-${year}-${String(bseq).padStart(4, "0")}`,
        sessionId: session,
        customerName: b.name,
        phone: b.phone,
        email: b.email,
        seats: b.seats,
        total: (course?.fee ?? 0) * b.seats,
        status: b.status,
        createdAt: dayShift(-2 - bseq),
      },
    });
    bseq += 1;
  }

  // ---------- demand signals & inbox samples ----------
  await db.notifyRequest.create({
    data: { productId: P("Automatic fish feeder").id, name: "Efua Sarpong", phone: "024 445 9087", createdAt: dayShift(-4) },
  });
  await db.notifyRequest.create({
    data: { productId: P("Transport tank — 250 L").id, name: "Yaw Boateng", phone: "055 224 8890", createdAt: dayShift(-2) },
  });
  await db.quoteRequest.create({
    data: {
      name: "Stephen Tetteh",
      org: "Volta Fresh Cages Ltd",
      phone: "024 900 1122",
      email: "st@voltfresh.example.com",
      message: "We are stocking 4 new cages in November — looking at 40,000 fingerlings of the 10–15 g size, delivered to our site near Atimpoku. Please quote best price.",
      createdAt: dayShift(-3),
    },
  });
  await db.contactMessage.create({
    data: {
      name: "Linda Agyeman",
      email: "linda.a@example.com",
      phone: "020 118 7755",
      subject: "Farm visit for our women's group",
      message: "Hello, our women's farming cooperative (12 members) would like to visit the farm and possibly join the Women in Aquaculture Workshop. When is the next open date?",
      createdAt: dayShift(-1),
    },
  });

  // ---------- audit samples ----------
  await db.auditLog.create({
    data: { actor: "Abigail", action: "SEED", detail: "Platform seeded with catalogue, training calendar and demo data.", createdAt: dayShift(0) },
  });

  const counts = {
    products: await db.product.count(),
    fingerlings: await db.product.count({ where: { kind: "FINGERLING" } }),
    reviews: await db.review.count(),
    collectionDates: await db.collectionDate.count(),
    courses: await db.trainingCourse.count(),
    sessions: await db.trainingSession.count(),
    orders: await db.order.count(),
    bookings: await db.booking.count(),
    staff: await db.staff.count(),
    content: await db.siteContent.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
