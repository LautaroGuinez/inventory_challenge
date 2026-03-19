
const express = require('express');
const app = express();

app.use(express.json());

app.use('/api/products', require('./routes/product.routes'));
app.use('/api/warehouses', require('./routes/warehouse.routes'));
app.use('/api/variants', require('./routes/variant.routes'));
app.use('/api/publications', require('./routes/publication.routes'));
module.exports = app;