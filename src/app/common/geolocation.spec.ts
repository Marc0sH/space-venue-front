import { vi } from 'vitest';
import { obtenerUbicacionActual } from './geolocation';

describe('obtenerUbicacionActual', () => {
  let getCurrentPosition: ReturnType<typeof vi.fn>;

  const exito = (ok: PositionCallback) =>
    ok({ coords: { latitude: -34.6, longitude: -58.38 } } as GeolocationPosition);
  const falla = (code: number) => (_: PositionCallback, error: PositionErrorCallback) =>
    error({ code } as GeolocationPositionError);

  beforeEach(() => {
    getCurrentPosition = vi.fn();
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the location on the first try', async () => {
    getCurrentPosition.mockImplementation(exito);

    await expect(obtenerUbicacionActual()).resolves.toEqual({ latitude: -34.6, longitude: -58.38 });
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  //Estos son fixes para un error en el cual la ubicación solo se registraba correctamente luego de intentar detectarla dos veces.

  it('retries without high accuracy when the first try fails', async () => {
    getCurrentPosition.mockImplementationOnce(falla(2)).mockImplementationOnce(exito);

    await expect(obtenerUbicacionActual()).resolves.toEqual({ latitude: -34.6, longitude: -58.38 });
    expect(getCurrentPosition).toHaveBeenCalledTimes(2);
    expect(getCurrentPosition.mock.calls[1][2]).toMatchObject({ enableHighAccuracy: false });
  });

  it('reports the error of the retry when both tries fail', async () => {
    getCurrentPosition.mockImplementationOnce(falla(2)).mockImplementationOnce(falla(3));

    await expect(obtenerUbicacionActual()).rejects.toThrow('Se agotó el tiempo para obtener tu ubicación');
  });

  it('does not retry when permission is denied', async () => {
    getCurrentPosition.mockImplementation(falla(1));

    await expect(obtenerUbicacionActual()).rejects.toThrow('No diste permiso para acceder a tu ubicación');
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });
});
