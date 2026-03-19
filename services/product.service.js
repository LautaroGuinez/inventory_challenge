
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

exports.createProduct = async (data) => {
  const { name, description, base_sku, base_price, variants } = data;

  return await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name,
        description,
        base_sku,
        base_price,
      },
    });

    if (variants && variants.length > 0) {
      await tx.variant.createMany({
        data: variants.map(v => ({
          sku: v.sku,
          title: v.title,
          color: v.color,
          size: v.size,
          product_id: product.id
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

exports.updateProduct = async (id, data) => {
  const { name, description, base_sku, base_price } = data;
  return prisma.product.update({
    where: { id: Number(id) },
    data: { name, description, base_sku, base_price },
    include: { variants: true }
  });
};

exports.deleteProduct = async (id) => {
  return prisma.product.delete({
    where: { id: Number(id) }
  });
};