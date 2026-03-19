const publicationService = require('../services/publication.service');

exports.create = async (req, res) => {
  try {

    if (!req.body.mock_id) {
      return res.status(400).json({ error: 'El campo mock_id es obligatorio' });
    }
    const pub = await publicationService.createPublication(req.body);
    res.status(201).json({ status: 'success', data: pub });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear publicación', message: error.message });
  }
};

exports.linkVariant = async (req, res) => {
  try {
    const { publication_id, variant_id, external_variant_id } = req.body;
    if (!publication_id || !variant_id || !external_variant_id) {
      return res.status(400).json({ error: 'publication_id, variant_id y external_variant_id son obligatorios' });
    }
    const link = await publicationService.linkVariantToPublication(req.body);
    res.status(200).json({ 
      status: 'success', 
      message: 'Variante vinculada exitosamente', 
      data: link 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al vincular variante', message: error.message });
  }
};