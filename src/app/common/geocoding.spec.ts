import { vi } from 'vitest';
import { aLugar, buscarLugares } from './geocoding';

describe('buscarLugares', () => {
  afterEach(() => vi.restoreAllMocks());

  const calle = (lon: number) => ({ geometry: { coordinates: [lon, -34.6] }, properties: { type: 'street', name: 'Rosario', city: 'Buenos Aires' } });

  it('uses a language the public Photon accepts and caps the location bias', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ features: [] })));

    await buscarLugares('Rosario', { cerca: { latitude: -34.6, longitude: -58.4, zoom: 12 } });

    const url = new URL(String(fetch.mock.calls[0][0]));
    expect(url.searchParams.get('lang')).toBe('default');
    expect(url.searchParams.get('zoom')).toBe('8');
  });

  it('drops repeated street segments', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ features: [calle(-58.41), calle(-58.42)] })));

    expect((await buscarLugares('Rosario')).length).toBe(1);
  });
});


describe('aLugar', () => {
  it('converts the extent to Leaflet bounds and keeps cities approximate', () => {
    const lugar = aLugar({
      geometry: { coordinates: [-64.18, -31.41] },
      properties: { type: 'city', name: 'Córdoba', state: 'Córdoba', country: 'Argentina', extent: [-64.32, -31.3, -64.05, -31.52] },
    });

    expect(lugar).toEqual({
      nombre: 'Córdoba',
      detalle: 'Argentina',
      tipo: 'Ciudad',
      coordenadas: { latitude: -31.41, longitude: -64.18 },
      limites: [[-31.52, -64.32], [-31.3, -64.05]],
      exacto: false,
    });
  });

  it('builds the name of an address from its street and number', () => {
    const lugar = aLugar({
      geometry: { coordinates: [-58.38, -34.6] },
      properties: { type: 'house', street: 'Av. Corrientes', housenumber: '1234', city: 'Buenos Aires', country: 'Argentina' },
    });

    expect(lugar.nombre).toBe('Av. Corrientes 1234');
    expect(lugar.detalle).toBe('Buenos Aires, Argentina');
    expect(lugar.exacto).toBe(true);
    expect(lugar.limites).toBeUndefined();
  });
});
