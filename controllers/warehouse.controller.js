
const warehouseService = require('../services/warehouse.service');

exports.create = async (req, res) => {
  try {
    const warehouse = await warehouseService.createWarehouse(req.body);
    res.json(warehouse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAll = async (req, res) => {
  const data = await warehouseService.getWarehouses();
  res.json(data);
};

exports.getById = async (req, res) => {
  const data = await warehouseService.getWarehouseById(req.params.id);
  res.json(data);
};

exports.update = async (req, res) => {
  try {
    const data = await warehouseService.updateWarehouse(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    await warehouseService.deleteWarehouse(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};