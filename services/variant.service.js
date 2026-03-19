
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const { inventoryQueue } = require('../queues/inventory.queue');

exports.updateVariantStock = async (variantId, warehouseId, newQuantity) => {
  return await prisma.$transaction(async (tx) => {
    
    await tx.$queryRaw`SELECT id FROM \`Variant\` WHERE id = ${Number(variantId)} FOR UPDATE`;

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
  const { product_id, sku, title, color, size } = data;

  return await prisma.variant.create({
    data: {
      product_id: Number(product_id),
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

const BATCH_CHUNK_SIZE = 50;

exports.batchUpdateStock = async (items) => {
  
  const seen = new Map();
  for (const item of items) {
    seen.set(`${item.variant_id}_${item.warehouse_id}`, item);
  }

  
  const uniqueItems = Array.from(seen.values())
    .sort((a, b) => Number(a.variant_id) - Number(b.variant_id));

  const allJobData = [];


  for (let i = 0; i < uniqueItems.length; i += BATCH_CHUNK_SIZE) {
    const chunk = uniqueItems.slice(i, i + BATCH_CHUNK_SIZE);

    const chunkJobs = await prisma.$transaction(async (tx) => {
      const jobs = [];

      for (const item of chunk) {
        const vId = Number(item.variant_id);
        const wId = Number(item.warehouse_id);
        const qty = Number(item.quantity);

        
        await tx.$queryRaw`SELECT id FROM \`Variant\` WHERE id = ${vId} FOR UPDATE`;

        const currentStock = await tx.stock.findUnique({
          where: { variant_id_warehouse_id: { variant_id: vId, warehouse_id: wId } }
        });
        const prevQuantity = currentStock ? currentStock.quantity : 0;

        await tx.stock.upsert({
          where: { variant_id_warehouse_id: { variant_id: vId, warehouse_id: wId } },
          update: { quantity: qty },
          create: { variant_id: vId, warehouse_id: wId, quantity: qty }
        });

        const aggregate = await tx.stock.aggregate({
          where: { variant_id: vId },
          _sum: { quantity: true }
        });
        const totalStock = aggregate._sum.quantity || 0;

        await tx.inventoryLog.create({
          data: {
            variant_id: vId,
            warehouse_id: wId,
            action_id: 1,
            prev_quantity: prevQuantity,
            new_quantity: qty,
            total_after: totalStock
          }
        });

        const linkedPubs = await tx.publicationVariant.findMany({
          where: { variant_id: vId },
          include: { publication: true }
        });

        for (const pubVar of linkedPubs) {
          jobs.push({
            name: `sync-${pubVar.publication.mock_id}-${vId}`,
            data: {
              publicationExternalId: pubVar.publication.mock_id,
              externalVariantId: pubVar.external_variant_id,
              stock: totalStock
            }
          });
        }
      }

      return jobs;
    });

    allJobData.push(...chunkJobs);
  }

  const jobMap = new Map();
  for (const job of allJobData) {
    jobMap.set(job.name, job);
  }
  const uniqueJobs = Array.from(jobMap.values());

 
  if (uniqueJobs.length > 0) {
    await inventoryQueue.addBulk(uniqueJobs);
  }

  return {
    processed: uniqueItems.length,
    queued_sync_jobs: uniqueJobs.length
  };
};