import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentCreation } from './comment-creation';

describe('CommentCreation', () => {
  let component: CommentCreation;
  let fixture: ComponentFixture<CommentCreation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentCreation],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentCreation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
