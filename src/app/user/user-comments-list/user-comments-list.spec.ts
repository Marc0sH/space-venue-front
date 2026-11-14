import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserCommentsList } from './user-comments-list';

describe('UserCommentsList', () => {
  let component: UserCommentsList;
  let fixture: ComponentFixture<UserCommentsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCommentsList],
    }).compileComponents();

    fixture = TestBed.createComponent(UserCommentsList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
