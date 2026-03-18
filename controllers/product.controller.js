
const productService = require('../services/product.service');

exports.create = async (req, res) => {
  try {
    const product = await productService.createProduct(req.body);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAll = async (req, res) => {
  const products = await productService.getProducts();
  res.json(products);
};

exports.getById = async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.json(product);
};