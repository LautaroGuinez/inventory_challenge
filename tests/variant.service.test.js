/**
 * Tests para la lógica de negocio crítica de inventario.
 *
 * Criterio de selección de qué testear:
 *   - updateVariantStock: es el core del challenge. Debe garantizar atomicidad,
 *     cálculo correcto de stock total y encolado hacia canales externos.
 *   - batchUpdateStock: deduplicación y encolado único son las invariantes clave.
 *   - createPublication + linkVariantToPublication: el flujo de vinculación
 *     dispara una sincronización inicial, eso debe verificarse.
 *
 * No se testea: CRUD simple de productos/depósitos (lógica trivial de Prisma),
 * ni el Worker (su responsabilidad es llamar a una API externa, se testea con
 * integration tests o mocks de axios aparte).
 *
 */

'use strict';

// ─── Mocks de módulos externos ────────────────────────────────────────────────

// Mock de BullMQ Queue — captura los jobs sin tocar Redis
const mockAdd = jest.fn().mockResolvedValue({ id: 'job-1' });
const mockAddBulk = jest.fn().mockResolvedValue([]);
jest.mock('../queues/inventory.queue', () => ({
  inventoryQueue: { add: mockAdd, addBulk: mockAddBulk },
  connection: {},
}));


const mockTx = {
  $queryRaw: jest.fn().mockResolvedValue([]),
  stock: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    aggregate: jest.fn(),
  },
  inventoryLog: { create: jest.fn().mockResolvedValue({}) },
  publicationVariant: { findMany: jest.fn() },
  publication: { create: jest.fn() },
};


const mockTransaction = jest.fn((cb) => cb(mockTx));

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $transaction: mockTransaction,
      publication: { create: jest.fn() },
    })),
  };
});

// ─── Módulos bajo test (se importan DESPUÉS de los mocks) ────────────────────
const variantService = require('../services/variant.service');
const publicationService = require('../services/publication.service');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Configura el mock de tx para un escenario de actualización de stock estándar.
 * @param {number} prevQty    - stock previo en el depósito
 * @param {number} totalStock - suma total de todos los depósitos post-update
 * @param {Array}  linkedPubs - publicaciones vinculadas a la variante
 */
function setupStockMocks({ prevQty = 0, totalStock = 0, linkedPubs = [] } = {}) {
  mockTx.stock.findUnique.mockResolvedValue(
    prevQty > 0 ? { quantity: prevQty } : null
  );
  mockTx.stock.upsert.mockResolvedValue({ quantity: totalStock });
  mockTx.stock.aggregate.mockResolvedValue({ _sum: { quantity: totalStock } });
  mockTx.publicationVariant.findMany.mockResolvedValue(linkedPubs);
}



describe('updateVariantStock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('actualiza stock, calcula total correcto y retorna synced_channels', async () => {
    
    setupStockMocks({
      prevQty: 15,
      totalStock: 105,
      linkedPubs: [],
    });

    const result = await variantService.updateVariantStock(1, 1, 100);

    expect(result.totalStock).toBe(105);
    expect(result.synced_channels).toBe(0);
  });

  test('registra log de auditoría con prev_quantity y new_quantity correctos', async () => {
    setupStockMocks({ prevQty: 15, totalStock: 105, linkedPubs: [] });

    await variantService.updateVariantStock(1, 1, 100);

    expect(mockTx.inventoryLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        variant_id: 1,
        warehouse_id: 1,
        prev_quantity: 15,   
        new_quantity: 100,   
        total_after: 105,    
        action_id: 1,
      }),
    });
  });

  test('prev_quantity es 0 cuando la fila de Stock no existía aún', async () => {
    
    setupStockMocks({ prevQty: 0, totalStock: 50, linkedPubs: [] });

    await variantService.updateVariantStock(1, 1, 50);

    expect(mockTx.inventoryLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        prev_quantity: 0,
        new_quantity: 50,
      }),
    });
  });

  test('encola un job en BullMQ por cada publicación vinculada', async () => {
    
    const linkedPubs = [
      {
        external_variant_id: 'PUB-001-V1',
        publication: { mock_id: 'PUB-001', external_id: 'ML-REM-BAS-NEG' },
      },
      {
        external_variant_id: 'PUB-002-V1',
        publication: { mock_id: 'PUB-002', external_id: 'TN-REM-BAS-NEG' },
      },
    ];
    setupStockMocks({ prevQty: 15, totalStock: 105, linkedPubs });

    const result = await variantService.updateVariantStock(1, 1, 100);

    expect(result.synced_channels).toBe(2);
    expect(mockAdd).toHaveBeenCalledTimes(2);

    
    expect(mockAdd).toHaveBeenCalledWith(
      'sync-PUB-001-1',
      expect.objectContaining({ stock: 105, publicationExternalId: 'PUB-001' })
    );
    expect(mockAdd).toHaveBeenCalledWith(
      'sync-PUB-002-1',
      expect.objectContaining({ stock: 105, publicationExternalId: 'PUB-002' })
    );
  });

  test('no encola jobs si la variante no tiene publicaciones vinculadas', async () => {
    setupStockMocks({ prevQty: 0, totalStock: 30, linkedPubs: [] });

    await variantService.updateVariantStock(2, 1, 30);

    expect(mockAdd).not.toHaveBeenCalled();
  });

  test('adquiere SELECT FOR UPDATE antes de cualquier lectura de stock', async () => {
    setupStockMocks({ prevQty: 0, totalStock: 50, linkedPubs: [] });

    await variantService.updateVariantStock(1, 1, 50);

    
    const calls = mockTx.$queryRaw.mock.invocationCallOrder[0];
    const findCalls = mockTx.stock.findUnique.mock.invocationCallOrder[0];
    expect(calls).toBeLessThan(findCalls);
  });
});


describe('batchUpdateStock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTx.stock.findUnique.mockResolvedValue(null);
    mockTx.stock.upsert.mockImplementation(({ create }) =>
      Promise.resolve({ quantity: create.quantity })
    );
    mockTx.stock.aggregate.mockImplementation(({ where }) =>
      Promise.resolve({ _sum: { quantity: 0 } })
    );
    mockTx.inventoryLog.create.mockResolvedValue({});
    mockTx.publicationVariant.findMany.mockResolvedValue([]);
  });

  test('procesa la cantidad correcta de ítems únicos', async () => {
    const items = [
      { variant_id: 1, warehouse_id: 1, quantity: 100 },
      { variant_id: 1, warehouse_id: 2, quantity: 20 },
      { variant_id: 2, warehouse_id: 1, quantity: 15 },
    ];

    const result = await variantService.batchUpdateStock(items);

    expect(result.processed).toBe(3);
  });

  test('deduplica ítems con mismo variant_id + warehouse_id, prevalece el último', async () => {
    const items = [
      { variant_id: 1, warehouse_id: 1, quantity: 40 },  
      { variant_id: 1, warehouse_id: 1, quantity: 999 }, 
      { variant_id: 2, warehouse_id: 1, quantity: 15 },
    ];

    const result = await variantService.batchUpdateStock(items);

    
    expect(result.processed).toBe(2);

    
    const upsertCalls = mockTx.stock.upsert.mock.calls;
    const qty1Calls = upsertCalls
      .filter(([args]) => args.create.variant_id === 1 && args.create.warehouse_id === 1)
      .map(([args]) => args.update.quantity);
    expect(qty1Calls).toContain(999);
    expect(qty1Calls).not.toContain(40);
  });

  test('usa addBulk (no add individual) para encolar jobs', async () => {
    const linkedPub = [
      {
        external_variant_id: 'PUB-001-V1',
        publication: { mock_id: 'PUB-001', external_id: 'ML-REM-BAS-NEG' },
      },
    ];
    mockTx.publicationVariant.findMany.mockResolvedValue(linkedPub);
    mockTx.stock.aggregate.mockResolvedValue({ _sum: { quantity: 50 } });

    const items = [
      { variant_id: 1, warehouse_id: 1, quantity: 50 },
      { variant_id: 1, warehouse_id: 2, quantity: 0 },
    ];

    await variantService.batchUpdateStock(items);

    
    expect(mockAddBulk).toHaveBeenCalledTimes(1);
    
    expect(mockAdd).not.toHaveBeenCalled();
  });

  test('no llama a addBulk si ningún ítem tiene publicaciones vinculadas', async () => {
    mockTx.publicationVariant.findMany.mockResolvedValue([]);

    const items = [{ variant_id: 5, warehouse_id: 1, quantity: 10 }];
    const result = await variantService.batchUpdateStock(items);

    expect(mockAddBulk).not.toHaveBeenCalled();
    expect(result.queued_sync_jobs).toBe(0);
  });

  test('genera un único job por publicación incluso si la variante tiene 2 depósitos afectados', async () => {
    
    
    const linkedPub = [
      {
        external_variant_id: 'PUB-001-V1',
        publication: { mock_id: 'PUB-001', external_id: 'ML-REM-BAS-NEG' },
      },
    ];
    mockTx.publicationVariant.findMany.mockResolvedValue(linkedPub);
    mockTx.stock.aggregate.mockResolvedValue({ _sum: { quantity: 120 } });

    const items = [
      { variant_id: 1, warehouse_id: 1, quantity: 100 },
      { variant_id: 1, warehouse_id: 2, quantity: 20 },
    ];
    const result = await variantService.batchUpdateStock(items);

   
    expect(result.processed).toBe(2);
    expect(result.queued_sync_jobs).toBe(1);

    const [bulkJobs] = mockAddBulk.mock.calls[0];
    expect(bulkJobs).toHaveLength(1);
    expect(bulkJobs[0].name).toBe('sync-PUB-001-1');
  });
});



describe('publication flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createPublication crea correctamente con los campos del mock channel', async () => {
    
    const prismaInstance = require('@prisma/client').PrismaClient.mock.results[0].value;
    prismaInstance.publication.create.mockResolvedValue({
      id: 1,
      mock_id: 'PUB-001',
      external_id: 'ML-REM-BAS-NEG',
      channel_name: 'mercadolibre',
      status_id: 1,
    });

    const result = await publicationService.createPublication({
      mock_id: 'PUB-001',
      external_id: 'ML-REM-BAS-NEG',
      channel_name: 'mercadolibre',
    });

    expect(prismaInstance.publication.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        mock_id: 'PUB-001',
        external_id: 'ML-REM-BAS-NEG',
        channel_name: 'mercadolibre',
        status_id: 1, // default ACTIVA
      }),
    });
    expect(result.mock_id).toBe('PUB-001');
  });

  test('linkVariantToPublication genera una sincronización inicial al vincular', async () => {
    
    mockTx.publicationVariant = {
      create: jest.fn().mockResolvedValue({
        id: 1,
        publication: { mock_id: 'PUB-001', external_id: 'ML-REM-BAS-NEG' },
      }),
    };
    mockTx.stock.aggregate.mockResolvedValue({ _sum: { quantity: 20 } });

    await publicationService.linkVariantToPublication({
      publication_id: 1,
      variant_id: 1,
      external_variant_id: 'PUB-001-V1',
    });

    
    expect(mockAdd).toHaveBeenCalledWith(
      'sync-init-1',
      expect.objectContaining({
        publicationExternalId: 'PUB-001',
        externalVariantId: 'PUB-001-V1',
        stock: 20,
      })
    );
  });

  test('linkVariantToPublication envía stock 0 si la variante no tiene stock aún', async () => {
    mockTx.publicationVariant = {
      create: jest.fn().mockResolvedValue({
        id: 2,
        publication: { mock_id: 'PUB-003', external_id: 'ML-REM-OVR-GRIS' },
      }),
    };
    
    mockTx.stock.aggregate.mockResolvedValue({ _sum: { quantity: null } });

    await publicationService.linkVariantToPublication({
      publication_id: 3,
      variant_id: 7,
      external_variant_id: 'PUB-003-V3',
    });

    expect(mockAdd).toHaveBeenCalledWith(
      'sync-init-7',
      expect.objectContaining({ stock: 0 })
    );
  });
});
