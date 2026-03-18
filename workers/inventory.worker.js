const { Worker } = require('bullmq');
const axios = require('axios');
const { connection } = require('../queues/inventory.queue');

const MOCK_API_URL = process.env.MOCK_API_URL || 'http://localhost:8080';


const inventoryWorker = new Worker('inventory-sync', async (job) => {

  const { publicationExternalId, externalVariantId, stock } = job.data;
  
  console.log(`[Worker] Intentando sincronizar Pub: ${publicationExternalId} | Var: ${externalVariantId} | Stock: ${stock}`);

  try {
    
    const url = `${MOCK_API_URL}/channel/publications/${publicationExternalId}/variants/${externalVariantId}/stock`;
    
    
    const response = await axios.put(url, { stock });

    console.log(`[Worker] ✅ ÉXITO Job ${job.id}: Mock respondió ${response.status}`);
  } catch (error) {
    const status = error.response?.status || 'Error de Red/Conexión';
    const errorData = error.response?.data || error.message;

    console.error(`[Worker] ❌ ERROR en Job ${job.id}: Status ${status}`);
    console.error(`[Worker] Detalle:`, errorData);
    
    
    throw error; 
  }
}, { connection });