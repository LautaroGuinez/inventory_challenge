
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando el sembrado de datos (Seed) con Upsert...');

  const data = {
  "warehouses": [
    { "code": "BA-CENTRAL", "name": "Depósito Central Buenos Aires" },
    { "code": "CBA-01", "name": "Depósito Córdoba" }
  ],

  "statuses": [ 
      { id: 1, name: 'ACTIVA', description: 'Publicación creada y visible al público' },
      { id: 2, name: 'CERRADA', description: 'Publicación finalizada' },
      { id: 3, name: 'PENDIENTE', description: 'Publicación pausada u oculta al público' }
    ],
  "products": [
    {
      "name": "Remera Básica Algodón",
      "description": "Remera de algodón 100% peinado, corte recto.",
      "base_sku": "REM-BAS",
      "base_price": 8500,
      "variants": [
        { "sku": "SKU-001", "title": "Negro / Talle S", "color": "Negro", "size": "S", "stock_by_warehouse": { "BA-CENTRAL": 15, "CBA-01": 5 } },
        { "sku": "SKU-002", "title": "Negro / Talle M", "color": "Negro", "size": "M", "stock_by_warehouse": { "BA-CENTRAL": 20, "CBA-01": 10 } },
        { "sku": "SKU-003", "title": "Negro / Talle L", "color": "Negro", "size": "L", "stock_by_warehouse": { "BA-CENTRAL": 10, "CBA-01": 5 } },
        { "sku": "SKU-004", "title": "Blanco / Talle M", "color": "Blanco", "size": "M", "stock_by_warehouse": { "BA-CENTRAL": 12, "CBA-01": 0 } }
      ]
    },
    {
      "name": "Remera Oversize Estampada",
      "description": "Remera oversize con estampado frontal, tela algodón/polyester.",
      "base_sku": "REM-OVR",
      "base_price": 11500,
      "variants": [
        { "sku": "SKU-005", "title": "Gris / Talle M", "color": "Gris", "size": "M", "stock_by_warehouse": { "BA-CENTRAL": 10, "CBA-01": 8 } },
        { "sku": "SKU-006", "title": "Gris / Talle L", "color": "Gris", "size": "L", "stock_by_warehouse": { "BA-CENTRAL": 8, "CBA-01": 4 } },
        { "sku": "SKU-007", "title": "Gris / Talle XL", "color": "Gris", "size": "XL", "stock_by_warehouse": { "BA-CENTRAL": 0, "CBA-01": 0 } }
      ]
    },
    {
      "name": "Jean Slim Fit",
      "description": "Jean de corte slim, tela denim 12oz, con elastano.",
      "base_sku": "JEAN-SLIM",
      "base_price": 22000,
      "variants": [
        { "sku": "SKU-008", "title": "Azul / Talle 28", "color": "Azul", "size": "28", "stock_by_warehouse": { "BA-CENTRAL": 6, "CBA-01": 4 } },
        { "sku": "SKU-009", "title": "Azul / Talle 30", "color": "Azul", "size": "30", "stock_by_warehouse": { "BA-CENTRAL": 9, "CBA-01": 5 } },
        { "sku": "SKU-010", "title": "Azul / Talle 32", "color": "Azul", "size": "32", "stock_by_warehouse": { "BA-CENTRAL": 5, "CBA-01": 3 } }
      ]
    },
    {
      "name": "Pantalón Cargo Wide",
      "description": "Pantalón cargo de corte ancho, múltiples bolsillos, gabardina.",
      "base_sku": "PANT-CARGO",
      "base_price": 19500,
      "variants": [
        { "sku": "SKU-011", "title": "Beige / Talle S", "color": "Beige", "size": "S", "stock_by_warehouse": { "BA-CENTRAL": 7, "CBA-01": 3 } },
        { "sku": "SKU-012", "title": "Beige / Talle M", "color": "Beige", "size": "M", "stock_by_warehouse": { "BA-CENTRAL": 10, "CBA-01": 5 } },
        { "sku": "SKU-013", "title": "Verde / Talle M", "color": "Verde", "size": "M", "stock_by_warehouse": { "BA-CENTRAL": 4, "CBA-01": 2 } },
        { "sku": "SKU-014", "title": "Verde / Talle L", "color": "Verde", "size": "L", "stock_by_warehouse": { "BA-CENTRAL": 3, "CBA-01": 0 } }
      ]
    },
    {
      "name": "Zapatilla Urbana Clásica",
      "description": "Zapatilla urbana con suela de goma vulcanizada, lona de algodón.",
      "base_sku": "ZAP-URB",
      "base_price": 38000,
      "variants": [
        { "sku": "SKU-015", "title": "Blanca / Talle 40", "color": "Blanca", "size": "40", "stock_by_warehouse": { "BA-CENTRAL": 4, "CBA-01": 2 } },
        { "sku": "SKU-016", "title": "Blanca / Talle 42", "color": "Blanca", "size": "42", "stock_by_warehouse": { "BA-CENTRAL": 3, "CBA-01": 1 } },
        { "sku": "SKU-017", "title": "Negra / Talle 40", "color": "Negra", "size": "40", "stock_by_warehouse": { "BA-CENTRAL": 3, "CBA-01": 2 } },
        { "sku": "SKU-018", "title": "Negra / Talle 42", "color": "Negra", "size": "42", "stock_by_warehouse": { "BA-CENTRAL": 2, "CBA-01": 1 } }
      ]
    },
    {
      "name": "Hoodie Canguro",
      "description": "Hoodie con bolsillo canguro, interior felpa, capucha con cordón.",
      "base_sku": "HOOD-CANG",
      "base_price": 18500,
      "variants": [
        { "sku": "SKU-019", "title": "Negro / Talle M", "color": "Negro", "size": "M", "stock_by_warehouse": { "BA-CENTRAL": 12, "CBA-01": 8 } },
        { "sku": "SKU-020", "title": "Negro / Talle L", "color": "Negro", "size": "L", "stock_by_warehouse": { "BA-CENTRAL": 9, "CBA-01": 6 } },
        { "sku": "SKU-021", "title": "Gris / Talle L", "color": "Gris", "size": "L", "stock_by_warehouse": { "BA-CENTRAL": 0, "CBA-01": 0 } }
      ]
    },
    {
      "name": "Campera Puffer Liviana",
      "description": "Campera puffer desmontable, relleno sintético, impermeable.",
      "base_sku": "CAMP-PUFF",
      "base_price": 32000,
      "variants": [
        { "sku": "SKU-022", "title": "Negra / Talle M", "color": "Negra", "size": "M", "stock_by_warehouse": { "BA-CENTRAL": 5, "CBA-01": 2 } },
        { "sku": "SKU-023", "title": "Negra / Talle L", "color": "Negra", "size": "L", "stock_by_warehouse": { "BA-CENTRAL": 3, "CBA-01": 2 } },
        { "sku": "SKU-024", "title": "Azul / Talle M", "color": "Azul", "size": "M", "stock_by_warehouse": { "BA-CENTRAL": 3, "CBA-01": 1 } },
        { "sku": "SKU-025", "title": "Azul / Talle L", "color": "Azul", "size": "L", "stock_by_warehouse": { "BA-CENTRAL": 2, "CBA-01": 0 } }
      ]
    },
    {
      "name": "Bermuda de Gabardina",
      "description": "Bermuda de gabardina elástica, bolsillos laterales y traseros.",
      "base_sku": "BERM-GAB",
      "base_price": 13500,
      "variants": [
        { "sku": "SKU-026", "title": "Kaki / Talle M", "color": "Kaki", "size": "M", "stock_by_warehouse": { "BA-CENTRAL": 14, "CBA-01": 6 } },
        { "sku": "SKU-027", "title": "Kaki / Talle L", "color": "Kaki", "size": "L", "stock_by_warehouse": { "BA-CENTRAL": 10, "CBA-01": 4 } }
      ]
    },
    {
      "name": "Mochila Urban 25L",
      "description": "Mochila urbana 25 litros, compartimento para laptop 15\", tela poliéster.",
      "base_sku": "MOCHI-URBAN",
      "base_price": 14500,
      "variants": [
        { "sku": "SKU-028", "title": "Negro", "color": "Negro", "size": "única", "stock_by_warehouse": { "BA-CENTRAL": 8, "CBA-01": 3 } },
        { "sku": "SKU-029", "title": "Gris", "color": "Gris", "size": "única", "stock_by_warehouse": { "BA-CENTRAL": 6, "CBA-01": 3 } }
      ]
    },
    {
      "name": "Gorra Trucker",
      "description": "Gorra trucker con frente rígido, malla trasera y ajuste snapback.",
      "base_sku": "GORRA-TRUCK",
      "base_price": 5500,
      "variants": [
        { "sku": "SKU-030", "title": "Negro", "color": "Negro", "size": "única", "stock_by_warehouse": { "BA-CENTRAL": 18, "CBA-01": 7 } },
        { "sku": "SKU-031", "title": "Beige", "color": "Beige", "size": "única", "stock_by_warehouse": { "BA-CENTRAL": 12, "CBA-01": 6 } }
      ]
    }
  ]
} ;

   
  

  
  await prisma.inventoryAction.upsert({
    where: { name: 'STOCK_UPDATE' },
    update: {},
    create: { id: 1, name: 'STOCK_UPDATE', description: 'Actualización manual de stock' },
  });

  for (const status of data.statuses) {
    await prisma.publicationStatus.upsert({
      where: { id: status.id },
      update: { name: status.name, description: status.description },
      create: status,
    });
  }

  
  const warehouseMap = {};
  for (const wh of data.warehouses) {
    const createdWh = await prisma.warehouse.upsert({
      where: { code: wh.code },
      update: { name: wh.name },
      create: { code: wh.code, name: wh.name },
    });
    warehouseMap[wh.code] = createdWh.id;
  }

  for (const p of data.products) {
    const product = await prisma.product.upsert({
      where: { base_sku: p.base_sku },
      update: { name: p.name, base_price: p.base_price, description: p.description },
      create: {
        name: p.name,
        description: p.description,
        base_sku: p.base_sku,
        base_price: p.base_price,
        variants: {
          create: p.variants.map(v => ({
            sku: v.sku,
            title: v.title,
            color: v.color,
            size: v.size,
          }))
        }
      },
      include: { variants: true }
    });

    for (const vData of p.variants) {
      const createdVariant = product.variants.find(v => v.sku === vData.sku);
      if (!createdVariant) continue;

      const stockEntries = Object.entries(vData.stock_by_warehouse);
      for (const [whCode, qty] of stockEntries) {
        const whId = warehouseMap[whCode];
        
        
        const existingStock = await prisma.stock.findFirst({
          where: { variant_id: createdVariant.id, warehouse_id: whId }
        });

        if (existingStock) {
          await prisma.stock.update({
            where: { id: existingStock.id },
            data: { quantity: qty }
          });
        } else {
          await prisma.stock.create({
            data: { variant_id: createdVariant.id, warehouse_id: whId, quantity: qty }
          });
        }
      }
    }
  }

  console.log('Seed completado con éxito: Todo está sincronizado.');
}

main()
  .catch((e) => {
    console.error('Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });