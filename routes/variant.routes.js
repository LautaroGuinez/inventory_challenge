const express = require('express');
const router = express.Router();
const variantController = require('../controllers/variant.controller');

router.get('/logs', variantController.getLogs);
router.post('/', variantController.create);
router.put('/stock/batch', variantController.batchUpdateStock);
router.put('/:id/stock', variantController.updateStock);
router.put('/:id', variantController.update);
router.delete('/:id', variantController.remove);
router.get('/:id', variantController.getById);

module.exports = router;