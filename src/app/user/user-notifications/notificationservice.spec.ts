import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { environment } from '../../../environments/enviroment';
import { LoginResponse } from '../../models/user.model';
import { Session } from '../../auth/session/session';
import { Notificationservice } from './notificationservice';

describe('Notificationservice', () => {
    const unseenUrl = `${environment.apiUrl}/notifications/consumer/onlyunseen`;
    const fakeSession: LoginResponse = {
        token: 'token',
        tipo: 'Bearer',
        rol: 'ROLE_CLIENT',
        consumerId: 1,
    };
    const POLL_INTERVAL_MS = 10_000;

    let service: Notificationservice;
    let http: HttpTestingController;
    let setIntervalSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.useFakeTimers();
        setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
            ],
        });
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        http.verify();
        setIntervalSpy.mockRestore();
        localStorage.clear();
        vi.useRealTimers();
    });

    // httpResource exige contexto de inyección, igual que en el constructor del header
    function crearRecurso() {
        return TestBed.runInInjectionContext(() => service.getUnseen());
    }

    // El recurso pasa a 'resolved' en una microtarea; hasta entonces reload() se ignora.
    async function resolverRespuesta() {
        await vi.advanceTimersByTimeAsync(0);
    }

    it('should be created', () => {
        service = TestBed.inject(Notificationservice);
        expect(service).toBeTruthy();
    });

    it('refresca las notificaciones no vistas cada 10s mientras hay sesión', async () => {
        localStorage.setItem('session', JSON.stringify(fakeSession));
        service = TestBed.inject(Notificationservice);
        crearRecurso();

        TestBed.flushEffects();
        http.expectOne(unseenUrl).flush([]);
        await resolverRespuesta();

        vi.advanceTimersByTime(POLL_INTERVAL_MS);
        TestBed.flushEffects();
        http.expectOne(unseenUrl).flush([]);
        await resolverRespuesta();

        vi.advanceTimersByTime(POLL_INTERVAL_MS);
        TestBed.flushEffects();
        http.expectOne(unseenUrl).flush([]);
        await resolverRespuesta();
    });

    it('no crea el timer de polling si no hay sesión', () => {
        service = TestBed.inject(Notificationservice);
        crearRecurso();

        TestBed.flushEffects();
        vi.advanceTimersByTime(60_000);
        TestBed.flushEffects();

        http.expectNone(unseenUrl);
        expect(setIntervalSpy).not.toHaveBeenCalled();
    });

    it('detiene el polling al cerrar la sesión', async () => {
        localStorage.setItem('session', JSON.stringify(fakeSession));
        service = TestBed.inject(Notificationservice);
        crearRecurso();

        TestBed.flushEffects();
        http.expectOne(unseenUrl).flush([]);
        await resolverRespuesta();

        vi.advanceTimersByTime(POLL_INTERVAL_MS);
        TestBed.flushEffects();
        http.expectOne(unseenUrl).flush([]);
        await resolverRespuesta();

        const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigateByUrl')
            .mockResolvedValue(true);
        TestBed.inject(Session).clearSession();
        TestBed.flushEffects();

        vi.advanceTimersByTime(60_000);
        TestBed.flushEffects();

        expect(navigateSpy).toHaveBeenCalled();
        http.expectNone(unseenUrl);
        expect(setIntervalSpy).toHaveBeenCalledTimes(1); // el timer del primer login; el del logout no existe
    });

    it('sigue refrescando al marcar una notificación como leída', async () => {
        localStorage.setItem('session', JSON.stringify(fakeSession));
        service = TestBed.inject(Notificationservice);
        crearRecurso();

        TestBed.flushEffects();
        http.expectOne(unseenUrl).flush([]);
        await resolverRespuesta();

        service.markAsSeen(7).subscribe();
        const markRequest = http.expectOne(`${environment.apiUrl}/notifications/7`);
        expect(markRequest.request.method).toBe('POST');
        markRequest.flush({});

        // markAsSeen incrementa refreshTick, lo que también dispara el refetch
        TestBed.flushEffects();
        http.expectOne(unseenUrl).flush([]);
        await resolverRespuesta();
    });

    it('conserva las notificaciones mientras refresca (el badge no vuelve a 0)', async () => {
        localStorage.setItem('session', JSON.stringify(fakeSession));
        service = TestBed.inject(Notificationservice);
        const recurso = crearRecurso();

        TestBed.flushEffects();
        http.expectOne(unseenUrl).flush([{ idNotification: 1 }]);
        await resolverRespuesta();
        expect(recurso.value()?.length).toBe(1);

        vi.advanceTimersByTime(POLL_INTERVAL_MS);
        TestBed.flushEffects();
        const pendiente = http.expectOne(unseenUrl);
        expect(recurso.status()).toBe('reloading');
        expect(recurso.value()?.length).toBe(1);
        pendiente.flush([]);
    });
});
