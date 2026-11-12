import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentFilter } from './comment-filter';

describe('CommentFilter', () => {
  let component: CommentFilter;
  let fixture: ComponentFixture<CommentFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentFilter],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentFilter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
