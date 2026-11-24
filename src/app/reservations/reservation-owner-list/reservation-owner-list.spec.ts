import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReservationOwnerList } from './reservation-owner-list';

describe('ReservationOwnerList', () => {
  let component: ReservationOwnerList;
  let fixture: ComponentFixture<ReservationOwnerList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationOwnerList],
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationOwnerList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
