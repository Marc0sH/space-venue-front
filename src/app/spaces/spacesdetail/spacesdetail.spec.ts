import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/enviroment';
import { Space } from '../../models/space.model';
import { SpaceImage } from '../../models/space-image.model';
import { Spacesdetail } from './spacesdetail';

describe('Spacesdetail', () => {
  let component: Spacesdetail;
  let fixture: ComponentFixture<Spacesdetail>;
  let http: HttpTestingController;

  const space: Space = {
    idSpace: 1,
    consumerOwner: { idConsumer: 1, firstname: 'Test', lastname: 'User' },
    location: { idLocation: 1, latitude: -34.6, longitude: -58.4 },
    cancellationPolicies: 'FLEXIBLE',
    nameSpace: 'Salón',
    description: '',
    basePrice: 0,
    publicationDate: new Date(),
    bufferTime: 0,
    isActive: true,
    services: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Spacesdetail],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Spacesdetail);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', '1');
    http = TestBed.inject(HttpTestingController);
    TestBed.tick(); // Dispara los pedidos de los httpResource sin esperar la respuesta
  });

  async function responder(respuesta: Space, images: SpaceImage[] = []) {
    http.expectOne(`${environment.apiUrl}/spaces/1`).flush(respuesta);
    http.expectOne(`${environment.apiUrl}/spaceimages/byspaceid/1`).flush(images);
    await fixture.whenStable();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the location map of the space', async () => {
    await responder(space);

    expect(fixture.nativeElement.querySelector('app-location-map')).not.toBeNull();
  });

  it('does not show a map for spaces without a real location', async () => {
    await responder({ ...space, location: { idLocation: 1, latitude: 0, longitude: 0 } });

    expect(fixture.nativeElement.querySelector('app-location-map')).toBeNull();
  });

  it('changes the displayed image with the gallery buttons', async () => {
    await responder(space, [
      { idSpaceImages: 1, fileName: 'primera.jpg', urlImage: 'media/primera.jpg', dateSend: new Date() },
      { idSpaceImages: 2, fileName: 'segunda.jpg', urlImage: 'media/segunda.jpg', dateSend: new Date() },
    ]);

    const track: HTMLDivElement = fixture.nativeElement.querySelector('.gallery-track');
    expect(track.style.transform).toBe('translateX(-0%)');
    expect(fixture.nativeElement.querySelector('.gallery-button.previous').disabled).toBe(true);

    fixture.nativeElement.querySelector('.gallery-button.next').click();
    fixture.detectChanges();
    expect(track.style.transform).toBe('translateX(-100%)');
    expect(fixture.nativeElement.querySelector('.gallery-button.next').disabled).toBe(true);

    fixture.nativeElement.querySelector('.gallery-button.previous').click();
    fixture.detectChanges();
    expect(track.style.transform).toBe('translateX(-0%)');
    expect(fixture.nativeElement.querySelector('.gallery-position').textContent.trim()).toBe('1 / 2');
  });
});
