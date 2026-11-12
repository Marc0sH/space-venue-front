import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentFilter, type CommentFilterOptions } from './comment-filter';

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

  it('emits combined filter options as controls change', () => {
    const emitted: CommentFilterOptions[] = [];
    component.filtersChanged.subscribe((filters) => emitted.push(filters));

    component.onScoreChange('4');
    component.onScoreOrderChange('desc');
    component.onUsernameChange('ana');
    component.onScoreChange('');

    expect(emitted[emitted.length - 1]).toEqual({
      score: null,
      username: 'ana',
      scoreOrder: 'desc',
    });
  });
});
