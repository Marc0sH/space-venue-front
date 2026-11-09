import { HttpErrorResponse } from '@angular/common/http';

//Forma del ErrorResponseDTO que devuelve el back. "errores" solo viene en errores de validación (campo -> motivo)
interface ErrorResponse {
  mensaje?: string;
  errores?: Record<string, string>;
}

//Muestra el mensaje que manda el back. Solo armamos uno propio si el back no llegó a responder
//(sin conexión, o una respuesta que no es del back, como un 502 de CloudFront)
export function mensajeDeError(error: unknown, contexto: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return `${contexto}. No se pudo conectar con el servidor.`;

    const body = error.error as ErrorResponse | null;
    const detalle = body?.errores ? Object.values(body.errores).join('. ') : body?.mensaje;
    if (detalle) return `${contexto}: ${detalle}`;
  }
  return `${contexto}. Intentá de nuevo más tarde.`;
}
