import { afterNextRender, Component, DestroyRef, effect, ElementRef, inject, input, model, output, signal, viewChild } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import * as L from 'leaflet';
import { Coordenadas, sinUbicacion } from '../../models/location.model';

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

const ERRORES_GEOLOCALIZACION: Record<number, string> = {
  1: 'No diste permiso para acceder a tu ubicación',
  2: 'No se pudo determinar tu ubicación',
  3: 'Se agotó el tiempo para obtener tu ubicación',
}

// Control de formulario: se usa con [formField] igual que un input
@Component({
  selector: 'app-location-picker',
  styleUrl: './location-picker.css',
  templateUrl: './location-picker.html',
})
export class LocationPicker implements FormValueControl<Coordenadas> {
  value = model<Coordenadas>({ latitude: 0, longitude: 0 })
  disabled = input(false)
  touch = output<void>()

  contenedor = viewChild.required<ElementRef<HTMLDivElement>>('mapa')
  buscando = signal(false)
  errorUbicacion = signal('')

  private mapa?: L.Map
  private marcador?: L.Marker

  constructor() {
    afterNextRender(() => {
      this.mapa = L.map(this.contenedor().nativeElement).setView(CENTRO_DEFAULT, ZOOM_DEFAULT)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(this.mapa)

      this.mapa.on('click', e => {
        if (!this.disabled()) this.seleccionar(e.latlng.wrap())
      })
      this.sincronizarMarcador(this.value(), this.disabled())
    })

    // Mantiene el marcador al día si el valor cambia desde afuera (por ejemplo, editando latitud/longitud a mano)
    effect(() => this.sincronizarMarcador(this.value(), this.disabled()))

    inject(DestroyRef).onDestroy(() => this.mapa?.remove())
  }

  usarUbicacionActual() {
    if (!('geolocation' in navigator)) {
      this.errorUbicacion.set('Tu navegador no permite obtener la ubicación actual')
      return
    }

    this.buscando.set(true)
    this.errorUbicacion.set('')

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.buscando.set(false)
        this.seleccionar(L.latLng(coords.latitude, coords.longitude))
        this.mapa?.setView([coords.latitude, coords.longitude], ZOOM_SELECCION)
      },
      e => {
        this.buscando.set(false)
        this.errorUbicacion.set(ERRORES_GEOLOCALIZACION[e.code] ?? 'No se pudo obtener tu ubicación')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  private seleccionar({ lat, lng }: L.LatLng) {
    // 6 decimales alcanzan para una precisión de ~10 cm
    this.value.set({ latitude: redondear(lat), longitude: redondear(lng) })
    this.touch.emit()
  }

  private sincronizarMarcador(coordenadas: Coordenadas, deshabilitado: boolean) {
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
      this.marcador = L.marker(punto, { icon: ICONO, draggable: true, keyboard: false }).addTo(this.mapa)
      this.marcador.on('dragend', () => this.seleccionar(this.marcador!.getLatLng().wrap()))
    }

    if (deshabilitado) this.marcador.dragging?.disable()
    else this.marcador.dragging?.enable()

    if (!this.mapa.getBounds().contains(punto)) this.mapa.panTo(punto)
  }
}

function redondear(n: number) {
  return Math.round(n * 1e6) / 1e6
}
