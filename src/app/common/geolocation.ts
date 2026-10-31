import { Coordenadas } from '../models/location.model';

const ERRORES_GEOLOCALIZACION: Record<number, string> = {
  1: 'No diste permiso para acceder a tu ubicación',
  2: 'No se pudo determinar tu ubicación',
  3: 'Se agotó el tiempo para obtener tu ubicación',
}

// Pide la ubicación al navegador; si falla, rechaza con un mensaje listo para mostrar
export function obtenerUbicacionActual(): Promise<Coordenadas> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Tu navegador no permite obtener la ubicación actual'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      e => reject(new Error(ERRORES_GEOLOCALIZACION[e.code] ?? 'No se pudo obtener tu ubicación')),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  })
}
