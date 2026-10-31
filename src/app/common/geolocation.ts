import { Coordenadas } from '../models/location.model';

const ERRORES_GEOLOCALIZACION: Record<number, string> = {
  1: 'No diste permiso para acceder a tu ubicación',
  2: 'No se pudo determinar tu ubicación',
  3: 'Se agotó el tiempo para obtener tu ubicación',
}

const PERMISO_DENEGADO = 1

const ALTA_PRECISION: PositionOptions = { enableHighAccuracy: true, timeout: 10000 }
// En escritorio el primer pedido suele fallar mientras el servicio de ubicación arranca;
// el segundo intento es más tolerante: sin alta precisión, más tiempo y acepta una posición reciente
const REINTENTO: PositionOptions = { enableHighAccuracy: false, timeout: 20000, maximumAge: 5 * 60 * 1000 }

// Pide la ubicación al navegador; si falla, rechaza con un mensaje listo para mostrar
export async function obtenerUbicacionActual(): Promise<Coordenadas> {
  if (!('geolocation' in navigator)) {
    throw new Error('Tu navegador no permite obtener la ubicación actual')
  }

  try {
    return await pedirPosicion(ALTA_PRECISION)
  } catch (e) {
    // Si el usuario no dio permiso no tiene sentido volver a preguntar
    if ((e as GeolocationPositionError).code === PERMISO_DENEGADO) throw mensajeDeError(e)
  }

  try {
    return await pedirPosicion(REINTENTO)
  } catch (e) {
    throw mensajeDeError(e)
  }
}

function pedirPosicion(opciones: PositionOptions): Promise<Coordenadas> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      reject,
      opciones,
    ),
  )
}

function mensajeDeError(e: unknown) {
  return new Error(ERRORES_GEOLOCALIZACION[(e as GeolocationPositionError).code] ?? 'No se pudo obtener tu ubicación')
}
