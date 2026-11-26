import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Session } from '../../auth/session/session';
import { ToastService } from '../../common/toast-service';
import { Space } from '../../models/space.model';
import { ServiceServicios } from '../Servicios/service-servicios';
import { Spaceservice } from '../spaceservice';
import { SpaceEdit } from './space-edit';

describe('SpaceEdit', () => {
  let component: SpaceEdit;
  let fixture: ComponentFixture<SpaceEdit>;
  let updateOwnedSpace: ReturnType<typeof vi.fn>;
  let space: Space;

  beforeEach(async () => {
    space = {
      idSpace: 1,
      consumerOwner: { idConsumer: 1, firstname: 'Test', lastname: 'User' },
      location: { idLocation: 1, latitude: -34, longitude: -58 },
      floor: 2,
      nameSpace: 'Salón',
      description: 'Salón de eventos',
      basePrice: 100,
      publicationDate: new Date(),
      bufferTime: 10,
      isActive: true,
      rating: 0,
      commentCount: 0,
      deletedByOwner: false,
      deactivationReason: null,
      ownerAvailable: true,
      services: [],
    };

    const resource = {
      hasValue: () => true,
      value: () => space,
      isLoading: () => false,
      error: () => false,
      reload: vi.fn(),
    };
    const emptyResource = {
      hasValue: () => true,
      value: () => [],
      isLoading: () => false,
      error: () => false,
      reload: vi.fn(),
    };
    updateOwnedSpace = vi.fn(() => of({ mensaje: 'Actualizado' }));

    await TestBed.configureTestingModule({
      imports: [SpaceEdit],
      providers: [
        {
          provide: Spaceservice,
          useValue: {
            getById: () => resource,
            getImagesBySpaceId: () => emptyResource,
            updateOwnedSpace,
            deleteImage: vi.fn(),
            uploadImage: vi.fn(),
          },
        },
        {
          provide: ServiceServicios,
          useValue: { getServicio: () => emptyResource, deleteServicio: vi.fn(), postServicio: vi.fn() },
        },
        { provide: Session, useValue: { session: () => ({ consumerId: 1 }) } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ToastService, useValue: { success: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SpaceEdit);
    fixture.componentRef.setInput('id', '1');
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('prefills the floor and sends it when updating the space', () => {
    expect(component.model().floor).toBe(2);

    component.onSubmit(new Event('submit'));

    expect(updateOwnedSpace).toHaveBeenCalledWith(1, expect.objectContaining({ floor: 2 }));
  });

  it('shows the backend conflict message when the floor is already occupied', () => {
    updateOwnedSpace.mockReturnValue(
      throwError(() => new HttpErrorResponse({
        status: 409,
        error: { mensaje: 'Ya existe un espacio en esa ubicación y piso.' },
      })),
    );

    component.onSubmit(new Event('submit'));

    expect(component.error()).toBe('No se pudo guardar el espacio: Ya existe un espacio en esa ubicación y piso.');
  });
});
