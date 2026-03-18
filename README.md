# inventory_challenge
Este sistema gestiona inventario multidepósito y sincroniza el stock con canales de venta externos. Está diseñado para garantizar la consistencia ante concurrencia y la resiliencia ante fallos del 30% en APIs de terceros.

 Stack Tecnológico
Runtime: Node.js

Framework: Express.js

ORM: Prisma (MySQL 8)

Mensajería: Redis + BullMQ (Estrategia de Retries)

Infraestructura: Docker & Docker Compose

 Configuración de Entorno (.env)
Crea un archivo .env en la raíz del proyecto. El sistema ya viene preconfigurado para funcionar con los servicios de Docker, pero podés ajustar estas variables según tu entorno local

# Conexión a la Base de Datos (MySQL)
DATABASE_URL="mysql://root:admin1@localhost:3306/inventory_challenge"

# Configuración del Servidor
PORT=3000

# Configuración de Redis (BullMQ)
REDIS_HOST="127.0.0.1"
REDIS_PORT=6379

# URL del Canal Externo (Mock API)
MOCK_API_URL="http://localhost:8080"


 Instalación y "Warm-up" Automático
El proyecto está configurado para ser Zero-Config. Al levantar Docker, el contenedor de la App espera a la base de datos, aplica las migraciones y carga los datos iniciales (Seed) automáticamente.

1. Levantar el Mock API (Requisito Externo)
Antes de iniciar, asegurate de tener corriendo el Mock provisto por el challenge:

# Generalmente se corre en una terminal aparte
npm i 
npm start 



2. Levantar la Infraestructura

docker compose up --build
  Nota de automatización: El comando npm start dentro del contenedor ejecuta un setTimeout de 5s para esperar a MySQL, seguido de prisma db push y prisma db seed. No es necesario ejecutar comandos manuales de base de      datos.

Guía de Pruebas (API Endpoints)
A. Gestión de Inventario (CRUD Local)
Crear Producto: POST /api/products (Crea la base: nombre, descripción).

Crear Variante: POST /api/variants (Define SKU, talle, color).

Crear Depósito: POST /api/warehouses (Define ubicación física).

B. Vinculación con Canales (Core)
Para que el sistema sepa a dónde enviar el stock, vinculamos la variante local con la "Publicación" del canal:
  
1. Registrar Publicación:
POST /api/publications

JSON
{
  "mock_id": "PUB-001",
  "external_id": "ML-REM-BAS-NEG",
  "channel_name": "mercadolibre"
}

2. Vincular Variante:
POST /api/publications/link-variant

JSON
{
  "publication_id": 1,
  "variant_id": 1,
  "external_variant_id": "PUB-001-V1"
}

C. El Flujo Crítico (Actualización de Stock)
PUT /api/variants/:id/stock

JSON
{
  "warehouse_id": 1,
  "quantity": 50
}

¿Qué sucede al ejecutar esto?

Se actualiza la tabla Stock en la DB.

Se genera un InventoryLog automático.

Se calcula el stock total (suma de todos los depósitos).

Se dispara un Job al Worker.

Verificación: Revisá los logs de Docker (docker compose logs -f app) para ver los reintentos automáticos si el Mock responde 503.

 Puntos de Mejora (Roadmap)
Batch Updates: Implementar un endpoint de carga masiva que optimice las transacciones de base de datos mediante updateMany.

Monitoreo de Colas: Integrar Bull-board para visualizar en tiempo real qué jobs están fallando por el 30% de error del Mock.

Validación de Esquema: Agregar Zod o Joi para validar los cuerpos de las peticiones antes de llegar al Service.
