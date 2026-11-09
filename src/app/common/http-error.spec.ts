import { HttpErrorResponse } from '@angular/common/http';
import { mensajeDeError } from './http-error';

const httpError = (status: number, error: unknown = null) => new HttpErrorResponse({ status, error });

describe('mensajeDeError', () => {
  it('shows the backend message', () => {
    expect(mensajeDeError(httpError(401, { mensaje: 'Credenciales inválidas.' }), 'No se pudo iniciar sesión'))
      .toBe('No se pudo iniciar sesión: Credenciales inválidas.');
  });

  it('lists the field validation reasons', () => {
    const e = httpError(400, { mensaje: 'Los datos enviados no son válidos.', errores: { a: 'El nombre es obligatorio', b: 'El email debe ser válido' } });
    expect(mensajeDeError(e, 'No se pudo registrar')).toBe('No se pudo registrar: El nombre es obligatorio. El email debe ser válido');
  });

  it('explains connection problems', () => {
    expect(mensajeDeError(httpError(0), 'No se pudo guardar')).toBe('No se pudo guardar. No se pudo conectar con el servidor.');
  });

  it('falls back when the response is not from the backend', () => {
    expect(mensajeDeError(httpError(502, '<html>Bad Gateway</html>'), 'No se pudo guardar')).toBe('No se pudo guardar. Intentá de nuevo más tarde.');
    expect(mensajeDeError(new Error('boom'), 'No se pudo guardar')).toBe('No se pudo guardar. Intentá de nuevo más tarde.');
  });
});
