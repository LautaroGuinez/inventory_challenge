
const express = require('express');
const app = express();

app.use(express.json());

app.use('/products', require('./routes/product.routes'));
app.use('/warehouses', require('./routes/warehouse.routes'));
app.use('/variants', require('./routes/variant.routes'));
app.use('/publications', require('./routes/publication.routes'));
module.exports = app;