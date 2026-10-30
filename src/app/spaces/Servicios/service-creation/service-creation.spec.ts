import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServiceCreation } from './service-creation';
import { vi } from 'vitest';

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

  it('emits the service when the add button is clicked', () => {
    const emit = vi.fn();
    component.dataEntry.subscribe(emit);
    component.serviceModel.set({ description: 'Proyector', price: 250 });
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();

    expect(emit).toHaveBeenCalledWith({ description: 'Proyector', price: 250 });
    expect(component.serviceModel()).toEqual({ description: '', price: 0 });
  });
});
