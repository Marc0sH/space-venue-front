import { Component, computed, DestroyRef, inject, input, linkedSignal, signal } from '@angular/core';
import { form, FormField, min, required } from '@angular/forms/signals';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { Spaceservice } from '../spaceservice';
import { Session } from '../../auth/session/session';
import { SpaceUpdate } from '../../models/space.model';
import { Coordinates, hasLocation } from '../../models/location.model';
import { FormErrorMessage } from '../../common/form-error-message/form-error-message';
import { LocationPicker } from '../../common/location-picker/location-picker';
import { CANTIDAD_MAX_IMAGENES, ImagenSeleccionada, seleccionarImagenes } from '../space-images';
import { catchError, concatMap, from, map, Observable, of, switchMap, toArray } from 'rxjs';

// La ubicación puede quedar vacía si el espacio se creó antes del mapa
type SpaceEditForm = Omit<SpaceUpdate, 'location'> & { location: Coordinates | null }

@Component({
  imports: [FormField, FormErrorMessage, RouterLink, LocationPicker],
  selector: 'app-space-edit',
  // Mismo diseño que el formulario de creación
  styleUrls: ['../space-creation/space-creation.css', './space-edit.css'],
  templateUrl: './space-edit.html',
})
export class SpaceEdit {
  private readonly spaceService = inject(Spaceservice);
  private readonly session = inject(Session);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  protected readonly space = this.spaceService.getById(this.id);
  protected readonly images = this.spaceService.getImagesBySpaceId(this.id);

  //Solo el dueño puede editar, y no si ya eliminó el espacio (el back también lo valida)
  protected readonly esDuenio = computed(() => {
    const s = this.space.hasValue() ? this.space.value() : undefined;
    const idLogueado = this.session.session()?.consumerId;
    return !!s && idLogueado != null && s.consumerOwner?.idConsumer === idLogueado && !s.deletedByOwner;
  });

  //Se precarga con los datos actuales del espacio
  model = linkedSignal<SpaceEditForm>(() => {
    const s = this.space.hasValue() ? this.space.value() : undefined;
    return {
      nameSpace: s?.nameSpace ?? '',
      description: s?.description ?? '',
      basePrice: s?.basePrice ?? 0,
      bufferTime: s?.bufferTime ?? 0,
      //No se edita desde el formulario, pero el back la exige: se reenvía la política actual
      cancellationPolicies: s?.cancellationPolicies?.type ?? 'FLEXIBLE',
      location: hasLocation(s?.location) ? { latitude: s.location.latitude, longitude: s.location.longitude } : null,
    };
  });

  formEdit = form(this.model, (path) => {
    required(path.nameSpace, { message: 'El nombre del espacio es obligatorio' });
    required(path.description, { message: 'La descripción del espacio es obligatoria' });
    required(path.basePrice, { message: 'El precio base es obligatorio' });
    min(path.basePrice, 1, { message: 'El precio base debe ser mayor a 0' });
    required(path.bufferTime, { message: 'El tiempo de receso es obligatorio' });
    min(path.bufferTime, 1, { message: 'El tiempo de receso debe ser mayor a 0' });
    required(path.location, { message: 'Marcá la ubicación del espacio en el mapa' });
  });

  error = signal('');
  guardando = signal(false);

  // Los cambios de imágenes se aplican recién al guardar
  readonly aEliminar = signal<Set<number>>(new Set());
  readonly nuevas = signal<ImagenSeleccionada[]>([]);
  readonly errorImagenes = signal('');

  readonly imagenesGuardadas = computed(() =>
    (this.images.hasValue() ? this.images.value() : []).filter(img => !this.aEliminar().has(img.idSpaceImages))
  );
  readonly lugaresLibres = computed(() =>
    CANTIDAD_MAX_IMAGENES - this.imagenesGuardadas().length - this.nuevas().length
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.nuevas().forEach(i => URL.revokeObjectURL(i.preview)));
  }

  imageUrl(key: string) {
    return this.spaceService.imageUrl(key);
  }

  marcarParaEliminar(idImagen: number) {
    this.aEliminar.update(ids => new Set(ids).add(idImagen));
  }

  restaurarEliminadas() {
    this.aEliminar.set(new Set());
  }

  onImagenesSeleccionadas(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivos = Array.from(input.files ?? []);
    input.value = ''; // Permite volver a elegir el mismo archivo

    const { agregadas, error } = seleccionarImagenes(archivos, this.lugaresLibres());
    this.errorImagenes.set(error);
    this.nuevas.update(lista => [...lista, ...agregadas]);
  }

  quitarNueva(index: number) {
    URL.revokeObjectURL(this.nuevas()[index].preview);
    this.nuevas.update(lista => lista.filter((_, i) => i !== index));
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const { location, ...datos } = this.model();
    if (!location || this.formEdit().invalid()) return;
    const idSpace = Number(this.id());
    this.guardando.set(true);
    this.error.set('');

    this.spaceService.updateOwnedSpace(idSpace, { ...datos, location }).pipe(
      switchMap(() => this.aplicarCambiosImagenes(idSpace))
    ).subscribe({
      next: ({ borradosFallidos, subidasFallidas }) => {
        if (borradosFallidos.length === 0 && subidasFallidas.length === 0) {
          this.router.navigate(['/espacios', idSpace]);
          return;
        }
        // Se dejan pendientes solo los cambios que fallaron, para poder reintentar
        const subidasOk = this.nuevas().filter(img => !subidasFallidas.includes(img));
        subidasOk.forEach(img => URL.revokeObjectURL(img.preview));
        this.nuevas.set(subidasFallidas);
        this.aEliminar.set(new Set(borradosFallidos));
        this.images.reload();
        this.guardando.set(false);

        const partes = [];
        if (borradosFallidos.length) partes.push(`no se pudieron eliminar ${borradosFallidos.length} imágenes`);
        if (subidasFallidas.length) partes.push(`no se pudieron subir ${subidasFallidas.length} imágenes`);
        this.error.set(`Los datos se guardaron, pero ${partes.join(' y ')}. Podés volver a intentar.`);
      },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        const detalle = e.error?.errores
          ? JSON.stringify(e.error.errores)
          : e.error?.mensaje ?? e.error?.message;
        this.error.set('No se pudo guardar el espacio' + (detalle ? ': ' + detalle : ''));
        console.error('Error ' + e.status + ' al editar espacio:', e);
      },
    });
  }

  //Primero borra las imágenes marcadas y después sube las nuevas, de a una.
  //Si alguna falla se siguen procesando las demás y se devuelven las que fallaron
  private aplicarCambiosImagenes(idSpace: number): Observable<{ borradosFallidos: number[], subidasFallidas: ImagenSeleccionada[] }> {
    const borrados = from([...this.aEliminar()]).pipe(
      concatMap(idImagen => this.spaceService.deleteImage(idImagen).pipe(
        map(() => null),
        catchError(e => {
          console.error('Error al eliminar la imagen ' + idImagen, e);
          return of(idImagen);
        })
      )),
      toArray()
    );
    const subidas = from(this.nuevas()).pipe(
      concatMap(img => this.spaceService.uploadImage(idSpace, img.file).pipe(
        map(() => null),
        catchError(e => {
          console.error('Error al subir la imagen ' + img.file.name, e);
          return of(img);
        })
      )),
      toArray()
    );

    return borrados.pipe(
      switchMap(fallidosBorrado => subidas.pipe(map(fallidasSubida => ({
        borradosFallidos: fallidosBorrado.filter((id): id is number => id !== null),
        subidasFallidas: fallidasSubida.filter((img): img is ImagenSeleccionada => img !== null),
      }))))
    );
  }
}
