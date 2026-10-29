import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Space } from '../../models/space.model';
import { Spacescard } from './spacescard';

describe('Spacescard', () => {
  let component: Spacescard;
  let fixture: ComponentFixture<Spacescard>;

  const space: Space = {
    idSpace: 1,
    consumerOwner: { idConsumer: 1, firstname: 'Test', lastname: 'User' },
    location: { idLocation: 1, longitude: 0, latitude: 0 },
    cancellationPolicies: 'FLEXIBLE',
    nameSpace: 'CafÃ©',
    description: '',
    basePrice: 0,
    publicationDate: new Date(),
    bufferTime: 0,
    isActive: true,
    services: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Spacescard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Spacescard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('space', space);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display mojibake accents correctly', () => {
    expect(fixture.nativeElement.querySelector('h3').textContent.trim()).toBe('Café');
  });

  it('should preserve names that are already correctly encoded', () => {
    fixture.componentRef.setInput('space', { ...space, nameSpace: 'Salón' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h3').textContent.trim()).toBe('Salón');
  });
});
