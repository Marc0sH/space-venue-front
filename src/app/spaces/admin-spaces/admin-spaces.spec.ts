import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminSpaces } from './admin-spaces';

describe('AdminSpaces', () => {
  let component: AdminSpaces;
  let fixture: ComponentFixture<AdminSpaces>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSpaces],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSpaces);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
