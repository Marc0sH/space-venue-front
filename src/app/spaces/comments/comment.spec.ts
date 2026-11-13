import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/enviroment';
import { Comment } from './comment';

describe('Comment', () => {
  let service: Comment;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Comment);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('updates a comment using the PUT endpoint', () => {
    const comment = { description: 'Reseña actualizada', score: 4, idSpace: '2' };

    service.modifyComment(15, comment).subscribe();

    const request = http.expectOne(`${environment.apiUrl}/comments/15`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(comment);
    request.flush({});
  });
});
