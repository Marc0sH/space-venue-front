import { Component, DestroyRef, inject, signal } from '@angular/core';
import { form, FormField, maxLength, min, minLength, required } from '@angular/forms/signals';
import { NewSpace } from '../../models/space.model';
import { ServiceReg } from '../../models/service.model';
import { FormErrorMessage } from '../../common/form-error-message/form-error-message';
import { Spaceservice } from '../spaceservice';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { ServiceCreation } from '../Servicios/service-creation/service-creation';
import { catchError, concatMap, from, map, of, toArray } from 'rxjs';
import { Coordinates } from '../../models/location.model';
import { LocationPicker } from '../../common/location-picker/location-picker';
import { CANTIDAD_MAX_IMAGENES, ImagenSeleccionada, seleccionarImagenes } from '../space-images';
import { mensajeDeError } from '../../common/http-error';

// La ubicación queda vacía hasta que se marca en el mapa
type SpaceForm = Omit<NewSpace, 'location'> & { location: Coordinates | null }

@Component({
  imports: [FormField, FormErrorMessage, RouterLink, ServiceCreation, LocationPicker],
  selector: 'app-space-creation',
  styleUrl: './space-creation.css',
  templateUrl: './space-creation.html',
})
export class SpaceCreation {
mostrarFormServicio = signal(false)

  model = signal<SpaceForm>({
    location: null,
    cancellationPolicies: 'FLEXIBLE',
    nameSpace: '',
    description: ' ',
    basePrice: 0,
    bufferTime: 0,
    services: [],
  });

  formSpaceCreation = form(this.model, (path) => {
    required(path.nameSpace, { message: 'El nombre del espacio es obligatorio' }),
    minLength(path.nameSpace, 3, {message: 'El nombre del espacio no puede tener menos de 3 caracteres'}),
    required(path.description, {message: 'La descripcion es obligatoria'})
    maxLength(path.nameSpace, 100, {message: 'El nombre del espacio no puede exceder los 100 caracteres'}),
    maxLength(path.description, 250, {message: 'La descripcion excede el maximo de caracteres'}),
    required(path.basePrice, { message: 'El precio base es obligatorio' }),
    min(path.basePrice, 0, {message: 'El precio no puede ser menor a 0'}),
    required(path.bufferTime, { message: 'El tiempo de espera entre reservas es obligatorio' }),
    min(path.bufferTime, 30, {message: 'El buffertime minimo es 30 minutos'} )
    required(path.location, { message: 'Marcá la ubicación del espacio en el mapa' })
  });

  private spaceService = inject(Spaceservice)
  private router = inject(Router)

  error = signal('');
  saving = signal(false);
  errorImagenes = signal<string>("")
  imagenes = signal<ImagenSeleccionada[]>([])
  // Si el espacio se creó pero fallaron imágenes, no se permite reenviar para no duplicarlo
  espacioCreado = signal<boolean>(false)

  constructor() {
    inject(DestroyRef).onDestroy(() => this.imagenes().forEach(i => URL.revokeObjectURL(i.preview)))
  }

  addServices(servicio: ServiceReg) {
    this.model.update((current) => ({
      ...current,
      services: [...current.services, servicio],
    }));
    this.error.set('');
  }

  removeService(index: number) {
    this.model.update((current) => ({
      ...current,
      services: current.services.filter((_, serviceIndex) => serviceIndex !== index),
    }));
    this.error.set('');
    this.mostrarFormServicio.set(false)
  }

  onImagenesSeleccionadas(event: Event) {
    const input = event.target as HTMLInputElement
    const archivos = Array.from(input.files ?? [])
    input.value = "" // Permite volver a elegir el mismo archivo

    const { agregadas, error } = seleccionarImagenes(archivos, CANTIDAD_MAX_IMAGENES - this.imagenes().length)
    this.errorImagenes.set(error)
    this.imagenes.update(lista => [...lista, ...agregadas])
  }

  quitarImagen(index: number) {
    URL.revokeObjectURL(this.imagenes()[index].preview)
    this.imagenes.update(lista => lista.filter((_, i) => i !== index))
  }

  onSubmit(event: Event) {
    event.preventDefault();
    const { location, ...datos } = this.model();
    if (!location) return;
    this.saving.set(true);

    this.spaceService.createSpace({ ...datos, location }).subscribe({
      next: (res) => {
        this.error.set('');
        this.subirImagenes(res.idSpace);
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(mensajeDeError(e, 'No se pudo crear el espacio'));
        console.error('Error ' + e.status + ' al crear espacio:', e);
      },
    });
  }

  //Sube las imágenes de a una; si alguna falla se siguen subiendo las demás
  private subirImagenes(idSpace: number) {
    from(this.imagenes()).pipe(
      concatMap(({ file }) => this.spaceService.uploadImage(idSpace, file).pipe(
        map(() => true),
        catchError(e => {
          console.error('Error al subir la imagen ' + file.name, e)
          return of(false)
        })
      )),
      toArray()
    ).subscribe(resultados => {
      this.saving.set(false)
      const fallidas = resultados.filter(ok => !ok).length

      if (fallidas === 0) {
        this.router.navigate(['/espacios'])
      } else {
        this.espacioCreado.set(true)
        this.error.set(`El espacio se creó, pero no se pudieron subir ${fallidas} de ${resultados.length} imágenes`)
      }
    })
  }
}
