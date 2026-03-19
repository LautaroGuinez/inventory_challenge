
const warehouseService = require('../services/warehouse.service');

exports.create = async (req, res) => {
  try {
    const { code, name } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Los campos code y name son obligatorios' });
    }
    const warehouse = await warehouseService.createWarehouse(req.body);
    res.status(201).json({ status: 'success', data: warehouse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAll = async (req, res) => {
  const data = await warehouseService.getWarehouses();
  res.json(data);
};

exports.getById = async (req, res) => {
  try {
    const data = await warehouseService.getWarehouseById(req.params.id);
    if (!data) {
      return res.status(404).json({ status: 'error', message: 'Depósito no encontrado' });
    }
    res.json({ status: 'success', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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