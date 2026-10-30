import { Component, DestroyRef, inject, signal } from '@angular/core';
import { form, FormField, max, min, required } from '@angular/forms/signals';
import { NewSpace } from '../../models/space.model';
import { ServiceReg } from '../../models/service.model';
import { FormErrorMessage } from '../../common/form-error-message/form-error-message';
import { Spaceservice } from '../spaceservice';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { ServiceCreation } from '../Servicios/service-creation/service-creation';
import { catchError, concatMap, from, map, of, toArray } from 'rxjs';

// Mismos límites que valida el back en /spaceimages/upload-url
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANIO_MAX_IMAGEN = 5 * 1024 * 1024;
const CANTIDAD_MAX_IMAGENES = 10;

interface ImagenSeleccionada {
  file: File,
  preview: string
}

@Component({
  imports: [FormField, FormErrorMessage, RouterLink, ServiceCreation],
  selector: 'app-space-creation',
  styleUrl: './space-creation.css',
  templateUrl: './space-creation.html',
})
export class SpaceCreation {
  model = signal<NewSpace>({
    location: { latitude: 0, longitude: 0 },
    cancellationPolicies: 'FLEXIBLE',
    nameSpace: '',
    description: '',
    basePrice: 0,
    bufferTime: 0,
    services: [],
  });

  formSpaceCreation = form(this.model, (path) => {
    required(path.nameSpace, { message: 'El nombre del espacio es obligatorio' });
    required(path.description, { message: 'La descripción del espacio es obligatoria' });
    required(path.basePrice, { message: 'El precio base es obligatorio' });
    required(path.bufferTime, { message: 'El tiempo de espera entre reservas es obligatorio' });
    required(path.location.latitude, { message: 'La latitud es obligatoria' });
    required(path.location.longitude, { message: 'La longitud es obligatoria' });

    min(path.location.latitude, -90, { message: 'La latitud debe ser mayor o igual a -90' });
    max(path.location.latitude, 90, { message: 'La latitud debe ser menor o igual a 90' });
    min(path.location.longitude, -180, { message: 'La longitud debe ser mayor o igual a -180' });
    max(path.location.longitude, 180, { message: 'La longitud debe ser menor o igual a 180' });
  });

  private spaceService = inject(Spaceservice);
  private router = inject(Router);

  error = signal('');
  saving = signal(false);

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
  }
  errorImagenes = signal<string>("")
  imagenes = signal<ImagenSeleccionada[]>([])
  enviando = signal<boolean>(false)
  // Si el espacio se creó pero fallaron imágenes, no se permite reenviar para no duplicarlo
  espacioCreado = signal<boolean>(false)

  constructor() {
    inject(DestroyRef).onDestroy(() => this.imagenes().forEach(i => URL.revokeObjectURL(i.preview)))
  }

  onImagenesSeleccionadas(event: Event) {
    const input = event.target as HTMLInputElement
    const archivos = Array.from(input.files ?? [])
    input.value = "" // Permite volver a elegir el mismo archivo

    const validos = archivos.filter(f => TIPOS_IMAGEN.includes(f.type) && f.size <= TAMANIO_MAX_IMAGEN)
    const lugares = CANTIDAD_MAX_IMAGENES - this.imagenes().length
    const agregados = validos.slice(0, lugares)

    if (validos.length < archivos.length) {
      this.errorImagenes.set("Algunas imágenes no se agregaron: solo se permiten JPG, PNG o WEBP de hasta 5 MB")
    } else if (agregados.length < validos.length) {
      this.errorImagenes.set(`Se pueden subir hasta ${CANTIDAD_MAX_IMAGENES} imágenes`)
    } else {
      this.errorImagenes.set("")
    }

    this.imagenes.update(lista => [...lista, ...agregados.map(file => ({ file, preview: URL.createObjectURL(file) }))])
  }

  quitarImagen(index: number) {
    URL.revokeObjectURL(this.imagenes()[index].preview)
    this.imagenes.update(lista => lista.filter((_, i) => i !== index))
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.enviando.set(true)

    if (this.formSpaceCreation().invalid() || this.saving()) {
      return;
    }

    const current = this.model();
    const payload: NewSpace = {
      location: {
        latitude: current.location.latitude,
        longitude: current.location.longitude,
      },
      cancellationPolicies: current.cancellationPolicies,
      nameSpace: current.nameSpace,
      description: current.description,
      basePrice: current.basePrice,
      bufferTime: current.bufferTime,
      services: current.services.map(({ description, price }) => ({ description, price })),
    };

    this.saving.set(true);
    this.error.set('');
    this.subirImagenes(res.idSpace)
    this.spaceService.createSpace(payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.error.set('');
        console.log('Espacio creado correctamente:', res);
        this.router.navigate(['/espacios']);
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        const validationDetail = e.error?.errores
          ? JSON.stringify(e.error.errores)
          : undefined;
        const detail = typeof e.error === 'string'
          ? e.error
          : validationDetail ?? e.error?.mensaje ?? e.error?.message ?? e.message;
        this.error.set('Error al crear un espacio: ' + detail);
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
      this.enviando.set(false)
      const fallidas = resultados.filter(ok => !ok).length

      if (fallidas === 0) {
        this.router.navigate(['/espacios'])
      } else {
        this.espacioCreado.set(true)
        this.error.set(`El espacio se creó, pero no se pudieron subir ${fallidas} de ${resultados.length} imágenes`)
      }
    })
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
      this.enviando.set(false)
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