// Directorio de proveedores por material y pieza (investigación de septiembre 2026).
// Regla: cada material, pieza, corte o ensamble tiene al menos 5 proveedores reales (lo revisa una prueba automática).
// Los precios son de referencia: confirma antes de comprar.
export const SUPPLIER_CATEGORIES = [
  { id: 'led', name: 'LED 5 mm', material: true },
  { id: 'electronica', name: 'Capacitores, puentes y resistencias', material: true },
  { id: 'fuentes', name: 'Fuentes de poder 12 V', material: true },
  { id: 'tiras', name: 'Tiras LED y neón flex', material: true },
  { id: 'acrilico', name: 'Acrílico', material: true },
  { id: 'espejo', name: 'Acrílico espejo / dorado', material: true },
  { id: 'pvc', name: 'PVC espumado', material: true },
  { id: 'mdf', name: 'MDF', material: true },
  { id: 'vinil', name: 'Vinil de texturas', material: true },
  { id: 'herrajes', name: 'Separadores (standoff)', material: true },
  { id: 'tornilleria', name: 'Taquetes y pijas', material: true },
  { id: 'cinchos', name: 'Cinchos / bridas', material: true },
  { id: 'cables', name: 'Cable', material: true },
  { id: 'conectores', name: 'Clemas y conectores', material: true },
  { id: 'soldadura', name: 'Soldadura y termofit', material: true },
  { id: 'adhesivos', name: 'Cinta y adhesivos', material: true },
  { id: 'colgante', name: 'Cable de acero, cadenas y ménsulas', material: true },
  { id: 'empaque', name: 'Empaque', material: true },
  { id: 'pcb', name: 'Placas de circuito (PCB)', material: true },
  { id: 'ensamble', name: 'Ensamble electrónico', material: true },
  { id: 'maquila', name: 'Corte por servicio', material: true },
  { id: 'maquinas', name: 'Máquinas y herramienta', material: true },
  { id: 'envios', name: 'Envíos', material: true },
  { id: 'pagos', name: 'Cobro con tarjeta' },
  { id: 'financiamiento', name: 'Financiamiento' },
  { id: 'otro', name: 'Otro' }
]

const S = (category, name, url, what, price = 'cotiza', note = '') => ({ category, name, url, what, price, note })

export const SUPPLIERS = [
  // LED 5 mm
  S('led', 'Geek Factory', 'https://www.geekfactory.mx/producto/millar-de-led-ultra-brillante-5-mm-en-varios-colores/', 'Millar de LED 5 mm ultrabrillante, 7 colores', 'desde $265 el millar (≈ $0.27 c/u)', 'El más barato por volumen'),
  S('led', 'Steren', 'https://www.steren.com.mx/led-ultrabrillante-de-5-mm-color-rojo.html', 'LED 5 mm ultrabrillante rojo, azul, blanco, violeta, RGB', 'rojo $1.10 c/u · azul $1.30', 'Tiendas en todo el país: para reponer'),
  S('led', '330ohms', 'https://330ohms.myshopify.com/products/led-blanco-ultrabrillante-5mm', 'LED blanco ultrabrillante 5 mm, bolsa de 100', 'por bolsa de 100', '3.5–4 V'),
  S('led', 'UNIT Electronics', 'https://uelectronics.com/producto/led-ultrabrillante-5mm/', 'LED ultrabrillante 5 mm por color', 'por pieza / bolsa'),
  S('led', 'AG Electrónica', 'https://agelectronica.com/detalle?busca=LED-W5D-UB-R30', 'LED DIP 5 mm rojo ultrabrillante 20,000–40,000 mcd', 'catálogo', 'Envío inmediato'),
  S('led', 'MercadoLibre · LED mayoreo', 'https://listado.mercadolibre.com.mx/leds-por-mayoreo', 'Bolsas de 100 a 1000 LED por color', 'compara vendedores', 'Pide muestra de brillo'),
  // Capacitores, puentes, resistencias
  S('electronica', 'Steren', 'https://www.steren.com.mx/proyectos-de-electronica/capacitores', 'Capacitores de poliéster, puentes rectificadores 400 V', 'mayoreo desde 25 piezas'),
  S('electronica', 'AG Electrónica', 'https://agelectronica.com/detalle?busca=CP-.47%2F400V-FARAD', 'Capacitor 0.47 µF 400 V (474J), 2W10, resistencias, SCR', 'precio por volumen'),
  S('electronica', 'Electrónica Max', 'https://www.electronica-max.com/Capacitor-de-Poliester-0-47uF-400V-474J-CP-47uF-400V,4679_37', 'Capacitor poliéster 474J 400 V', 'por pieza'),
  S('electronica', 'MV Electrónica', 'https://mvelectronica.com/producto/474j-470nf-0-47uf-250v-capacitor-de-poliester', 'Capacitores de poliéster 474J', 'por pieza', 'Revisa que sea de 400 V'),
  S('electronica', 'MercadoLibre · 474J 400 V', 'https://articulo.mercadolibre.com.mx/MLM-1465972461-5-pzas-capacitor-de-poliester-400v-470nf-474j-p15-_JM', 'Paquete de 5 capacitores 474J 400 V', 'por paquete'),
  S('electronica', 'Geek Factory', 'https://www.geekfactory.mx/', 'NE555, CD4017, resistencias e insumos', 'por pieza'),
  // Fuentes
  S('fuentes', 'Mean Well Shop México', 'https://www.meanwellshop.mx/shop/lrs-100-12-lrs-100-12-1541', 'Fuentes Mean Well LRS 12 V (35–1200 W)', 'LRS-100-12: $420 + IVA', '3 años de garantía'),
  S('fuentes', 'Illuminer LED', 'https://illuminer.com.mx/producto/lrs-100-12/', 'Mean Well LRS-100-12 y LRS-150-12', 'LRS-100-12 ≈ $552'),
  S('fuentes', 'meanwell.mx', 'https://meanwell.mx/shop/enclosed/476-lrs-100-12.html', 'Mean Well LRS-100-12 (distribuidor)', 'cotiza'),
  S('fuentes', 'Steren · eliminadores', 'https://www.steren.com.mx/eliminador-regulado-de-12-vcc-2-a-para-tiras-led.html', 'Eliminador regulado 12 V 2 A para tiras; 12 V 5 A', 'por pieza', 'Para letreros chicos a 12 V'),
  S('fuentes', 'Cyberpuerta', 'https://www.cyberpuerta.mx/Energia/Cargadores-Baterias-Pilas/Adaptadores-de-Energia-Universal/Steren-Eliminador-de-Corriente-para-Luces-LED-ELI-1250-12V.html', 'Steren ELI-1250 12 V 3 A para luces LED', '$230'),
  // Tiras LED y neón flex
  S('tiras', 'GoLed', 'https://www.goled.com.mx/products/tira-led-interior-2835-12v-5m-ml-st2835-120bb', 'Tira 2835 12 V 120 LED/m, rollo 5 m', 'por rollo', '9.6 W/m, ≈ 800 lm/m'),
  S('tiras', 'Duraled', 'https://duraled.com.mx/product/carrete-5-m-tira-de-led-duraled-2835-120-leds-m/', 'Carrete 5 m tira 2835 120 y 240 LED/m', 'por carrete'),
  S('tiras', 'MercadoLibre · tira 2835 12 V', 'https://listado.mercadolibre.com.mx/tira-led-12v-2835', 'Tiras 2835 12 V por rollo', 'compara vendedores'),
  S('tiras', 'Neon Bit México', 'https://neonbitmx.com/', 'Neón flex por mayoreo, LED y fuentes', 'mayoreo'),
  S('tiras', 'Signalux', 'https://signalux.mx/producto/led-neon-flex-premium-6x12/', 'Neón flex premium 6 × 12 mm', 'por metro / rollo', '12 V ≈ 8 W/m, IP67'),
  S('tiras', 'Suministros AG', 'https://tienda.suministrosag.mx/cd/categorias/neon-flex/neon-flex-led-6-mm-x-5-mts/', 'Neón flex LED 6 mm × 5 m', 'por rollo'),
  // Acrílico
  S('acrilico', 'Suministros AG (Resplander)', 'https://tienda.suministrosag.mx/cd/categorias/rigidos/acrilico-resplander-cristal-1.22-x-2.44-de-3mm/', 'Acrílico 3 mm 1.22 × 2.44 cristal, blanco y negro', 'por hoja', 'Especial para anuncios'),
  S('acrilico', 'Pochteca Papel', 'https://tiendapapel.pochteca.net/hoja-acrilico-cristal-3mm-1-22x2-44-sic.html', 'Hoja acrílico cristal 3 mm 1.22 × 2.44', 'envío gratis CDMX desde $3,000 + IVA'),
  S('acrilico', 'Acrilfrasa', 'https://www.acrilfrasa.mx/', 'Acrílico extruido 3 mm 1.20 × 2.40', 'por hoja'),
  S('acrilico', 'Acrycell', 'https://acrycell.com/', 'Láminas de acrílico 2 a 6 mm', 'por hoja o corte'),
  S('acrilico', 'Plásticos y Acrílicos Jize', 'https://plasticosyacrilicosjize.com.mx/lamina-de-acrilico-transparente.html', 'Acrílico por hoja o por porción', 'venta por pieza', 'Más de 50 años'),
  // Acrílico espejo / dorado (acabados espejo, oro, oro rosa, cobre)
  S('espejo', 'Pochteca Papel', 'https://tiendapapel.pochteca.net/hoja-acrilico-espejo-dorado-3mm-1-22-x-2-44-m.html', 'Acrílico espejo dorado 3 mm 1.22 × 2.44', 'por hoja'),
  S('espejo', 'Acrílicos Newton', 'https://newton.com.mx/producto/acrilico-espejo-plata/', 'Acrílico espejo plata 3 mm 1.22 × 2.44', 'por hoja'),
  S('espejo', 'Plásticos y Acrílicos Jize', 'https://plasticosyacrilicosjize.com.mx/lamina-de-acrilico-espejo.html', 'Lámina de acrílico espejo', 'por hoja o porción'),
  S('espejo', 'Turbo Laser GDL', 'https://www.turbolasergdl.com/product-page/acr%C3%ADlico-espejo-plateado-l%C3%A1mina-1-22m-x-2-44m-3-mm-alto-impacto', 'Acrílico espejo plateado alto impacto 3 mm', 'por hoja', 'Guadalajara'),
  S('espejo', 'Plastiglas', 'https://www.plastiglas.com.mx/product/19', 'Lámina espejo (fabricante)', 'distribuidores'),
  S('espejo', 'MercadoLibre · acrílico espejo', 'https://listado.mercadolibre.com.mx/lamina-acrilico-dorado-espejo', 'Espejo dorado y plata en varias medidas', 'desde ≈ $299'),
  // PVC
  S('pvc', 'Show Depot (Trovicel)', 'https://www.showdepot-tienda.com/TROVICEL-PVC-ESPUMADO-BLANCO-1-22-X-2-44-M-6MM,88_60', 'PVC espumado 6 mm 1.22 × 2.44', 'por hoja'),
  S('pvc', 'Plasco', 'https://plasco.mx/producto/pvc/', 'PVC / Trovicel 6 mm en colores', 'por hoja'),
  S('pvc', 'Pogalmex (Sintra)', 'https://pogalmex.com.mx/suministro-de-materiales/', 'Sintra PVC espumado 1.22 × 2.44', 'distribuidor'),
  S('pvc', 'Plastitec', 'https://www.plastitec.mx/sintra.html', 'PVC espumado marca Sintra y otras', 'cotiza'),
  S('pvc', 'Suministros AG', 'https://tienda.suministrosag.mx/cd/categorias/rigidos/lamina-blanca-pvc-6-mm-1.22-x-2.44/', 'Lámina blanca PVC 6 mm 1.22 × 2.44', 'por hoja'),
  S('pvc', 'MercadoLibre · Sintra 6 mm', 'https://listado.mercadolibre.com.mx/sintra-pvc-espumado-6mm', 'PVC espumado 6 mm', 'de < $300 a > $1,000 según medida'),
  // MDF
  S('mdf', 'The Home Depot', 'https://www.homedepot.com.mx/b/materiales-de-construccion/paneles-de-madera/mdf', 'MDF 6 mm 1.22 × 2.44', 'por hoja', 'Corte en tienda'),
  S('mdf', 'Sodimac', 'https://www.sodimac.com.mx/sodimac-mx/category/cat11437/Hojas-de-MDF', 'Hojas de MDF', 'por hoja'),
  S('mdf', 'Total Market', 'https://www.totalmarket.com.mx/product/mdf-blanco-6-mm-1-cara/', 'MDF blanco 6 mm una cara', 'por hoja'),
  S('mdf', 'Maderas Triplay', 'https://www.maderastriplay.com/guia/mdf-6mm/', 'MDF 6 mm precio de mayoreo', 'mayoreo'),
  S('mdf', 'Tableros de México', 'https://tableros.com.mx/mdf-enchapado-precios/', 'MDF enchapado en madera natural', 'lista de precios', 'Para acabado madera real'),
  S('mdf', 'MercadoLibre · MDF 6 mm', 'https://listado.mercadolibre.com.mx/placa-mdf-6mm-1.22-x-2.44', 'Placa MDF 6 mm 1.22 × 2.44', 'compara'),
  // Vinil de texturas
  S('vinil', 'Proveedora de las Artes Gráficas', 'https://proveedoradelasartesgraficas.com.mx/products/vinil-de-corte-imitacion-madera-roble-61-cm-ancho', 'Vinil imitación madera roble 61 cm', 'por metro'),
  S('vinil', 'Moritzu', 'https://moritzu.com.mx/tienda/vinil/vinil-autoadhesivo/autpadhesivo-de-rotulacion/vinil-autoadhesivo-efecto-marmol-60cm-ancho/', 'Vinil efecto mármol y madera 60 cm', 'por metro'),
  S('vinil', 'DECOFILM', 'https://decopvc.mx/products/vinil-autoadherible-madera-en-rollo-0-60x5m-decofilm%C2%AE', 'Rollo 0.60 × 5 m madera / mármol', 'por rollo (3 m²)'),
  S('vinil', 'Think Publicidad', 'https://www.thinkpublicidad.com.mx/producto/vinil-adhesivo-tipo-madera-it406-1-23-m-ancho-x-metro/', 'Vinil tipo madera 1.23 m de ancho', 'por metro'),
  S('vinil', '3d4 Designers', 'https://www.3d4.com.mx/collections/viniles/vinil-adhesivo', 'Viniles adhesivos y de rotulación', 'por metro'),
  S('vinil', 'Econotransfer', 'https://econotransfer.com.mx/tienda/busqueda.php?top_idcate=1', 'Vinil adhesivo', 'por metro'),
  // Separadores
  S('herrajes', 'Avance y Tec', 'https://avanceytec.com.mx/productos/plasticos/accesorios-para-manufacturas-de-plastico/soportes-para-anuncios-y-letreros-standoff/', 'Separadores de aluminio, latón e inoxidable para anuncios', 'por pieza / paquete', 'Chihuahua y SLP'),
  S('herrajes', 'MercadoLibre · standoff inox', 'https://www.mercadolibre.com.mx/letrero-de-pared-de-acero-inoxidable-standoff-screw-12-x-1/p/MLM2002017598', 'Standoff inox 1/2" × 1" con taquetes', 'paquetes de 4 a 12'),
  S('herrajes', 'Amazon México · separadores', 'https://www.amazon.com.mx/Standoff-Tornillos-publicitarios-inoxidable-Soportes/dp/B07SZMTK3S', '8 separadores inox 1" × 1" con taquetes', 'por paquete'),
  S('herrajes', 'MercadoLibre · separadores aluminio', 'https://listado.mercadolibre.com.mx/separadores-y-letras-de-aluminio-para-anuncios-publicitarios', 'Separadores de aluminio para anuncios', 'compara'),
  S('herrajes', 'Alibaba (importación)', 'https://spanish.alibaba.com/g/acrylic-letter-standoff.html', 'Separadores por cientos directo de fábrica', 'mayoreo', 'Tarda semanas; conviene por volumen'),
  // Taquetes y pijas
  S('tornilleria', 'Truper FIERO · kit taquete 3/8"', 'https://www.truper.com/ficha_tecnica/Juego-de-taquete-y-pija-con-broca-3-8.html?code=40161', '20 taquetes 3/8" + pijas #12 + broca', 'kit', 'Para concreto y ladrillo'),
  S('tornilleria', 'Truper FIERO · tablaroca', 'https://www.truper.com/ficha_tecnica/controllers/index.php?codigo=40743', '20 taquetes 1/2" para panel de yeso con pijas #8', 'kit', 'Autotaladrante'),
  S('tornilleria', 'MercadoLibre · taquetes Truper', 'https://listado.mercadolibre.com.mx/taquetes-para-tablaroca-truper', 'Taquetes para tablaroca y concreto', 'de < $100 a $250'),
  S('tornilleria', 'Thorsmex', 'https://thorsmex.mx/taquetes/', 'Taquetes para concreto, tablaroca y ladrillo hueco', 'cotiza'),
  S('tornilleria', 'FBC México', 'https://www.conexionespvc.com/product-page/taquete-para-tablaroca-1-2-truper', 'Taquete para tablaroca 1/2" Truper', 'por pieza'),
  // Cinchos
  S('cinchos', 'Steren', 'https://www.steren.com.mx/bolsa-de-100-cinchos-sujetacables-medianos-color-negro.html', 'Cinchos negros 19 cm / 22 kg (y 15 cm, 45 cm)', 'bolsa de 100'),
  S('cinchos', 'Truper', 'https://www.truper.com/material-electrico/cables-y-accesorios/cinchos', 'Cinchos plásticos 100 a 200 mm', 'bolsa de 100'),
  S('cinchos', 'The Home Depot', 'https://www.homedepot.com.mx/p/steren-bolsa-con-100-cinchos-47mmx168mm-wl-425-161421', 'Bolsa con 100 cinchos 4.7 × 168 mm', 'bolsa de 100'),
  S('cinchos', 'Home Depot Pro', 'https://pro.homedepot.com.mx/pro/electrico/cables-electricos-y-accesorios/accesorios-para-cables-electricos/bolsa-con-100-cinchos-blanco-chico-25mm-x-96mm-161422', 'Cinchos blancos chicos 2.5 × 96 mm', 'precio profesional'),
  S('cinchos', 'MercadoLibre · cinchos Truper', 'https://listado.mercadolibre.com.mx/cinchos-truper', 'Cinchos Truper varios tamaños', 'de < $100 a $400'),
  // Cable
  S('cables', 'Steren', 'https://www.steren.com.mx/cable-esta-ado-para-conexiones-22-awg-color-rojo-vta.html', 'Cable estañado 22 AWG rojo / negro', '$4 por metro · $2.50 desde 100 m'),
  S('cables', 'PCEL', 'https://www.pcel.com/STEREN-C22N-100-Cable-estanado-Steren-para-conexiones-Calibre-22-AWG-Color-Negro-Precio-por-metro-411444', 'Cable Steren 22 AWG por metro', 'por metro'),
  S('cables', 'Cyberpuerta', 'https://www.cyberpuerta.mx/Computo-Hardware/Cables/Cables-por-Metro/Steren-Cable-Duplex-22-AWG-Negro-Rojo-Precio-por-Metro.html', 'Cable dúplex 22 AWG negro/rojo', 'por metro'),
  S('cables', 'Abasteo', 'https://www.abasteo.mx/Computo-y-Hardware/Cables/Cables-por-Metro/Steren-Cable-Duplex-Polarizado-22-AWG-Transparente-Precio-por-Metro.html', 'Cable dúplex polarizado 22 AWG', 'por metro'),
  S('cables', 'UNIT Electronics', 'https://uelectronics.com/producto/cable-duplex-para-bocina-22-awg-2-vias-bicolor-1-metro/', 'Cable dúplex 22 AWG bicolor', 'por metro'),
  S('cables', 'AG Electrónica', 'https://agelectronica.com/detalle?busca=CABLE-DUPLEX-DP-22', 'Cable dúplex 22', 'por metro'),
  // Clemas y conectores
  S('conectores', 'Geek Factory', 'https://geekfactory.mx/tienda/cables-y-conectores/bornera-2-vias-terminal-para-pcb-estandar-5-08-mm', 'Bornera PCB 2–4 vías 5.08 mm', 'desde $3'),
  S('conectores', 'PlayLux (Wago)', 'https://playlux.mx/collections/wago', 'Conectores de empalme Wago 221', 'por pieza / caja', 'Tienda oficial'),
  S('conectores', 'WAGO México', 'https://www.wago.com/mx-es/c/conectores', 'Conectores y bloques de terminales', 'distribuidores'),
  S('conectores', 'Newark México', 'https://mexico.newark.com/c/conectores/bloques-de-terminales-accesorios/accesorios-para-bloques-de-terminales?brand=wago', 'Bloques de terminales y accesorios', 'catálogo'),
  S('conectores', 'MercadoLibre · Wago', 'https://listado.mercadolibre.com.mx/clemas-wago', 'Clemas Wago por paquete', 'de < $200 a $400'),
  // Soldadura y termofit
  S('soldadura', 'Mundo Tool', 'https://mundotool.com/products/sol-60-40-soldadura-centricore-60-40-para-electronica', 'Soldadura Truper 60/40 núcleo de resina 450 g', '$625'),
  S('soldadura', 'Cyberpuerta', 'https://www.cyberpuerta.mx/Hogar/Herramientas/Cautines/Soldaduras/Truper-Rollo-de-Soldadura-con-Nucleo-Resina-para-Electronica-SOL-60-40-450g-Estano-Plomo-60-40.html', 'Soldadura Truper SOL-60/40 450 g', '≈ $559'),
  S('soldadura', 'El Ferretero', 'https://www.elferretero.com.mx/Carrito/Producto.aspx?NumeroProducto=14366', 'Soldadura Truper SOL-60/40', '$773'),
  S('soldadura', 'Carrod (Torreón)', 'https://www.carrod.mx/products/soldadura-450-gr-con-aleacion-estano-plomo-60-40-truper-sol-60-40', 'Soldadura 60/40 450 g', 'por rollo'),
  S('soldadura', 'Steren · termofit', 'https://www.steren.com.mx/kit-thermofit-de-colores-con-diferentes-diametros-tubo-termocontractil.html', 'Kit de termofit de colores y diámetros', 'por kit', 'Aísla las uniones de 127 V'),
  S('soldadura', 'Home Depot Pro · termofit', 'https://pro.homedepot.com.mx/pro/electrico/herramienta-y-accesorios-electricos/kit-de-thermofit-5-colores-3-16-161353', 'Kit 25 tubos termocontráctiles 3/16"', 'por kit'),
  // Adhesivos
  S('adhesivos', 'Amazon México · 3M VHB 4910', 'https://www.amazon.com.mx/VHB-Cinta-adhesiva-transferible-doble/dp/B07NPF3JR9', 'VHB transparente 19 mm × 5 m', '≈ $192'),
  S('adhesivos', 'Tienda 3M', 'https://www.tienda3m.mx/cintas-y-adhesivos/vhb', 'Cintas VHB 3M', 'catálogo oficial'),
  S('adhesivos', 'Ferrepat', 'https://www.ferrepat.com/fijacion-y-sujecion/cinta-doble-cara-vhb-7681', 'VHB gris 4611', 'por rollo'),
  S('adhesivos', 'Grainger México', 'https://www.grainger.com.mx/producto/3m-cinta-vhb-doble-cara-5-yd-gris/p/15c399', 'VHB doble cara gris 4.6 m', 'por rollo'),
  S('adhesivos', 'MercadoLibre · VHB', 'https://listado.mercadolibre.com.mx/cinta-doble-cara-3m-vhb', 'Cinta 3M VHB varias medidas', 'compara'),
  // Colgante: cable de acero, cadenas, ménsulas
  S('colgante', 'The Home Depot · cable acero cubierto', 'https://www.homedepot.com.mx/p/veker-metro-de-cable-acero-cubierto-veker1-167x7-466074-466074', 'Cable de acero cubierto 1/16" 7×7', 'por metro'),
  S('colgante', 'Amazon México · kit suspensión', 'https://www.amazon.com.mx/suspensi%C3%B3n-ajustable-inoxidable-proyectos-industrial/dp/B0B158L7YN', 'Kit de cable inoxidable ajustable para colgar', 'por kit'),
  S('colgante', 'MercadoLibre · kit cables de acero', 'https://listado.mercadolibre.com.mx/kit-de-cables-de-acero-para-colgar-lampara', 'Kits de cable de acero para colgar', 'compara'),
  S('colgante', 'MercadoLibre · ménsulas', 'https://listado.mercadolibre.com.mx/mensulas-para-colgar-letreros', 'Ménsulas para letreros de bandera', 'compara'),
  S('colgante', 'Amazon México · cadenas', 'https://www.amazon.com.mx/Healeved-Colgantes-Resistentes-Comederos-Decoraci%C3%B3n/dp/B0G5N1MLDW', '20 cadenas de 28 cm con ganchos (2 kg)', 'por paquete'),
  S('colgante', 'Fantasías Miguel', 'https://fantasiasmiguel.com/collections/cadenas-metal-aluminio', 'Cadenas de metal y aluminio', 'por metro'),
  // Empaque
  S('empaque', 'CADECA', 'https://cajas-de-carton.com/', 'Cajas de cartón a medida sencillas, dobles y triples', 'mayoreo y menudeo', 'CDMX y Edomex, 24–48 h'),
  S('empaque', 'Uline México', 'https://es.uline.mx/Product/Detail/S-18919/Heavy-Duty-Boxes/12-x-12-x-16-275-lb-Double-Wall-Corrugated-Boxes', 'Cajas de corrugado doble, esquineros, burbuja', 'catálogo'),
  S('empaque', 'MercadoLibre · cajas', 'https://listado.mercadolibre.com.mx/cajas-de-carton-corrugado', 'Cajas de cartón corrugado', 'compara'),
  S('empaque', 'MercadoLibre · Uline', 'https://listado.mercadolibre.com.mx/uline-caja-de-carton', 'Cajas Uline', 'compara'),
  S('empaque', 'Innova Empaques', 'https://www.innovaempaques.com.mx/SITIO1/services.html', 'Empaque y maquila de empaque', 'cotiza'),
  // PCB
  S('pcb', 'PCB de México', 'https://pcbdemexico.com.mx/', 'Fabricación y ensamble de circuitos impresos desde 1990', 'cotiza'),
  S('pcb', 'PCBRAPIDO', 'https://www.pcbrapido.com/', 'Manufactura y ensamble PCB, hasta en 24 h', 'cotiza'),
  S('pcb', 'Intesc (Puebla)', 'https://intesc.mx/fabricacion-de-circuitos-impresos/', 'Fabricación de circuitos impresos', 'cotiza'),
  S('pcb', 'PCB-MÉXICO', 'https://pcb-mexico.com/servicios/fabricacion-pcb/', 'Fabricación de tarjetas electrónicas', 'cotiza'),
  S('pcb', 'PCBWay', 'https://www.pcbway.es/', 'Prototipos PCB, 10 piezas en 24 h de producción', 'en línea', 'Importación'),
  S('pcb', 'JLCPCB', 'https://jlcpcb.com/', 'PCB de bajo costo para lotes chicos', 'en línea', 'Importación'),
  // Ensamble
  S('ensamble', 'Seiru', 'https://www.seiru.mx/', 'Maquila de tablillas electrónicas', 'cotiza'),
  S('ensamble', 'Selectronic Assembly', 'https://selectronicassembly.com/', 'PCBA desde prototipo hasta serie', 'cotiza'),
  S('ensamble', 'VisuaLeds', 'https://visualeds.com.mx/maquila-de-ensamble-electronico-smt-y-tht/', 'Ensamble SMT y THT, también manual', 'cotiza'),
  S('ensamble', 'VI Electronics', 'https://vielectronics.com/ensamble-electronico.html', 'Ensamble en lotes chicos', 'cotiza'),
  S('ensamble', 'PCB de México · ensamble', 'https://pcbdemexico.com.mx/', 'Integración y ensamble de tarjetas', 'cotiza'),
  // Corte por servicio
  S('maquila', 'Color Make', 'https://colormake.com/blog/cuanto-cuesta-el-corte-laser-y-como-se-calcula/', 'Referencia de precio de corte láser', '$15–$18 por minuto (centro, 2026)'),
  S('maquila', 'FIC Corte Láser', 'https://fic-cortelaser.mx/', 'Corte láser 24/7 MDF y acrílico', 'cotiza', 'CDMX'),
  S('maquila', 'Corte Láser 227', 'https://www.227.studio/cortelaser', 'Corte y grabado MDF y acrílico 3–15 mm', 'cotiza', 'CDMX'),
  S('maquila', 'By Design', 'http://www.bydesignermita.com.mx/', 'Corte láser y router CNC', 'cotiza', 'Iztapalapa, CDMX'),
  S('maquila', 'Acrivel', 'https://acrivel.jimdoweb.com/servicios/', 'Corte láser de acrílico y MDF', 'cotiza', 'Guadalajara'),
  S('maquila', 'Sinergia Publicitaria', 'https://sinergiapublicitaria.com/router-laser/296-corte-laser-y-grabado-mdf.html', 'Corte y grabado láser MDF 1.22 × 2.44', 'cotiza'),
  // Máquinas
  S('maquinas', 'Cortadora CO2 40 W (K40) · MercadoLibre', 'https://listado.mercadolibre.com.mx/cortadora-laser-k40', 'Área ≈ 30 × 20 cm; corta acrílico 3 mm y MDF', 'compara vendedores'),
  S('maquinas', 'Geek Factory · CO2 40 × 40 cm 50 W', 'https://www.geekfactory.mx/producto/cortadora-y-grabadora-laser-40-x-40-50-w/', 'Cortadora y grabadora de escritorio', 'ver precio'),
  S('maquinas', 'CO2 60–130 W · 60 × 40 / 90 × 60 cm', 'https://www.amazon.com.mx/M%C3%A1quina-grabado-l%C3%A1ser-cortadora-600mm/dp/B0892H6T51', 'Con 80 W corta MDF 8 mm en 1 pasada', 'Amazon / MercadoLibre', 'Necesita extractor y enfriador'),
  S('maquinas', 'Stanser · CRAFTER CO2', 'https://www.stanser.com/cnc-laser/', 'CO2 60–125 W con soporte en México', 'desde $102,586 + IVA'),
  S('maquinas', 'Láser de diodo 20 W', 'https://mx.sculpfun.com/collections/laser-engraver', 'MDF y acrílico OSCURO 3–5 mm', 'desde ≈ $13,500', 'No corta acrílico transparente'),
  S('maquinas', 'Router CNC 3018 / 6040', 'https://lowpi.com/precio/router-cnc-3018-pro', 'Fresadora para acrílico, PVC y MDF', '3018 desde $1,299 · Pro $5,200'),
  S('maquinas', 'Kit de soldadura Truper CAU-25ERK', 'https://mundotool.com/products/kit-soldadura-electronica-con-cautin-de-25-w-temp-regulable', 'Cautín 25 W regulable + desoldador', '≈ $565'),
  // Envíos
  S('envios', 'Envia.com', 'https://envia.com/en-US/carriers/estafeta-MX', 'Guías Estafeta, DHL, FedEx', 'peso volumétrico L×A×H / 5000'),
  S('envios', 'YoloEnvío', 'https://yoloenvio.com/', 'Comparador de paqueterías', 'tiempo real'),
  S('envios', 'DHL México', 'https://www.dhl.com/mx-es/home/envio/cotizacion-envio.html', 'Cotizador oficial', 'por envío'),
  S('envios', 'DrEnvío', 'https://drenvio.com/es-MX/cotizar-envio/dhl', 'Cotiza DHL y otras', 'por envío'),
  S('envios', 'AutoPaquete', 'https://autopaquete.com.mx/blog/estafeta-cotizar/', 'Guía para cotizar Estafeta', 'por envío'),
  // Cobro y financiamiento (servicios, no materiales)
  S('pagos', 'Mercado Pago · link de pago', 'https://atempora.studio/blog/comisiones-mercado-pago-2026', 'Link para cobrar el anticipo', '≈ 3.49 % + $4 + IVA'),
  S('pagos', 'Clip · terminal', 'https://atempora.studio/blog/comisiones-clip-2026', 'Terminal para cobrar en persona', '3.6 % + IVA'),
  S('financiamiento', 'NAFIN · crédito Micro', 'https://mundoejecutivocdmx.com/mundo-economico/creditos-pymes-nafin-2026/', 'Capital de trabajo', 'hasta $500,000 a 3 años'),
  S('financiamiento', 'NAFIN / Bancomext · maquinaria', 'https://www.cronica.com.mx/nacional/bancomext-nafin-financiaran-programas-modernizacion-maquinaria-equipo-pymes.html', 'Crédito y arrendamiento de maquinaria', 'programa MiPyME')
]

// Qué categoría de proveedores surte cada renglón de la lista de materiales
const PART_RULES = [
  [/^LED /i, 'led'],
  [/capacitor|puente|resistencia|placa [ab]|NE555|arduino|MOSFET|intermitente|PWM|atenuador/i, 'electronica'],
  [/eliminador|fuente 12/i, 'fuentes'],
  [/tira LED|neón/i, 'tiras'],
  [/separador/i, 'herrajes'],
  [/ménsula|bandera|cable de acero|gancho/i, 'colgante']
]
export const partCategory = (item) => PART_RULES.find(([re]) => re.test(item))?.[1] || null
export const suppliersFor = (category) => SUPPLIERS.filter((x) => x.category === category)

// Acabado → material con el que se hace (y sus proveedores)
export const FINISH_MATERIAL = { pino: 'vinil', roble: 'vinil', nogal: 'vinil', marmol: 'vinil', concreto: 'vinil', pizarra: 'vinil', terrazo: 'vinil', carbono: 'vinil', aluminio: 'vinil', espejo: 'espejo', oro: 'espejo', rosaoro: 'espejo', cobre: 'espejo' }

// Piezas que lleva cada letrero aunque no salgan en el diagrama eléctrico
export const HARDWARE_KIT = [
  { item: 'Cable 22 AWG rojo y negro para las cadenas', qty: '1–3 m', category: 'cables' },
  { item: 'Clemas / conectores de empalme', qty: '2–6', category: 'conectores' },
  { item: 'Soldadura 60/40 y termofit en cada unión', qty: 'lo necesario', category: 'soldadura' },
  { item: 'Cinchos para amarrar el cableado atrás', qty: '10–20', category: 'cinchos' },
  { item: 'Taquetes y pijas para la pared', qty: '2–4', category: 'tornilleria' },
  { item: 'Cinta VHB (placa trasera o base)', qty: '0.5–1 m', category: 'adhesivos' },
  { item: 'Caja de cartón, esquineros y burbuja', qty: '1', category: 'empaque' }
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
