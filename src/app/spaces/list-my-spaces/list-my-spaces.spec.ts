import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Space } from '../../models/space.model';
import { Spaceservice } from '../spaceservice';
import { ListMySpaces } from './list-my-spaces';

describe('ListMySpaces', () => {
  let component: ListMySpaces;
  let fixture: ComponentFixture<ListMySpaces>;
  const spaceService = {
    getSpacesByOwnerLogged: () => of([] as Space[]),
    spaceListFiltration: (spaces: Space[]) => spaces,
    pauseOwnedSpace: vi.fn(() => of({ mensaje: 'Espacio pausado' })),
    reactiveOwnedSpace: vi.fn(() => of({ mensaje: 'Espacio reactivado' })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListMySpaces],
      providers: [{ provide: Spaceservice, useValue: spaceService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ListMySpaces);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  const makeSpace = (overrides: Partial<Space> = {}): Space => ({
    idSpace: 1,
    consumerOwner: {} as Space['consumerOwner'],
    location: {} as Space['location'],
    cancellationPolicies: null,
    nameSpace: 'Espacio de prueba',
    description: '',
    basePrice: 0,
    publicationDate: new Date(),
    bufferTime: 0,
    isActive: true,
    rating: 0,
    commentCount: 0,
    deletedByOwner: false,
    deactivationReason: null,
    ownerAvailable: true,
    services: [],
    ...overrides,
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps a paused space in the list and marks it as owner-paused', () => {
    component.lista.set([makeSpace()]);

    component.pausar(1);

    expect(component.lista()).toHaveLength(1);
    expect(component.lista()[0]).toMatchObject({
      isActive: false,
      deactivationReason: 'OWNER_PAUSED',
    });
    expect(component.estaEnPausa(1)).toBe(true);
  });

  it('only treats spaces paused by their owner as paused', () => {
    component.lista.set([
      makeSpace({ isActive: false, deactivationReason: 'ADMIN' }),
    ]);

    expect(component.estaEnPausa(1)).toBe(false);
  });

  it('reactivates a paused space without removing it from the list', () => {
    component.lista.set([
      makeSpace({ isActive: false, deactivationReason: 'OWNER_PAUSED' }),
    ]);

    component.reactivar(1);

    expect(component.lista()).toHaveLength(1);
    expect(component.lista()[0]).toMatchObject({
      isActive: true,
      deactivationReason: null,
    });
    expect(spaceService.reactiveOwnedSpace).toHaveBeenCalledWith(1);
  });
});
