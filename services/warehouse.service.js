

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
exports.createWarehouse = async (data) => {
  const { code, name } = data;

  return prisma.warehouse.create({
    data: { code, name }
  });
};

exports.getWarehouses = async () => {
  return prisma.warehouse.findMany();
};

exports.getWarehouseById = async (id) => {
  return prisma.warehouse.findUnique({
    where: { id: Number(id) }
  });
};

exports.updateWarehouse = async (id, data) => {
  return prisma.warehouse.update({
    where: { id: Number(id) },
    data
  });
};

exports.deleteWarehouse = async (id) => {
  return prisma.warehouse.delete({
    where: { id: Number(id) }
  });
};