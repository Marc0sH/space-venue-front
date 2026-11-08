import { Coordinates } from '../models/location.model';

// Photon (komoot): geocodificador basado en OpenStreetMap pensado para buscar mientras se escribe.
const PHOTON_URL = 'https://photon.komoot.io/api/'
const ZOOM_MAXIMO_SESGO = 8

export type TipoLugar = 'house' | 'street' | 'locality' | 'district' | 'city' | 'county' | 'state' | 'country' | 'other'

const NOMBRES_TIPO: Record<TipoLugar, string> = {
  house: 'Dirección',
  street: 'Calle',
  locality: 'Localidad',
  district: 'Barrio',
  city: 'Ciudad',
  county: 'Partido / Departamento',
  state: 'Provincia / Estado',
  country: 'País',
  other: 'Lugar',
}

export interface LugarEncontrado {
  nombre: string
  detalle: string
  tipo: string
  coordenadas: Coordinates
  // [[sur, oeste], [norte, este]], listo para Leaflet.fitBounds
  limites?: [[number, number], [number, number]]
  // Direcciones y puntos de interés son lo bastante precisos como para poner el marcador directamente
  exacto: boolean
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: {
    type?: TipoLugar
    name?: string
    housenumber?: string
    street?: string
    district?: string
    city?: string
    county?: string
    state?: string
    country?: string
    extent?: [number, number, number, number] // [oeste, norte, este, sur]
  }
}

export interface OpcionesBusqueda {
  // Prioriza resultados cercanos a donde está mirando el usuario
  cerca?: Coordinates & { zoom: number }
  signal?: AbortSignal
  limite?: number
}

export async function buscarLugares(texto: string, opciones: OpcionesBusqueda = {}): Promise<LugarEncontrado[]> {
  const limite = opciones.limite ?? 6
  // El Photon público solo acepta default, de, en y fr (con 'es' responde 400).
  // 'default' devuelve los nombres en el idioma local, que en Latinoamérica es español.
  // Se piden de más porque después se descartan los duplicados.
  const params = new URLSearchParams({ q: texto, lang: 'default', limit: String(limite * 2) })
  if (opciones.cerca) {
    params.set('lat', String(opciones.cerca.latitude))
    params.set('lon', String(opciones.cerca.longitude))
    // Con el zoom del mapa (ej. 12) el sesgo local pisa todo: buscar "Rosario" desde CABA devolvía
    // solo calles porteñas. Con zoom 8 y escala 0.5 ganan las ciudades y siguen apareciendo direcciones cercanas.
    params.set('zoom', String(Math.min(Math.round(opciones.cerca.zoom), ZOOM_MAXIMO_SESGO)))
    params.set('location_bias_scale', '0.5')
  }

  const respuesta = await fetch(`${PHOTON_URL}?${params}`, { signal: opciones.signal })
  if (!respuesta.ok) throw new Error(`Photon respondió ${respuesta.status}`)

  const { features } = await respuesta.json() as { features: PhotonFeature[] }
  // OSM divide las calles en tramos que llegan como resultados repetidos
  const vistos = new Set<string>()
  return features.map(aLugar).filter(lugar => {
    const clave = `${lugar.tipo}|${lugar.nombre}|${lugar.detalle}`
    if (vistos.has(clave)) return false
    vistos.add(clave)
    return true
  }).slice(0, limite)
}

export function aLugar({ geometry, properties: p }: PhotonFeature): LugarEncontrado {
  const tipo = p.type ?? 'other'
  const calle = [p.street, p.housenumber].filter(Boolean).join(' ')
  const nombre = p.name ?? (calle || p.city || p.state || p.country || 'Sin nombre')

  // Contexto de mayor a menor detalle, sin repetir el nombre (ej. "Córdoba, Córdoba, Argentina")
  const contexto = [calle, p.district, p.city, p.county, p.state, p.country]
    .filter((parte): parte is string => !!parte && parte !== nombre)
  const detalle = contexto.filter((parte, i) => contexto.indexOf(parte) === i).join(', ')

  const [longitude, latitude] = geometry.coordinates
  const e = p.extent
  return {
    nombre,
    detalle,
    tipo: NOMBRES_TIPO[tipo] ?? NOMBRES_TIPO.other,
    coordenadas: { latitude, longitude },
    limites: e ? [[e[3], e[0]], [e[1], e[2]]] : undefined,
    exacto: tipo === 'house' || tipo === 'other',
  }
}
