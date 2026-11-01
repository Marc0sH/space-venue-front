import { afterNextRender, Component, DestroyRef, effect, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import type * as Leaflet from 'leaflet';
import { Coordinates } from '../../models/location.model';
import { capaOpenStreetMap, cargarLeaflet } from '../leaflet';

// Mapa solo de lectura que marca una ubicación; no se puede mover ni hacer zoom
@Component({
  selector: 'app-location-map',
  styleUrl: './location-map.css',
  template: '<div #mapa class="mapa"></div>',
})
export class LocationMap {
  ubicacion = input.required<Coordinates>()
  zoom = input(15)

  private contenedor = viewChild.required<ElementRef<HTMLElement>>('mapa')
  private mapa = signal<Leaflet.Map | undefined>(undefined)
  private marcador?: Leaflet.Marker
  private observer?: IntersectionObserver
  private destruido = false

  constructor() {
    afterNextRender(() => this.iniciarCuandoSeaVisible())

    inject(DestroyRef).onDestroy(() => {
      this.destruido = true
      this.observer?.disconnect()
      this.mapa()?.remove()
    })

    effect(() => {
      const mapa = this.mapa()
      const { latitude, longitude } = this.ubicacion()
      if (!mapa) return

      mapa.setView([latitude, longitude], this.zoom())
      this.marcador?.setLatLng([latitude, longitude])
    })
  }

  // En un listado puede haber muchas tarjetas: cada mapa se crea recién cuando está por entrar en pantalla
  private iniciarCuandoSeaVisible() {
    if (!('IntersectionObserver' in window)) {
      this.iniciarMapa()
      return
    }

    this.observer = new IntersectionObserver(entradas => {
      if (entradas.some(e => e.isIntersecting)) {
        this.observer?.disconnect()
        this.iniciarMapa()
      }
    }, { rootMargin: '200px' })
    this.observer.observe(this.contenedor().nativeElement)
  }

  private async iniciarMapa() {
    let L: typeof Leaflet
    try {
      L = await cargarLeaflet()
    } catch (e) {
      console.error('No se pudo cargar el mapa', e) // Es solo ilustrativo: queda el fondo vacío
      return
    }
    if (this.destruido) return

    const { latitude, longitude } = this.ubicacion()
    const mapa = L.map(this.contenedor().nativeElement, {
      zoomControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    }).setView([latitude, longitude], this.zoom())

    capaOpenStreetMap(L).addTo(mapa)
    // El resto de los clics llegan al contenedor (ej. la tarjeta), pero no los del enlace a OpenStreetMap
    const atribucion = mapa.attributionControl?.getContainer()
    if (atribucion) L.DomEvent.disableClickPropagation(atribucion)
    this.marcador = L.marker([latitude, longitude], { interactive: false, keyboard: false }).addTo(mapa)
    this.mapa.set(mapa)
  }
}
