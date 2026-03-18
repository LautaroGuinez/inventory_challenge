# Uso de una Cola de Mensajes

1. Contexto
La API del marketplace externo (Mock 8080) es inestable (tiene una tasa de error del 30%) y puede presentar latencias elevadas. Realizar llamadas HTTP directas desde el flujo principal de la aplicación bloquearía los hilos de ejecución, degradando la experiencia del usuario y aumentando el riesgo de pérdida de datos si la llamada falla definitivamente.

2. Decisión
Implementar un patrón de Procesamiento Asíncrono utilizando BullMQ y Redis. El servicio de inventario simplemente registra un "Job" en la cola y responde al cliente de inmediato. Un proceso separado (Worker) se encarga de consumir esos jobs y comunicarse con el marketplace.

3. Consecuencias
Pros (+): Mejora drástica en el tiempo de respuesta de la API. Resiliencia mediante políticas de reintento (exponential backoff). Desacoplamiento total del éxito de la DB local con el éxito del marketplace.

Contras (-): Introduce una dependencia adicional (Redis) y complejidad en la infraestructura. El sistema pasa a ser eventualmente consistente (el stock en el marketplace puede tardar unos segundos en igualarse al local).



# Gestión de Stock Mediante Agregación en Tiempo Real

1. Contexto
El stock de una variante puede estar distribuido en múltiples depósitos físicamente distintos. Necesitamos una forma de informar el stock total disponible a los canales de venta sin riesgo de que ese valor se desfase por errores de cálculo manuales o actualizaciones parciales.

2. Decisión
Utilizar la función aggregate de Prisma para calcular la suma de quantity de todos los registros de la tabla Stock asociados a una Variant cada vez que ocurre un movimiento. No almacenaremos un campo estático de "stock_total" en la tabla de variantes.

3. Consecuencias
Pros (+): Garantiza que el stock informado sea siempre la Fuente Única de Verdad (Single Source of Truth). Elimina el riesgo de "stock fantasma" por desincronización de campos calculados.

Contras (-): Impacto mínimo en el rendimiento por realizar una operación de suma en la DB. A gran escala (millones de depósitos por variante), podría requerir optimización mediante índices o vistas materializadas.



# Tabla Intermedia PublicationVariant

1. Contexto
Un producto físico (variante) no tiene una relación 1:1 con su publicación en internet. Una misma remera puede estar publicada en varios canales (Mercado Libre, Tiendanube) con diferentes IDs externos, pero consumiendo el mismo stock físico.

2. Decisión
Implementar una tabla de unión o Join Table denominada PublicationVariant. Esta entidad actúa como un "mapeador" que vincula un variant_id interno con un publication_id y su respectivo external_variant_id.

3. Consecuencias
Pros (+): Soporte nativo para estrategias Omnicanal. Facilita la trazabilidad (saber exactamente en qué canales impacta un cambio de stock). Permite mantener la integridad referencial aunque los IDs externos cambien.

Contras (-): Requiere realizar un JOIN (o include en Prisma) adicional para obtener la información completa, aumentando ligeramente la complejidad de las consultas de lectura.


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Auditoría de Inventario

1. Contexto
En un sistema distribuido donde el stock cambia por ventas, devoluciones o ajustes manuales, es crítico entender quién, cuándo y por qué cambió un valor. Confiar solo en el valor actual de la tabla Stock impide reconstruir la historia ante discrepancias contables o errores de sincronización.

2. Decisión
Implementar una tabla de Auditoría Inmutable (InventoryLog). Cada vez que se modifica un registro en la tabla Stock, se genera obligatoriamente un registro en esta tabla que guarda: el valor previo, el nuevo valor, el total resultante y el tipo de acción realizada.

3. Consecuencias
Pros (+): Permite realizar trazabilidad total (Forensics). Facilita la creación de reportes históricos de movimientos de mercadería. Brinda seguridad al negocio ante reclamos de stock mal informado.

Contras (-): Aumento en el volumen de datos de la base de datos (la tabla crece con cada movimiento). Requiere una transacción de escritura adicional en cada operación de stock.


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////