const express = require('express');
const router = express.Router();
const publicationController = require('../controllers/publication.controller');

router.post('/', publicationController.create);
router.post('/link', publicationController.linkVariant);

module.exports = router;