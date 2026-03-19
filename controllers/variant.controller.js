const variantService = require('../services/variant.service');

exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params; 
    const { warehouse_id, quantity } = req.body;

   
    if (!warehouse_id || quantity === undefined) {
      return res.status(400).json({ 
        error: 'Datos incompletos', 
        message: 'warehouse_id y quantity son requeridos.' 
      });
    }

    if (isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ 
        error: 'Valor inválido', 
        message: 'La cantidad debe ser un número positivo.' 
      });
    }

    
    const result = await variantService.updateVariantStock(
      Number(id),
      Number(warehouse_id),
      Number(quantity)
    );

    
    return res.status(200).json({
      status: 'success',
      message: 'Stock actualizado y sincronización encolada correctamente.',
      data: result
    });

  } catch (error) {
    console.error('[VariantController Error]:', error.message);
    
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Recurso no encontrado', message: 'La variante o el depósito no existen.' });
    }

    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: 'Ocurrió un error al procesar la solicitud de stock.' 
    });
  }
};

exports.create = async (req, res) => {
  try {
    const { product_id, sku } = req.body;
    if (!product_id || !sku) {
      return res.status(400).json({ error: 'Los campos product_id y sku son obligatorios' });
    }
    const variant = await variantService.createVariant(req.body);
    res.status(201).json({ status: 'success', data: variant });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear la variante', message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const variant = await variantService.updateVariant(req.params.id, req.body);
    res.status(200).json({ status: 'success', data: variant });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la variante', message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await variantService.deleteVariant(req.params.id);
    res.status(204).send(); 
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la variante', message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const variant = await variantService.getVariantById(req.params.id);
    if (!variant) {
      return res.status(404).json({ status: 'error', message: 'Variante no encontrada' });
    }
    res.status(200).json({ status: 'success', data: variant });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const logs = await variantService.getInventoryLogs(limit);
    res.status(200).json({ status: 'success', data: logs });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.batchUpdateStock = async (req, res) => {
  try {
    const items = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de items no vacío' });
    }

    for (const item of items) {
      if (!item.variant_id || !item.warehouse_id || item.quantity === undefined) {
        return res.status(400).json({ error: 'Cada item requiere variant_id, warehouse_id y quantity' });
      }
      if (isNaN(item.quantity) || Number(item.quantity) < 0) {
        return res.status(400).json({ error: 'quantity debe ser un número no negativo' });
      }
    }

    const result = await variantService.batchUpdateStock(items);
    return res.status(200).json({
      status: 'success',
      message: `${result.processed} items procesados, ${result.queued_sync_jobs} jobs de sincronización encolados.`,
      data: result
    });
  } catch (error) {
    console.error('[BatchController Error]:', error.message);
    return res.status(500).json({ error: 'Error en batch update', message: error.message });
  }
};