const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { inventoryQueue } = require('../queues/inventory.queue');


exports.createPublication = async (data) => {
 
  const { mock_id, external_id, channel_name, status_id } = data;
  
  return await prisma.publication.create({
    data: {
      mock_id: mock_id, 
      external_id: external_id, 
      channel_name: channel_name,
      status_id: status_id ? Number(status_id) : 1, 
    }
  });
};

exports.linkVariantToPublication = async (data) => {
  const { publication_id, variant_id, external_variant_id } = data;

  return await prisma.$transaction(async (tx) => {
    const link = await tx.publicationVariant.create({
      data: {
        publication_id: Number(publication_id),
        variant_id: Number(variant_id),
        external_variant_id: external_variant_id,
      },
      include: { publication: true } 
    });

    const aggregate = await tx.stock.aggregate({
      where: { variant_id: Number(variant_id) },
      _sum: { quantity: true },
    });
    
    const totalStock = aggregate._sum.quantity || 0;

    
    await inventoryQueue.add(`sync-init-${variant_id}`, {
      publicationExternalId: link.publication.mock_id, 
      externalVariantId: external_variant_id,             
      stock: totalStock,
    });

    return { link, synced_stock: totalStock };
  });
};