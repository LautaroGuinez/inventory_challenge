
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.createProduct = async (data) => {
  const { name, description, baseSku, basePrice, variants } = data;

  return await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name,
        description,
        baseSku,
        basePrice,
      },
    });

    if (variants && variants.length > 0) {
      await tx.variant.createMany({
        data: variants.map(v => ({
          sku: v.sku,
          title: v.title,
          color: v.color,
          size: v.size,
          productId: product.id
        }))
      });
    }

    return product;
  });
};

exports.getProducts = async () => {
  return prisma.product.findMany({
    include: { variants: true }
  });
};

exports.getProductById = async (id) => {
  return prisma.product.findUnique({
    where: { id: Number(id) },
    include: { variants: true }
  });
};