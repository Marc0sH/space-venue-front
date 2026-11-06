import type * as Leaflet from 'leaflet';

let leaflet: Promise<typeof Leaflet> | undefined

// Leaflet se carga recién cuando hace falta un mapa, así no suma ~150 kB al bundle inicial
export function cargarLeaflet() {
  leaflet ??= import('leaflet').then(m => {
    // Leaflet es CommonJS: en el build de producción el import dinámico deja la API bajo `default`
    const L = ((m as { default?: typeof Leaflet }).default ?? m) as typeof Leaflet
    // Tras el bundling Leaflet no encuentra solo las imágenes del marcador; angular.json las copia a /leaflet
    L.Icon.Default.imagePath = 'leaflet/'
    return L
  }).catch(e => {
    leaflet = undefined // Permite reintentar si falló la descarga del chunk
    throw e
  })
  return leaflet
}

export function capaOpenStreetMap(L: typeof Leaflet) {
  return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
}
