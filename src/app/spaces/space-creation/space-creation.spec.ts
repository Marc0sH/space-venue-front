import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpaceCreation } from './space-creation';

describe('SpaceCreation', () => {
  let component: SpaceCreation;
  let fixture: ComponentFixture<SpaceCreation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpaceCreation],
    }).compileComponents();

    fixture = TestBed.createComponent(SpaceCreation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
