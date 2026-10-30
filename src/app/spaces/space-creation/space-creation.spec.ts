import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Spaceservice } from '../spaceservice';
import { SpaceCreation } from './space-creation';

describe('SpaceCreation', () => {
  let component: SpaceCreation;
  let fixture: ComponentFixture<SpaceCreation>;
  let createSpace: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    createSpace = vi.fn(() => of({}));

    await TestBed.configureTestingModule({
      imports: [SpaceCreation],
      providers: [
        { provide: Spaceservice, useValue: { createSpace } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SpaceCreation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('sends staged services as space service items', () => {
    component.model.update((current) => ({
      ...current,
      nameSpace: 'Salón',
      description: 'Salón de eventos',
      basePrice: 100,
      bufferTime: 0,
      location: { latitude: -34, longitude: -58 },
    }));
    component.addServices({ description: 'Proyector', price: 250 });

    component.onSubmit(new Event('submit'));

    expect(createSpace).toHaveBeenCalledWith({
      location: { latitude: -34, longitude: -58 },
      cancellationPolicies: 'FLEXIBLE',
      nameSpace: 'Salón',
      description: 'Salón de eventos',
      basePrice: 100,
      bufferTime: 0,
      services: [{ description: 'Proyector', price: 250 }],
    });
  });

  it('shows backend validation details when space creation fails', () => {
    createSpace.mockReturnValue(
      throwError(() => new HttpErrorResponse({
        status: 400,
        error: { mensaje: 'Los datos enviados no son válidos.', errores: { nameSpace: 'es obligatorio' } },
      })),
    );
    component.model.update((current) => ({
      ...current,
      nameSpace: 'Salón',
      description: 'Salón de eventos',
      basePrice: 100,
      location: { latitude: -34, longitude: -58 },
    }));

    component.onSubmit(new Event('submit'));

    expect(component.error()).toContain('"nameSpace":"es obligatorio"');
  });
});
