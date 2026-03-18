
const app = require('./app');
require('./workers/inventory.worker');
app.listen(3000, () => {
  console.log('Server running on port 3000');
  console.log('Worker de inventario activo y escuchando Redis');
});