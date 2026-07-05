import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding products...");

  const products = [
    { name: "Áo thun basic", price: 150000, stock: 50, image: null },
    { name: "Quần jean slim-fit", price: 350000, stock: 30, image: null },
    { name: "Giày sneaker trắng", price: 890000, stock: 15, image: null },
    { name: "Balo laptop 15 inch", price: 420000, stock: 20, image: null },
    { name: "Tai nghe bluetooth", price: 590000, stock: 25, image: null },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  console.log(`Seeded ${products.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
