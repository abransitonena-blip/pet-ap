# Plan: rediseño, marca, base de datos real y cuentas

Fecha: septiembre 2026.

## 1. Nombre de marca (con "AP" al final)

Revisé en el registro de dominios (Vercel) qué nombres tienen libre el **.com** y el **.mx**:

| Nombre | Idea | .com | .mx |
|---|---|---|---|
| **Destello AP** (recomendado) | Un destello = cada punto de luz; corto, fácil de decir y de recordar | destelloap.com libre | destelloap.mx libre |
| Lucero AP | La estrella más brillante; suena cálido y mexicano | luceroap.com libre | luceroap.mx libre |
| Luciérnaga AP | Puntos de luz en la noche; muy visual para redes | luciernagaap.com libre | luciernagaap.mx libre |
| Faro AP | Guía a los clientes a tu negocio | faroap.com libre | faroap.mx libre |
| Foco AP | Directo y popular | focoap.com libre | focoap.mx libre |
| Fulgor AP | Brillo intenso; más elegante | fulgorap.com libre | fulgorap.mx libre |
| Lumina AP | Suena internacional | luminaap.com libre | luminaap.mx libre |

Ya ocupados: lumenap.com, brilloap.com, lumiap.com, neonap.com, luzap.com, pixelap.com.

La marca se guarda en un solo lugar (`src/lib/brand.js`) y se puede cambiar desde **Panel → Negocio → Nombre de la marca** sin tocar código. El logo es el nombre en letra limpia seguido del monograma **AP** hecho de puntos LED.

## 2. Base de datos real (PostgreSQL)

Hoy los datos viven en un solo archivo JSON dentro de Vercel Blob: dos personas guardando al mismo tiempo pueden pisarse, y no se puede consultar.

- **Motor:** PostgreSQL (recomendado Neon desde *Vercel → Storage*, plan gratis). La app lo usa en cuanto existe `DATABASE_URL` o `POSTGRES_URL`.
- **Tablas:**
  - `records (collection, id, data jsonb, created_at, updated_at)`: pedidos, usuarios, clientes, tareas, personal, asistencia, gastos, cupones, publicaciones, prospectos y proveedores (una fila por registro).
  - `kv (key, value jsonb)`: ajustes, precios, inventario, folio consecutivo, texturas.
  - `photos (id, content_type, data bytea)`: fotos si no hay Vercel Blob.
- **Seguridad de escritura:** cada cambio corre en una transacción con candado (`pg_advisory_xact_lock`), así dos pedidos al mismo tiempo nunca se pisan. Solo se escriben las filas que cambiaron.
- **Migración automática:** la primera vez que arranca con Postgres vacío copia todo lo que hay en Blob / JSON. No se pierde nada.
- **Respaldo:** `GET /api/admin/backup` descarga todo en JSON (solo el dueño).

## 3. Cuentas e inicio de sesión

- **Clientes:** crear cuenta con correo y contraseña o con **Google**. En *Mi cuenta* ven sus pedidos (estado, presupuesto y pagos), sus diseños guardados y sus datos; el formulario de pedido se llena solo.
- **Equipo:** cada usuario del panel puede ligar su correo de Google y entrar con un clic.
- **Google:** se usa *Sign in with Google*. El servidor verifica la firma del token con las llaves públicas de Google. Se activa al poner `GOOGLE_CLIENT_ID` en Vercel (se crea gratis en Google Cloud Console).
- Contraseñas con `scrypt`; sesiones firmadas (HMAC) de 30 días para clientes y 12 h para el equipo.

## 4. Rediseño

- **Visualización más grande:** el letrero ocupa casi toda la pantalla en computadora y 60 % en celular; la placa se ajusta al tamaño disponible.
- **Mejor organización:** el configurador pasa de una columna larga a **pasos en pestañas** (Texto · Tamaño · Base · Luz · Extras), con el precio siempre visible.
- **Íconos:** set de trazo uniforme (Lucide) en toda la interfaz; los íconos LED se quedan para lo que va dentro del letrero.
- **LED más reales:**
  - colores calibrados a LED reales (rojo 625 nm, ámbar 590 nm, verde 525 nm, azul 470 nm, blanco frío 6500 K, cálido 3000 K) más **naranja, cian y RGB**;
  - encendido: núcleo casi blanco, halo saturado del color y resplandor en dos capas (*bloom*);
  - apagado: lente con tinte, copa reflectora y chip visibles.
- **Encabezado y pie** con la nueva marca; paleta negro / rosa sobre fondos claros.

## 5. Orden de trabajo

1. Base de datos (adaptador Postgres + migración + pruebas con Postgres en memoria).
2. Cuentas (clientes y Google).
3. Marca y rediseño.
4. Pruebas, publicación e instrucciones para activar Neon y Google.

## Qué necesito de ti

1. **Neon:** en Vercel → proyecto *letrerolab* → *Storage* → *Create Database* → **Neon (Postgres)** → conectar al proyecto. Vercel agrega `DATABASE_URL` solo. Luego vuelve a publicar.
2. **Google:** en console.cloud.google.com → *APIs y servicios* → *Credenciales* → *ID de cliente OAuth* (tipo Web). Origen autorizado: `https://letrerolab.vercel.app`. Copia el ID a Vercel como `GOOGLE_CLIENT_ID`.
3. **Nombre:** confirmar la marca (por ahora uso *Destello AP*; se cambia en Negocio).
