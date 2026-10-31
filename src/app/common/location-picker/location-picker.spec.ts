import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { LocationPicker } from './location-picker';

describe('LocationPicker', () => {
  let component: LocationPicker;
  let fixture: ComponentFixture<LocationPicker>;
  let getCurrentPosition: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    getCurrentPosition = vi.fn();
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition } });

    await TestBed.configureTestingModule({
      imports: [LocationPicker],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationPicker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses the current location as the value', async () => {
    const touch = vi.fn();
    component.touch.subscribe(touch);
    getCurrentPosition.mockImplementation((ok: PositionCallback) =>
      ok({ coords: { latitude: -34.60372345, longitude: -58.38159123 } } as GeolocationPosition),
    );

    await component.usarUbicacionActual();

    expect(component.value()).toEqual({ latitude: -34.603723, longitude: -58.381591 });
    expect(touch).toHaveBeenCalled();
    expect(component.buscando()).toBe(false);
  });

  it('hides the current location button in readonly mode', async () => {
    fixture.componentRef.setInput('readonly', true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(fixture.nativeElement.querySelector('.ayuda')).toBeNull();
  });

  it('shows a message when location permission is denied', async () => {
    getCurrentPosition.mockImplementation((_: PositionCallback, error: PositionErrorCallback) =>
      error({ code: 1 } as GeolocationPositionError),
    );

    await component.usarUbicacionActual();

    expect(component.value()).toEqual({ latitude: 0, longitude: 0 });
    expect(component.errorUbicacion()).toBe('No diste permiso para acceder a tu ubicación');
  });
});
