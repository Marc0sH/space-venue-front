import { TestBed } from '@angular/core/testing';
import { ServiceServicios } from './service-servicios';

describe('ServiceServicios', () => {
  let service: ServiceServicios;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceServicios);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
