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
    const streamUrl = `${environment.apiUrl}/notifications/stream`;
    const fakeSession: LoginResponse = {
        token: 'token',
        tipo: 'Bearer',
        rol: 'ROLE_CLIENT',
        consumerId: 1,
    };

    let service: Notificationservice;
    let http: HttpTestingController;
    let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;

    beforeEach(() => {
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
        vi.unstubAllGlobals();
        localStorage.clear();
    });

    function crearRecurso() {
        return TestBed.runInInjectionContext(() => service.getUnseen());
    }

    function mockStream() {
        const body = new ReadableStream<Uint8Array>({
            start(controller) {
                streamController = controller;
            },
        });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            new Response(body, { headers: { 'Content-Type': 'text/event-stream' } })
        ));
    }

    async function esperarRefresco(recurso: ReturnType<typeof crearRecurso>) {
        let request: ReturnType<typeof http.expectOne> | undefined;
        await vi.waitFor(() => {
            TestBed.flushEffects();
            request = http.expectOne(unseenUrl);
        });
        request!.flush([]);
        await vi.waitFor(() => expect(recurso.status()).toBe('resolved'));
    }

    it('se conecta al stream SSE autenticado y refresca por ambos eventos', async () => {
        localStorage.setItem('session', JSON.stringify(fakeSession));
        mockStream();
        service = TestBed.inject(Notificationservice);
        const recurso = crearRecurso();

        TestBed.flushEffects();
        http.expectOne(unseenUrl).flush([]);
        await vi.waitFor(() => expect(recurso.status()).toBe('resolved'));

        expect(globalThis.fetch).toHaveBeenCalledWith(streamUrl, expect.objectContaining({
            headers: {
                Accept: 'text/event-stream',
                Authorization: 'Bearer token',
            },
            signal: expect.any(AbortSignal),
        }));

        streamController!.enqueue(new TextEncoder().encode('event: notification\ndata: {}\n\n'));
        await esperarRefresco(recurso);

        streamController!.enqueue(new TextEncoder().encode('event: unread-count\ndata: 0\n\n'));
        await esperarRefresco(recurso);
    });

    it('no abre el stream SSE si no hay sesión', () => {
        mockStream();
        service = TestBed.inject(Notificationservice);
        crearRecurso();

        TestBed.flushEffects();

        expect(globalThis.fetch).not.toHaveBeenCalled();
        http.expectNone(unseenUrl);
    });

    it('actualiza el recurso al marcar una notificación como vista', async () => {
        localStorage.setItem('session', JSON.stringify(fakeSession));
        mockStream();
        service = TestBed.inject(Notificationservice);
        const recurso = crearRecurso();

        TestBed.flushEffects();
        http.expectOne(unseenUrl).flush([]);
        await vi.waitFor(() => expect(recurso.status()).toBe('resolved'));

        service.markAsSeen(7).subscribe();
        const markRequest = http.expectOne(`${environment.apiUrl}/notifications/7`);
        expect(markRequest.request.method).toBe('POST');
        markRequest.flush({});

        await esperarRefresco(recurso);
    });

    it('cancela el stream al cerrar la sesión', () => {
        localStorage.setItem('session', JSON.stringify(fakeSession));
        mockStream();
        service = TestBed.inject(Notificationservice);

        TestBed.flushEffects();
        const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigateByUrl')
            .mockResolvedValue(true);
        TestBed.inject(Session).clearSession();
        TestBed.flushEffects();

        expect(navigateSpy).toHaveBeenCalled();
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });
});
