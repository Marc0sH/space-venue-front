import { afterNextRender, Component, DestroyRef, effect, ElementRef, inject, input, model, output, signal, viewChild } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import type * as Leaflet from 'leaflet';
import { Coordinates } from '../../models/location.model';
import { buscarLugares, LugarEncontrado } from '../geocoding';
import { geolocalizacionDisponible, obtenerUbicacionActual } from '../geolocation';
import { cargarLeaflet, capaOpenStreetMap } from '../leaflet';

// Vista inicial cuando todavía no hay ubicación: Ciudad de Buenos Aires
const CENTRO_INICIAL: Leaflet.LatLngTuple = [-34.6037, -58.3816]
const ZOOM_INICIAL = 12
const ZOOM_UBICACION = 16
const ZOOM_LUGAR_SIN_LIMITES = 14

// La búsqueda espera a que el usuario deje de escribir para no saturar el geocodificador
const ESPERA_BUSQUEDA_MS = 350
const MINIMO_CARACTERES = 3

// 6 decimales ≈ 10 cm, más que suficiente para ubicar un espacio
let siguienteId = 0

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

  // Ids únicos por si hay más de un picker en la página (los usa el combobox accesible)
  readonly idLista = `location-picker-sugerencias-${siguienteId++}`
  textoBusqueda = signal('')
  sugerencias = signal<LugarEncontrado[]>([])
  sugerenciaActiva = signal(-1)
  listaAbierta = signal(false)
  buscandoLugares = signal(false)
  errorBusqueda = signal('')

  private contenedor = viewChild.required<ElementRef<HTMLElement>>('mapa')
  private L?: typeof Leaflet
  private mapa = signal<Leaflet.Map | undefined>(undefined)
  private marcador?: Leaflet.Marker
  private destruido = false
  private temporizadorBusqueda?: ReturnType<typeof setTimeout>
  private busquedaEnCurso?: AbortController

  constructor() {
    afterNextRender(() => this.iniciarMapa())

    inject(DestroyRef).onDestroy(() => {
      this.destruido = true
      this.cancelarBusqueda()
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

  alEscribir(texto: string) {
    this.textoBusqueda.set(texto)
    this.cancelarBusqueda()
    this.errorBusqueda.set('')

    if (texto.trim().length < MINIMO_CARACTERES) {
      this.sugerencias.set([])
      this.listaAbierta.set(false)
      return
    }
    this.temporizadorBusqueda = setTimeout(() => this.buscar(texto.trim()), ESPERA_BUSQUEDA_MS)
  }

  async buscar(texto: string) {
    this.cancelarBusqueda()
    const controlador = new AbortController()
    this.busquedaEnCurso = controlador
    this.buscandoLugares.set(true)

    const mapa = this.mapa()
    const centro = mapa?.getCenter()
    try {
      const lugares = await buscarLugares(texto, {
        signal: controlador.signal,
        cerca: centro && mapa ? { latitude: centro.lat, longitude: centro.lng, zoom: mapa.getZoom() } : undefined,
      })
      if (controlador.signal.aborted || this.destruido) return
      this.sugerencias.set(lugares)
      this.sugerenciaActiva.set(-1)
      this.listaAbierta.set(true)
    } catch (e) {
      if (controlador.signal.aborted) return
      console.error('Falló la búsqueda de lugares', e)
      this.sugerencias.set([])
      this.listaAbierta.set(false)
      this.errorBusqueda.set('No se pudo buscar el lugar. Probá de nuevo o marcalo directamente en el mapa.')
    } finally {
      if (this.busquedaEnCurso === controlador) {
        this.busquedaEnCurso = undefined
        this.buscandoLugares.set(false)
      }
    }
  }

  alPresionarTecla(evento: KeyboardEvent) {
    const cantidad = this.sugerencias().length
    switch (evento.key) {
      case 'ArrowDown':
        if (!cantidad) return
        evento.preventDefault()
        this.listaAbierta.set(true)
        this.sugerenciaActiva.update(i => (i + 1) % cantidad)
        break
      case 'ArrowUp':
        if (!cantidad) return
        evento.preventDefault()
        this.listaAbierta.set(true)
        this.sugerenciaActiva.update(i => (i <= 0 ? cantidad : i) - 1)
        break
      case 'Enter': {
        // El picker vive dentro de formularios: Enter en el buscador no debe enviarlos
        evento.preventDefault()
        const activa = this.sugerencias()[this.sugerenciaActiva()] ?? (this.listaAbierta() ? this.sugerencias()[0] : undefined)
        if (activa) {
          this.elegirLugar(activa)
        } else if (this.textoBusqueda().trim().length >= MINIMO_CARACTERES) {
          this.buscar(this.textoBusqueda().trim())
        }
        break
      }
      case 'Escape':
        if (this.listaAbierta()) {
          evento.preventDefault()
          this.listaAbierta.set(false)
        }
        break
    }
  }

  elegirLugar(lugar: LugarEncontrado) {
    this.textoBusqueda.set(lugar.detalle ? `${lugar.nombre}, ${lugar.detalle}` : lugar.nombre)
    this.listaAbierta.set(false)
    this.sugerenciaActiva.set(-1)

    const { latitude, longitude } = lugar.coordenadas
    const mapa = this.mapa()
    if (lugar.limites) {
      mapa?.fitBounds(lugar.limites, { maxZoom: ZOOM_UBICACION })
    } else {
      mapa?.setView([latitude, longitude], lugar.exacto ? ZOOM_UBICACION : ZOOM_LUGAR_SIN_LIMITES)
    }

    // Para ciudades, provincias o países solo se acerca el mapa: el usuario marca el punto exacto
    if (lugar.exacto) this.fijar(latitude, longitude)
  }

  cerrarLista() {
    this.listaAbierta.set(false)
  }

  private cancelarBusqueda() {
    clearTimeout(this.temporizadorBusqueda)
    this.busquedaEnCurso?.abort()
    this.busquedaEnCurso = undefined
    this.buscandoLugares.set(false)
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
