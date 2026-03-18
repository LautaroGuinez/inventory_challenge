const express = require('express');
const router = express.Router();
const variantController = require('../controllers/variant.controller');

router.post('/', variantController.create);
router.put('/:id', variantController.update);
router.delete('/:id', variantController.remove);
router.get('/:id', variantController.getById);
router.get('/logs', variantController.getLogs);

router.put('/:id/stock', variantController.updateStock);

module.exports = router;