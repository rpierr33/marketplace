import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Home & Garden",
  "Sports",
  "Books",
  "Toys",
  "Health & Beauty",
  "Art & Crafts",
];

const PRODUCTS = [
  {
    title: "Wireless Noise-Cancelling Headphones Pro",
    description: "Premium over-ear headphones with active noise cancellation, 40-hour battery life, and Hi-Res Audio support. Features adaptive sound control and speak-to-chat technology.",
    price: 249.99,
    category: "Electronics",
    stock: 45,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
  },
  {
    title: "Vintage Leather Messenger Bag",
    description: "Handcrafted genuine leather messenger bag with brass hardware. Features multiple compartments, padded laptop sleeve, and adjustable shoulder strap. Perfect for work or travel.",
    price: 129.99,
    category: "Clothing",
    stock: 22,
    imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop",
  },
  {
    title: "Smart Home Security Camera 4K",
    description: "Ultra HD 4K security camera with night vision, two-way audio, motion detection, and cloud storage. Works with Alexa and Google Home.",
    price: 89.99,
    category: "Electronics",
    stock: 78,
    imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&h=600&fit=crop",
  },
  {
    title: "Organic Cotton Throw Blanket",
    description: "Ultra-soft 100% organic cotton throw blanket, perfect for cozy evenings. Machine washable, hypoallergenic, and sustainably sourced. Available in multiple earth tones.",
    price: 59.99,
    category: "Home & Garden",
    stock: 150,
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop",
  },
  {
    title: "Professional Yoga Mat - Extra Thick",
    description: "6mm thick eco-friendly yoga mat with alignment lines. Non-slip surface, moisture-resistant, and comes with carrying strap. Perfect for home or studio practice.",
    price: 44.99,
    category: "Sports",
    stock: 200,
    imageUrl: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&h=600&fit=crop",
  },
  {
    title: "Mechanical Keyboard - Cherry MX Blue",
    description: "Full-size mechanical keyboard with Cherry MX Blue switches, per-key RGB backlighting, aluminum frame, and detachable USB-C cable. N-key rollover.",
    price: 149.99,
    category: "Electronics",
    stock: 33,
    imageUrl: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=600&h=600&fit=crop",
  },
  {
    title: "Handmade Ceramic Mug Set (4 Pack)",
    description: "Set of 4 artisan-crafted ceramic mugs, each uniquely glazed. Microwave and dishwasher safe. 12oz capacity. Perfect housewarming gift.",
    price: 39.99,
    category: "Home & Garden",
    stock: 85,
    imageUrl: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&h=600&fit=crop",
  },
  {
    title: "Running Shoes - Ultralight Carbon",
    description: "Competition-grade running shoes with carbon fiber plate, responsive foam midsole, and breathable knit upper. Engineered for speed and comfort.",
    price: 179.99,
    category: "Sports",
    stock: 60,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop",
  },
  {
    title: "Bestselling Fiction Box Set (5 Books)",
    description: "Curated collection of 5 award-winning fiction novels from the past decade. Includes exclusive author interviews and reading guides. Beautifully boxed.",
    price: 54.99,
    category: "Books",
    stock: 120,
    imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop",
  },
  {
    title: "Wireless Charging Pad - Bamboo",
    description: "Eco-friendly bamboo wireless charging pad with 15W fast charging. Compatible with all Qi-enabled devices. LED indicator and anti-slip base.",
    price: 29.99,
    category: "Electronics",
    stock: 300,
    imageUrl: "https://images.unsplash.com/photo-1622782914767-404fb9ab3f57?w=600&h=600&fit=crop",
  },
  {
    title: "Premium Skincare Gift Set",
    description: "Luxury skincare set including cleanser, toner, serum, and moisturizer. Made with natural ingredients. Dermatologist tested. Suitable for all skin types.",
    price: 79.99,
    category: "Health & Beauty",
    stock: 95,
    imageUrl: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=600&fit=crop",
  },
  {
    title: "Watercolor Paint Set - Artist Grade",
    description: "Professional 48-color watercolor paint set with mixing palette, brushes, and water tank brush. Vibrant, lightfast pigments in a portable case.",
    price: 34.99,
    category: "Art & Crafts",
    stock: 140,
    imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=600&fit=crop",
  },
  {
    title: "Smart Watch Series X",
    description: "Advanced smartwatch with always-on AMOLED display, heart rate monitor, GPS, sleep tracking, and 7-day battery life. Water resistant to 50m.",
    price: 299.99,
    category: "Electronics",
    stock: 2,
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop",
  },
  {
    title: "Cast Iron Skillet - Pre-Seasoned 12\"",
    description: "Heavy-duty pre-seasoned cast iron skillet. Superior heat retention and distribution. Oven safe to 500°F. Built to last generations.",
    price: 42.99,
    category: "Home & Garden",
    stock: 70,
    imageUrl: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop",
  },
  {
    title: "Denim Jacket - Classic Fit",
    description: "Timeless denim jacket in medium wash. 100% cotton denim, button closure, chest pockets, and adjustable waist tabs. A wardrobe essential.",
    price: 89.99,
    category: "Clothing",
    stock: 55,
    imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&h=600&fit=crop",
  },
  {
    title: "Bluetooth Portable Speaker",
    description: "360° sound portable speaker with deep bass. 24-hour battery, IP67 waterproof, dustproof. Built-in microphone for calls. Links up to 100 speakers.",
    price: 69.99,
    category: "Electronics",
    stock: 180,
    imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop",
  },
  {
    title: "Wooden Building Blocks Set - 100pc",
    description: "Classic wooden building blocks in vibrant colors. Made from sustainably sourced hardwood. Non-toxic paint. Great for ages 3+. Includes storage bag.",
    price: 24.99,
    category: "Toys",
    stock: 250,
    imageUrl: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&h=600&fit=crop",
  },
  {
    title: "Resistance Bands Set - 5 Levels",
    description: "Complete resistance band set with 5 different tension levels. Includes door anchor, handles, ankle straps, and carry bag. Perfect for home workouts.",
    price: 19.99,
    category: "Sports",
    stock: 400,
    imageUrl: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&h=600&fit=crop",
  },
  {
    title: "Essential Oil Diffuser - Wood Grain",
    description: "Ultrasonic aromatherapy diffuser with wood grain finish. 300ml capacity, 7 LED color options, auto shut-off, and whisper-quiet operation.",
    price: 32.99,
    category: "Health & Beauty",
    stock: 110,
    imageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=600&fit=crop",
  },
  {
    title: "Canvas Tote Bag - Minimalist",
    description: "Heavyweight canvas tote with interior pocket and magnetic closure. Reinforced handles. Screen-printed minimalist design. Machine washable.",
    price: 22.99,
    category: "Clothing",
    stock: 190,
    imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&h=600&fit=crop",
  },
];

const SELLERS = [
  { storeName: "TechVault", storeDescription: "Premium tech gadgets and accessories at competitive prices. Authorized dealer for major brands.", verified: true },
  { storeName: "Urban Style Co", storeDescription: "Curated fashion and lifestyle products for the modern individual. Quality meets affordability.", verified: true },
  { storeName: "HomeNest", storeDescription: "Beautiful home essentials handpicked for comfort and style. Making houses feel like homes.", verified: false },
  { storeName: "ActiveLife Gear", storeDescription: "Sports equipment and fitness gear for athletes of all levels. Get moving, stay active.", verified: true },
  { storeName: "The Book Nook", storeDescription: "Carefully curated book collections for every reader. From bestsellers to hidden gems.", verified: false },
];

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@marketplace.com" },
    update: {},
    create: {
      email: "admin@marketplace.com",
      name: "Admin User",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  });
  console.log("  Created admin:", admin.email);

  // Create buyer user
  const buyerHash = await bcrypt.hash("buyer123", 10);
  const buyer = await prisma.user.upsert({
    where: { email: "buyer@marketplace.com" },
    update: {},
    create: {
      email: "buyer@marketplace.com",
      name: "Jane Buyer",
      passwordHash: buyerHash,
      role: "BUYER",
    },
  });
  console.log("  Created buyer:", buyer.email);

  // Create sellers
  const sellerUsers = [];
  for (let i = 0; i < SELLERS.length; i++) {
    const s = SELLERS[i];
    const hash = await bcrypt.hash("seller123", 10);
    const user = await prisma.user.upsert({
      where: { email: `seller${i + 1}@marketplace.com` },
      update: {},
      create: {
        email: `seller${i + 1}@marketplace.com`,
        name: s.storeName + " Owner",
        passwordHash: hash,
        role: "SELLER",
      },
    });

    const seller = await prisma.seller.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        storeName: s.storeName,
        storeDescription: s.storeDescription,
        isVerified: s.verified,
        isOnboarded: true,
      },
    });

    sellerUsers.push({ user, seller });
    console.log(`  Created seller: ${s.storeName} (${user.email})`);
  }

  // Create products distributed across sellers
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    const sellerIndex = i % sellerUsers.length;
    const { seller } = sellerUsers[sellerIndex];

    await prisma.product.upsert({
      where: { id: `seed-product-${i + 1}` },
      update: {},
      create: {
        id: `seed-product-${i + 1}`,
        sellerId: seller.id,
        title: p.title,
        description: p.description,
        price: p.price,
        category: p.category,
        stock: p.stock,
        imageUrl: p.imageUrl,
        isActive: true,
      },
    });
    console.log(`  Created product: ${p.title}`);
  }

  // Create some reviews
  const products = await prisma.product.findMany({ take: 10 });
  for (const product of products) {
    const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5
    await prisma.review.upsert({
      where: { userId_productId: { userId: buyer.id, productId: product.id } },
      update: {},
      create: {
        userId: buyer.id,
        productId: product.id,
        rating,
        comment: rating === 5 ? "Excellent product! Highly recommended." : "Great quality, very happy with my purchase.",
      },
    });
  }
  console.log("  Created reviews");

  console.log("\n✅ Seed complete!\n");
  console.log("Login credentials:");
  console.log("  Admin:  admin@marketplace.com / admin123");
  console.log("  Buyer:  buyer@marketplace.com / buyer123");
  console.log("  Seller: seller1@marketplace.com / seller123");
  console.log("         seller2@marketplace.com / seller123");
  console.log("         (sellers 1-5 available)\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
