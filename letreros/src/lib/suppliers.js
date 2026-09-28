// Directorio de proveedores (investigación de septiembre 2026). Precios orientativos: confirma antes de comprar.
export const SUPPLIER_CATEGORIES = [
  { id: 'led', name: 'LED' },
  { id: 'electronica', name: 'Electrónica' },
  { id: 'acrilico', name: 'Acrílico' },
  { id: 'pvc', name: 'PVC espumado' },
  { id: 'mdf', name: 'MDF' },
  { id: 'vinil', name: 'Vinil de texturas' },
  { id: 'envios', name: 'Envíos' },
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
  { name: 'YoloEnvío', category: 'envios', url: 'https://yoloenvio.com/', what: 'Comparador de paqueterías', price: 'compara en tiempo real', note: '' }
]
