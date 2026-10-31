import { afterNextRender, Component, DestroyRef, effect, ElementRef, inject, input, model, output, signal, viewChild } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import * as L from 'leaflet';
import { Coordenadas, sinUbicacion } from '../../models/location.model';
import { obtenerUbicacionActual } from '../geolocation';

// Mientras no se elige una ubicación el mapa se centra en Buenos Aires
const CENTRO_DEFAULT: L.LatLngTuple = [-34.6037, -58.3816]
const ZOOM_DEFAULT = 11
const ZOOM_SELECCION = 16

// El ícono por defecto de Leaflet no encuentra sus imágenes al empaquetarse; se copian a /leaflet desde angular.json
const ICONO = L.icon({
  iconUrl: 'leaflet/marker-icon.png',
  iconRetinaUrl: 'leaflet/marker-icon-2x.png',
  shadowUrl: 'leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
})

// Control de formulario: se usa con [formField] igual que un input.
// Con [readonly]="true" solo muestra la ubicación (por ejemplo, en el detalle de un espacio)
@Component({
  selector: 'app-location-picker',
  styleUrl: './location-picker.css',
  templateUrl: './location-picker.html',
})
export class LocationPicker implements FormValueControl<Coordenadas> {
  value = model<Coordenadas>({ latitude: 0, longitude: 0 })
  disabled = input(false)
  readonly = input(false)
  touch = output<void>()

  contenedor = viewChild.required<ElementRef<HTMLDivElement>>('mapa')
  buscando = signal(false)
  errorUbicacion = signal('')

  private mapa?: L.Map
  private marcador?: L.Marker

  constructor() {
    afterNextRender(() => {
      // Si ya hay una ubicación (por ejemplo, en modo solo lectura) se arranca centrado en ella
      const inicial = this.value()
      const [centro, zoom] = sinUbicacion(inicial)
        ? [CENTRO_DEFAULT, ZOOM_DEFAULT]
        : [L.latLng(inicial.latitude, inicial.longitude), ZOOM_SELECCION]

      // En solo lectura la rueda del mouse no hace zoom, para no "atrapar" el scroll de la página
      this.mapa = L.map(this.contenedor().nativeElement, { scrollWheelZoom: !this.readonly() }).setView(centro, zoom)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(this.mapa)

      this.mapa.on('click', e => {
        if (!this.bloqueado()) this.seleccionar(e.latlng.wrap())
      })
      this.sincronizarMarcador(this.value(), this.bloqueado())
    })

    // Mantiene el marcador al día si el valor cambia desde afuera (por ejemplo, editando latitud/longitud a mano)
    effect(() => this.sincronizarMarcador(this.value(), this.bloqueado()))

    inject(DestroyRef).onDestroy(() => this.mapa?.remove())
  }

  usarUbicacionActual() {
    this.buscando.set(true)
    this.errorUbicacion.set('')

    return obtenerUbicacionActual()
      .then(({ latitude, longitude }) => {
        this.seleccionar(L.latLng(latitude, longitude))
        this.mapa?.setView([latitude, longitude], ZOOM_SELECCION)
      })
      .catch((e: Error) => this.errorUbicacion.set(e.message))
      .finally(() => this.buscando.set(false))
  }

  private bloqueado() {
    return this.disabled() || this.readonly()
  }

  private seleccionar({ lat, lng }: L.LatLng) {
    // 6 decimales alcanzan para una precisión de ~10 cm
    this.value.set({ latitude: redondear(lat), longitude: redondear(lng) })
    this.touch.emit()
  }

  private sincronizarMarcador(coordenadas: Coordenadas, bloqueado: boolean) {
    if (!this.mapa) return

    if (sinUbicacion(coordenadas)) {
      this.marcador?.remove()
      this.marcador = undefined
      return
    }

    const punto = L.latLng(coordenadas.latitude, coordenadas.longitude)

    if (this.marcador) {
      this.marcador.setLatLng(punto)
    } else {
      this.marcador = L.marker(punto, { icon: ICONO, draggable: !bloqueado, keyboard: false }).addTo(this.mapa)
      this.marcador.on('dragend', () => this.seleccionar(this.marcador!.getLatLng().wrap()))
    }

    if (bloqueado) this.marcador.dragging?.disable()
    else this.marcador.dragging?.enable()

    if (!this.mapa.getBounds().contains(punto)) this.mapa.panTo(punto)
  }
}

function redondear(n: number) {
  return Math.round(n * 1e6) / 1e6
}
