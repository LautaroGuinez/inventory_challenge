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