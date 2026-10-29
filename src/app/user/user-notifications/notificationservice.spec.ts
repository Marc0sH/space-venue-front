import { TestBed } from '@angular/core/testing';
import { Notificationservice } from './notificationservice';

describe('Notificationservice', () => {
  let service: Notificationservice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Notificationservice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
