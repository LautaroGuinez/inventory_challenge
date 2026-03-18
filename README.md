# Inventory Challenge - API de Gestión de Inventario
Este sistema gestiona inventario multidepósito y sincroniza el stock con canales de venta externos. Está diseñado para garantizar la consistencia ante concurrencia y la resiliencia ante fallos del 30% en APIs de terceros mediante estrategias de reintento asíncrono.

# Stack Tecnológico
Runtime: Node.js

Framework: Express.js

ORM: Prisma (MySQL 8)

Mensajería: Redis + BullMQ

Infraestructura: Docker & Docker Compose

# Configuración de Entorno (.env)
Crea un archivo .env en la raíz del proyecto. El sistema está preconfigurado para funcionar dentro de la red de Docker, pero puedes ajustar estas variables según tu necesidad local:

DATABASE_URL="mysql://root:admin1@db:3306/inventory_challenge"
PORT=3000
REDIS_HOST="redis"
REDIS_PORT=6379
MOCK_API_URL="http://localhost:8080"

# Instalación y Automatización
El proyecto utiliza un enfoque Zero-Config. Al iniciar los contenedores, la aplicación espera la disponibilidad de la base de datos, aplica el esquema y carga los datos iniciales automáticamente.

Preparación del Mock API
Antes de iniciar la infraestructura, asegúrate de tener el Mock API provisto en ejecución:

npm install
npm start

# Despliegue de Infraestructura
Ejecuta el siguiente comando para levantar todos los servicios:

docker compose up --build

     Nota de inicialización: 
     El proceso de arranque incluye un retraso programado para sincronizar con MySQL, seguido de los comandos npx prisma db push y npx prisma db seed. No se requiere intervención manual sobre la base de datos.

# Guía de Pruebas (API Endpoints)
Flujo de Configuración Inicial


Crear Producto: POST /api/products (Define datos maestros).

Crear Variante: POST /api/variants (Define SKU, color y talle).

Crear Depósito: POST /api/warehouses (Define ubicación física).

# Vinculación de Canales

Para habilitar la sincronización, asocia la variante local con la publicación externa:

Registrar Publicación: POST /api/publications
{
"mock_id": "PUB-001",
"external_id": "ML-REM-BAS-NEG",
"channel_name": "mercadolibre"
}

Vincular Variante: POST /api/publications/link-variant
{
"publication_id": 1,
"variant_id": 1,
"external_variant_id": "PUB-001-V1"
}

# Flujo Crítico de Actualización de Stock
Para probar la resiliencia del sistema, utiliza el siguiente endpoint:

PUT /api/variants/:id/stock
{
"warehouse_id": 1,
"quantity": 50
}

Proceso Interno:

Atomicidad: Se actualiza el stock y se registra el log de inventario en una única transacción de Prisma.

Cálculo: Se obtiene el stock total consolidado de todos los depósitos.

Sincronización: Se encola un Job en BullMQ para actualizar el canal externo.

Resiliencia: Si el Mock API devuelve error 503, el Worker aplicará reintentos automáticos (Exponential Backoff) visibles en los logs de Docker (docker compose logs -f app).

# Puntos de Mejora (Roadmap)
Batch Updates: Implementar un endpoint de carga masiva que optimice las transacciones de base de datos.

Monitoreo de Colas: Integrar una interfaz como Bull-board para visualizar el estado de los Jobs.



