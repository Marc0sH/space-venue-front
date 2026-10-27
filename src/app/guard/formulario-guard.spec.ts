import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';
import { formularioGuard } from './formulario-guard';

describe('formularioGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => formularioGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
