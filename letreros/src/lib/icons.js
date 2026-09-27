// Catálogo de íconos para letreros LED. Íconos de trazo de Lucide (licencia ISC,
// https://lucide.dev) más algunos propios (taco, figuras de baño). Todos en 24 × 24:
// el trazo de cada ícono es justo donde van los LED.
import {
  Accessibility, Anchor, Apple, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Baby, Ban,
  Banknote, Bed, Beef, Beer, Bell, Bike, Bird, Bone, BookOpen, Cake, CakeSlice, Camera, Candy, Car,
  Cat, Check, ChefHat, Cherry, Church, Cigarette, CigaretteOff, CircleAlert, Citrus, Clapperboard,
  Clock, Coffee, Cookie, CreditCard, Croissant, Crown, CupSoda, Diamond, Dices, Dog, Donut,
  DoorOpen, Drama, Drumstick, Dumbbell, EggFried, Feather, Fish, Flame, Flower2, Fuel, Gamepad2,
  Gem, Gift, GlassWater, Glasses, GraduationCap, Guitar, Hamburger, Hammer, Hand, Headphones,
  Heart, Hospital, House, IceCreamCone, Info, Key, Lamp, Laptop, Leaf, Lightbulb, Lock, Mail,
  MapPin, Martini, Medal, MessageCircle, Mic, Milk, Moon, Mountain, Music, Paintbrush, Palette,
  PartyPopper, PawPrint, Percent, Phone, Pill, Pizza, Plane, Plug, Popcorn, Printer, Rabbit,
  Rainbow, Recycle, Rocket, Salad, Sandwich, Scissors, Shield, Shirt, ShoppingBag, ShoppingCart,
  ShowerHead, Shrimp, Smartphone, Smile, Snowflake, Sofa, Soup, Sparkles, Sprout, SquareParking,
  Squirrel, Star, Stethoscope, Store, Sun, Tag, ThumbsUp, Ticket, Toilet, TrafficCone, TreePalm,
  Trophy, Truck, Turtle, Umbrella, UtensilsCrossed, Vegan, Watch, Wheat, Wifi, Wine, Wrench, Zap
} from 'lucide-static'

const L = { Accessibility, Anchor, Apple, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, Baby, Ban, Banknote, Bed, Beef, Beer, Bell, Bike, Bird, Bone, BookOpen, Cake, CakeSlice, Camera, Candy, Car, Cat, Check, ChefHat, Cherry, Church, Cigarette, CigaretteOff, CircleAlert, Citrus, Clapperboard, Clock, Coffee, Cookie, CreditCard, Croissant, Crown, CupSoda, Diamond, Dices, Dog, Donut, DoorOpen, Drama, Drumstick, Dumbbell, EggFried, Feather, Fish, Flame, Flower2, Fuel, Gamepad2, Gem, Gift, GlassWater, Glasses, GraduationCap, Guitar, Hamburger, Hammer, Hand, Headphones, Heart, Hospital, House, IceCreamCone, Info, Key, Lamp, Laptop, Leaf, Lightbulb, Lock, Mail, MapPin, Martini, Medal, MessageCircle, Mic, Milk, Moon, Mountain, Music, Paintbrush, Palette, PartyPopper, PawPrint, Percent, Phone, Pill, Pizza, Plane, Plug, Popcorn, Printer, Rabbit, Rainbow, Recycle, Rocket, Salad, Sandwich, Scissors, Shield, Shirt, ShoppingBag, ShoppingCart, ShowerHead, Shrimp, Smartphone, Smile, Snowflake, Sofa, Soup, Sparkles, Sprout, SquareParking, Squirrel, Star, Stethoscope, Store, Sun, Tag, ThumbsUp, Ticket, Toilet, TrafficCone, TreePalm, Trophy, Truck, Turtle, Umbrella, UtensilsCrossed, Vegan, Watch, Wheat, Wifi, Wine, Wrench, Zap }

const inner = (svg) => svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim()

// Dibujos propios (estilo de trazo, 24 × 24)
const CUSTOM = {
  taco:
    '<path d="M2 19a10 10 0 0 1 20 0z" /><path d="M6.5 19a5.5 5.5 0 0 1 11 0" />' +
    '<path d="M3.6 13.4c.9-.3 1.3-1.2 2.2-1.4s1.6.4 2.4 0 1-1.4 1.9-1.6 1.5.6 2.4.6 1.5-.8 2.4-.6 1 1.2 1.9 1.6 1.6-.2 2.4 0 1.3 1.1 2.2 1.4" />',
  hombre:
    '<circle cx="12" cy="4" r="2.2" /><path d="M8.5 8.5h7v7h-1.8V22h-3.4v-6.5H8.5z" />',
  mujer:
    '<circle cx="12" cy="4" r="2.2" /><path d="M12 8.5 7.5 17h9z" /><path d="M10.4 17v5" /><path d="M13.6 17v5" />',
  chile:
    '<path d="M15.5 6.5c2 .8 3 2.6 2.7 4.8-.6 4.6-6.4 9.8-13.7 10.2 3.5-2.4 5.9-5.6 6.9-9.8.6-2.7 2.1-5.3 4.1-5.2z" /><path d="M15.5 6.5c.2-1.8 1.2-3.2 2.8-4" />',
  wc:
    '<path d="M3 7l2 10 2-7 2 7 2-10" /><path d="M20.5 9.5A3.5 3.5 0 1 0 20.5 15.5" />'
}

const pick = (cat, entries) =>
  entries.map(([id, name, src]) => ({
    id,
    name,
    cat,
    body: CUSTOM[src] || inner(L[src] || '')
  }))

export const ICON_CATEGORIES = ['Comida', 'Mascotas', 'Negocios', 'Señalética', 'Decoración']

export const ICONS = [
  ...pick('Comida', [
    ['taco', 'Taco', 'taco'], ['chile', 'Chile', 'chile'], ['hamburguesa', 'Hamburguesa', 'Hamburger'],
    ['pizza', 'Pizza', 'Pizza'], ['sandwich', 'Torta', 'Sandwich'], ['cafe', 'Café', 'Coffee'],
    ['refresco', 'Refresco', 'CupSoda'], ['cerveza', 'Cerveza', 'Beer'], ['vino', 'Vino', 'Wine'],
    ['coctel', 'Coctel', 'Martini'], ['helado', 'Helado', 'IceCreamCone'], ['pastel', 'Pastel', 'CakeSlice'],
    ['dona', 'Dona', 'Donut'], ['pan', 'Pan', 'Croissant'], ['restaurante', 'Restaurante', 'UtensilsCrossed'],
    ['chef', 'Chef', 'ChefHat'], ['sopa', 'Sopa', 'Soup'], ['pollo', 'Pollo', 'Drumstick'],
    ['palomitas', 'Palomitas', 'Popcorn'], ['cereza', 'Cereza', 'Cherry'], ['dulce', 'Dulce', 'Candy'],
    ['pastelentero', 'Pastel', 'Cake'], ['galleta', 'Galleta', 'Cookie'], ['huevo', 'Desayunos', 'EggFried'], ['ensalada', 'Ensalada', 'Salad'], ['carne', 'Carnes', 'Beef'], ['camaron', 'Mariscos', 'Shrimp'], ['leche', 'Lácteos', 'Milk'], ['agua', 'Agua', 'GlassWater'], ['manzana', 'Fruta', 'Apple'], ['citrico', 'Jugos', 'Citrus'], ['trigo', 'Panadería', 'Wheat'], ['vegano', 'Vegano', 'Vegan']
  ]),
  ...pick('Mascotas', [
    ['perro', 'Perro', 'Dog'], ['gato', 'Gato', 'Cat'], ['huella', 'Huella', 'PawPrint'],
    ['hueso', 'Hueso', 'Bone'], ['conejo', 'Conejo', 'Rabbit'], ['ave', 'Ave', 'Bird'], ['pez', 'Pez', 'Fish'],
    ['tortuga', 'Tortuga', 'Turtle'], ['ardilla', 'Ardilla', 'Squirrel']
  ]),
  ...pick('Negocios', [
    ['tijeras', 'Barbería', 'Scissors'], ['auto', 'Auto', 'Car'], ['taller', 'Taller', 'Wrench'],
    ['telefono', 'Teléfono', 'Phone'], ['celular', 'Celular', 'Smartphone'], ['wifi', 'Wi-Fi', 'Wifi'],
    ['casa', 'Casa', 'House'], ['tienda', 'Tienda', 'Store'], ['carrito', 'Súper', 'ShoppingCart'],
    ['bolsa', 'Boutique', 'ShoppingBag'], ['farmacia', 'Farmacia', 'Pill'], ['gym', 'Gym', 'Dumbbell'],
    ['flor', 'Florería', 'Flower2'], ['ropa', 'Ropa', 'Shirt'], ['joya', 'Joyería', 'Gem'],
    ['foto', 'Foto', 'Camera'], ['arte', 'Arte', 'Palette'], ['hotel', 'Hotel', 'Bed'],
    ['consultorio', 'Consultorio', 'Stethoscope'], ['imprenta', 'Imprenta', 'Printer'], ['llave', 'Cerrajería', 'Key'],
    ['bici', 'Bicicletas', 'Bike'], ['libro', 'Librería', 'BookOpen'], ['escuela', 'Escuela', 'GraduationCap'], ['viajes', 'Viajes', 'Plane'], ['optica', 'Óptica', 'Glasses'], ['guitarra', 'Música en vivo', 'Guitar'], ['audifonos', 'Audio', 'Headphones'], ['laptop', 'Computación', 'Laptop'], ['karaoke', 'Karaoke', 'Mic'], ['mudanza', 'Fletes', 'Truck'], ['gasolina', 'Gasolina', 'Fuel'], ['ferreteria', 'Ferretería', 'Hammer'], ['pintura', 'Pintura', 'Paintbrush'], ['jardin', 'Jardinería', 'Sprout'], ['hospital', 'Hospital', 'Hospital'], ['iglesia', 'Iglesia', 'Church'], ['reloj', 'Relojería', 'Watch'], ['cine', 'Cine', 'Clapperboard'], ['videojuegos', 'Videojuegos', 'Gamepad2'], ['dados', 'Juegos', 'Dices'], ['muebles', 'Mueblería', 'Sofa'], ['lampara', 'Iluminación', 'Lamp'], ['electrico', 'Electricista', 'Plug'], ['seguridad', 'Seguridad', 'Shield'], ['boletos', 'Boletos', 'Ticket'], ['teatro', 'Teatro', 'Drama']
  ]),
  ...pick('Señalética', [
    ['hombre', 'Hombres', 'hombre'], ['mujer', 'Mujeres', 'mujer'], ['wc', 'WC', 'wc'],
    ['bano', 'Baño', 'Toilet'], ['accesible', 'Accesible', 'Accessibility'], ['bebe', 'Bebé', 'Baby'],
    ['derecha', 'Flecha →', 'ArrowRight'], ['izquierda', 'Flecha ←', 'ArrowLeft'], ['arriba', 'Flecha ↑', 'ArrowUp'],
    ['abajo', 'Flecha ↓', 'ArrowDown'], ['diagonal', 'Flecha ↗', 'ArrowUpRight'], ['salida', 'Salida', 'DoorOpen'],
    ['estacionamiento', 'Estacionamiento', 'SquareParking'], ['horario', 'Horario', 'Clock'],
    ['ok', 'Listo', 'Check'], ['precaucion', 'Precaución', 'TrafficCone'],
    ['nofumar', 'No fumar', 'CigaretteOff'], ['fumar', 'Zona de fumar', 'Cigarette'], ['prohibido', 'Prohibido', 'Ban'], ['info', 'Información', 'Info'], ['atencion', 'Atención', 'CircleAlert'], ['tarjeta', 'Tarjeta', 'CreditCard'], ['efectivo', 'Efectivo', 'Banknote'], ['descuento', 'Descuento', 'Percent'], ['oferta', 'Oferta', 'Tag'], ['ubicacion', 'Ubicación', 'MapPin'], ['regadera', 'Regadera', 'ShowerHead'], ['timbre', 'Timbre', 'Bell'], ['candado', 'Privado', 'Lock'], ['reciclaje', 'Reciclaje', 'Recycle'], ['correo', 'Correo', 'Mail'], ['mensaje', 'Mensaje', 'MessageCircle']
  ]),
  ...pick('Decoración', [
    ['corazon', 'Corazón', 'Heart'], ['estrella', 'Estrella', 'Star'], ['brillos', 'Brillos', 'Sparkles'],
    ['rayo', 'Rayo', 'Zap'], ['fuego', 'Fuego', 'Flame'], ['luna', 'Luna', 'Moon'], ['sol', 'Sol', 'Sun'],
    ['musica', 'Música', 'Music'], ['regalo', 'Regalo', 'Gift'], ['corona', 'Corona', 'Crown'],
    ['fiesta', 'Fiesta', 'PartyPopper'], ['sonrisa', 'Sonrisa', 'Smile'], ['hoja', 'Hoja', 'Leaf'],
    ['diamante', 'Diamante', 'Diamond'], ['foco', 'Foco', 'Lightbulb'],
    ['arcoiris', 'Arcoíris', 'Rainbow'], ['copo', 'Copo de nieve', 'Snowflake'], ['palmera', 'Palmera', 'TreePalm'], ['montana', 'Montaña', 'Mountain'], ['cohete', 'Cohete', 'Rocket'], ['trofeo', 'Trofeo', 'Trophy'], ['medalla', 'Medalla', 'Medal'], ['pluma', 'Pluma', 'Feather'], ['like', 'Me gusta', 'ThumbsUp'], ['saludo', 'Hola', 'Hand'], ['ancla', 'Ancla', 'Anchor'], ['sombrilla', 'Sombrilla', 'Umbrella']
  ])
].filter((i) => i.body)

export const iconById = (id) => ICONS.find((i) => i.id === id)
