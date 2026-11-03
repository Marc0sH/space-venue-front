import { afterNextRender, Component, DestroyRef, effect, ElementRef, inject, input, model, output, signal, viewChild } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import type * as Leaflet from 'leaflet';
import { Coordinates } from '../../models/location.model';
import { geolocalizacionDisponible, obtenerUbicacionActual } from '../geolocation';
import { cargarLeaflet, capaOpenStreetMap } from '../leaflet';

// Vista inicial cuando todavía no hay ubicación: Ciudad de Buenos Aires
const CENTRO_INICIAL: Leaflet.LatLngTuple = [-34.6037, -58.3816]
const ZOOM_INICIAL = 12
const ZOOM_UBICACION = 16

// 6 decimales ≈ 10 cm, más que suficiente para ubicar un espacio
const redondear = (n: number) => Math.round(n * 1e6) / 1e6

// Control de formulario: se usa con [formField] y edita un campo de tipo Coordinates | null
@Component({
  selector: 'app-location-picker',
  styleUrl: './location-picker.css',
  templateUrl: './location-picker.html',
})
export class LocationPicker implements FormValueControl<Coordinates | null> {
  value = model<Coordinates | null>(null)
  disabled = input(false)
  touch = output<void>()

  error = signal('')
  geolocalizacionDisponible = geolocalizacionDisponible()
  buscandoUbicacion = signal(false)
  errorUbicacion = signal('')

  private contenedor = viewChild.required<ElementRef<HTMLElement>>('mapa')
  private L?: typeof Leaflet
  private mapa = signal<Leaflet.Map | undefined>(undefined)
  private marcador?: Leaflet.Marker
  private destruido = false

  constructor() {
    afterNextRender(() => this.iniciarMapa())

    inject(DestroyRef).onDestroy(() => {
      this.destruido = true
      this.mapa()?.remove()
    })

    // Mantiene el marcador sincronizado con el valor del campo, venga del mapa o del formulario
    effect(() => {
      const mapa = this.mapa()
      const ubicacion = this.value()
      const deshabilitado = this.disabled()
      if (!mapa || !this.L) return

      if (!ubicacion) {
        this.marcador?.remove()
        this.marcador = undefined
        return
      }

      const posicion: Leaflet.LatLngTuple = [ubicacion.latitude, ubicacion.longitude]
      if (this.marcador) {
        this.marcador.setLatLng(posicion)
      } else {
        this.marcador = this.L.marker(posicion, { draggable: true, title: 'Ubicación del espacio' })
          .on('dragend', () => this.elegir(this.marcador!.getLatLng()))
          .addTo(mapa)
      }

      if (deshabilitado) {
        this.marcador.dragging?.disable()
      } else {
        this.marcador.dragging?.enable()
      }
    })
  }

  private async iniciarMapa() {
    try {
      this.L = await cargarLeaflet()
    } catch (e) {
      console.error('No se pudo cargar el mapa', e)
      this.error.set('No se pudo cargar el mapa. Recargá la página para intentar de nuevo.')
      return
    }
    if (this.destruido) return

    const ubicacion = this.value()
    const mapa = ubicacion
      ? this.L.map(this.contenedor().nativeElement).setView([ubicacion.latitude, ubicacion.longitude], ZOOM_UBICACION)
      : this.L.map(this.contenedor().nativeElement).setView(CENTRO_INICIAL, ZOOM_INICIAL)

    capaOpenStreetMap(this.L).addTo(mapa)

    mapa.on('click', (e: Leaflet.LeafletMouseEvent) => this.elegir(e.latlng))
    this.mapa.set(mapa)
  }

  usarUbicacionActual() {
    this.errorUbicacion.set('')
    this.buscandoUbicacion.set(true)
    obtenerUbicacionActual(
      ({ latitude, longitude }) => {
        this.buscandoUbicacion.set(false)
        if (this.destruido) return
        this.fijar(latitude, longitude)
        this.mapa()?.setView([latitude, longitude], ZOOM_UBICACION)
      },
      (mensaje: string) => {
        this.buscandoUbicacion.set(false)
        this.errorUbicacion.set(mensaje)
      }
    )
  }

  private elegir(latlng: Leaflet.LatLng) {
    // wrap() normaliza la longitud a [-180, 180] si el mapa se desplazó más allá del antimeridiano
    const { lat, lng } = latlng.wrap()
    this.fijar(lat, lng)
  }

  private fijar(latitude: number, longitude: number) {
    if (this.disabled()) return

    this.value.set({ latitude: redondear(latitude), longitude: redondear(longitude) })
    this.errorUbicacion.set('')
    this.touch.emit()
  }
}
