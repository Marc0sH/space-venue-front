import { TestBed } from '@angular/core/testing';
import { Spaceservice } from './spaceservice';

describe('Spaceservice', () => {
  let service: Spaceservice;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Spaceservice);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
