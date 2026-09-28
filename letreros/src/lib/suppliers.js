// Directorio de proveedores (investigación de septiembre 2026). Precios orientativos: confirma antes de comprar.
export const SUPPLIER_CATEGORIES = [
  { id: 'led', name: 'LED' },
  { id: 'electronica', name: 'Electrónica' },
  { id: 'acrilico', name: 'Acrílico' },
  { id: 'pvc', name: 'PVC espumado' },
  { id: 'mdf', name: 'MDF' },
  { id: 'vinil', name: 'Vinil de texturas' },
  { id: 'envios', name: 'Envíos' },
  { id: 'maquinas', name: 'Máquinas y herramienta' },
  { id: 'maquila', name: 'Corte por servicio' },
  { id: 'pagos', name: 'Cobro con tarjeta' },
  { id: 'financiamiento', name: 'Financiamiento' },
  { id: 'otro', name: 'Otro' }
]

export const SUPPLIERS = [
  { name: 'Geek Factory', category: 'led', url: 'https://www.geekfactory.mx/producto/millar-de-led-ultra-brillante-5-mm-en-varios-colores/', what: 'Millar de LED 5 mm ultrabrillante en 7 colores', price: 'desde $265 el millar (≈ $0.27 c/u)', note: 'También NE555, CD4017 e insumos' },
  { name: 'MercadoLibre · LED 5 mm mayoreo', category: 'led', url: 'https://listado.mercadolibre.com.mx/leds-por-mayoreo', what: 'Bolsas de 100 a 1000 LED por color', price: 'compara vendedores con reputación verde', note: 'Pide muestra de brillo antes de comprar el millar' },
  { name: 'Steren', category: 'electronica', url: 'https://www.steren.com.mx/proyectos-de-electronica/capacitores', what: 'Capacitores de poliéster, puentes rectificadores 400 V', price: 'precio de mayoreo desde 25 piezas', note: 'Tiendas en todo el país: sirve para urgencias' },
  { name: 'AG Electrónica', category: 'electronica', url: 'https://agelectronica.com/detalle?busca=CP-.47%2F400V-FARAD', what: 'Capacitor 0.47 µF 400 V (474J), resistencias, 2W10, SCR', price: 'catálogo con precio por volumen', note: 'Distribuidor grande (CDMX), envío nacional' },
  { name: 'Electrónica Max', category: 'electronica', url: 'https://www.electronica-max.com/Capacitor-de-Poliester-0-47uF-400V-474J-CP-47uF-400V,4679_37', what: 'Capacitor poliéster 474J 400 V', price: 'por pieza', note: '' },
  { name: 'Suministros AG (Resplander)', category: 'acrilico', url: 'https://tienda.suministrosag.mx/cd/categorias/rigidos/acrilico-resplander-cristal-1.22-x-2.44-de-3mm/', what: 'Acrílico 3 mm 1.22 × 2.44 cristal, blanco y negro; PVC 6 mm', price: 'por hoja', note: 'Marca Resplander, especial para anuncios' },
  { name: 'Pochteca Papel', category: 'acrilico', url: 'https://tiendapapel.pochteca.net/hoja-acrilico-cristal-3mm-1-22x2-44-sic.html', what: 'Hoja de acrílico cristal 3 mm 1.22 × 2.44', price: 'envío gratis CDMX desde $3,000 + IVA', note: 'Envío nacional gratis desde $5,000' },
  { name: 'Acrilfrasa', category: 'acrilico', url: 'https://www.acrilfrasa.mx/', what: 'Acrílico extruido 3 mm 1.20 × 2.40', price: 'por hoja', note: '' },
  { name: 'Acrycell', category: 'acrilico', url: 'https://acrycell.com/', what: 'Láminas de acrílico 2 a 6 mm', price: 'por hoja o corte', note: 'CDMX y envíos' },
  { name: 'Plásticos y Acrílicos Jize', category: 'acrilico', url: 'https://plasticosyacrilicosjize.com.mx/lamina-de-acrilico-transparente.html', what: 'Acrílico por hoja o por porción', price: 'venta por pieza', note: 'Útil para pedidos chicos' },
  { name: 'Show Depot (Trovicel)', category: 'pvc', url: 'https://www.showdepot-tienda.com/TROVICEL-PVC-ESPUMADO-BLANCO-1-22-X-2-44-M-6MM,88_60', what: 'PVC espumado 6 mm 1.22 × 2.44 blanco y color', price: 'por hoja', note: '' },
  { name: 'Plasco', category: 'pvc', url: 'https://plasco.mx/producto/pvc/', what: 'PVC / Trovicel 6 mm en colores', price: 'por hoja', note: '' },
  { name: 'Pogalmex (Sintra)', category: 'pvc', url: 'https://pogalmex.com.mx/suministro-de-materiales/', what: 'Sintra PVC espumado 1.22 × 2.44', price: 'distribuidor', note: '' },
  { name: 'The Home Depot', category: 'mdf', url: 'https://www.homedepot.com.mx/b/materiales-de-construccion/paneles-de-madera/mdf', what: 'MDF 6 mm 1.22 × 2.44', price: 'por hoja; corte en tienda', note: 'Disponible en casi todas las ciudades' },
  { name: 'Sodimac', category: 'mdf', url: 'https://www.sodimac.com.mx/sodimac-mx/category/cat11437/Hojas-de-MDF', what: 'Hojas de MDF', price: 'por hoja', note: '' },
  { name: 'Proveedora de las Artes Gráficas', category: 'vinil', url: 'https://proveedoradelasartesgraficas.com.mx/products/vinil-de-corte-imitacion-madera-roble-61-cm-ancho', what: 'Vinil imitación madera roble 61 cm', price: 'por metro', note: 'Para acabados madera' },
  { name: 'Moritzu', category: 'vinil', url: 'https://moritzu.com.mx/tienda/vinil/vinil-autoadhesivo/autpadhesivo-de-rotulacion/vinil-autoadhesivo-efecto-marmol-60cm-ancho/', what: 'Vinil efecto mármol y madera 60 cm', price: 'por metro', note: '' },
  { name: 'DECOFILM', category: 'vinil', url: 'https://decopvc.mx/products/vinil-autoadherible-madera-en-rollo-0-60x5m-decofilm%C2%AE', what: 'Rollo 0.60 × 5 m (3 m²) madera / mármol', price: 'por rollo', note: '' },
  { name: 'Envia.com', category: 'envios', url: 'https://envia.com/en-US/carriers/estafeta-MX', what: 'Guías Estafeta, DHL, FedEx con tarifa de plataforma', price: 'cotiza por peso volumétrico (L×A×H / 5000)', note: 'Una caja de 60×40×10 cm cuenta como 4.8 kg' },
  { name: 'Cortadora láser CO2 40 W (K40) · MercadoLibre', category: 'maquinas', url: 'https://listado.mercadolibre.com.mx/cortadora-laser-k40', what: 'Área ≈ 30 × 20 cm; corta acrílico 3 mm y MDF', price: 'la más barata en CO2; compara vendedores', note: 'Ideal para empezar: corta la placa y los barrenos de los LED' },
  { name: 'Geek Factory · CO2 40 × 40 cm 50 W', category: 'maquinas', url: 'https://www.geekfactory.mx/producto/cortadora-y-grabadora-laser-40-x-40-50-w/', what: 'Cortadora y grabadora láser de escritorio 40 × 40 cm', price: 'ver precio en tienda', note: 'Acrílico, MDF, vinil, cartón' },
  { name: 'CO2 60–130 W · 60 × 40 / 90 × 60 cm', category: 'maquinas', url: 'https://www.amazon.com.mx/M%C3%A1quina-grabado-l%C3%A1ser-cortadora-600mm/dp/B0892H6T51', what: 'Área para letreros grandes; con 80 W corta MDF de 8 mm en 1 pasada', price: 'Amazon / MercadoLibre', note: 'Necesita extractor y enfriador de agua' },
  { name: 'Stanser · línea CRAFTER CO2', category: 'maquinas', url: 'https://www.stanser.com/cnc-laser/', what: 'CO2 60–125 W con soporte en México', price: 'desde $102,586 + IVA', note: 'Distribuidor con servicio técnico' },
  { name: 'Láser de diodo 20 W (Atomstack, Sculpfun, xTool)', category: 'maquinas', url: 'https://mx.sculpfun.com/collections/laser-engraver', what: 'Corta MDF y acrílico OSCURO de 3–5 mm', price: 'desde ≈ $13,500 en Amazon', note: 'No corta acrílico transparente ni blanco: la luz del diodo lo atraviesa' },
  { name: 'Router CNC 3018 / 6040', category: 'maquinas', url: 'https://lowpi.com/precio/router-cnc-3018-pro', what: 'Fresadora: acrílico, PVC y MDF; barrenos exactos', price: '3018 desde $1,299 · 3018 Pro desde $5,200', note: 'Lenta y área chica (30 × 18 cm); la 6040 sirve para placas medianas' },
  { name: 'Kit de soldadura Truper CAU-25ERK', category: 'maquinas', url: 'https://mundotool.com/products/kit-soldadura-electronica-con-cautin-de-25-w-temp-regulable', what: 'Cautín 25 W regulable, desoldador, puntas y estuche', price: '≈ $565', note: 'Para soldar cadenas de LED y placas' },
  { name: 'Color Make · cuánto cuesta el corte láser', category: 'maquila', url: 'https://colormake.com/blog/cuanto-cuesta-el-corte-laser-y-como-se-calcula/', what: 'Referencia de precios de corte por minuto', price: '$15–$18 por minuto (zona centro, 2026)', note: 'Úsalo para comparar contra comprar máquina' },
  { name: 'FIC Corte Láser', category: 'maquila', url: 'https://fic-cortelaser.mx/', what: 'Corte láser 24/7 en MDF y acrílico', price: 'cotización', note: 'CDMX' },
  { name: 'Corte Láser 227', category: 'maquila', url: 'https://www.227.studio/cortelaser', what: 'Corte y grabado de MDF y acrílico 3–15 mm', price: 'cotización', note: 'CDMX' },
  { name: 'By Design (Iztapalapa)', category: 'maquila', url: 'http://www.bydesignermita.com.mx/', what: 'Corte láser y router CNC', price: 'cotización', note: 'CDMX' },
  { name: 'Acrivel', category: 'maquila', url: 'https://acrivel.jimdoweb.com/servicios/', what: 'Corte láser de acrílico y MDF', price: 'cotización', note: 'Guadalajara' },
  { name: 'Mercado Pago · link de pago', category: 'pagos', url: 'https://atempora.studio/blog/comisiones-mercado-pago-2026', what: 'Manda un link para cobrar el anticipo con tarjeta', price: '≈ 3.49 % + $4 + IVA por cobro', note: 'También ofrece meses sin intereses (con costo extra)' },
  { name: 'Clip · terminal', category: 'pagos', url: 'https://atempora.studio/blog/comisiones-clip-2026', what: 'Terminal para cobrar en persona', price: '3.6 % + IVA por venta', note: 'Útil en visitas a prospectos e instalación' },
  { name: 'NAFIN · crédito Micro', category: 'financiamiento', url: 'https://mundoejecutivocdmx.com/mundo-economico/creditos-pymes-nafin-2026/', what: 'Crédito para capital de trabajo de negocios que empiezan', price: 'hasta $500,000 a 3 años', note: 'Se tramita con bancos afiliados' },
  { name: 'NAFIN / Bancomext · modernización de maquinaria', category: 'financiamiento', url: 'https://www.cronica.com.mx/nacional/bancomext-nafin-financiaran-programas-modernizacion-maquinaria-equipo-pymes.html', what: 'Crédito y arrendamiento para maquinaria y equipo', price: 'programa para MiPyMEs', note: 'Sirve para comprar la cortadora láser' },
  { name: 'YoloEnvío', category: 'envios', url: 'https://yoloenvio.com/', what: 'Comparador de paqueterías', price: 'compara en tiempo real', note: '' }
]

// Opciones para cortar la placa y los barrenos (velocidades típicas en acrílico 3 mm; precios de referencia)
export const CUT_OPTIONS = [
  { id: 'maquila', name: 'Mandar a cortar (servicio)', price: 0, perMinute: 16, areaCm: [120, 90], speed: 900, holeSec: 1.2, clear: true, note: 'Sin inversión; pagas $15–$18 por minuto de máquina' },
  { id: 'taladro', name: 'Taladro + sierra (a mano)', price: 2500, perMinute: 0, areaCm: [999, 999], speed: 150, holeSec: 8, clear: true, note: 'Barato pero lento; los barrenos quedan menos parejos' },
  { id: 'k40', name: 'Láser CO2 40 W (K40)', price: 10000, perMinute: 0, areaCm: [30, 20], speed: 480, holeSec: 1.8, clear: true, note: 'Precio aproximado; área chica: los letreros grandes se cortan por partes' },
  { id: 'diodo', name: 'Láser de diodo 20 W', price: 13500, perMinute: 0, areaCm: [40, 40], speed: 240, holeSec: 3, clear: false, note: 'No corta acrílico transparente/blanco; sí MDF y acrílico oscuro' },
  { id: 'co2-60', name: 'Láser CO2 60 W · 60 × 40 cm', price: 45000, perMinute: 0, areaCm: [60, 40], speed: 1000, holeSec: 1, clear: true, note: 'Precio aproximado de importación; la opción más equilibrada' },
  { id: 'co2-100', name: 'Láser CO2 100 W · 90 × 60 cm', price: 102586, perMinute: 0, areaCm: [90, 60], speed: 1500, holeSec: 0.8, clear: true, note: 'Referencia Stanser CRAFTER (+ IVA) con soporte en México' },
  { id: 'cnc3018', name: 'Router CNC 3018 Pro', price: 5200, perMinute: 0, areaCm: [30, 18], speed: 300, holeSec: 6, clear: true, note: 'Muy lenta para placas; sirve para barrenos exactos en piezas chicas' }
]
