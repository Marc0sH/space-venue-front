import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { LocationPicker } from './location-picker';

describe('LocationPicker', () => {
  let component: LocationPicker;
  let fixture: ComponentFixture<LocationPicker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationPicker],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationPicker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('asks to pick a location while there is none', () => {
    expect(fixture.nativeElement.textContent).toContain('hacé clic en el mapa');
  });

  it('shows the selected coordinates', async () => {
    component.value.set({ latitude: -34.6037, longitude: -58.3816 });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Latitud -34.6037, longitud -58.3816');
  });

  describe('buscador de lugares', () => {
    const respuestaPhoton = (features: unknown[]) =>
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ features })));

    afterEach(() => vi.restoreAllMocks());

    it('lists the places found', async () => {
      const fetch = respuestaPhoton([
        { geometry: { coordinates: [-60.64, -32.95] }, properties: { type: 'city', name: 'Rosario', state: 'Santa Fe', country: 'Argentina' } },
      ]);

      await component.buscar('Rosario');
      fixture.detectChanges();

      expect(String(fetch.mock.calls[0][0])).toContain('q=Rosario');
      const opciones = fixture.nativeElement.querySelectorAll('[role="option"]');
      expect(opciones.length).toBe(1);
      expect(opciones[0].textContent).toContain('Rosario');
      expect(opciones[0].textContent).toContain('Santa Fe, Argentina');
    });

    it('does not set the marker when a city is chosen', async () => {
      respuestaPhoton([{ geometry: { coordinates: [-60.64, -32.95] }, properties: { type: 'city', name: 'Rosario' } }]);
      await component.buscar('Rosario');

      component.elegirLugar(component.sugerencias()[0]);

      expect(component.value()).toBeNull();
      expect(component.listaAbierta()).toBe(false);
    });

    it('sets the marker when an exact address is chosen', async () => {
      respuestaPhoton([{ geometry: { coordinates: [-58.3816123, -34.6037456] }, properties: { type: 'house', street: 'Av. Corrientes', housenumber: '1234' } }]);
      await component.buscar('Corrientes 1234');

      component.elegirLugar(component.sugerencias()[0]);

      expect(component.value()).toEqual({ latitude: -34.603746, longitude: -58.381612 });
      expect(component.textoBusqueda()).toBe('Av. Corrientes 1234');
    });

    it('picks the first suggestion with Enter without submitting the form', async () => {
      respuestaPhoton([{ geometry: { coordinates: [-58.38, -34.6] }, properties: { type: 'other', name: 'Teatro Colón' } }]);
      await component.buscar('Teatro Colón');

      const evento = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
      component.alPresionarTecla(evento);

      expect(evento.defaultPrevented).toBe(true);
      expect(component.value()).toEqual({ latitude: -34.6, longitude: -58.38 });
    });

    it('shows an error when the search fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      await component.buscar('Rosario');
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('No se pudo buscar el lugar');
    });
  });

  describe('con geolocalización', () => {
    let getCurrentPosition: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      getCurrentPosition = vi.fn();
      Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition }, configurable: true });

      fixture = TestBed.createComponent(LocationPicker);
      component = fixture.componentInstance;
      await fixture.whenStable();
    });

    afterEach(() => {
      delete (navigator as { geolocation?: Geolocation }).geolocation;
    });

    it('uses the current position when the button is clicked', () => {
      getCurrentPosition.mockImplementation((ok: PositionCallback) =>
        ok({ coords: { latitude: -34.60371234, longitude: -58.38159876 } } as GeolocationPosition));

      fixture.nativeElement.querySelector('button.ubicacion-actual').click();

      expect(component.value()).toEqual({ latitude: -34.603712, longitude: -58.381599 });
    });

    it('retries with low accuracy when the high accuracy request times out', () => {
      getCurrentPosition
        .mockImplementationOnce((_: PositionCallback, error: PositionErrorCallback) =>
          error({ code: 3 } as GeolocationPositionError))
        .mockImplementationOnce((ok: PositionCallback) =>
          ok({ coords: { latitude: -34.6, longitude: -58.4 } } as GeolocationPosition));

      fixture.nativeElement.querySelector('button.ubicacion-actual').click();

      expect(getCurrentPosition).toHaveBeenCalledTimes(2);
      expect(getCurrentPosition.mock.calls[1][2]).toMatchObject({ enableHighAccuracy: false });
      expect(component.value()).toEqual({ latitude: -34.6, longitude: -58.4 });
      expect(component.errorUbicacion()).toBe('');
    });

    it('shows the timeout message when the retry also fails', () => {
      getCurrentPosition.mockImplementation((_: PositionCallback, error: PositionErrorCallback) =>
        error({ code: 3 } as GeolocationPositionError));

      fixture.nativeElement.querySelector('button.ubicacion-actual').click();

      expect(getCurrentPosition).toHaveBeenCalledTimes(2);
      expect(component.errorUbicacion()).toContain('Se tardó demasiado');
    });

    it('explains when the location permission is denied', () => {
      getCurrentPosition.mockImplementation((_: PositionCallback, error: PositionErrorCallback) =>
        error({ code: 1 } as GeolocationPositionError));

      fixture.nativeElement.querySelector('button.ubicacion-actual').click();
      fixture.detectChanges();

      expect(getCurrentPosition).toHaveBeenCalledTimes(1);
      expect(component.value()).toBeNull();
      expect(fixture.nativeElement.textContent).toContain('No diste permiso');
    });
  });
});
