import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentViewCard } from './comment-view-card';

describe('CommentViewCard', () => {
  let component: CommentViewCard;
  let fixture: ComponentFixture<CommentViewCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentViewCard],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentViewCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
