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
import { ServiceServicios } from '../Servicios/service-servicios';
import { ServiceCreation } from '../Servicios/service-creation/service-creation';
import { ServiceReg } from '../../models/service.model';
import { catchError, concat, concatMap, from, map, Observable, of, switchMap, toArray } from 'rxjs';
import { mensajeDeError } from '../../common/http-error';

// La ubicación puede quedar vacía si el espacio se creó antes del mapa
type SpaceEditForm = Omit<SpaceUpdate, 'location'> & { location: Coordinates | null }

@Component({
  imports: [FormField, FormErrorMessage, RouterLink, LocationPicker, ServiceCreation],
  selector: 'app-space-edit',
  // Mismo diseño que el formulario de creación
  styleUrls: ['../space-creation/space-creation.css', './space-edit.css'],
  templateUrl: './space-edit.html',
})
export class SpaceEdit {
  private readonly spaceService = inject(Spaceservice);
  private readonly serviciosService = inject(ServiceServicios);
  private readonly session = inject(Session);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  protected readonly space = this.spaceService.getById(this.id);
  protected readonly images = this.spaceService.getImagesBySpaceId(this.id);
  protected readonly servicios = this.serviciosService.getServicio(this.id);

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

  // Igual que las imágenes: los cambios de servicios se aplican recién al guardar
  readonly serviciosAEliminar = signal<Set<number>>(new Set());
  readonly serviciosNuevos = signal<ServiceReg[]>([]);
  readonly errorServicios = signal('');

  readonly serviciosGuardados = computed(() =>
    (this.servicios.hasValue() ? this.servicios.value() : []).filter(s => !this.serviciosAEliminar().has(s.id))
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

  marcarServicioParaEliminar(idServicio: number) {
    this.serviciosAEliminar.update(ids => new Set(ids).add(idServicio));
  }

  restaurarServicios() {
    this.serviciosAEliminar.set(new Set());
  }

  agregarServicio(servicio: ServiceReg) {
    const descripcion = servicio.description.trim();
    if (!descripcion || !(servicio.price > 0)) {
      this.errorServicios.set('El servicio necesita una descripción y un precio mayor a 0');
      return;
    }
    this.errorServicios.set('');
    this.serviciosNuevos.update(lista => [...lista, { description: descripcion, price: servicio.price }]);
  }

  quitarServicioNuevo(index: number) {
    this.serviciosNuevos.update(lista => lista.filter((_, i) => i !== index));
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const { location, ...datos } = this.model();
    if (!location || this.formEdit().invalid()) return;
    const idSpace = Number(this.id());
    this.guardando.set(true);
    this.error.set('');

    this.spaceService.updateOwnedSpace(idSpace, { ...datos, location }).pipe(
      switchMap(() => this.aplicarCambiosPendientes(idSpace))
    ).subscribe({
      next: (fallidos) => {
        const { imagenesBorrado, imagenesSubida, serviciosBorrado, serviciosAlta } = fallidos;
        if (Object.values(fallidos).every(lista => lista.length === 0)) {
          this.router.navigate(['/espacios', idSpace]);
          return;
        }
        // Se dejan pendientes solo los cambios que fallaron, para poder reintentar
        this.nuevas().filter(img => !imagenesSubida.includes(img)).forEach(img => URL.revokeObjectURL(img.preview));
        this.nuevas.set(imagenesSubida);
        this.aEliminar.set(new Set(imagenesBorrado));
        this.serviciosNuevos.set(serviciosAlta);
        this.serviciosAEliminar.set(new Set(serviciosBorrado));
        this.images.reload();
        this.servicios.reload();
        this.guardando.set(false);

        const partes = [];
        if (imagenesBorrado.length) partes.push(`eliminar ${imagenesBorrado.length} imágenes`);
        if (imagenesSubida.length) partes.push(`subir ${imagenesSubida.length} imágenes`);
        if (serviciosBorrado.length) partes.push(`eliminar ${serviciosBorrado.length} servicios`);
        if (serviciosAlta.length) partes.push(`agregar ${serviciosAlta.length} servicios`);
        this.error.set(`Los datos se guardaron, pero no se pudo ${partes.join(', ')}. Podés volver a intentar.`);
      },
      error: (e: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(mensajeDeError(e, 'No se pudo guardar el espacio'));
        console.error('Error ' + e.status + ' al editar espacio:', e);
      },
    });
  }

  //Aplica en orden: borrado de imágenes, subida de imágenes, borrado de servicios y alta de servicios.
  //Si algo falla se siguen procesando los demás y se devuelve lo que falló en cada grupo
  private aplicarCambiosPendientes(idSpace: number) {
    const imagenesBorrado = this.procesar([...this.aEliminar()], id => this.spaceService.deleteImage(id), 'eliminar la imagen');
    const imagenesSubida = this.procesar(this.nuevas(), img => this.spaceService.uploadImage(idSpace, img.file), 'subir la imagen');
    const serviciosBorrado = this.procesar([...this.serviciosAEliminar()], id => this.serviciosService.deleteServicio(idSpace, id), 'eliminar el servicio');
    const serviciosAlta = this.procesar(this.serviciosNuevos(),
      s => this.serviciosService.postServicio({ description: s.description, price: s.price, isActive: true, idSpace }), 'agregar el servicio');

    return concat(imagenesBorrado, imagenesSubida, serviciosBorrado, serviciosAlta).pipe(
      toArray(),
      map(([imgBorrado, imgSubida, srvBorrado, srvAlta]) => ({
        imagenesBorrado: imgBorrado as number[],
        imagenesSubida: imgSubida as ImagenSeleccionada[],
        serviciosBorrado: srvBorrado as number[],
        serviciosAlta: srvAlta as ServiceReg[],
      }))
    );
  }

  //Ejecuta la acción para cada elemento, de a uno, y emite la lista de los que fallaron
  private procesar<T>(items: T[], accion: (item: T) => Observable<unknown>, descripcion: string): Observable<T[]> {
    return from(items).pipe(
      concatMap(item => accion(item).pipe(
        map(() => null),
        catchError(e => {
          console.error(`Error al ${descripcion}`, item, e);
          return of(item);
        })
      )),
      toArray(),
      map(resultados => resultados.filter((item): item is T => item !== null))
    );
  }
}
