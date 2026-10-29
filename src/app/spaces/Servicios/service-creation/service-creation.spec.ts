import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServiceCreation } from './service-creation';

describe('ServiceCreation', () => {
  let component: ServiceCreation;
  let fixture: ComponentFixture<ServiceCreation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceCreation],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceCreation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
