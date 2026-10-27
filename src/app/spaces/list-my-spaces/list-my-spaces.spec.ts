import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListMySpaces } from './list-my-spaces';

describe('ListMySpaces', () => {
  let component: ListMySpaces;
  let fixture: ComponentFixture<ListMySpaces>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListMySpaces],
    }).compileComponents();

    fixture = TestBed.createComponent(ListMySpaces);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
