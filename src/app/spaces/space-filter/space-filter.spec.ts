import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { FiltroCercania } from '../../models/location.model';
import { SpaceFilter } from './space-filter';

describe('SpaceFilter', () => {
  let component: SpaceFilter;
  let fixture: ComponentFixture<SpaceFilter>;
  let getCurrentPosition: ReturnType<typeof vi.fn>;
  let cercania: ReturnType<typeof vi.fn<(valor: FiltroCercania | null) => void>>;

  beforeEach(async () => {
    getCurrentPosition = vi.fn((ok: PositionCallback) =>
      ok({ coords: { latitude: -34.6, longitude: -58.38 } } as GeolocationPosition),
    );
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition } });

    await TestBed.configureTestingModule({
      imports: [SpaceFilter],
    }).compileComponents();

    fixture = TestBed.createComponent(SpaceFilter);
    component = fixture.componentInstance;
    cercania = vi.fn<(valor: FiltroCercania | null) => void>();
    component.cercaniaSalida.subscribe(cercania);
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits the current location with the selected radius', async () => {
    await component.buscarCerca();

    expect(cercania).toHaveBeenCalledWith({ latitude: -34.6, longitude: -58.38, radioKm: 5 });
  });

  it('searches again when the radius changes while filtering', async () => {
    await component.buscarCerca();
    component.seleccionarRadio({ target: { value: '25' } } as unknown as Event);

    expect(cercania).toHaveBeenLastCalledWith({ latitude: -34.6, longitude: -58.38, radioKm: 25 });
  });

  it('only stores the radius when not filtering yet', () => {
    component.seleccionarRadio({ target: { value: '10' } } as unknown as Event);

    expect(component.radioKm()).toBe(10);
    expect(cercania).not.toHaveBeenCalled();
  });

  it('emits null when the filter is removed', async () => {
    await component.buscarCerca();
    component.quitarCercania();

    expect(cercania).toHaveBeenLastCalledWith(null);
  });

  it('shows a message when location permission is denied', async () => {
    getCurrentPosition.mockImplementation((_: PositionCallback, error: PositionErrorCallback) =>
      error({ code: 1 } as GeolocationPositionError),
    );

    await component.buscarCerca();

    expect(component.errorUbicacion()).toBe('No diste permiso para acceder a tu ubicación');
    expect(cercania).not.toHaveBeenCalled();
  });
});
