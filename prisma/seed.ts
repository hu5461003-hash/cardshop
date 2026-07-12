import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.order.deleteMany();
  await prisma.cardStock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.siteSettings.deleteMany();
  await prisma.admin.deleteMany();

  // Create Admin
  const admin = await prisma.admin.create({
    data: {
      username: "admin",
      // Default password: admin123 (bcrypt hashed)
      password: "$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu6GK",
    },
  });
  console.log("✅ Admin created:", admin.username);

  // Create Categories
  const telegram = await prisma.category.create({
    data: { name: "Telegram", slug: "telegram", description: "Verified Telegram accounts", sortOrder: 1 },
  });
  const twitter = await prisma.category.create({
    data: { name: "Twitter / X", slug: "twitter", description: "Aged Twitter accounts with followers", sortOrder: 2 },
  });
  const google = await prisma.category.create({
    data: { name: "Google / Gmail", slug: "google", description: "Google accounts with various ages", sortOrder: 3 },
  });
  const instagram = await prisma.category.create({
    data: { name: "Instagram", slug: "instagram", description: "Premium Instagram accounts", sortOrder: 4 },
  });
  const discord = await prisma.category.create({
    data: { name: "Discord", slug: "discord", description: "Discord accounts with nitro/age", sortOrder: 5 },
  });
  const tiktok = await prisma.category.create({
    data: { name: "TikTok", slug: "tiktok", description: "TikTok accounts with followers", sortOrder: 6 },
  });
  console.log("✅ 6 categories created");

  // Create Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Telegram Aged Account (2022)",
        description: "Aged Telegram account registered in 2022. Clean history, no bans.",
        price: 5.99,
        categoryId: telegram.id,
        stockType: "one_time",
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Telegram Premium Account",
        description: "Telegram account with active Premium subscription. Includes premium features.",
        price: 12.99,
        categoryId: twitter.id,
        stockType: "one_time",
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Twitter Aged Account (2021)",
        description: "Aged Twitter account from 2021 with organic followers. Email verified.",
        price: 8.49,
        categoryId: twitter.id,
        stockType: "one_time",
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Twitter High-Follower Account",
        description: "Twitter account with 5K+ real followers. Aged 2+ years.",
        price: 24.99,
        categoryId: twitter.id,
        stockType: "one_time",
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Google Gmail Aged Account",
        description: "Aged Google account with Gmail. Created 2022, clean record.",
        price: 3.99,
        categoryId: google.id,
        stockType: "one_time",
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Instagram Aged Account (2021)",
        description: "Aged Instagram account from 2021. Real posts, clean history.",
        price: 6.99,
        categoryId: instagram.id,
        stockType: "one_time",
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Discord Nitro Account",
        description: "Discord account with active Nitro subscription. 3 months remaining.",
        price: 9.99,
        categoryId: discord.id,
        stockType: "one_time",
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "TikTok Aged Account",
        description: "Aged TikTok account with 1K+ followers. Clean history.",
        price: 7.49,
        categoryId: tiktok.id,
        stockType: "one_time",
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: "Telegram Fresh Account",
        description: "Newly registered Telegram account. Phone verified.",
        price: 1.99,
        categoryId: telegram.id,
        stockType: "one_time",
        isActive: true,
      },
    }),
  ]);
  console.log("✅ 9 products created");

  // Create mock card stock for each product
  for (const product of products) {
    const stockCount = Math.floor(Math.random() * 20) + 5;
    await Promise.all(
      Array.from({ length: stockCount }, (_, i) =>
        prisma.cardStock.create({
          data: {
            productId: product.id,
            encryptedContent: `MOCK_ENCRYPTED_${product.name.replace(/\s+/g, "_")}_${i + 1}`,
            isSold: i < 2, // first 2 are "sold"
          },
        })
      )
    );
  }
  console.log("✅ Card stock created for all products");

  // Create mock orders
  const statuses = ["paid", "delivered", "delivered", "pending", "failed"];
  const emails = ["customer1@gmail.com", "buyer2@outlook.com", "user3@yahoo.com", "test4@proton.me", "demo5@gmail.com"];
  for (let i = 0; i < 5; i++) {
    const product = products[i];
    await prisma.order.create({
      data: {
        orderNo: `ORD-${String(10000 + i).padStart(6, "0")}`,
        email: emails[i],
        productId: product.id,
        quantity: 1,
        unitPrice: product.price,
        totalAmount: product.price,
        paymentMethod: i % 2 === 0 ? "stripe" : "crypto",
        status: statuses[i],
        cardContent: statuses[i] === "delivered" ? `Email: mock${i}@gmail.com\nPassword: MockPass${i}!` : null,
        txId: `tx_mock_${Date.now()}_${i}`,
      },
    });
  }
  console.log("✅ 5 mock orders created");

  // Create site settings
  await prisma.siteSettings.create({
    data: {
      siteName: "CardShop",
      siteDescription: "Premium digital accounts marketplace",
      seoMeta: "buy accounts, telegram accounts, twitter accounts, digital marketplace",
      announcement: "🎉 Welcome! All accounts are verified and delivered instantly.",
      supportLink: "https://t.me/cardshop_support",
    },
  });
  console.log("✅ Site settings created");

  console.log("\n🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
