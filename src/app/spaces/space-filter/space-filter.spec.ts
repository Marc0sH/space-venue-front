import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpaceFilter } from './space-filter';

describe('SpaceFilter', () => {
  let component: SpaceFilter;
  let fixture: ComponentFixture<SpaceFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpaceFilter],
    }).compileComponents();

    fixture = TestBed.createComponent(SpaceFilter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
