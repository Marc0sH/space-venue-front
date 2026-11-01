import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LocationMap } from './location-map';

describe('LocationMap', () => {
  let component: LocationMap;
  let fixture: ComponentFixture<LocationMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationMap],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationMap);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('ubicacion', { latitude: -34.6037, longitude: -58.3816 });
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
