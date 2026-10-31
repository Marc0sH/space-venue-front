import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { environment } from '../../environments/enviroment';
import { FiltroCercania } from '../models/location.model';
import { Spaceservice } from './spaceservice';

describe('Spaceservice', () => {
  let service: Spaceservice;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Spaceservice);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('lists every active space when there is no proximity filter', () => {
    runInInjectionContext(TestBed.inject(Injector), () => service.getSpaces());
    TestBed.tick();

    const req = http.expectOne(`${environment.apiUrl}/spaces`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('asks the back for the spaces within the radius', () => {
    const cercania = signal<FiltroCercania | null>({ latitude: -34.6, longitude: -58.38, radioKm: 10 });
    runInInjectionContext(TestBed.inject(Injector), () => service.getSpaces(cercania));
    TestBed.tick();

    const req = http.expectOne(`${environment.apiUrl}/spaces/byfields`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ lat: -34.6, lng: -58.38, radious: 10 });
    req.flush([]);
  });
});
