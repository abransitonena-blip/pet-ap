# Auditoría Destello AP (28-sep-2026): qué se implementó

✅ implementado y probado · 🟡 listo en el sistema, falta el dato o la decisión del negocio · ⏭️ siguiente iteración

## Hallazgos

| # | Hallazgo | Estado | Qué quedó |
|---|---|---|---|
| 01 | Contacto vacío | 🟡 | Contacto visible en inicio, cotización, seguimiento y privacidad. Sin WhatsApp funciona el botón **Necesito ayuda**, que abre un caso con número. Falta capturar WhatsApp, correo y dirección en *Negocio*. |
| 02 | Instalación contradictoria | ✅ | La instalación dejó de ser un extra del diseño. **La forma de recibir** (recoger, envío o instalación) decide el cargo; se calcula igual en el editor, el formulario y el servidor (`deliveryCharges`). |
| 03 | Recoger sin domicilio | 🟡 | Muestra dirección y horario de *Negocio*; si faltan, dice "Te confirmamos dirección y horario". |
| 04 | Sin código postal ni domicilio | ✅ | Envío e instalación piden código postal de 5 dígitos y domicilio. La instalación se marca como "se confirma con tu CP" y muestra las zonas configuradas. |
| 05 | Galería y reseñas vacías | 🟡 | La galería y las reseñas verificadas ya existen. Faltan fotos reales autorizadas: *Pedidos → Terminado → fotos + Mostrar en la página*. |
| 06 | Precios de respaldo silenciosos | ✅ | Si no cargan, aparece el aviso "precio estimado" con botón para reintentar; el fallo no se memoriza. El servidor siempre recalcula. |
| 07 | "Pedir" confundía cotización y compra | ✅ | El botón dice **Solicitar cotización**. Arriba del formulario se ven los 4 pasos: revisión, aceptación, anticipo y fabricación. |
| 08 | Condiciones ambiguas | 🟡 | La sección **Cómo funciona** y el presupuesto dicen cuándo empieza el plazo (coincide con la regla del sistema). La cobertura de la garantía se escribe en *Negocio* (texto vacío hasta que el taller la defina). |
| 09 | Sin introducción | ✅ | Franja con dos caminos: **Diseñar mi letrero** y **Necesito ayuda**. |
| 10 | Validación inconsistente | ✅ | WhatsApp obligatorio y correo validado, con las mismas reglas en el navegador y el servidor. El error aparece junto al campo y el foco va al primero. |
| 11 | Teléfono ambiguo | ✅ | Números de México normalizados a 10 dígitos (acepta +52 y 521); los internacionales, con "+código". |
| 12 | Medida exacta | ✅ | Campo de ancho exacto en Tamaño; se informa el alto resultante. |
| 13 | Jerga técnica | ✅ | Desglose comercial ("Letrero LED" y los extras); la **Ficha técnica** es desplegable. Las longitudes de onda solo aparecen como ayuda. |
| 14 | "12 V más segura" | ✅ | Etiquetas neutras: "Directo a la corriente" y "Con eliminador de 12 V". Sin afirmaciones de seguridad; el taller valida el circuito. |
| 15 | Material y acabado confundidos | ✅ | Aclara: "la placa es de X; el acabado es un vinil impreso con apariencia de…". |
| 16 | Demasiadas plantillas | ✅ | 6 ideas iniciales y "Ver todas". |
| 17 | El impreso abría caro | ✅ | Empieza con lona sin luz (desde $150 por pieza). |
| 18 | Formulario largo | ✅ | Cupón, notas y origen en "Más opciones (opcional)". |
| 19 | Fecha en UTC | ✅ | Fecha local de México; mínimo = plazo en días hábiles. Es una "fecha deseada", no una promesa. |
| 20 | Modal no accesible | ✅ | `role="dialog"`, `aria-modal`, título ligado, foco inicial, Tab atrapado, Escape y regreso del foco. No se cierra por clic fuera si hay datos escritos. |
| 21 | Rastreo sin ayuda | ✅ | Explica dónde llega el folio, enlaza a Mi cuenta, tiene botón de ayuda y muestra el **siguiente paso**. |
| 22 | Sin "Olvidé mi contraseña" | ✅ | Recuperación asistida: la solicitud abre un caso y el equipo manda un enlace de un solo uso (1 h) por WhatsApp. Pendiente: envío automático cuando haya un servicio de correo. |
| 23 | Privacidad sin canal | 🟡 | El aviso muestra el canal real y un formulario para solicitudes ARCO con número de caso. Faltan los datos de contacto en *Negocio*. |
| 24 | Contraste bajo | ✅ | El texto secundario pasó de #8a8a8a a #6b6b6b (≈5:1 sobre el fondo). |
| 25 | Bundle con el panel | ✅ | Carga por rutas: el sitio público ya no descarga el panel (de 684 KB a 423 KB; el panel son 246 KB aparte). |

## Tareas del plan

| Tarea | Estado | Qué quedó |
|---|---|---|
| CPQ-02 Precio autoritativo | ✅ | El servidor calcula con sus tarifas; nunca usa el total que manda el navegador. |
| CPQ-03 Instalación | ✅ | Ver hallazgo 02; está en la matriz de pruebas. |
| CPQ-04 Versiones | ✅ | Cada ajuste crea una versión nueva (con foto del desglose). El cliente acepta una versión concreta y queda registrada. Cambiar el precio después exige una nueva aprobación. Un presupuesto vencido no se acepta. |
| CPQ-05 Error de configuración | ✅ | Ver hallazgo 06. |
| CPQ-01 Reglas de compatibilidad | ⏭️ | Hay límites básicos (máximo de LED, medidas). Falta la tabla de reglas aprobada por el taller. |
| OPS-01/02 Producción | ✅ | No se puede pasar a fabricación sin la versión vigente aprobada y el anticipo. Solo quien autoriza presupuestos puede hacer una excepción, y queda registrada con su motivo. |
| OPS-03 Conciliación | ✅ | Cada pago lleva referencia única; repetir la misma referencia o reintentar no suma dos veces. |
| OPS-04 Entrega | 🟡 | Se piden domicilio y CP. Falta agendar la cita y registrar la evidencia de entrega. |
| CX-01 Atención | ✅ | Sección **Atención** con expedientes: responsable, prioridad, fecha límite de primera respuesta (lunes a sábado de 9 a 19 h), historial, próxima acción y resolución obligatoria para cerrar. |
| CX-02 Garantía | ✅ | Tipo *Garantía* con decisión (en revisión, aprobada o no aplica) y remedio (reparación, reposición o devolución); siempre la decide una persona. |
| CX-03 Seguimiento | ✅ | El folio solo no abre el pedido: se piden los últimos 4 dígitos del WhatsApp (con límite de intentos). |
| ENG-01 Idempotencia | ✅ | Clave `Idempotency-Key` en pedidos, lotes y pagos. La misma clave con los mismos datos devuelve lo mismo; con otros datos se rechaza. Va dentro de la transacción de PostgreSQL. |
| ENG-02 Permisos | ✅ | Verificación en el servidor por rol y por objeto (pruebas de acceso). |
| ENG-03 Notificaciones | ⏭️ | Hoy los avisos son por WhatsApp manual. Falta una bandeja de salida cuando haya proveedor de mensajes. |
| Medición | ✅ | Conteo diario anónimo de `design_started`, `quote_viewed`, `quote_requested`, `quote_accepted`, `deposit_confirmed`, `order_delivered` y `support_opened`, por tipo de dispositivo. El embudo se ve en *Resumen*. |

## Pruebas

`tests/audit.test.js` cubre:
- matriz de recepción e instalación;
- versiones, aceptación y bloqueo de producción;
- reintentos sin duplicados;
- seguimiento protegido;
- expedientes, SLA y garantía;
- recuperación de contraseña.

Todo pasa también sobre PostgreSQL (`npm run test:pg`).
