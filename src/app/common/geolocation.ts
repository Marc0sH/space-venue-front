import { Coordinates } from '../models/location.model';

export const geolocalizacionDisponible = () => 'geolocation' in navigator

// Indexado por GeolocationPositionError.code
const PERMISO_DENEGADO = 1
const ERRORES_GEOLOCALIZACION: Record<number, string> = {
  1: 'No diste permiso para acceder a tu ubicación. Podés habilitarlo desde la configuración del navegador.',
  2: 'No se pudo determinar tu ubicación.',
  3: 'Se tardó demasiado en obtener tu ubicación. Probá de nuevo.',
}

// Si falla, llama a error con un mensaje listo para mostrar al usuario
export function obtenerUbicacionActual(
  ok: (ubicacion: Coordinates) => void,
  error: (mensaje: string) => void,
  altaPrecision = true
) {
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => ok({ latitude: coords.latitude, longitude: coords.longitude }),
    (e) => {
      // Sin GPS, la primera ubicación de alta precisión suele tardar más que el timeout:
      // se reintenta con la de baja precisión (por red), que responde más rápido
      if (altaPrecision && e.code !== PERMISO_DENEGADO) {
        obtenerUbicacionActual(ok, error, false)
        return
      }
      error(ERRORES_GEOLOCALIZACION[e.code] ?? ERRORES_GEOLOCALIZACION[2])
    },
    altaPrecision
      ? { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      : { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
  )
}
