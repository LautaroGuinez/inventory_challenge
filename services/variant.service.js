
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const { inventoryQueue } = require('../queues/inventory.queue');

exports.updateVariantStock = async (variantId, warehouseId, newQuantity) => {
  return await prisma.$transaction(async (tx) => {
    
    
    const currentStock = await tx.stock.findUnique({
      where: {
        variant_id_warehouse_id: { 
          variant_id: Number(variantId), 
          warehouse_id: Number(warehouseId) 
        }
      }
    });
    
    const prevQuantity = currentStock ? currentStock.quantity : 0;

    
    const stockEntry = await tx.stock.upsert({
      where: {
        variant_id_warehouse_id: { 
          variant_id: Number(variantId), 
          warehouse_id: Number(warehouseId) 
        }
      },
      update: { quantity: Number(newQuantity) },
      create: {
        variant_id: Number(variantId),
        warehouse_id: Number(warehouseId),
        quantity: Number(newQuantity),
      },
    });

    const aggregate = await tx.stock.aggregate({
      where: { variant_id: Number(variantId) },
      _sum: { quantity: true },
    });

    const totalStock = aggregate._sum.quantity || 0;

    await tx.inventoryLog.create({
      data: {
        variant_id: Number(variantId),
        warehouse_id: Number(warehouseId),
        action_id: 1, 
        prev_quantity: prevQuantity,
        new_quantity: Number(newQuantity),
        total_after: totalStock,
      },
    });

    const linkedPubs = await tx.publicationVariant.findMany({
      where: { variant_id: Number(variantId) },
      include: { publication: true } 
    });

    for (const pubVar of linkedPubs) {
      await inventoryQueue.add(`sync-${pubVar.publication.mock_id}-${variantId}`, {
        publicationExternalId: pubVar.publication.mock_id, 
        externalVariantId: pubVar.external_variant_id,         
        stock: totalStock,
      });
    }

    return { stockEntry, totalStock, synced_channels: linkedPubs.length };
  });
};

exports.createVariant = async (data) => {
  const { productId, sku, title, color, size } = data;

  return await prisma.variant.create({
    data: {
      productId: Number(productId),
      sku,
      title,
      color,
      size,
    },
  });
};

exports.updateVariant = async (id, data) => {
  const { sku, title, color, size } = data;

  return await prisma.variant.update({
    where: { id: Number(id) },
    data: {
      sku,
      title,
      color,
      size,
    },
  });
};

exports.deleteVariant = async (id) => {
  return await prisma.variant.delete({
    where: { id: Number(id) },
  });
};

exports.getVariantById = async (id) => {
  return await prisma.variant.findUnique({
    where: { id: Number(id) },
    include: {
      stocks: true,
      product: true,      
      publication_variants: {
        include: {
          publication: {
            include: {
              status: true 
            }
          }
        }
      }
    }
  });
};

exports.getInventoryLogs = async (limit = 50) => {
  return await prisma.inventoryLog.findMany({
    take: Number(limit),
    orderBy: { created_at: 'desc' },
    include: {
      variant: { select: { sku: true, title: true } },
      warehouse: { select: { name: true } }
    }
  });
};