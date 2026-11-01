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
    expect(fixture.nativeElement.textContent).toContain('Hacé clic en el mapa');
  });

  it('shows the selected coordinates', async () => {
    component.value.set({ latitude: -34.6037, longitude: -58.3816 });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Latitud -34.6037, longitud -58.3816');
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
